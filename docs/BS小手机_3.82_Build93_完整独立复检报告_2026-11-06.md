# BS 小手机 3.82 / Build 93｜完整独立复检报告

- 复检日期：2026-11-06
- 交接包：`C:\Users\lenovo\Documents\ChatGPT\各种的\BS小手机_主队完整交接包_2026-11-05.zip`
- 交接包已解压到：`C:\Users\lenovo\Documents\ChatGPT\各种的\_review_handoff_latest_2026-11-06`
- 主队报告：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\BS小手机_3.82_Build93_微信消息编辑与手动分支_模块交付报告_2026-11-06.md`
- 证据总清单：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round117-evidence-manifest-2026-11-06.json`
- 源码：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html`
- 源码 SHA-256：`B29BFD700BF6345E59A63295D388309B843F3087B60FFAAD27E3AEC33701D439`
- 源码提交：`3926a366fcae9169d665bd0a87131cf45096c21a`
- 当前 Git HEAD：`135c0326e4ecc9a8dba1cf667d0884468a4b34d7`（HEAD 只多了证据/文档提交，源码文件与 3926 提交一致）
- 最终判定：**打回重修**

---

## 一、结论先说

### 本期主路径，大部分确实做出来了

| 本期交付 | 结果 | 证据 |
|---|---|---|
| user 菜单 5 个新增项和既有项顺序 | PASS | 26/26 模块测试、真机截图 |
| 编辑并重新生成 | PASS | 新 user ID、同 turn、同 group、旧尾归档、Prompt 不含旧回复 |
| 从当前消息创建新分支 | PASS | 新分支 active、旧尾完整、无模型调用 |
| 角色消息“忘记这条”两次确认 | PASS | 两次确认文案和弹层流程通过 |
| 普通删除两次确认 | PASS（界面流程） | 第一次不立即删除，第二次执行 |
| 分支继续回复、切回旧分支 | PASS | 旧尾和新分支持续消息均能恢复 |
| 旧分支记忆隔离 | PASS | 自动摘要隔离测试 7/7、独立记忆测试 3/3 |
| Prompt 分层 | PASS | memory index 3、nudge index 4、env index 5、final user 6 |
| 真机长按、编辑器、手动分支、忘记按钮 | PASS | round117 真机 8/8、截图 |
| Release 3.82/93 冷启动和数据保留 | PASS | 独立复跑 Release smoke 9/9 |

### 但完整交付不能通过，原因不是新功能没做，而是“忘记”没有真正忘干净

用户点“忘记这条”后：

- 当前聊天流里的那条 char 消息确实没了；
- 带 `sourceMessageIds` 的结构化记忆也会标记为 deleted；
- 但是长期记忆、会话快照、旧分支摘要和部分检索记忆仍然保留原内容；
- 下一次 Prompt 仍可能把这些内容注入，角色会继续记得本应被忘记的话。

这不是文案问题，是隐私和上下文一致性问题。

---

## 二、P0：忘记这条没有彻底清理记忆

### 代码证据

`index.html:6693-6713` 的 `forgetCharMessage()` 目前只做这些事：

```js
// 1. 删除当前聊天流中的消息
store.commands.deleteMessage(ch.id,msgId,{persist:false});

// 2. 从所有 turn branch 的 messages 数组里移除该消息
branch.messages=branch.messages.filter(item=>item.id!==msgId);

// 3. 删除 sourceMessageIds 包含该消息的 memoryItems
item.status='deleted';

// 4. 只删除完全等于 text 的 ch.mem.items
mem.items=mem.items.filter(item=>String(item)!==String(text));
```

它没有处理：

- `DB.contacts[].memories` 中的长期记忆；
- `chat.baseMemorySnapshot` 中的会话快照；
- `turnBranches[].branches[].legacyMemItems`；
- `turnBranches[].branches[].memoryItemIds`；
- `DB.memoryEntries` 中的检索/跨场景记忆；
- 包含该消息内容但不完全等于该消息文本的摘要；
- 旧分支摘要中只包含该内容片段的情况。

### 独立实测结果

测试脚本：`_independent_forget_memory_scope_audit_2026-11-06.cjs`

结果文件：`_ghpages/docs/testing/independent-forget-memory-scope-audit-2026-11-06.json`

测试构造：

- 当前聊天里的 char 消息文本：`秘密内容：我其实有孩子`
- 角色长期记忆：`角色长期记得：秘密内容：我其实有孩子`
- 会话快照：`会话快照：秘密内容：我其实有孩子`
- 会话摘要：`整理摘要：秘密内容：我其实有孩子`
- 一个 sourceMessageIds 指向该 char 消息的结构化记忆

执行 `forgetCharMessage()` 后：

```text
chatMessageRemoved: true
memoryStatus: deleted
contactMemories: 仍然存在
baseSnapshot: 仍然存在
legacy: 仍然存在
prompt 中仍包含：
  角色长期记得：秘密内容：我其实有孩子
  会话快照：秘密内容：我其实有孩子
  整理摘要：秘密内容：我其实有孩子
