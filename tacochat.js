const tacoChatPanel=document.getElementById('tacochat-panel');
const tacoChatLauncher=document.getElementById('tacochat-launcher');
const tacoChatClose=tacoChatPanel?.querySelector('.tacochat-close');
const tacoChatForm=document.getElementById('tacochat-form');
const tacoChatInput=document.getElementById('tacochat-input');
const tacoChatMessages=document.getElementById('tacochat-messages');
const tacoChatEmpty=document.getElementById('tacochat-empty');
const tacoChatSubmit=tacoChatForm?.querySelector('button[type="submit"]');
const tacoChatMic=document.getElementById('tacochat-mic');
const tacoChatSpeakToggle=document.getElementById('tacochat-speak-toggle');
const tacoChatSuggestions=tacoChatPanel?.querySelectorAll('.tacochat-suggestions button[data-question]');
const tacoChatEndpoint='https://tacocat.lynnluo829.workers.dev/';
const tacoChatTeamDescription='Team Tacocat is FIRST LEGO League robotics team #34043. We use research, engineering, coding, robotics, and teamwork to solve real-world problems. For the 2026–27 BIOGLOW season, our Innovation Project is a proposed school rain garden. We are exploring how a shallow planted area could slow runoff, help water soak into the ground, and support local biodiversity. The team has drafted model comparisons and is still working through site choice, testing, plants, and a full garden plan. Meow!';
const tacoChatTeamQuestion=/\b(?:team\s+taco\s*cat|team\s+tacocat|your\s+team|about\s+(?:the\s+)?team|who\s+(?:is|are)\s+(?:team\s+)?taco\s*cat)\b/i;
const tacoChatProjectQuestion=/\b(?:rain\s*garden|runoff|stormwater|garden\s+model|model\s+setup|biodiversity|native\s+plants?|project\s+plan|your\s+project|bioglow)\b/i;
const tacoChatPiDescription='TacoChat is the website assistant, not a Raspberry Pi. A Raspberry Pi appeared in an earlier water-monitoring concept; the current BIOGLOW project focuses on a proposed rain garden. Meow!';
const tacoChatPiQuestion=/\braspberry\s*pi\b|\b(?:which|what)\s+pi\b|\bpi\s+model\b/i;
const tacoChatIdentityDescription='I am TacoChat, the official chatbot for the Tacocat Team, how can I help';
const tacoChatGreeting=/^(?:hello|hi|hey)(?:\s+(?:there|tacochat))?$/i;
const tacoChatIdentityQuestion=/\b(?:(?:who|what)\s+(?:are|r)\s+(?:you|u)|who\s+(?:you|u)\s+(?:are|r))\b/i;
const tacoChatShortAnswers={
  do:'DO stands for dissolved oxygen, the oxygen available in water for fish, insects, and other aquatic organisms to breathe. It can change with temperature, water movement, plant activity, and decomposition. Meow!',
  ph:'pH describes how acidic or basic water is. It is one possible measurement when comparing water samples, but the rain-garden model has no published results yet. Meow!',
  tds:'TDS stands for total dissolved solids, an estimate of the dissolved substances in water. It is often estimated using conductivity. Meow!'
};

const tacoChatAnswers=[
  {terms:['rain garden','raingarden'],answer:'A rain garden is a shallow planted area that receives runoff. Water slows down and can soak into suitable soil, while plants may support local wildlife. Team Tacocat is planning one for our school. Meow!'},
  {terms:['runoff','stormwater'],answer:'Runoff is rain or melting snow moving across a surface. It can carry soil, litter, fertilizer, or salt downhill. A rain garden could intercept some runoff and give it time to soak into suitable soil. Meow!'},
  {terms:['model','experiment','test'],answer:'Our draft comparison has three setups: an empty control, grass and soil, and a layered rain-garden model with plants, soil, sand, and gravel. The notebook does not yet provide confirmed final results. Meow!'},
  {terms:['plant','biodiversity','wildlife'],answer:'A well-planned rain garden can include native plants suited to the site. Those plants may offer food and shelter to local insects and other wildlife. The team still needs to choose plants for a specific school location. Meow!'},
  {terms:['project','bioglow'],answer:tacoChatTeamDescription},
  {terms:['ph'],answer:'pH describes how acidic or basic water is. It may help compare water samples in a model test. Meow!'},
  {terms:['conductivity','tds'],answer:'Conductivity responds to dissolved ions in water. TDS estimates the amount of dissolved material, often using conductivity as a clue. Meow!'},
  {terms:['dissolved oxygen','oxygen'],answer:'Dissolved oxygen is the oxygen available in water for fish, insects, and other aquatic organisms. Meow!'},
  {terms:['temperature'],answer:'Water temperature affects aquatic organisms and can influence dissolved oxygen and other water conditions. Meow!'},
  {terms:['wetland','great swamp','swamp'],answer:'Wetlands provide habitat and help manage water. Our current project is a proposed rain garden at school, inspired by earlier water research. Meow!'},
  {terms:['tacocat','team','fll','innovation project'],answer:tacoChatTeamDescription}
];

const TacoChatSpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
const tacoChatCanSpeak='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
const tacoChatCanPlayAudio='Audio' in window;
let tacoChatRecognition=null;
let tacoChatListening=false;
let tacoChatSubmitTranscript=false;
let tacoChatReadAloud=false;
let tacoChatVoices=[];
let tacoChatAudio=null;
let tacoChatAudioUrl='';
let tacoChatSpeechRequest=null;
let tacoChatSpeechGeneration=0;

function refreshTacoChatVoices(){
  tacoChatVoices=window.speechSynthesis?.getVoices()||[];
}

function getTacoChatVoice(){
  const englishVoices=tacoChatVoices.filter(voice=>/^en(?:-|_)/i.test(voice.lang));
  return englishVoices.find(voice=>/natural|neural/i.test(voice.name))
    ||englishVoices.find(voice=>/microsoft.*(?:aria|ava|jenny|sonia)/i.test(voice.name))
    ||null;
}

if(tacoChatCanSpeak){
  refreshTacoChatVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged',refreshTacoChatVoices);
}

function addTacoChatNotice(text){
  tacoChatMessages.querySelectorAll('.tacochat-notice').forEach(notice=>notice.remove());
  const notice=document.createElement('div');
  notice.className='tacochat-notice';
  notice.setAttribute('role','status');
  notice.textContent=text;
  (document.getElementById('tacochat-empty')||tacoChatMessages).append(notice);
  tacoChatMessages.scrollTop=tacoChatMessages.scrollHeight;
}

function stopTacoChatSpeech(){
  tacoChatSpeechGeneration++;
  tacoChatSpeechRequest?.abort();
  tacoChatSpeechRequest=null;
  window.speechSynthesis?.cancel();
  if(tacoChatAudio){tacoChatAudio.pause();tacoChatAudio=null}
  if(tacoChatAudioUrl){URL.revokeObjectURL(tacoChatAudioUrl);tacoChatAudioUrl=''}
}

function speakWithBrowserVoice(text){
  if(!tacoChatCanSpeak)return;
  const speech=new SpeechSynthesisUtterance(text);
  speech.lang='en-US';
  const naturalVoice=getTacoChatVoice();
  if(naturalVoice)speech.voice=naturalVoice;
  speech.rate=.98;
  speech.pitch=1;
  window.speechSynthesis.speak(speech);
}

async function speakTacoChat(text){
  if(!tacoChatReadAloud||!tacoChatCanPlayAudio||tacoChatPanel?.hidden)return;
  stopTacoChatSpeech();
  const generation=tacoChatSpeechGeneration;
  const request=new AbortController();
  tacoChatSpeechRequest=request;
  const spokenText=String(text).replace(/\s*meow!?\s*$/i,'').trim();
  if(!spokenText){tacoChatSpeechRequest=null;return}
  try{
    const response=await fetch(`${tacoChatEndpoint}speech`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text:spokenText}),
      signal:request.signal
    });
    if(!response.ok)throw new Error('Voice request failed');
    const audioBlob=await response.blob();
    if(generation!==tacoChatSpeechGeneration||!tacoChatReadAloud||tacoChatPanel?.hidden)return;
    tacoChatSpeechRequest=null;
    const audioUrl=URL.createObjectURL(audioBlob);
    const audio=new Audio(audioUrl);
    tacoChatAudioUrl=audioUrl;
    tacoChatAudio=audio;
    audio.addEventListener('ended',()=>{
      if(tacoChatAudio!==audio)return;
      URL.revokeObjectURL(audioUrl);
      tacoChatAudio=null;
      tacoChatAudioUrl='';
    },{once:true});
    await audio.play();
  }catch{
    if(generation!==tacoChatSpeechGeneration||!tacoChatReadAloud||tacoChatPanel?.hidden)return;
    stopTacoChatSpeech();
    speakWithBrowserVoice(spokenText);
  }
}

function setTacoChatListening(listening){
  tacoChatListening=listening;
  tacoChatMic?.classList.toggle('listening',listening);
  tacoChatMic?.setAttribute('aria-pressed',String(listening));
  tacoChatMic?.setAttribute('aria-label',listening?'Stop listening':'Ask with your voice');
  if(tacoChatInput)tacoChatInput.placeholder=listening?'Listening…':'Write Your Message...';
}

