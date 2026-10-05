/* Crisna se Kombuis — service worker.
   Doel: die app laai ook sonder internet.
   Strategie: netwerk eerste (sodat opdaterings dadelik deurkom), met die kas as rugsteun.
   Verhoog VERSIE by elke deploy — dan word die ou kas opgeruim. */
var VERSIE = 'kombuis-2026-10-05b';
var SKIL = ['./', 'index.html', 'style.css', 'app.js', 'wolk.js', 'lib/jspdf.umd.min.js',
            'manifest.webmanifest', 'ikone/apple-touch-icon.png', 'ikone/icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSIE).then(function (c) { return c.addAll(SKIL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSIE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(function (res) {
      if (res && res.ok) { var kopie = res.clone(); caches.open(VERSIE).then(function (c) { c.put(req, kopie); }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) {
        return r || (req.mode === 'navigate' ? caches.match('index.html') : undefined);
      });
    })
  );
});
