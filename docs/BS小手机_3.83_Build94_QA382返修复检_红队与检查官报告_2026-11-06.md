# BS小手机 3.83 / Build 94｜QA-382 返修复检｜红队与检查官报告

- 日期：2026-11-06
- 被检报告：
  - `BS小手机_3.82_Build93_全项目QA复检报告_2026-11-06.md`
  - `BS小手机_3.82_Build93_完整独立复检报告_2026-11-06.md`
- 源码提交：`b91d09ba934b8065efb6ec4c0baf72551c75bd38`
- 版本：3.83 / Build 94
- Service Worker：`bsphone-v94-20261106-r1`
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 最终判定：**PASS（QA-382 返修范围）**

## 1. 最终结论

两份复检报告指出的阻断项均已修复：

| 编号 | 问题 | 本轮结果 |
|---|---|---|
| QA-382-01 | “忘记这条”未清理长期记忆、会话快照、旧分支摘要和检索记忆 | PASS |
| QA-382-02 | 普通删除未同步当前 active branch 快照 | PASS |
| QA-382-03 | 分支菜单缺少导出和删除 | PASS |
| QA-382-04 | R101 44×44 亚像素抖动 | PASS，稳定边界为 44.0089 |
| 追加 | 混合文字+图片/卡片组缺少保留/移除/取消选择 | PASS |

本期已有的编辑并重新生成、手动分支创建与继续聊天、旧分支记忆隔离、Prompt 分层、环境时间隔离和连续组重 roll 没有回滚，全部重新回归通过。

## 2. 版本与产物

