
  function setAxisDayFromInput(){
    const dateStr=document.getElementById("axisDate").value;
    const [y,m,d]=dateStr.split("-").map(Number);
    axisBaseStart=new Date(y,m-1,d,axisStartHour,0,0,0);

    document.getElementById("time-header").innerHTML="";
    hoursRendered=0; ensureTimelineCovers(12*60); setDateHeader();
    reflowAllBlocks();
  }
  function reflowAllBlocks(){
    document.querySelectorAll(".process-block").forEach(b=>{
      const startIso=b.dataset.startIso;
      const [ds, ts]=startIso.split(" ");
      const startDate=toDateLocal(ds, ts);
      const startMin=minutesFromAxisStart(startDate);
      const duration=parseInt(b.dataset.duration,10);
      updateBlock(b,startMin,duration);
      ensureTimelineCovers(startMin+duration);
    });
  }