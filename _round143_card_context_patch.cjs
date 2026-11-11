const fs=require('fs');const file='index.html';const raw=fs.readFileSync(file,'utf8');const crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');
const oldAmount=`    if(/(金额|价格|一共|合计|付款|付了|花了|转账|红包|外卖|订单)/.test(before)) score+=20;
    if(/(订单号|编号|尾号|卡号|电话|手机号|预计|分钟|小时|时间|日期|年份|年龄|次数|第|号)/.test(before)) score-=200;
    if(/(订单号|编号|尾号|卡号|电话|手机号|分钟|小时|时间|日期|年份|年龄|次数|年|月|日|号)/.test(after)) score-=200;
    if(/[A-Za-z0-9]$/.test(before)&&!match[1]&&!match[3]) score-=200;
    if(score<=0) continue;
    if(score>=bestScore){best=n;bestScore=score;}`;
const newAmount=`    if(/(金额|价格|一共|合计|付款|付了|花了|转账|红包|外卖|订单)/.test(before)) score+=20;
    if(/(红包|转账|外卖|订单|下单)/.test(after)) score+=20;
    if(/(手续费|配送费|服务费|运费|优惠券|优惠|折扣|备注|订单号|编号|尾号|卡号|电话|手机号|预计|分钟|小时|时间|日期|年份|年龄|次数|第|号)/.test(before)) score-=300;
    if(/(手续费|配送费|服务费|运费|优惠券|优惠|折扣|备注|订单号|编号|尾号|卡号|电话|手机号|分钟|小时|时间|日期|年份|年龄|次数|年|月|日|号)/.test(after)) score-=300;
    if(/[A-Za-z0-9]$/.test(before)&&!match[1]&&!match[3]) score-=200;
    if(score<=0) continue;
    if(score>bestScore){best=n;bestScore=score;}`;
if(!s.includes(oldAmount))throw new Error('amount scoring target missing');s=s.replace(oldAmount,newAmount);
const oldBlock=`function chatCardBlockedContext(text){
  const t=String(text||'');
  const pastOrStatus=/(?:之前|上次|昨天|前天|刚才|刚刚|已经|早就|收下了|收到|领了|领取了|到了|送达|配送中|骑手|别再|不要再|不想给|没给|没有给|不是给|别人|他给|她给|你给过我|你之前|谁给你)/;
  const futureOrCondition=/(?:明天|下次|以后|稍后|等会|待会|准备|打算|想要|想给你|如果|要是|假如|反事实|会不会|要不要|可以吗|好吗|行吗|你会收吗|你要吗)/;
  const actionNegation=/(?:不要|别|不用|不想|没给|没有给|不).{0,6}(?:给|转|发|点|下单)/;
  return pastOrStatus.test(t)||futureOrCondition.test(t)||actionNegation.test(t);
}`;
const newBlock=`function chatCardBlockedContext(text){
  const clauses=String(text||'').split(/[，,。；;！？!?]/).map(function(x){return x.trim();}).filter(Boolean);
  const actionRe=/(?:给你(?:发|送|塞|包|转|点|叫)|我给你(?:发|送|塞|包|转|点|叫|下单)|发给你|送你|塞给你|转给你|给你转账|给你下单|点给你|叫给你|帮你点|我来点|我点了|我下单了|下单了|给你买了)/;
  let actionIndex=clauses.findIndex(function(c){return actionRe.test(c);});
  if(actionIndex<0) actionIndex=0;
  const action=clauses[actionIndex]||'';
  const pastOrStatus=/(?:之前|上次|昨天|前天|刚才|刚刚|已经|早就|收下了|收到|领了|领取了|到了|送达|配送中|骑手|别再|不要再|不想给|没给|没有给|不是给|别人|他给|她给|你给过我|你之前|谁给你)/;
  const futureOrCondition=/(?:明天|下次|以后|稍后|等会|待会|一会儿|晚点|下周|等我忙完|马上|准备|打算|想要|想给你|如果|要是|假如|反事实|会不会|要不要|可以吗|好吗|行吗|你会收吗|你要吗)/;
  const actionNegation=/(?:不要|别|不用|不想|没给|没有给|不).{0,6}(?:给|转|发|点|下单)/;
  if(pastOrStatus.test(action)||futureOrCondition.test(action)||actionNegation.test(action)) return true;
  for(let i=actionIndex;i<clauses.length;i++){ if(/(?:谁给你|要不要|你会收吗|可以吗|好吗|行吗|你要吗)/.test(clauses[i])) return true; }
  return false;
}`;
if(!s.includes(oldBlock))throw new Error('context target missing');s=s.replace(oldBlock,newBlock);
s=s.replace("if(/订单/.test(t)&&amount>0&&/(?:给你下单|给你买了|我给你下单|我下单了)/.test(t))","if(/(?:订单|下单)/.test(t)&&amount>0&&/(?:给你下单|给你买了|我给你下单|我下单了|下单了)/.test(t))");
fs.writeFileSync(file,crlf?s.replace(/\n/g,'\r\n'):s,'utf8');console.log('card context and amount roles patched');
