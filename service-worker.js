var dataCacheName = 'appledailyData-v1';
var cacheName = 'appledailyData-layout-1';
var filesToCache = [
  'index.htm',
  'videolist.html',
  'news.html',
  'scripts/app.js',
  'files/beacon.js',
  'files/gpt.js',
  'files/jquery-1.7.2.min.js',
  'files/gpt(1).js',
  'files/gpt.js',
  'files/pubads_impl_92.js',
  'files/fingerprint.min.js',
  'files/jquery.cookie.min.js',
  'files/json2.min.js',
  'files/ngs_logging.min.js',
  'files/nxm_tr_v16.js',
  'files/jquery.cookie.min.js'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching App Shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        console.log('[ServiceWorker] Removing old cache', key);
        if (key !== cacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
});

/*self.addEventListener('fetch', function(e) {
  console.log('[ServiceWorker] Fetch', e.request.url);
  var dataUrl = 'https://publicdata-weather.firebaseio.com/';
  if (e.request.url.indexOf(dataUrl) === 0) {
    e.respondWith(
      fetch(e.request)
        .then(function(response) {
          return caches.open(dataCacheName).then(function(cache) {
            cache.put(e.request.url, response.clone());
            console.log('[ServiceWorker] Fetched&Cached Data');
            return response;
          });
        })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }*/
});
