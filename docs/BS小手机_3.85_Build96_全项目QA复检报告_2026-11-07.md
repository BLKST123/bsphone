# BS小手机 3.85 / Build 96｜全项目 QA 复检报告

- 复检日期：2026-11-07
- PM 接包：`C:\Users\lenovo\Documents\ChatGPT\各种的\BS小手机_主队完整交接包_2026-11-05.zip`
- 主队完整报告（根目录）：`C:\Users\lenovo\Documents\ChatGPT\各种的\BS小手机_3.85_Build96_QA384返修复检_红队与检查官报告_2026-11-07.md`
- 主队完整报告（仓库副本）：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\BS小手机_3.85_Build96_QA384返修复检_红队与检查官报告_2026-11-07.md`
- 证据清单：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round120-evidence-manifest-2026-11-07.json`
- 代码目录：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages`
- 业务源码提交：`2e6a109f3948ed497b37b38852b6da900760c61a`
- 最终 HEAD：`e6a1881`（报告/证据提交）
- 版本：3.85 / Build 96
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 业务代码修改：无

## 一、最终判定

主队本轮 QA-384 的主要目标已经通过：

```text
群聊忘记 A 不误删同群 B 的普通长期记忆：PASS
群聊忘记 A 不误删 B 的 memoryItem/memoryEntry：PASS
群聊忘记 A 不误删 B 的 branch legacy/memory IDs：PASS
短文本“好”不误删“用户喜欢好吃的”：PASS
分支/编辑/删除/混合组回归：PASS
R101 44×44 与 Release 恢复：PASS
```

但仍发现一个角色备注名边界：

```text
群聊摘要使用角色备注名“阿照”时，忘记 A 后 chat.mem/base/branch legacy 仍残留“阿照记忆：好”
```

因此：

```text
QA-384 主体返修：通过
群聊备注名摘要清理：不通过
3.85 / Build 96 全项目签收：不通过
```

## 二、版本与证据链

| 项目 | 实测 |
|---|---|
| 本地 `index.html` SHA-256 | `5877A7ED428444681F7DD78276F94A2F92B0BC847502790427F63F8A23A6F4B6` |
| Release APK SHA-256 | `1D77DEFF408A6A53A99E30EDA28E4AA6B2846860F808D584CABA2C45E6D82525` |
| Debug APK SHA-256 | `9CCC06BD7CBA2872BF9549AEB0CE4F6ED6AC15B26BEE35D47E9D7CD28726F375` |
| 设备内版本 | 3.85 / versionCode 96 |
| 设备内 APK 回拉哈希 | `1D77...82525`，与 Release 候选一致 |
| 数据保留 | `firstInstallTime=2026-10-20 23:07:55`、`ceDataInode=2120975` 未变 |
| Service Worker | `bsphone-v96-20261107-r1` |
| 线上发布 | 报告声明未线上发布，本轮不作为线上通过证据 |

证据清单内部校验：

```text
tests=38
logs=6
screenshots=5
missing=0
hash mismatch=0
```

38 个测试 JSON、6 个日志和 5 张截图均存在，日志/截图哈希与 `round120-evidence-manifest-2026-11-07.json` 一致；测试 JSON 记录的源码哈希均为 `5877...F4B6`。

但本轮新增的备注名反证：

- `qa-forget-group-remark-scope-2026-11-07.json`

没有进入 manifest，因此 `manifest.ok=true` 仍不能证明“所有群聊摘要命名方式安全”。

## 三、QA-384 通过项复核

### 3.1 同群角色记忆隔离

独立复跑：

- `qa-forget-group-member-scope-2026-11-06.json`：3/3 PASS
- `qa-forget-group-branch-scope-2026-11-06.json`：13/13 PASS

验证：

- c1 的消息“好”被删除；
- c1 的长期记忆、memoryItem、memoryEntry 被清理；
- c2 的 `角色二长期记忆：好` 保留；
- c2 的 chat.mem/base/legacy 保留；
- c2 的 branch memoryItemIds 保留；
- 跨会话/跨角色不污染。

### 3.2 短文本精确匹配

`qa-forget-substring-scope-2026-11-06.json`：7/7 PASS。

验证：

- “用户喜欢好吃的”保留；
- “好”只删除目标来源；
- 当前 chat.mem/base/legacy 的无关文本保留。

### 3.3 分支与消息生命周期

通过：

- 普通删除同步 active branch；
- 非活动旧分支不被普通删除改写；
- 分支导出/删除；
- active branch 删除保护；
- 混合组保留/移除图片位置；
- 编辑并重新生成；
- 手动分支继续。

## 四、新阻断：QA-385-01｜P1｜备注名导致群聊摘要残留

### 复现数据

- 群聊成员 c1、c2；
- c1：
  - `name='角色一'`
  - `remark='阿照'`
- c1 发出的消息：`好`
- `chat.mem.items`: `阿照记忆：好`
- `baseMemorySnapshot`: `阿照记忆：好`
- branch `legacyMemItems`: `阿照记忆：好`

执行“忘记这条”两次确认。

预期：

- c1 消息删除；
- c1 联系人长期记忆删除；
- c1 memoryItem 标记 deleted；
- chat.mem/base/branch legacy 中的 `阿照记忆：好` 也删除。

实际：

```json
{
  "messageRemoved": true,
  "senderContactMemoryCleared": true,
  "senderMemoryCleared": true,
  "chatMemNoRemark": false,
  "baseNoRemark": false,
  "legacyNoRemark": false
}
```

残留：

```text
chat.mem.items: 阿照记忆：好
baseMemorySnapshot: 阿照记忆：好
branch.legacyMemItems: 阿照记忆：好
```

证据：

- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\qa-forget-group-remark-scope-2026-11-07.json`

