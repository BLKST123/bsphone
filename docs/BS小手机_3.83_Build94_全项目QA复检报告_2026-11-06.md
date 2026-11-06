# BS小手机 3.83 / Build 94｜全项目 QA 复检报告

- 复检日期：2026-11-06
- PM 完整交接包：`C:\Users\lenovo\Documents\ChatGPT\各种的\BS小手机_主队完整交接包_2026-11-05.zip`
- 解包目录：`C:\Users\lenovo\Documents\ChatGPT\各种的\_qa_handoff_2026-11-05`
- 主队返修报告：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\BS小手机_3.83_Build94_QA382返修复检_红队与检查官报告_2026-11-06.md`
- 主队证据清单：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round118-evidence-manifest-2026-11-06.json`
- 代码目录：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages`
- 源码提交：`b91d09ba934b8065efb6ec4c0baf72551c75bd38`
- 当前 HEAD：`98997ab`（其后为证据/报告提交）
- 版本：3.83 / Build 94
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 业务代码修改：无

## 一、最终判定

主队本轮确实修复了上一轮 QA-382 的四项问题：

```text
QA-382-01 忘记跨数据源清理：基本通过
QA-382-02 普通删除活动分支快照：通过
QA-382-03 分支导出/删除：通过
QA-382-04 R101 44px 抖动：通过
混合文字+图片/卡片组编辑：通过
```

但全项目复检仍发现一个新的 P1 数据安全问题：

```text
忘记一条短消息会按“文本包含”误删无关记忆
```

因此：

```text
3.83 QA-382 原返修范围：通过
“忘记这条”数据的精确性：不通过
3.83 全项目签收：不通过
```

本报告不会把“主队在长文本测试中通过”扩大解释为“任意用户文本都安全”。

## 二、版本与证据链

| 项目 | 实测 |
|---|---|
| 本地 `index.html` SHA-256 | `9504BA72B4A6A1933FF7805ADF345862BF398B4340E23C1CB940A1FEAA369331` |
| Release APK SHA-256 | `37CE74874C3584828EE92C84D6C284A8705A2AC09C053C6CF2FD69D4AB3681AE` |
| Debug APK SHA-256 | `EC5BC1CD728F0EA4AAD5956D31CB66F51DEA20B24CC71ACCB6CB8E42AFE32459` |
| 设备内 APK 回拉哈希 | `37CE7487...3681AE`，与 Release 候选一致 |
| 设备内版本 | 3.83 / versionCode 94 |
| 数据保留 | `firstInstallTime=2026-10-20 23:07:55`、`ceDataInode=2120975` 未变 |
| Service Worker | `bsphone-v94-20261106-r1` |
| 线上发布 | 报告声明未线上发布，本轮不作为线上通过证据 |

证据清单内部校验：

```text
tests=32
logs=5
screenshots=3
missing=0
hash mismatch=0
```

23/32 项主队测试均绑定当前源码 `9504...`，日志和截图 SHA-256 与 manifest 一致。

但该 manifest 的测试集合仍然漏掉了本轮新增的短文本忘记反证：

- `qa-forget-substring-scope-2026-11-06.json` 未进入 manifest；
- 因此 manifest 的 `ok:true` 不能证明“忘记任意用户文本都安全”。

## 三、上一轮 QA-382 修复复核

### QA-382-01｜忘记这条跨数据源清理

主队长文本测试通过：

- 当前 `ch.msgs` 移除；
- `DB.memoryItems` 标记 deleted；
- `contact.memories` 清理；
- `baseMemorySnapshot` 清理；
- `branch.legacyMemItems` 清理；
- `branch.memoryItemIds` 清理；
- `DB.memoryEntries` 处理；
- cursor 回退；
- 实际 Prompt 不含被忘记长文本；
- memoryVersions、usage、订单/相册/收藏保留。

证据：

- `docs/testing/independent-forget-memory-scope-audit-2026-11-06.json`
- `docs/testing/qa-forget-branch-memory-2026-11-06.json`

### QA-382-02｜普通删除同步活动分支

通过。

- 当前消息删除；
- 当前 active branch snapshot 删除；
- 非活动分支保持原样；
- 分支菜单和重载不再复活消息。

证据：

- `docs/testing/qa-delete-branch-snapshot-2026-11-06.json`

### QA-382-03｜分支导出/删除

通过。

- 每个分支都有导出/删除；
- 按钮 44×44；
- 导出 payload 包含 chat、turn、branch messages、memoryItemIds、legacyMemItems、kind；
- 非活动分支可二次确认删除；
- active 分支直删会被拦截；
- 原始分支可恢复。

证据：

- `docs/testing/qa-branch-export-delete-2026-11-06.json`
- `docs/testing/round118-phone-qa382.json`

### QA-382-04｜R101 44×44

通过。

当前 3.83 Debug94 实测：

```text
dmRefresh width  = 44.008914947509766
dmRefresh height = 44.00893020629883
R101 10/10 PASS
```

导出文件约 26.8MB，manifest `3.83 / Build94 / schema4`，Key 未明文导出。

### 混合文字+图片/卡片

通过。

- 保留模式：图片留在新分支，但不进入文字 Prompt；
- 移除模式：图片只在旧分支保留；
- 编辑文本只预填文本子段；
- 新回复只基于文本；
- 旧分支保留原始图片、文字、旧回复；
- 真机 R118 相关检查 10/10 PASS。

## 四、新发现：QA-383-01｜P1｜忘记短文本会误删无关记忆

### 复现

忘记一条角色消息，文本为：

```text
好
```

准备以下无关记忆：

```text
contact.memories: 用户喜欢好吃的
chat.mem.items: 用户喜欢好吃的
baseMemorySnapshot: 用户喜欢好吃的
branch.legacyMemItems: 用户喜欢好吃的
DB.memoryItems: 用户喜欢好吃的
```

执行“忘记这条”两次确认后，期望：

- 只删除来源为 `msgId` 或文本完全等于“好”的记忆；
- “用户喜欢好吃的”必须保留。

实际：

```json
{
  "unrelatedContactKept": false,
  "unrelatedMemoryKept": false,
  "unrelatedChatMemKept": false,
  "unrelatedBaseKept": false,
  "unrelatedLegacyKept": false,
  "unrelatedMemoryIdKept": false,
  "forgottenTargetRemoved": true
}
```

实际结果中：

- `contact.memories` 被清空；
- `DB.memoryItems` 中的 `用户喜欢好吃的` 被标记 deleted；
- `chat.mem.items` 被清空；
- `baseMemorySnapshot` 被清空；
- `branch.legacyMemItems` 被清空；
- `branch.memoryItemIds` 也把无关 ID 删除。

证据：

- `docs/testing/qa-forget-substring-scope-2026-11-06.json`

### 根因

`index.html:6779-6781`：

```js
function forbiddenTextMatches(value,msgId,text){
  const raw=String(value||'');
  return raw.indexOf(String(msgId||''))>=0 || (!!text&&raw.indexOf(String(text))>=0);
}
```

这里对文本使用任意子串匹配：

- 忘记“好”会匹配“用户喜欢好吃的”；
- 忘记“嗯”可能匹配“嗯嗯好的”；
- 忘记“可以”可能匹配所有含“可以”的长记忆；
- 联系人记忆、会话快照、branch legacy、chat.mem 都被同一规则误删。

而 `forgetCharMessage()` 在 `index.html:6783-6822` 对这些数据源统一调用该匹配函数。

### 影响

- 用户只想删除一条聊天消息的记忆，却会丢失无关长期记忆；
- 对短句、口头禅、常用词尤其危险；
- 属于用户数据的不可逆误删；
- 当前主队 `independent-forget-memory-scope-audit` 使用长唯一文本来测，无法发现这个问题。

### 修复要求

- 结构化记忆优先按 `sourceMessageIds` 精确匹配；
- 无来源 legacy 摘要不能使用任意子串匹配；
- 至少改为规范化后完全相等，或引入明确的 memory-source 映射；
- contact memory、chat.mem、baseMemorySnapshot、branch legacy 使用同一精确规则；
- 增加“短消息 + 无关长记忆”反证，并加入 manifest。

## 五、通过项矩阵

| 检查 | 结果 |
|---|---|
| 编辑并重新生成 | PASS |
| 手动分支创建/继续/切回 | PASS |
| 混合文字+图片保留模式 | PASS |
| 混合文字+图片移除模式 | PASS |
| 分支导出 payload | PASS |
| 分支二次删除 | PASS |
| 普通删除同步 active branch | PASS |
| 忘记最长文本跨数据源清理 | PASS |
| 忘记短文本精确性 | **FAIL** |
| Prompt 四层与时间隔离 | PASS |
| 旧分支记忆隔离 | PASS |
| 自动总结分支隔离 | PASS |
| 聊天页无 Token/版本/分支角标 | PASS |
| 33 页桌面/窄屏/深色 | PASS |
| R101 导出与 44px | PASS |
| R108/R109/数据管理/分组 | PASS |
| 真机 R117/R118/R114/R112/R113/R101 | PASS（主队证据 + 本轮复跑） |

## 六、真机复跑记录

- Debug94 真机 R117：8/8 PASS
- Debug94 真机 R118：10/10 PASS
- Debug94 真机 R114：5/5 PASS
- Debug94 真机 R112：9/9 PASS
- Debug94 真机 R113：8/8 PASS
- Debug94 真机 R101：10/10 PASS；本次宽 `44.008914947509766`、高 `44.00893020629883`
- 测试结束后已覆盖安装 Release94
- 设备内 APK 回拉 `37CE74874C3584828EE92C84D6C284A8705A2AC09C053C6CF2FD69D4AB3681AE`
- 数据 `firstInstallTime`、`ceDataInode` 保留

## 七、仍未交付（不虚报通过）

以下是项目明确未完成项，不属于本期新模块的回归，但不能写进“全项目完成”：

- 图片消息重 roll；
- 图片分支全屏页；
- 已隐藏内容恢复页；
- ZIP + assets 发布级归档；
- GitHub Pages 线上发布。

主队报告已正确声明这些未完成项，保持区分。

## 八、返修清单

### P1 必须修

- [ ] `forbiddenTextMatches` 不得用任意文本子串删除记忆。
- [ ] 结构化记忆按 sourceMessageIds 精确关联。
- [ ] 无来源 legacy 摘要使用明确映射或规范化为完全相等。
- [ ] 增加“好 / 嗯 / 可以”等短文本 + 无关长记忆反证。
- [ ] 将新反证纳入 round118 证据总清单。

### P2

- [ ] 对忘记清理的范围、保留版本和 usage 边界再做一次真机回归。
- [ ] 为分支导出/删除增加真机重载和旧数据导入兼容断言。

## 九、最终签署

**QA-382-01～04：通过。**

**主队 3.83 新功能与回归：通过。**

**忘记短文本的记忆精确性：不通过。**

**3.83 全项目签收：不通过。**

主队可以保留本轮已完成的编辑、手动分支、混合组、导出/删除、44px、Prompt/记忆隔离和真机修复，不要回滚。只需要收紧忘记匹配范围，并补一条短文本反证，即可进入下一轮复检。
