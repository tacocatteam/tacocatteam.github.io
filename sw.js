const CACHE_NAME='tacocat-water-watch-v22';
const APP_SHELL=[
  './',
  './index.html',
  './classroom.html',
  './classroom.css?v=5',
  './classroom.js?v=6',
  './question-bank.js?v=2',
  './manifest.webmanifest',
  './styles.css?v=5',
  './timeline.css',
  './monitor-modal.css?v=6',
  './tacochat.css?v=10',
  './script.js?v=10',
  './tacochat.js?v=19',
  './water-quality-monitor.html?v=6',
  './assets/tacocat-right.png',
  './assets/wetland.png',
  './assets/pwa-icon-192.png',
  './assets/pwa-icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||url.pathname.endsWith('.mp4'))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(response=>response||caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy))}return response})));
});
