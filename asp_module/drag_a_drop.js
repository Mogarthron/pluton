// drag_a_drop.js
import { state } from './state.js';
import { ensureTimelineCovers } from './time_line.js';
import { updateBlock } from './process.js';
import { pxToMinutes, roundToGrid } from './helpers.js';

export const attachTrackDnD = (track) => {
  track.addEventListener('dragover', (e) => e.preventDefault());
  track.addEventListener('drop', (e) => onDrop(e, track));
};

export const attachBlockDnD = (block) => {
  if (block.dataset._dragBound === '1') return;
  block.dataset._dragBound = '1';
  let offsetX = 0;

  block.addEventListener('dragstart', (e) => {
    offsetX = e.offsetX;
    block.classList.add('dragging');
    block._dragOffsetX = offsetX;
  });
  block.addEventListener('dragend', () => {
    block.classList.remove('dragging');
    delete block._dragOffsetX;
  });
};

const onDrop = (e, track) => {
  const draggedBlock = document.querySelector('.process-block.dragging');
  if (!draggedBlock || draggedBlock.parentNode !== track) return;

  const rect = track.getBoundingClientRect();
  let newLeftPx = Math.max(0, Math.round(e.clientX - rect.left - (draggedBlock._dragOffsetX || 0)));
  let newStart = pxToMinutes(newLeftPx);
  newStart = roundToGrid(newStart); // SNAP na siatkę

  const duration = parseInt(draggedBlock.dataset.duration, 10);
  const newEnd = newStart + duration;

  const others = Array.from(track.querySelectorAll('.process-block')).filter(b => b !== draggedBlock);
  let conflicting = null;
  const conflict = others.some(b => {
    const s = parseInt(b.dataset.start, 10);
    const e2 = s + parseInt(b.dataset.duration, 10);
    if (!(newEnd <= s || newStart >= e2)) { conflicting = b; return true; }
    return false;
  });

  if (conflict) {
    const conflictModal = new bootstrap.Modal(document.getElementById('conflictModal'));
    document.getElementById('conflictWith').innerText = (conflicting.dataset.name || '').toString();
    document.getElementById('newStartInput').value = newStart;
    state.conflictData = { block: draggedBlock, track, duration, otherBlocks: others };
    conflictModal.show();
    return;
  }

  ensureTimelineCovers(newEnd);
  updateBlock(draggedBlock, newStart, duration);
};
