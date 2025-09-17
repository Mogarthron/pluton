// // process.js
// import { state } from './state.js';
// import { minutesFromAxisStart, formatHM, toISODate } from './helpers.js';
// import { ensureTimelineCovers } from './time_line.js';
// import { attachBlockDnD } from './drag_a_drop.js';

// export const createProcessBlock = (machineId, name, startDate, duration, progress=0) => {
//   const track = state.machinesIndex.get(machineId) || document.querySelector('.process-track[data-machine="'+machineId+'"]');
//   if (!track) return;

//   const startMin = minutesFromAxisStart(startDate);
//   const endMin = startMin + duration;

//   ensureTimelineCovers(endMin);

//   const block = document.createElement('div');
//   block.className = 'process-block'; block.draggable = true;

//   const id = 'p' + Date.now() + Math.floor(Math.random()*1000);
//   block.dataset.id = id;
//   block.dataset.name = name;
//   block.dataset.start = startMin;
//   block.dataset.duration = duration;
//   block.dataset.progress = Math.max(0, Math.min(100, progress));
//   block.dataset.startIso = `${toISODate(startDate)} ${startDate.toTimeString().slice(0,5)}`;

//   block.style.left  = (startMin * state.pxPerMin) + 'px';
//   block.style.width = (duration * state.pxPerMin) + 'px';

//   block.innerHTML =
//     '<div class="d-flex justify-content-between">' +
//       '<span>'+name+'</span>' +
//       //'<span class="small">'+formatHM(startMin)+'–'+formatHM(endMin)+'</span>' +
//     '</div>' +
//     '<div class="mt-1" style="height:6px;background:#ffffff55;border-radius:4px;overflow:hidden;">' +
//       '<div class="progress-fill" style="width:'+block.dataset.progress+'%;height:100%;"></div>' +
//     '</div>';

//   track.appendChild(block);
//   attachBlockDnD(block);     // podpina drag dla nowego bloku
//   attachBlockClick(block);   // edycja w modalu
//   return block;
// };

// export const updateBlock = (block, startMin, duration) => {
//   const endMin = startMin + duration;
//   block.style.left  = (startMin * state.pxPerMin) + 'px';
//   block.style.width = (duration * state.pxPerMin) + 'px';

//   const name = block.dataset.name || '';
//   const progress = parseInt(block.dataset.progress || '0', 10);
//   block.innerHTML =
//     '<div class="d-flex justify-content-between">' +
//       '<span>'+name+'</span>' +
//       //'<span class="small">'+formatHM(startMin)+'–'+formatHM(endMin)+'</span>' +
//     '</div>' +
//     '<div class="mt-1" style="height:6px;background:#ffffff55;border-radius:4px;overflow:hidden;">' +
//       '<div class="progress-fill" style="width:'+progress+'%;height:100%;"></div>' +
//     '</div>';

//   block.dataset.start = String(startMin);
//   const d = new Date(state.axisBaseStart.getTime() + startMin * 60000);
//   block.dataset.startIso = `${toISODate(d)} ${d.toTimeString().slice(0,5)}`;
// };
// process.js
import { state } from './state.js';
import { minutesFromAxisStart, formatHM, toISODate, roundToGrid, minutesToPx, dateFromMinutes } from './helpers.js';
import { ensureTimelineCovers } from './time_line.js';
import { attachBlockDnD } from './drag_a_drop.js';

export const createProcessBlock = (machineId, name, startDate, duration, progress=0) => {
  const track = state.machinesIndex.get(machineId) || document.querySelector('.process-track[data-machine="'+machineId+'"]');
  if (!track) return;

  let startMin = minutesFromAxisStart(startDate);
  startMin = roundToGrid(startMin); // SNAP przy dodaniu
  const endMin = startMin + duration;

  ensureTimelineCovers(endMin);

  const block = document.createElement('div');
  block.className = 'process-block'; block.draggable = true;

  const id = 'p' + Date.now() + Math.floor(Math.random()*1000);
  block.dataset.id = id;
  block.dataset.name = name;
  block.dataset.start = startMin;
  block.dataset.duration = duration;
  block.dataset.progress = Math.max(0, Math.min(100, progress));

  const d = dateFromMinutes(startMin);
  block.dataset.startIso = `${toISODate(d)} ${d.toTimeString().slice(0,5)}`;

  block.style.left  = minutesToPx(startMin) + 'px';
  block.style.width = minutesToPx(duration) + 'px';

  block.innerHTML =
    '<div class="d-flex justify-content-between">' +
      '<span>'+name+'</span>' +
      '<span class="small">'+formatHM(startMin)+'–'+formatHM(endMin)+'</span>' +
    '</div>' +
    '<div class="mt-1" style="height:6px;background:#ffffff55;border-radius:4px;overflow:hidden;">' +
      '<div class="progress-fill" style="width:'+block.dataset.progress+'%;height:100%;"></div>' +
    '</div>';

  track.appendChild(block);
  attachBlockDnD(block);
  attachBlockClick(block);
  return block;
};

export const updateBlock = (block, startMin, duration) => {
  startMin = roundToGrid(startMin); // SNAP przy zmianie
  const endMin = startMin + duration;

  block.style.left  = minutesToPx(startMin) + 'px';
  block.style.width = minutesToPx(duration) + 'px';

  const name = block.dataset.name || '';
  const progress = parseInt(block.dataset.progress || '0', 10);
  block.innerHTML =
    '<div class="d-flex justify-content-between">' +
      '<span>'+name+'</span>' +
      '<span class="small">'+formatHM(startMin)+'–'+formatHM(endMin)+'</span>' +
    '</div>' +
    '<div class="mt-1" style="height:6px;background:#ffffff55;border-radius:4px;overflow:hidden;">' +
      '<div class="progress-fill" style="width:'+progress+'%;height:100%;"></div>' +
    '</div>';

  block.dataset.start = String(startMin);
  const d = dateFromMinutes(startMin);
  block.dataset.startIso = `${toISODate(d)} ${d.toTimeString().slice(0,5)}`;
};
export const attachBlockClick = (block) => {
  block.addEventListener('click', () => {
    if (block.classList.contains('dragging')) return;
    state.currentEditBlock = block;
    document.getElementById('editProcName').innerText = block.dataset.name;
    document.getElementById('editProcTime').innerText = block.dataset.startIso + ' • ' + block.dataset.duration + ' min';
    document.getElementById('editProcProgressRange').value = block.dataset.progress;
    document.getElementById('editProcProgressNum').value   = block.dataset.progress;
    new bootstrap.Modal(document.getElementById('editProcessModal')).show();
  });
};

export const deleteBlock = (block) => block.remove();
