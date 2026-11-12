const fs=require('fs');const file='_round144_payment_flow_test.cjs';let s=fs.readFileSync(file,'utf8');
const old="clear();const charTf=pushCharStructuredCard(ch(),sp(),{type:'transfer',amount:200,note:'给你转账'},false);render();document.querySelector('[data-tf=\"'+charTf.id+'\"]').click();const charTransfer=snapshot();";
const neu="clear();const charTf=pushCharStructuredCard(ch(),sp(),{type:'transfer',amount:200,note:'给你转账'},false);render();document.querySelector('[data-tf=\"'+charTf.id+'\"]').click();document.querySelector('#transferReceive').click();const charTransfer=snapshot();";
if(!s.includes(old)) throw new Error('target missing');s=s.replace(old,()=>neu);fs.writeFileSync(file,s,'utf8');console.log('updated legacy payment flow');
