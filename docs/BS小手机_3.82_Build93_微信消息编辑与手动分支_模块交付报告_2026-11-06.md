# BS 小手机 3.82 / Build 93｜微信消息编辑与手动分支｜模块交付报告

- 日期：2026-11-06
- 模块：微信消息菜单、编辑并重新生成、从当前消息创建新分支、角色消息忘记
- 代码提交：`3926a366fcae9169d665bd0a87131cf45096c21a`
- 版本：3.82 / Build 93
- Service Worker：`bsphone-v93-20261106-r1`
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 最终判定：**PASS，本模块可交红队和检查官独立复检**

## 1. 当前模块任务详情

依据：

- `02_微信.md` §5.2、§5.5、§5.6、§6
- `23_终极审计_差异与遗漏清单.md` D-11
- `24_微交互与补充细节清单.md` M-03、M-34、M-35
- `00_总览与红线.md` 删除/清空二次确认、既有功能保留、44×44 命中区

交付范围：

1. user 连续消息组菜单补齐：
   - 重新生成整个连续组
   - 重新编辑并生成
   - 从这里创建新分支
   - 聊天分支
   - 复制文字
   - 引用这条（既有）
   - 收藏这条（既有）
   - 撤回这条（既有）
   - 删除这条
2. 编辑并重新生成完整流程。
3. 从当前 user 消息创建手动分支。
4. char 文本消息增加“忘记这条”，两次确认。
5. 删除消息改为两次确认。
6. 所有新增菜单/编辑器按钮 44×44 以上。

## 2. 编辑并重新生成

实现：

- 长按任意连续纯文本 user 消息打开编辑器。
- 编辑器预填 A+B+C 全文；按换行拆成新气泡。
- 提示文案严格使用：
  “换行会拆成多个气泡；保存后会生成新的 user 版本，原角色回复进入旧分支。”
- 保存后：
  - 每个新 user 气泡生成新的 `message_id`；
  - 所有新气泡沿用原 `turnId`，不增加 turn 数；
  - 新气泡共享新的 `messageGroupId`；
  - 旧 user、旧 char 回复和旧后续消息完整进入原始分支；
  - 只生成编辑组之后的新角色回复；
  - 新回复不继承旧回复之后的剧情；
  - 生成失败完整回滚消息与分支；
  - 结束后关闭编辑器、清除 busy、正常 render。
- 聊天流不显示“已编辑”“版本”“分支”等出戏标记。

桌面实测：

- 旧 user 消息 ID 不在当前分支；
- 新 user 消息 ID 全部不同；
- 3 个新气泡保持同一 `turnId/messageGroupId`；
- 旧回复与后续进入原始分支；
- 实际 Prompt 只包含编辑后消息，不包含旧回复和旧后续；
- 失败回滚前后 JSON 完全一致。

## 3. 从当前消息创建新分支

实现：

- 任意 user 消息菜单可进入“从这里创建新分支”。
- 当前气泡之后的内容进入旧分支。
- 新分支保留到当前 user 消息，之后可继续发送。
- 原始分支完整保存旧尾部。
- 新分支自动成为 active；不调用模型。
- 从“聊天分支”切回原始分支后，旧尾部完整恢复。

实测：

- 分支甲/分支乙之后创建新分支，当前流结束于分支乙；
- 原始分支仍包含旧角色回复和后续回复；
- 新分支 active ID 与当前内容一致；
- 模型调用次数不增加；
- 切回原始分支后内容和 active 均恢复。

## 4. 角色消息“忘记这条”

实现：

- 只在 char 文本消息菜单显示。
- 两次确认，第一次说明影响范围，第二次最终执行。
- 清理：
  - 当前聊天流；
  - 所有 turn branch 快照中的该消息；
  - 来源 `memoryItems`（标记 deleted，不硬删版本历史）；
  - `chat.mem.items` 中同文本摘要；
  - 指向该消息的 MemoryCursor，回退到最后一条仍存在消息；
- 保留：
  - usage 统计；
  - 订单、相册、收藏等实体；
  - 记忆版本历史。
- 完成后关闭确认层、恢复页面状态。

实测：

- 当前消息被移除；
- memory item 状态为 deleted；
- legacy 摘要清空；
- 分支快照不再包含该消息；
- cursor 回退到 `fu1`；
- usage 数量不变；
- 确认层关闭。

## 5. 删除消息二次确认

当前删除不再立即执行：

1. 第一次确认说明只从当前聊天流移除，不删除收藏/订单/相册实体；
2. 第二次确认后才永久删除；
3. 第一次之后取消，消息仍在。

## 6. UI 证据

桌面 DOM：

- 菜单所有按钮宽度 354px、高度 44px；
- 编辑器按钮宽度 358px、高度 44px。
- 真机 CDP 菜单按钮高 44.0000038px；
- 真机编辑器按钮高 44.0000038px。

真机截图：

- 用户菜单：`docs/testing/round117-user-menu.png`
- 编辑器：`docs/testing/round117-editor.png`
- 角色菜单：`docs/testing/round117-char-menu.png`
- 聊天页：`docs/testing/round117-chat.png`

## 7. 逻辑证据

新增模块独立断言：

- `docs/testing/qa-wechat-message-edit-branch-2026-11-06.json`

26 项检查全部 PASS，包含：

