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
const tacoChatTeamDescription='Team Tacocat is FIRST LEGO League robotics team #34043, made up of creative students who use robotics, coding, research, engineering, and teamwork to solve real-world problems. Our current Innovation Project, Great Swamp Water Watch, explores how a Raspberry Pi and water-quality sensors can measure pH, conductivity and TDS, dissolved oxygen, and water temperature. We want to turn these measurements into clear, understandable information that helps people learn about the Great Swamp, recognize changes in water quality, and understand why protecting wetlands and wildlife matters. Meow!';
const tacoChatTeamQuestion=/\b(?:team\s+taco\s*cat|team\s+tacocat|your\s+team|about\s+(?:the\s+)?team|who\s+(?:is|are)\s+(?:team\s+)?taco\s*cat)\b/i;
const tacoChatPiDescription='TacoChat is the website assistant, not a Raspberry Pi. Team Tacocat\u2019s Great Swamp Water Watch system is designed to use a Raspberry Pi 3B+ to collect and organize information from its water-quality sensors. Meow!';
const tacoChatPiQuestion=/\braspberry\s*pi\b|\b(?:which|what)\s+pi\b|\bpi\s+model\b/i;
const tacoChatIdentityDescription='I am TacoChat, the official chatbot for the Tacocat Team, how can I help';
const tacoChatIdentityQuestion=/^(?:who|what)\s+(?:are|r)\s+(?:you|u)$/i;
const tacoChatShortAnswers={
  do:'DO stands for dissolved oxygen, the oxygen available in water for fish, insects, and other aquatic organisms to breathe. It can change with temperature, water movement, plant activity, and decomposition. Meow!',
  ph:'pH describes how acidic or basic water is. Team Tacocat plans to track it as one of four water-quality measurements. Meow!',
  tds:'TDS stands for total dissolved solids, an estimate of the dissolved substances in water. It is often estimated using conductivity. Meow!'
};

const tacoChatAnswers=[
  {terms:['ph'],answer:'pH describes how acidic or basic water is. Team Tacocat plans to track it as one of four water-quality measurements. Meow!'},
  {terms:['conductivity','tds'],answer:'Conductivity responds to dissolved ions in water. TDS estimates the amount of dissolved material, often using conductivity as a clue. Meow!'},
  {terms:['dissolved oxygen','oxygen'],answer:'Dissolved oxygen is the oxygen available in water for fish, insects, and other aquatic organisms. Meow!'},
  {terms:['temperature'],answer:'Water temperature affects aquatic organisms and can influence dissolved oxygen and other water conditions. Meow!'},
  {terms:['wetland','great swamp','swamp'],answer:'Wetlands provide wildlife habitat, slow floodwater, capture sediment, and connect many parts of an ecosystem. Meow!'},
  {terms:['tacocat','team','fll','innovation project'],answer:'Team Tacocat is a FIRST LEGO League robotics team developing a Great Swamp water-monitoring project with four sensors and a Raspberry Pi. Meow!'}
];

const TacoChatSpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
const tacoChatCanSpeak='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
let tacoChatRecognition=null;
let tacoChatListening=false;
let tacoChatSubmitTranscript=false;
let tacoChatReadAloud=false;
let tacoChatVoices=[];

function refreshTacoChatVoices(){
  tacoChatVoices=window.speechSynthesis?.getVoices()||[];
}

