# BS 小手机 3.81 / Build 92｜连续消息组重 roll 第二轮独立复检报告

- 复检日期：2026-11-05
- 被检报告：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\BS小手机_3.81_Build92_连续消息组重roll_返修复检_红队与检查官报告_2026-11-05.md`
- 源码：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html`
- 当前源码 SHA-256：`F64060C831F6212E9CDC340B4ACFE81251E0EADEED26AEECAD3042DCAC817AB4`
- 当前 Git HEAD：`f48448bd83ba5cde968b4046bea8dcc577d19815`
- 审查方式：只读业务代码，独立复跑桌面测试、真实发送路径、分支双向切换、Prompt 捕获和真机 Release 巡检
- 最终判定：**打回重修**

---

## 一、先给结论

### 上一轮两个阻断问题，确实修好了

| 上一轮问题 | 本轮结果 | 证据 |
|---|---|---|
| 真实新发消息没有 `turnId/messageGroupId` | **PASS** | 真实 `sendText()` 连发 3 条，三条同一 turn/group；长按第二、第三条，确认框都列出三条 |
| 分支切换不更新 `activeBranchId`，还会覆盖新版 | **PASS** | 原始 → 新版 → 原始 → 新版连续切换，消息、active ID、菜单 ✓ 一致 |
| 环境时间混进最后一条 user | **PASS** | 最后一条 user 只包含用户原话，时间在独立的 `[ENVIRONMENT_CONTEXT — NOT USER SPEECH]` system 块 |
| 失败双 toast | **PASS** | 独立测试只出现一次“重新生成失败，已恢复原消息与分支” |
| 非文本组引导文案指向未实现功能 | **PASS** | 改为“整组重新生成只支持纯文本消息”，不再承诺不存在的入口 |
| 分支备份导出/导入 | **PASS** | 独立测试确认 `turnBranches` 导入后仍有 2 个分支和 active ID |
| 真机实际长按 | **PASS** | `round115-longpress-user2.png`、`round115-reroll-confirm.png`；R115 Release 巡检 9/9 PASS |

### 但不能绿色通过：还有两处 Prompt 级硬伤

1. **旧分支的会话摘要和结构化记忆仍会进入新分支 Prompt。**
2. **记忆块和本轮临时指令没有按产品文档的 Prompt 四层顺序放置。**

这两项不是“页面好不好看”，而是新分支剧情一致性和 Prompt 缓存/Token 的核心要求。主队当前报告没有覆盖它们。

---

## 二、P0-3：旧分支记忆污染新分支 Prompt

### 用户会看到什么

用户先和角色聊到一段后续剧情，系统生成了会话摘要或记忆。之后用户回到某个节点重新生成，聊天页看起来只保留了新的短分支，但模型仍然可能突然提起旧分支后来发生的事。

我在独立测试里构造了：

- 当前新分支只有：`同一组甲 / 同一组乙 / 新分支回复`
- 旧分支曾经有一条记忆：`旧结构化记忆：角色后来已经中奖并搬走`
- 旧会话摘要：`旧会话摘要：角色后来已经搬到另一座城市`

重新生成后的实际 Prompt 仍然包含这两条旧记忆。聊天流已经是新分支，模型上下文却不是新分支。

证据文件：

`docs/testing/independent-turn-memory-branch-audit-2026-11-05.json`

关键结果：

```text
oldStructuredMemoryExcludedFromNewBranch: false
oldSessionDigestExcludedFromNewBranch: false
currentTexts: [同一组甲, 同一组乙, 新分支回复]
```

### 代码原因

分支快照目前只保存消息，不保存记忆：

`index.html:6323-6325`：

```js
function turnBranchSnapshot(ch,start){
  return jsonSafeCopy((ch.msgs||[]).slice(Math.max(0,Number(start)||0)));
}
```

记忆的“分支身份”只取 `chat.branchId`，没有使用当前 turn branch：

`index.html:6495`：

```js
function memoryBranchId(ch){ return String(ch&&ch.branchId||'main'); }
```

但聊天分支实际保存在 `ch.turnBranches[turnId]`，`ch.branchId` 仍然是 `main`。所以所有 turn branch 共用同一个记忆命名空间。

结构化记忆只检查 `item.branchId === main`，没有检查 `sourceMessageIds` 是否仍在当前激活消息里：

`index.html:4103-4114`：

```js
if(item.branchId&&chatId&&item.branchId!==branchId) return false;
...
return !!text&&!legacyTexts.has(text);
```

会话摘要更是直接注入：

`index.html:4096`、`4173-4175`：

