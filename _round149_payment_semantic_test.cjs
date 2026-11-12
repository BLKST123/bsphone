const fs=require('node:fs');const path=require('node:path');const http=require('node:http');const crypto=require('node:crypto');const {chromium}=require('E:/Codex/tools/node/bin/node_modules/playwright');
const ROOT=path.resolve('C:/Users/lenovo/Documents/ChatGPT/各种的/_ghpages'),PORT=18149,OUT=path.join(ROOT,'docs/testing/round149-payment-semantics.json');
function serve(){return new Promise(resolve=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent((q.url||'/').split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u.replace(/^\/+/,''));if(!f.startsWith(ROOT)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':path.extname(f).toLowerCase()==='.html'?'text/html; charset=utf-8':'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(PORT,'127.0.0.1',()=>resolve(s))})}
(async()=>{const server=await serve();const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const p=await b.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:${PORT}/`);await p.waitForFunction(()=>window.BSCoreStore&&BSCoreStore.ready());await p.evaluate(()=>{const px='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nGQAAAAASUVORK5CYII=';const s=BSCoreStore,n=Date.now();s.commands.replaceContacts([{id:'c1',name:'阿梨',avatar:px,groupId:'def',memories:[]}],{persist:false});s.commands.replacePersonas([{id:'p1',name:'小满',avatar:px,wallet:{balance:100,history:[],cards:[],currencyAccounts:{}}}],{persist:false});s.commands.setActivePersona('p1',{persist:false});s.commands.replaceChats([{id:'c',type:'private',memberIds:['c1'],charPersonaIds:['c1'],personaId:'p1',unread:0,lastTs:n,created:n,msgs:[],groupIds:[],replyMin:3,replyMax:3}],{persist:false});DB.api.key='test';DB.memorySettings.autoSummaryEnabled=false;fixAll();route={name:'chatroom',arg:'c'};render();});
const result=await p.evaluate(async()=>{
  const clear=()=>{chat('c').msgs.length=0;saveNow();render();};
  const snapshot=()=>({msgs:chat('c').msgs.map(m=>({role:m.role,type:m.type,note:m.note,amount:m.amount,opened:!!m.opened,claimed:!!m.claimed,transferState:m.transferState||'',text:m.text})),notices:[...document.querySelectorAll('.sysline')].map(x=>x.textContent),ownRedpacketCards:document.querySelectorAll('[data-rp]').length});
  clear();pushMsg('c',{role:'me',type:'redpacket',amount:8.88,note:'测试红包'});callModel=()=>Promise.resolve('好，我收下啦\n[红包] 8.88|回你一个');await aiTurn({chatId:'c',nudge:'测试红包领取'});const redpacket=snapshot();
  clear();pushMsg('c',{role:'me',type:'transfer',amount:12,note:'测试转账'});callModel=()=>Promise.resolve('我不能收，退回给你\n[转账] 12|已退回\n[转账] 12|我转回给你');await aiTurn({chatId:'c',nudge:'测试转账退回'});const returned=snapshot();
  clear();pushMsg('c',{role:'me',type:'transfer',amount:12,note:'测试转账'});callModel=()=>Promise.resolve('好，我收下啦\n[转账] 12|已收款');await aiTurn({chatId:'c',nudge:'测试转账收款'});const received=snapshot();
  clear();const charRp=pushCharStructuredCard(chat('c'),ct('c1'),{type:'redpacket',amount:6.66,note:'给你红包'},false);render();const charRpAttr=document.querySelector('[data-rp="'+charRp.id+'"]');if(charRpAttr)charRpAttr.click();const charRedpacket=snapshot();
  return {redpacket,returned,received,charRedpacket};
});
const count=(s,fn)=>s.msgs.filter(fn).length;const checks={
  userRedpacketCannotSelfClaim:result.redpacket.ownRedpacketCards===0,
  userRedpacketOneSystem:result.redpacket.notices.filter(x=>x.includes('阿梨领取了你的红包')).length===1,
  userRedpacketNoCharCard:count(result.redpacket,m=>m.role==='ta'&&m.type==='redpacket')===0,
  userRedpacketSourceOpened:result.redpacket.msgs.some(m=>m.role==='me'&&m.type==='redpacket'&&m.opened),
  returnedOneCharCard:count(result.returned,m=>m.role==='ta'&&m.type==='transfer')===1,
  returnedOnlyReturned:result.returned.msgs.some(m=>m.role==='ta'&&m.type==='transfer'&&m.note==='已退回'&&m.transferState==='returned'),
  returnedSourceSettled:result.returned.msgs.some(m=>m.role==='me'&&m.type==='transfer'&&m.transferState==='returned'&&m.claimed),
  receivedOneCharCard:count(result.received,m=>m.role==='ta'&&m.type==='transfer')===1,
  receivedOnlyReceived:result.received.msgs.some(m=>m.role==='ta'&&m.type==='transfer'&&m.note==='已收款'&&m.transferState==='received'),
  charRedpacketStillClickable:result.charRedpacket.notices.some(x=>x.includes('你领取了阿梨的红包')),
  noErrors:errors.length===0
};
const out={ok:Object.values(checks).every(Boolean),checkedAt:new Date().toISOString(),sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'index.html'))).digest('hex').toUpperCase(),checks,result,errors};fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');console.log(JSON.stringify(out,null,2));await b.close();server.close();if(!out.ok)process.exitCode=1})().catch(e=>{console.error(e.stack||e);process.exit(1)});
