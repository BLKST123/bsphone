const fs=require('fs');
function edit(file,pairs){let s=fs.readFileSync(file,'utf8');for(const [a,b] of pairs){if(!s.includes(a))throw new Error('missing '+a+' in '+file);s=s.split(a).join(b);}fs.writeFileSync(file,s,'utf8');}
edit('index.html',[
 ["const PROGRESS_UPDATED='2026-11-10 · 3.94 · 第 105 轮';","const PROGRESS_UPDATED='2026-11-10 · 3.95 · 第 106 轮';"],
 ["const BUILD='2026-11-10 · 3.94 · 第 105 轮';","const BUILD='2026-11-10 · 3.95 · 第 106 轮';"],
 ['const BUILD_CODE=105;','const BUILD_CODE=106;']
]);
edit('sw.js',[["var C='bsphone-v105-20261110-r1';","var C='bsphone-v106-20261110-r1';"]]);
edit('build89/native/app/build.gradle',[['versionCode 105','versionCode 106'],['versionName "3.94"','versionName "3.95"']]);
edit('_qa_native_round140/app/build.gradle',[['versionCode 105','versionCode 106'],['versionName "3.94"','versionName "3.95"']]);
fs.writeFileSync('version.json',JSON.stringify({version:'3.95',versionCode:106,round:106,releasedAt:'2026-11-10',pageUrl:'https://blkst123.github.io/bsphone/?v=106-r1',apkUrl:'https://blkst123.github.io/bsphone/BS%E5%B0%8F%E6%89%8B%E6%9C%BA.apk',cacheKey:'bsphone-v106-20261110-r1',notes:'3.95 Build106：修复并发生成输入状态、结构化卡片自然语言误判、零/非法金额卡片；清理公开隐私截图并重写证据；真机脚本改为可重复执行。'},null,2)+'\n','utf8');
console.log('version bumped 3.95/106');
