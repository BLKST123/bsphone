# BS 小手机 3.81 / Build 92 r2｜旧分支记忆隔离与 Prompt 分层｜返修复检报告

- 日期：2026-11-05
- 被检报告：
  - `BS小手机_3.81_Build92_连续消息组重roll_第二轮独立复检报告_2026-11-05.md`
  - `BS小手机_3.81_Build92_连续消息组重roll_返修复检_首席QA独立复检报告_2026-11-05.md`
- 源码提交：`fa358f461d2f87f858ccef4174a063bc1f2b434b`
- 版本：3.81 / Build 92
- Service Worker：`bsphone-v92-20261105-r2`
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 最终判定：**PASS（限定连续 user 消息组重 roll、旧分支记忆隔离、Prompt 四层顺序范围）**

## 1. 结论

两份复检报告的共同阻断项已经修复：

| 编号 | 问题 | 本轮结果 |
|---|---|---|
| QA-381-04 / P0-3 | 旧分支的会话摘要与自动结构化记忆进入新分支 Prompt | PASS |
| QA-381-05 / P1 | 记忆块位于历史之前，临时 nudge 混入半静态层 | PASS |
| P2 | 发布缓存键仍为 r1 | PASS，已更新为 r2 |
| 既有项 | 真实连续组、分支 active、环境时间、失败回滚、备份与重载 | 全量回归 PASS |

本轮没有改 UI 布局、没有重排页面、没有改变 Store 的写入边界。业务改动集中在 Prompt 装配、记忆可见性判断、turn branch 记忆快照和缓存版本。

## 2. 版本与哈希