- user 菜单顺序；
- 44×44；
- 编辑器预填与提示；
- 新消息 ID；
- turn 不增加；
- 同组 messageGroupId；
- 旧尾归档；
- Prompt 不含旧回复；
- UI 零标记；
- busy/sheet 状态复位；
- 失败回滚；
- 手动分支；
- 分支切回；
- char 菜单顺序；
- 忘记两次确认与清理；
- 删除两次确认；
- console/runtime error 0。

真机 CDP：

- `docs/testing/round117-phone-wechat-message-edit-branch.json`

8 项全部 PASS：

- 实际 touchstart 长按菜单；
- 真机编辑器；
- 真机编辑生成；
- 真机旧尾归档与 Prompt；
- 真机状态复位；
- 真机手动分支；
- 真机角色忘记；
- runtime error 0。

## 8. 全量回归

### 核心断言

| 测试 | 结果 |
|---|---|
| 主队连续组重 roll | 19/19 PASS |
| 红队独立 Prompt 审计 | 9/9 PASS |
| 红队独立分支审计 | 6/6 PASS |
| 独立 Prompt 检查 | 14/14 PASS |
| 分支 UI 一致性 | 5/5 PASS |
| 多分支持久化 | 7/7 PASS |
| Prompt 分层顺序 | 7/7 PASS |
| 旧分支记忆隔离 | 3/3 PASS |
| 自动总结分支隔离 | 7/7 PASS |
| 本模块独立断言 | 26/26 PASS |

日志：

`docs/testing/round117-final-core-assertions-2026-11-06.log`

### 全页/发布回归

| 测试 | 结果 |
|---|---|
| R97 桌面/窄屏 | 33 + 33 页 PASS，返回 6/6 |
| R108 P1 | PASS |
| R109 Service Worker r3 | 6/6 PASS |
| 数据管理 | 17/17 PASS |
| 分组语义 | 14/14 PASS |
| 批次 3 红队修复 | 13/13 PASS |

日志：

`docs/testing/round117-final-regression-suite-2026-11-06.log`

### 真机回归

| 测试 | 结果 |
|---|---|
| 本模块真机 | 8/8 PASS |
| R114 连续组重 roll | 5/5 PASS |
| 真机分支切换 UI | 5/5 PASS |
| R101 真机导出 | 10/10 PASS |
| R112 真机分组 | 9/9 PASS |
| R113 真机数据管理 | 8/8 PASS |

日志：

`docs/testing/round117-phone-debug-suite-final-2026-11-06.log`

说明：R101 曾出现一次 43.99998px 亚像素测量，最终完整套件复跑为 44.000003px 并 PASS；没有降低 44×44 验收标准。

## 9. 构建与产物

- Gradle Debug：BUILD SUCCESSFUL
- Gradle Release：BUILD SUCCESSFUL
- APK 内嵌 `assets/public/index.html` 与源码哈希一致
- 源码 SHA-256：`B29BFD700BF6345E59A63295D388309B843F3087B60FFAAD27E3AEC33701D439`
- Debug APK SHA-256：`27A66E50AB80B9A18883A986800F2FE8003C882BE726CAF99C53493449661798`
- Release APK SHA-256：`8A1A61FD57941A3DA9226A213CA22ABAF0E15B3DC9E859DC8F6BF09CAA765EBA`
- 发布候选：`C:\Users\lenovo\Documents\ChatGPT\各种的\_release_candidate_2026-11-06_Build93\BS小手机_3.82_Build93.apk`
- 公共 APK：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\BS小手机.apk`

构建日志：

`docs/testing/build93-native-build-2026-11-06.log`

## 10. 最终 Release 真机巡检

- 设备内版本：3.82 / versionCode 93
- 设备内 APK 回拉哈希与 Release 候选一致
- 使用 `adb install -r`，未执行 `pm clear`
- `firstInstallTime=2026-10-20 23:07:55` 未变化
- `ceDataInode=2120975` 未变化
- 冷启动 Status ok
- 进程存活，WebView 根节点存在
- App 进程无 FATAL EXCEPTION / ANR

Release Smoke：9/9 PASS

证据：

- `docs/testing/round115-phone-release-final-2026-11-05.json`
- `docs/testing/round115-phone-release-final-logcat-2026-11-05.txt`
- `docs/testing/round115-release-final-home.png`

## 11. 数据与 Store 边界

- 编辑与分支写入使用：
  - `coreStore().commands.replaceMessages`
  - `coreStore().commands.patchChat`
  - `coreStore().commands.deleteMessage`
- 未改 Global Store 的数据结构或注入方式。
- 新字段：
  - message `editedFromMessageIds`
  - branch `kind`
- 均为可选字段，旧备份导入不依赖新字段。
- turnBranches 继续随聊天导出导入。
- 未删除既有复制、引用、收藏、撤回、删除或分支切换能力。

## 12. 证据总清单

`docs/testing/round117-evidence-manifest-2026-11-06.json`

包含：

- 23 个测试 JSON；
- 5 个日志；
- 5 张截图；
- 源码、Debug APK、Release APK、版本、versionCode、cacheKey。

## 13. 本轮未包含

- 图片消息重 roll
- 图片分支全屏页
- 已隐藏内容恢复页
- ZIP + assets 发布级归档
- GitHub Pages 线上发布

本模块 PASS。以上未包含项留待后续模块，不在本次模块内虚报通过。