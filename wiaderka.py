from dataclasses import dataclass, field
from typing import Dict, List, Tuple
import pandas as pd
import numpy as np
import plotly.graph_objects as go

PROCESS_ORDER = ["Przygotowanie", "Wycinanie", "Skladanie", "Szlifowanie", "Lakierowanie", "Pakowanie"]
czas_pracy_zmiana1 = 8.25*60
czas_pracy_zmiana2 = 7.25*60
czas_pracy_sobota = 5.5*60



@dataclass
class Bucket:
    date: pd.Timestamp
    shift: str
    machine: str
    capacity: int
    remaining: int
    allocations: List[Dict] = field(default_factory=list)

# ------------------------------------------------------------
# 2) Załadowanie Harmonogramu
# ------------------------------------------------------------
_har = pd.read_excel("harmonogram.xlsx", sheet_name="Harmonogram", usecols="A,D,E,F,G,H,I,J")
_har["data"] = pd.to_datetime(_har["data"], errors="coerce")

klucze_horamonogramu = ["data", "zmiana"]

# Kolumny do sumowania = wszystkie poza kluczami grupy
kolumny_obszarow = [c for c in _har.columns if c not in klucze_horamonogramu]

# Konwersja TYLKO dla kolumn z zadaniami
for c in kolumny_obszarow:
    _har[c] = pd.to_numeric(_har[c], errors="coerce").fillna(0)

# Agregacja wyłącznie po kolumnach z zadaniami
agg = (
    _har.groupby(klucze_horamonogramu, dropna=False)[kolumny_obszarow]
      .sum()
      .reset_index().dropna()
)

# Budowa słownika
harmonogram = {}
for _, r in agg.iterrows():
    # print(r["data"])
    dzien = pd.to_datetime(r["data"]).date().strftime("%Y-%m-%d")
    zmiana = str(r["zmiana"]) if pd.notna(r["zmiana"]) else "brak_zmiany"
    ops = {c: int(r[c]) for c in kolumny_obszarow}
    harmonogram.setdefault(dzien, {})[zmiana] = ops

shift_minutes = {
    "zmiana1": czas_pracy_zmiana1,
    "zmiana2": czas_pracy_zmiana2,
    "sobota":  czas_pracy_sobota,
}

rows = []
for date, shifts in harmonogram.items():
    for shift_name, roles in shifts.items():
        minuty_na_osobe = shift_minutes[shift_name]
        for maszyna, liczba_osob in roles.items():
            rows.append({
                "data": pd.to_datetime(date),
                "zmiana": shift_name,
                "maszyna": maszyna,
                # "Liczba_osób": liczba_osob,
                "czas_pracy": liczba_osob * minuty_na_osobe,
                "godziny_lacznie": (liczba_osob * minuty_na_osobe) / 60.0,
            })

harmonogram_df = (pd.DataFrame(rows)
             .sort_values(["data", "zmiana", "maszyna"])
             .reset_index(drop=True))




def build_buckets_from_harmonogram(harmonogram: Dict, shift_minutes: Dict[str, int]) -> List[Bucket]:
    """Buduje wiaderka z dict harmonogramu."""
    order = {"zmiana1": 0, "zmiana2": 1, "sobota": 2}
    buckets: List[Bucket] = []
    for date_str, shifts in harmonogram.items():
        date = pd.to_datetime(date_str)
        for shift_name in sorted(shifts, key=lambda s: order.get(s, 99)):
            minutes_per_person = shift_minutes[shift_name]
            for machine, headcount in shifts[shift_name].items():
                cap = int(headcount * minutes_per_person)
                buckets.append(Bucket(date, shift_name, machine, cap, cap))
    buckets.sort(key=lambda b: (b.date, order.get(b.shift, 99)))
    return buckets

# ------------------------------------------------------------
# 3) Konwersja Zamowienia -> „job” do szeregowania
# ------------------------------------------------------------

