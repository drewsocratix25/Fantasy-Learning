// Castle Quest service worker: caches the game so it loads fast and works offline on the iPad.
const CACHE = 'castle-quest-v1';
const ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest', './js/config.js',
  '../../engine/save.js', '../../engine/audio.js', '../../engine/lines.js', '../../engine/art.js', '../../engine/ui.js', '../../engine/quiz.js', '../../engine/main.js',
  './js/data.js', './js/voicelines.js', './js/hero.js', './js/progress.js', './js/title.js', './js/castle.js',
  './js/games/tower.js', './js/games/greenhouse.js', './js/games/lab.js', './js/games/menagerie.js', './js/games/vault.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // fonts etc. go straight to the network
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
