const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('E:/Codex/tools/node/bin/node_modules/playwright');
const ROOT=path.resolve('C:/Users/lenovo/Documents/ChatGPT/各种的/_ghpages'),PORT=18042;
const fnMap={wechat:['screenWechat'],novel:['screenNovelHome','screenNovelSquare','screenNovelBook','screenNovelChapter','screenNovelShelf','screenNovelMe','screenNovelStats'],diary:['screenDiary'],forum:['screenForum'],gallery:['screenGallery'],hang:['screenHang'],date:['screenDate'],out:['screenOut'],shop:['screenTaobao'],takeout:['screenTakeout'],clock:['screenClock'],couple:['screenCouple'],soul:['screenSoul'],music:['screenMusic'],weibo:['screenWeibo'],world:['screenWorldBooks'],regex:['screenRegexList'],settings:['screenSettings']};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent((q.url||'/').split('?')[0]),f=path.join(ROOT,u==='/'?'index.html':u.replace(/^\/+/,''));if(!f.startsWith(ROOT)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);r.end();return}const e=path.extname(f).toLowerCase();r.writeHead(200,{'content-type':e==='.html'?'text/html; charset=utf-8':e==='.js'?'application/javascript; charset=utf-8':e==='.css'?'text/css; charset=utf-8':'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(PORT,'127.0.0.1',()=>res(s))})}
(async()=>{
 const server=await serve();const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const p=await b.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.stack||e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto(`http://127.0.0.1:${PORT}/`);await p.waitForFunction(()=>window.BSCoreStore&&window.BSCoreStore.ready());await p.waitForTimeout(450);
 await p.evaluate(({fnMap})=>{const store=window.BSCoreStore,contact={id:'safe_c1',name:'小满',identity:'示例角色',avatar:''};if(store.commands.replaceContacts)store.commands.replaceContacts([contact]);if(store.commands.replaceChats)store.commands.replaceChats([]);DB.hangCid='safe_c1';Object.keys(fnMap).forEach(function(key){fnMap[key].forEach(function(name){const original=window[name];if(typeof original!=='function')throw new Error('missing renderer '+name);window[name]=function(){return '<div data-internal-app-sentinel="'+key+'">'+original.apply(this,arguments)+'</div>'}})});DB.ui.appearanceSubpage=null;DB.ui.appearancePage='background';go('appearance')},{fnMap});await p.waitForTimeout(500);
 async function click(sel){await p.locator(sel).evaluate(el=>el.click());await p.waitForTimeout(180)}
 await click('[data-ap-bg-refine-entry]');const appKeys=await p.evaluate(()=>APPS.map(a=>a.k));const results=[];
 for(const appKey of appKeys){
   await click(`[data-ap-refine-app="${appKey}"]`);
   const pages=await p.evaluate(k=>apInternalPages(k),appKey);
   for(const [pageKey,label] of pages){
     await click(`[data-ap-refine-page="${pageKey}"]`);
     const one=await p.evaluate(({appKey,pageKey,label})=>{const phone=document.querySelector('#apPreviewPhone');const home=phone?.querySelector('.ap-preview-home');const selected=(sel)=>home?.querySelector(sel)?.textContent?.trim()||'';return{appKey,pageKey,label,title:document.querySelector('.ap-subpage .ap-header h2')?.textContent||'',sentinel:!!phone?.querySelector(`[data-internal-app-sentinel="${appKey}"]`),errorText:phone?.innerText.includes('预览暂不可用')||false,textLength:(phone?.innerText||'').trim().length,weiboSelected:selected('.wbbottom .on'),hangSelected:selected('.tabs .tab.on'),coupleSelected:selected('.couple-tabs button.on'),hasBindingPrompt:phone?.innerText.includes('先选择情侣空间绑定')||false};},{appKey,pageKey,label});results.push(one);
     await click('#apSubpageBack');
   }
   await click('#apSubpageBack');
 }
 const expected=results.every(x=>x.sentinel&&!x.errorText&&x.textLength>0&&x.title===x.label);
 const weibo=results.filter(x=>x.appKey==='weibo');const hang=results.filter(x=>x.appKey==='hang');
 const weiboTabsOk=weibo.every(x=>({ 'weibo-home':'首页','weibo-discover':'发现','weibo-msg':'消息','weibo-me':'我'}[x.pageKey]||'')===x.weiboSelected);
 const hangTabsOk=hang.every(x=>({ 'hang-phone':'查手机','hang-doing':'此刻动态'}[x.pageKey]||'')===x.hangSelected);
 const ok=errors.length===0&&results.length===37&&expected&&weiboTabsOk&&hangTabsOk;
 const report={ok,errors,count:results.length,weiboTabsOk,hangTabsOk,results,note:'APP内精修页面由现有真实 App 页面/Tab渲染；已移除产品中不存在的占位页；情侣空间未绑定时展示真实绑定空状态。'};
 fs.writeFileSync(path.join(ROOT,'docs/testing/round139-internal-app-pages.json'),JSON.stringify(report,null,2)+'\n','utf8');console.log(JSON.stringify(report,null,2));
 await b.close();server.close();if(!ok)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exit(1)});