### 根因

`index.html:6807-6811` 的 `forgottenChatWideTextMatches()` 只用：

```js
sender.name
sender.displayName
```

判断发送者名称，未使用：

```js
contactDisplayName(sender) // 优先 remark
sender.remark
```

当群聊摘要使用备注名“阿照”而不是原名“角色一”时，发送者名称前缀判断失败，摘要不会被清理。

### 影响

- 角色备注名是正常用户数据；
- 用户明明执行了忘记，后续 Prompt 仍可能从 chat.mem/base/branch legacy 读取残留；
- 与 QA-384 的目标“只清理发送者 A、保留 B”相反：现在 A 的摘要反而残留；
- 当前 38 项测试没有覆盖备注名摘要格式。

### 修复要求

- 群聊摘要匹配使用 `contactDisplayName(sender)`、`sender.remark` 和原名；
- 其他成员名称判断也要使用 `contactDisplayName`/remark；
- 用统一的规范化人物显示名比较；
- 增加群聊备注名反证并纳入 manifest；
- 验证实际 Prompt 中不再出现残留摘要。

## 五、测试矩阵

| 检查 | 结果 |
|---|---|
| 群聊 A/B 普通记忆隔离 | PASS |
| 群聊 branch legacy/memory IDs 隔离 | PASS |
| 群聊备注名摘要清理 | **FAIL** |
| 短文本“好”精确匹配 | PASS |
| 编辑并重新生成 | PASS |
| 手动分支继续/切换 | PASS |
| 分支导出/删除 | PASS |
| 普通删除 active branch | PASS |
| 混合组图片位置 | PASS |
| Prompt 分层/旧分支记忆隔离 | PASS |
| R101 44×44 | PASS |
| 33 页桌面/窄屏/深色 | PASS |
| 数据管理 17/17 | PASS |
| R108/R109/批次3 | PASS |
| 真机 R117/R118/R119/R120/R114/R101/R112/R113 | PASS（主队证据 + 本轮独立 R101） |
| 全项目完成 | **FAIL（未完成模块见下）** |

## 六、真机与 Release

- 独立复跑 R101 当前源码：10/10 PASS；
- `dmRefresh` 实测 `44.00893020629883 × 44.00893020629883`；
- 设备当前为 Release 3.85 / versionCode 96；
- 设备内 APK 回拉哈希与 Release 候选一致；
- 应用数据和 `firstInstallTime`、`ceDataInode` 保留；
- Release smoke 在报告中记录 9/9 PASS；本轮已恢复 Release96，未执行 `pm clear`。

## 七、明确未完成边界

- 图片消息重 roll；
- 图片分支全屏页；
- 已隐藏内容恢复页；
- ZIP + assets 发布级归档；
- GitHub Pages 线上发布。

这些不能被 QA-384 范围 PASS 替代，也不能写成全项目完成。

## 八、返修清单

### P1

- [ ] `forgottenChatWideTextMatches()` 使用 `contactDisplayName` / `remark` 识别发送者。
- [ ] 群聊摘要、baseMemorySnapshot、branch legacy 的备注名格式清理通过。
- [ ] 增加群聊备注名摘要反证并纳入 round120/下一版证据清单。
- [ ] 验证实际 Prompt 不包含被忘记的备注名摘要。

### P2

- [ ] 对群聊中每个成员使用 `contactDisplayName`，避免同名/备注名逻辑再次分裂。
- [ ] 将该反证加入真机套件和 manifest。

## 九、最终签署

```text
QA-384 同群普通角色记忆隔离：通过
短文本精确匹配：通过
编辑/分支/删除/混合组/回归：通过
群聊备注名摘要清理：不通过
3.85 / Build96 全项目签收：不通过
```

主队可以保留本轮已通过的群消息发送者作用域、memoryItem/memoryEntry、分支 legacy/ID、短文本、分支导出/删除和真机修复；只需补齐 `contactDisplayName`/备注名摘要匹配并重跑反证，即可进入下一轮。