```js
const sessionDigest=memoryTextList(ch&&ch.mem&&ch.mem.items);
...
if(memoryContext.sessionDigest.length) semi.push('【当前会话整理记忆】...');
if(memoryContext.structured.length) semi.push('【记忆中心（过去记忆，不是用户当前发言）】...');
```

### 产品文档明确不允许

`21_记忆系统.md:5`：

> 当前分支独立

`21_记忆系统.md:34`：

> 只总结当前分支中尚未总结的对话

`21_记忆系统.md:104`：

> 旧分支不参与当前分支的自动总结

`21_记忆系统.md:408-409`：

> 自动总结只注入当前会话、当前分支的有效版本
>
> 旧版本、停用记忆、已删除记忆不注入

`02_微信.md:213`：

> 新分支从该节点继续，旧后续消息不进入新分支上下文

`02_微信.md:253`：

> 旧分支不污染当前主线 Prompt

### 为什么主队测试没发现

主队连续组测试在 `_qa_chat_turn_reroll_2026-11-05.cjs:31` 直接关闭了自动总结：

```js
DB.memorySettings.autoSummaryEnabled=false;
```

并且没有注入任何旧分支记忆。它验证了消息数组隔离，但没有验证记忆块隔离。

真实产品默认是自动总结开启的，`index.html:2441`：

```js
autoSummaryEnabled:true
```

所以长会话用户迟早会遇到。

### 修复建议

不要把自动记忆当成一个全局字符串直接拼进所有 Prompt。需要让 turn branch 拥有自己的记忆作用域：

- 给每个 turn branch 一个稳定的 `memoryScopeId`；
- `turnBranches[turnId].branches[]` 同时保存该分支的 `memoryIds`、`memoryCursor` 或 `ch.mem` 快照；
- 自动记忆注入前检查 `sourceMessageIds` 是否仍存在于当前激活消息树；
- 手动/核心/用户修正记忆可以继续全局；旧分支自动记忆只能在该旧分支激活时出现；
- 切换分支时恢复对应的 memory cursor，避免旧分支的 cursor 让当前分支重复总结。

必须补测试：

1. 开启自动总结；
2. 给旧分支写入一条来自 `sourceMessageIds` 的记忆；
3. 重生成新分支；
4. 断言旧记忆不在新 Prompt；
5. 切回旧分支，断言旧记忆重新出现。

---

## 三、P1：记忆块和本轮指令的四层顺序错了

### 用户/系统层面的影响

产品文档要求 Prompt 严格分四层，目的是稳定前缀、提高缓存命中率、减少无关动态内容反复破坏上下文。当前实现把记忆和“本次特别要求”都塞进了半静态块，放在历史前面。

这会导致：

- 同一角色、同一会话，只要记忆或重 roll 指令变化，半静态前缀就变化；
- Prompt 缓存命中率下降；
- 旧记忆和本轮临时指令在模型眼里的层级不清晰；
- 与 `13_Prompt缓存与Token.md` 的明确验收项不符。

### 实测结果

独立脚本：`_qa_prompt_layers_2026-11-05.cjs`

结果文件：`docs/testing/qa-prompt-layers-2026-11-05.json`

```text
ok: false
memoryAfterHistory: false
nudgeAfterHistory: false
environmentAfterHistory: true
indices:
  memIndex: 1
  nudgeIndex: 1
  envIndex: 3
  finalIndex: 4
```

实际请求路径：

```text
0 system: 静态角色/世界规则
1 system: 记忆 + 场景 + 格式 + 本次特别要求
2 user: 第一句
3 system: 环境时间
4 user: 第二句
```

产品要求：

```text
静态 → 半静态 → 历史 → 记忆 → 环境 → 最新 user / 本轮指令
```

`13_Prompt缓存与Token.md:404` 明确：

> 记忆块放在历史记录之后、环境时间之前

`13_Prompt缓存与Token.md:418` 验收项：

> 记忆块在历史之后、环境之前

`13_Prompt缓存与Token.md:36-42` 还明确把“本轮临时指令”归到第四层动态。

### 代码原因

- 记忆块被塞进 `promptBundle.semi`：`index.html:4173-4175`；
- `buildCachedMessages()` 总是先放 `semi`，再放历史：`index.html:4254-4263`；
- 本轮指令 `nudge` 又被追加到 `semi`：`index.html:7681-7683`。

### 修复建议

把 Prompt 装配拆成明确的字段：

```text
stable
semi
history
memory
environment
finalUser
dynamicInstruction
```

固定顺序：

```text
stable
semi
history
memory(system)
environment(system)
finalUser(user)
dynamicInstruction(system/developer)
```

不要让 nudge、记忆或当前场景继续混进 `semi`。改完后必须有结构化断言，而不是只看最后一条 user 是不是用户原话。

---