```

也就是说，用户以为“忘记”了，下一次角色仍然能从 Prompt 里看到。

另有一个同源失败证据：

`_qa_forget_branch_memory_2026-11-06.cjs`

输出显示：

```text
branchLegacyCleared: false
branchMemoryIdsCleared: false
contactMemoryCleared: false
promptNoForgottenText: false
```

### 产品文档要求

`02_微信.md:272-279`：

> 从角色长期记忆、检索记忆、当前上下文和聊天流删除该条 char 消息
>
> 被忘记的分支仍然可以存在，但不得再引用被删内容

当前实现只覆盖了“当前聊天流 + memoryItems + 完全同文本 ch.mem”，没有覆盖长期记忆、快照、旧分支 legacy 记忆和检索记忆。

### 为什么主队测试没抓到

`qa-wechat-message-edit-branch-2026-11-06.json` 的忘记用例只检查：

- `DB.memoryItems` 状态；
- `ch.mem.items` 完全同文本；
- 当前聊天流；
- 分支 messages 数组。

它没有放长期记忆、`baseMemorySnapshot`、`legacyMemItems` 或 `memoryEntries`，所以测试是绿的，真实数据不是。

### 修复建议

“忘记”必须做一次跨数据源的一致性清理：

1. 从 `turnBranches[turnId].branches[].messages` 移除消息；
2. 清掉对应 branch 的 `memoryItemIds`；
3. 清掉对应 branch 的 `legacyMemItems` 中含该内容/来源的条目；
4. 清掉 `ch.baseMemorySnapshot` 中的对应条目；
5. 清掉 `contacts[].memories` 中来源或文本匹配的长期记忆；
6. 清掉 `DB.memoryEntries` 中与当前 chat/message 相关的检索记忆；
7. 安全地重算 memory cursor；
8. 最后生成一次 Prompt，断言被忘记文本和其中间摘要都不出现；
9. 切回旧分支，再生成一次 Prompt，断言仍不出现。

---

## 三、P1：分支管理入口没有完成 PRD 的分支导出/删除

### 代码证据

`index.html:6442-6454` 的“聊天分支”页面只有：

- 分支行；
- 当前 ✓；
- 返回按钮。

没有“导出这个分支”或“删除这个分支”的操作入口。

### PRD 要求

`02_微信.md:263-269`：

> 分支内可继续回复、继续分支、导出、删除；
>
> 分支内所有消息可导出；

### 当前状态

- 继续回复：PASS；
- 继续分支：数据结构支持；
- 分支内消息进入整库备份：PASS，`turnBranches` 会随聊天导出；
- 分支级导出入口：未实现；
- 分支删除入口：未实现。

如果团队把“整库备份包含分支”视作导出，也必须在报告中明确这是整库导出，不是分支页导出；目前报告没有这个说明，容易让验收方误解。

独立验证：

`_independent_manual_branch_continue_audit_2026-11-06.json`

分支页实际列出：

```text
聊天分支
原始版本 …
新分支 1 · 当前 …
返回
```

没有导出/删除。

---

## 四、P1：混合组编辑/重生成没有保留卡片选择

### 现象

用户连续发送“文字 + 图片 + 文字”，长按文字：

- 点“重新编辑并生成”：只弹 toast“整组编辑只支持纯文本消息”；
- 点“重新生成整个连续组”：只弹 toast“这组里有图片或卡片，整组重新生成只支持纯文本消息”。

没有出现 PRD 要求的“保留卡片 / 从新分支移除 / 取消”。

### 代码证据

`index.html:6456-6459`、`6569-6572`：

```js
if(!info.allText){ toast('...只支持纯文本消息'); return; }
```

### PRD 要求

`02_微信.md:240-246`：

> 纯文本子段可单独编辑/重生成，但卡片本身不进入提示词
>
> 编辑/重生成时若组内存在非文本项，弹出“是否保留这些卡片/图片”的选择：
> - 保留
> - 从新分支移除
> - 取消操作

独立复现：

`_independent_mixed_group_edit_audit_2026-11-06.json`

```text
edit.editor: false
edit.choiceCopy: false
regen.confirm: false
regen.choiceCopy: false
```

这属于前期遗留需求，不是本期新增的“图片重 roll”模块，不能因为本期未包含图片重 roll 就一起忽略。

---

## 五、P2：普通删除只删当前流，分支快照仍保留消息

### 现象

在分支内删除一条普通 char 消息，当前聊天流没了，但 `turnBranches` 中的快照仍保留该消息。用户马上导出整库或查看分支数据时，删除内容还可能作为幽灵副本存在。

### 证据

`_qa_delete_branch_snapshot_2026-11-06.cjs`：

```text
currentMessageRemoved: true
branchSnapshotRemoved: false
branchIds: [du1, da1, da2]
```

`deleteMessageTwoStep()` 位于 `index.html:6666-6680`，最终只调用 `store.commands.deleteMessage()`，没有同步当前 turn branch 快照。

### 需要产品确认的语义

`02_微信.md` 只说普通删除“作用于当前单条消息”，没有像“忘记”那样明确要求清所有分支。因此这可能有两种产品解释：

1. 普通删除只影响当前激活流，旧分支保留历史；
2. 普通删除也应同步当前激活分支快照，避免导出幽灵副本。

无论选哪种，当前实现都没有在 UI/报告中说明，属于语义未闭环。建议明确规则并让测试断言与产品一致。

---

## 六、P2：44×44 验收证据仍有放宽

最新报告说所有新增菜单/编辑器按钮 44×44 通过。`round117` 的模块测试确实显示新增菜单和编辑器按钮是 44px。

但历史回归 `_round113_phone_data_management_test.cjs:26` 使用：

```js
expect(pageInfo.cards.every(x=>x.w>=43.5&&x.h>=43.5)).toBe(true);
```

实际 `round113-phone-data-management.json` 里 `dmRefresh` 宽度是 `43.99998474121094`。这个数值在浮点上接近 44，实际用户几乎无感，但“>=44”的验收标准被放宽成了 `>=43.5`。

建议：

- 统一用一个带明确浮点容差的函数，例如 `abs(width-44)<0.01`；
- 在证据清单里写清楚容差；
- 不要把 43.5 的测试标成 `hitTargets44 PASS`。

---

## 七、已通过的上轮旧账

这些我本轮独立复跑了，不是继承主队口头结论：

| 旧账 | 结果 | 证据 |
|---|---|---|
| 真实连续消息组识别 | PASS | 真实 sendText 连发 3 条同一 turn/group |
| 分支 active 和内容一致 | PASS | 原始 → 新1 → 新2 → 原始 → 新1 |
| 旧分支自动记忆隔离 | PASS | `qa-turn-auto-memory-branch-fix` 7/7 |
| 旧分支 legacy 摘要隔离 | PASS | `independent-turn-memory-branch-audit` 3/3 |
| Prompt 记忆/指令/环境顺序 | PASS | `qa-prompt-layers` 7/7；索引 3/4/5/6 |
| 环境时间不混进 user | PASS | 最后 user 只包含用户原话 |
| 失败回滚 | PASS | 消息和 turnBranches JSON 前后一致 |
| 缓存键 r2/r3 | PASS（当前 Build93 为 `bsphone-v93-20261106-r1`） | SW 测试 6/6 |
| 全页 33×桌面/窄屏 | PASS | R97 33+33，返回 6/6 |
| P1 自检 | PASS | R108 |
| 数据管理 | PASS | 17/17 |
| 分组语义 | PASS | 14/14 |
| 批次 3 红队修复 | PASS | 13/13 |

---

## 八、真机与构建状态

### 已独立完成

- OPPO PMK110 / Android 16 / 1272×2772 在线
- 设备内版本：`3.82 / versionCode 93`
- 设备内 APK SHA-256：`8A1A61FD57941A3DA9226A213CA22ABAF0E15B3DC9E859DC8F6BF09CAA765EBA`
- Release smoke：9/9 PASS
- 冷启动 `Status: ok`
- `firstInstallTime` 和 `ceDataInode` 未变化
- WebView 根节点存在
- App 进程无 FATAL EXCEPTION / ANR

### 未独立复跑

- round117 真机 CDP 8/8：当前 `127.0.0.1:9444` 不可用，只能核对已有 JSON 和截图。
- `round117-user-menu.png`、`round117-editor.png`、`round117-char-menu.png` 我已查看；截图内容与报告描述一致，但截图不能替代“忘记长期记忆”的失败复现。

---

## 九、交接包与证据链

交接包实际包含 31 个文件，包含：

- `00_总览与红线.md`
- `02_微信.md`
- `13_Prompt缓存与Token.md`
- `14_数据兼容与发布.md`
- `20_页面地图与UI布局总册.md`
- `21_记忆系统.md`
- `23_终极审计_差异与遗漏清单.md`
- `24_微交互与补充细节清单.md`
- `主队项目交接表.md`
- 以及其余 App PRD

我使用了交接包中的 `02`、`13`、`21`、`24` 作为本轮验收依据，而不是只看主队交付报告。

版本/产物核对：

- 源码哈希：`B29BFD700BF6345E59A63295D388309B843F3087B60FFAAD27E3AEC33701D439`
- APK 内嵌 `assets/public/index.html`：同哈希
- Release APK：`8A1A61FD57941A3DA9226A213CA22ABAF0E15B3DC9E859DC8F6BF09CAA765EBA`
- Debug APK：`27A66E50AB80B9A18883A986800F2FE8003C882BE726CAF99C53493449661798`
- 设备内 APK 与 Release 候选一致

当前证据总清单没有收进以下失败反证：

- `qa-forget-branch-memory-2026-11-06.json`
- `qa-delete-branch-snapshot-2026-11-06.json`
- `independent-forget-memory-scope-audit-2026-11-06.json`
- `independent-mixed-group-edit-audit-2026-11-06.json`

因此 manifest 的“23 个测试全部通过”只能说明它列出的测试通过，不是全项目全量通过。

---

## 十、当前明确未完成项

这些是交接包/报告已经承认或仍然开放的，不应在本轮虚报为完成：

- 图片消息重 roll；
- 图片分支全屏页；
- 已隐藏内容恢复页；
- ZIP + assets 发布级归档；
- GitHub Pages 线上发布；
- 分支级导出/删除入口；
- 混合文本+卡片组的编辑/重生成“保留/移除/取消”选择；
- 记忆清理中的长期记忆、base snapshot、legacy branch、memoryEntries 完整覆盖。

---

## 十一、打回重修清单

1. **P0：把“忘记这条”改成跨数据源清理**
   - 当前聊天流；
   - 所有 turn branches 的 messages；
   - branch memoryItemIds；
   - branch legacyMemItems；
   - chat.baseMemorySnapshot；
   - contact.memories；
   - DB.memoryEntries；
   - 当前/历史 `ch.mem.items` 中包含来源或文本内容的摘要；
   - memory cursor 只更新当前 session，并重新指向仍存在的消息。

2. **P1：补分支级导出/删除入口，或明确从本轮范围移除**
   - 分支页不能只有切换和返回；
   - PRD 02 §5.6 明确写了分支内导出、删除。

3. **P1：补混合组编辑/重生成的保留/移除/取消选择**
   - 文字子段可编辑；
   - 卡片不进文本 Prompt；
   - 用户明确选择保留还是从新分支移除。

4. **P2：明确普通删除是否同步分支快照**
   - 若要永久删除，当前 active branch snapshot 应立即同步；
   - 若要保留旧分支历史，必须在报告和 UI 说明。

5. **P2：统一 44×44 验收函数**
   - 不把 43.5 当 44；
   - 用明确的 0.01 级浮点容差；
   - 在 manifest 里记录实际测量值和容差。

6. **修完后重新生成证据**
   - 新增 forgetting memory scope 测试；
   - 新增 mixed group edit 测试；
   - 新增 branch export/delete 测试；
   - 把失败反证也纳入 manifest，不能只列通过的测试。

---

## 十二、最终判定

**打回重修。**

本期“编辑并重新生成”和“手动创建分支”的主路径是真实可用的，上轮连续组、分支 active、Prompt 分层和旧分支自动记忆隔离也确实修好了。

但“忘记这条”是本期明确交付的隐私敏感动作，当前只能忘掉当前聊天流和一部分结构化记忆，长期记忆/快照/旧分支摘要仍会进入 Prompt。这不是可以留到下一批的优化项。

完整签收前，至少先修完 P0 的忘记清理，再决定分支导出/删除和混合组编辑是补实现还是明确延期。
