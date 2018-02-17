var CACHE_NAME = 'assets';
var urlsToCache = [
  './background.jpg',
  './sharkynobg.png',
  './start.png',
  './crystals/ice_1.png',
  './crystals/ice_2.png',
  './crystals/ice_3.png',
  './crystals/ice_4.png',
  './crystals/ice_5.png',
  './crystals/ice_6.png',
  './crystals/symbol.png',
  './screenfull.js',
  './sharkrun.js'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});
