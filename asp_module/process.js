   function createProcessBlock(machineId, name, startDate, duration, progress=0){
    const track = machinesIndex.get(machineId) || document.querySelector('.process-track[data-machine="'+machineId+'"]');
    if(!track) return;

    const startMin = minutesFromAxisStart(startDate);
    const endMin   = startMin + duration;
    ensureTimelineCovers(endMin);

    const block=document.createElement("div");
    block.className="process-block"; block.draggable=true;

    const id="p"+Date.now()+Math.floor(Math.random()*1000);
    block.dataset.id=id; block.dataset.name=name;
    block.dataset.startIso = toISODate(startDate)+" "+startDate.toTimeString().slice(0,5);
    block.dataset.start=startMin; block.dataset.duration=duration; block.dataset.progress=Math.max(0,Math.min(100,progress));

    block.style.left=(startMin*pxPerMin)+"px";
    block.style.width=(duration*pxPerMin)+"px";

    block.innerHTML =
      '<div class="d-flex justify-content-between">'+
        '<span>'+name+'</span>'+
        //'<span class="small">'+formatHM(startMin)+'–'+formatHM(endMin)+'</span>'+
      '</div>'+
      '<div class="mt-1" style="height:6px;background:#ffffff55;border-radius:4px;overflow:hidden;">'+
        '<div class="progress-fill" style="width:'+block.dataset.progress+'%;height:100%;"></div>'+
      '</div>';

    // Kliknięcie kafelka → modal edycji
    block.addEventListener("click", (ev)=>{
      // jeśli przed chwilą był drag, zignoruj "klik" po dragend
      if(block.classList.contains("dragging")) return;
      currentEditBlock = block;
      document.getElementById("editProcName").innerText = block.dataset.name;
      document.getElementById("editProcTime").innerText = block.dataset.startIso + "  •  " + block.dataset.duration + " min";
      document.getElementById("editProcProgressRange").value = block.dataset.progress;
      document.getElementById("editProcProgressNum").value   = block.dataset.progress;
      new bootstrap.Modal(document.getElementById("editProcessModal")).show();
    });

    track.appendChild(block);
    enableDrag();
    return block;
  }