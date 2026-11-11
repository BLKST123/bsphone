const fs=require('fs');
const file='index.html';
const raw=fs.readFileSync(file,'utf8');const crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');
function repl(oldText,newText,label){
  if(!s.includes(oldText)) throw new Error('missing patch target: '+label);
  if(s.split(oldText).length!==2) throw new Error('non-unique patch target: '+label);
  s=s.replace(oldText,newText);
}
const oldParser=`function chatCardAmount(text){
  const m=String(text||'').match(/(?:¥|￥)?\\s*(\\d{1,12}(?:\\.\\d{1,2})?)\\s*(?:元)?/);
  if(!m) return 0;
  const n=Number(m[1]);
  return Number.isFinite(n)?Math.max(0,Math.min(999999999999.99,Math.round(n*100)/100)):0;
}
function parseStructuredChatCard(raw){
  const m=String(raw||'').trim().match(/^[\\[【](红包|转账|外卖|订单)[\\]】]\\s*(.*)$/i);
  if(!m) return null;
  const kind=m[1]==='红包'?'redpacket':m[1]==='转账'?'transfer':m[1]==='外卖'?'takeout':'order';
  const fields=String(m[2]||'').split(/[|｜]/).map(function(x){return String(x||'').trim();}).filter(Boolean);
  if(kind==='redpacket'||kind==='transfer'){
    let amount=0,note='';
    fields.forEach(function(x){const v=chatCardAmount(x);if(v>amount){amount=v;}else if(!note)note=x;});
    if(!amount){amount=chatCardAmount(m[2]);note=fields.filter(function(x){return chatCardAmount(x)<=0;}).join(' ');}
    return {text:fields.join(' '),kind:kind,amount:amount,note:note||(kind==='redpacket'?'恭喜发财，大吉大利':'转账'),voiceSafe:false};
  }
  if(kind==='takeout'){
    const merchant=fields[0]||'外卖';
    const itemText=fields[1]||fields[0]||'外卖一份';
    const items=itemText.split(/[、,，]/).map(function(x){return x.trim();}).filter(Boolean);
    const amount=fields.length>2?chatCardAmount(fields[2]):chatCardAmount(m[2]);
    const note=fields.slice(3).join(' ');
    return {text:fields.join(' '),kind:'takeout',merchant:merchant,items:items.length?items:['外卖一份'],amount:amount,note:note,voiceSafe:false};
  }
  const merchant=fields[0]||'订单';
  const itemText=fields[1]||'订单商品';
  const amount=fields.length>2?chatCardAmount(fields[2]):chatCardAmount(m[2]);
  const status=fields[3]||'待处理';
  const note=fields.slice(4).join(' ');
  return {text:fields.join(' '),kind:'order',merchant:merchant,items:itemText.split(/[、,，]/).filter(Boolean),amount:amount,status:status,note:note,orderNo:'BS'+String(Date.now()).slice(-10),voiceSafe:false};
}
function inferStructuredChatCard(raw){
  const t=String(raw||'').trim();
  if(!t||t.length>220) return null;
  const amount=chatCardAmount(t);
  if(/红包/.test(t)&&amount>0&&/(给你|发给你|送你|塞给你|收下|拿着|一个)/.test(t)) return parseStructuredChatCard('[红包] '+amount+'|'+t);
  if(/转账/.test(t)&&amount>0&&/(给你|转给你|转你|打给你|收下)/.test(t)) return parseStructuredChatCard('[转账] '+amount+'|'+t);
  if(/外卖/.test(t)&&/(给你点|点给你|点了|下单|送到你|外卖到了)/.test(t)){
    const gm=t.match(/点了(?:一份|一份儿|个|份)?([^，。,.!?！？]{1,24})/);
    return parseStructuredChatCard('[外卖] 外卖|'+(gm&&gm[1]||'外卖一份')+'|'+(amount||0)+'|'+t);
  }
  if(/订单/.test(t)&&/(订单号|已下单|订单状态|订单到了|订单更新)/.test(t)) return parseStructuredChatCard('[订单] 订单|订单商品|'+(amount||0)+'|'+t);
  return null;
}`;
const newParser=`function validChatCardAmount(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>0&&n<=999999999999.99;
}
function chatCardAmount(text){
  const s=String(text||'');
  if(/[eE]/.test(s)) return 0;
  const m=s.match(/(?:¥|￥)?\\s*(-?\\d{1,12}(?:,\\d{3})*(?:\\.\\d{1,2})?)\\s*(?:元)?/);
  if(!m) return 0;
  const n=Number(m[1].replace(/,/g,''));
  if(!validChatCardAmount(n)) return 0;
  return Math.round(n*100)/100;
}
function parseStructuredChatCard(raw){
  const m=String(raw||'').trim().match(/^[\\[【](红包|转账|外卖|订单)[\\]】]\\s*(.*)$/i);
  if(!m) return null;
  const kind=m[1]==='红包'?'redpacket':m[1]==='转账'?'transfer':m[1]==='外卖'?'takeout':'order';
  const fields=String(m[2]||'').split(/[|｜]/).map(function(x){return String(x||'').trim();}).filter(Boolean);
  if(kind==='redpacket'||kind==='transfer'){
    let amount=0,note='';
    fields.forEach(function(x){const v=chatCardAmount(x);if(v>amount){amount=v;}else if(!note)note=x;});
    if(!amount){amount=chatCardAmount(m[2]);note=fields.filter(function(x){return chatCardAmount(x)<=0;}).join(' ');}
    if(!validChatCardAmount(amount)) return null;
    return {text:fields.join(' '),kind:kind,amount:amount,note:note||(kind==='redpacket'?'恭喜发财，大吉大利':'转账'),voiceSafe:false};
  }
  if(kind==='takeout'){
    const merchant=fields[0]||'外卖';
    const itemText=fields[1]||fields[0]||'外卖一份';
    const items=itemText.split(/[、,，]/).map(function(x){return x.trim();}).filter(Boolean);
    const amount=fields.length>2?chatCardAmount(fields[2]):chatCardAmount(m[2]);
    if(!validChatCardAmount(amount)) return null;
    const note=fields.slice(3).join(' ');
    return {text:fields.join(' '),kind:'takeout',merchant:merchant,items:items.length?items:['外卖一份'],amount:amount,note:note,voiceSafe:false};
  }
  const merchant=fields[0]||'订单';
  const itemText=fields[1]||'订单商品';
  const amount=fields.length>2?chatCardAmount(fields[2]):chatCardAmount(m[2]);
  if(!validChatCardAmount(amount)) return null;
  const status=fields[3]||'待处理';
  const note=fields.slice(4).join(' ');
  return {text:fields.join(' '),kind:'order',merchant:merchant,items:itemText.split(/[、,，]/).filter(Boolean),amount:amount,status:status,note:note,orderNo:'BS'+String(Date.now()).slice(-10),voiceSafe:false};
}
function chatCardPastOrStatus(text){
  return /(?:之前|上次|昨天|前天|刚才|刚刚|已经|早就|收下|收到|领了|领取|到了|送达|配送中|骑手|别再|不要|不用|不是|别人|他给|她给|你给过我|你之前)/.test(String(text||''));
}
function inferStructuredChatCard(raw){
  const t=String(raw||'').trim();
  if(!t||t.length>220||chatCardPastOrStatus(t)) return null;
  const amount=chatCardAmount(t);
  if(/红包/.test(t)&&amount>0&&/(?:我给你(?:发|送|塞|包)?|给你(?:发|送|塞|包|转)|发给你|送你|塞给你|给你个|给你一个)/.test(t)) return parseStructuredChatCard('[红包] '+amount+'|'+t);
  if(/转账/.test(t)&&amount>0&&/(?:转给你|给你转|给你转账|我给你转|打给你|给你打|转账给你|转你)/.test(t)) return parseStructuredChatCard('[转账] '+amount+'|'+t);
  if(/外卖/.test(t)&&amount>0&&/(?:给你点|点给你|我给你点|给你叫|叫给你|帮你点|我来点|我点了|给你下单)/.test(t)){
    const gm=t.match(/点了(?:一份|一份儿|个|份)?([^，。,.!?！？]{1,24})/);
    return parseStructuredChatCard('[外卖] 外卖|'+(gm&&gm[1]||'外卖一份')+'|'+amount+'|'+t);
  }
  if(/订单/.test(t)&&amount>0&&/(?:给你下单|给你买了|我给你下单|我下单了)/.test(t)) return parseStructuredChatCard('[订单] 订单|订单商品|'+amount+'|'+t);
  return null;
}`;
repl(oldParser,newParser,'structured card parser');

