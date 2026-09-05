// Melody Kingdom service worker: caches the game so it loads fast and works offline on the iPad.
const CACHE = 'germ-patrol-v4';
const ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest', './js/config.js',
  '../../engine/save.js', '../../engine/audio.js', '../../engine/lines.js', '../../engine/art.js', '../../engine/ui.js', '../../engine/quiz.js', '../../engine/main.js',
  './js/data.js', './js/voicelines.js', './js/gart.js', './js/gart2.js', './js/progress.js', './js/title.js', './js/town.js', './voice/manifest.json',
  './js/games/wash.js', './js/games/teeth.js', './js/games/sneeze.js', './js/games/lab.js', './js/games/defend.js', './js/games/kitchen.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('germ-patrol-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // fonts etc. go straight to the network
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {})); }
      return res;
    }).catch(() => caches.open(CACHE).then(async (c) => (await c.match(e.request)) || (e.request.mode === 'navigate' ? await c.match('./index.html') : Response.error())))
  );
});
