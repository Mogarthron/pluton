
  function toISODate(d){ const p=n=>String(n).padStart(2,"0"); return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate()); }
  function toDateLocal(isoDate, isoTime){ const [y,m,d]=isoDate.split("-").map(Number); const [hh,mm]=isoTime.split(":").map(Number); return new Date(y,m-1,d,hh,mm,0,0); }
  function minutesFromAxisStart(date){ return Math.round((date.getTime()-axisBaseStart.getTime())/60000); }
  function dateFromMinutes(min){ return new Date(axisBaseStart.getTime()+min*60000); }
  function formatHM(minFromAxis){ const d=dateFromMinutes(minFromAxis); return d.toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"}); }
  function formatHeaderHour(idxHour){
    const d=new Date(axisBaseStart.getTime()+idxHour*3600000);
    const lab=d.toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"});
    if(d.getHours()===0){ const day=d.toLocaleDateString("pl-PL",{weekday:"short",day:"2-digit",month:"2-digit"}); return lab+"\n"+day; }
    return lab;
  }
  function setDateHeader(){
    const el=document.getElementById("timeline-date");
    const s=axisBaseStart.toLocaleDateString("pl-PL",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    el.innerText=s.charAt(0).toUpperCase()+s.slice(1);
  }
  function ensureTimelineCovers(endMin){
    const header=document.getElementById("time-header");
    const needHours=Math.ceil(endMin/60);
    for(let h=hoursRendered; h<=Math.max(needHours,12); h++){
      const slot=document.createElement("div");
      slot.className="time-slot";
      slot.textContent=formatHeaderHour(h);
      header.appendChild(slot);
    }
    hoursRendered=Math.max(hoursRendered, Math.max(needHours,12));
  }
  function downloadJSON(obj, filename){
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }