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







//  // ===== KONFIG =====
//   const pxPerMin = 0.0166;       // 1 px = 1 minuta
//   const axisStartHour = 6;  // oś od 06:00

//   // ===== STAN =====
//   let axisBaseStart = null;     // Date: [wybrany dzień] 06:00
//   let hoursRendered = 0;
//   let machinesIndex = new Map();
//   let conflictData = {};
//   let currentEditBlock = null;  // blok edytowany w modalu

//   // ===== INIT =====
//   document.addEventListener("DOMContentLoaded", () => {
//     const today = new Date();
//     document.getElementById("axisDate").value = toISODate(today);
//     setAxisDayFromInput();
//     bindUI();
//   });

//   // ===== POMOC =====
//   function toISODate(d){ const p=n=>String(n).padStart(2,"0"); return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate()); }
//   function toDateLocal(isoDate, isoTime){ const [y,m,d]=isoDate.split("-").map(Number); const [hh,mm]=isoTime.split(":").map(Number); return new Date(y,m-1,d,hh,mm,0,0); }
//   function minutesFromAxisStart(date){ return Math.round((date.getTime()-axisBaseStart.getTime())/60000); }
//   function dateFromMinutes(min){ return new Date(axisBaseStart.getTime()+min*60000); }
//   function formatHM(minFromAxis){ const d=dateFromMinutes(minFromAxis); return d.toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"}); }
//   function formatHeaderHour(idxHour){
//     const d=new Date(axisBaseStart.getTime()+idxHour*3600000);
//     const lab=d.toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"});
//     if(d.getHours()===0){ const day=d.toLocaleDateString("pl-PL",{weekday:"short",day:"2-digit",month:"2-digit"}); return lab+"\n"+day; }
//     return lab;
//   }
//   function setDateHeader(){
//     const el=document.getElementById("timeline-date");
//     const s=axisBaseStart.toLocaleDateString("pl-PL",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
//     el.innerText=s.charAt(0).toUpperCase()+s.slice(1);
//   }
//   function ensureTimelineCovers(endMin){
//     const header=document.getElementById("time-header");
//     const needHours=Math.ceil(endMin/60);
//     for(let h=hoursRendered; h<=Math.max(needHours,12); h++){
//       const slot=document.createElement("div");
//       slot.className="time-slot";
//       slot.textContent=formatHeaderHour(h);
//       header.appendChild(slot);
//     }
//     hoursRendered=Math.max(hoursRendered, Math.max(needHours,12));
//   }
//   function downloadJSON(obj, filename){
//     const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
//     const url=URL.createObjectURL(blob);
//     const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
//   }

//   // ===== OŚ CZASU =====
//   function setAxisDayFromInput(){
//     const dateStr=document.getElementById("axisDate").value;
//     const [y,m,d]=dateStr.split("-").map(Number);
//     axisBaseStart=new Date(y,m-1,d,axisStartHour,0,0,0);

//     document.getElementById("time-header").innerHTML="";
//     hoursRendered=0; ensureTimelineCovers(12*60); setDateHeader();
//     reflowAllBlocks();
//   }
//   function reflowAllBlocks(){
//     document.querySelectorAll(".process-block").forEach(b=>{
//       const startIso=b.dataset.startIso;
//       const [ds, ts]=startIso.split(" ");
//       const startDate=toDateLocal(ds, ts);
//       const startMin=minutesFromAxisStart(startDate);
//       const duration=parseInt(b.dataset.duration,10);
//       updateBlock(b,startMin,duration);
//       ensureTimelineCovers(startMin+duration);
//     });
//   }

//   // ===== UI BINDINGS =====
//   function bindUI(){
//     document.getElementById("setAxisBtn").addEventListener("click", setAxisDayFromInput);

//     // Zapis maszyny z modala
//     document.getElementById("saveMachineBtn").addEventListener("click", () => {
//       const name=document.getElementById("machineName").value.trim(); if(!name) return;
//       const id="m"+Date.now();
//       addMachineRow(id,name);
//       const opt=document.createElement("option"); opt.value=id; opt.text=name;
//       document.getElementById("machineSelect").appendChild(opt);
//       bootstrap.Modal.getInstance(document.getElementById("addMachineModal")).hide();
//       document.getElementById("machineName").value="";
//     });

