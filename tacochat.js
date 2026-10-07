const tacoChatPanel=document.getElementById('tacochat-panel');
const tacoChatLauncher=document.getElementById('tacochat-launcher');
const tacoChatClose=tacoChatPanel?.querySelector('.tacochat-close');
const tacoChatForm=document.getElementById('tacochat-form');
const tacoChatInput=document.getElementById('tacochat-input');
const tacoChatMessages=document.getElementById('tacochat-messages');
const tacoChatEmpty=document.getElementById('tacochat-empty');
const tacoChatSubmit=tacoChatForm?.querySelector('button[type="submit"]');
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

function setTacoChat(open){
  if(!tacoChatPanel||!tacoChatLauncher)return;
  tacoChatPanel.hidden=!open;
  tacoChatLauncher.setAttribute('aria-expanded',String(open));
  tacoChatLauncher.setAttribute('aria-label',open?'TacoChat is open':'Open TacoChat');
  if(open)setTimeout(()=>tacoChatInput?.focus(),50);
  else tacoChatLauncher.focus();
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
  button.addEventListener('click',()=>{
    if(!tacoChatInput||tacoChatInput.disabled)return;
    tacoChatInput.value=button.dataset.question||'';
    tacoChatForm?.requestSubmit();
  });
});
tacoChatForm?.addEventListener('submit',async event=>{
  event.preventDefault();
  const message=tacoChatInput.value.trim();
  if(!message)return;
  addTacoChatMessage(message,true);
  tacoChatInput.value='';
  tacoChatInput.disabled=true;
  tacoChatSubmit.disabled=true;
  const thinking=addTacoChatMessage('Thinking…');
  const reply=await getTacoChatReply(message);
  thinking.remove();
  addTacoChatMessage(reply);
  tacoChatInput.disabled=false;
  tacoChatSubmit.disabled=false;
  tacoChatInput.focus();
});

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&tacoChatPanel?.hidden===false)setTacoChat(false);
});