if(TacoChatSpeechRecognition){
  tacoChatRecognition=new TacoChatSpeechRecognition();
  tacoChatRecognition.lang='en-US';
  tacoChatRecognition.continuous=false;
  tacoChatRecognition.interimResults=true;
  tacoChatRecognition.maxAlternatives=1;
  tacoChatRecognition.addEventListener('start',()=>{tacoChatSubmitTranscript=false;setTacoChatListening(true)});
  tacoChatRecognition.addEventListener('result',event=>{
    const transcript=[];
    for(let index=0;index<event.results.length;index++)transcript.push(event.results[index][0].transcript.trim());
    tacoChatInput.value=transcript.join(' ').trim().slice(0,tacoChatInput.maxLength);
    tacoChatSubmitTranscript=event.results[event.results.length-1].isFinal&&Boolean(tacoChatInput.value);
  });
  tacoChatRecognition.addEventListener('error',event=>{
    tacoChatSubmitTranscript=false;
    if(event.error!=='aborted')addTacoChatNotice(event.error==='not-allowed'?'Microphone permission was blocked. Allow microphone access, then try again.':'I could not hear that. Please try again or type your question.');
  });
  tacoChatRecognition.addEventListener('end',()=>{
    setTacoChatListening(false);
    if(tacoChatSubmitTranscript){tacoChatSubmitTranscript=false;tacoChatForm?.requestSubmit()}
  });
}

if(!tacoChatCanPlayAudio){tacoChatSpeakToggle.hidden=true}
tacoChatSpeakToggle?.addEventListener('click',()=>{
  tacoChatReadAloud=!tacoChatReadAloud;
  tacoChatSpeakToggle.setAttribute('aria-pressed',String(tacoChatReadAloud));
  tacoChatSpeakToggle.setAttribute('aria-label',tacoChatReadAloud?'Stop reading answers aloud':'Read TacoChat answers aloud');
  tacoChatSpeakToggle.title=tacoChatReadAloud?'Voice replies on':'Read answers aloud';
  tacoChatSpeakToggle.textContent=tacoChatReadAloud?'🔊':'🔈';
  if(!tacoChatReadAloud)stopTacoChatSpeech();
  else addTacoChatNotice('Natural voice replies are on.');
});

tacoChatMic?.addEventListener('click',()=>{
  if(!tacoChatRecognition){addTacoChatNotice('Voice questions are not supported in this browser. You can still type your question.');return}
  if(tacoChatListening){tacoChatSubmitTranscript=false;tacoChatRecognition.stop();return}
  stopTacoChatSpeech();
  try{tacoChatRecognition.start()}catch(error){addTacoChatNotice('The microphone is already starting. Please try again in a moment.')}
});

function setTacoChat(open){
  if(!tacoChatPanel||!tacoChatLauncher)return;
  tacoChatPanel.hidden=!open;
  tacoChatLauncher.setAttribute('aria-expanded',String(open));
  tacoChatLauncher.setAttribute('aria-label',open?'TacoChat is open':'Open TacoChat');
  if(open)setTimeout(()=>tacoChatInput?.focus(),50);
  else{
    if(tacoChatListening){tacoChatSubmitTranscript=false;tacoChatRecognition?.abort();setTacoChatListening(false)}
    stopTacoChatSpeech();
    tacoChatLauncher.focus();
  }
}

function getTacoChatFocusable(){
  if(!tacoChatPanel)return[];
  return [...tacoChatPanel.querySelectorAll('button:not([disabled]),input:not([disabled]),[href],[tabindex]:not([tabindex="-1"])')]
    .filter(element=>!element.hidden&&element.getClientRects().length);
}

function addTacoChatMessage(text,fromUser=false){
  tacoChatEmpty?.remove();
  const row=document.createElement('div');
  row.className=`tacochat-row ${fromUser?'tacochat-row-user':'tacochat-row-bot'}`;
  if(!fromUser){
    const avatar=document.createElement('span');
    avatar.className='tacochat-message-avatar';
    avatar.setAttribute('aria-hidden','true');
    const image=document.createElement('img');
    image.src='assets/tacocat-right.png';
    image.alt='';
    avatar.append(image);
    row.append(avatar);
  }
  const bubble=document.createElement('p');
  bubble.textContent=text;
  row.append(bubble);
  tacoChatMessages.append(row);
  tacoChatMessages.scrollTop=tacoChatMessages.scrollHeight;
  return row;
}

function getTacoChatFollowUps(message){
  const normalized=message.toLowerCase();
  if(/team taco\s*cat|team tacocat|your team/.test(normalized))return['Why did Team Tacocat choose a rain garden?','How will the team test its idea?'];
  if(/runoff|stormwater|salt/.test(normalized))return['How can a rain garden slow runoff?','What can runoff carry?'];
  if(/plant|wildlife|biodiversity/.test(normalized))return['Which plants could suit a rain garden?','How can a garden support wildlife?'];
  if(/model|test|experiment/.test(normalized))return['What are the three model setups?','Why use a control model?'];
  return['What is a rain garden?','What is Team Tacocat planning next?'];
}

