/*
  ოფლაინ რეჟიმი: საიტის ფაილები ინახება ტელეფონში.
  ყოველთვის ჯერ ინტერნეტიდან იტვირთება (ასე ახალი ვერსია მაშინვე ჩანს), ქსელის გარეშე კი შენახული ასლი იხსნება.
  ვიდეოები (YouTube/Vimeo) ინახება არა აქ, არამედ თავიანთ სერვისებზე.
*/
var CACHE = "padel-school-v1";
var SHELL = ["./", "index.html", "assets/style.css", "assets/app.js", "assets/motion.js", "data/lessons.js",
  "assets/favicon.svg", "assets/icons/icon-192.png", "manifest.webmanifest"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (/\.(mp4|webm|mov|m4v)$/i.test(new URL(req.url).pathname)) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || (req.mode === "navigate" ? caches.match("index.html") : undefined); });
  }));
});