def zamowienia_to_jobs(zamowienia: List) -> List[Dict]:
    """
    Przyjmuje listę obiektów Zamowienia.
    Zwraca listę jobów:
      { "job_id": nr_wew, "due_date": data_wys, "route": [(maszyna, minuty), ...] }
    Route jest w kolejności technologicznej, a kroki z czasem=0 są pomijane.
    """
    jobs = []
    for z in zamowienia:
        # Pobierz mapę obciążenia (działy -> minuty) bez meta:
        mapping = z.obiciazenie_dzialow(procesy=1)
        route = []
        for dept in PROCESS_ORDER:
            minutes = float(mapping.get(dept, 0) or 0)
            if minutes > 0:
                machine = dept
                route.append((machine, int(minutes)))

        jobs.append({
            "job_id": str(z.nr_wew),
            "due_date": pd.to_datetime(z.data_wys),
            "route": route,
        })
    return jobs

# ------------------------------------------------------------
# 4) backward scheduler 
# ------------------------------------------------------------

def schedule_backward(jobs: List[Dict], buckets: List[Bucket]) -> Tuple[List[Bucket], List[Dict]]:
    """
    Układa kroki wstecz od due_date. Dzieli krok, jeśli nie mieści się w wiaderku.
    """
    # indeks: maszyna -> lista indeksów bucketów (rosnąco po dacie/zmianie)
    by_machine: Dict[str, List[int]] = {}
    for i, b in enumerate(buckets):
        by_machine.setdefault(b.machine, []).append(i)

    unscheduled: List[Dict] = []
    min_date = min(b.date for b in buckets) if buckets else None

    for job in jobs:
        job_id = job["job_id"]
        due = pd.to_datetime(job["due_date"])

        # Ostatni krok montowany jako pierwszy (wstecz)
        for machine, duration in reversed(job["route"]):
            remaining = int(duration)

            # Jeśli data wysyłki jest przed startem harmonogramu
            if min_date and due < min_date:
                unscheduled.append({
                    "job_id": job_id,
                    "maszyna": machine,
                    "brakuje_minut": remaining,
                    "powod": f"data wysyłki ({due.strftime("%Y-%m-%d")}) przed planowanym okresem"
                })
                continue

            indices = [i for i in by_machine.get(machine, []) if buckets[i].date <= due]

            if not indices:
                unscheduled.append({
                    "job_id": job_id,
                    "maszyna": machine,
                    "brakuje_minut": remaining,
                    "powod": f"brak dostępnych wiaderek do terminu {due}" #Czyli nie mamy gdzie planować, bo kalendarz nie przewiduje takiego zasobu w tym czasie.
                })
                continue

            # od najpóźniejszego do najwcześniejszego
            for i in reversed(indices):
                if remaining <= 0:
                    break
                b = buckets[i]
                if b.remaining <= 0:
                    continue
                use = min(b.remaining, remaining)
                b.allocations.append({"job_id": job_id, "minutes": use})
                b.remaining -= use
                remaining -= use

            if remaining > 0:
                unscheduled.append({
                    "job_id": job_id,
                    "maszyna": machine,
                    "brakuje_minut": remaining,
                    "powod": "brak pojemności do terminu" #Czyli mamy zasób w kalendarzu, ale za mało miejsca.
                })

    return buckets, unscheduled



