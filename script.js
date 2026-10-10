const mainContent=document.getElementById('main'),waterQuality=document.getElementById('quality'),protection=document.getElementById('protect'),liveMonitoring=document.getElementById('monitoring'),waterDetective=document.getElementById('detective');
mainContent.insertBefore(liveMonitoring,protection);
mainContent.insertBefore(waterQuality,waterDetective);

const detectiveQuestions=[
 {q:'A stream becomes cloudy just after heavy rain. What is the strongest clue?',a:['The moon changed','Sediment washed in','Fish are hiding','The stream got deeper'],correct:1,e:'Rainwater can carry soil and sediment from roads, lawns, construction areas, and stream banks into waterways.'},
 {q:'A dissolved oxygen reading drops sharply. What should a water detective do next?',a:['Ignore it','Paint the sensor','Check it again','Add salt'],correct:2,e:'A surprising reading should be checked again and compared with conditions such as temperature, water movement, and recent weather.'},
 {q:'Conductivity rises after runoff enters a stream. What may have changed?',a:['Dissolved ions','Cloud shapes','Daylight hours','Fish colors'],correct:0,e:'Conductivity responds to dissolved ions in water, so a change can be a clue that different dissolved materials entered the stream.'},
 {q:'Why can unusually warm stream water concern scientists?',a:['It stops clouds','It makes rocks float','It removes all minerals','It can affect oxygen and aquatic life'],correct:3,e:'Temperature affects aquatic organisms and also influences how much dissolved oxygen water can hold.'},
 {q:'A pH result is very different from yesterday. What is the best first step?',a:['Announce a conclusion','Retest the water','Delete yesterday’s result','Move the stream'],correct:1,e:'Retesting helps determine whether the change is repeatable before anyone tries to explain its cause.'},
 {q:'Why collect measurements over many days?',a:['To make longer charts','Because one day tells everything','To notice patterns and changes','So the sensor gets exercise'],correct:2,e:'Repeated measurements can reveal changes connected with rain, seasons, runoff, or other environmental conditions.'}
];
const knowledgeQuestions=window.TacoCatQuestionBank||[];

