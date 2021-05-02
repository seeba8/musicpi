// code from https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers
let contentToCache = [
    "main.js",
    "resources/bulma.css",
    "resources/vue.js",
    "resources/Notenschluessel.svg",
    "style.css",
    "index.html"
];
let cacheName = 'musicpiv5';
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');

    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(contentToCache);
        })
    );
});

self.addEventListener('fetch', async (e) => {
    e.respondWith(async function () {
        let r = await caches.match(e.request);
        console.log('[Service Worker] Fetching resource: ' + e.request.url);
        if (r !== undefined) {
            console.log("cache hit");
            return r;
        }
        console.log("cache miss");
        r = await fetch(e.request);
        if (contentToCache.includes(e.request.url.replace(self.origin, "").slice(1))) {
            const cache = caches.open(cacheName);
            console.log('[Service Worker] Caching new resource: ' + e.request.url);
            cache.put(e.request, r.clone());
        }
        return r;
    }());

});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== cacheName) {
                    return caches.delete(key);
                }
            }));
        })
    );
});