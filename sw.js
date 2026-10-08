// Permite instalar el portal como app y abrirlo sin conexión.
// Si cambias la lista de archivos, sube también el número de VERSION.
const VERSION = "v1";
const CACHE = `utilidades-${VERSION}`;

const APP_SHELL = [
  "./", "index.html", "styles.css", "app.js", "utilidades.js", "manifest.json", "logo.svg",
  "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png",
  "favicon-32.png", "favicon-48.png", "favicon-192.png", "favicon.ico",
];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(APP_SHELL.map((u) => c.add(u)))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k.startsWith("utilidades-") && k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) event.respondWith(networkFirst(req));
  else if (FONT_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(req));
});

// Red primero: los cambios publicados (p. ej. una utilidad nueva) se ven en cuanto hay conexión.
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  const network = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  });
  network.catch(() => {});
  try {
    return await Promise.race([
      network,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), NETWORK_TIMEOUT_MS)),
    ]);
  } catch (err) {
    const cached = (await cache.match(req, { ignoreSearch: true })) ||
      (req.mode === "navigate" ? await cache.match("index.html") : undefined);
    if (cached) return cached;
    if (err.message === "timeout") return network;
    return Response.error();
  }
}

// Tipografía: no cambia, se sirve la copia guardada.
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}