def schedule_backward_V2(jobs: List[Dict], buckets: List[Bucket], *, pack_day_before_due: bool = True  # włącz/wyłącz regułę „Pakowanie dzień przed”
) -> Tuple[List[Bucket], List[Dict]]:
    """
    Układa kroki wstecz od due_date. Dzieli krok, jeśli nie mieści się w wiaderku.
    Dodatki:
      - jeśli pack_day_before_due=True, krok 'Pakowanie' ma najpóźniej due_date-1 dzień,
      - wymusza precedencję: krok poprzedni nie może zaczynać się po najwcześniejszym
        wiaderku użytym przez krok następny (porównanie po (data, zmiana)).
    """
    # Kolejność zmian w dobie (do porównań „≤”)
    shift_rank = {"zmiana1": 0, "zmiana2": 1, "sobota": 2}

    # indeks: maszyna -> lista indeksów bucketów (rosnąco po (data, zmiana))
    by_machine: Dict[str, List[int]] = {}
    for i, b in enumerate(buckets):
        by_machine.setdefault(b.machine, []).append(i)

    # pomocnicze klucze do porównań
    def key_of_bucket_idx(i: int):
        b = buckets[i]
        return (b.date.normalize(), shift_rank.get(b.shift, 99))

    def key_of_date_shift(date: pd.Timestamp, shift: str):
        return (pd.to_datetime(date).normalize(), shift_rank.get(shift, 99))

    # „najpóźniej” = maksymalny dopuszczalny klucz (data, zmiana)
    # jeśli ograniczamy tylko datą, bierzemy „ostatnią zmianę” tego dnia
    LAST_SHIFT_RANK = max(shift_rank.values())
    def latest_key_for_date(date: pd.Timestamp):
        return (pd.to_datetime(date).normalize(), LAST_SHIFT_RANK)

    unscheduled: List[Dict] = []
    min_date = min(b.date for b in buckets) if buckets else None

    for job in jobs:
        job_id = job["job_id"]
        due = pd.to_datetime(job["due_date"])

        # „Kotwica” precedencji: dla bieżącego kroku maksymalny dopuszczalny klucz (data, zmiana)
        # Start: due_date (ostatnia zmiana tego dnia)
        latest_anchor_key = latest_key_for_date(due)

        # Idziemy od końca technologii
        for machine, duration in reversed(job["route"]):
            remaining = int(duration)

            # 1) Jeśli due < początek harmonogramu -> specjalny powód
            if min_date and due < min_date:
                unscheduled.append({
                    "job_id": job_id,
                    "maszyna": machine,
                    "brakuje_minut": remaining,
                    "powod": f"data wysyłki ({due.strftime('%Y-%m-%d')}) przed planowanym okresem"
                })
                continue

            # 2) Ustal maksymalny dopuszczalny „klucz czasu” dla TEGO kroku
            #    (pakowanie dzień wcześniej + precedencja po „kotwicy”)
            if pack_day_before_due and machine == "Pakowanie":
                latest_for_step_key = min(
                    latest_anchor_key,
                    latest_key_for_date(due - pd.Timedelta(days=1))
                )
            else:
                latest_for_step_key = latest_anchor_key

            # 3) Wybierz dostępne wiaderka dla maszyny „≤” latest_for_step_key
            cand_indices = []
            for i in by_machine.get(machine, []):
                k = key_of_bucket_idx(i)
                if k <= latest_for_step_key:
                    cand_indices.append(i)

            if not cand_indices:
                unscheduled.append({
                    "job_id": job_id,
                    "maszyna": machine,
                    "brakuje_minut": remaining,
                    "powod": f"brak dostępnych wiaderek do terminu {due.date()}"
                })
                # brak alokacji -> kotwica precedencji NIE zmienia się (bo nie ma gdzie „zaczepić” wcześniejszych)
                continue

            # 4) Backward fill (od najpóźniejszego wiaderka)
            this_step_alloc_keys = []  # zbierz „klucze” wiaderek użytych przez ten krok (do precedencji)
            for i in reversed(cand_indices):
                if remaining <= 0:
                    break
                b = buckets[i]
                if b.remaining <= 0:
                    continue
                use = min(b.remaining, remaining)
                b.allocations.append({"job_id": job_id, "minutes": use})
                b.remaining -= use
                remaining -= use
                this_step_alloc_keys.append(key_of_bucket_idx(i))

            if remaining > 0:
                # Wiaderka były, ale brak pojemności
                unscheduled.append({
                    "job_id": job_id,
                    "maszyna": machine,
                    "brakuje_minut": remaining,
                    "powod": "brak pojemności do terminu"
                })

            # 5) Zaktualizuj „kotwicę” precedencji:
            #    Poprzedni krok może trafić co najwyżej do najwcześniejszego wiaderka,
            #    którego użyliśmy dla „tego” kroku (bo idziemy wstecz).
            if this_step_alloc_keys:
                earliest_key_for_this_step = min(this_step_alloc_keys)
                latest_anchor_key = min(latest_anchor_key, earliest_key_for_this_step)
            # jeśli nic nie przydzielono, kotwica bez zmian (nie zawężamy sztucznie)
    return buckets, unscheduled

# ------------------------------------------------------------
# 5) Raporty
# ------------------------------------------------------------

