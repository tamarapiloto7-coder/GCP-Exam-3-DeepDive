(()=>{'use strict';
const $=id=>document.getElementById(id),bank=window.ANATOMY_BANK.questions,V=window.AnswerValidator;
let diverName='Diver';let pool=[],index=0,depth=0,score=0,history=[],locked=false,hintUsed=false,deadline=0,remaining=30,paused=false,interval=null,mode='normal',correctionOpen=false,advanceTimeout=null,attempts=[];
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{let b=[...a];for(let i=b.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
function screens(name){['start','game','finish'].forEach(x=>$(x).classList.toggle('hidden',x!==name))}
function clearAdvance(){if(advanceTimeout!==null){clearTimeout(advanceTimeout);advanceTimeout=null}}
function stopTimer(){if(interval!==null){clearInterval(interval);interval=null}}
function timerUI(){let n=Math.max(0,Math.ceil(remaining));$('timeLabel').textContent=n+'s';$('timeFill').style.width=(remaining/30*100)+'%';$('timeFill').classList.toggle('urgent',n<=10);$('timeLabel').classList.toggle('urgent',n<=10)}
function tick(){if(locked||paused)return;remaining=Math.max(0,(deadline-performance.now())/1000);timerUI();if(remaining<=0)endQuestion('timeout','',null)}
function pause(){if(paused)return;remaining=Math.max(0,(deadline-performance.now())/1000);paused=true;stopTimer();timerUI()}
function resume(){if(!paused)return;paused=false;deadline=performance.now()+remaining*1000;interval=setInterval(tick,70);tick()}
function hud(){let n=pool.length||7;$('depth').textContent=Math.round(depth)+'m';$('score').textContent=score;$('round').textContent=`PROMPT ${Math.min(index+1,n)} OF ${n}`;$('lights').innerHTML=Array.from({length:n},(_,i)=>`<span class="${i<index?'done':i===index?'current':''}"></span>`).join('')}
function choose(){
 const topic=$('topic').value,desired=Number($('length').value);
 const eligible=bank.filter(q=>topic==='all'||q.session===topic);
 if(mode==='weak'){
   const ids=new Set(Progress.weakIds());
   const weak=shuffle(eligible.filter(q=>ids.has(q.id)));
   const relatedSLOs=new Set(weak.map(q=>q.session+'-'+q.slo_number));
   const related=shuffle(eligible.filter(q=>!ids.has(q.id)&&relatedSLOs.has(q.session+'-'+q.slo_number)));
   const others=shuffle(eligible.filter(q=>!ids.has(q.id)&&!relatedSLOs.has(q.session+'-'+q.slo_number)));
   return [...weak,...related,...others].slice(0,desired);
 }
 const freebies=shuffle(eligible.filter(q=>q.difficulty==='Freebie'));
 const regular=shuffle(eligible.filter(q=>q.difficulty!=='Freebie'));
 const result=[],used=new Set(),usedSLOs=new Set();
 function add(q){if(result.length>=desired||used.has(q.id))return;result.push(q);used.add(q.id);usedSLOs.add(q.session+'-'+q.slo_number)}
 freebies.slice(0,Math.min(freebies.length,Math.round(desired*2/7))).forEach(add);
 for(const q of regular){if(!usedSLOs.has(q.session+'-'+q.slo_number))add(q)}
 for(const q of shuffle([...regular,...freebies]))add(q);
 return shuffle(result);
}
function start(weak=false){diverName=($('screenName').value.trim()||'Diver').slice(0,24);$('liveName').textContent=diverName;updateLiveStats();clearAdvance();stopTimer();mode=weak?'weak':'normal';pool=choose();if(!pool.length){alert('No questions available for that selection.');return}index=0;depth=0;score=0;history=[];Ocean.setDepth(0,true);screens('game');show()}
function show(){clearAdvance();attempts=[];locked=false;correctionOpen=false;paused=false;hintUsed=false;remaining=30;deadline=performance.now()+30000;const q=pool[index];$('promptno').textContent=`PROMPT ${index+1} OF ${pool.length}`;$('prompt').textContent=q.prompt;$('hintReveal').classList.add('hidden');$('hintReveal').textContent='';$('hintBtn').disabled=false;$('hintBtn').textContent='✧ HINT';$('answer').value='';$('answer').disabled=false;$('submit').disabled=false;$('skip').classList.add('hidden');$('next').classList.add('hidden');$('feedback').classList.add('hidden');$('correction').classList.add('hidden');$('spellnote').textContent='';hud();timerUI();stopTimer();interval=setInterval(tick,70);$('answer').focus()}
function hint(){if(locked||hintUsed)return;hintUsed=true;$('hintReveal').textContent=pool[index].hint||'Review the related anatomical relationships.';$('hintReveal').classList.remove('hidden');$('hintBtn').disabled=true;$('hintBtn').textContent='HINT USED · MAX 25m'}
function endQuestion(status,raw,answer){if(locked)return;stopTimer();paused=false;correctionOpen=false;locked=true;let q=pool[index],correct=status==='correct';let base=correct?Number(answer.depth_m)||25:0;let gain=correct?Math.min(base,hintUsed?25:Infinity):0;depth+=gain;score+=gain*10;Ocean.setDepth(depth);history.push({id:q.id,q,status,raw,answer:answer?.canonical||'',gain,hintUsed,attempts:[...attempts]});$('answer').disabled=true;$('submit').disabled=true;$('skip').classList.add('hidden');$('correction').classList.add('hidden');$('next').classList.add('hidden');$('feedback').className='feedback '+(correct?'good':'bad');let message=correct?`✓ ${escapeHTML(answer.rarity)} · +${gain}m${hintUsed?' (hint cap)':''}`:status==='timeout'?'TIME UP · 0m':status==='skipped'?'SKIPPED · 0m':'NOT MATCHED · 0m';$('feedback').innerHTML=`<b>${message}</b>${correct?`<div>${escapeHTML(answer.canonical)}</div>`:'<div>All accepted answers are revealed after the dive.</div>'}`;Progress.record([history[history.length-1]]);hud();updateLiveStats();advanceTimeout=setTimeout(()=>{advanceTimeout=null;next()},correct?1500:1700)}
function tryAgain(raw){attempts.push(raw);$('feedback').className='feedback bad';$('feedback').innerHTML='<b>NOT QUITE — TRY AGAIN</b><div>Keep guessing until you find a correct answer or time runs out.</div>';$('answer').value='';$('spellnote').textContent='';$('answer').focus()}
function answerSubmit(e){e?.preventDefault();if(locked||correctionOpen)return;tick();if(locked)return;let raw=$('answer').value.trim();if(!raw)return;let q=pool[index],found=V.exact(q,raw);if(found){endQuestion('correct',raw,found);return}let matches=V.suggestions(q,raw);if(matches.length){pause();correctionOpen=true;$('correction').classList.remove('hidden');$('correction').innerHTML='<b>Did you mean…?</b><div class="correction-options">'+matches.map((m,i)=>`<button type="button" data-correct="${i}">${escapeHTML(m.answer.canonical)}</button>`).join('')+'<button type="button" id="asWritten" class="dismiss">No, use my answer</button></div>';$('correction').querySelectorAll('[data-correct]').forEach(b=>b.onclick=()=>{if(locked)return;let a=matches[+b.dataset.correct].answer;$('correction').classList.add('hidden');endQuestion('correct',raw,a)});$('asWritten').onclick=()=>{correctionOpen=false;$('correction').classList.add('hidden');resume();tryAgain(raw)};return}tryAgain(raw)}
function next(){if(!locked)return;clearAdvance();index++;if(index>=pool.length)finish();else show()}
function skip(){}
function reviewHTML(r,i){const q=r.q;let label=r.status==='correct'?'CORRECT':r.status.toUpperCase();let ans=q.answers.map(a=>`<div class="review-answer"><span>${escapeHTML(a.canonical)}${a.aliases?.length?` <small>(${escapeHTML(a.aliases.join(', '))})</small>`:''}</span><span class="rarity">${escapeHTML(a.rarity)} · ${a.depth_m}m</span></div>`).join('');let expl=`<p><strong>Explanation:</strong> ${escapeHTML(q.explanation)}</p>`;return `<details class="review-item"><summary><span class="review-index">${i+1}.</span><span class="review-question">${escapeHTML(q.prompt)}<small class="${r.status==='correct'?'ok':'miss'}">${label} · ${r.gain}m${r.hintUsed?' · hint used':''}</small></span><span>⌄</span></summary><div class="review-body"><p><strong>Your answer:</strong> ${escapeHTML(r.raw||'(none)')}${r.answer?` → ${escapeHTML(r.answer)}`:''}</p>${r.attempts?.length?`<p><strong>Earlier guesses:</strong> ${escapeHTML(r.attempts.join(' · '))}</p>`:''}<p><strong>Session:</strong> ${escapeHTML(q.session)}</p><p><strong>SLO ${q.slo_number}:</strong> ${escapeHTML(q.slo_text)}</p><p><strong>Difficulty:</strong> ${escapeHTML(q.difficulty)} · ${q.type==='targeted'?'Fixed reward':'Rarity-based'}</p><p><strong>Hint:</strong> ${escapeHTML(q.hint)}</p>${expl}<h4>ALL ACCEPTED ANSWERS</h4>${ans}</div></details>`}
function finish(){clearAdvance();stopTimer();screens('finish');$('finaldepth').textContent=Math.round(depth)+'m';let n=history.filter(r=>r.status==='correct').length;$('finalscore').textContent=`${n}/${history.length} correct · ${score} points · ${history.filter(r=>r.status==='timeout').length} timed out`;Progress.completeDive();updateLiveStats();renderFinishStats();$('reviewList').innerHTML=history.map(reviewHTML).join('');$('review').disabled=Progress.weakIds().length===0;updateProgressSummary()}
function updateLiveStats(){
 const st=Progress.stats();
 $('statDives').textContent=st.dives;
 $('statPlayed').textContent=st.played;
 $('statAccuracy').textContent=st.played?Math.round(100*st.correct/st.played)+'%':'—';
 $('statFirst').textContent=st.played?Math.round(100*st.firstTry/st.played)+'%':'—';
 $('statDepth').textContent=st.depth+'m';
 const groups=['Head I','Head II','The Neck','The Upper Limb'];
 $('statLectures').innerHTML=groups.map(name=>{
  const a=st.results.filter(r=>r.q.session===name),n=a.filter(r=>r.status==='correct').length,pct=a.length?Math.round(n/a.length*100):0;
  return `<div class="lecture-row"><span>${escapeHTML(name)}</span><span>${a.length?pct+'%':'—'}</span></div><div class="lecture-track"><div style="width:${pct}%"></div></div>`;
 }).join('');
}
function renderFinishStats(){
 const st=Progress.stats();
 const sloMap=new Map();
 for(const r of st.results){const key=r.q.session+' · SLO '+r.q.slo_number;const v=sloMap.get(key)||{n:0,correct:0};v.n++;if(r.status==='correct')v.correct++;sloMap.set(key,v)}
 const weak=[...sloMap.entries()].filter(([k,v])=>v.correct<v.n).sort((a,b)=>a[1].correct/a[1].n-b[1].correct/b[1].n).slice(0,4);
 $('finishStats').innerHTML=`<h3>${escapeHTML(diverName)}'s session</h3><div class="finish-stats-grid"><span>${st.dives} dives</span><span>${st.played} prompts</span><span>${st.played?Math.round(st.correct/st.played*100):0}% accuracy</span><span>${st.played?Math.round(st.firstTry/st.played*100):0}% first-try</span><span>${st.depth}m lifetime depth</span></div>${weak.length?`<p class="weak-label">SLOs to revisit: ${weak.map(([k])=>escapeHTML(k)).join(' · ')}</p>`:''}<p class="session-notice">Session only — screenshot this screen if you want to keep your results.</p>`;
}
function updateProgressSummary(){let h=Progress.read();$('progressSummary').textContent=`${bank.length} lecture-linked prompts · ${Object.keys(h).length} practiced this session · progress resets on reload`;$('weakStart').disabled=Progress.weakIds().length===0;updateLiveStats()}
$('play').onclick=()=>start(false);$('weakStart').onclick=()=>start(true);$('review').onclick=()=>start(true);$('again').onclick=()=>start(false);$('mainMenu').onclick=()=>{screens('start');updateProgressSummary()};$('menu').onclick=()=>{clearAdvance();stopTimer();screens('start');updateProgressSummary()};$('answerform').onsubmit=answerSubmit;$('next').onclick=next;$('skip').onclick=skip;$('hintBtn').onclick=hint;$('clearProgress').onclick=()=>{if(confirm('Reset all statistics from this session? This cannot be undone.')){Progress.clear();updateProgressSummary()}};$('expandAll').onclick=()=>document.querySelectorAll('.review-item').forEach(x=>x.open=true);$('collapseAll').onclick=()=>document.querySelectorAll('.review-item').forEach(x=>x.open=false);
$('answer').oninput=()=>{if(locked||correctionOpen)return;let q=pool[index];let s=q?V.suggestions(q,$('answer').value):[];$('spellnote').textContent=s.length?'Possible spelling: '+s[0].answer.canonical:''};
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&correctionOpen){$('asWritten')?.click()}});
screens('start');updateProgressSummary();})();