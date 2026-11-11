# BS小手机 3.84 / Build 95｜全项目 QA 复检报告

- 复检日期：2026-11-06
- PM 完整交接包：`C:\Users\lenovo\Documents\ChatGPT\各种的\BS小手机_主队完整交接包_2026-11-05.zip`
- 解包目录：`C:\Users\lenovo\Documents\ChatGPT\各种的\_qa_handoff_2026-11-05`
- 主队返修报告：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\BS小手机_3.84_Build95_QA383返修复检_红队与检查官报告_2026-11-06.md`
- 主队证据清单：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round119-evidence-manifest-2026-11-06.json`
- 代码目录：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages`
- 源码提交：`d9ffd7f2cc5eafbe62ab8add719599fc0a031059`
- 当前 HEAD：`28dafa6`（其后为证据/报告提交）
- 版本：3.84 / Build 95
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 业务代码修改：无

## 一、最终判定

主队本轮的 QA-383 修复大部分有效：

```text
短文本“好”不再按任意子串误删：通过
混合组图片位置保持：通过
R113/R101 命中区稳定：通过
Debug/CDP 复现路径：通过
3.84 新增功能和既有回归：通过
```

但仍有一个 P1 数据隔离问题：

```text
群聊中忘记角色 A 的消息，会误删同群角色 B 的同文本/同后缀记忆
```

因此本轮：

```text
QA-383 返修范围：基本通过
群聊角色级记忆隔离：不通过
3.84 全项目签收：不通过
```

## 二、版本与证据链

| 项目 | 实测 |
|---|---|
| 本地 `index.html` SHA-256 | `FFE0F569395573DE180883665B0679BC859DE28EA0762D3D5D7BC1236DB86126` |
| Release APK SHA-256 | `75AF7A5252C372F4F609811CF24694417EE7497037A0BD46E149A6188D8BB014` |
| Debug APK SHA-256 | `FFE0C30501D3EB77E5733618168196F253B4C7E0AE8C0E224E28FE75901CBC24` |
| 设备内版本 | 3.84 / versionCode 95 |
| 设备内 APK 回拉哈希 | `75AF...D8BB014`，与 Release 候选一致 |
| 数据保留 | `firstInstallTime=2026-10-20 23:07:55`、`ceDataInode=2120975` 未变 |
| Service Worker | `bsphone-v95-20261106-r1` |
| 线上发布 | 报告声明未线上发布，本轮不作为线上通过证据 |

证据总清单内部校验：

```text
tests=35
logs=6
screenshots=4
missing=0
hash mismatch=0
```

所有 35 个测试 JSON、6 个日志和 4 张截图均存在，日志/截图哈希与 `round119-evidence-manifest-2026-11-06.json` 一致；测试 JSON 记录的源码哈希均为 `FFE0...6126`。

但本轮新增的群聊同群角色反证：

- `qa-forget-group-member-scope-2026-11-06.json`

没有进入主队 manifest，因此 `manifest.ok=true` 不能代表“所有角色记忆边界通过”。

## 三、已通过的修复

### 3.1 忘记短文本精确性

上一轮发现的“忘记‘好’会删掉‘用户喜欢好吃的’”已经被修复。

独立反证：

```text
unrelatedContactKept=true
unrelatedMemoryKept=true
unrelatedChatMemKept=true
unrelatedBaseKept=true
unrelatedLegacyKept=true
unrelatedMemoryIdKept=true
forgottenTargetRemoved=true
```

证据：

- `docs/testing/qa-forget-substring-scope-2026-11-06.json`

### 3.2 混合组图片位置

通过：

- 保留模式 `text → image → text → text` 位置保持；
- 图片不进入文字 Prompt；
- 移除模式只在旧分支保留图片；
- 新分支文本和回复正常生成。

证据：

- `docs/testing/qa-mixed-group-edit-lifecycle-2026-11-06.json`

### 3.3 分支导出/删除

通过：

- 分支菜单导出、删除按钮可见；
- 按钮命中区 44×44；
- 导出内容包含 chat、turn、branch messages、memoryItemIds、legacyMemItems、kind；
- 删除有两次确认；
- 当前 active 分支不能直接删除；
- 非活动分支删除后 active 与剩余分支有效。

证据：

- `docs/testing/qa-branch-export-delete-2026-11-06.json`
- `docs/testing/round118-phone-qa382.json`

### 3.4 R101 / R113 命中区

通过：

- 3.83 Debug 实测 `dmRefresh` 约 `44.0089 × 44.0089`；
- R101 10/10 PASS；
- R113 使用 `>=43.99` 容差并记录 `hitTargetTolerancePx=0.01`，没有把 43.5 判为 44。

### 3.5 Prompt 与连续组回归

通过：

- Prompt 分层 7/7；
- 旧分支记忆隔离 3/3；
- 自动总结分支隔离 7/7；
- 连续组重 roll 19/19；
- 编辑并重新生成 26/26；
- 分支 UI/active/重载一致。

## 四、新阻断：QA-384-01｜群聊忘记会误删其它角色记忆

### 复现

群聊 `gc`：

- `c1` 和 `c2` 都是当前群成员；
- 角色 `c1` 发出一条文本消息：`好`；
- `c1` 的长期记忆：`角色一长期记忆：好`；
- `c2` 的长期记忆：`角色二长期记忆：好`；
- `DB.memoryItems` 中分别属于 c1/c2。

执行：

1. 长按 c1 的“好”；
2. 点击忘记；
3. 继续；
4. 确认忘记。

预期：

- 删除 c1 的消息；
- 删除 c1 对应的记忆；
- 保留 c2 长期记忆；
- 保留 c2 `memoryItem`。

实际：

```json
{
  "forgottenFromRemoved": true,
  "sameCharMemoryRemoved": true,
  "otherGroupMemberMemoryKept": false,
  "c1": [],
  "c2": [],
  "m1": "deleted",
  "m2": "deleted"
}
```

证据：

- `docs/testing/qa-forget-group-member-scope-2026-11-06.json`

### 代码原因

`index.html:6800-6814`：

- `currentMemberIds` 包含群聊全部成员；
- `DB.memoryItems` 的 `inCurrentChatScope()` 只要 `contactId/charId` 属于当前群成员就继续处理；
- `DB.contacts[].memories` 只检查 persona，没有限定消息发送者 `m.from`；
- `DB.memoryEntries` 同样按当前 chat/群成员范围处理；
- 文本/后缀匹配规则会把 `角色二长期记忆：好` 命中为可删除。

这与角色记忆模型冲突：`c1` 发出的消息不应清除 `c2` 的独立长期记忆。

### 修复要求

- 角色消息忘记时，消息发送者范围以 `m.from` 为准；
- 群聊中只清理 `charId/contactId === m.from` 的记忆；
- 不应按全部 `currentMemberIds` 清理联系人记忆；
- 若产品确实要求共享群记忆，必须书面修改产品语义并增加明确提示，不能默认跨角色删除；
- 增加群聊双角色同文本反证，并加入 manifest。

## 五、通过/失败矩阵

| 检查 | 结果 |
|---|---|
| 短文本“好”不误删同角色无关记忆 | PASS |
| 跨角色/跨会话常规反证 | PASS |
| 群聊同群其它角色记忆隔离 | **FAIL** |
| 忘记后 Prompt 不含目标文本 | PASS |
| 普通删除 active branch 快照 | PASS |
| 分支导出/删除 | PASS |
| 混合组图片位置 | PASS |
| 编辑并重新生成 | PASS |
| 手动分支继续/切换 | PASS |
| Prompt 分层与时间隔离 | PASS |
| 自动总结分支隔离 | PASS |
| R101 44×44 | PASS |
| R113 容差 | PASS |
| R97 浅色/深色 33+33 | PASS |
| R108/R109/数据管理/分组语义 | PASS |
| 真机 R117/R118/R114/R112/R113/R101 | PASS |
| 3.84 全项目签收 | **FAIL** |

## 六、真机与证据

- 当前设备已安装 Release 3.84 / versionCode 95；
- 设备内 APK 回拉哈希 `75AF7A...D8BB014` 与 Release 候选一致；
- `firstInstallTime`、`ceDataInode` 未变；
- R117/R118/R114/R112/R113/R101 证据均为当前源码；
- R101 当前测量约 `44.0089px`；
- 35 项测试、6 个日志、4 张截图均在 `_ghpages/docs/testing`；
- 主队报告未把图片重 roll、图片分支、隐藏内容、ZIP 资产和线上发布虚报为完成。

## 七、未交付边界

- 图片消息重 roll；
- 图片分支全屏页；
- 已隐藏内容恢复页；
- ZIP + assets 发布级归档；
- GitHub Pages 线上发布。

这些不是本轮问题，但不能写成全项目完成。

## 八、返修清单

### P1

- [ ] 忘记角色消息时只清理消息发送者 `m.from` 的记忆，不清理同群其它成员。
- [ ] `DB.memoryItems`、`DB.contacts[].memories`、`DB.memoryEntries`、`chat.mem`、`baseMemorySnapshot`、branch legacy 全部按发送者 scope 处理。
- [ ] 增加群聊双角色同文本/同后缀反证并纳入 round119 manifest。

### P2

- [ ] 为群聊分支快照补充同角色/跨角色记忆清理断言。
- [ ] 增加真机群聊“忘记 A 保留 B”回归。

## 九、最终签署

**QA-383 短文本子串误删：已修复。**

**混合组、分支生命周期、R101/R113 和既有回归：通过。**

**群聊角色级记忆隔离：不通过。**

**3.84 / Build95 全项目签收：不通过。**

主队可以保留本轮已通过的短文本精确匹配、混合组、分支导出/删除、Prompt 和真机修复；只需把忘记操作的角色范围收紧到 `m.from`，再补群聊双角色反证即可进入下一轮复检。
