const CACHE_NAME = "V1";
const STATIC_CACHE_URLS = ["/", "styles.css", "scripts.js", "index.html"];

self.addEventListener("install", (event) => {
    console.log("Service Worker installing.");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE_URLS))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => keys.filter((key) => key !== CACHE_NAME))
            .then((keys) =>
                Promise.all(
                    keys.map((key) => {
                        console.log(`Deleting cache ${key}`);
                        return caches.delete(key);
                    })
                )
            )
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches
            .match(event.request)
            .then((cached) => cached || fetch(event.request))
            .then((response) =>
                cache(event.request, response).then(() => response)
            )
    );
});

function cache(request, response) {
    if (response.type === "error" || response.type === "opaque") {
        return Promise.resolve();
    }
    return caches
        .open(CACHE_NAME)
        .then((cache) => cache.put(request, response.clone()));
}
