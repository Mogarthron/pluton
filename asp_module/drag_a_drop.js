  // ===== DRAG & DROP =====
  function enableDrag(){
    document.querySelectorAll(".process-block").forEach(b=>{
      if(b.dataset._dragBound==="1") return;
      b.dataset._dragBound="1";
      let offsetX=0;
      b.addEventListener("dragstart", e=>{
        offsetX=e.offsetX; b.classList.add("dragging"); b._dragOffsetX=offsetX;
      });
      b.addEventListener("dragend", ()=>{
        b.classList.remove("dragging"); delete b._dragOffsetX;
      });
    });
  }

  function onDrop(e, track){
    const draggedBlock=document.querySelector(".process-block.dragging");
    if(!draggedBlock || draggedBlock.parentNode!==track) return;

    const rect=track.getBoundingClientRect();
    const duration=parseInt(draggedBlock.dataset.duration,10);
    let newLeft=Math.max(0, Math.round(e.clientX - rect.left - (draggedBlock._dragOffsetX||0)));
    const newStart=Math.round(newLeft/pxPerMin);
    const newEnd=newStart+duration;

    const otherBlocks=Array.from(track.querySelectorAll(".process-block")).filter(b=>b!==draggedBlock);
    let conflictingBlock=null;

    const hasConflict=otherBlocks.some(b=>{
      const s=parseInt(b.dataset.start,10);
      const e2=s+parseInt(b.dataset.duration,10);
      if(!(newEnd<=s || newStart>=e2)){ conflictingBlock=b; return true; }
      return false;
    });

    if(hasConflict){
      const conflictModal=new bootstrap.Modal(document.getElementById("conflictModal"));
      document.getElementById("conflictWith").innerText=(conflictingBlock.dataset.name||"").toString();
      document.getElementById("newStartInput").value=newStart;
      conflictData={ block:draggedBlock, track, duration, otherBlocks };
      conflictModal.show();
      return;
    }

    ensureTimelineCovers(newEnd);
    updateBlock(draggedBlock,newStart,duration);
  }