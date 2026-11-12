const fs=require('fs');const file='STATE.md';let s=fs.readFileSync(file,'utf8');
const reps=[
 ['- 页面：2026-11-12 · 3.98 · 第 109 轮','- 页面：2026-11-12 · 3.99 · 第 110 轮'],
 ['- Android：3.98 / versionCode 109','- Android：3.99 / versionCode 110'],
 ['- Service Worker：bsphone-v109-20261112-r1','- Service Worker：bsphone-v110-20261112-r1'],
 ['- 源码 SHA-256：165038D45D9C0276E9D746F85035806A3FE3D0B704C0FFAEDD6DB4061266C4F9','- 源码 SHA-256：E2BFA42E88E57F847027285DC369A9254EB7C65A6ED63D27C0244BB83448FFAE'],
 ['- Release APK SHA-256：05D99EB99C06FAEA6DDCC59464458C1D2D6DAF4323607469EEFBC8C91E1AA09F','- Release APK SHA-256：92C01D3C6A4038DA7BFD4851770DAC7D00846B19D5060F22DD480B5D5DBF4792'],
 ['- Release ZIP SHA-256：25B1FEC386E01572A1299ABEA443791DCDE24E7C2B9D83084740EFE1145726EB','- Release ZIP SHA-256：2FBA0E6648942CDE230F597A700A0023475286E3EFCE398C889F7F3DBEC7E637'],
 ['- 3.98 / Build109 恢复红包/转账收付款真实流程：用户红包被char领取后插入系统小气泡；char红包由用户点击后插入系统小气泡；用户转账后char回复已收款卡片；char转账由用户点击后自动发送已收款卡片。','- 3.99 / Build110 修正转账语义：用户转账后 char 可收款或退回；char 转账后用户必须在居中金额弹窗选择收款或退回；已结算卡不再存在转账交互，只保留复制文字、引用、收藏、删除、取消五项消息菜单。'],
 ['- 真机使用主应用同包名覆盖更新，保留主数据；实际点击微信、我的、用户人设库、钱包，未清数据、未修改现有人设、未发送消息、未写账单。','- 真机使用主应用同包名覆盖更新到 3.99 / Build110，保留主数据；实际启动、进入我的、钱包，并打开已有测试会话点击已结算转账卡验证普通消息菜单；未清数据、未修改人设、未发送新消息、未写账单。'],
 ['- 当前全量 28/28、微信历史 10/10、支付流转 9/9、真实模型入口集成 4/4；Release/ZIP/线上发布通过。','- 当前全量 28/28、微信历史 10/10、转账专项 16/16、几何断言 7/7；Release/ZIP 已构建，真机覆盖安装成功。']
];
for(const [a,b] of reps){if(!s.includes(a))throw new Error('missing '+a);s=s.replace(a,()=>b);}
const section=`\n## 2026-11-12 / 3.99 Build110 转账收款与退回返修\n- 用户转账后，char 的回复文本或结构化卡片决定“已收款/已退回”，系统只生成一张对应状态卡；结构化返回卡会复用原卡，禁止重复卡片。\n- char 转账卡点击后显示屏幕中央金额弹窗，按钮纵向为【收款】【退回】；用户选择后生成己方状态卡，原卡立即结算。\n- 已收款/已退回卡不带 data-tf，不再触发转账弹窗；点击只出现复制文字、引用、收藏、删除、取消。\n- 修复 bindScreenInner 中 data-tf/data-bub 使用单元素选择器导致整段聊天绑定中断的问题。\n- 本轮截图证据：round146-transfer-pending-modal.png、round146-transfer-received-chat.png、round146-transfer-returned-chat.png、round146-transfer-settled-menu.png；真机无隐私钱包截图：round146-real-device-wallet.png。\n`;
const anchor='- 当前全量 28/28、微信历史 10/10、转账专项 16/16、几何断言 7/7；Release/ZIP 已构建，真机覆盖安装成功。\n';
s=s.replace(anchor,()=>anchor+section);fs.writeFileSync(file,s,'utf8');console.log('STATE updated');
