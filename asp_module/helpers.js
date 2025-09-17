// helpers.js
import { state } from './state.js';

export const toISODate = (d) => {
  const p = (n) => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
};
export const toDateLocal = (isoDate, isoTime) => {
  const [y,m,d] = isoDate.split('-').map(Number);
  const [hh,mm] = isoTime.split(':').map(Number);
  return new Date(y, m-1, d, hh, mm, 0, 0);
};
export const parseStartISO = (startISO) => {
  if (!startISO) return null;
  const s = String(startISO).trim().replace('T',' ');
  const [datePart, timePartRaw] = s.split(' ');
  if (!datePart || !timePartRaw) return null;
  const timePart = timePartRaw.slice(0,5);
  return toDateLocal(datePart, timePart);
};

export const minutesFromAxisStart = (date) =>
  Math.round((date.getTime() - state.axisBaseStart.getTime())/60000);

export const dateFromMinutes = (min) =>
  new Date(state.axisBaseStart.getTime() + min*60000);

export const formatHM = (minFromAxis) =>
  dateFromMinutes(minFromAxis).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});

export const downloadJSON = (obj, filename) => {
  const blob = new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
};

// === NOWE: konwersje px <-> min + snap ===
export const minutesToPx = (minutes) => minutes * state.pxPerMin;
export const pxToMinutes = (px) => Math.round(px / state.pxPerMin);

export const roundToGrid = (minutes) => {
  const step = Math.max(1, state.gridStepMin);
  return Math.round(minutes / step) * step;
};