//     // Zapis procesu z modala
//     document.getElementById("saveProcessBtn").addEventListener("click", () => {
//       const machineId=document.getElementById("machineSelect").value;
//       const name=document.getElementById("processName").value.trim();
//       const dateStr=document.getElementById("processDate").value;
//       const timeStr=document.getElementById("processTime").value;
//       const duration=parseInt(document.getElementById("processDuration").value,10);
//       const progress=Math.max(0,Math.min(100,parseInt(document.getElementById("processProgress").value||"0",10)));
//       if(!machineId||!name||!dateStr||!timeStr||isNaN(duration)) return;
//       const startDate=toDateLocal(dateStr,timeStr);
//       createProcessBlock(machineId,name,startDate,duration,progress);
//       bootstrap.Modal.getInstance(document.getElementById("addProcessModal")).hide();
//       document.getElementById("processName").value="";
//       document.getElementById("processDate").value="";
//       document.getElementById("processTime").value="";
//       document.getElementById("processDuration").value="";
//       document.getElementById("processProgress").value="0";
//     });

//     // eksport/import
//     document.getElementById("exportMachinesBtn").addEventListener("click",()=>{
//       const machines=Array.from(document.querySelectorAll(".machine-row")).map(row=>({
//         id:row.dataset.machine, name:row.querySelector(".machine-label")?.textContent?.trim()||""
//       }));
//       downloadJSON({machines},"machines.json");
//     });
//     document.getElementById("exportPlanBtn").addEventListener("click",()=>{
//       const machines=Array.from(document.querySelectorAll(".machine-row")).map(row=>{
//         const machineId=row.dataset.machine;
//         const processes=Array.from(row.querySelectorAll(".process-block")).map(b=>({
//           id:b.dataset.id, name:b.dataset.name, startISO:b.dataset.startIso,
//           duration:parseInt(b.dataset.duration,10), progress:parseInt(b.dataset.progress,10)
//         }));
//         return {id:machineId, name:row.querySelector(".machine-label")?.textContent?.trim()||"", processes};
//       });
//       const plan={axisDate:document.getElementById("axisDate").value, axisStartHour, machines};
//       downloadJSON(plan,"plan.json");
//     });
//     document.getElementById("importPlanInput").addEventListener("change", async (e)=>{
//       const file=e.target.files?.[0]; if(!file) return;
//       const text=await file.text(); const plan=JSON.parse(text);
//       document.getElementById("machine-rows").innerHTML=""; document.getElementById("machineSelect").innerHTML=""; machinesIndex.clear();
//       if(plan.axisDate){ document.getElementById("axisDate").value=plan.axisDate; }
//       setAxisDayFromInput();
//       (plan.machines||[]).forEach(m=>{
//         addMachineRow(m.id,m.name);
//         const opt=document.createElement("option"); opt.value=m.id; opt.text=m.name;
//         document.getElementById("machineSelect").appendChild(opt);
//         (m.processes||[]).forEach(p=>{
//           const [ds,ts]=(p.startISO||"").split(" ");
//           createProcessBlock(m.id,p.name,toDateLocal(ds,ts),p.duration,p.progress);
//         });
//       });
//       e.target.value="";
//     });

