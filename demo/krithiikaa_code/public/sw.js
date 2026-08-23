/*
 * Minimal service worker — installability, and a graceful offline page.
 *
 * SCOPE, deliberately narrow: it caches the app shell and the offline fallback,
 * and NOTHING else. Every screen in Dayflow is per-user data behind RLS —
 * salaries, bank details, attendance. Caching those responses would leave one
 * person's figures in the browser store for the next person to sign in on that
 * device, so API and page responses are always fetched fresh and never written
 * to the cache. Real offline support is out of scope; this is the difference
 * between "installable" and "silently leaking payroll".
 */
const CACHE = "dayflow-shell-v1";
const OFFLINE_URL = "/offline.html";

const SHELL = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
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
  const { request } = event;

  // Only navigations get the offline fallback. Everything else — including every
  // data request — goes straight to the network with no cache read or write.
  if (request.mode !== "navigate" || request.method !== "GET") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      const fallback = await cache.match(OFFLINE_URL);
      return fallback ?? new Response("Offline", { status: 503, statusText: "Offline" });
    }),
  );
});
