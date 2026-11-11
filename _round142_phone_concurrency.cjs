const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('E:/Codex/tools/node/bin/node_modules/playwright');
const ROOT='C:/Users/lenovo/Documents/ChatGPT/各种的/_ghpages';
const OUT=path.join(ROOT,'docs/testing/round142-phone-concurrency.json');
(async()=>{
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9225');
 const page=browser.contexts()[0].pages()[0];
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.waitForFunction(()=>window.BSCoreStore&&BSCoreStore.ready(),null,{timeout:15000});
 const av='data:image/png;base64,'+fs.readFileSync(path.join(ROOT,'docs/testing/round140-9x16-test.png')).toString('base64');
 await page.evaluate(({av})=>{
  closeSheetAll();const s=BSCoreStore,n=Date.now();
  s.commands.replaceContacts([{id:'c1',name:'阿梨',remark:'阿梨',avatar:av,groupId:'def',memories:[]}],{persist:false});
  s.commands.replacePersonas([{id:'p1',name:'小满',avatar:av,wallet:{balance:100,history:[],cards:[],currencyAccounts:{}}}],{persist:false});
  s.commands.setActivePersona('p1',{persist:false});
  const mk=id=>({id,type:'private',memberIds:['c1'],charPersonaIds:['c1'],personaId:'p1',unread:0,lastTs:n,created:n,msgs:[],replyMin:1,replyMax:1,groupIds:[]});
  s.commands.replaceChats([mk('same'),mk('A'),mk('B')],{persist:false});
  DB.api.key='qa-key';DB.memorySettings.autoSummaryEnabled=false;fixAll();saveNow();
  window.__qaCalls=0;
  window.callModel=(messages,opts)=>{window.__qaCalls=(window.__qaCalls||0)+1;const call=window.__qaCalls;return new Promise((resolve,reject)=>{const t=setTimeout(()=>resolve('[文字]'+opts.chatId+' 回复'+call),opts.chatId==='A'?360:opts.chatId==='B'?1200:call===1?5000:1000);if(opts.signal)opts.signal.addEventListener('abort',()=>{clearTimeout(t);reject(Object.assign(new Error('aborted'),{name:'AbortError'}));},{once:true});});};
 },{av});
 await page.evaluate(()=>{route={name:'chatroom',arg:'same'};render();window.__qaOld=aiTurn({chatId:'same'});});await page.waitForTimeout(100);
 const sameBefore=await page.evaluate(()=>({tip:document.querySelector('.chatwrap .ttl .tip')?.textContent||'',active:chatRequestControllers.has('same')}));
 await page.evaluate(()=>{window.__qaNew=aiTurn({chatId:'same'});});await page.waitForTimeout(180);
 const sameAfterReplace=await page.evaluate(()=>({tip:document.querySelector('.chatwrap .ttl .tip')?.textContent||'',title:document.querySelector('.chatwrap .ttl')?.innerText||'',active:chatRequestControllers.has('same')}));
 const sameFinal=await page.evaluate(async()=>{await Promise.allSettled([window.__qaOld,window.__qaNew]);return{tip:document.querySelector('.chatwrap .ttl .tip')?.textContent||'',active:chatRequestControllers.has('same'),texts:chat('same').msgs.map(m=>m.text)}});
 await page.evaluate(()=>{const s=BSCoreStore,n=Date.now();s.commands.replaceChats([{id:'A',type:'private',memberIds:['c1'],charPersonaIds:['c1'],personaId:'p1',unread:0,lastTs:n,created:n,msgs:[],replyMin:1,replyMax:1,groupIds:[]},{id:'B',type:'private',memberIds:['c1'],charPersonaIds:['c1'],personaId:'p1',unread:0,lastTs:n,created:n,msgs:[],replyMin:1,replyMax:1,groupIds:[]}],{persist:false});window.callModel=(messages,opts)=>new Promise(resolve=>setTimeout(()=>resolve('[文字]'+opts.chatId+' 回复'),opts.chatId==='A'?360:1200));route={name:'chatroom',arg:'A'};render();window.__qaA=aiTurn({chatId:'A'});});
 await page.waitForTimeout(60);await page.evaluate(()=>{route={name:'chatroom',arg:'B'};render();window.__qaB=aiTurn({chatId:'B'});});await page.waitForTimeout(180);
 const crossInitial=await page.evaluate(()=>({tip:document.querySelector('.chatwrap .ttl .tip')?.textContent||'',aActive:chatRequestControllers.has('A'),bActive:chatRequestControllers.has('B')}));
 await page.waitForTimeout(650);
 const crossAfterA=await page.evaluate(()=>({tip:document.querySelector('.chatwrap .ttl .tip')?.textContent||'',aActive:chatRequestControllers.has('A'),bActive:chatRequestControllers.has('B')}));
 await page.screenshot({path:path.join(ROOT,'docs/testing/round142-phone-concurrency.png')});
 const crossFinal=await page.evaluate(async()=>{await window.__qaB;await new Promise(r=>setTimeout(r,50));return{tip:document.querySelector('.chatwrap .ttl .tip')?.textContent||'',title:document.querySelector('.chatwrap .ttl')?.innerText||'',aActive:chatRequestControllers.has('A'),bActive:chatRequestControllers.has('B'),aMsgs:chat('A').msgs.map(m=>m.text),bMsgs:chat('B').msgs.map(m=>m.text)}});
 const checks={sameChatReplacement:sameBefore.tip==='对方正在输入……'&&sameAfterReplace.tip==='对方正在输入……'&&sameAfterReplace.active&&sameFinal.texts.includes('same 回复2'),crossAEndsFirst:crossInitial.aActive&&crossInitial.bActive&&crossAfterA.tip==='对方正在输入……'&&!crossAfterA.aActive&&crossAfterA.bActive,crossBFinishes:crossFinal.tip===''&&!crossFinal.bActive&&crossFinal.bMsgs.some(x=>x.includes('B 回复'))&&crossFinal.aMsgs.some(x=>x.includes('A 回复')),noRuntimeErrors:errors.length===0};
 const out={ok:Object.values(checks).every(Boolean),checkedAt:new Date().toISOString(),device:{model:'OPPO PMK110',android:'16',viewport:await page.evaluate(()=>innerWidth+'x'+innerHeight)},source:{indexSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'index.html'))).digest('hex').toUpperCase()},checks,sameBefore,sameAfterReplace,sameFinal,crossInitial,crossAfterA,crossFinal,errors};
 fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');console.log(JSON.stringify(out,null,2));await browser.close();if(!out.ok)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exit(1)});



