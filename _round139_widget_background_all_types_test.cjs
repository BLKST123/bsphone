const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('E:/Codex/tools/node/bin/node_modules/playwright');
const ROOT=path.resolve('C:/Users/lenovo/Documents/ChatGPT/各种的/_ghpages'),PORT=18041;
const TYPES=['photo','photoSmall','stickerCollage','collage','musicPlayer','profileCard','folderPhoto','monthCalendar','clock','bubble','list','books','quote','note'];
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent((q.url||'/').split('?')[0]),f=path.join(ROOT,u==='/'?'index.html':u.replace(/^\/+/,''));if(!f.startsWith(ROOT)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);r.end();return}const e=path.extname(f).toLowerCase();r.writeHead(200,{'content-type':e==='.html'?'text/html; charset=utf-8':e==='.js'?'application/javascript; charset=utf-8':e==='.css'?'text/css; charset=utf-8':'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(PORT,'127.0.0.1',()=>res(s))})}
(async()=>{
  const server=await serve();const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errors=[];p.on('pageerror',e=>errors.push(e.stack||e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await p.goto(`http://127.0.0.1:${PORT}/`);await p.waitForFunction(()=>window.BSCoreStore&&window.BSCoreStore.ready());await p.waitForTimeout(500);
  const target=await p.evaluate(()=>{
    const L=userDesktopLayout();let found=null;
    L.pages.forEach(function(page,pi){(page||[]).forEach(function(e){if(!found&&e.type==='list')found={id:e.id,pageIndex:pi}})});
    if(!found)throw new Error('list widget missing');DB.ui.homePage=found.pageIndex;saveNow();DB.ui.appearanceSubpage=null;DB.ui.appearancePage='widgets';go('appearance');return found;
  });await p.waitForTimeout(500);
  await p.locator(`[data-ap-widget-edit="${target.id}"]`).click();await p.waitForTimeout(350);
  const before=await p.evaluate(()=>{const c=document.querySelector('[data-ap-widget-preview] .ud-card');return{hasBg:c?.classList.contains('ud-has-bg')||false,bgImage:(()=>{const b=c&&c.querySelector('.ud-card-bg');return b?getComputedStyle(b).backgroundImage:''})()}});
  const fc=p.waitForEvent('filechooser');await p.locator('[data-ap-widget-bg]').click();const chooser=await fc;await chooser.setFiles(path.join(ROOT,'icon-192.png'));await p.waitForTimeout(500);
  if(await p.locator('#crOk').count())await p.locator('#crOk').click();await p.waitForTimeout(500);
  const previewAfterUpload=await p.evaluate(()=>{const c=document.querySelector('[data-ap-widget-preview] .ud-card');return{className:c?.className||'',bgImage:(()=>{const b=c&&c.querySelector('.ud-card-bg');return b?getComputedStyle(b).backgroundImage:''})(),style:c?.getAttribute('style')||'',toast:document.querySelector('#toast')?.textContent||''}});
  await p.screenshot({path:path.join(ROOT,'docs/testing/round139-widget-background-upload-preview.png'),fullPage:false});
  await p.locator('[data-ap-widget-save]').click();await p.waitForTimeout(1000);
  const saved=await p.evaluate(({id,pageIndex})=>{const L=userDesktopLayout(),e=(L.pages[pageIndex]||[]).find(x=>x.id===id);return{stored:!!(e&&e.backgroundImage&&e.backgroundImage.startsWith('data:image')),length:e?.backgroundImage?.length||0,subpage:DB.ui.appearanceSubpage||null,homePage:DB.ui.homePage}},target);
  await p.reload();await p.waitForFunction(()=>window.BSCoreStore&&window.BSCoreStore.ready());await p.waitForTimeout(800);
  const afterReload=await p.evaluate(({id,pageIndex})=>{const L=userDesktopLayout(),e=(L.pages[pageIndex]||[]).find(x=>x.id===id);DB.ui.homePage=pageIndex;DB.ui.appearanceSubpage=null;go('home');render();return{stored:!!(e&&e.backgroundImage&&e.backgroundImage.startsWith('data:image')),length:e?.backgroundImage?.length||0}},target);await p.waitForTimeout(450);
  const homeCard=await p.evaluate(({id})=>{const item=document.querySelector(`.ud-item[data-user-card="${id}"]`),c=item?.querySelector('.ud-card');return{found:!!item,hasBg:!!c?.classList.contains('ud-has-bg'),bgImage:(()=>{const b=c&&c.querySelector('.ud-card-bg');return b?getComputedStyle(b).backgroundImage:''})(),direct:c?getComputedStyle(c).backgroundImage:''}},target);
  await p.screenshot({path:path.join(ROOT,'docs/testing/round139-widget-background-home.png'),fullPage:false});
  const png=fs.readFileSync(path.join(ROOT,'icon-192.png')).toString('base64');const bg='data:image/png;base64,'+png;
  const all=await p.evaluate(({types,bg})=>{
    const L=userDesktopLayout();while(L.pages.length<6)L.pages.push([]);
    const cards=types.map(function(type,i){const e={id:'round139_'+type,type:type,x:(i%4),y:Math.floor(i/4)*2,w:2,h:2,fields:{title:'示例',text:'示例内容'},images:[],photos:[],shape:'rounded',pattern:'none',backgroundImage:bg};if(type==='stickerCollage')e.photos=[{frameColor:'#f7f5f6',pattern:'none',caption:'示例 1'},{frameColor:'#f7f5f6',pattern:'none',caption:'示例 2'},{frameColor:'#f7f5f6',pattern:'none',caption:'示例 3'}];return e});
    L.pages[5]=cards;DB.ui.homePage=5;DB.ui.appearanceSubpage=null;saveNow();go('home');render();
    return cards.map(function(e){const item=document.querySelector(`.ud-item[data-user-card="${e.id}"]`),card=item?.querySelector('.ud-card');return{type:e.type,found:!!card,hasBg:!!card?.classList.contains('ud-has-bg'),bgImage:(()=>{const b=card&&card.querySelector('.ud-card-bg');return b?getComputedStyle(b).backgroundImage:''})(),direct:card?getComputedStyle(card).backgroundImage:'',text:(card?.innerText||'').trim().slice(0,50)}})
  },{types:TYPES,bg});await p.waitForTimeout(300);
  const directRender=await p.evaluate((types)=>types.map(function(t){const h=udCardHTML({id:'direct_'+t,type:t,fields:{title:'示例',text:'示例内容'},images:[],photos:[],backgroundImage:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nGQAAAAASUVORK5CYII='});return{type:t,hasClass:h.includes('ud-has-bg'),hasLayer:h.includes('ud-card-bg')}}),TYPES);
  const ok=errors.length===0&&before.hasBg===false&&previewAfterUpload.className.includes('ud-has-bg')&&previewAfterUpload.bgImage.includes('data:image')&&saved.stored&&saved.subpage===null&&afterReload.stored&&homeCard.found&&homeCard.hasBg&&homeCard.bgImage.includes('data:image')&&all.length===14&&all.every(x=>x.found&&x.hasBg&&x.bgImage.includes('data:image')&&(['photo','photoSmall','collage','folderPhoto'].indexOf(x.type)>=0||x.text.length>0))&&directRender.every(x=>x.hasClass&&x.hasLayer);
  const report={ok,errors,target,before,previewAfterUpload,saved,afterReload,homeCard,all,directRender};
  fs.writeFileSync(path.join(ROOT,'docs/testing/round139-widget-background-all-types.json'),JSON.stringify(report,null,2)+'\n','utf8');console.log(JSON.stringify(report,null,2));
  await b.close();server.close();if(!ok)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exit(1)});