- 源码提交：`b91d09ba934b8065efb6ec4c0baf72551c75bd38`
- 源码 SHA-256：`9504BA72B4A6A1933FF7805ADF345862BF398B4340E23C1CB940A1FEAA369331`
- Debug APK SHA-256：`EC5BC1CD728F0EA4AAD5956D31CB66F51DEA20B24CC71ACCB6CB8E42AFE32459`
- Release APK SHA-256：`37CE74874C3584828EE92C84D6C284A8705A2AC09C053C6CF2FD69D4AB3681AE`
- 缓存键：`bsphone-v94-20261106-r1`
- 发布候选：`C:\Users\lenovo\Documents\ChatGPT\各种的\_release_candidate_2026-11-06_Build94\BS小手机_3.83_Build94.apk`
- 公共 APK：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\BS小手机.apk`

Debug/Release 内嵌 `assets/public/index.html` 均与源码哈希一致。

## 3. QA-382-01：忘记这条跨数据源清理

### 修复范围

`forgetCharMessage()` 现在同步清理：

- 当前聊天流 `ch.msgs`
- 所有 turn branch 的 `messages`
- 所有 turn branch 的 `legacyMemItems`
- 所有 turn branch 的 `memoryItemIds`
- `DB.memoryItems` 中来源包含该消息、或正文包含该文本的条目
- `DB.contacts[].memories`
- `chat.baseMemorySnapshot`
- `chat.mem.items`
- `DB.memoryEntries`
- 当前 session 的 memory cursor
- 下一次实际 Prompt 的记忆注入结果

保留：

- 记忆版本历史 `DB.memoryVersions`
- usage 统计
- 订单实体
- 相册实体
- 收藏实体

### 独立反证复跑

- `independent-forget-memory-scope-audit-2026-11-06.json`：2/2 PASS
- `qa-forget-branch-memory-2026-11-06.json`：6/6 PASS

结果：

- 当前聊天消息移除；
- contact long-term memory 清空；
- baseMemorySnapshot 清空；
- branch legacy 清空；
- branch memoryItemIds 清空；
- memoryEntries 清空；
- Prompt 不再包含被忘记文本；
- cursor 回退到仍然存在的消息。

## 4. QA-382-02：普通删除同步活动分支

普通删除二次确认执行后：

- 当前 `ch.msgs` 删除目标消息；
- 当前 active branch snapshot 同步删除该消息；
- 非活动旧分支不被普通删除自动改写；
- 分支菜单预览、切换和重载不再复活已删除消息。

证据：

- `qa-delete-branch-snapshot-2026-11-06.json`
- 3/3 PASS

## 5. QA-382-03：分支导出与删除

### 分支导出

分支菜单现在每个分支都有：

- 导出
- 删除

导出内容包含：

- 格式标识与导出时间；
- chat 元信息；
- turnId / anchor message；
- 分支前缀消息；
- 完整 branch messages；
- 分支 memoryItemIds / legacyMemItems / kind。

证据：

- `qa-branch-export-delete-2026-11-06.json`：5/5 PASS
- 真机 `round118-phone-qa382.json`：导出 payload 验证 PASS

### 分支删除

- 删除需两次确认；
- 第一次明确说明只删该分支快照，不影响其它分支和当前聊天；
- 第二次最终执行；
- active 分支不允许直接删除，必须先切换到其它分支，避免当前聊天被意外清空；
- 删除后 active 与剩余分支保持有效。

### 测试语义纠偏

把原先错误的：

`branchListHasNoExportDeleteActions = true`

改为：

`branchListHasExportDeleteActions = true`

并纳入最终通过与 manifest。

## 6. 混合文字+图片/卡片组

混合组现在不再简单拒绝，而是：

- 编辑器只预填文本子段；
- 提供“保留并重新生成”和“移除并重新生成”；
- 重新生成确认层同样提供保留/移除；
- 图片和卡片可保留在新分支，但不进入文字模型；
- 选择移除时，卡片只在旧分支保留；
- 旧分支完整保留原始图片、文字和旧回复；
- 实际 Prompt 只含文本，不含图片数据或旧回复正文。

验证：

- `independent-mixed-group-edit-audit-2026-11-06.json`：2/2 PASS
- `qa-mixed-group-edit-lifecycle-2026-11-06.json`：6/6 PASS
- 真机 `round118-phone-qa382.json` 包含保留模式真实验证。

## 7. R101 44×44 抖动

处理：

- 将数据管理刷新按钮的命中边界从纯 44px 调整到稳定 `44.01px`；
- 真机最终实际测量：
  - 宽：`44.00893020629883`
  - 高：`44.00893020629883`
- R101 最终 10/10 PASS。

没有降低 44×44 验收标准。

## 8. 核心断言结果

最终核心日志：

`docs/testing/round118-final-core-qa382-2026-11-06.log`

全部 PASS：

| 测试 | 结果 |
|---|---|
| 微信编辑/手动分支模块 | 26/26 |
| 连续组重 roll | 19/19 |
| 独立 Prompt 审计 | 9/9 |
| 独立分支审计 | 6/6 |
| 独立 Prompt 检查 | 14/14 |
| 分支 UI 一致性 | 5/5 |
| 多分支持久化 | 7/7 |
| Prompt 分层 | 7/7 |
| 旧分支记忆隔离 | 3/3 |
| 自动总结分支隔离 | 7/7 |
| 手动分支继续审计 | 3/3 |
| 混合组选择可达 | 2/2 |
| 忘记长期记忆范围 | 2/2 |
| 忘记分支记忆 | 6/6 |
| 普通删除分支快照 | 3/3 |
| 分支导出/删除 | 5/5 |
| 混合组生命周期 | 6/6 |

## 9. 全量回归

日志：

`docs/testing/round118-final-regression-suite-2026-11-06.log`

结果：

- R97 桌面 33 + 窄屏 33 PASS；
- R97 深色 33 + 窄屏 33 PASS；
- R108 PASS；
- R109 Service Worker r4 6/6 PASS；
- 数据管理 17/17 PASS；
- 分组语义 14/14 PASS；
- 批次 3 红队修复 13/13 PASS。

深色证据：

`docs/testing/qa-r97-dark-2026-11-06.json`

## 10. 真机巡检

真机 Debug 最终套件：

`docs/testing/round118-phone-debug-suite-final-2026-11-06.log`

结果：

| 测试 | 结果 |
|---|---|
| QA-382 数据/分支/混合组 | 10/10 PASS |
| 微信编辑与手动分支 | 8/8 PASS |
| R114 连续组重 roll | 5/5 PASS |
| 真机分支切换 | 5/5 PASS |
| R101 导出 | 10/10 PASS |
| R112 分组 | 9/9 PASS |
| R113 数据管理 | 8/8 PASS |

真机截图：

- `docs/testing/round118-phone-branch-actions.png`
- `docs/testing/round118-phone-mixed-editor.png`

最终 Release：

- 设备内版本 3.83 / versionCode 94
- 设备内 APK 回拉哈希 `37CE74874C3584828EE92C84D6C284A8705A2AC09C053C6CF2FD69D4AB3681AE`
- 与 Release 候选一致
- `firstInstallTime=2026-10-20 23:07:55` 未变化
- `ceDataInode=2120975` 未变化
- 未执行 `pm clear`
- 冷启动 Status ok
- WebView 根节点存在
- App 进程无 FATAL EXCEPTION / ANR

Release smoke：9/9 PASS。

证据：

- `docs/testing/round115-phone-release-final-2026-11-05.json`
- `docs/testing/round115-phone-release-final-logcat-2026-11-05.txt`

## 11. 证据链

总清单：

`docs/testing/round118-evidence-manifest-2026-11-06.json`

内容：

- 32 个测试 JSON；
- 5 个日志；
- 3 张当前构建截图；
- 所有测试/日志/截图绑定：
  - sourceCommit `b91d09ba934b8065efb6ec4c0baf72551c75bd38`
  - index `9504BA72B4A6A1933FF7805ADF345862BF398B4340E23C1CB940A1FEAA369331`
  - Debug `EC5BC1CD728F0EA4AAD5956D31CB66F51DEA20B24CC71ACCB6CB8E42AFE32459`
  - Release `37CE74874C3584828EE92C84D6C284A8705A2AC09C053C6CF2FD69D4AB3681AE`
  - cacheKey `bsphone-v94-20261106-r1`

失败反证已纳入并转为通过，不再只维护 23 项“全绿子集”。

## 12. Store 与兼容边界

- 编辑、手动分支、普通删除继续通过 `coreStore().commands.replaceMessages/patchChat/deleteMessage`；
- 分支导出为只读快照；
- 新 branch 字段为可选，旧备份可直接导入；
- 未修改 Global Store 数据流或其它模块数据模型；
- 未删除原有菜单、分支、复制、引用、收藏、撤回、删除功能。

## 13. 本轮未包含

- 图片消息重 roll；
- 图片分支全屏页；
- 已隐藏内容恢复页；
- ZIP + assets 发布级归档；
- GitHub Pages 线上发布。

## 14. 最终签署

**QA-382-01：通过。**  
**QA-382-02：通过。**  
**QA-382-03：通过。**  
**QA-382-04：通过。**  
**混合组编辑/重生成：通过。**  
**全量回归与真机：通过。**  
**3.83 / Build 94 QA-382 返修：PASS。**