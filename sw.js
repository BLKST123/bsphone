/* BS小手机 · 离线兜底：缓存优先，网络更新不再无限等待 */
var C='bsphone-v75';
function timedFetch(req,ms){
  return new Promise(function(resolve,reject){
    var done=false;
    var timer=setTimeout(function(){ if(!done){ done=true; reject(new Error('network timeout')); } },ms);
    fetch(req).then(function(r){
      if(done) return;
      done=true;clearTimeout(timer);resolve(r);
    }).catch(function(e){
      if(done) return;
      done=true;clearTimeout(timer);reject(e);
    });
  });
}
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
  if(req.method!=='GET') return;
  var isPage=req.mode==='navigate';
  e.respondWith(
    caches.match(req).then(function(cached){
      var network=timedFetch(req,isPage?6000:4500).then(function(r){
        try{
          if(r&&r.ok&&new URL(req.url).origin===location.origin){
            var cp=r.clone();caches.open(C).then(function(c){ c.put(req,cp); });
          }
        }catch(err){}
        return r;
      }).catch(function(){ return null; });
      if(cached){
        e.waitUntil(network);
        return cached;
      }
      return network.then(function(r){
        return r||caches.match('./')||new Response('网络暂时不可用，请稍后重试。',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
      });
    })
  );
});
