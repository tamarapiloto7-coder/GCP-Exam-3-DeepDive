// Session-only statistics. No cookies, localStorage, accounts or cloud sync.
window.Progress=(()=>{
  let results=[],dives=0;
  function record(round){results.push(...round)}
  function completeDive(){dives++}
  function read(){let h={};for(const r of results){let v=h[r.id]||(h[r.id]={attempts:0,correct:0,misses:0,skips:0,timeouts:0,hints:0,firstTry:0});v.attempts++;if(r.status==='correct'){v.correct++;if(!r.attempts.length)v.firstTry++}else if(r.status==='timeout')v.timeouts++;else if(r.status==='skipped')v.skips++;else v.misses++;if(r.hintUsed)v.hints++}return h}
  function weakIds(){return Object.entries(read()).filter(([id,x])=>x.misses+x.skips+x.timeouts>0).sort((a,b)=>(b[1].misses+b[1].skips+b[1].timeouts)-(a[1].misses+a[1].skips+a[1].timeouts)).map(([id])=>id)}
  function stats(){let correct=results.filter(r=>r.status==='correct').length,firstTry=results.filter(r=>r.status==='correct'&&!r.attempts.length).length;return {dives,played:results.length,correct,firstTry,depth:results.reduce((a,r)=>a+r.gain,0),results:[...results]}}
  function clear(){results=[];dives=0}
  return {read,record,completeDive,weakIds,stats,clear};
})();
