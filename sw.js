const CACHE = "jinshi-v5";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // The page itself: try the network first (so updates show up), fall back to the cached copy after 2.5s or offline.
  if (e.request.mode === "navigate") {
    e.respondWith(caches.open(CACHE).then(async c => {
      const cached = await c.match(e.request, { ignoreSearch: true }) || await c.match("./");
      const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; });
      const timeout = new Promise(res => setTimeout(() => res(cached), 2500));
      try { return (await Promise.race([net, cached ? timeout : net])) || await net; } catch { return cached; }
    }));
    return;
  }
  // Fonts, icons: cache first, refresh in the background.
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
