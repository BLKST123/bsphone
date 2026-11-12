const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const {chromium}=require('E:/Codex/tools/node/bin/node_modules/playwright');
const ROOT=path.resolve('C:/Users/lenovo/Documents/ChatGPT/各种的/_ghpages');
const PORT=18126;
const OUT=path.join(ROOT,'docs/testing/round146-transfer-decision.json');
function serve(){
  return new Promise(resolve=>{
    const server=http.createServer((req,res)=>{
      const u=decodeURIComponent((req.url||'/').split('?')[0]);
      const file=path.join(ROOT,u==='/'?'index.html':u.replace(/^\/+/,''));
      if(!file.startsWith(ROOT)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
      const ext=path.extname(file).toLowerCase();
      const type=ext==='.html'?'text/html; charset=utf-8':ext==='.js'?'text/javascript; charset=utf-8':ext==='.json'?'application/json; charset=utf-8':'application/octet-stream';
      res.writeHead(200,{'content-type':type});
      fs.createReadStream(file).pipe(res);
    });
    server.listen(PORT,'127.0.0.1',()=>resolve(server));
  });
}
(async()=>{
  const server=await serve();
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/`);
  await page.waitForFunction(()=>window.BSCoreStore&&BSCoreStore.ready());
  await page.evaluate(()=>{
    const px='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nGQAAAAASUVORK5CYII=';
    const s=BSCoreStore,n=Date.now();
    s.commands.replaceContacts([{id:'c1',name:'阿梨',avatar:px,groupId:'def',memories:[]}],{persist:false});
    s.commands.replacePersonas([{id:'p1',name:'小满',avatar:px,wallet:{balance:100,history:[],cards:[],currencyAccounts:{}}}],{persist:false});
    s.commands.setActivePersona('p1',{persist:false});
    s.commands.replaceChats([{id:'c',type:'private',memberIds:['c1'],charPersonaIds:['c1'],personaId:'p1',unread:0,lastTs:n,created:n,msgs:[],groupIds:[],replyMin:1,replyMax:1}],{persist:false});
    fixAll();route={name:'chatroom',arg:'c'};render();
  });
  function reset(){return page.evaluate(()=>{chat('c').msgs.length=0;saveNow();render();});}
  function snapshot(){return page.evaluate(()=>({msgs:chat('c').msgs.map(m=>({id:m.id,role:m.role,type:m.type,note:m.note,amount:m.amount,claimed:!!m.claimed,transferState:m.transferState,opened:!!m.opened,text:m.text})),tf:document.querySelectorAll('[data-tf]').length}));}
  async function openPendingCharTransfer(){
    return page.evaluate(()=>{
      const card=pushCharStructuredCard(chat('c'),ct('c1'),{type:'transfer',amount:88,note:'测试转账'},false);render();
      const el=document.querySelector('[data-tf="'+card.id+'"]');
      if(!el) throw new Error('pending char transfer not rendered');
      el.click();
      return {id:card.id,center:document.querySelector('#sheet').classList.contains('center'),on:document.querySelector('#sheet').classList.contains('on'),text:document.querySelector('#sheetBox').innerText,amount:document.querySelector('#sheetBox').innerText.includes('¥ 88.00'),receive:!!document.querySelector('#transferReceive'),return:!!document.querySelector('#transferReturn')};
    });
  }
  async function settleAndOpenMenu(buttonSelector){
    return page.evaluate(sel=>{document.querySelector(sel).click();return{msgs:chat('c').msgs.map(m=>({id:m.id,role:m.role,type:m.type,note:m.note,amount:m.amount,claimed:!!m.claimed,transferState:m.transferState,text:m.text})),tf:document.querySelectorAll('[data-tf]').length,sheetOn:document.querySelector('#sheet').classList.contains('on'),transferControls:!!document.querySelector('#transferReceive')||!!document.querySelector('#transferReturn')};},buttonSelector).then(async state=>{
      const menu=await page.evaluate(()=>{
        const el=document.querySelector('.msg-card');
        if(!el) throw new Error('settled transfer card missing');
        el.click();
        return {on:document.querySelector('#sheet').classList.contains('on'),text:document.querySelector('#sheetBox').innerText,hasReceive:!!document.querySelector('#transferReceive'),hasReturn:!!document.querySelector('#transferReturn')};
      });
      return {state,menu};
    });
  }
  await reset();
  const modal=await openPendingCharTransfer();
  const received=await settleAndOpenMenu('#transferReceive');
  await reset();
  const returnModal=await openPendingCharTransfer();
  const returned=await settleAndOpenMenu('#transferReturn');
  const userReceived=await page.evaluate(()=>{
    chat('c').msgs.length=0;const src=pushMsg('c',{role:'me',type:'transfer',amount:66,note:'给阿梨'});settlePendingPaymentAfterReply(chat('c'),ct('c1'),'好，我收下啦');render();
    return {source:src.id,msgs:chat('c').msgs.map(m=>({role:m.role,type:m.type,note:m.note,amount:m.amount,claimed:!!m.claimed,transferState:m.transferState,text:m.text}))};
  });
  const userReturned=await page.evaluate(()=>{
    chat('c').msgs.length=0;const src=pushMsg('c',{role:'me',type:'transfer',amount:77,note:'给阿梨'});settlePendingPaymentAfterReply(chat('c'),ct('c1'),'我不能收，退回给你');render();
    return {source:src.id,msgs:chat('c').msgs.map(m=>({role:m.role,type:m.type,note:m.note,amount:m.amount,claimed:!!m.claimed,transferState:m.transferState,text:m.text}))};
  });
  const structuredNoDuplicate=await page.evaluate(()=>{
    chat('c').msgs.length=0;const src=pushMsg('c',{role:'me',type:'transfer',amount:99,note:'给阿梨'});pushCharStructuredCard(chat('c'),ct('c1'),{type:'transfer',amount:99,note:'已退回'},false);settlePendingPaymentAfterReply(chat('c'),ct('c1'),'已退回');render();
    const cards=chat('c').msgs.filter(m=>m.role==='ta'&&m.type==='transfer');
    return {source:src.id,count:cards.length,cards:cards.map(m=>({note:m.note,state:m.transferState,claimed:!!m.claimed,text:m.text}))};
  });
  const redpacketRegression=await page.evaluate(()=>{
    chat('c').msgs.length=0;const rp=pushMsg('c',{role:'me',type:'redpacket',amount:8.88,note:'测试红包'});settlePendingPaymentAfterReply(chat('c'),ct('c1'),'收到啦');render();
    return {opened:!!chat('c').msgs.find(m=>m.id===rp.id&&m.opened),sys:chat('c').msgs.filter(m=>m.role==='sys').map(m=>m.text),dom:[...document.querySelectorAll('.sysline')].map(x=>x.textContent)};
  });
  const checks={
    modalCentered:!!modal.center&&!!modal.on,
    modalAmount:!!modal.amount,
    modalButtons:!!modal.receive&&!!modal.return,
    receivedSourceSettled:received.state.msgs.some(m=>m.role==='ta'&&m.note==='测试转账'&&m.transferState==='received'&&m.claimed),
    receivedUserCard:received.state.msgs.some(m=>m.role==='me'&&m.type==='transfer'&&m.note==='已收款'&&m.transferState==='received'&&m.claimed),
    receivedNoPending:received.state.tf===0,
    receivedMenu:received.menu.on&&['复制文字','引用','收藏','删除','取消'].every(x=>received.menu.text.includes(x))&&!received.menu.hasReceive&&!received.menu.hasReturn,
    returnedSourceSettled:returned.state.msgs.some(m=>m.role==='ta'&&m.note==='测试转账'&&m.transferState==='returned'&&m.claimed),
    returnedUserCard:returned.state.msgs.some(m=>m.role==='me'&&m.type==='transfer'&&m.note==='已退回'&&m.transferState==='returned'&&m.claimed),
    returnedNoPending:returned.state.tf===0,
    returnedMenu:returned.menu.on&&['复制文字','引用','收藏','删除','取消'].every(x=>returned.menu.text.includes(x))&&!returned.menu.hasReceive&&!returned.menu.hasReturn,
    userTransferReceived:userReceived.msgs.some(m=>m.role==='ta'&&m.type==='transfer'&&m.note==='已收款'&&m.transferState==='received'&&m.claimed),
    userTransferReturned:userReturned.msgs.some(m=>m.role==='ta'&&m.type==='transfer'&&m.note==='已退回'&&m.transferState==='returned'&&m.claimed),
    structuredReceiptNoDuplicate:structuredNoDuplicate.count===1&&structuredNoDuplicate.cards[0].state==='returned',
    redpacketRegression:redpacketRegression.opened&&redpacketRegression.sys.some(x=>x.includes('阿梨领取了你的红包'))&&redpacketRegression.dom.some(x=>x.includes('阿梨领取了你的红包')),
    noErrors:errors.length===0
  };
  const out={ok:Object.values(checks).every(Boolean),checkedAt:new Date().toISOString(),source:{indexSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'index.html'))).digest('hex').toUpperCase()},checks,modal,received,returnModal,returned,userReceived,userReturned,structuredNoDuplicate,redpacketRegression,errors};
  fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');console.log(JSON.stringify(out,null,2));
  await browser.close();server.close();if(!out.ok)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
