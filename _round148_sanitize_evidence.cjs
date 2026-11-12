const fs=require('fs');const f='docs/testing/round148-cdp-device-transfer.json';const d=JSON.parse(fs.readFileSync(f,'utf8'));
function cleanPending(m){return m?{id:m.id,type:m.type,amount:m.amount,note:m.note,claimed:!!m.claimed,transferState:m.transferState||''}:null}
if(d.receiveState)d.receiveState.pending=cleanPending(d.receiveState.pending);
if(d.returnState)d.returnState.pending=cleanPending(d.returnState.pending);
d.releaseRestored={version:'3.99',versionCode:110,debugPortClosed:true,restoredAt:new Date().toISOString()};
fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n','utf8');
console.log('sanitized');