function getTacoChatVoice(){
  const scoreVoice=voice=>{
    if(!/^en(?:-|_)/i.test(voice.lang))return -1000;
    const name=voice.name.toLowerCase();
    let score=0;
    if(/natural|neural/.test(name))score+=100;
    if(/online/.test(name)||voice.localService===false)score+=35;
    if(/microsoft/.test(name))score+=25;
    if(/aria|ava|andrew|brian|emma|guy|jenny|sonia|ryan/.test(name))score+=15;
    if(/^en-us$/i.test(voice.lang))score+=10;
    if(/espeak|compact|sam/.test(name))score-=30;
    return score;
  };
  return tacoChatVoices
    .map((voice,index)=>({voice,index,score:scoreVoice(voice)}))
    .filter(candidate=>candidate.score>-1000)
    .sort((a,b)=>b.score-a.score||a.index-b.index)[0]?.voice||null;
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

function speakTacoChat(text){
  if(!tacoChatReadAloud||!tacoChatCanSpeak)return;
  window.speechSynthesis.cancel();
  const speech=new SpeechSynthesisUtterance(text);
  speech.lang='en-US';
  const naturalVoice=getTacoChatVoice();
  if(naturalVoice)speech.voice=naturalVoice;
  speech.rate=.98;
  speech.pitch=1;
  window.speechSynthesis.speak(speech);
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
    let transcript='';
    for(let index=event.resultIndex;index<event.results.length;index++)transcript+=event.results[index][0].transcript;
    tacoChatInput.value=transcript.trim();
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

if(!tacoChatCanSpeak){tacoChatSpeakToggle.hidden=true}
tacoChatSpeakToggle?.addEventListener('click',()=>{
  tacoChatReadAloud=!tacoChatReadAloud;
  tacoChatSpeakToggle.setAttribute('aria-pressed',String(tacoChatReadAloud));
  tacoChatSpeakToggle.setAttribute('aria-label',tacoChatReadAloud?'Stop reading answers aloud':'Read TacoChat answers aloud');
  tacoChatSpeakToggle.title=tacoChatReadAloud?'Voice replies on':'Read answers aloud';
  tacoChatSpeakToggle.textContent=tacoChatReadAloud?'🔊':'🔈';
  if(!tacoChatReadAloud)window.speechSynthesis?.cancel();
  else addTacoChatNotice('Natural voice replies are on.');
});

tacoChatMic?.addEventListener('click',()=>{
  if(!tacoChatRecognition){addTacoChatNotice('Voice questions are not supported in this browser. You can still type your question.');return}
  if(tacoChatListening){tacoChatSubmitTranscript=false;tacoChatRecognition.stop();return}
  window.speechSynthesis?.cancel();
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
    window.speechSynthesis?.cancel();
    tacoChatLauncher.focus();
  }
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
  if(/dissolved oxygen|\bdo\b|oxygen/.test(normalized))return['Why does dissolved oxygen matter?','What affects dissolved oxygen levels?'];
  if(/road salt|runoff|conductivity|tds/.test(normalized))return['Why is road salt a problem for wetlands?','How can people reduce salt runoff?'];
  if(/team taco\s*cat|team tacocat|your team/.test(normalized))return['How does your monitoring system work?','Why did Team Tacocat choose the Great Swamp?'];
  if(/monitor|sensor|raspberry pi|system/.test(normalized))return['What does each sensor measure?','Why track water quality over time?'];
  if(/wetland|great swamp|wildlife/.test(normalized))return['Why does wetland biodiversity matter?','How can people help protect wetlands?'];
  return['Why does water quality matter?','How can people help protect wetlands?'];
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
  if(normalized==='hello')return 'Hello, how can I help you today';
  if(tacoChatIdentityQuestion.test(normalized))return tacoChatIdentityDescription;
  if(tacoChatPiQuestion.test(normalized))return tacoChatPiDescription;
  if(tacoChatTeamQuestion.test(normalized))return tacoChatTeamDescription;
  if(tacoChatShortAnswers[normalized])return tacoChatShortAnswers[normalized];
  const match=tacoChatAnswers.find(item=>item.terms.some(term=>normalized.includes(term)));
  return match?.answer||'TacoChat is temporarily unavailable. Please try again soon. Meow!';
}

async function getTacoChatReply(message){
  const normalized=message.toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  if(normalized==='hello')return 'Hello, how can I help you today';
  if(tacoChatIdentityQuestion.test(normalized))return tacoChatIdentityDescription;
  if(tacoChatPiQuestion.test(normalized))return tacoChatPiDescription;
  if(tacoChatTeamQuestion.test(normalized))return tacoChatTeamDescription;
  if(tacoChatShortAnswers[normalized])return tacoChatShortAnswers[normalized];
  try{
    const response=await fetch(tacoChatEndpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message})
    });
    const data=await response.json();
    if(!response.ok||!data.reply)throw new Error(data.error||'TacoChat request failed');
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
  const thinking=addTacoChatMessage('Thinking…');
  const reply=await getTacoChatReply(message);
  thinking.remove();
  addTacoChatMessage(reply);
  speakTacoChat(reply);
  addTacoChatFollowUps(getTacoChatFollowUps(message));
  tacoChatInput.disabled=false;
  tacoChatSubmit.disabled=false;
  tacoChatInput.focus();
});

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&tacoChatPanel?.hidden===false)setTacoChat(false);
});
