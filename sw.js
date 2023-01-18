const cacheName = 'ladybug';

/*when texting from laptop*/
const filesToCache = [
  './',
  'index.html',
  'style.css',
  'index.js',
  'oauth-proxy/oauthshim.js',
  'config-client.js'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