- 源码提交：`fa358f461d2f87f858ccef4174a063bc1f2b434b`
- 源码 `index.html` SHA-256：`5099E7921F441F402E096296A131A289D5F66691AED7A5AC722D1130666034ED`
- Debug APK SHA-256：`A5DFFDB099B96C6DF2BB796DD0DB54CBD2237394AD56564AFDDBE53D943FBC63`
- Release APK SHA-256：`6016BD519FEC58BA6F49E80BBE83D558385C909AB53BB20212F95A0A7BB4C95A`
- 发布候选：`C:\Users\lenovo\Documents\ChatGPT\各种的\_release_candidate_2026-11-05_Build92_r2\BS小手机_3.81_Build92_r2.apk`
- 公共 APK：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\BS小手机.apk`
- 缓存键：`bsphone-v92-20261105-r2`

Debug 与 Release APK 内嵌的 `assets/public/index.html` 哈希均与源码一致。

## 3. QA-381-04：旧分支记忆隔离

### 根因

旧实现把聊天记忆的 branch 身份固定为 `chat.branchId`，而 turn branch 实际保存在 `chat.turnBranches[turnId]`。因此：

- 旧分支自动摘要的 `sourceMessageIds` 没有参与 Prompt 可见性判断；
- `chat.mem.items` 作为全聊天字符串直接注入；
- 会话摘要在分支切换后仍可被新分支读取。

### 修复

- 新增当前消息可见 ID 集合。
- 自动记忆只有在其全部 `sourceMessageIds` 仍存在于当前消息路径中时才注入。
- 无来源的旧版摘要通过 branch 快照 `legacyMemItems` 隔离；新分支不继承旧尾部摘要。
- 分支对象新增可选字段：
  - `memoryItemIds`
  - `legacyMemItems`
- 生成新分支时使用 pending 记忆上下文，生成完成后再写入分支，避免测试和 UI 在生成过程中提前看到半成品分支。
- 切回原始分支时恢复原始分支的 `memoryItemIds` 与 `legacyMemItems`。
- 手动记忆、核心记忆和用户修正记忆继续按既有全局/会话规则保留。

### 验收

真实执行自动总结后：

- 新分支 Prompt 不含旧自动摘要；
- 新分支 Prompt 不含旧结构化记忆；
- 手动记忆仍然存在；
- 切回旧分支后，旧摘要和旧结构化记忆重新出现；
- 再次切回新分支后，旧记忆再次被隔离。

证据：

- `docs/testing/independent-turn-memory-branch-audit-2026-11-05.json`
- `docs/testing/qa-turn-auto-memory-branch-fix-2026-11-05.json`
- `docs/testing/qa-turn-memory-prompt-fix-2026-11-05.json`

## 4. QA-381-05：Prompt 四层顺序

### 修复

`promptBundleOf()` 现在把记忆从 `semi` 中拆出，`buildCachedMessages()` 按以下顺序组装实际请求：

```text
stable
semi
history
memory (system)
dynamic instruction (system)
environment (system)
final user (user)
```

其中：

- 记忆块前缀为 `[MEMORY_CONTEXT — PAST FACTS, NOT USER SPEECH]`；
- 环境块前缀为 `[ENVIRONMENT_CONTEXT — NOT USER SPEECH]`；
- 重 roll 的 nudge 作为独立本轮 system 指令，不再改写半静态前缀；
- 最后一条 user 仍只包含用户真实输入（存在当前用户输入时）。

### 验收

`qa-prompt-layers` 7/7 PASS：

- memory index 在 history 之后；
- nudge index 在 history 之后；
- environment 在 memory/nudge 之后、最后 user 之前；
- 最后 user content 仍为用户输入。

证据：

- `docs/testing/qa-prompt-layers-2026-11-05.json`
- `docs/testing/qa-turn-reroll-independent-2026-11-05.json`

## 5. 缓存与兼容

- `sw.js` 与 `version.json` 已更新为 `bsphone-v92-20261105-r2`。
- 旧 `r1` 缓存不会再被新构建复用。
- 新 branch 字段均为可选，旧数据在打开分支时按原始/重生成分支语义补齐；未删除旧消息、旧分支或旧记忆。
- 写入仍走 `core-store` 的 chat/message 命令；Store 隔离未被绕过。

## 6. 测试矩阵

### 6.1 核心断言

| 测试 | 结果 |
|---|---|
| 主队连续组重 roll | 19/19 PASS |
| 红队独立 Prompt 审计 | 9/9 PASS |
| 红队独立分支审计 | 6/6 PASS |
| 独立 Prompt 检查 | 14/14 PASS |
| 分支 UI 一致性 | 5/5 PASS |
| 多分支持久化 | 7/7 PASS |
| Prompt 分层顺序 | 7/7 PASS |
| 旧分支记忆隔离独立审计 | 3/3 PASS |
| 旧分支记忆/Prompt 双向恢复 | 13/13 PASS |
| 自动总结分支隔离 | 7/7 PASS |

核心复跑日志：

`docs/testing/round116-final-core-assertions-2026-11-05.log`

### 6.2 真机 Debug 测试

设备：OPPO PMK110 / Android 16 / 1272×2772，序列号 `3B665K02PNH00000`。

| 测试 | 结果 |
|---|---|
| R114 实际 touchstart 长按整组重 roll | 5/5 PASS |
| 真机分支切换 UI | 5/5 PASS |
| 真机导出 | 10/10 PASS |
| 真机分组 | 9/9 PASS |
| 真机数据管理 | 8/8 PASS |

日志：

`docs/testing/round116-phone-debug-suite-final-2026-11-05.log`

R101 首轮曾出现一次 `43.99998px` 的亚像素测量并失败；清理弹层后立即复跑，卡片恢复为 `44.000003px`，10/10 PASS。最终报告采用复跑通过证据，不把亚像素瞬时值当作 UI 合格证据。

### 6.3 全页与回归

| 测试 | 结果 |
|---|---|
| R97 桌面/窄屏 | 33 + 33 页 PASS，返回链路 6/6 |
| R108 P1 自检 | PASS |
| R109 Service Worker r2 | 6/6 PASS |
| 数据管理 | 17/17 PASS |
| 分组语义 | 14/14 PASS |
| 批次 3 红队修复 | 13/13 PASS |

日志：

`docs/testing/round116-final-regression-suite-2026-11-05.log`

### 6.4 构建

- Gradle Debug：BUILD SUCCESSFUL
- Gradle Release：BUILD SUCCESSFUL
- 两个 APK 内嵌 `assets/public/index.html` 哈希与源码一致

构建日志：

`docs/testing/build92-r2-native-build-2026-11-05.log`

## 7. 最终 Release 真机巡检

最终安装：Release 3.81 / versionCode 92，使用 `adb install -r` 覆盖安装，未执行 `pm clear`。

9/9 自动断言 PASS：

- 设备内 APK 回拉 SHA-256 与发布候选一致：`6016BD519FEC58BA6F49E80BBE83D558385C909AB53BB20212F95A0A7BB4C95A`
- `versionName=3.81`、`versionCode=92`
- `firstInstallTime=2026-10-20 23:07:55`、`ceDataInode=2120975` 未变化
- 冷启动 `Status: ok`
- 进程存活、WebView 根节点存在
- 截图非空
- App 进程日志中未发现 FATAL EXCEPTION、ANR 或进程死亡

人工巡检 PASS：

- 长按连续 user 消息“没有”；
- 菜单出现“重新生成整个连续组”和“聊天分支”；
- 打开确认页，确认页同时带出“没有”和“那个是系统自动发的”；
- 随后取消，未调用模型、未改写消息、未改变分支。

证据：

- `docs/testing/round115-phone-release-final-2026-11-05.json`
- `docs/testing/round115-phone-release-final-logcat-2026-11-05.txt`
- `docs/testing/round116-release-chat.png`
- `docs/testing/round116-release-longpress.png`
- `docs/testing/round116-release-reroll-confirm.png`

说明：OPPO 的 `uiautomator` 辅助进程曾出现一次自身 Bad file descriptor，随后 hierarchy 仍成功导出、App 进程持续存活。最终 smoke 断言只对 `com.xiaoshouji.app` 的 crash/ANR 判失败，不把系统辅助工具的异常误判为 App 失败。

## 7.1 测试更正说明

以下调整是把断言对齐到新 PRD 层级和 r2 版本，不是降低业务标准：

- R109 的期望缓存键从 `r1` 更新为 `r2`，因为本轮明确要求失效旧缓存。
- 批次 3 的同角色记忆隔离检查从 `promptBundle.stable` 改查 `promptBundle.memory`。记忆已按 PRD 移到历史之后，但“只允许出现本人设记忆”的断言未放宽。
- 最终 Release smoke 的 logcat 检查只把 `com.xiaoshouji.app` 自身的 FATAL/ANR 判失败。OPPO 的 `uiautomator` 辅助进程自身异常不计为 App 崩溃，但 App 进程存活、WebView 根节点、截图和冷启动仍逐项断言。
- `round116-core-regression-before-cache-*`、`round116-regression-suite-*`、`round116-phone-debug-suite-*` 是中间失败审计记录；最终以 `round116-final-*` 和 `round116-phone-debug-suite-final-*` 为准，未删除中间反证。
## 8. 证据链

- 证据总清单：`docs/testing/round116-evidence-manifest-2026-11-05.json`
- 核心断言日志：`docs/testing/round116-final-core-assertions-2026-11-05.log`
- 回归日志：`docs/testing/round116-final-regression-suite-2026-11-05.log`
- 真机 Debug 日志：`docs/testing/round116-phone-debug-suite-final-2026-11-05.log`
- 构建日志：`docs/testing/build92-r2-native-build-2026-11-05.log`
- 最终 Release 日志：`docs/testing/round115-phone-release-final-logcat-2026-11-05.txt`

所有最终证据 JSON 均附带：

- `sourceCommit=fa358f461d2f87f858ccef4174a063bc1f2b434b`
- `indexSha256`
- `debugApkSha256`
- `releaseApkSha256`
- `version=3.81`
- `versionCode=92`
- `cacheKey=bsphone-v92-20261105-r2`

## 9. 残余边界

- 未推送 GitHub Pages。
- 未替换线上 APK。
- 编辑并重新生成、任意节点手动创建分支、图片消息重 roll、图片分支、ZIP + assets 发布级归档仍不在本轮实现范围。
- 本轮为本地构建、本地 Release 覆盖安装和本地证据链；线上发布仍需单独授权和线上/本地/SW 三方哈希核对。

## 10. 最终签署

```text
真实连续消息组：通过
旧尾部消息归档：通过
新旧分支切换与 active：通过
环境时间身份隔离：通过
旧分支自动摘要隔离：通过
旧分支结构化记忆隔离：通过
旧分支记忆切回恢复：通过
Prompt 分层与缓存前缀稳定性：通过
缓存键 r2：通过
最终 Release 真机安装与数据保留：通过
本阶段返修：PASS
```