const fs=require('fs');const f='STATE.md';let s=fs.readFileSync(f,'utf8');const reps=[
['- 页面：2026-11-12 · 3.99 · 第 110 轮','- 页面：2026-11-12 · 3.100 · 第 111 轮'],
['- Android：3.99 / versionCode 110','- Android：3.100 / versionCode 111'],
['- Service Worker：bsphone-v110-20261112-r1','- Service Worker：bsphone-v111-20261112-r1'],
['- 源码 SHA-256：E2BFA42E88E57F847027285DC369A9254EB7C65A6ED63D27C0244BB83448FFAE','- 源码 SHA-256：96C38DA2BF2EEF87E7E59C233459D16EFDB78B2AC6ACD089BF500E0620616F93'],
['- Release APK SHA-256：92C01D3C6A4038DA7BFD4851770DAC7D00846B19D5060F22DD480B5D5DBF4792','- Release APK SHA-256：1D3F8C296076F8D4347C9D03790C1FFB7756DB6B6AF93604BCF50E126112175C'],
['- Release ZIP SHA-256：2FBA0E6648942CDE230F597A700A0023475286E3EFCE398C889F7F3DBEC7E637','- Release ZIP SHA-256：66517B0A444040229A1DE9505DB62B6DF81F86586E168BDF9B983CF681E22C65'],
['- 3.99 / Build110 修正转账语义：用户转账后 char 可收款或退回；char 转账后用户必须在居中金额弹窗选择收款或退回；已结算卡不再存在转账交互，只保留复制文字、引用、收藏、删除、取消五项消息菜单。','- 3.100 / Build111 修复红包与转账重复卡：用户红包不能自领，领取后只保留系统提示；用户转账退回的同一轮 char 回复只保留一张“已退回”卡。'],
['- 当前全量 28/28、微信历史 10/10、转账专项 16/16、几何断言 7/7；Release/ZIP 已构建，真机覆盖安装成功，GitHub Pages 3.99 线上 APK 哈希一致。','- 当前全量 28/28、微信历史 10/10、红包/转账语义专项 11/11、真机 CDP 语义 10/10；Release/ZIP 已构建，真机覆盖安装成功。']
];for(const [a,b] of reps){if(!s.includes(a))throw new Error('missing '+a);s=s.replace(a,()=>b)}const anchor='## 2026-11-12 / 3.99 Build110 转账收款与退回返修';const section='## 2026-11-12 / 3.100 Build111 红包与转账重复卡返修\n- 用户发出的红包卡不绑定领取事件；用户点击自己的红包不会生成“你领取了对方红包”的系统提示。\n- 用户红包被 char 领取后，只把原卡标记为已领取并插入一条 `xx领取了你的红包` 系统小气泡；同一轮 char 回复中的红包卡会被抑制，不再新增红包卡。\n- 用户发起的待结算转账在同一轮回复中会过滤所有 char 转账卡，再由结算逻辑统一生成唯一 `已收款` 或 `已退回` 状态卡。\n- 红包与转账的“已领取/已退回”系统语义均不依赖截图巡检；本轮通过 CDP 在真机 WebView 真实点击表单和卡片，10/10 断言通过。\n- 真机测试后恢复非调试 Release 3.100/111，调试端口关闭。\n\n';if(!s.includes(anchor))throw new Error('anchor missing');s=s.replace(anchor,()=>section+anchor);fs.writeFileSync(f,s,'utf8');console.log('state updated');
