  // ===== UI BINDINGS =====
  function bindUI(){
    document.getElementById("setAxisBtn").addEventListener("click", setAxisDayFromInput);

    // Zapis maszyny z modala
    document.getElementById("saveMachineBtn").addEventListener("click", () => {
      const name=document.getElementById("machineName").value.trim(); if(!name) return;
      const id="m"+Date.now();
      addMachineRow(id,name);
      const opt=document.createElement("option"); opt.value=id; opt.text=name;
      document.getElementById("machineSelect").appendChild(opt);
      bootstrap.Modal.getInstance(document.getElementById("addMachineModal")).hide();
      document.getElementById("machineName").value="";
    });

    // Zapis procesu z modala
    document.getElementById("saveProcessBtn").addEventListener("click", () => {
      const machineId=document.getElementById("machineSelect").value;
      const name=document.getElementById("processName").value.trim();
      const dateStr=document.getElementById("processDate").value;
      const timeStr=document.getElementById("processTime").value;
      const duration=parseInt(document.getElementById("processDuration").value,10);
      const progress=Math.max(0,Math.min(100,parseInt(document.getElementById("processProgress").value||"0",10)));
      if(!machineId||!name||!dateStr||!timeStr||isNaN(duration)) return;
      const startDate=toDateLocal(dateStr,timeStr);
      createProcessBlock(machineId,name,startDate,duration,progress);
      bootstrap.Modal.getInstance(document.getElementById("addProcessModal")).hide();
      document.getElementById("processName").value="";
      document.getElementById("processDate").value="";
      document.getElementById("processTime").value="";
      document.getElementById("processDuration").value="";
      document.getElementById("processProgress").value="0";
    });

    // eksport/import
    document.getElementById("exportMachinesBtn").addEventListener("click",()=>{
      const machines=Array.from(document.querySelectorAll(".machine-row")).map(row=>({
        id:row.dataset.machine, name:row.querySelector(".machine-label")?.textContent?.trim()||""
      }));
      downloadJSON({machines},"machines.json");
    });
    document.getElementById("exportPlanBtn").addEventListener("click",()=>{
      const machines=Array.from(document.querySelectorAll(".machine-row")).map(row=>{
        const machineId=row.dataset.machine;
        const processes=Array.from(row.querySelectorAll(".process-block")).map(b=>({
          id:b.dataset.id, name:b.dataset.name, startISO:b.dataset.startIso,
          duration:parseInt(b.dataset.duration,10), progress:parseInt(b.dataset.progress,10)
        }));
        return {id:machineId, name:row.querySelector(".machine-label")?.textContent?.trim()||"", processes};
      });
      const plan={axisDate:document.getElementById("axisDate").value, axisStartHour, machines};
      downloadJSON(plan,"plan.json");
    });
    document.getElementById("importPlanInput").addEventListener("change", async (e)=>{
      const file=e.target.files?.[0]; if(!file) return;
      const text=await file.text(); const plan=JSON.parse(text);
      document.getElementById("machine-rows").innerHTML=""; document.getElementById("machineSelect").innerHTML=""; machinesIndex.clear();
      if(plan.axisDate){ document.getElementById("axisDate").value=plan.axisDate; }
      setAxisDayFromInput();
      (plan.machines||[]).forEach(m=>{
        addMachineRow(m.id,m.name);
        const opt=document.createElement("option"); opt.value=m.id; opt.text=m.name;
        document.getElementById("machineSelect").appendChild(opt);
        (m.processes||[]).forEach(p=>{
          const [ds,ts]=(p.startISO||"").split(" ");
          createProcessBlock(m.id,p.name,toDateLocal(ds,ts),p.duration,p.progress);
        });
      });
      e.target.value="";
    });

    // modal edycji procesu: synchronizacja range <-> number
    const prRange=document.getElementById("editProcProgressRange");
    const prNum=document.getElementById("editProcProgressNum");
    prRange.addEventListener("input", ()=> prNum.value = prRange.value);
    prNum.addEventListener("input", ()=> prRange.value = Math.max(0, Math.min(100, prNum.value||0)));
    document.getElementById("saveProcessChangesBtn").addEventListener("click", ()=>{
      if(!currentEditBlock) return;
      const val=parseInt(prNum.value,10); const progress=Math.max(0,Math.min(100,isNaN(val)?0:val));
      currentEditBlock.dataset.progress=progress;
      // odśwież wygląd
      const start=parseInt(currentEditBlock.dataset.start,10);
      const duration=parseInt(currentEditBlock.dataset.duration,10);
      updateBlock(currentEditBlock,start,duration);
      bootstrap.Modal.getInstance(document.getElementById("editProcessModal")).hide();
      currentEditBlock=null;
    });
    document.getElementById("deleteProcessBtn").addEventListener("click", ()=>{
      if(!currentEditBlock) return;
      currentEditBlock.remove();
      bootstrap.Modal.getInstance(document.getElementById("editProcessModal")).hide();
      currentEditBlock=null;
    });
  }