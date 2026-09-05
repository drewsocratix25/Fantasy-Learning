// Only this application's caches are managed here; sibling adventure caches are preserved.
const CACHE = "little-wonders-world-v1";
const CORE = [
  "./",
  "./index.html",
  "./hub.css",
  "./manifest.webmanifest",
  "./app/main.mjs",
  "./app/core.mjs",
  "./app/audio.mjs",
  "./assets/garden.webp",
  "./assets/music.webp",
  "./assets/discovery.webp",
  "./assets/garden-small.webp",
  "./assets/music-small.webp",
  "./assets/discovery-small.webp",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-180.png",
];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("little-wonders-world-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url),
    root = new URL(self.registration.scope);
  if (
    event.request.method !== "GET" ||
    url.origin !== root.origin ||
    !url.pathname.startsWith(root.pathname)
  )
    return;
  const relative = url.pathname.slice(root.pathname.length);
  // Original games have their own workers and offline rules.
  if (
    relative.startsWith("games/") &&
    !relative.includes("/voice/") &&
    !relative.includes("/icons/")
  )
    return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches
              .open(CACHE)
              .then((cache) => cache.put(event.request, copy))
              .catch(() => {}),
          );
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE),
          saved = await cache.match(event.request);
        if (saved) return saved;
        if (
          event.request.mode === "navigate" &&
          (relative === "" || relative === "index.html")
        )
          return cache.match("./index.html");
        return Response.error();
      }),
  );
});