function submitTacoChatQuestion(question){
  if(!tacoChatInput||tacoChatInput.disabled||!question)return;
  tacoChatInput.value=question;
  tacoChatForm?.requestSubmit();
}

function addTacoChatFollowUps(questions){
  const group=document.createElement('div');
  group.className='tacochat-followups';
  group.setAttribute('role','group');
  group.setAttribute('aria-label','Related questions');
  const label=document.createElement('span');
  label.textContent='You could also ask';
  group.append(label);
  questions.forEach(question=>{
    const button=document.createElement('button');
    button.type='button';
    button.textContent=question;
    button.addEventListener('click',()=>submitTacoChatQuestion(question));
    group.append(button);
  });
  tacoChatMessages.append(group);
  tacoChatMessages.scrollTop=tacoChatMessages.scrollHeight;
}

function getTacoChatPreviewReply(message){
  const normalized=message.toLowerCase().replace(/[^a-z0-9\s/]/g,' ').replace(/\s+/g,' ').trim();
  if(tacoChatGreeting.test(normalized))return 'Hello, how can I help you today';
  if(tacoChatIdentityQuestion.test(normalized))return tacoChatIdentityDescription;
  if(tacoChatPiQuestion.test(normalized))return tacoChatPiDescription;
  if(tacoChatTeamQuestion.test(normalized))return tacoChatTeamDescription;
  if(tacoChatShortAnswers[normalized])return tacoChatShortAnswers[normalized];
  const match=tacoChatAnswers.find(item=>item.terms.some(term=>normalized.includes(term)));
  return match?.answer||'TacoChat is temporarily unavailable. Please try again soon. Meow!';
}

async function getTacoChatReply(message){
  const normalized=message.toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  if(tacoChatGreeting.test(normalized))return 'Hello, how can I help you today';
  if(tacoChatIdentityQuestion.test(normalized))return tacoChatIdentityDescription;
  if(tacoChatPiQuestion.test(normalized))return tacoChatPiDescription;
  if(tacoChatTeamQuestion.test(normalized))return tacoChatTeamDescription;
  if(tacoChatShortAnswers[normalized])return tacoChatShortAnswers[normalized];
  if(tacoChatProjectQuestion.test(normalized))return getTacoChatPreviewReply(message);
  try{
    const response=await fetch(tacoChatEndpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message})
    });
    const data=await response.json();
    if(!response.ok||!data.reply)throw new Error(data.error||'TacoChat request failed');
    if(/Great Swamp Water Watch|water-monitoring project with four sensors|planned Raspberry Pi 3B\+ monitoring/i.test(data.reply))return tacoChatTeamDescription;
    return data.reply;
  }catch(error){
    console.warn('TacoChat AI unavailable; using the built-in answer.',error);
    return getTacoChatPreviewReply(message);
  }
}

tacoChatLauncher?.addEventListener('click',()=>setTacoChat(tacoChatPanel.hidden));
tacoChatClose?.addEventListener('click',()=>setTacoChat(false));
tacoChatSuggestions?.forEach(button=>{
  button.addEventListener('click',()=>submitTacoChatQuestion(button.dataset.question||''));
});
tacoChatForm?.addEventListener('submit',async event=>{
  event.preventDefault();
  const message=tacoChatInput.value.trim();
  if(!message)return;
  tacoChatMessages.querySelectorAll('.tacochat-followups').forEach(group=>group.remove());
  addTacoChatMessage(message,true);
  tacoChatInput.value='';
  tacoChatInput.disabled=true;
  tacoChatSubmit.disabled=true;
  tacoChatPanel.setAttribute('aria-busy','true');
  const thinking=addTacoChatMessage('Thinking…');
  const reply=await getTacoChatReply(message);
  thinking.remove();
  addTacoChatMessage(reply);
  speakTacoChat(reply);
  addTacoChatFollowUps(getTacoChatFollowUps(message));
  tacoChatInput.disabled=false;
  tacoChatSubmit.disabled=false;
  tacoChatPanel.removeAttribute('aria-busy');
  if(!tacoChatPanel.hidden)tacoChatInput.focus();
});

document.addEventListener('keydown',event=>{
  if(tacoChatPanel?.hidden!==false)return;
  if(event.key==='Escape'){setTacoChat(false);return}
  if(event.key==='Tab'){
    const focusable=getTacoChatFocusable();
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
});

const tacoChatLaunchParams=new URLSearchParams(window.location.search);
if(tacoChatLaunchParams.get('tacochat')==='open'){
  setTacoChat(true);
  tacoChatLaunchParams.delete('tacochat');
  const remainingQuery=tacoChatLaunchParams.toString();
  window.history.replaceState(null,'',`${window.location.pathname}${remainingQuery?`?${remainingQuery}`:''}${window.location.hash}`);
}
