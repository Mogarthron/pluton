//nowy kod

import { state } from './state.js';
import { toISODate } from './helpers.js';
import { setAxisDay, ensureTimelineCovers } from './time_line.js';
import { bindUI } from './ui_bindings.js';
import { attachTrackDnD } from './drag_a_drop.js';

// start
document.addEventListener('DOMContentLoaded', () => {
  // ustaw dzień osi na dziś 06:00
  const today = new Date();
  const axisInput = document.getElementById('axisDate');
  if (axisInput) axisInput.value = toISODate(today);

  setAxisDay(new Date(today.getFullYear(), today.getMonth(), today.getDate(), state.axisStartHour, 0, 0, 0));
  ensureTimelineCovers(12 * 60);

  // jeśli maszyny tworzone dynamicznie, nie ma co podłączać na starcie
  // gdyby były już w HTML, można by przejść po torach i zrobić attachTrackDnD

  bindUI();
});
