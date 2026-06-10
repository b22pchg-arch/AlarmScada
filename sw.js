/* SCADA Alarm Summary Offline Analyzer - Service Worker */
const APP_VERSION = '2026-06-10-esum-pwa-v1';
const CACHE_NAME = 'scada-alarm-analyzer-' + APP_VERSION;
const APP_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_ASSETS.map(url => new Request(url, {cache: 'reload'})));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k === CACHE_NAME ? null : (k.startsWith('scada-alarm-analyzer-') ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if(cached) return cached;
    try{
      const fresh = await fetch(req);
      const url = new URL(req.url);
      if(fresh && fresh.status === 200 && url.origin === self.location.origin){
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
      }
      return fresh;
    }catch(err){
      if(req.mode === 'navigate'){
        const shell = await caches.match('./index.html');
        if(shell) return shell;
      }
      throw err;
    }
  })());
});
