// Melody Kingdom service worker: caches the game so it loads fast and works offline on the iPad.
const CACHE = 'melody-kingdom-v6';
const ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest', './js/config.js',
  '../../engine/save.js', '../../engine/audio.js', '../../engine/lines.js', '../../engine/art.js', '../../engine/ui.js', '../../engine/quiz.js', '../../engine/main.js',
  './js/data.js', './js/songs.js', './js/drawings.js', './js/voicelines.js', './js/progress.js', './js/title.js', './js/world.js', './voice/manifest.json',
  './js/games/songselect.js', './js/games/rhythm.js', './js/games/letters.js', './js/games/numbers.js', './js/games/shapes.js', './js/games/piano.js', './js/games/patterns.js', './js/games/drawing.js', './js/games/puppysim.js', './js/games/puppy.js', './js/games/spell.js',
  './js/games/forest.js', './js/games/peaks.js', './js/games/spelling.js', './js/games/simon.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('melody-kingdom-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
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
