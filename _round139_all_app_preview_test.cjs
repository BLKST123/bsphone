const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('E:/Codex/tools/node/bin/node_modules/playwright');
const ROOT=path.resolve('C:/Users/lenovo/Documents/ChatGPT/各种的/_ghpages'),PORT=18040;
const cases=[
  ['wechat','screenWechat'],['novel','screenNovelHome'],['diary','screenDiary'],['forum','screenForum'],['gallery','screenGallery'],['hang','screenHang'],
  ['date','screenDate'],['out','screenOut'],['shop','screenTaobao'],['takeout','screenTakeout'],['clock','screenClock'],['couple','screenCouple'],
  ['soul','screenSoul'],['music','screenMusic'],['weibo','screenWeibo'],['world','screenWorldBooks'],['regex','screenRegexList'],['settings','screenSettings']
];
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent((q.url||'/').split('?')[0]),f=path.join(ROOT,u==='/'?'index.html':u.replace(/^\/+/,''));if(!f.startsWith(ROOT)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);r.end();return}const e=path.extname(f).toLowerCase();r.writeHead(200,{'content-type':e==='.html'?'text/html; charset=utf-8':e==='.js'?'application/javascript; charset=utf-8':e==='.css'?'text/css; charset=utf-8':'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(PORT,'127.0.0.1',()=>res(s))})}
(async()=>{
  const server=await serve();const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const p=await b.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.stack||e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await p.goto(`http://127.0.0.1:${PORT}/`);await p.waitForFunction(()=>window.BSCoreStore&&window.BSCoreStore.ready());await p.waitForTimeout(450);
  await p.evaluate((cases)=>{
    const store=window.BSCoreStore;
    if(store&&store.commands){if(store.commands.replaceContacts)store.commands.replaceContacts([]);if(store.commands.replaceChats)store.commands.replaceChats([])}
    cases.forEach(function(c){const original=window[c[1]];if(typeof original!=='function')throw new Error('missing renderer '+c[1]);window[c[1]]=function(){return '<div data-app-render-sentinel="'+c[0]+'">'+original.apply(this,arguments)+'</div>'}});
    DB.ui.appearanceSubpage=null;DB.ui.appearancePage='background';go('appearance');
  },cases);await p.waitForTimeout(500);
  const results=[];
  for(const [key,fn] of cases){
    await p.locator(`[data-ap-bg-app="${key}"]`).evaluate(el=>el.click());await p.waitForTimeout(280);
    const one=await p.evaluate(({key,fn})=>{
      const phone=document.querySelector('#apPreviewPhone'),home=phone&&phone.querySelector('.ap-preview-home'),dev=phone&&phone.querySelector('.ap-preview-device');
      const actions=[...document.querySelectorAll('.ap-subpage-actions .ap-action')];
      return {key,fn,title:document.querySelector('.ap-subpage .ap-header h2')?.textContent||'',sentinel:!!phone?.querySelector(`[data-app-render-sentinel="${key}"]`),errorText:phone?.innerText.includes('预览暂不可用')||false,textLength:(phone?.innerText||'').trim().length,previewHeight:phone?.getBoundingClientRect().height||0,deviceWidth:dev?.getBoundingClientRect().width||0,deviceHeight:dev?.getBoundingClientRect().height||0,actions:actions.map(x=>x.textContent.trim()),allActionsVisible:actions.length===4&&actions.every(x=>{const r=x.getBoundingClientRect();return r.width>300&&r.height>=44})};
    },{key,fn});results.push(one);
    await p.locator('#apSubpageBack').click();await p.waitForTimeout(220);
  }
  const ok=errors.length===0&&results.length===18&&results.every(x=>x.sentinel&&!x.errorText&&x.textLength>0&&x.previewHeight>300&&x.deviceWidth>0&&x.deviceHeight>0&&x.actions.join('|')==='从相册选择|上传图片|恢复该范围默认|应用'&&x.allActionsVisible);
  const report={ok,errors,cases:results,note:'每个预览函数均注入 sentinel，并确认外观页实际调用对应真实 App 渲染函数，不是手绘预览。'};
  fs.writeFileSync(path.join(ROOT,'docs/testing/round139-all-app-preview.json'),JSON.stringify(report,null,2)+'\n','utf8');console.log(JSON.stringify(report,null,2));
  await b.close();server.close();if(!ok)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
