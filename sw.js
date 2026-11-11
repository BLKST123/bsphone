/* BS小手机 · 离线兜底：页面网络优先，静态资源缓存优先 */
var C='bsphone-v108-20261111-r1';
var PRECACHE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./core/design/tokens.css','./core/design/shell.css','./core/store/core-store.js','./core/store/readonly-store.js','./core/prompts/sysworld-v2.js'];
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
function putCache(req,response){
  if(!response||!response.ok) return Promise.resolve();
  try{ if(new URL(req.url).origin!==location.origin) return Promise.resolve(); }catch(e){ return Promise.resolve(); }
  return caches.open(C).then(function(cache){ return cache.put(req,response.clone()); }).catch(function(){});
}
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(C).then(function(cache){
    return Promise.all(PRECACHE.map(function(url){ return cache.add(url).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});
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
  var network=timedFetch(req,isPage?6000:4500).then(function(r){ putCache(req,r); return r; }).catch(function(){ return null; });
  if(isPage){
    e.respondWith(network.then(function(r){
      if(r) return r;
      return caches.match(req).then(function(cached){ return cached||caches.match('./'); }).then(function(cached){
        return cached||new Response('网络暂时不可用，请稍后重试。',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
      });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function(cached){
    if(cached){ e.waitUntil(network); return cached; }
    return network.then(function(r){ return r||new Response('',{status:503}); });
  }));
});


