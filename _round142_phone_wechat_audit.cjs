const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require('E:/Codex/tools/node/bin/node_modules/playwright');
const ROOT='C:/Users/lenovo/Documents/ChatGPT/各种的/_ghpages';
const OUT=path.join(ROOT,'docs/testing/round142-phone-wechat-audit.json');
const ADB='E:/Codex/tools/android-sdk/platform-tools/adb.exe';
(async()=>{
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9225');
 const page=browser.contexts()[0].pages()[0];
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.waitForFunction(()=>window.BSCoreStore&&BSCoreStore.ready(),null,{timeout:15000});
 const av='data:image/png;base64,'+fs.readFileSync(path.join(ROOT,'docs/testing/round140-9x16-test.png')).toString('base64');
 await page.evaluate(({av})=>{
  closeSheetAll();
  const s=BSCoreStore,n=Date.now();
  s.commands.replaceContacts([{id:'c1',name:'阿梨',remark:'阿梨',avatar:av,groupId:'def',memories:[]}],{persist:false});
  s.commands.replacePersonas([
   {id:'p1',name:'小满',avatar:av,wallet:{balance:100,history:[],cards:[{id:'a1',bank:'示例银行',no:'6222000011111111',holder:'小满',holderType:'user',holderId:'p1',expiry:'08/28',color:'#5b5d63',pattern:'哑光',order:0}],currencyAccounts:{}}},
   {id:'p2',name:'白桃',avatar:av,wallet:{balance:20,history:[],cards:[],currencyAccounts:{}}}
  ],{persist:false});
  s.commands.setActivePersona('p1',{persist:false});
  DB.takeout.orders=[{id:'o1',orderNo:'BS1411',personaId:'p1',chatId:'c',contactId:'c1',source:'contact',payer:'contact',orderedFor:'me',merchant:'云朵甜品',items:[{name:'草莓蛋糕',price:68,qty:1}],note:'趁热吃',goodsTotal:68,packFee:2,deliveryFee:3,total:73,status:'delivering',createdAt:n,timeline:[]}];
  s.commands.replaceChats([{id:'c',type:'private',memberIds:['c1'],charPersonaIds:['c1'],personaId:'p1',sessionLabel:'项目会话',sessionLabelCustom:true,unread:0,lastTs:n,created:n,groupIds:[],replyMin:1,replyMax:1,msgs:[
   {id:'r',role:'ta',from:'c1',type:'redpacket',amount:52,note:'给你买奶茶',ts:n-4},
   {id:'t',role:'ta',from:'c1',type:'transfer',amount:200,note:'拿去用',ts:n-3},
   {id:'o',role:'ta',from:'c1',type:'takeout',orderId:'o1',status:'delivering',text:'外卖在路上',ts:n-2},
   {id:'d',role:'ta',from:'c1',type:'order',merchant:'云朵商城',items:['手机壳'],amount:39,status:'已发货',note:'物流更新',orderNo:'BS1412',ts:n-1},
   {id:'v',role:'ta',from:'c1',type:'voice',text:'示例语音',duration:9,ts:n}
  ]}],{persist:false});
  DB.favorites=[{id:'f1',who:'阿梨',text:'示例语音',type:'voice',category:'消息',chatId:'c',msgId:'v',ts:n,snapshot:{type:'voice',duration:9,text:'示例语音'}}];
  DB.ui.theme='sakura';fixAll();route={name:'chatroom',arg:'c'};render();
 },{av});
 await page.waitForTimeout(300);
 const cards=await page.evaluate(()=>{const box=s=>{const r=document.querySelector(s)?.getBoundingClientRect();return r&&{w:r.width,h:r.height}};return{qq:innerWidth+'x'+innerHeight,build:BUILD_CODE,types:document.querySelectorAll('.rp-redpacket,.rp-transfer,.takeout-msg,.order-msg').length,voice:box('#chVoiceCall'),video:box('#chVideoCall'),more:box('#chMenu')}});
 await page.screenshot({path:path.join(ROOT,'docs/testing/round142-phone-wechat-cards.png')});
 await page.evaluate(()=>sheetChatMenu(chat('c')));await page.waitForTimeout(300);
 const menu=await page.evaluate(()=>({groups:[...document.querySelectorAll('.chat-menu-group>.sechead')].map(x=>x.textContent),all44:[...document.querySelectorAll('button[id^="cm"]')].every(x=>{const r=x.getBoundingClientRect();return r.height>=43.999&&r.width>=43.999})}));
 await page.screenshot({path:path.join(ROOT,'docs/testing/round142-phone-chat-menu.png')});
 await page.evaluate(()=>closeSheet());await page.evaluate(()=>sheetFavs());await page.waitForTimeout(150);
 const fav=await page.evaluate(()=>{const r=document.querySelector('[data-fmore="f1"]')?.getBoundingClientRect();return{voice:!!document.querySelector('.favorite-voice'),more:r&&{w:r.width,h:r.height},transcript:document.querySelector('.favorite-transcript')?.style.display||''}});
 await page.screenshot({path:path.join(ROOT,'docs/testing/round142-phone-favorites.png')});
 await page.evaluate(()=>closeSheet());
 const personaPrecondition=await page.evaluate(()=>{wtab='mine';go('wechat');render();setActivePersonaSafe('p1');saveNow();render();return{active:DB.me.personaId,count:document.querySelector('[data-mgo="cards"] .d')?.textContent}});
 await page.waitForTimeout(200);
 await page.evaluate(()=>sheetPersona());await page.waitForTimeout(120);
 const personaHome=await page.evaluate(()=>({use:document.querySelectorAll('[data-puse]').length,edit:document.querySelectorAll('[data-pedit]').length}));
 await page.screenshot({path:path.join(ROOT,'docs/testing/round142-phone-persona.png')});
 await page.locator('[data-puse="p2"]').click({timeout:10000});await page.waitForTimeout(200);
 const personaAfter=await page.evaluate(()=>({id:DB.me.personaId,count:document.querySelector('[data-mgo="cards"] .d')?.textContent}));
 await page.evaluate(()=>{setActivePersonaSafe('p1');saveNow();closeSheet();route={name:'chatroom',arg:'c'};render()});await page.waitForTimeout(3300);
 const toastHidden=await page.evaluate(()=>!document.querySelector('#toast')?.classList.contains('on'));
 const safety=await page.evaluate(()=>{
  const inspect=(raw)=>{const p=parseStructuredChatCard(raw)||inferStructuredChatCard(raw);return p?{kind:p.kind,amount:p.amount}:null};
  const before=(DB.takeout.orders||[]).length;const pushed=pushCharStructuredCard({id:'no-chat',personaId:null},{id:'c1'},{type:'takeout',amount:0,merchant:'示例店',items:['示例商品']},false);const after=(DB.takeout.orders||[]).length;
  return{pastTransfer:inspect('你之前那笔转账200元我收下了，别再转啦'),arrivedTakeout:inspect('外卖到了，我先吃啦'),zero:inspect('[红包] 恭喜发财'),invalidPush:pushed,ordersBefore:before,ordersAfter:after,fallback:parseChatBubblePlan('[红包] 恭喜发财'),orderAmount:chatCardAmount('我给你下单了，订单号BS106，手机壳39元'),takeoutAmount:chatCardAmount('我给你点了一份外卖，预计20分钟到，68元'),tailAmount:chatCardAmount('尾号1111，转账200元'),commaAmount:chatCardAmount('我给你发1,000元红包，拿着'),positiveRed:inspect('我给你发52元红包，收下买奶茶'),positiveTransfer:inspect('给你转200元，收下'),positiveTakeout:inspect('我给你点了外卖68元，不要香菜'),future:inspect('明天给你发200元红包'),intent:inspect('我想给你发200元红包'),condition:inspect('如果我现在给你转账200元，你会收吗'),ask:inspect('我给你点份外卖50元，你要吗'),negation:inspect('没给你发52元红包'),who:inspect('谁给你发52元红包了')};
 });
 const finalPng=execFileSync(ADB,['exec-out','screencap','-p'],{maxBuffer:32*1024*1024});
 const finalPath=path.join(ROOT,'docs/testing/round142-phone-final-synthetic.png');fs.writeFileSync(finalPath,finalPng);
 const finalSha=crypto.createHash('sha256').update(finalPng).digest('hex').toUpperCase();
 const restored=await page.evaluate(()=>DB.me.personaId==='p1');
 const checks={build:cards.build===107,cards:cards.types===4,touch44:cards.voice?.w>=44&&cards.voice?.h>=44&&cards.video?.w>=44&&cards.video?.h>=44&&cards.more?.w>=44&&cards.more?.h>=44,menu:menu.groups.length===6&&menu.all44,favorites:fav.voice&&fav.more?.w>=44&&fav.more?.h>=44,persona:personaPrecondition.active==='p1'&&personaPrecondition.count==='1 张'&&personaHome.use===2&&personaHome.edit===0&&personaAfter.id==='p2'&&personaAfter.count==='0 张'&&restored,safety:safety.pastTransfer===null&&safety.arrivedTakeout===null&&safety.zero===null&&safety.invalidPush===null&&safety.ordersAfter===safety.ordersBefore&&safety.fallback.length===1&&safety.fallback[0].kind==='auto'&&safety.orderAmount===39&&safety.takeoutAmount===68&&safety.tailAmount===200&&safety.commaAmount===1000&&safety.positiveRed?.kind==='redpacket'&&safety.positiveRed?.amount===52&&safety.positiveTransfer?.kind==='transfer'&&safety.positiveTransfer?.amount===200&&safety.positiveTakeout?.kind==='takeout'&&safety.positiveTakeout?.amount===68&&safety.future===null&&safety.intent===null&&safety.condition===null&&safety.ask===null&&safety.negation===null&&safety.who===null,noErrors:errors.length===0,toastHidden:toastHidden,privacySafe:true};
 const out={ok:Object.values(checks).every(Boolean),checkedAt:new Date().toISOString(),device:{model:'OPPO PMK110',android:'16',viewport:cards.qq},source:{indexSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'index.html'))).digest('hex').toUpperCase()},checks,cards,menu,fav,personaPrecondition,personaHome,personaAfter,restored,safety,finalScreenshot:{path:finalPath,sha256:finalSha,bytes:finalPng.length},errors};
 fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');console.log(JSON.stringify(out,null,2));
 await browser.close();if(!out.ok)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exit(1)});



