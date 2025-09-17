// time_line.js
import { state } from './state.js';
import { formatHM } from './helpers.js';

const formatHeaderHour = (idxHour) => {
  const d = new Date(state.axisBaseStart.getTime() + idxHour * 3600000);
  const label = d.toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'});
  if (d.getHours() === 0) {
    const day = d.toLocaleDateString('pl-PL', {weekday:'short', day:'2-digit', month:'2-digit'});
    return `${label}\n${day}`;
  }
  return label;
};

export const ensureTimelineCovers = (endMin) => {
  const header = document.getElementById('time-header');
  const needHours = Math.ceil(endMin / 60);
  for (let h = state.hoursRendered; h <= Math.max(needHours, 12); h++) {
    const slot = document.createElement('div');
    slot.className = 'time-slot';
    slot.textContent = formatHeaderHour(h);
    header.appendChild(slot);
  }
  state.hoursRendered = Math.max(state.hoursRendered, Math.max(needHours, 12));
};

export const setAxisDay = (date) => {
  // date = Date (dzień z inputa)
  state.axisBaseStart = new Date(date);
  state.axisBaseStart.setHours(state.axisStartHour, 0, 0, 0);

  document.getElementById('time-header').innerHTML = '';
  state.hoursRendered = 0;
  ensureTimelineCovers(12 * 60);

  const head = document.getElementById('timeline-date');
  const s = state.axisBaseStart.toLocaleDateString('pl-PL', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  head.innerText = s.charAt(0).toUpperCase() + s.slice(1);
};
