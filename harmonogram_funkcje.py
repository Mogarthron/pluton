from datetime import datetime as dt, timedelta
from dataclasses import dataclass, field
from typing import Dict, List, Tuple


stanowiska = {
    "Przygotowanie": ["przygotowanie"],
    "Wycinanie": ["CNC1", "CNC2", "CNC3", "CNC4"],
    "Skladanie": ["stan1", "klatka"],
    "Szlifiernia": ["stan1", "stan2", "stan3"],
    "Malarnia": ["automat", "reczny"],
    "Pakowanie": ["pakowanie"]
}
@dataclass
class obszar:
    nazwa_obszaru:str
    gniazda:list
    obszar_buforowy:bool=True #True oznacza że można tworzyć procesy buforowe w danym obszarze

@dataclass
class gniazda:
    nazwa:str
    operatorzy:int=1
    bazowa_wydajnosc:float=1
    przelicznik_czasu:bool=True #domyślnie true oznacza ze dla danego gniazda czas operacyjny jest równy czasowi netto zmiany * ilość pracowników, False oznacza przypisanie czasu netto zmiany bez względu na ilosć pracowników przypisanych danego dnia.
    pojemnosc_procesow:int=1 #domyślnie 1 proces na raz, ale można 

class marszruta():
    def __init__(self, proc_id:int, id_wejsciowe:list, obszar, nazwa:str, czas_teh, offset:int=0, dozwolone_gniazda=[], proces_koncowy=False, typ_zaleznosci="ES", proces_buforowy=False, czas_harmonogramowy=True, konsolidowanie_proc_w_gniezdzie=False, sumuj_czasy_proc_skonsolidowanych=False) -> None:
        """
            proc_id idywidualny numer procesu (domyślnie proc 2 w określaniu typów zależności)
            id_wejsciowe id procesu poprzedzjącego opisany proces (domyślnie proc 1 w określaniu typów zależności) lub procesów wtedy podana lista int
            typ_zaleznosci sposób ułożenia procesu względem innych procesów w planie domyslnie 'ES'     
            czas_tech przypisany czas technologiczny, może zostać zastosowane równie w formie str       
            konsolidowanie_proc_w_gniezdzie jeśli procesy z rużnych marszrut maję tą samą nazwę i ten sam obszar można połączyć je w jeden dłuższy proces lub ustawić obok siebie, funkcja aktywuje się zaznaczeniu konsolidacji procesów produkcyjnych
            sumuj_czasy_proc_skonsolidowanych jeśli konsolidowanie_proc_w_gniezdzie == True isnieje możliwośc zsumaowni czasów technoloficznych skonsolidownych procesow (czyli powstanie jeden praces o zsumowanym czase tech), jeśli false ustawi procesy obok siebie
        """
        
        self.proc_id = proc_id
        self.nazwa = nazwa
        self.obszar = obszar
        self.dozwolone_gniazda = stanowiska[obszar] if len(dozwolone_gniazda) == 0 else dozwolone_gniazda
        self.czas_tech = czas_teh
        self.offset = offset
        self.typ_zaleznosci = typ_zaleznosci
        ## typy zależnosci: SS, SE, ES, EE
        ##
        ## SS - start proc 1, start proc 2
        ## ##### proc 1
        ## ##    proc 2
        ##
        ## SE start proc1, end proc 2
        ##   #### proc 1
        ## ##     proc 2 
        ##
        ## ES end proc 1, start proc 2
        ## ####     proc 1
        ##     #### proc 2
        ##
        ## EE end proc 1, end proc 2
        ## ##### proc 1
        ##    ## proc 2

        self.id_wejsciowe = id_wejsciowe # lista intów jeśli dany proces zależy od paru innych procesów
        self.proces_poczatkowy = True if proc_id == id_wejsciowe else False
        self.proces_koncowy = proces_koncowy
        self.proces_buforowy = proces_buforowy #proces obywający się w buforze (poczekalni na obszrze)
        self.czas_harmonogramowy = czas_harmonogramowy #jeśli True obliczas czas na podstawie harmonogramu, jeśli False obliczaj czas bez harmonogramu.
        self.konsolidowanie_proc_w_gniezdzie = konsolidowanie_proc_w_gniezdzie
        self.sumuj_czasy_proc_skonsolidowanych = sumuj_czasy_proc_skonsolidowanych

        self.czas_proc = (czas_teh + offset)

class bilans_materialowy:
    def __init__(self, id_marsztury, lista_materialow:dict):
        pass




class zmiana_prod:
    def __init__(self, nazwa: str, start: str, end: str, przerwy=None):
        """
        start, end — w formacie HH:MM
        przerwy — lista krotek (start, koniec), np. [("09:00", "09:15"), ("12:00", "12:30")]
        """
        self.nazwa = nazwa
        self.start = dt.strptime(start, "%H:%M")
        self.end = dt.strptime(end, "%H:%M")

        # jeśli koniec po północy
        if self.end <= self.start:
            self.end += timedelta(days=1)

        self.przerwy = []
        if przerwy:
            for p in przerwy:
                self.dodaj_przerwe(*p)

    def dodaj_przerwe(self, start: str, end: str):
        ps = dt.strptime(start, "%H:%M")
        pe = dt.strptime(end, "%H:%M")
        if pe <= ps:
            pe += timedelta(days=1)
        self.przerwy.append((ps, pe))

    def czas_trwania(self):
        return (self.end - self.start).total_seconds() / 3600

    def czas_przerw(self):
        return sum((pe - ps).total_seconds() for ps, pe in self.przerwy) / 3600

    def czas_pracy_netto(self):
        """Czas pracy netto (bez przerw)"""
        return self.czas_trwania() - self.czas_przerw()

    def __repr__(self):
        przerwy_str = ", ".join([f"{ps.strftime('%H:%M')}-{pe.strftime('%H:%M')}" for ps, pe in self.przerwy])
        return (f"<Zmiana {self.nazwa}: {self.start.strftime('%H:%M')}–{self.end.strftime('%H:%M')}, "
                f"przerwy: [{przerwy_str}], netto: {self.czas_pracy_netto():.2f}h>")



class harmonogram:
    def __init__(self, data:str, zmiana_prod:zmiana_prod, oblorzenie_stanowisk:dict):
        self.data = dt.strptime(data, "%Y-%m-%d")
        self.zamiana_prod = zmiana_prod
        self.oblorzenie_stanowisk = oblorzenie_stanowisk

        self.start_zmiany = ""
        self.end_zmiany = ""

class tech():   
    def __init__(self, nr_tech:str, nazwa, tagi:dict, opis, marszruta_list:list) -> None:
        self.nr_tech = nr_tech
        self.nazwa = nazwa
        self.tagi = tagi
        self.opis = opis
        self.marszruta_list = marszruta_list
        self.czas_calkowity = sum([x.czas_proc for x in marszruta_list])
        self.ile_procesow = len(marszruta_list)
        self.czas_obszarow = dict()
        for k in stanowiska.keys():
            self.czas_obszarow[k] = sum([x.czas_tech for x in marszruta_list if x.obszar == k])

    def __repr__(self):
        return f"<{self.nazwa}: {self.czas_calkowity} minut, {self.ile_procesow} procesów>"
    

class proces_produkcyjny():
    pass