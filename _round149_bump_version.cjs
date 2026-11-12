const fs=require('fs');const edits=[
 ['index.html',[["const PROGRESS_UPDATED='2026-11-12 · 3.99 · 第 110 轮';","const PROGRESS_UPDATED='2026-11-12 · 3.100 · 第 111 轮';"],["const BUILD='2026-11-12 · 3.99 · 第 110 轮';","const BUILD='2026-11-12 · 3.100 · 第 111 轮';"],['const BUILD_CODE=110;','const BUILD_CODE=111;']]],
 ['sw.js',[["var C='bsphone-v110-20261112-r1';","var C='bsphone-v111-20261112-r1';"]]],
 ['build89/native/app/build.gradle',[['versionCode 110','versionCode 111'],['versionName "3.99"','versionName "3.100"']]],
 ['_qa_native_round140/app/build.gradle',[['versionCode 110','versionCode 111'],['versionName "3.99"','versionName "3.100"']]]
];
for(const [file,list] of edits){let s=fs.readFileSync(file,'utf8');for(const [a,b] of list){if(!s.includes(a))throw new Error(file+' missing '+a);s=s.replace(a,()=>b)}fs.writeFileSync(file,s,'utf8')}
fs.writeFileSync('version.json',JSON.stringify({version:'3.100',versionCode:111,round:111,releasedAt:'2026-11-12',pageUrl:'https://blkst123.github.io/bsphone/?v=111-r1',apkUrl:'https://blkst123.github.io/bsphone/BS%E5%B0%8F%E6%89%8B%E6%9C%BA.apk',cacheKey:'bsphone-v111-20261112-r1',notes:'3.100 Build111：修复用户红包不能自领且领取不新增红包卡；用户转账退回只保留一张已退回状态卡。'},null,2)+'\n','utf8');console.log('bumped');