function randomIndex(maxExclusive){if(globalThis.crypto?.getRandomValues){const values=new Uint32Array(1),range=0x100000000,unbiasedLimit=range-(range%maxExclusive);do globalThis.crypto.getRandomValues(values);while(values[0]>=unbiasedLimit);return values[0]%maxExclusive}return Math.floor(Math.random()*maxExclusive)}
function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=randomIndex(i+1);[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
function prepareQuestions(items,limit=items.length){return shuffle(items).slice(0,limit).map(item=>{const choices=shuffle(item.a.map((text,index)=>({text,isCorrect:index===item.correct})));return{...item,a:choices.map(choice=>choice.text),correct:choices.findIndex(choice=>choice.isCorrect)}})}

const achievementKey='tacocat-achievements-v1';
function loadAchievements(){try{return JSON.parse(localStorage.getItem(achievementKey))||{}}catch{return{}}}
const achievements=loadAchievements();
function saveAchievement(type,score,total){const previous=achievements[type],bestScore=Math.max(previous?.score||0,score);achievements[type]={completed:true,perfect:Boolean(previous?.perfect||score===total),score:bestScore,total,date:new Date().toISOString()};try{localStorage.setItem(achievementKey,JSON.stringify(achievements))}catch{}updateAchievements()}
function updateAchievements(){
  document.querySelectorAll('[data-achievement]').forEach(card=>{
    const achievement=achievements[card.dataset.achievement];
    const unlocked=Boolean(achievement?.completed);
    card.classList.toggle('unlocked',unlocked);
    card.classList.toggle('locked',!unlocked);
    const status=card.querySelector('.achievement-status');
    if(status)status.textContent=unlocked?`Unlocked · Score ${achievement.score}/${achievement.total}`:(card.dataset.achievement==='knowledge'?'Locked · Finish the quiz':'Locked · Finish every case');
  });
  const certificateButton=document.getElementById('open-certificate');
  const certificateStatus=document.getElementById('certificate-status');
  const certificateReady=Boolean(achievements.detective?.perfect||(
    achievements.detective?.completed&&achievements.detective.score===achievements.detective.total
  ));
  if(certificateButton){certificateButton.disabled=!certificateReady;certificateButton.classList.toggle('unlocked',certificateReady);certificateButton.textContent=certificateReady?'Create certificate':'Locked'}
  if(certificateStatus)certificateStatus.textContent=certificateReady?'Your Water Detective certificate is unlocked and ready to personalize.':achievements.detective?.completed?'You completed every case. Earn a 6/6 score to unlock the certificate.':'Earn a 6/6 Water Detective score to unlock your personalized certificate.';
}

function createQuiz(rootId,sourceQuestions,type){
  const questionCount=type==='knowledge'?10:sourceQuestions.length;
  let questions=prepareQuestions(sourceQuestions,questionCount),index=0,score=0,answered=false,completionRecorded=false;
  const root=document.getElementById(rootId);
  function focusCurrent(){requestAnimationFrame(()=>root.querySelector('.question,.result h3')?.focus())}
  function render(){
    if(!root)return;
    if(!questions.length){root.innerHTML='<div class="result"><h3 tabindex="-1">Questions are unavailable</h3><p>Please refresh the page and try again.</p></div>';focusCurrent();return}
    if(index>=questions.length){
      if(!completionRecorded){saveAchievement(type,score,questions.length);completionRecorded=true}
      root.innerHTML=`<div class="result"><div class="result-score">${score}/${questions.length}</div><h3 tabindex="-1">${type==='detective'?'Great Swamp Water Detective!':'Wetland knowledge unlocked!'}</h3><p>${score===questions.length?'Excellent work—you followed every clue.':'Challenge complete! Review the clues and try again to improve your score.'}</p>${type==='detective'?'<a class="button primary" href="#achievements">View certificate ↓</a>':''}<button class="button primary restart">Try again ↻</button></div>`;
      root.querySelector('.restart').onclick=()=>{questions=prepareQuestions(sourceQuestions,questionCount);index=0;score=0;answered=false;completionRecorded=false;update();render();focusCurrent()};
      focusCurrent();
      update();return;
    }
    const item=questions[index];
    root.innerHTML=`<span class="question-tag">${type==='detective'?'CASE FILE':'WETLAND QUIZ'} · ${String(index+1).padStart(2,'0')}</span><div class="question" tabindex="-1">${item.q}</div><div class="answers">${item.a.map((a,i)=>`<button class="answer" data-i="${i}"><b>${String.fromCharCode(65+i)}.</b> ${a}</button>`).join('')}</div><div class="feedback" role="status" tabindex="-1"></div><button class="button primary next-button">${index===questions.length-1?'See my score':'Next question'} →</button>`;
    root.querySelectorAll('.answer').forEach(btn=>btn.onclick=()=>choose(btn,item));
    root.querySelector('.next-button').onclick=()=>{index++;answered=false;update();render();focusCurrent()};
    update();
  }
  function choose(btn,item){if(answered)return;answered=true;const chosen=+btn.dataset.i;if(chosen===item.correct){score++;btn.classList.add('correct')}else{btn.classList.add('wrong');root.querySelector(`[data-i="${item.correct}"]`).classList.add('correct')}root.querySelectorAll('.answer').forEach(b=>b.disabled=true);const feedback=root.querySelector('.feedback');feedback.innerHTML=`<strong>${chosen===item.correct?'Correct!':'Good try.'}</strong> ${item.e}`;feedback.classList.add('show');root.querySelector('.next-button').classList.add('show');feedback.focus();update()}
  function update(){if(type==='detective'){document.getElementById('detective-number').textContent=Math.min(index+1,questions.length);document.getElementById('detective-total').textContent=`of ${questions.length}`}else{document.getElementById('quiz-label').textContent=index>=questions.length?'Quiz complete':`Question ${index+1} of ${questions.length}`;document.getElementById('quiz-score-label').textContent=`Score ${score}`;document.getElementById('quiz-bar').style.width=`${Math.min((index+1)/questions.length*100,100)}%`}}
  render();
}

createQuiz('detective-game',detectiveQuestions,'detective');createQuiz('knowledge-game',knowledgeQuestions,'knowledge');
updateAchievements();
document.querySelectorAll('.learn-more').forEach((btn,index)=>{const card=btn.closest('.quality-card'),detail=card?.querySelector('.learn-detail');if(detail){detail.id=detail.id||`quality-detail-${index+1}`;detail.setAttribute('aria-hidden','true');btn.setAttribute('aria-controls',detail.id)}btn.addEventListener('click',()=>{const open=card.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));detail?.setAttribute('aria-hidden',String(!open))})});
const sensorModal=document.getElementById('sensor-monitor-modal'),monitorDialog=sensorModal?.querySelector('.monitor-dialog'),monitorClose=sensorModal?.querySelector('.monitor-close');let monitorTrigger=null;
function openMonitor(sensor){if(!sensorModal)return;monitorTrigger=document.activeElement;const frame=sensorModal.querySelector('.monitor-frame');if(frame)frame.src=`water-quality-monitor.html?v=7#${sensor}`;sensorModal.hidden=false;document.body.classList.add('modal-open');monitorClose.focus()}
function closeMonitor(){if(!sensorModal||sensorModal.hidden)return;sensorModal.hidden=true;document.body.classList.remove('modal-open');monitorTrigger?.focus()}
document.querySelectorAll('[data-monitor-open]').forEach(card=>card.addEventListener('click',()=>openMonitor(card.dataset.monitorOpen)));
monitorClose?.addEventListener('click',closeMonitor);
sensorModal?.addEventListener('click',event=>{if(event.target===sensorModal)closeMonitor()});
document.addEventListener('keydown',event=>{if(sensorModal?.hidden!==false)return;if(event.key==='Escape'){closeMonitor();return}if(event.key==='Tab'){const focusable=[...monitorDialog.querySelectorAll('button,iframe,[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}});
window.addEventListener('message',event=>{if(event.origin===window.location.origin&&event.data?.type==='close-water-quality-monitor')closeMonitor()});
const menu=document.querySelector('.menu-toggle'),links=document.querySelector('.nav-links'),menuLabel=menu?.querySelector('.sr-only');
function setMenu(open){links?.classList.toggle('open',open);menu?.setAttribute('aria-expanded',String(open));if(menuLabel)menuLabel.textContent=open?'Close menu':'Open menu'}
menu?.addEventListener('click',()=>setMenu(!links.classList.contains('open')));
links?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('click',event=>{if(links?.classList.contains('open')&&!event.target.closest('.nav'))setMenu(false)});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&links?.classList.contains('open')){setMenu(false);menu?.focus()}});
document.getElementById('report-form').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const button=form.querySelector('button[type="submit"]');const success=form.querySelector('.form-success');const error=form.querySelector('.form-error');const now=new Date();const date=`${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}/${now.getFullYear()}`;const observation=document.getElementById('report-observation').value;const location=document.getElementById('report-location').value.trim();const userMessage=document.getElementById('report-message').value.trim();const message=`User Report,\n\nObservation: ${observation}\n\nLocation: ${location}\n\nDate: ${date}\n\nMessage: ${userMessage}`;success.classList.remove('show');error.classList.remove('show');button.disabled=true;button.textContent='Sending…';try{const response=await fetch(form.action,{method:'POST',headers:{Accept:'application/json'},body:new URLSearchParams({_subject:'User Report',message})});if(!response.ok)throw new Error('Submission failed');form.reset();success.classList.add('show')}catch(err){error.classList.add('show')}finally{button.disabled=false;button.innerHTML='Send report <span>→</span>'}});
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

