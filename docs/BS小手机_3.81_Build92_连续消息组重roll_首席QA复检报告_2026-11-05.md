# BS小手机 3.81 / Build 92｜连续消息组重roll 返修复检｜首席 QA 独立复检报告

- 复检日期：2026-11-05
- 被审报告：`BS小手机_3.81_Build92_连续消息组重roll_返修复检_红队与检查官报告_2026-11-05.md`
- 代码目录：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages`
- 源码提交：`506cc919139ce3060eb1c5b3b9aef04d31a116a0`
- 当前 HEAD：`f48448b`（文档提交，代码提交为 `506cc91`）
- 工作区：审查开始时干净；本轮新增 QA 报告/证据为未提交产物
- 版本：3.81 / Build 92
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 结论：**不通过，仍有两个 Prompt 相关阻断项。**

## 一、最终判定

主队已经修复了上一轮提出的核心问题：

```text
真实新消息即时生成 turnId/messageGroupId：通过
整组重 roll：通过
旧尾部消息归档：通过
分支内容切换：通过
activeBranchId 与显示内容一致：通过
环境时间不进入 user：通过
失败回滚：通过
真实 touchstart 长按：通过
Release 覆盖安装与数据保留：通过
```

但本次返修复检仍发现两个不能签的问题：

| 编号 | 严重度 | 问题 | 结果 |
|---|---|---|---|
| QA-381-04 | P1 | 旧分支的会话摘要和结构化记忆仍进入新分支 Prompt | 失败 |
| QA-381-05 | P1 | 记忆块位置与临时 nudge 的 Prompt 层级不符合四层规则 | 失败 |

因此当前只能签：

```text
消息组与旧尾部消息归档：通过
Prompt 的旧尾部文本隔离：通过
Prompt 的旧尾部记忆隔离：不通过
Prompt 分层/缓存稳定性：不通过
连续组重 roll 里程碑完整签收：不通过
```

## 二、版本与证据链

| 项目 | 实测 |
|---|---|
| 本地 `index.html` SHA-256 | `F64060C831F6212E9CDC340B4ACFE81251E0EADEED26AEECAD3042DCAC817AB4` |
| Release APK SHA-256 | `8A263FD43D5F7E2F1E35C7269DDC863FB387AC61ACDDE86520F6E8F7B186BD9B` |
| Debug APK SHA-256 | `E9C1AC3C5BCAC9503982EBD4E93766D579A8B920953A2B47FFD448F0FCA030FC` |
| 设备内 Release APK | 回拉哈希 `8A263...BD9B`，与候选一致 |
| 设备内版本 | versionName 3.81 / versionCode 92 |
| 数据保留 | `firstInstallTime=2026-10-20 23:07:55`，`ceDataInode=2120975`，未执行 `pm clear` |
| 线上发布 | 报告明确未线上发布，本轮不作为线上通过证据 |

Debug 真机验证结束后已用 Release 92 覆盖安装；设备当前仍是 Release 92，数据未被清除。

主队本轮的源码、APK 和测试 JSON 已记录相同的 `F640...`、`E9C1...`、`8A26...` 哈希，证据链比上一轮完整。

## 三、上一轮阻断项复核

### 3.1 P0-1：真实新消息没有即时 turn/group

**通过。**

独立审计确认，不手工注入 `turnId` / `messageGroupId`，连续发送“新消息甲”“新消息乙”后：

```text
两条消息拥有同一个 turnId
两条消息拥有同一个 messageGroupId
长按第一条或第二条都能打开同一个整组确认页
确认页同时列出两条消息
```

证据：

- `docs/testing/independent-turn-reroll-audit-2026-11-05.json`
- `qa-chat-turn-reroll-2026-11-05.json` 的 `real_sendtext_messages_form_one_group=PASS`

### 3.2 P0-2：分支 activeBranchId 不跟随目标分支

**通过。**

源码已从：

```js
patchChat(... turnBranches ...);
state.activeBranchId = target.id;
```

改为先设置目标 active，再生成并保存完整分支快照：

```js
state.activeBranchId = target.id;
const branchesSnapshot = jsonSafeCopy(ch.turnBranches);
store.commands.patchChat(...branchesSnapshot...);
store.commands.replaceMessages(...next...);
```

独立复现：

- 两次重 roll 生成 3 个分支；
- 原始 → 新1 → 新2 → 原始 → 新1 连续切换；
- 每次切换后 `activeBranchId` 都是目标分支；
- 分支菜单“当前”标记与显示内容一致；
- 重载后 active 与消息内容一致。

证据：

- `docs/testing/independent-turn-branch-switch-audit-2026-11-05.json`
- `docs/testing/qa-turn-branch-switch-ui-2026-11-05.json`
- `docs/testing/qa-turn-reroll-multi-2026-11-05.json`
- 真机 `qa-phone-branch-switch-ui`：内容切换、active、目标 ID 三项均通过。

### 3.3 QA-381-02：环境时间进入 user 消息

**通过。**

实际捕获的 Prompt 现在是：

```json
[
  {"role":"system","content":"[ENVIRONMENT_CONTEXT — NOT USER SPEECH]\n现在的时间是：..."},
  {"role":"user","content":"第二句"}
]
```

时间不再与用户原话拼成同一条 user 消息。

证据：

- `docs/testing/qa-turn-reroll-independent-2026-11-05.json`
- `promptMeta.lastRole = user`
- `promptMeta.lastContent = 第二句`
- `environment_not_mixed_into_user_role=PASS`
- `environment_in_system_context=PASS`

### 3.4 P1：真机没有走实际 touchstart 长按

**通过。**

R114 真机脚本现在使用：

```js
await locator.dispatchEvent('touchstart');
await page.waitForTimeout(520);
```

而不是 click。本轮在 Debug 92 真机复跑 5/5 PASS，随后装回 Release 92。

### 3.5 P2：失败双 toast / 非文本组引导

**通过。**

`regenerateUserTurn()` 调用 `aiTurn({silentErrors:true,...})`，失败路径只保留一次最终错误提示。非文本组在 `sheetRegenerateUserTurn()` 中直接拦截，不弹模型生成确认，也不创建分支。

## 四、剩余阻断问题

### QA-381-04｜P1：旧尾部记忆泄漏到新分支 Prompt

虽然消息层已按分支截断，但旧分支的**摘要记忆和结构化记忆**仍会进入新分支的 Prompt。

独立复现数据：

- `chat.mem.items` 包含：`旧会话摘要：角色后来已经搬到另一座城市`；
- `DB.memoryItems` 包含：`旧结构化记忆：角色后来已经中奖并搬走`；
- 两条记忆的来源都指向旧尾部消息；
- 重 roll 后当前消息尾部只有“同一组甲 / 同一组乙 / 新分支回复”。

实际捕获 Prompt：

```text
旧结构化记忆：角色后来已经中奖并搬走
旧会话摘要：角色后来已经搬到另一座城市
```

独立测试结果：

```json
{
  "oldStructuredMemoryExcludedFromNewBranch": false,
  "oldSessionDigestExcludedFromNewBranch": false,
  "newBranchStillGenerated": true
}
```

证据文件：

- `docs/testing/independent-turn-memory-branch-audit-2026-11-05.json`

**影响：**

- 用户看到旧分支已归档，但模型仍知道旧回复之后的剧情；
- 对话的“新分支”实际上不是干净的新上下文；
- 与确认页文案“不会进入新回复的上下文”直接矛盾；
- 未来自动总结、记忆注入和分支切换都会继续放大该问题。

**代码线索：**

- `index.html:4092`：`memoryContextForCharacter()` 只使用 `ch.branchId||'main'`。
- `index.html:4096`：`chat.mem.items` 被直接读取，没有按当前 turn branch 过滤。
- `index.html:4103-4114`：`DB.memoryItems` 只按 session/branchId 过滤，没有按 `sourceMessageIds` 是否仍在当前分支过滤。
- `turnBranches` 当前只保存消息快照，没有同步保存该分支对应的记忆游标/摘要状态。

**修复要求：**

- 当前 turn branch 激活时，只注入该分支可见消息来源的记忆；
- 旧尾部来源的 `MemoryItem` 不得进入新分支 Prompt；
- `chat.mem.items` 必须按分支/游标隔离，不能继续作为全聊天共享摘要；
- 切换分支时同步切换或重建记忆上下文；
- 增加“旧分支摘要/结构化记忆不得进入新分支 Prompt”的独立断言。

### QA-381-05｜P1：记忆块和临时 nudge 的 Prompt 层级错误

经过修复后，环境时间已正确放在 history 之后的 system 环境块。但 Prompt 仍有两个层次问题：

**1. 结构化记忆块在 history 之前**

实际捕获 messages：

```text
index 0: system（静态边界）
index 1: system（记忆中心 + 场景 + 任务规则）
index 2: user（第一句历史）
index 3: system（环境时间）
index 4: user（第二句当前输入）
```

`13_Prompt缓存与Token.md` 要求记忆块位于历史记录之后、环境时间之前；当前 `index 1` 在历史之前。

**2. 临时重 roll nudge 被塞进半静态 system**

重 roll 调用 `aiTurn` 时传入的 `nudge` 会追加到 `promptBundle.semi`，而不是动态块或独立临时上下文。nudge 包含本轮组消息，内容随重 roll 变化，放在半静态层会破坏前缀稳定性。

实际捕获中：

```text
nudge 文本出现在 index 1 的 system 消息
环境时间在 index 3
当前 user 在 index 4
```

证据：

- `docs/testing/qa-prompt-layers-2026-11-05.json`
- `memIndex=1`
- `nudgeIndex=1`
- `envIndex=3`
- `memoryAfterHistory=false`
- `nudgeAfterHistory=false`

**修复要求：**

- 结构化记忆块移动到历史之后、环境之前；
- nudge 进入动态层或独立的“本轮系统指令”块，不能改变半静态前缀；
- 增加实际 Prompt 的 role/order 断言，不要只看最后一条 user；
- 保持 `stable`、`semi` 在同一会话中可缓存复用。

## 五、通过项矩阵

| 检查 | 结果 | 证据 |
|---|---|---|
| 真实新消息形成同一连续组 | PASS | independent-turn-reroll-audit |
| 第二条消息长按命中整组 | PASS | independent-turn-reroll-audit |
| 确认页包含整组消息 | PASS | round115-reroll-confirm.png |
| 旧回复和旧尾部归档 | PASS | qa-turn-reroll-independent |
| 新分支消息不含旧尾部 | PASS | qa-turn-reroll-independent |
| 实际 Prompt 不含旧尾部消息 | PASS | qa-turn-reroll-independent |
| 实际 Prompt 不含旧尾部记忆 | **FAIL** | independent-turn-memory-branch-audit |
| 分支 active/内容/菜单一致 | PASS | qa-turn-branch-switch-ui |
| 多次重 roll、三叉分支、重载一致 | PASS | qa-turn-reroll-multi |
| 环境时间不进入 user | PASS | qa-turn-reroll-independent |
| 记忆块在历史之后 | **FAIL** | qa-prompt-layers |
| 临时 nudge 在动态层 | **FAIL** | qa-prompt-layers |
| 非文本组不调用模型 | PASS | qa-turn-reroll-independent |
| 失败回滚 | PASS | qa-chat-turn-reroll |
| 真实 touchstart 长按 | PASS | R114 Debug 92 |
| Release 覆盖安装/数据保留 | PASS | round115 |
| 导出、分组、数据管理回归 | PASS | R114/R101/R112/R113/数据管理 17/17 |
| 33 页桌面/窄屏/深色 | PASS | R97；33+33，深色 33+33 |
| Service Worker | PASS | R109 |

## 六、复跑命令与结果

```text
node _qa_chat_turn_reroll_2026-11-05.cjs
```

19/19 PASS。

```text
node _qa_turn_reroll_independent_2026-11-05.cjs
```

14/14 PASS；`promptMeta.lastContent=第二句`。

```text
node _qa_turn_reroll_multi_2026-11-05.cjs
```

7/7 PASS；三次分支持久化一致。

```text
node _qa_turn_branch_switch_ui_2026-11-05.cjs
```

5/5 PASS；active、显示内容和持久化一致。

```text
node _qa_phone_branch_switch_ui_2026-11-05.cjs
```

Debug 92 真机 PASS；内容切换、active、目标 ID 均一致。

```text
node _independent_turn_reroll_audit_2026-11-05.cjs
```

9/9 PASS。

```text
node _independent_turn_branch_switch_audit_2026-11-05.cjs
```

6/6 PASS。

```text
node _independent_turn_memory_branch_audit_2026-11-05.cjs
```

FAIL：

```text
oldStructuredMemoryExcludedFromNewBranch=false
oldSessionDigestExcludedFromNewBranch=false
```

```text
node _qa_prompt_layers_2026-11-05.cjs
```

FAIL：

```text
memoryAfterHistory=false
nudgeAfterHistory=false
```

真机 R114 当前 Debug 92：5/5 PASS；随后已覆盖安装 Release 92，设备内 APK 回拉哈希与候选一致，数据保留。

## 七、证据文件

### 主队/最终版本证据

- `_ghpages/docs/testing/qa-chat-turn-reroll-2026-11-05.json`
- `_ghpages/docs/testing/independent-turn-reroll-audit-2026-11-05.json`
- `_ghpages/docs/testing/independent-turn-branch-switch-audit-2026-11-05.json`
- `_ghpages/docs/testing/qa-turn-reroll-independent-2026-11-05.json`
- `_ghpages/docs/testing/qa-turn-reroll-multi-2026-11-05.json`
- `_ghpages/docs/testing/qa-turn-branch-switch-ui-2026-11-05.json`
- `_ghpages/docs/testing/round114-phone-turn-reroll.json`
- `_ghpages/docs/testing/round115-phone-release-final-2026-11-05.json`
- `_ghpages/docs/testing/round115-reroll-confirm.png`
- `_ghpages/docs/testing/round115-longpress-user2.png`

### 本轮新增的反证

- `_ghpages/docs/testing/independent-turn-memory-branch-audit-2026-11-05.json`
- `_ghpages/docs/testing/qa-prompt-layers-2026-11-05.json`

## 八、返修清单

### 必须修

- [ ] 旧分支来源的自动摘要、会话摘要、结构化记忆不得进入新分支 Prompt。
- [ ] `chat.mem.items` / MemoryCursor 按 turn branch 隔离或重建。
- [ ] 记忆块移到 history 之后、环境时间之前。
- [ ] 临时 nudge 从半静态 system 移到动态层/独立本轮上下文块。
- [ ] 增加“旧记忆不泄漏”和“Prompt role/order”断言。

### 交付前

- [ ] 保留当前最终 Release 的源码、APK、设备回拉哈希和日志。
- [ ] 重新跑 R114 实际 touchstart、分支切换、重载和数据管理。
- [ ] 将本轮新增反证 JSON 纳入主队最终证据目录，不能只保留原来的 19/19 PASS。

## 九、最终签署

```text
真实连续消息组：通过
旧尾部消息归档：通过
新旧分支切换与 active：通过
环境时间身份隔离：通过
旧尾部记忆隔离：不通过
Prompt 四层/缓存稳定性：不通过
本里程碑返修签收：不通过
```

主队本轮已把上一轮的两个主要功能性修复做对；剩余问题集中在“分支记忆隔离”和“Prompt 层次”，修完后才能签连续组重 roll 里程碑。


