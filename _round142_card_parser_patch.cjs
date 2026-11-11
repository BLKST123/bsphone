const fs=require('fs');const file='index.html';const raw=fs.readFileSync(file,'utf8');const crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');const old=`function chatCardAmount(text){
  const s=String(text||'');
  if(/[eE]/.test(s)) return 0;
  const m=s.match(/(?:¥|￥)?\\s*(-?\\d{1,12}(?:,\\d{3})*(?:\\.\\d{1,2})?)\\s*(?:元)?/);
  if(!m) return 0;
  const n=Number(m[1].replace(/,/g,''));
  if(!validChatCardAmount(n)) return 0;
  return Math.round(n*100)/100;
}`;
const neu=`function chatCardAmount(text){
  const s=String(text||'').trim();
  if(!s) return 0;
  if(/^[¥￥]?\\s*-?\\d{1,12}(?:\\.\\d{1,2})?\\s*(?:元|块|块钱)?$/.test(s)){
    const n=Number(s.replace(/[¥￥,\\s元块钱]/g,''));
    return validChatCardAmount(n)?Math.round(n*100)/100:0;
  }
  if(/[eE]/.test(s)) return 0;
  const re=/([¥￥])?\\s*(-?\\d{1,12}(?:,\\d{3})*(?:\\.\\d{1,2})?)\\s*(元|块|块钱)?/g;
  let best=0,bestScore=0,match=null;
  while((match=re.exec(s))){
    const before=s.slice(Math.max(0,match.index-14),match.index);
    const after=s.slice(re.lastIndex,Math.min(s.length,re.lastIndex+14));
    const n=Number(match[2].replace(/,/g,''));
    if(!validChatCardAmount(n)) continue;
    let score=0;
    if(match[1]) score+=100;
    if(match[3]) score+=80;
    if(/(金额|价格|一共|合计|付款|付了|花了|转账|红包|外卖|订单)/.test(before)) score+=20;
    if(/(订单号|编号|尾号|卡号|电话|手机号|预计|分钟|小时|时间|日期|年份|年龄|次数|第|号)/.test(before)) score-=200;
    if(/(订单号|编号|尾号|卡号|电话|手机号|分钟|小时|时间|日期|年份|年龄|次数|年|月|日|号)/.test(after)) score-=200;
    if(/[A-Za-z0-9]$/.test(before)&&!match[1]&&!match[3]) score-=200;
    if(score<=0) continue;
    if(score>=bestScore){best=n;bestScore=score;}
  }
  return bestScore>0?Math.round(best*100)/100:0;
}`;
if(!s.includes(old))throw new Error('chatCardAmount target missing');s=s.replace(old,neu);
const old2=`function chatCardPastOrStatus(text){
  return /(?:之前|上次|昨天|前天|刚才|刚刚|已经|早就|收下|收到|领了|领取|到了|送达|配送中|骑手|别再|不要|不用|不是|别人|他给|她给|你给过我|你之前)/.test(String(text||''));
}`;
const neu2=`function chatCardBlockedContext(text){
  const t=String(text||'');
  const pastOrStatus=/(?:之前|上次|昨天|前天|刚才|刚刚|已经|早就|收下了|收到|领了|领取了|到了|送达|配送中|骑手|别再|不要再|不想给|没给|没有给|不是给|别人|他给|她给|你给过我|你之前|谁给你)/;
  const futureOrCondition=/(?:明天|下次|以后|稍后|等会|待会|准备|打算|想要|想给你|如果|要是|假如|反事实|会不会|要不要|可以吗|好吗|行吗|你会收吗|你要吗)/;
  const actionNegation=/(?:不要|别|不用|不想|没给|没有给|不).{0,6}(?:给|转|发|点|下单)/;
  return pastOrStatus.test(t)||futureOrCondition.test(t)||actionNegation.test(t);
}
function chatCardPastOrStatus(text){ return chatCardBlockedContext(text); }`;
if(!s.includes(old2))throw new Error('blocked context target missing');s=s.replace(old2,neu2);
s=s.replace('if(!t||t.length>220||chatCardPastOrStatus(t)) return null;','if(!t||t.length>220||chatCardBlockedContext(t)) return null;');
fs.writeFileSync(file,crlf?s.replace(/\n/g,'\r\n'):s,'utf8');console.log('parser semantics patched');
