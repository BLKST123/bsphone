# BS 小手机 3.85 / Build 96｜QA-384 返修复检｜红队与检查官完整报告

- 报告日期：2026-11-07
- 被检报告：
  - `C:\Users\lenovo\Documents\ChatGPT\各种的\BS小手机_3.84_Build95_完整独立复检报告_2026-11-06.md`
  - `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\BS小手机_3.84_Build95_全项目QA复检报告_2026-11-06.md`
- 产品交接包：`C:\Users\lenovo\Documents\ChatGPT\各种的\BS小手机_主队完整交接包_2026-11-05.zip`
- 代码目录：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages`
- 业务源码提交：`2e6a109f3948ed497b37b38852b6da900760c61a`
- Final verification HEAD: `032b02e50c67b3e0629cc88527b8f767b33d231a` (report/evidence commit; index.html unchanged)
- 版本：3.85 / Build 96
- Service Worker：`bsphone-v96-20261107-r1`
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 最终判定：**PASS（限定 QA-384 群聊角色级忘记作用域返修范围）**

## 0. 结论摘要

两份复检报告共同阻断的 **QA-384-01** 已关闭：

| 检查项 | 结果 |
|---|---|
| 忘记群聊角色 A 的消息，只清理 A 的独立记忆 | PASS |
| 同群角色 B 的长期记忆保留 | PASS |
| 同群角色 B 的 `memoryItem` 保留 | PASS |
| 同群角色 B 的 `memoryEntry` 保留 | PASS |
| 同群角色 B 的 `chat.mem` / `baseMemorySnapshot` / branch legacy 保留 | PASS |
| 同群角色 B 的 `memoryItemIds` 保留 | PASS |
| 短文本“好”不按任意子串误删“用户喜欢好吃的” | PASS |
| 跨角色、跨会话、跨分支的既有隔离不回滚 | PASS |
| 编辑并重新生成、手动分支、普通删除、分支导出/删除不回滚 | PASS |
| 真机 Debug/CDP 巡检与 Release 恢复 | PASS |

本报告只声明 **QA-384 返修范围通过**。图片消息重 roll、图片分支、已隐藏内容恢复页、ZIP + assets 归档和 GitHub Pages 线上发布仍未完成，不能写成全项目已签收。

## 1. 当前模块任务详情

### 1.1 模块名称

群聊角色消息“忘记这条”的角色级记忆隔离。

### 1.2 用户路径

1. 在群聊中长按角色 A 发出的文本消息；
2. 打开消息菜单；
3. 点击“忘记这条”；
4. 第一次确认；
5. 第二次确认；
6. 删除目标消息，并只清理该消息发送者 A 的相关记忆。

### 1.3 本轮必须满足的验收条件

- 目标消息必须从当前聊天和当前 active branch 快照移除；
- `DB.memoryItems` 中只允许删除 `charId/contactId === m.from` 的目标记忆；
- `DB.contacts[].memories` 只允许清理消息发送者 A 的长期记忆；
- `DB.memoryEntries` 只允许清理当前 chat、当前 persona、发送者 A 的记录；
- `chat.mem`、`baseMemorySnapshot`、`branch.legacyMemItems` 可包含群聊摘要，必须按发送者身份和摘要前缀判断；
- `branch.memoryItemIds` 只移除实际被删除的 A 的记忆 ID；
- 同群角色 B 的长期记忆、结构化记忆、legacy、memory IDs 必须完整保留；
- 短文本仍必须使用精确匹配，不能恢复任意子串扫描；
- 不得擅自修改 UI，不得改变底层 Store 的隔离边界，不得回滚已通过的编辑/分支能力。

## 2. 任务进程（本轮实际推进顺序）

| 阶段 | 动作 | 结果与证据 |
|---|---|---|
| 1. 接单与归因 | 读取两份 3.84 / Build 95 复检报告，锁定 QA-384-01；确认问题是群聊中错误地使用全部群成员作为清理范围 | 阻断原因与两份报告一致 |
| 2. 复现 | 构造群聊双角色同文本反证：c1 发消息，c1/c2 各有独立长期记忆和结构化记忆 | 修复前可复现 c2 被误删；修复后新增测试通过 |
| 3. 代码审查 | 审查 `forgetCharMessage`、`forgottenChatWideTextMatches`、`DB.memoryItems`、`DB.contacts[].memories`、`DB.memoryEntries`、branch legacy/memory IDs | 确认问题来自群成员范围扩大，不是 Store 本身故障 |
| 4. 源码修复 | 以消息发送者 `m.from` 建立 sender scope；群聊摘要增加发送者名称前缀判断；保留其它成员 | 业务源码提交 `2e6a109f3948ed497b37b38852b6da900760c61a` |
| 5. 核心反证 | 运行群聊双角色、branch legacy、memory IDs、短文本精确匹配、跨会话隔离等 21 个核心脚本 | 21/21 PASS；日志：`round120-final-core-qa384-2026-11-07.log` |
| 6. 全量回归 | 运行 R97 亮/暗、R108、R109、数据管理、分组语义、批次 3 红队修复 | 全部 PASS；日志：`round120-final-regression-suite-2026-11-07.log` |
| 7. 真机 Debug/CDP | 在真机跑 R117/R118/R119/R120/R114/R101/R112/R113 及分支切换，实际长按 520ms，覆盖 450ms 阈值 | 9 个真机脚本 PASS；截图：`round120-phone-forget-group-scope.png` |
| 8. 恢复 Release | 使用 `adb install -r` 覆盖安装回 Release 3.85 / Build 96，未执行 `pm clear` | 设备内 APK 回拉哈希与 Release 候选一致 |
| 9. Release 冷启动 | 报告入库后再次运行 Release smoke，检查版本、数据保留、冷启动、WebView 根节点、FATAL/ANR | 9/9 PASS；最终验证 HEAD `032b02e50c67b3e0629cc88527b8f767b33d231a`；证据：`round115-phone-release-final-2026-11-05.json` |
| 10. 证据归档 | 生成并校验 manifest、截图、日志、哈希绑定 | `round120-evidence-manifest-2026-11-07.json` 为 `ok=true`，38 个测试 JSON、6 个日志、5 张截图 |

本轮的代码改动只在消息忘记的作用域与匹配逻辑，没有改动页面布局、图标尺寸、点击区域、Store 隔离接口或其它 App 的业务代码。

## 3. 语义对齐颗粒度

这一节是给产品经理、红队和检查官对齐“我理解成什么、我实际做了什么、我没有扩大解释什么”。

| 语义 | 我的理解 | 本轮实现 | 明确没有做 |
|---|---|---|---|
| “忘记这条” | 针对某一条角色消息的隐私敏感清理动作 | 删除目标消息，并清理发送者相关记忆和上下文快照 | 不是普通删除；不是清空整个群聊；不是删除订单、相册、收藏实体 |
| `m.from` | 消息发送者的角色 ID，是本次忘记操作的唯一角色作用域 | 以 `m.from` 建立 `senderScopeIds`，联系人记忆只匹配该 ID | 不再使用 `currentMemberIds` 作为清理范围 |
| 同群其它角色 | 同群角色 B 的独立记忆不应因角色 A 的消息被忘记而消失 | 保留 B 的长期记忆、memoryItem、memoryEntry、legacy、memory IDs | 不把“同群”误解成“所有成员共享同一份可删除记忆” |
| `DB.memoryItems` | 结构化长期记忆条目，需按 session/chat、persona 和发送者共同限定 | 只处理当前会话或当前 chat 内发送者 A 的条目；来源 ID 命中优先 | 不跨会话、不跨 persona、不遍历全部群成员 |
| `DB.contacts[].memories` | 联系人自己的长期记忆 | 只遍历 `senderScopeIds` 中的联系人 | 不清空其它群成员的 memories 数组 |
| `DB.memoryEntries` | 记忆中心的来源记录，应跟随实际来源 | 使用当前 chat、persona、sender scope；同时检查 `sourceId` | 不把其它角色或其它会话的 entry 置为 forgotten |
| `chat.mem` | 当前聊天的记忆摘要容器，群聊可能混有多角色文本 | 群聊中只有摘要前缀明确属于发送者 A 时才清理；不能只做全局文本包含 | 不因为“好”出现在 B 的摘要里就删除 B |
| `baseMemorySnapshot` | 聊天基础记忆快照，可能包含多角色摘要 | 与 `chat.mem` 相同的 sender/prefix 约束 | 不做全量清空或跨角色模糊匹配 |
| `branch.legacyMemItems` | 分支旧格式的记忆摘要，可能跨角色 | 只在明确属于发送者 A 时过滤 | 不把 B 的 legacy 摘要误删 |
| `branch.memoryItemIds` | 分支引用的结构化记忆 ID | 只过滤本轮实际标记删除的 A 的记忆 ID | 不删除 B 的 ID，不重建整个分支对象 |
| `sourceMessageIds` | 记忆与具体消息的精确关联 | 精确 ID 命中时优先清理 | 不要求短文本“好”去扫描所有长文本 |
| 短文本精确匹配 | “好”“嗯”等短文本不能按任意子串命中其它记忆 | 保留规范化完全相等、明确摘要壳匹配；禁止任意子串扫描 | 不以外观相似的文本删掉“用户喜欢好吃的” |
| 群聊摘要前缀 | 摘要可能写成“角色一记忆：好”或“角色二记忆：好” | 先检查发送者名称，再检查其它成员名称；其它成员名称存在时保留 | 不把“摘要里有相同字”误判为发送者 A |
| 普通删除 | 删除消息本身，不执行记忆隐私清理 | 继续同步当前 active branch snapshot | 不与“忘记这条”混为一谈 |
| 编辑并重新生成 | 编辑后创建新 user message_id，旧内容进入旧分支 | 既有实现保持，不回调模型 | 不把编辑路径改成忘记路径 |
| 手动“从这里创建分支” | 保留到当前 user 消息，后续进入旧分支 | 既有实现保持，不调用模型 | 不顺手增加生成行为 |
| 图片/卡片组 | 非文本卡片不进入文字模型；保留模式下维持相对位置 | 既有实现保持 | 本轮没有修改图片重 roll/图片分支 |
| UI | 不擅自改版；44×44 是硬门槛 | 继续保留现有视觉和命中区；本轮用真机截图核对 | 没有私自改变排版、图标或交互层级 |
| “共享群记忆” | 当前只确认 A 的忘记操作不能删除 B 的独立记忆 | 该边界已通过双角色反证 | 没有扩大解释为“群聊永远不存在任何共享记忆”；若未来支持共享语义，必须由产品书面定义并新增提示/测试 |
| “全项目完成” | 只代表本轮 QA-384 返修通过 | 报告明确列出范围外未完成项 | 不把图片分支、隐藏内容恢复页等写成已完成 |

### 3.1 语义边界的必要说明

本轮修复不是“把群聊记忆全部改成按发送者完全隔离”这一句可以概括。实际边界是：

- 联系人长期记忆和 `memoryItem` 按发送者 `m.from` 收紧；
- 聊天摘要、base snapshot、branch legacy 是多角色混合文本，不能直接按发送者字段过滤，因此采用“发送者身份 + 明确摘要前缀”的判断；
- 如果摘要无法明确归属于发送者 A，则保留，宁可少删，不误删其它角色；
- `sourceMessageIds` 是比文本更高的优先级，保证目标消息的来源记录可以精确清理；
- 同群其它角色保留，不等于所有群共享文本永远不清理；本报告只声明本轮删除操作不误伤其它角色独立记忆。

## 4. 源码修复点

### 4.1 发送者作用域

`index.html` 的 `forgetCharMessage(ch,m)` 现在从目标消息读取：

```js
const senderId=String(m.from||'').trim();
const senderScopeIds=new Set(senderId?[senderId]:[]);
```

联系人长期记忆只遍历消息发送者：

```js
if(!contact||!senderScopeIds.has(String(contact.id))||!Array.isArray(contact.memories)) return;
```

### 4.2 结构化记忆作用域

`inCurrentChatScope` 现在：

- 优先接受 `sourceMessageIds` 精确命中；
- sessionId/chatId 必须匹配当前会话；
- 带 contactId/charId 的条目必须属于发送者；
- 群聊中没有角色归属的条目不会被默认为全部成员共享清理对象。

`DB.memoryItems`、`DB.contacts[].memories`、`DB.memoryEntries` 均经过该层或发送者层过滤。

### 4.3 群聊摘要匹配

新增 `forgottenChatWideTextMatches(value,msgId,text,ch,senderId)`：

- 非群聊沿用既有精确匹配；
- 群聊先做规范化完全相等和明确摘要壳判断；
- 只有摘要前缀包含发送者名称时才清理；
- 摘要前缀包含其它群成员名称时保留；
- 不使用任意子串删除。

### 4.4 分支和游标

- 分支消息只过滤目标消息 ID；
- branch legacy 使用群聊发送者摘要规则；
- branch memoryItemIds 只删除本轮实际标记 deleted 的 ID；
- memory cursor 在目标消息被删除后回退到仍存在的最后一条消息。

## 5. 证据式验收

### 5.1 截图证据

真机截图：

`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round120-phone-forget-group-scope.png`

截图状态：

- 页面：真机双角色群（2）；
- 目标角色消息“群里说话”已从聊天流删除；
- 顶部出现“已忘记这条”提示；
- 输入框和底部栏尺寸未被本轮改动破坏；
- 真实长按路径执行后截图，不是静态页面伪造。

### 5.2 逻辑证据

核心双角色反证：

- `docs/testing/qa-forget-group-member-scope-2026-11-06.json`：3/3 PASS
- `docs/testing/qa-forget-group-branch-scope-2026-11-06.json`：13/13 PASS
- `docs/testing/round120-phone-forget-group-scope.json`：真机 3/3 PASS

真机关键结果：

```text
targetRemoved=true
sameCharCleared=true
otherMemberKept=true
c1=[]
c2=["角色二长期记忆：好"]
m1=deleted
m2=active
texts=["群里说话"]
```

这证明删除 c1 的目标消息和记忆后，c2 的长期记忆、memoryItem 和结构化记录仍然存在。

### 5.3 全量回归测试报告

核心断言日志：

`docs/testing/round120-final-core-qa384-2026-11-07.log`

21 个脚本全部 PASS：

| # | 脚本 | 检查数 |
|---:|---|---:|
| 1 | 微信消息编辑/分支 | 26/26 |
| 2 | 连续组重 roll | 19/19 |
| 3 | 独立重 roll 审计 | 9/9 |
| 4 | 独立分支切换审计 | 6/6 |
| 5 | 独立 Prompt 检查 | 14/14 |
| 6 | 分支 UI 一致性 | 5/5 |
| 7 | 多分支持久化 | 7/7 |
| 8 | Prompt 分层 | 7/7 |
| 9 | 旧分支记忆隔离 | 3/3 |
| 10 | 自动总结分支隔离 | 7/7 |
| 11 | 手动分支继续 | 3/3 |
| 12 | 混合组选择 | 2/2 |
| 13 | 旧长文本忘记范围 | 2/2 |
| 14 | 忘记分支记忆 | 6/6 |
| 15 | 普通删除快照 | 3/3 |
| 16 | 分支导出/删除 | 5/5 |
| 17 | 混合组生命周期 | 7/7 |
| 18 | 短文本精确匹配 | 7/7 |
| 19 | 跨角色/跨会话反证 | 4/4 |
| 20 | 群聊双角色反证 | 3/3 |
| 21 | 群聊 branch legacy / memory IDs | 13/13 |

全量回归日志：

`docs/testing/round120-final-regression-suite-2026-11-07.log`

结果：

- R97 亮色：33 桌面 + 33 窄屏 PASS；
- R97 深色：33 桌面 + 33 窄屏 PASS；
- R108：PASS；
- R109 Service Worker：6/6 PASS，缓存键 `bsphone-v96-20261107-r1`；
- 数据管理：17/17 PASS；
- 分组语义：14/14 PASS；
- 批次 3 红队修复：13/13 PASS。

真机 Debug/CDP 套件日志：

`docs/testing/round120-phone-debug-suite-final-2026-11-07.log`

9 个真机脚本全部 PASS：

- R120 群聊忘记双角色；
- R119 短文本忘记；
- R118 QA-382；
- R117 编辑/手动分支；
- R114；
- 真机分支切换；
- R101；
- R112；
- R113。

## 6. 构建、版本与真机信息

- 版本：3.85 / Build 96；
- 页面日期：2026-11-07；
- Service Worker：`bsphone-v96-20261107-r1`；
- 源码 SHA-256：`5877A7ED428444681F7DD78276F94A2F92B0BC847502790427F63F8A23A6F4B6`；
- Debug APK SHA-256：`9CCC06BD7CBA2872BF9549AEB0CE4F6ED6AC15B26BEE35D47E9D7CD28726F375`；
- Release APK SHA-256：`1D77DEFF408A6A53A99E30EDA28E4AA6B2846860F808D584CABA2C45E6D82525`；
- Release 候选：`C:\Users\lenovo\Documents\ChatGPT\各种的\_release_candidate_2026-11-07_Build96\BS小手机_3.85_Build96.apk`；
- Release 真机：OPPO PMK110 / Android 16 / 1272×2772；
- 设备内版本：3.85 / versionCode 96；
- 设备内 APK 回拉哈希：与 Release 候选一致；
- `firstInstallTime=2026-10-20 23:07:55`；
- `ceDataInode=2120975`；
- 未执行 `pm clear`；
- Release 冷启动：`Status: ok`；
- WebView 根节点存在；
- App 进程无 FATAL EXCEPTION / ANR；
- Release smoke：9/9 PASS（报告入库后复跑）。
- 过程说明：首次在沙箱内调用 ADB 时因 `Cannot mkdir '\.android': Permission denied` 失败；随后在授权后于沙箱外复跑 Release smoke，最终 9/9 PASS。失败原因是环境权限，不是 App 功能。
- Final verification HEAD: `032b02e50c67b3e0629cc88527b8f767b33d231a`; business source HEAD remains `2e6a109f3948ed497b37b38852b6da900760c61a`.

Debug/CDP 复现说明：

`docs/testing/round120-debug-cdp-repro-2026-11-07.txt`

## 7. 证据总清单

`docs/testing/round120-evidence-manifest-2026-11-07.json`

- `ok: true`
- 测试 JSON：38 个
- 日志：6 个
- 截图：5 张
- businessSourceCommit=`2e6a109f3948ed497b37b38852b6da900760c61a`
- verificationSourceCommit=`032b02e50c67b3e0629cc88527b8f767b33d231a`
- `indexSha256=5877A7ED428444681F7DD78276F94A2F92B0BC847502790427F63F8A23A6F4B6`
- `debugApkSha256=9CCC06BD7CBA2872BF9549AEB0CE4F6ED6AC15B26BEE35D47E9D7CD28726F375`
- `releaseApkSha256=1D77DEFF408A6A53A99E30EDA28E4AA6B2846860F808D584CABA2C45E6D82525`
- `cacheKey=bsphone-v96-20261107-r1`
- 缺失项：0
- 哈希不匹配项：0

当前构建日志：

`docs/testing/build96-native-build-2026-11-07.log`

## 8. 与两份 3.84 复检报告的对应关系

| 3.84 报告要求 | 3.85 本轮结果 |
|---|---|
| 按 `m.from` 收紧群聊角色作用域 | PASS |
| 不按全部 `currentMemberIds` 清理联系人记忆 | PASS |
| `DB.memoryItems` 按发送者处理 | PASS |
| `DB.contacts[].memories` 按发送者处理 | PASS |
| `DB.memoryEntries` 按发送者处理 | PASS |
| `chat.mem` / `baseMemorySnapshot` / branch legacy 按发送者摘要处理 | PASS |
| memory IDs 只删除实际删除项 | PASS |
| 增加群聊双角色同文本反证 | PASS，3/3 + 13/13 |
| 增加真机群聊“忘记 A 保留 B” | PASS，截图 + JSON + 日志 |
| 保留短文本精确匹配 | PASS，7/7 |
| 保留混合组、分支、Prompt、编辑能力 | PASS，全量回归通过 |
| 不允许把全项目未完成项写成完成 | 已明确列边界 |

## 9. 未完成边界

以下仍未完成，不能由本轮 QA-384 PASS 代替：

- 图片消息重 roll；
- 图片分支全屏页；
- 已隐藏内容恢复页；
- ZIP + assets 发布级归档；
- GitHub Pages 线上发布。

## 10. 最终签署

```text
QA-384-01 群聊忘记角色级作用域：PASS
同群其它角色长期记忆：PASS
同群其它角色 memoryItem：PASS
同群其它角色 memoryEntry：PASS
同群其它角色 chat/base/branch legacy：PASS
同群其它角色 memory IDs：PASS
短文本精确匹配：PASS
编辑/手动分支/普通删除/分支导出：PASS
Prompt 分层与旧分支记忆隔离：PASS
Debug/CDP 真机巡检：PASS
Release 恢复与数据保留：PASS
3.85 / Build 96 QA-384 返修范围：PASS
```

**本轮结论：QA-384 返修通过；全项目仍有明确列出的未完成模块。**

## 11. 报告副本

本报告同步写入：

- `C:\Users\lenovo\Documents\ChatGPT\各种的\BS小手机_3.85_Build96_QA384返修复检_红队与检查官报告_2026-11-07.md`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\BS小手机_3.85_Build96_QA384返修复检_红队与检查官报告_2026-11-07.md`

