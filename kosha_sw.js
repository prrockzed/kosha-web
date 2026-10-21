// Kosha Web's service worker: the page, kept on this computer, so it
// opens again with Wi-Fi off.
//
// It only ever serves the site's own files. On install it stores the
// core — the page, its code, its fonts, SQLite, the renderer — listed by
// tool/service_worker.dart in kosha_sw_assets.js with this build's
// version; anything else of the site's is stored the first time it's
// fetched (a fallback font, say). Nothing is ever sent anywhere: there
// is nowhere else for it to go (index.html's Content-Security-Policy).
//
// A new version installs beside the old and takes over once every tab of
// the old one is closed, so an open copy never finds its page's files
// changing under it.
'use strict';

importScripts('kosha_sw_assets.js');

const CACHE = 'kosha-web-' + self.KOSHA_VERSION;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(self.KOSHA_ASSETS.map((a) => new Request(a, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n.startsWith('kosha-web-') && n !== CACHE)
        .map((n) => caches.delete(n)))));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // The page itself, from wherever it was opened in the site.
  const lookup = request.mode === 'navigate'
    ? new Request(self.registration.scope)
    : request;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const kept = await cache.match(lookup, { ignoreSearch: true });
    if (kept) return kept;
    const fetched = await fetch(request);
    if (fetched.ok && request.mode !== 'navigate') {
      cache.put(request, fetched.clone());
    }
    return fetched;
  })());
});

// The page asks the waiting version to take over (its Update button, on
// the Open screen — never while a copy is open).
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
