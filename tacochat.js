const tacoChatPanel=document.getElementById('tacochat-panel');
const tacoChatLauncher=document.getElementById('tacochat-launcher');
const tacoChatClose=tacoChatPanel?.querySelector('.tacochat-close');
const tacoChatForm=document.getElementById('tacochat-form');
const tacoChatInput=document.getElementById('tacochat-input');
const tacoChatMessages=document.getElementById('tacochat-messages');
const tacoChatEmpty=document.getElementById('tacochat-empty');
const tacoChatSubmit=tacoChatForm?.querySelector('button[type="submit"]');
const tacoChatEndpoint='https://tacocat.lynnluo829.workers.dev/';

const tacoChatTopics=[
  'tacocat','team','fll','first lego league','innovation project','great swamp','swamp','wetland','water','ph','conductivity','tds','dissolved oxygen','oxygen','temperature','sensor','raspberry pi','runoff','road salt','storm drain','stream','ecosystem','biodiversity','wildlife','watershed','aquatic','pollution','environment','monitoring'
];

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
  const relevant=tacoChatTopics.some(topic=>normalized.includes(topic));
  if(!relevant)return "Sorry, but I haven't learned that yet. Meow!";
  const match=tacoChatAnswers.find(item=>item.terms.some(term=>normalized.includes(term)));
  return match?.answer||'That question fits TacoChat, but the AI connection is not active yet. I will be able to answer it after Team Tacocat connects the secure service. Meow!';
}

async function getTacoChatReply(message){
  const preview=getTacoChatPreviewReply(message);
  if(preview.startsWith("Sorry, but I haven't learned"))return preview;
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
    const match=tacoChatAnswers.find(item=>item.terms.some(term=>message.toLowerCase().includes(term)));
    return match?.answer||'TacoChat is temporarily unavailable. Please try again soon. Meow!';
  }
}

tacoChatLauncher?.addEventListener('click',()=>setTacoChat(tacoChatPanel.hidden));
tacoChatClose?.addEventListener('click',()=>setTacoChat(false));
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
