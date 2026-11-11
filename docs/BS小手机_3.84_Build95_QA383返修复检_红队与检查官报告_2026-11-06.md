# BS小手机 3.84 / Build 95｜QA-383 返修复检｜红队与检查官报告

- 日期：2026-11-06
- 被检报告：
  - `BS小手机_3.83_Build94_完整独立复检报告_2026-11-06.md`
  - `BS小手机_3.83_Build94_全项目QA复检报告_2026-11-06.md`
- 源码提交：`d9ffd7f2cc5eafbe62ab8add719599fc0a031059`
- 版本：3.84 / Build 95
- Service Worker：`bsphone-v95-20261106-r1`
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 最终判定：**PASS（QA-383 返修范围）**

## 1. 结论

两份复检报告的阻断项已修复：

| 编号 | 问题 | 本轮结果 |
|---|---|---|
| QA-383-01 | 忘记短文本会按任意子串误删无关记忆 | PASS |
| 追加 P2 | 混合组保留图片/卡片后位置发生漂移 | PASS |
| 追加 P2 | R113 仍使用 43.5px 门槛 | PASS |
| 追加 P1 | Debug/CDP 真机路径不可复现 | PASS |

上一轮已通过的编辑重生成、手动分支、分支导出/删除、普通删除快照、Prompt 分层、旧分支记忆隔离和混合组选择全部保留并重新回归。

## 2. 版本与产物