const certificateDialog=document.getElementById('certificate-dialog');
const certificateName=document.getElementById('certificate-name');
const certificateRecipient=document.getElementById('certificate-recipient');
const certificatePrint=document.getElementById('print-certificate');
const certificateDate=document.getElementById('certificate-date');
const openCertificate=document.getElementById('open-certificate');
if(certificateDate)certificateDate.textContent=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date());
function syncCertificateName(){const name=certificateName?.value.trim()||'';if(certificateRecipient)certificateRecipient.textContent=name||'Your Name';if(certificatePrint)certificatePrint.disabled=!name}
openCertificate?.addEventListener('click',()=>{if(!openCertificate.disabled){syncCertificateName();certificateDialog?.showModal()}});
certificateDialog?.querySelector('.certificate-close')?.addEventListener('click',()=>certificateDialog.close());
certificateDialog?.addEventListener('click',event=>{if(event.target===certificateDialog)certificateDialog.close()});
certificateName?.addEventListener('input',syncCertificateName);
certificatePrint?.addEventListener('click',()=>window.print());

const pwaInstall=document.getElementById('pwa-install');
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;pwaInstall.hidden=false});
pwaInstall?.addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();const choice=await deferredInstallPrompt.userChoice;if(choice.outcome==='accepted')pwaInstall.hidden=true;deferredInstallPrompt=null});
window.addEventListener('appinstalled',()=>{pwaInstall.hidden=true;deferredInstallPrompt=null});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('Offline support could not start.',error)));
