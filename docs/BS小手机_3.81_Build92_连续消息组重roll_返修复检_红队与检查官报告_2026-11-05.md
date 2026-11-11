# BS小手机 3.81 / Build 92｜连续消息组重 roll 返修复检｜红队与检查官报告

- 日期：2026-11-05
- 返修对象：`BS小手机_3.81_Build92_连续消息组重roll_独立复检报告_2026-11-05.md`、`BS小手机_3.81_Build92_连续消息组重roll_首席QA独立复检报告_2026-11-05.md`
- 源码提交：`506cc919139ce3060eb1c5b3b9aef04d31a116a0`
- 版本：3.81 / Build 92
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 当前状态：本轮修复项桌面、独立复检、真机和构建全部通过；尚未线上发布

## 1. 最终判定

本轮已修复两份复检报告指出的阻断项：

- P0-1：真实新消息没有即时 `turnId/messageGroupId`
- P0-2 / QA-381-01：分支切换后 `activeBranchId` 不跟随目标分支
- QA-381-02：环境时间被拼入最后一条 `user` 消息
- QA-381-03：3.81/Build92 未提交、测试证据链不完整
- P1：真机测试未走实际 touchstart 450ms 长按路径
- P2：失败双 toast、非文本组引导文案指向未实现功能

结论：

```text
真实连续消息组识别：通过
整组重 roll：通过
旧尾部归档：通过
新旧分支双向切换：通过
activeBranchId 与显示内容一致性：通过
环境时间身份隔离：通过
失败回滚：通过
重载与备份：通过
真机实际长按：通过
源码/构建/证据可追溯：通过
本里程碑返修签收：通过
```

本报告只覆盖连续 user 消息组重 roll 范围；不代表微信批次 3 全量和线上发布签收。

## 2. 版本与哈希

- 页面：`2026-11-05 · 3.81 · 第 92 轮`
- Android：`versionName=3.81 / versionCode=92`
- Service Worker：`bsphone-v92-20261105-r1`
- 源码提交：`506cc919139ce3060eb1c5b3b9aef04d31a116a0`

源码 SHA-256：

`F64060C831F6212E9CDC340B4ACFE81251E0EADEED26AEECAD3042DCAC817AB4`

Debug APK SHA-256：

`E9C1AC3C5BCAC9503982EBD4E93766D579A8B920953A2B47FFD448F0FCA030FC`

Release APK SHA-256：

`8A263FD43D5F7E2F1E35C7269DDC863FB387AC61ACDDE86520F6E8F7B186BD9B`

发布候选：

`C:\Users\lenovo\Documents\ChatGPT\各种的\_release_candidate_2026-11-05_Build92\BS小手机_3.81_Build92.apk`

真机最终安装：Release 3.81 / versionCode 92，使用 `adb install -r` 覆盖安装。

设备内安装包回拉 SHA-256 与 Release 候选一致：`8A263FD43D5F7E2F1E35C7269DDC863FB387AC61ACDDE86520F6E8F7B186BD9B`。

安装前与安装后 `firstInstallTime=2026-10-20 23:07:55`、`ceDataInode=2120975` 不变，确认应用数据保留；未执行 `pm clear`。

## 3. P0-1：真实消息组身份修复

### 根因

`pushMsg()` 和 `core-store.appendMessage()` 只写入基础字段，`turnId/messageGroupId` 依赖启动时 `fixAll()` 补齐。页面不重载时，用户连发的两条消息会被识别成两个独立组。

### 修复

- `pushMsg()` 新增统一 `inferChatMessageMeta()`：
  - 连续相同角色的 message 复用 `turnId/messageGroupId`。
  - 新 user 组生成新 turn/group。
  - 角色回复继承当前 user turn，新角色消息组生成新 group。
- `core-store.appendMessage()` / `appendMessages()` 增加同样的底层兜底。
- 不再依赖 `fixAll()` 才能得到正确组身份。
- 真实 `sendText()` 连发测试通过，没有手工注入 turn/group 字段。

### 验收

- 连续两条真实发送消息拥有相同 `turnId` 与 `messageGroupId`。
- 长按第一条或第二条，确认框都包含整组。
- 重载后组身份不变。

## 4. P0-2 / QA-381-01：分支 active 状态修复

### 根因

`chooseTurnBranch()` 先 patch 深拷贝了 `turnBranches`，之后才修改旧的 `state.activeBranchId`，造成消息内容已经切换、active 元数据却没有切过去。

### 修复

- 先设置 `state.activeBranchId = target.id`。
- 再生成完整 `turnBranches` 快照。
- 随后写入分支状态并替换消息，保证 active、菜单 ✓、聊天内容一致。
- 连续两次重 roll 会保留三个分支：原始版本、重新生成 1、重新生成 2。
- 已验证原始 → 新1 → 新2 → 原始 → 新1 双向切换，快照不被覆盖。

## 5. QA-381-02：环境时间身份隔离

### 根因

`buildCachedMessages()` 将 `bundle.dynamic` 与当前用户输入拼成同一条 `user` 消息。

### 修复

- 环境时间单独作为：
  - `role=system`
  - 前缀：`[ENVIRONMENT_CONTEXT — NOT USER SPEECH]`
- 最后一条 `user` 消息只包含用户真实输入。
- 实际 Prompt 捕获结果：
  - 最后一条角色：`user`
  - 最后一条内容：`第二句`
  - 时间只出现在 system 环境块。

## 6. 测试覆盖修复