- 源码提交：`d9ffd7f2cc5eafbe62ab8add719599fc0a031059`
- 源码 SHA-256：`FFE0F569395573DE180883665B0679BC859DE28EA0762D3D5D7BC1236DB86126`
- Debug APK SHA-256：`FFE0C30501D3EB77E5733618168196F253B4C7E0AE8C0E224E28FE75901CBC24`
- Release APK SHA-256：`75AF7A5252C372F4F609811CF24694417EE7497037A0BD46E149A6188D8BB014`
- 缓存键：`bsphone-v95-20261106-r1`
- 发布候选：`C:\Users\lenovo\Documents\ChatGPT\各种的\_release_candidate_2026-11-06_Build95\BS小手机_3.84_Build95.apk`
- 公共 APK：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\BS小手机.apk`

Debug/Release 内嵌 `index.html` 与源码哈希一致。

## 3. QA-383-01：忘记短文本不再全局子串误删

### 修复规则

- `sourceMessageIds` 精确命中：直接清理；
- 文本匹配不再使用任意子串；
- 无来源记忆只允许：
  - 规范化后完全相等；
  - 或明确的“摘要 / 快照 / 记忆 / 记得 / 事实 / 设定”前缀壳 + 完全相等正文；
- 短文本如“好”“嗯”“可以”不会匹配“用户喜欢好吃的”等长文本；
- 所有清理先限制在当前 chat / 当前 char / 当前群成员作用域。

### 作用域

- `DB.memoryItems`：当前 session、当前 char，或 sourceMessageIds 命中；
- `DB.contacts[].memories`：仅当前会话绑定角色或当前群成员；
- `DB.memoryEntries`：仅当前 chat/contact/persona，或 sourceId 精确命中；
- `chat.mem.items` / `baseMemorySnapshot` / branch legacy：只处理当前 chat；
- 其它角色、其它会话、其它 user 人设原样保留。

### 反证复跑

`qa-forget-substring-scope-2026-11-06.json`：7/7 PASS

验证：

- 当前消息“好”被移除；
- “用户喜欢好吃的”长期记忆保留；
- “用户喜欢好吃的”结构化记忆保持 active；
- 当前 chat.mem / base / branch legacy 中的无关文本保留；
- branch memoryItemIds 中的无关 ID 保留；
- target memory 正确 deleted。

`independent-forget-cross-scope-audit-2026-11-06.json`：4/4 PASS

验证：

- 忘记角色 A 不删除角色 B 长期记忆；
- 不删除会话二 memoryItem；
- 不删除会话二 memoryEntry；
- 会话二 legacy 摘要完整保留。

## 4. 混合组卡片位置

保留模式现在按原文字槽位替换：

- 原 `text → image → text → text`；
- 编辑保留后保持 `text → image → text → text` 的相对位置；
- 新增文字放在后续文字槽位，卡片不再被整体推到末尾；
- 卡片仍不进入文字 Prompt。

`qa-mixed-group-edit-lifecycle-2026-11-06.json`：7/7 PASS，新增 `editKeepImagePosition`。

## 5. 44×44 容差统一

- R113 验收由 `>=43.5` 改为 `>=43.99`，明确记录 `hitTargetTolerancePx=0.01`；
- R101 使用稳定边界实测 `44.0089px`；
- 没有把 43.5 当作 44 通过。

## 6. Debug/CDP 真机复现

已补可复现路径：

`docs/testing/round119-debug-cdp-repro-2026-11-06.txt`

内容包含：

- Debug APK 安装；
- `am start`；
- WebView devtools socket 查找；
- `adb forward tcp:9444`；
- R117/R118/R119 真机脚本；
- 测试后 Release 恢复；
- 版本/数据状态核对。

本轮实际通过该路径复跑了 Debug95 CDP 套件，然后恢复 Release95。

## 7. 真机证据

### 忘记短文本真机巡检

`round119-phone-forget-scope.json`：12/12 PASS

- 当前角色“好”消息删除；
- 当前无关长期记忆保留；
- 当前 chat.mem/base/branch legacy 无关文本保留；
- branch 无关 memoryItemId 保留；
- 其它角色长期记忆保留；
- 其它会话 memoryItem / memoryEntry / legacy 保留；
- cursor 正确回退到仍存在消息。

截图：

- `docs/testing/round119-phone-forget-scope.png`

### 上一轮功能真机回归

- QA-382 真机：10/10 PASS
- R117 真机：8/8 PASS
- R114：5/5 PASS
- 真机分支切换：5/5 PASS
- R101：10/10 PASS
- R112：9/9 PASS
- R113：8/8 PASS

日志：

`docs/testing/round119-phone-debug-suite-final-2026-11-06.log`

## 8. 核心断言

日志：

`docs/testing/round119-final-core-qa383-2026-11-06.log`

19 个脚本全部 PASS：

- 编辑/手动分支：26/26
- 连续组重 roll：19/19
- 独立 Prompt：9/9
- 独立分支：6/6
- Prompt 检查：14/14
- 分支 UI：5/5
- 多分支：7/7
- Prompt 分层：7/7
- 旧分支记忆隔离：3/3
- 自动总结隔离：7/7
- 手动分支继续：3/3
- 混合组选择：2/2
- 旧长文本忘记范围：2/2
- 新短文本精确性：7/7
- 跨角色/跨会话反证：4/4
- 忘记分支记忆：6/6
- 普通删除快照：3/3
- 分支导出/删除：5/5
- 混合组生命周期：7/7

## 9. 全量回归

日志：

`docs/testing/round119-final-regression-suite-2026-11-06.log`

- R97 亮色：33 桌面 + 33 窄屏 PASS，返回 6/6
- R97 深色：33 桌面 + 33 窄屏 PASS
- R108：PASS
- R109：6/6 PASS（`bsphone-v95-20261106-r1`）
- 数据管理：17/17 PASS
- 分组语义：14/14 PASS
- 批次 3 红队修复：13/13 PASS

## 10. 最终 Release 真机

- 设备内版本：3.84 / versionCode 95
- 设备内 APK 回拉哈希：`75AF7A5252C372F4F609811CF24694417EE7497037A0BD46E149A6188D8BB014`
- 与 Release 候选一致
- `firstInstallTime=2026-10-20 23:07:55` 未变化
- `ceDataInode=2120975` 未变化
- 未执行 `pm clear`
- 冷启动 Status ok
- WebView 根节点存在
- App 进程无 FATAL EXCEPTION / ANR

Release smoke：9/9 PASS。

## 11. 证据总清单

`docs/testing/round119-evidence-manifest-2026-11-06.json`

- 35 个测试 JSON
- 6 个日志
- 4 张当前构建截图
- 全部绑定：
  - sourceCommit `d9ffd7f2cc5eafbe62ab8add719599fc0a031059`
  - index `FFE0F569395573DE180883665B0679BC859DE28EA0762D3D5D7BC1236DB86126`
  - Debug `FFE0C30501D3EB77E5733618168196F253B4C7E0AE8C0E224E28FE75901CBC24`
  - Release `75AF7A5252C372F4F609811CF24694417EE7497037A0BD46E149A6188D8BB014`
  - cacheKey `bsphone-v95-20261106-r1`

## 12. 明确未完成

- 图片消息重 roll
- 图片分支全屏页
- 已隐藏内容恢复页
- ZIP + assets 发布级归档
- GitHub Pages 线上发布

## 13. 最终签署

**QA-383-01：通过。**  
**混合组卡片位置：通过。**  
**44×44 容差统一：通过。**  
**Debug/CDP 可复现：通过。**  
**连续组、分支、Prompt、记忆隔离全量回归：通过。**  
**3.84 / Build 95 QA-383 返修：PASS。**