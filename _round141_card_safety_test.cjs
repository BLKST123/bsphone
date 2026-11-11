const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('E:/Codex/tools/node/bin/node_modules/playwright');
const ROOT=path.resolve('C:/Users/lenovo/Documents/ChatGPT/各种的/_ghpages'),PORT=18112,OUT=path.join(ROOT,'docs/testing/round141-card-safety-2026-11-10.json');
function serve(){return new Promise(resolve=>{const server=http.createServer((req,res)=>{const u=decodeURIComponent((req.url||'/').split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u.replace(/^\/+/,''));if(!f.startsWith(ROOT)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':path.extname(f).toLowerCase()==='.html'?'text/html; charset=utf-8':'application/octet-stream'});fs.createReadStream(f).pipe(res);});server.listen(PORT,'127.0.0.1',()=>resolve(server));});}
(async()=>{
 const server=await serve();
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${PORT}/`);
 await page.waitForFunction(()=>window.BSCoreStore&&BSCoreStore.ready());
 const result=await page.evaluate(()=>{
  const cases={};
  const inspect=(raw)=>{const p=parseStructuredChatCard(raw)||inferStructuredChatCard(raw);return p?{kind:p.kind,amount:p.amount,merchant:p.merchant,items:p.items,status:p.status}:null;};
  cases.positiveRedpacket=inspect('[红包] 52.00|给你买奶茶');
  cases.positiveTransfer=inspect('[转账] 200|拿去用');
  cases.positiveTakeout=inspect('[外卖] 甜品店|草莓蛋糕、热奶茶|68|趁热吃');
  cases.positiveOrder=inspect('[订单] 商城|手机壳|39|已发货|物流更新');
  cases.pastTransfer=inspect('你之前那笔转账200元我收下了，别再转啦');
  cases.pastRedpacket=inspect('你之前那个200元红包我收下了，谢谢你');
  cases.arrivedTakeout=inspect('外卖到了，我先吃啦');
  cases.thirdPartyRedpacket=inspect('别人给你发了个200元红包');
  cases.alreadyTakeout=inspect('已经给你点了一份外卖 50元');
  cases.negatedTransfer=inspect('不要给我转200元');
  cases.zeroRedpacket=inspect('[红包] 恭喜发财');
  cases.zeroTransfer=inspect('[转账] 0|测试');
  cases.negativeTakeout=inspect('[外卖] 店|商品|-1|备注');
  cases.nanOrder=inspect('[订单] 店|商品|NaN|状态');
  cases.explicitInvalidFallback=parseChatBubblePlan('[红包] 恭喜发财');
  const ordersBefore=(DB.takeout.orders||[]).length;
  const invalidTakeoutPush=pushCharStructuredCard({id:'no-chat',personaId:null},{id:'c1'},{type:'takeout',amount:0,merchant:'示例店',items:['示例商品']},false);
  const invalidRedpacketPush=pushCharStructuredCard({id:'no-chat',personaId:null},{id:'c1'},{type:'redpacket',amount:0,note:'示例'},false);
  const ordersAfter=(DB.takeout.orders||[]).length;
  cases.invalidTakeoutPush={returned:invalidTakeoutPush,ordersBefore:ordersBefore,ordersAfter:ordersAfter};
  cases.invalidRedpacketPush={returned:invalidRedpacketPush};
  return cases;
 });
 const checks={
  positiveRedpacket:result.positiveRedpacket&&result.positiveRedpacket.kind==='redpacket'&&result.positiveRedpacket.amount===52,
  positiveTransfer:result.positiveTransfer&&result.positiveTransfer.kind==='transfer'&&result.positiveTransfer.amount===200,
  positiveTakeout:result.positiveTakeout&&result.positiveTakeout.kind==='takeout'&&result.positiveTakeout.amount===68,
  positiveOrder:result.positiveOrder&&result.positiveOrder.kind==='order'&&result.positiveOrder.amount===39,
  pastTransfer:result.pastTransfer===null,
  pastRedpacket:result.pastRedpacket===null,
  arrivedTakeout:result.arrivedTakeout===null,
  thirdPartyRedpacket:result.thirdPartyRedpacket===null,
  alreadyTakeout:result.alreadyTakeout===null,
  negatedTransfer:result.negatedTransfer===null,
  zeroRedpacket:result.zeroRedpacket===null,
  zeroTransfer:result.zeroTransfer===null,
  negativeTakeout:result.negativeTakeout===null,
  nanOrder:result.nanOrder===null,
  explicitInvalidFallback:result.explicitInvalidFallback.length===1&&result.explicitInvalidFallback[0].kind==='auto'&&result.explicitInvalidFallback[0].text==='[红包] 恭喜发财',
  invalidTakeoutNoEntity:result.invalidTakeoutPush.returned===null&&result.invalidTakeoutPush.ordersAfter===result.invalidTakeoutPush.ordersBefore,
  invalidRedpacketNoMessage:result.invalidRedpacketPush.returned===null,
  noRuntimeErrors:errors.length===0
 };
 const out={ok:Object.values(checks).every(Boolean),checkedAt:new Date().toISOString(),source:{indexSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'index.html'))).digest('hex').toUpperCase()},checks,result,errors};
 fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n','utf8');console.log(JSON.stringify(out,null,2));
 await browser.close();server.close();if(!out.ok)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exit(1)});

