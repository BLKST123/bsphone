/* BS小手机 · 离线兜底：网络优先，打不开时用上一次成功加载的版本 */
var C='bsphone-v37';
self.addEventListener('install',function(e){ self.skipWaiting(); });
self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k!==C; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET'){ return; }
  e.respondWith(
    fetch(req).then(function(r){
      try{
        if(r && r.ok && new URL(req.url).origin===location.origin){
          var cp=r.clone(); caches.open(C).then(function(c){ c.put(req,cp); });
        }
      }catch(err){}
      return r;
    }).catch(function(){
      return caches.match(req).then(function(m){ return m || caches.match('./'); });
    })
  );
});
