const fs=require('node:fs');
const {chromium}=require('E:/Codex/tools/node/bin/node_modules/playwright');
const OUT='docs/testing/round148-cdp-device-transfer.json';
const md5=require('node:crypto').createHash('sha256');
(async()=>{
  const browser=await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page=browser.contexts()[0].pages()[0];
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.waitForFunction(()=>window.BSCoreStore&&BSCoreStore.ready());
  const routeInfo=await page.evaluate(()=>({name:route.name,arg:route.arg,chatCount:(DB.chats||[]).length}));
  const initial=await page.evaluate(()=>{
    const ch=chat(route.arg);
    return {route:route.name,chatId:ch.id,msgs:(ch.msgs||[]).map(m=>({id:m.id,role:m.role,type:m.type,amount:m.amount,note:m.note,claimed:!!m.claimed,transferState:m.transferState||'',hasTf:false}))};
  });
  const cards=page.locator('.msg-card');
  const cardCount=await cards.count();
  if(!cardCount) throw new Error('当前新会话没有转账卡');
  await cards.last().click();
  const settledMenu=await page.evaluate(()=>({
    on:document.querySelector('#sheet').classList.contains('on'),
    labels:[...document.querySelectorAll('#sheetBox button')].map(x=>x.innerText.trim()).filter(Boolean),
    hasTransferControls:!!document.querySelector('#transferReceive')||!!document.querySelector('#transferReturn')
  }));
  await page.locator('#mvCancel').click();

  async function createPending(amount,note){
    return page.evaluate(({amount,note})=>{
      const ch=chat(route.arg),c=ct(ch.memberIds[0]);
      const card=pushCharStructuredCard(ch,c,{type:'transfer',amount:amount,note:note},false);
      render();
      return card.id;
    },{amount,note});
  }
  async function choose(id,button){
    await page.locator(`[data-tf="${id}"]`).click();
    const modal=await page.evaluate(()=>({on:document.querySelector('#sheet').classList.contains('on'),center:document.querySelector('#sheet').classList.contains('center'),text:document.querySelector('#sheetBox').innerText.trim(),buttons:[...document.querySelectorAll('#sheetBox button')].map(x=>x.innerText.trim())}));
    await page.locator(button).click();
    return modal;
  }
  const pendingReceive=await createPending(5.55,'设备巡检转入');
  const receiveModal=await choose(pendingReceive,'#transferReceive');
  const receiveState=await page.evaluate(id=>{
    const ch=chat(route.arg);
    return {pending:ch.msgs.find(m=>m.id===id)||null,receipts:ch.msgs.filter(m=>m.replyToTransferId===id).map(m=>({role:m.role,note:m.note,state:m.transferState,claimed:!!m.claimed})),hasTf:!!document.querySelector('[data-tf]')};
  },pendingReceive);
  const pendingReturn=await createPending(6.66,'设备巡检退回');
  const returnModal=await choose(pendingReturn,'#transferReturn');
  const returnState=await page.evaluate(id=>{
    const ch=chat(route.arg);
    return {pending:ch.msgs.find(m=>m.id===id)||null,receipts:ch.msgs.filter(m=>m.replyToTransferId===id).map(m=>({role:m.role,note:m.note,state:m.transferState,claimed:!!m.claimed})),hasTf:!!document.querySelector('[data-tf]')};
  },pendingReturn);
  const final=await page.evaluate(()=>{
    const ch=chat(route.arg);
    return {route:route.name,totalMessages:(ch.msgs||[]).length,settledTransfers:(ch.msgs||[]).filter(m=>m.type==='transfer'&&(m.claimed||m.transferState)).length,pendingTransferCards:[...document.querySelectorAll('[data-tf]')].length,sheetVisible:document.querySelector('#sheet').classList.contains('on')};
  });
  const menuLabels=settledMenu.labels;
  const checks={
    currentNewChat:routeInfo.name==='chatroom'&&initial.msgs.length>=2,
    initialUserTransferSettled:initial.msgs.some(m=>m.role==='me'&&m.type==='transfer'&&m.transferState==='received'&&m.claimed),
    initialCharReceiptSettled:initial.msgs.some(m=>m.role==='ta'&&m.type==='transfer'&&m.note==='已收款'&&m.transferState==='received'&&m.claimed),
    settledMenuExact:settledMenu.on&&['复制文字','引用','收藏','删除','取消'].every(x=>menuLabels.includes(x))&&!settledMenu.hasTransferControls,
    receiveModal:receiveModal.on&&receiveModal.center&&receiveModal.text.includes('¥ 5.55')&&receiveModal.buttons.includes('收款')&&receiveModal.buttons.includes('退回'),
    receiveSourceSettled:!!receiveState.pending&&receiveState.pending.claimed&&receiveState.pending.transferState==='received',
    receiveUserReceipt:receiveState.receipts.some(m=>m.role==='me'&&m.note==='已收款'&&m.state==='received'&&m.claimed),
    receiveNoPending:receiveState.hasTf===false,
    returnModal:returnModal.on&&returnModal.center&&returnModal.text.includes('¥ 6.66')&&returnModal.buttons.includes('收款')&&returnModal.buttons.includes('退回'),
    returnSourceSettled:!!returnState.pending&&returnState.pending.claimed&&returnState.pending.transferState==='returned',
    returnUserReceipt:returnState.receipts.some(m=>m.role==='me'&&m.note==='已退回'&&m.state==='returned'&&m.claimed),
    returnNoPending:returnState.hasTf===false,
    finalNoPending:final.pendingTransferCards===0,
    noPageErrors:errors.length===0
  };
  const out={ok:Object.values(checks).every(Boolean),checkedAt:new Date().toISOString(),device:{model:'PMK110',android:'16',package:'com.xiaoshouji.app',version:'3.99',versionCode:110,transport:'WebView CDP'},route:routeInfo,initial,settledMenu,receiveModal,receiveState,returnModal,returnState,checks,final,errors};
  fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');
  console.log(JSON.stringify(out,null,2));
  await browser.close();
  if(!out.ok)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
