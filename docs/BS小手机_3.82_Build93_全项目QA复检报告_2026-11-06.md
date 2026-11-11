# BS小手机 3.82 / Build 93｜全项目 QA 复检报告

- 复检日期：2026-11-06
- PM 最新交接包：`C:\Users\lenovo\Documents\ChatGPT\各种的\BS小手机_主队完整交接包_2026-11-05.zip`
- 解包目录：`C:\Users\lenovo\Documents\ChatGPT\各种的\_qa_handoff_2026-11-05`
- 主队模块报告：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\BS小手机_3.82_Build93_微信消息编辑与手动分支_模块交付报告_2026-11-06.md`
- 主队证据清单：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round117-evidence-manifest-2026-11-06.json`
- 代码目录：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages`
- 代码提交：`3926a366fcae9169d665bd0a87131cf45096c21a`
- 当前 HEAD：`135c032`（其后为证据/报告提交）
- 版本：3.82 / Build 93
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 业务代码修改：无

## 一、最终判定

主队本期的“微信消息编辑与手动分支”在自身 26 项测试覆盖内基本通过，但全项目复检**不能签完整通过**。

```text
本期编辑并重新生成：通过
本期手动分支创建与继续聊天：通过
本期菜单顺序和 44×44：通过
本期真机 R117：通过
连续组重 roll 回归：通过
Prompt 分层回归：通过
旧分支记忆隔离回归：通过
忘记这条的数据清理：不通过
普通删除后的活动分支快照：不通过
分支菜单导出/删除功能：不通过
全项目完整签收：不通过
```

主队报告的 `QA-381-04` / `QA-381-05` 等上一轮问题已经修复；本轮发现的是新的边界和遗漏测试，不是把旧问题重复报一遍。

## 二、版本、交接包与产物

| 项目 | 实测 |
|---|---|
| 本地 `index.html` SHA-256 | `B29BFD700BF6345E59A63295D388309B843F3087B60FFAAD27E3AEC33701D439` |
| Release APK SHA-256 | `8A1A61FD57941A3DA9226A213CA22ABAF0E15B3DC9E859DC8F6BF09CAA765EBA` |
| Debug APK SHA-256 | `27A66E50AB80B9A18883A986800F2FE8003C882BE726CAF99C53493449661798` |
| 设备内 Release APK 回拉哈希 | `8A263...` 与候选一致（当前 3.82 Release） |
| 设备内版本 | 3.82 / versionCode 93 |
| 应用数据保留 | `firstInstallTime=2026-10-20 23:07:55`、`ceDataInode=2120975` 未变 |
| Service Worker | `bsphone-v93-20261106-r1` |
| 线上发布 | 报告声明未线上发布；本轮不作为线上通过证据 |

Debug 真机测试完成后已覆盖装回 Release 3.82，未执行 `pm clear`。

PM 最新交接包已解包，并核对了 `00`、`02`、`13`、`20`、`21`、`23`、`24`、`27`、`28`、`29` 等当前执行依据。

## 三、证据总清单核验

`round117-evidence-manifest-2026-11-06.json` 内部结构一致：

```text
tests=23
logs=5
screenshots=5
missing=0
hash mismatch=0
```

核验项：

- 23 个测试 JSON 全部存在；
- 5 个日志文件存在且 SHA-256 匹配；
- 5 张截图存在且 SHA-256 匹配；
- 已记录的测试 JSON 均绑定当前源码 `B29B...`；
- 日志/截图的 manifest 哈希均通过。

但清单覆盖不完整：以下两项本轮新增的独立审计没有进入主队 manifest：

- `independent-forget-memory-scope-audit-2026-11-06.json`
- `qa-delete-branch-snapshot-2026-11-06.json`

因此 manifest 的 `ok:true` 只能说明“清单内 23 项通过”，不能说明“项目所有关键路径通过”。

## 四、本期新模块：通过的路径

### 4.1 编辑并重新生成

独立复跑通过：

- user 菜单顺序；
- 编辑前预填当前连续组；
- 精确提示文案；
- 菜单和编辑器按钮 44×44；
- 新 user message_id；
- 同一 turnId、同一新 messageGroupId；
- 旧 user/char/后续进入原始分支；
- 新分支 active；
- 实际 Prompt 只含编辑后的消息，不含旧回复/旧后续；
- UI 没有“已编辑/版本/分支”标记；
- 失败完整回滚；
- 编辑器关闭、busy 和 sheet 状态复位。

证据：

- `_ghpages/docs/testing/qa-wechat-message-edit-branch-2026-11-06.json`
- `_ghpages/docs/testing/round117-phone-wechat-message-edit-branch.json`

### 4.2 手动分支

独立复跑通过：

- 任意 user 消息菜单可创建新分支；
- 新分支结束在当前 user 气泡；
- 旧内容进入原始分支；
- 创建分支不增加模型调用；
- 继续发送后，新分支可持久化；
- 切回原始分支可恢复旧尾部；
- 菜单当前标记和 activeBranchId 一致。

证据：

- `_ghpages/docs/testing/independent-manual-branch-continue-audit-2026-11-06.json`

### 4.3 前期遗留修复回归

通过：

- 连续组识别、整组重 roll、旧尾部消息归档；
- 分支 activeBranchId 与显示内容一致；
- 环境时间只在 system 环境块，最后 user 只含真实输入；
- 记忆块位于 history 之后、环境之前；
- 重 roll nudge 位于独立本轮指令层；
- 旧分支自动摘要和结构化记忆不进入新分支；
- 自动总结分支隔离；
- 角色单条重 roll 入口移除；
- 聊天页无 Token 芯片和出戏技术词；
- 分组语义按 28 号纠偏执行：自定义分组全局可跨人设，上下文仍按会话隔离；
- 33 页桌面/窄屏/深色；
- R108、R109、数据管理 17/17。

## 五、阻断问题

### QA-382-01｜P1：忘记这条没有清掉角色长期记忆、快照记忆和旧分支摘要

主队 26 项测试中的 `forget_removes_message_memory` 只检查：

- 当前 `ch.msgs` 是否移除；
- `DB.memoryItems` 是否标记 deleted；
- `chat.mem.items` 是否移除；
- cursor 是否回退；
- branch.messages 是否移除。

它没有检查：

- `DB.contacts[].memories`；
- `chat.baseMemorySnapshot`；
- `branch.legacyMemItems`；
- `branch.memoryItemIds`；
- 忘记之后的实际 Prompt。

独立复现结果：

```json
{
  "characterMemoryRemoved": false,
  "chatMessageRemoved": true,
  "contactMemories": ["角色长期记得：秘密内容：我其实有孩子"],
  "baseSnapshot": ["会话快照：秘密内容：我其实有孩子"],
  "legacy": ["整理摘要：秘密内容：我其实有孩子"],
  "leaks": {
    "contact": true,
    "snapshot": true,
    "legacy": true,
    "entry": false
  }
}
```

实际记忆文本仍包含：

```text
【角色长期记忆（跨会话事实）】
- 角色长期记得：秘密内容：我其实有孩子
【当前会话快照记忆】
- 会话快照：秘密内容：我其实有孩子
【当前会话整理记忆】
- 整理摘要：秘密内容：我其实有孩子
```

另一条独立测试也确认：

```text
branchLegacyCleared = false
branchMemoryIdsCleared = false
contactMemoryCleared = false
promptNoForgottenText = false
```

违反 `02_微信.md` §5.7：

- 从角色长期记忆移除；
- 从当前上下文移除；
- 被忘记的分支不得再引用被删内容；
- 不应继续从记忆进入 Prompt。

**代码定位：**

- `index.html:6693-6713`：只处理 `DB.memoryItems` 与 `chat.mem.items`，没有处理 `contact.memories`、`baseMemorySnapshot`、branch `legacyMemItems`、branch `memoryItemIds`。
- `memoryContextForCharacter()` 会继续从 contact memories、base snapshot、branch legacy 读取这些内容。

**必须修：**

- 清除/归档与 `msgId` 关联的 contact long-term memory；
- 清除 `baseMemorySnapshot` 中的对应摘要；
- 过滤所有 turn branch 的 `legacyMemItems` 和 `memoryItemIds`；
- 重新生成实际 Prompt 并断言被忘记文本不出现；
- 保留记忆版本历史、usage、订单、相册、收藏实体。

### QA-382-02｜P2：普通删除没有同步当前 active branch 的快照

独立测试：

1. 当前 active branch 中包含 `du1/da1/da2`；
2. 长按 `da1`；
3. 当前消息删除二次确认；
4. 检查 `ch.msgs` 和 branch snapshot。

结果：

```text
currentMessageRemoved=true
branchSnapshotRemoved=false
active branch messages 仍包含 da1
```

证据：

- `_ghpages/docs/testing/qa-delete-branch-snapshot-2026-11-06.json`

影响：

- 分支菜单的预览仍可能显示已删除消息；
- 当前 active branch 的 `messages` 与 `chat.msgs` 不一致；
- 若后续逻辑直接读取 branch snapshot，删除内容可能重新出现。

**要求：**

- 明确普通删除只影响当前分支还是所有分支；
- 若只影响当前分支，至少同步当前 active branch snapshot；
- 若产品的删除语义是全局删除，必须同步所有 branch snapshots；
- 增加确认删除后的分支菜单/切换/重载断言。

### QA-382-03｜P1：分支菜单缺少 PRD 要求的导出/删除能力

`02_微信.md` §5.6 明确要求：

> 分支内可继续回复、继续分支、导出、删除。

当前 `sheetUserTurnBranches()` 只有分支列表和“返回”：

- 没有导出；
- 没有删除；
- 没有分支级管理操作。

主队的独立测试反而把：

```text
branchListHasNoExportDeleteActions = true
```

当成 PASS，这是测试口径与 PRD 相反，不能作为通过证据。

证据：

- `_ghpages/docs/testing/independent-manual-branch-continue-audit-2026-11-06.json`
- `index.html:6448-6454`

**影响：**

- 用户无法导出旧分支完整聊天；
- 用户无法删除不再需要的旧分支；
- 手动分支功能只完成了创建和切换，未完成 PRD 的全生命周期。

**要求：**

- 在分支菜单补齐导出、删除及对应二次确认；
- 删除分支前说明是否只删分支快照、是否影响原始聊天；
- 修复上述错误测试断言，不能把“缺少导出/删除”当作 PASS。

### QA-382-04｜P2：R101 存在 44×44 亚像素 flake

第一次真机运行 R101：

```text
dmRefresh width=43.99998474121094
hitTargets44 FAIL
```

第二次同一 Release/Debug 基线运行：

```text
dmRefresh width=44.000003814697266
R101 10/10 PASS
```

结论：

- 导出链路本身通过；
- 命中区测量存在浮点/缩放抖动；
- 主队报告声称最终套件 10/10，当前复跑仍能触发一次失败；
- 不应降低 44 标准，但应消除边界抖动或把测试判定改为稳定的设备像素/容差策略。

## 六、前期遗留/未交付边界

这些不是本期新模块的 bug，但不能在全项目签收时写成“已完成”：

- 图片消息重 roll：未完成；
- 图片分支全屏页：未完成；
- 已隐藏内容恢复页：未完成；
- ZIP + assets 发布级归档：未完成；
- GitHub Pages 线上发布：未完成。

当前 `STATE.md` 已明确列出这些未完成项，主队报告也没有把它们虚报为本模块通过，这一点正确。

## 七、回归与真机结果

### 桌面/浏览器

- `_qa_wechat_message_edit_branch_2026-11-06.cjs`：26/26 PASS
- `_qa_chat_turn_reroll_2026-11-05.cjs`：19/19 PASS
- `_independent_turn_reroll_audit_2026-11-05.cjs`：9/9 PASS
- `_independent_turn_branch_switch_audit_2026-11-05.cjs`：6/6 PASS
- `_qa_turn_reroll_independent_2026-11-05.cjs`：14/14 PASS
- `_qa_turn_reroll_multi_2026-11-05.cjs`：7/7 PASS
- `_qa_turn_branch_switch_ui_2026-11-05.cjs`：5/5 PASS
- `_qa_prompt_layers_2026-11-05.cjs`：7/7 PASS
- `_qa_turn_auto_memory_branch_fix_2026-11-05.cjs`：7/7 PASS
- R97：33 桌面 + 33 窄屏 PASS；深色 33 + 33 PASS
- R108：PASS
- R109：PASS
- 数据管理：17/17 PASS
- 分组语义：14/14 PASS
- R111：13/13 PASS

### 真机

- R117 本模块：8/8 PASS
- R114 连续组重 roll：5/5 PASS
- R112 分组：9/9 PASS
- R113 数据管理：8/8 PASS
- R101 首次 43.99998 flake，第二次 10/10 PASS，导出 26.8MB、manifest 3.82/Build93/schema4
- Debug 测试后已恢复 Release93；设备内 APK 回拉哈希 `8A1A...` 与候选一致，数据和 firstInstallTime 保留

### 本轮反证

- `independent-forget-memory-scope-audit-2026-11-06.json`：FAIL
- `qa-forget-branch-memory-2026-11-06.json`：FAIL
- `qa-delete-branch-snapshot-2026-11-06.json`：FAIL

## 八、完整返修清单

### P1 必须修

- [ ] 忘记这条清理 `contact.memories`。
- [ ] 忘记这条清理 `baseMemorySnapshot`。
- [ ] 忘记这条清理所有分支的 `legacyMemItems` 和 `memoryItemIds`。
- [ ] 重新生成 Prompt 并断言被忘记文本完全不存在。
- [ ] 分支菜单补齐导出/删除，或取得产品书面豁免。

### P2 必须处理

- [ ] 普通删除同步当前 active branch snapshot，并验证分支菜单、切换和重载。
- [ ] R101 命中区消除 43.99998 浮点边界 flake。
- [ ] 修正 `branchListHasNoExportDeleteActions` 的错误测试语义。
- [ ] 将两个新增反证纳入证据总清单，不能只保留 23/23 绿清单。

## 九、证据文件

- `_ghpages/docs/testing/round117-evidence-manifest-2026-11-06.json`
- `_ghpages/docs/testing/qa-wechat-message-edit-branch-2026-11-06.json`
- `_ghpages/docs/testing/round117-phone-wechat-message-edit-branch.json`
- `_ghpages/docs/testing/independent-forget-memory-scope-audit-2026-11-06.json`
- `_ghpages/docs/testing/qa-forget-branch-memory-2026-11-06.json`
- `_ghpages/docs/testing/qa-delete-branch-snapshot-2026-11-06.json`
- `_ghpages/docs/testing/independent-manual-branch-continue-audit-2026-11-06.json`
- `_ghpages/docs/testing/qa-prompt-layers-2026-11-05.json`
- `_ghpages/docs/testing/independent-turn-memory-branch-audit-2026-11-05.json`
- `_ghpages/docs/testing/qa-turn-auto-memory-branch-fix-2026-11-05.json`
- `_ghpages/docs/testing/round117-final-core-assertions-2026-11-06.log`
- `_ghpages/docs/testing/round117-final-regression-suite-2026-11-06.log`
- `_ghpages/docs/testing/round117-phone-debug-suite-final-2026-11-06.log`
- `_ghpages/docs/testing/qa-r97-dark-2026-11-06.json`
- `_ghpages/docs/testing/round101-phone-export.json`

## 十、最终签署

**微信消息编辑并重新生成：通过。**  
**手动分支创建/继续/切换：通过。**  
**忘记这条的完整数据清理：不通过。**  
**普通删除的活动分支快照一致性：不通过。**  
**分支导出/删除生命周期：不通过。**  
**3.82 全项目签收：不通过。**

主队可以保留本期已通过的编辑、手动分支、菜单、44px、真机长按和 Prompt 回归，不要回滚。下一步先修 QA-382-01/02/03，再重跑新增反证与完整 manifest。
