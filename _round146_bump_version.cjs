const fs=require('fs');
const edits=[
 ['index.html',[
  ["const PROGRESS_UPDATED='2026-11-12 · 3.98 · 第 109 轮';","const PROGRESS_UPDATED='2026-11-12 · 3.99 · 第 110 轮';"],
  ["const BUILD='2026-11-12 · 3.98 · 第 109 轮';","const BUILD='2026-11-12 · 3.99 · 第 110 轮';"],
  ['const BUILD_CODE=109;','const BUILD_CODE=110;']
 ]],
 ['sw.js',[["var C='bsphone-v109-20261112-r1';","var C='bsphone-v110-20261112-r1';"]]],
 ['build89/native/app/build.gradle',[['versionCode 109','versionCode 110'],['versionName "3.98"','versionName "3.99"']]],
 ['_qa_native_round140/app/build.gradle',[['versionCode 109','versionCode 110'],['versionName "3.98"','versionName "3.99"']]]
];
for(const [file,list] of edits){let s=fs.readFileSync(file,'utf8');for(const [a,b] of list){if(!s.includes(a))throw new Error(file+' missing '+a);s=s.replace(a,()=>b);}fs.writeFileSync(file,s,'utf8');}
fs.writeFileSync('version.json',JSON.stringify({version:'3.99',versionCode:110,round:110,releasedAt:'2026-11-12',pageUrl:'https://blkst123.github.io/bsphone/?v=110-r1',apkUrl:'https://blkst123.github.io/bsphone/BS%E5%B0%8F%E6%89%8B%E6%9C%BA.apk',cacheKey:'bsphone-v110-20261112-r1',notes:'3.99 Build110：修复转账收款/退回弹窗、已结算转账卡禁交互、五项消息菜单与结构化返回卡去重。'},null,2)+'\n','utf8');
console.log('version bumped 3.99/110');
