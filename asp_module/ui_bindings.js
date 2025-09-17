// ui_bindings.js
import { state } from './state.js';
import { toISODate, toDateLocal, downloadJSON, parseStartISO } from './helpers.js';
import { setAxisDay, ensureTimelineCovers } from './time_line.js';
import { addMachineRow } from './machines.js';
import { createProcessBlock, updateBlock, deleteBlock } from './process.js';
import { attachTrackDnD } from './drag_a_drop.js';

export const bindUI = () => {
  // oś czasu
  document.getElementById('setAxisBtn').addEventListener('click', () => {
    const dateStr = document.getElementById('axisDate').value;
    const [y,m,d] = dateStr.split('-').map(Number);
    setAxisDay(new Date(y, m-1, d, state.axisStartHour, 0, 0, 0));
    // przeliczenie istniejących bloków
    document.querySelectorAll('.process-block').forEach(b => {
      const [ds, ts] = b.dataset.startIso.split(' ');
      const dt = toDateLocal(ds, ts);
      const startMin = Math.round((dt.getTime() - state.axisBaseStart.getTime())/60000);
      updateBlock(b, startMin, parseInt(b.dataset.duration,10));
      ensureTimelineCovers(startMin + parseInt(b.dataset.duration,10));
    });

    document.getElementById('gridStepSelect').addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      state.gridStepMin = (val === 60) ? 60 : 1;

      // Dostosuj step w polu modala konfliktu (żeby scroll myszą był w siatce)
      const newStartInput = document.getElementById('newStartInput');
      if (newStartInput) newStartInput.step = state.gridStepMin;});
    
  });

  // zapis maszyny z modala
  document.getElementById('saveMachineBtn').addEventListener('click', () => {
    const name = document.getElementById('machineName').value.trim(); if (!name) return;
    const id = 'm' + Date.now();
    const track = addMachineRow(id, name);
    attachTrackDnD(track);
    const opt = document.createElement('option'); opt.value = id; opt.text = name;
    document.getElementById('machineSelect').appendChild(opt);
    bootstrap.Modal.getInstance(document.getElementById('addMachineModal')).hide();
    document.getElementById('machineName').value = '';
  });

  // zapis procesu z modala
  document.getElementById('saveProcessBtn').addEventListener('click', () => {
    const machineId = document.getElementById('machineSelect').value;
    const name = document.getElementById('processName').value.trim();
    const dateStr = document.getElementById('processDate').value;
    const timeStr = document.getElementById('processTime').value;
    const duration = parseInt(document.getElementById('processDuration').value, 10);
    const progress = Math.max(0, Math.min(100, parseInt(document.getElementById('processProgress').value || '0', 10)));
    if (!machineId || !name || !dateStr || !timeStr || isNaN(duration)) return;
    const startDate = toDateLocal(dateStr, timeStr);
    createProcessBlock(machineId, name, startDate, duration, progress);
    bootstrap.Modal.getInstance(document.getElementById('addProcessModal')).hide();
    document.getElementById('processName').value = '';
    document.getElementById('processDate').value = '';
    document.getElementById('processTime').value = '';
    document.getElementById('processDuration').value = '';
    document.getElementById('processProgress').value = '0';
  });

  // eksport
  document.getElementById('exportMachinesBtn').addEventListener('click', () => {
    const machines = Array.from(document.querySelectorAll('.machine-row')).map(row => ({
      id: row.dataset.machine,
      name: row.querySelector('.machine-label')?.textContent?.trim() || ''
    }));
    downloadJSON({ machines }, 'machines.json');
  });

  document.getElementById('exportPlanBtn').addEventListener('click', () => {
    const machines = Array.from(document.querySelectorAll('.machine-row')).map(row => {
      const machineId = row.dataset.machine;
      const processes = Array.from(row.querySelectorAll('.process-block')).map(b => ({
        id: b.dataset.id,
        name: b.dataset.name,
        startISO: b.dataset.startIso,
        duration: parseInt(b.dataset.duration, 10),
        progress: parseInt(b.dataset.progress, 10)
      }));
      return { id: machineId, name: row.querySelector('.machine-label')?.textContent?.trim() || '', processes };
    });
    const plan = { axisDate: document.getElementById('axisDate').value, axisStartHour: state.axisStartHour, machines };
    downloadJSON(plan, 'plan.json');
  });

  // modal edycji procesu
  const prRange = document.getElementById('editProcProgressRange');
  const prNum   = document.getElementById('editProcProgressNum');
  prRange.addEventListener('input', () => prNum.value = prRange.value);
  prNum.addEventListener('input', () => prRange.value = Math.max(0, Math.min(100, prNum.value || 0)));

  document.getElementById('saveProcessChangesBtn').addEventListener('click', ()=>{
    const b = state.currentEditBlock; if (!b) return;
    const val = parseInt(prNum.value, 10);
    b.dataset.progress = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    const start = parseInt(b.dataset.start, 10);
    const duration = parseInt(b.dataset.duration, 10);
    updateBlock(b, start, duration);
    bootstrap.Modal.getInstance(document.getElementById('editProcessModal')).hide();
    state.currentEditBlock = null;
  });

  document.getElementById('deleteProcessBtn').addEventListener('click', ()=>{
    const b = state.currentEditBlock; if (!b) return;
    b.remove();
    bootstrap.Modal.getInstance(document.getElementById('editProcessModal')).hide();
    state.currentEditBlock = null;
  });
  document.getElementById('importPlanInput').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const plan = JSON.parse(text);

      // Walidacja podstawowa
      if (!plan || !Array.isArray(plan.machines)) {
        console.warn('Zły format planu. Oczekiwano { machines: [...] }');
        alert('Nieprawidłowy format pliku JSON (brak machines).');
        e.target.value = '';
        return;
      }

      // Ustal dzień osi:
      // 1) z plan.axisDate, lub
      // 2) z najwcześniejszego procesu, lub
      // 3) dziś (fallback)
      let axisDateToUse = plan.axisDate;
      if (!axisDateToUse) {
        let earliest = null;
        for (const m of plan.machines) {
          for (const p of (m.processes || [])) {
            const dt = parseStartISO(p.startISO);
            if (dt && (!earliest || dt < earliest)) earliest = dt;
          }
        }
        if (earliest) axisDateToUse = toISODate(earliest);
      }
      if (!axisDateToUse) axisDateToUse = toISODate(new Date());

      // Ustaw oś
      document.getElementById('axisDate').value = axisDateToUse;
      const [y, m, d] = axisDateToUse.split('-').map(Number);
      setAxisDay(new Date(y, m - 1, d, state.axisStartHour, 0, 0, 0));

      // Wyczyść UI (maszyny/select) i indeks
      document.getElementById('machine-rows').innerHTML = '';
      document.getElementById('machineSelect').innerHTML = '';
      state.machinesIndex.clear();

      // Odtwórz maszyny + podłącz DnD torów
      for (const m of plan.machines) {
        const id = m.id || ('m' + Date.now() + Math.floor(Math.random() * 1000));
        const name = m.name || 'Maszyna';
        const track = addMachineRow(id, name);
        attachTrackDnD(track);
        // select
        const opt = document.createElement('option'); opt.value = id; opt.text = name;
        document.getElementById('machineSelect').appendChild(opt);
      }

      // Odtwórz procesy
      for (const m of plan.machines) {
        const machineId = m.id;
        for (const p of (m.processes || [])) {
          const dt = parseStartISO(p.startISO);
          if (!dt) {
            console.warn('Pominięto proces bez poprawnego startISO:', p);
            continue;
          }
          const name = p.name || 'Proces';
          const duration = parseInt(p.duration, 10) || 0;
          const progress = Math.max(0, Math.min(100, parseInt(p.progress, 10) || 0));
          createProcessBlock(machineId, name, dt, duration, progress);
        }
      }

      // Dla pewności dobuduj oś do najdłuższego procesu
      let maxEnd = 12 * 60;
      document.querySelectorAll('.process-block').forEach(b => {
        const s = parseInt(b.dataset.start, 10);
        const dur = parseInt(b.dataset.duration, 10);
        maxEnd = Math.max(maxEnd, s + dur);
      });
      ensureTimelineCovers(maxEnd);

      e.target.value = '';
      console.info('Import zakończony sukcesem.');

    } catch (err) {
      console.error('Błąd importu:', err);
      alert('Nie udało się wczytać pliku JSON. Sprawdź format.');
      e.target.value = '';
    }
  });
};