def build_reports(buckets_after: List[Bucket], unscheduled: List[Dict]) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    # Stan wiaderek
    rows_b = []
    for b in buckets_after:
        used = sum(a["minutes"] for a in b.allocations) if b.allocations else 0
        rows_b.append({
            "data": b.date.date(),
            "zmiana": b.shift,
            "maszyna": b.machine,
            "pojemnosc_min": b.capacity,
            "wykorzystanie_min": used,
            "pozostalo_min": b.remaining,
            "przydzialy": "; ".join(f'{a["job_id"]}:{a["minutes"]}m' for a in b.allocations) if b.allocations else ""
        })
    df_buckets = pd.DataFrame(rows_b).sort_values(["data","zmiana","maszyna"]).reset_index(drop=True)

    # Alokacje granularnie
    rows_a = []
    for b in buckets_after:
        for a in b.allocations:
            rows_a.append({
                "data": b.date.date(),
                "zmiana": b.shift,
                "maszyna": b.machine,
                "zlecenie": a["job_id"],
                "minuty": a["minutes"]
            })
    df_alloc = pd.DataFrame(rows_a).sort_values(["data","zmiana","maszyna","zlecenie"]).reset_index(drop=True)
    df_alloc["data"] = pd.to_datetime(df_alloc["data"], errors="coerce")

    # Niezaplanowane
    df_unscheduled = (pd.DataFrame(unscheduled)
                      if unscheduled else pd.DataFrame(columns=["job_id","maszyna","brakuje_minut","powod"]))
    return df_buckets, df_alloc, df_unscheduled


def wykres_obciarzenia_praca(df):
    """
    df -> df_bucets
    """

    # maska: gdzie wartości są równe
    equal_mask = df["pojemnosc_min"] == df["wykorzystanie_min"]

    # kolory dla trace'ów
    color_poj = np.where(equal_mask, "green", "blue")   # Pojemność
    color_wyk = np.where(equal_mask, "green", "orange")    # Wykorzystanie

    customdata = np.stack(
        [df["pojemnosc_min"], df["wykorzystanie_min"], df["zmiana"], df["przydzialy"]],
        axis=-1
    )

    trace_poj = go.Scatter(
        x=df["data"],
        y=df["maszyna"],
        mode="markers",
        name="Pojemność",
        marker=dict(
            size=df["pojemnosc_min"],
            color=color_poj,
            sizemode="area",
            sizeref=2.*max(df["pojemnosc_min"].max(), 1)/(24**2),
            sizemin=6,
            line=dict(width=1, color="black"),
            symbol="circle"
        ),
        customdata=customdata,
        hovertemplate=(
            "Data: %{x|%Y-%m-%d}<br>"
            "Maszyna: %{y}<br>"
            "Pojemność [min]: %{customdata[0]}<br>"
            "Wykorzystanie [min]: %{customdata[1]}<br>"
        )
    )

    trace_wyk = go.Scatter(
        x=df["data"],
        y=df["maszyna"],
        mode="markers",
        name="Wykorzystanie",
        marker=dict(
            size=df["wykorzystanie_min"],
            color=color_wyk,
            sizemode="area",
            sizeref=2.*max(df["wykorzystanie_min"].max(), 1)/(24**2),
            sizemin=6,
            line=dict(width=1, color="black"),
            symbol="circle"
        ),
        customdata=customdata,
        hovertemplate=(
            "Data: %{x|%Y-%m-%d}<br>"
            "Maszyna: %{y}<br>"
            "Pojemność [min]: %{customdata[0]}<br>"
            "Wykorzystanie [min]: %{customdata[1]}<br>"
            "Zmiana: %{customdata[2]}<br>"
            "Przydziały: %{customdata[3]}<br>"
            "Typ: %{fullData.name}<extra></extra>"
        )
    )

    fig = go.Figure(data=[trace_poj, trace_wyk])
    fig.update_layout(
        title="Obciążenie pracą",
        xaxis_title="Data",
        yaxis_title="Maszyna",
        yaxis=dict(categoryorder="array", categoryarray=PROCESS_ORDER[::-1])  # ustawia kolejność osi Y
    )
    fig.update_xaxes(tickangle=45)
    fig.show()