## 四、P2：发布前缓存键仍是旧的 r1

`sw.js` 当前仍然是：

```js
var C='bsphone-v92-20261105-r1';
```

`version.json` 也仍然是 `cacheKey: bsphone-v92-20261105-r1`。

上一轮 Build92 候选也使用同一个 `r1`，而本轮 `core/store/core-store.js` 已经改过。当前报告说尚未线上发布，所以这不是本轮功能失败；但如果后续直接发布，旧 r1 静态资源缓存可能让部分测试设备继续用旧 store 文件。

建议线上发布前把缓存键改为 `r2` 或重新生成 `sw.js` 内容，并重新跑 Service Worker 测试。

另外，报告写着“源码提交 `506cc91`”，而当前 HEAD 是 `f48448`；源码文件从 506 到现在没有变化，所以源码哈希可追溯，但建议报告明确写“源码实际提交 506，当前证据提交 f484”，避免复核时误解。

---

## 五、本轮通过的回归和真机证据

### 桌面/浏览器

| 测试 | 结果 |
|---|---|
| `_qa_chat_turn_reroll_2026-11-05.cjs` | 19/19 PASS |
| `_qa_turn_reroll_independent_2026-11-05.cjs` | 14/14 PASS |
| `_qa_turn_branch_switch_ui_2026-11-05.cjs` | 5/5 PASS |
| `_qa_turn_reroll_multi_2026-11-05.cjs` | 7/7 PASS |
| `_independent_turn_reroll_audit_2026-11-05.cjs` | 9/9 PASS |
| `_independent_turn_branch_switch_audit_2026-11-05.cjs` | 6/6 PASS |
| `_independent_fresh_branch_reload_audit_2026-11-05.cjs` | 重载后分支可达 PASS |
| `_independent_turn_reroll_edge_audit_2026-11-05.cjs` | 5/5 PASS |

独立边界测试额外确认：

- 真实 `sendText()` 连发 3 条：
  `甲一 / 甲二 / 甲三` 同一 `turnId/messageGroupId`；
- 点击第二条或第三条，确认框都完整列出三条；
- 实际 `文字 + 图片 + 文字` 连续组：不弹生成确认、不调用模型、`turnBranches` 不创建；
- 失败只弹一条错误；
- `turnBranches` 经过备份导入后仍保留。

### 全页/发布回归

| 测试 | 结果 |
|---|---|
| `_round97_full_page_ui_regression.cjs` | 33 桌面 + 33 窄屏 PASS，返回 6/6 |
| `_round108_p1_recheck_test.cjs` | PASS |
| `_round109_sw_publish_test.cjs` | 6/6 PASS |
| `_qa_data_management_2026-11-05.cjs` | 17/17 PASS |
| `_qa_independent_batch3_recheck.cjs` | 14/14 PASS |
| `_round111_batch3_redteam_fix_test.cjs` | 13/13 PASS |

### 真机

我重新连接了 OPPO PMK110（序列号 `3B665K02PNH00000`），并复跑：

`node .\_round115_phone_release_smoke_test.cjs`

结果：9/9 PASS。

- 设备内版本 `3.81 / versionCode 92`
- 设备内 APK 哈希与 Release 候选一致：`8A263FD43D5F7E2F1E35C7269DDC863FB387AC61ACDDE86520F6E8F7B186BD9B`
- `firstInstallTime` 和 `ceDataInode` 未变，应用数据保留
- 冷启动 `Status: ok`
- WebView 根节点存在
- 截图非空
- 日志未发现 FATAL EXCEPTION / ANR

真机长按证据截图已复核：

- `docs/testing/round115-longpress-user2.png`
- `docs/testing/round115-reroll-confirm.png`

---

## 六、最终判定

**打回重修。**

上一轮的两个 P0 已经真实修复，不能把旧账再算到这次；但本轮报告把“旧分支不污染 Prompt”写成了通过，这一条目前不成立：

- 消息数组隔离：PASS
- 旧分支自动记忆隔离：FAIL
- Prompt 四层顺序：FAIL（记忆和 nudge 仍在历史前）
- 发布缓存键：发布前需更新，当前为风险项

修复这两项后，再按下面清单复检：

1. 开启自动总结，旧分支生成一条自动记忆，重生成新分支；
2. 断言新分支 Prompt 不含旧后续记忆；
3. 切回旧分支，断言旧记忆恢复；
4. 断言 Prompt 顺序为 `static → semi → history → memory → environment → final user / instruction`；
5. 断言 nudge 不再破坏半静态前缀；
6. 更新缓存键并重新构建 APK；
7. 重新跑本报告列出的桌面、备份、真机和全页回归。

满足以上条件，才可签收连续消息组重 roll 里程碑。
