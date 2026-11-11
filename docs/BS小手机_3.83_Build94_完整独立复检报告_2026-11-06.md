# BS 小手机 3.83 / Build 94｜完整独立复检报告

- 复检日期：2026-11-06
- 主队报告：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\BS小手机_3.83_Build94_QA382返修复检_红队与检查官报告_2026-11-06.md`
- 证据总清单：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round118-evidence-manifest-2026-11-06.json`
- 交接包：`C:\Users\lenovo\Documents\ChatGPT\各种的\BS小手机_主队完整交接包_2026-11-05.zip`
- 源码：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html`
- 源码 SHA-256：`9504BA72B4A6A1933FF7805ADF345862BF398B4340E23C1CB940A1FEAA369331`
- 源码提交：`b91d09ba934b8065efb6ec4c0baf72551c75bd38`
- 当前 Git HEAD：`98997ab63f5e0e7d7a330728721dafed7f28834a`（HEAD 是证据/文档提交；业务源码与 b91d09b 一致）
- 最终判定：**打回重修**

---

## 一、结论

主队上一轮的 5 个阻断项，从代码和单会话测试看，绝大部分确实修复了：

| 上轮问题 | Build94 结果 |
|---|---|
| 忘记这条未清长期记忆、快照、旧分支摘要、检索记忆 | 单会话场景 PASS |
| 普通删除未同步 active branch | PASS |
| 分支菜单缺导出/删除 | PASS |
| 混合文字+图片/卡片组没有选择 | PASS |
| R101 44×44 亚像素抖动 | 实际 44.0089；PASS，但测试门槛仍需收紧 |

但“忘记”修复出现了新的严重越界删除：

**忘记角色 A 的一条短消息，会按纯文本子串匹配，把所有角色、所有会话中包含同一段文字的长期记忆、结构化记忆和检索记忆一起删掉。**

这是数据丢失问题，不能签收。

---

## 二、P0：忘记这条的清理范围仍然越界

### 代码证据

`index.html:6779-6781`：

```js
function forbiddenTextMatches(value,msgId,text){
  const raw=String(value||'');
  return raw.indexOf(String(msgId||''))>=0 ||
    (!!text&&raw.indexOf(String(text))>=0);
}
```

`index.html:6789-6801`：

```js
(DB.memoryItems||[]).forEach(function(item){
  if(sources.indexOf(msgId)>=0||forbiddenTextMatches(item.plainText,msgId,text)){
    deletedMemoryIds.add(String(item.id));
    item.status='deleted';
  }
});

(DB.contacts||[]).forEach(function(contact){
  contact.memories=contact.memories.filter(function(memory){
    return !forbiddenTextMatches(memory&&memory.text,msgId,text);
  });
});

