self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Audio clips and question pictures are cached as they're used, so anything
// seen once is instant next time and works offline. Cache-first, with a
// background refresh only once an entry is a week old (so re-generated files
// still arrive without re-downloading every clip each visit). Each cache is
// capped so hundreds of lessons can't fill the device: the oldest entries go
// first. Range requests (from <audio> elements) can't be cached as partial
// responses, so they go straight to the network.
const CACHES = [
  { name: "wortwunder-audio-v1", pattern: /\.(mp3|wav)$/i, max: 400 },
  { name: "wortwunder-images-v1", pattern: /\.(jpe?g|png|webp)$/i, max: 200 },
];
const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

async function trim(cache, max) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

async function cacheFirst(request, { name, max }) {
  const cache = await caches.open(name);
  const cached = await cache.match(request);
  const refresh = async () => {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await trim(cache, max);
    }
    return response;
  };
  if (!cached) return refresh();
  const cachedAt = Date.parse(cached.headers.get("date") || "");
  if (!cachedAt || Date.now() - cachedAt > REFRESH_AFTER_MS) refresh().catch(() => {});
  return cached;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const target =
    request.method === "GET" && !request.headers.has("range")
      ? CACHES.find(({ pattern }) => pattern.test(new URL(request.url).pathname))
      : undefined;
  event.respondWith(target ? cacheFirst(request, target) : fetch(request));
});