- 主队原测试新增真实 `sendText()` 连发入口，不再只用手工预置 turn/group。
- 主队测试增加实际 `callModel` messages 捕获和断言。
- 分支切换同时断言内容、activeBranchId 和菜单当前项。
- 重载后断言 active 与当前显示分支一致。
- 真机 R114 改为实际 `touchstart` 后等待 520ms（覆盖 450ms 判定阈值）的长按，不再用 click 代替。
- R101/R112/R113/R114 证据 JSON 均记录 `indexSha256`、Debug APK、Release APK、版本和缓存键。
- 修正了两条复检脚本自身的清理/旧引用缺陷，未放宽业务断言。

## 7. 测试矩阵

| 测试 | 结果 | 证据 |
|---|---|---|
| 主队连续组重 roll | 19/19 PASS | `docs/testing/qa-chat-turn-reroll-2026-11-05.json` |
| 红队独立 Prompt 审计 | 9/9 PASS | `docs/testing/independent-turn-reroll-audit-2026-11-05.json` |
| 红队独立分支审计 | 6/6 PASS | `docs/testing/independent-turn-branch-switch-audit-2026-11-05.json` |
| 独立 Prompt 检查 | 14/14 PASS | `docs/testing/qa-turn-reroll-independent-2026-11-05.json` |
| 分支 UI 一致性 | 5/5 PASS | `docs/testing/qa-turn-branch-switch-ui-2026-11-05.json` |
| 多分支持久化 | 7/7 PASS | `docs/testing/qa-turn-reroll-multi-2026-11-05.json` |
| 真机长按整组重 roll | 5/5 PASS | `docs/testing/round114-phone-turn-reroll.json` |
| 真机导出 | PASS | `docs/testing/round101-phone-export.json` |
| 真机分组 | PASS | `docs/testing/round112-phone-batch3-fix.json` |
| 真机数据管理 | PASS | `docs/testing/round113-phone-data-management.json` |
| 最终 Release 覆盖安装与冷启动 | 9/9 PASS | `docs/testing/round115-phone-release-final-2026-11-05.json` |
| 最终 Release 真机连续组菜单 | PASS | `docs/testing/round115-longpress-user2.png`、`docs/testing/round115-reroll-confirm.png` |
| 全页 UI | 33 × 桌面/窄屏 PASS | `docs/testing/round97-full-page-ui.json` |
| P1 自检 | PASS | `docs/testing/round108-p1-recheck.json` |
| Service Worker | PASS | `docs/testing/round109-service-worker.json` |
| 数据管理 | 17/17 PASS | `docs/testing/qa-data-management-2026-11-05.json` |
| 分组语义 | 14/14 PASS | `docs/testing/qa-independent-batch3-recheck.json` |
| Android Debug/Release | BUILD SUCCESSFUL | `docs/testing/build92-native-release-rework-2026-11-05.log` |

## 7.1 最终 Release 真机巡检

巡检设备：OPPO PMK110 / Android 16 / 1272×2772，序列号 `3B665K02PNH00000`。

自动断言：9/9 PASS。

- 设备内 `versionName=3.81`、`versionCode=92`。
- 设备内 `base.apk` 回拉哈希与发布候选完全一致。
- Release 冷启动 `Status: ok`，进程存活，WebView 根节点存在。
- 截图非空，重启后历史聊天内容仍在。
- 日志中未发现 `FATAL EXCEPTION`、ANR 或进程崩溃。

人工巡检：PASS。

- 在正式聊天页长按连续 user 消息“没有”，菜单出现“重新生成整个连续组”和“聊天分支”。
- 点击整组重生成后，确认页同时列出“没有”和“那个是系统自动发的”两条消息。
- 本次只检查确认页，随后点击取消；未调用模型、未改写消息、未改变分支。
- 正式聊天页未出现版本、分支、Token、模型或测试角标。

证据：

- `docs/testing/round115-phone-release-final-2026-11-05.json`
- `docs/testing/round115-phone-release-final-logcat-2026-11-05.txt`
- `docs/testing/round115-release-final-home.png`
- `docs/testing/round115-longpress-user2.png`
- `docs/testing/round115-reroll-confirm.png`

## 8. 红队重点复核项

请重点验证：

1. 不手工设置 turn/group，直接连发 2～3 条，长按第二/第三条。
2. 原始分支 → 新1 → 新2 → 原始 → 新1，连续切换 4 次以上。
3. 每次切换同时检查聊天内容、activeBranchId、菜单当前 ✓。
4. 关闭/重载后再次切换，确认 active 与显示内容一致。
5. 捕获实际 Prompt，最后一条 user 只能是用户原话，时间必须位于 system 环境块。
6. 非文本组不得弹生成确认、不得调用模型。
7. 真机使用实际 touchstart，并等待超过 450ms 阈值，不用 click 代替。
8. 失败时只出现一条最终错误提示。
9. 正式聊天页无版本/分支角标。
10. 导出备份包含完整 `turnBranches`。

## 9. 证据链

- 源码和构建资源已提交到 `506cc919139ce3060eb1c5b3b9aef04d31a116a0`。
- `STATE.md`、`DECISIONS.md` 已更新。
- 关键证据复制到 `_ghpages/docs/testing/`。
- 证据 JSON 记录源码、Debug/Release APK 哈希、版本、版本号和缓存键。
- 最终 Release 覆盖安装、设备内 APK 回拉哈希、数据保留、冷启动与日志巡检证据已归档。
- 核心断言复跑日志：`docs/testing/round115-core-assertions-2026-11-05.log`，6 个测试脚本全部 PASS。

## 10. 尚未完成

- 编辑并重新生成
- 从任意节点手动创建新分支
- 图片消息重 roll / 图片分支
- 已隐藏内容全屏恢复
- ZIP + assets 发布级归档
- GitHub Pages 线上发布

## 11. 最终判定

在本报告限定的连续 user 消息组整组重 roll 范围内：

**打回项已修复，PASS，可交红队和首席 QA 复检。**