(DB.memoryEntries||[]).forEach(function(entry){
  if(String(entry.sourceId||'')===String(msgId)||
     forbiddenTextMatches(entry.fact,msgId,text)||
     forbiddenTextMatches(entry.sourceLabel,msgId,text)){
    entry.active=false;
  }
});
```

问题有两个：

1. `forbiddenTextMatches` 使用“包含这段文字”匹配，没有限定当前 chat、当前 char、当前 user 人设或 source message；
2. `DB.contacts` 遍历的是所有联系人，不是当前联系人或群成员。

### 独立复现

我构造了两个角色、两个会话：

- 角色 A 的当前 char 消息是：`好`
- 角色 B 的长期记忆：`角色二长期记忆：好`
- 另一个会话的结构化记忆：`会话二摘要：好`
- 另一个会话的检索记忆：`会话二：好`

对角色 A 执行“忘记这条”后，独立结果为：

```text
otherChatMemoryItemPreserved: false
otherContactMemoryPreserved: false
otherChatMemoryEntryPreserved: false
otherChatLegacyPreserved: true
```

具体状态：

- 角色 A 当前消息被删除：正确；
- 角色 B 的长期记忆被清空：错误；
- 另一个会话的 memoryItem 被标记 deleted：错误；
- 另一个会话的 memoryEntry 被删除：错误；
- 另一个会话的 legacy `ch.mem.items` 因为只处理当前 chat 而幸存。

证据文件：

`_ghpages/docs/testing/independent-forget-cross-scope-audit-2026-11-06.json`

这是“忘记 A，顺手删 B”，属于跨角色、跨会话的数据越界，不是单条消息清理。

### 单会话测试为什么是绿的

`_qa_forget_branch_memory_2026-11-06.json` 现在 6/6 PASS，但它只准备了一个角色、一个会话，且没有准备另一个角色拥有相同文本的记忆。

所以这份测试只能证明“单会话不泄漏”，不能证明“清理不会越界”。当前清单没有覆盖跨角色/跨会话反证。

### 正确修复方向

- `DB.memoryItems` 只处理 `sessionId === ch.id` 的当前会话记忆，或当前 char / 当前联系人的记忆；
- `DB.contacts[].memories` 只处理当前 char（或当前群聊成员）记忆；
- `DB.memoryEntries` 只处理当前 chat/session 或当前角色绑定；
- 先用 `sourceMessageIds` 精确匹配，文本包含匹配只能作为同一作用域内的兜底；
- 短消息（如“好”“嗯”“晚安”）不能使用全局子串删除；
- 必须新增测试：角色 A 忘记后，角色 B 的长期记忆、另一个会话的 memoryItem、memoryEntry 和 legacy 摘要全部原样保留。

---

## 三、已通过的上轮和本期修复

以下是我在 Build94 源码上独立跑的，不是只读主队结论：

| 测试 | 结果 |
|---|---|
| `_qa_wechat_message_edit_branch_2026-11-06.cjs` | 26/26 PASS |
| `_qa_forget_branch_memory_2026-11-06.cjs` | 6/6 PASS（单会话） |
| `_qa_delete_branch_snapshot_2026-11-06.cjs` | 3/3 PASS |
| `_qa_branch_export_delete_2026-11-06.cjs` | 5/5 PASS |
| `_qa_mixed_group_edit_lifecycle_2026-11-06.cjs` | 6/6 PASS |
| `_independent_manual_branch_continue_audit_2026-11-06.cjs` | 3/3 PASS |
| `_independent_mixed_group_edit_audit_2026-11-06.cjs` | 2/2 PASS |
| `_independent_forget_memory_scope_audit_2026-11-06.cjs` | 2/2 PASS（单角色） |
| `_qa_prompt_layers_2026-11-05.cjs` | 7/7 PASS |
| `_qa_turn_auto_memory_branch_fix_2026-11-05.cjs` | 7/7 PASS |
| `_qa_chat_turn_reroll_2026-11-05.cjs` | 19/19 PASS |
| `_qa_turn_branch_switch_ui_2026-11-05.cjs` | 5/5 PASS |
| `_qa_independent_batch3_recheck.cjs` | 14/14 PASS |
| `_round111_batch3_redteam_fix_test.cjs` | 13/13 PASS |
| `_qa_data_management_2026-11-05.cjs` | 17/17 PASS |
| `_round97_full_page_ui_regression.cjs` | 33 桌面 + 33 窄屏 PASS，返回 6/6 |
| `_round108_p1_recheck_test.cjs` | PASS |
| `_round109_sw_publish_test.cjs` | 6/6 PASS（`bsphone-v94-20261106-r1`） |

当前功能状态：

- 编辑并重新生成：新 user ID、同 turn、同 group、旧尾归档、失败回滚均 PASS；
- 分支双向切换、active 和菜单 ✓：PASS；
- 分支导出：payload 包含 chat、turn、prefix、branch messages、memoryItemIds、legacyMemItems；
- 分支删除：两次确认、active 分支保护、非活动分支删除均 PASS；
- 普通删除：当前消息和当前 active branch 快照同步删除；
- 混合组编辑：保留/移除选择可达，图片不进入文字 Prompt，旧分支保留图片；
- 旧分支记忆隔离：新分支不继承旧自动摘要，切回旧分支可恢复；
- Prompt 顺序：`static → semi → history → memory → nudge → environment → final user`。

---

## 四、仍需补强的验收点

### P2：混合组“保留卡片”后卡片位置没有断言

`mixedTurnGroupWithReplacements()` 会把所有新文字替换插到第一个文字位置，再把图片/卡片追加到后面。测试里原始类型是 `text, image, text, text`，保留后是 `text, text, image, text`。

这证明“图片保留了”，但没有证明“图片仍在原来的相对位置”。如果产品要求保留原顺序，需要补位置断言并修替换逻辑；如果只要求存在，报告应写清限制。

### P2：R113 的 44×44 测试函数仍有 43.5 门槛

`_round113_phone_data_management_test.cjs:26` 仍是：

```js
x.w>=43.5&&x.h>=43.5
```

本次实际 `dmRefresh` 测量为 `44.00893020629883`，页面值通过；但验收函数本身不是严格 44。建议统一使用明确浮点容差，如 `abs(v-44)<0.01`。

### Phone CDP 测试

当前本机 `127.0.0.1:9444` 不可用，无法独立复跑 round118 真机 CDP 10/10；已有真机 JSON 和两张截图与主队报告一致。我另行复跑了 Release 冷启动 9/9 PASS。

---

## 五、明确仍在范围外的事项

主队报告已列明、本轮不虚报：

- 图片消息重 roll；
- 图片分支全屏页；
- 已隐藏内容恢复页；
- ZIP + assets 发布级归档；
- GitHub Pages 线上发布。

这些不能作为本轮“已完成”，也不能拿本期 PASS 代替后续验收。

---

## 六、Build94 产物与版本核对

- 页面版本：`2026-11-06 · 3.83 · 第 94 轮`
- Service Worker：`bsphone-v94-20261106-r1`
- 源码哈希：`9504BA72B4A6A1933FF7805ADF345862BF398B4340E23C1CB940A1FEAA369331`
- Release APK：`37CE74874C3584828EE92C84D6C284A8705A2AC09C053C6CF2FD69D4AB3681AE`
- Debug APK：`EC5BC1CD728F0EA4AAD5956D31CB66F51DEA20B24CC71ACCB6CB8E42AFE32459`
- APK 内嵌 `index.html`、`sw.js`、`version.json` 与源码一致
- 设备内 Release 3.83 / versionCode 94，APK 回拉哈希与候选一致
- 数据保留：`firstInstallTime=2026-10-20 23:07:55`、`ceDataInode=2120975`
- Release 冷启动：9/9 PASS

---

## 七、打回重修清单

1. **P0：给“忘记”清理加作用域**
   - 只清当前 chat/session 和当前 char/当前联系人；
   - 不再全局扫描所有 contacts、all memoryItems、all memoryEntries 做文本包含匹配；
   - 短文本使用精确 sourceId 或当前作用域内匹配；
   - 补跨角色/跨会话反证，确保 B 角色和 B 会话数据完全不变。

2. **P2：补混合组卡片位置断言**
   - 明确“保留”是否必须保持原相对位置；
   - 如果必须，修复 `mixedTurnGroupWithReplacements()` 的顺序；
   - 如果不需要，报告写清限制。

3. **P2：统一 44×44 浮点容差**
   - 不允许 `>=43.5` 被标记为 `hitTargets44`；
   - 所有触控证据用同一断言函数。

4. **P1：真机 CDP 需要可复现**
   - 当前报告的真机套件有 JSON，但本环境无法复跑 `9444`；
   - 交付时应提供可通过 `adb` 启动的 debug/CDP 路径，或把最终设备证据与安装包、日志完整绑定。

---

## 八、最终判定

**打回重修。**

Build94 的主路径不是空壳：编辑、手动分支、分支导出/删除、混合组选择、普通删除同步、Prompt 分层和旧分支记忆隔离，我都能在源码和独立测试中看到真实修复。

但“忘记这条”从单会话过度清理变成了跨角色、跨会话误删。用户忘记角色 A 的一句话，可能会静默删掉角色 B 的长期记忆和另一个会话的检索记忆。这个问题会破坏数据，不是可接受的残余风险。

先修 P0 的清理作用域，并补一个“忘记 A 不影响 B”的跨角色/跨会话测试，再重新出证据。
