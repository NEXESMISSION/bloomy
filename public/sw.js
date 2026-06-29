/* Service worker Bloomy — léger et prudent.
   Navigations : réseau d'abord (données fraîches) + repli hors-ligne.
   Statiques : cache d'abord. /admin et requêtes non-GET : jamais mis en cache. */
const CACHE = "bloomy-v1";
const PRECACHE = ["/offline.html", "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/admin")) return;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons") ||
    /\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});
