// ✅ Versioned cache name
const CACHE_NAME = "medilink360-cache-v2";

// ✅ Files to precache (core app shell)
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// ✅ Install: cache app shell
self.addEventListener("install", (event) => {
  console.log("🛠 Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Caching app shell...");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ✅ Activate: clear old caches
self.addEventListener("activate", (event) => {
  console.log("⚡ Service Worker: Activated");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑 Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ✅ Fetch: network-first with cache fallback
self.addEventListener("fetch", (event) => {
  // 🚫 Skip non-GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 🚫 Skip browser extensions / devtools requests
  if (url.protocol === "chrome-extension:" || url.protocol === "devtools:") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // ✅ Cache only valid same-origin responses
        if (
          response &&
          response.status === 200 &&
          response.type === "basic" &&
          url.origin === self.location.origin
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch((err) => {
              console.warn("⚠️ Cache put failed:", err);
            });
          });
        }
        return response;
      })
      .catch(() => {
        // ✅ Fallback to cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;

          // ✅ Fallback to index.html for SPA navigation
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }

          return new Response("⚠️ Offline & resource not cached", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
  );
});