const oldTyping=`const chatRequestControllers=new Map();
function abortChatRequest(chatId){
  const item=chatId&&chatRequestControllers.get(chatId);
  if(item&&item.controller){ try{ item.controller.abort(); }catch(e){} }
  if(chatId) chatRequestControllers.delete(chatId);
}`;
const newTyping=`const chatRequestControllers=new Map();
function syncChatTypingState(){
  if(route.name!=='chatroom'){ setTyping(false); return; }
  const id=route.arg||curChatId;
  const active=!!(id&&chatRequestControllers.has(id));
  if(active) setTyping(true,'对方正在输入……');
  else setTyping(false);
}
function abortChatRequest(chatId){
  const item=chatId&&chatRequestControllers.get(chatId);
  if(item&&item.controller){ try{ item.controller.abort(); }catch(e){} }
  if(chatId) chatRequestControllers.delete(chatId);
  syncChatTypingState();
}`;
repl(oldTyping,newTyping,'typing state controller');

const oldPush=`function pushCharStructuredCard(ch,speaker,part,countsProactive){
  if(!ch||!speaker||!part) return null;
  const base={role:'ta',from:speaker.id,countsProactive:!!countsProactive};
  if(part.type==='redpacket'||part.type==='transfer'){
    return pushMsg(ch.id,Object.assign({},base,{type:part.type,amount:Number(part.amount)||0,note:cleanChatOutput(part.note||'',ch)||(part.type==='redpacket'?'恭喜发财，大吉大利':'转账'),text:part.text||part.note||''}));
  }
  if(part.type==='takeout'){
    const personaId=ch.personaId||DB.me.personaId||null;
    const names=(part.items&&part.items.length?part.items:['外卖一份']).slice(0,8);
    const amount=Math.max(0,Number(part.amount)||0);
    const price=names.length?Math.round(amount/names.length*100)/100:0;
    const items=names.map(function(name,i){return {id:'char_card_'+uid()+'_'+i,name:name,price:price,qty:1,cat:'外卖',merchant:part.merchant||'外卖',desc:'',review:'',emoji:'',spec:''};});
    const order=takeoutCreateOrder({personaId:personaId,chatId:ch.id,contactId:speaker.id,source:'contact',payer:'contact',orderedFor:'me',merchant:part.merchant||'外卖',note:cleanChatOutput(part.note||'',ch),items:items,address:takeoutAddressFor(personaId,'me',speaker.id),payment:{type:'contact',label:contactDisplayName(speaker)+'付款'}});
    if(!order) return null;
    order.sentToChat=true;order.sentAt=Date.now();
    return pushMsg(ch.id,Object.assign({},base,{type:'takeout',orderId:order.id,status:order.status,text:part.note||('外卖订单 #'+(order.orderNo||order.id)+'：'+order.merchant)}));
  }
  if(part.type==='order'){
    return pushMsg(ch.id,Object.assign({},base,{type:'order',merchant:part.merchant||'订单',items:part.items||[],amount:Number(part.amount)||0,status:part.status||'待处理',note:cleanChatOutput(part.note||'',ch),orderNo:part.orderNo||('BS'+String(Date.now()).slice(-10)),text:part.text||part.note||''}));
  }
  return null;
}`;
const newPush=`function pushCharStructuredCard(ch,speaker,part,countsProactive){
  if(!ch||!speaker||!part) return null;
  const cardType=part.type||part.kind;
  const amount=Number(part.amount);
  if(!validChatCardAmount(amount)) return null;
  const base={role:'ta',from:speaker.id,countsProactive:!!countsProactive};
  if(cardType==='redpacket'||cardType==='transfer'){
    return pushMsg(ch.id,Object.assign({},base,{type:cardType,amount:amount,note:cleanChatOutput(part.note||'',ch)||(cardType==='redpacket'?'恭喜发财，大吉大利':'转账'),text:part.text||part.note||''}));
  }
  if(cardType==='takeout'){
    const personaId=ch.personaId||DB.me.personaId||null;
    const names=(part.items&&part.items.length?part.items:['外卖一份']).slice(0,8);
    const price=names.length?Math.round(amount/names.length*100)/100:0;
    const items=names.map(function(name,i){return {id:'char_card_'+uid()+'_'+i,name:name,price:price,qty:1,cat:'外卖',merchant:part.merchant||'外卖',desc:'',review:'',emoji:'',spec:''};});
    const order=takeoutCreateOrder({personaId:personaId,chatId:ch.id,contactId:speaker.id,source:'contact',payer:'contact',orderedFor:'me',merchant:part.merchant||'外卖',note:cleanChatOutput(part.note||'',ch),items:items,address:takeoutAddressFor(personaId,'me',speaker.id),payment:{type:'contact',label:contactDisplayName(speaker)+'付款'}});
    if(!order) return null;
    order.sentToChat=true;order.sentAt=Date.now();
    return pushMsg(ch.id,Object.assign({},base,{type:'takeout',orderId:order.id,status:order.status,text:part.note||('外卖订单 #'+(order.orderNo||order.id)+'：'+order.merchant)}));
  }
  if(cardType==='order'){
    return pushMsg(ch.id,Object.assign({},base,{type:'order',merchant:part.merchant||'订单',items:part.items||[],amount:amount,status:part.status||'待处理',note:cleanChatOutput(part.note||'',ch),orderNo:part.orderNo||('BS'+String(Date.now()).slice(-10)),text:part.text||part.note||''}));
  }
  return null;
}`;
repl(oldPush,newPush,'structured card push guard');

repl("  setTyping(true,'对方正在输入……');\n  try{", "  syncChatTypingState();\n  try{", 'aiTurn typing start');
repl("    const active=chatRequestControllers.get(ch.id);\n    if(active&&active.controller===requestController) chatRequestControllers.delete(ch.id);\n    setTyping(false);", "    const active=chatRequestControllers.get(ch.id);\n    if(active&&active.controller===requestController) chatRequestControllers.delete(ch.id);\n    syncChatTypingState();", 'aiTurn typing finally');

fs.writeFileSync(file,crlf?s.replace(/\n/g,'\r\n'):s,'utf8');
console.log('round141 core fixes applied');

