const fs=require('node:fs');const {chromium}=require('E:/Codex/tools/node/bin/node_modules/playwright');
const OUT='docs/testing/round149-cdp-device-semantics.json';
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9222');const p=b.contexts()[0].pages()[0];const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.waitForFunction(()=>window.BSCoreStore&&BSCoreStore.ready());
  const route=await p.evaluate(()=>({name:route.name,arg:route.arg}));if(route.name!=='chatroom')throw new Error('not in chatroom');
  await p.evaluate(()=>{chat(route.arg).replyMin=2;chat(route.arg).replyMax=2;save();callModel=()=>Promise.resolve('收到啦\n[红包] 9.99|回你一个');});
  const redBase=await p.evaluate(()=>chat(route.arg).msgs.length);
  await p.locator('#plusBtn').click();await p.locator('[data-plus="rp"]').click();await p.locator('#rp_amt').fill('9.99');await p.locator('#rp_note').fill('设备巡检红包');await p.locator('#fmOk').click();
  await p.waitForFunction(base=>{const msgs=chat(route.arg).msgs.slice(base);return msgs.some(m=>m.role==='sys'&&String(m.text||'').includes('领取了你的红包'));},redBase,{timeout:12000});
  const redpacket=await p.evaluate(base=>{const msgs=chat(route.arg).msgs.slice(base);const source=msgs.find(m=>m.role==='me'&&m.type==='redpacket');return {source:source?{id:source.id,type:source.type,opened:!!source.opened,note:source.note}:null,system:msgs.filter(m=>m.role==='sys').map(m=>String(m.text||'')),charRedpackets:msgs.filter(m=>m.role==='ta'&&m.type==='redpacket').length,ownCardHasClick:!!(source&&document.querySelector('[data-rp="'+source.id+'"]'))};},redBase);
  const beforeClick=await p.evaluate(()=>chat(route.arg).msgs.length);
  if(redpacket.source) await p.locator('[data-bub="'+redpacket.source.id+'"]').click();
  const afterClick=await p.evaluate(()=>chat(route.arg).msgs.length);
  if(await p.locator('#mvCancel').count()) await p.locator('#mvCancel').click();
  await p.evaluate(()=>{chat(route.arg).replyMin=3;chat(route.arg).replyMax=3;save();callModel=()=>Promise.resolve('我不能收，退回给你\n[转账] 13|已退回\n[转账] 13|我转回给你');});
  const tfBase=await p.evaluate(()=>chat(route.arg).msgs.length);
  await p.locator('#plusBtn').click();await p.locator('[data-plus="tf"]').click();await p.locator('#tf_amt').fill('13');await p.locator('#tf_note').fill('设备巡检退回');await p.locator('#fmOk').click();
  await p.waitForFunction(base=>{const msgs=chat(route.arg).msgs.slice(base);return msgs.some(m=>m.role==='me'&&m.type==='transfer'&&m.transferState==='returned')&&msgs.some(m=>m.role==='ta'&&m.type==='transfer');},tfBase,{timeout:12000});
  const returned=await p.evaluate(base=>{const msgs=chat(route.arg).msgs.slice(base);const source=msgs.find(m=>m.role==='me'&&m.type==='transfer');const charCards=msgs.filter(m=>m.role==='ta'&&m.type==='transfer');return {source:source?{type:source.type,amount:source.amount,claimed:!!source.claimed,state:source.transferState||''}:null,charTransferCount:charCards.length,charCards:charCards.map(m=>({note:m.note,state:m.transferState||'',claimed:!!m.claimed})),pendingAttrs:document.querySelectorAll('[data-tf]').length};},tfBase);
  const checks={
    redpacketSourceOpened:!!redpacket.source&&redpacket.source.opened,
    redpacketOwnCardNotClickable:redpacket.ownCardHasClick===false,
    redpacketSystemOnly:redpacket.system.filter(x=>x.includes('领取了你的红包')).length===1,
    redpacketNoCharCard:redpacket.charRedpackets===0,
    ownRedpacketClickNoClaim:afterClick===beforeClick,
    returnedOneCharCard:returned.charTransferCount===1,
    returnedOnlyReturnedCard:returned.charCards.length===1&&returned.charCards[0].note==='已退回'&&returned.charCards[0].state==='returned',
    returnedSourceSettled:!!returned.source&&returned.source.claimed&&returned.source.state==='returned',
    returnedNoPending:returned.pendingAttrs===0,
    noErrors:errors.length===0
  };
  const out={ok:Object.values(checks).every(Boolean),checkedAt:new Date().toISOString(),device:{model:'PMK110',android:'16',package:'com.xiaoshouji.app',version:'3.100',versionCode:111,transport:'WebView CDP'},route:{name:route.name},redpacket,returned,checks,errors};fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');console.log(JSON.stringify(out,null,2));await b.close();if(!out.ok)process.exitCode=1;})().catch(e=>{console.error(e.stack||e);process.exit(1)});
