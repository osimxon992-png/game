// Kosmik Kema service worker (avtomatik yaratilgan)
const KESH = "kosmik-kema-e31a58c181";
const FAYLLAR = ["./","index.html","oyin.js","manifest.webmanifest","fonts/fonts.css","fonts/Barlow-400-latin-ext.woff2","fonts/Barlow-400-latin.woff2","fonts/Barlow-500-latin-ext.woff2","fonts/Barlow-500-latin.woff2","fonts/BarlowCondensed-300-latin-ext.woff2","fonts/BarlowCondensed-300-latin.woff2","fonts/BarlowCondensed-500-latin-ext.woff2","fonts/BarlowCondensed-500-latin.woff2","fonts/BarlowCondensed-600-latin-ext.woff2","fonts/BarlowCondensed-600-latin.woff2","fonts/IBMPlexMono-400-latin-ext.woff2","fonts/IBMPlexMono-400-latin.woff2","fonts/IBMPlexMono-500-latin-ext.woff2","fonts/IBMPlexMono-500-latin.woff2","icons/apple-touch-icon.png","icons/favicon-64.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-192.png","icons/maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(KESH).then((c) => c.addAll(FAYLLAR)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.filter((n) => n.startsWith("kosmik-kema-") && n !== KESH).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(caches.match("index.html").then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
