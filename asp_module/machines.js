  function addMachineRow(id, name){
    const row=document.createElement("div"); row.className="machine-row"; row.dataset.machine=id;
    const label=document.createElement("div"); label.className="machine-label"; label.innerText=name;
    const track=document.createElement("div"); track.className="process-track"; track.dataset.machine=id;
    row.appendChild(label); row.appendChild(track);
    document.getElementById("machine-rows").appendChild(row);
    machinesIndex.set(id,track);
    track.addEventListener("dragover", e=>e.preventDefault());
    track.addEventListener("drop", e=>onDrop(e,track));
  }