//     // modal edycji procesu: synchronizacja range <-> number
//     const prRange=document.getElementById("editProcProgressRange");
//     const prNum=document.getElementById("editProcProgressNum");
//     prRange.addEventListener("input", ()=> prNum.value = prRange.value);
//     prNum.addEventListener("input", ()=> prRange.value = Math.max(0, Math.min(100, prNum.value||0)));
//     document.getElementById("saveProcessChangesBtn").addEventListener("click", ()=>{
//       if(!currentEditBlock) return;
//       const val=parseInt(prNum.value,10); const progress=Math.max(0,Math.min(100,isNaN(val)?0:val));
//       currentEditBlock.dataset.progress=progress;
//       // odśwież wygląd
//       const start=parseInt(currentEditBlock.dataset.start,10);
//       const duration=parseInt(currentEditBlock.dataset.duration,10);
//       updateBlock(currentEditBlock,start,duration);
//       bootstrap.Modal.getInstance(document.getElementById("editProcessModal")).hide();
//       currentEditBlock=null;
//     });
//     document.getElementById("deleteProcessBtn").addEventListener("click", ()=>{
//       if(!currentEditBlock) return;
//       currentEditBlock.remove();
//       bootstrap.Modal.getInstance(document.getElementById("editProcessModal")).hide();
//       currentEditBlock=null;
//     });
//   }

//   // ===== MASZYNY =====
//   function addMachineRow(id, name){
//     const row=document.createElement("div"); row.className="machine-row"; row.dataset.machine=id;
//     const label=document.createElement("div"); label.className="machine-label"; label.innerText=name;
//     const track=document.createElement("div"); track.className="process-track"; track.dataset.machine=id;
//     row.appendChild(label); row.appendChild(track);
//     document.getElementById("machine-rows").appendChild(row);
//     machinesIndex.set(id,track);
//     track.addEventListener("dragover", e=>e.preventDefault());
//     track.addEventListener("drop", e=>onDrop(e,track));
//   }

//   // ===== PROCESY =====
//   function createProcessBlock(machineId, name, startDate, duration, progress=0){
//     const track = machinesIndex.get(machineId) || document.querySelector('.process-track[data-machine="'+machineId+'"]');
//     if(!track) return;

//     const startMin = minutesFromAxisStart(startDate);
//     const endMin   = startMin + duration;
//     ensureTimelineCovers(endMin);

//     const block=document.createElement("div");
//     block.className="process-block"; block.draggable=true;

//     const id="p"+Date.now()+Math.floor(Math.random()*1000);
//     block.dataset.id=id; block.dataset.name=name;
//     block.dataset.startIso = toISODate(startDate)+" "+startDate.toTimeString().slice(0,5);
//     block.dataset.start=startMin; block.dataset.duration=duration; block.dataset.progress=Math.max(0,Math.min(100,progress));

//     block.style.left=(startMin*pxPerMin)+"px";
//     block.style.width=(duration*pxPerMin)+"px";

//     block.innerHTML =
//       '<div class="d-flex justify-content-between">'+
//         '<span>'+name+'</span>'+
//         //'<span class="small">'+formatHM(startMin)+'–'+formatHM(endMin)+'</span>'+
//       '</div>'+
//       '<div class="mt-1" style="height:6px;background:#ffffff55;border-radius:4px;overflow:hidden;">'+
//         '<div class="progress-fill" style="width:'+block.dataset.progress+'%;height:100%;"></div>'+
//       '</div>';

//     // Kliknięcie kafelka → modal edycji
//     block.addEventListener("click", (ev)=>{
//       // jeśli przed chwilą był drag, zignoruj "klik" po dragend
//       if(block.classList.contains("dragging")) return;
//       currentEditBlock = block;
//       document.getElementById("editProcName").innerText = block.dataset.name;
//       document.getElementById("editProcTime").innerText = block.dataset.startIso + "  •  " + block.dataset.duration + " min";
//       document.getElementById("editProcProgressRange").value = block.dataset.progress;
//       document.getElementById("editProcProgressNum").value   = block.dataset.progress;
//       new bootstrap.Modal(document.getElementById("editProcessModal")).show();
//     });

//     track.appendChild(block);
//     enableDrag();
//     return block;
//   }

//   // ===== DRAG & DROP =====
//   function enableDrag(){
//     document.querySelectorAll(".process-block").forEach(b=>{
//       if(b.dataset._dragBound==="1") return;
//       b.dataset._dragBound="1";
//       let offsetX=0;
//       b.addEventListener("dragstart", e=>{
//         offsetX=e.offsetX; b.classList.add("dragging"); b._dragOffsetX=offsetX;
//       });
//       b.addEventListener("dragend", ()=>{
//         b.classList.remove("dragging"); delete b._dragOffsetX;
//       });
//     });
//   }

