# BS 小手机 STATE

## 当前版本

- 页面：2026-11-05 · 3.81 · 第 92 轮
- Android：3.81 / versionCode 92
- Service Worker：`bsphone-v92-20261105-r1`
- 源码 SHA-256：`0A0E0C3E77BDF22F3C4AD78870D0BBBD1F59263A3248F22504FA45167E941268`
- Release APK SHA-256：`40E0DDA009DC720A720B61A5DA2B559C2E05F9E694F277A33C5C126486544BCC`

## 当前阶段

- 连续 user 消息组整组重 roll 已完成返修。
- P0-1：真实新消息在 pushMsg/core-store 源头生成 turnId/messageGroupId。
- P0-2：分支切换先更新 activeBranchId，再原子保存消息与分支状态。
- QA-381-02：环境时间改为 system 环境块，最后一条 user 只包含真实输入。
- 真机使用实际 touchstart 450ms 长按路径复检通过。
- 真机 Debug 验证后已覆盖安装回 Release，应用数据保留。

## 尚未完成

- 编辑并重新生成
- 从任意节点手动创建分支
- 图片消息重 roll / 图片分支
- 已隐藏内容恢复页
- ZIP + assets 发布级归档
- GitHub Pages 线上发布

## 最近证据

- `docs/testing/independent-turn-reroll-audit-2026-11-05.json`
- `docs/testing/independent-turn-branch-switch-audit-2026-11-05.json`
- `docs/testing/qa-turn-branch-switch-ui-2026-11-05.json`
- `docs/testing/qa-turn-reroll-multi-2026-11-05.json`
- `docs/testing/round114-phone-turn-reroll.json`
- `docs/testing/build92-native-release-rework-2026-11-05.log`