//   function onDrop(e, track){
//     const draggedBlock=document.querySelector(".process-block.dragging");
//     if(!draggedBlock || draggedBlock.parentNode!==track) return;

//     const rect=track.getBoundingClientRect();
//     const duration=parseInt(draggedBlock.dataset.duration,10);
//     let newLeft=Math.max(0, Math.round(e.clientX - rect.left - (draggedBlock._dragOffsetX||0)));
//     const newStart=Math.round(newLeft/pxPerMin);
//     const newEnd=newStart+duration;

//     const otherBlocks=Array.from(track.querySelectorAll(".process-block")).filter(b=>b!==draggedBlock);
//     let conflictingBlock=null;

//     const hasConflict=otherBlocks.some(b=>{
//       const s=parseInt(b.dataset.start,10);
//       const e2=s+parseInt(b.dataset.duration,10);
//       if(!(newEnd<=s || newStart>=e2)){ conflictingBlock=b; return true; }
//       return false;
//     });

//     if(hasConflict){
//       const conflictModal=new bootstrap.Modal(document.getElementById("conflictModal"));
//       document.getElementById("conflictWith").innerText=(conflictingBlock.dataset.name||"").toString();
//       document.getElementById("newStartInput").value=newStart;
//       conflictData={ block:draggedBlock, track, duration, otherBlocks };
//       conflictModal.show();
//       return;
//     }

//     ensureTimelineCovers(newEnd);
//     updateBlock(draggedBlock,newStart,duration);
//   }

//   // ===== AKTUALIZACJA BLOKU =====
//   function updateBlock(block, startMin, duration){
//     const endMin=startMin+duration;
//     block.style.left=(startMin*pxPerMin)+"px";
//     block.style.width=(duration*pxPerMin)+"px";

//     const name=block.dataset.name||"";
//     const progress=parseInt(block.dataset.progress||"0",10);

//     block.innerHTML =
//       '<div class="d-flex justify-content-between">'+
//         '<span>'+name+'</span>'+
//         //'<span class="small">'+formatHM(startMin)+'–'+formatHM(endMin)+'</span>'+
//       '</div>'+
//       '<div class="mt-1" style="height:6px;background:#ffffff55;border-radius:4px;overflow:hidden;">'+
//         '<div class="progress-fill" style="width:'+progress+'%;height:100%;"></div>'+
//       '</div>';

//     block.dataset.start=String(startMin);
//     const d=dateFromMinutes(startMin);
//     block.dataset.startIso = toISODate(d)+" "+d.toTimeString().slice(0,5);
//   }

//   // ===== MODAL KONFLIKTU =====
//   document.getElementById("applyChangeBtn").addEventListener("click",()=>{
//     const inputVal=parseInt(document.getElementById("newStartInput").value,10);
//     if(isNaN(inputVal)) return;
//     const start=inputVal; const end=start+conflictData.duration;
//     const conflict=conflictData.otherBlocks.some(b=>{
//       const s=parseInt(b.dataset.start,10), e=s+parseInt(b.dataset.duration,10);
//       return !(end<=s || start>=e);
//     });
//     if(!conflict){
//       ensureTimelineCovers(end);
//       updateBlock(conflictData.block,start,conflictData.duration);
//       bootstrap.Modal.getInstance(document.getElementById("conflictModal")).hide();
//     }else{
//       alert("Nadal konflikt — wybierz inny czas.");
//     }
//   });
//   document.getElementById("autoSuggestBtn").addEventListener("click",()=>{
//     let t=0, step=1, {duration,otherBlocks}=conflictData;
//     while(true){
//       const conflict=otherBlocks.some(b=>{
//         const s=parseInt(b.dataset.start,10), e=s+parseInt(b.dataset.duration,10);
//         return !(t+duration<=s || t>=e);
//       });
//       if(!conflict) break; t+=step;
//     }
//     document.getElementById("newStartInput").value=t;
//   });