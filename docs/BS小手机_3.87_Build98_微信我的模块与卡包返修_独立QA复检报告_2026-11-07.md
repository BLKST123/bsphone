# BS 小手机 3.87 / Build 98｜微信“我的”模块与卡包返修独立 QA 复检报告

- 复检日期：2026-11-07
- 被检版本：3.87 / Build 98
- 业务源码提交：`8f8a249f83494815311d8eb2cda34e6e6862bec2`
- 仓库 HEAD：`5896ee3a7baea4db3ffe82e135e123360d59f601`
- 源码：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html`
- 源码 SHA-256：`D3F4E538CC226F6361FC0B5DA50D29EF3A8FF36EC067A79D425F2F22DE2CCFB4`
- 真机：OPPO PMK110 / Android 16 / 1272×2772 / `3B665K02PNH00000`
- 设备最终安装：Release 98；回拉 APK SHA-256：`9434AAD1E1ABE37EE127B4250A39B51F3DA3EA7CDFC9529FF508731563B9C513`
- 最终判定：**不通过（REJECT / FAIL）**

> 结论不是“整个项目全坏”。构建、APK/ZIP 校验、线上发布、多数钱包/卡包基础路径、图片旧能力回归均通过；但微信“我的”模块仍有 5 个 P1 缺陷和 3 个 P2 缺口，主队报告中的“微信我的完整模块 PASS / 长按触屏拖动 PASS / 人设引用检查 PASS / 资产完整 PASS”不能成立。

---

## 0. 一页结论

| 范围 | 独立结果 | 说明 |
|---|---|---|
| 微信“我的”入口与全屏页 | PASS | 人设、钱包、卡包、资产、表情、收藏均可进入全屏页 |
| 人设库基础增改与世界书绑定 | PASS（基础路径） | 新建、编辑、启用、字段保存可用 |
| 人设删除引用保护 | **FAIL（P1）** | 情侣空间、外卖地址、外卖支付/订单引用未被识别，可删出孤儿数据 |
| “我的”手动资料覆盖 | **FAIL（P1）** | 启用人设后，手动编辑姓名被“我的”页面忽略 |
| 钱包基础账单/收入支出/余额调整 | PASS | 正常金额路径和 adjustment 不计入收支验证通过 |
| 钱包异常金额 | **FAIL（P1）** | `1e309` 可保存为 Infinity，余额和收入统计被污染 |
| 卡包添加、尾号隐私、详情、解绑、历史账单 | PASS（基础路径） | 卡号 DOM 只显示尾号；解绑保留账单；支付降级成功 |
| 鼠标/触屏长按拖动 | **FAIL（P1）** | 真机连续触摸拖动触发 `pointercancel`；只有“单次瞬移”脚本通过 |
| 卡包叠放与逐张切换 | **FAIL（P2）** | 实际最上层永远绘制 order 最后一张；无切换控件，视觉首卡与列表首卡不一致 |
| 资产基础增删改与持久化 | PASS（基础路径） | 当前人设隔离和刷新持久化通过 |
| 资产关联角色/世界线 | **FAIL（P1）** | 资产编辑页没有角色/世界线关联字段 |
| 资产异常估值 | **FAIL（P1）** | `1e309` 可保存为 Infinity，合计估值显示 `¥Infinity` |
| 表情分组/删除分组迁移 | PASS | 删除自定义分组时表情移动到默认分组，未删除表情 |
| 收藏分类/搜索/删除快照/回原会话 | PASS | 原消息删除标记和回原会话入口通过 |
| 图片重 roll/分支/隐藏/ZIP | PASS（回归） | 桌面和真机旧能力复跑通过 |
| JSON/ZIP + assets + checksum | PASS | Release ZIP 17 entries / 15 checksums，内容校验通过 |
| GitHub Pages 线上发布 | PASS | version 200；线上 APK 哈希与 Release 一致 |
| 主队证据总清单 | PASS（附测试设计问题） | 49 个测试 JSON、6 个日志、11 张截图均存在；1 个 JSON 未使用统一 `checks` 结构 |
| 全项目其它 App | 不签收 | 本轮只复检 3.87 微信“我的”及关联回归，不能外推为全项目完成 |

---

## 1. 复检方法

本次没有只读主队日志后签字。实际执行了：

1. 读取 PRD：`00_总览与红线.md`、`主队项目交接表.md`、`26_内置系统世界书_v2_最终替换稿.md`、`23_终极审计_差异与遗漏清单.md`、`24_微交互与补充细节清单.md`、`22_Figma_IOS27_全机美化规范.md`、`20_页面地图与UI布局总册.md`、`02_微信.md`、`13_Prompt缓存与Token.md`、`14_数据兼容与发布.md` 等。
2. 读取 3.86/3.87 报告、STATE、DECISIONS、证据清单、Release ZIP 和当前源码。
3. 独立打开当前 `index.html`，检查 DOM、对象状态、页面文本、按钮命中区、数据结构和源码函数。
4. 独立复跑核心、回归、历史遗留和真机脚本。
5. 在 OPPO PMK110 上安装 Debug 98，使用 WebView CDP 做真机触摸；结束后覆盖安装回 Release 98，并回拉 APK 复核哈希。
6. 独立访问线上 `version.json` 和线上 APK，计算 SHA-256。
7. 为异常边界另写 QA 测试脚本，不修改业务代码。

---

## 2. 版本与真机基线

### 2.1 本地与设备

- Release APK SHA-256：`9434AAD1E1ABE37EE127B4250A39B51F3DA3EA7CDFC9529FF508731563B9C513`
- Debug APK SHA-256：`E88115A380025A404F529B5B291F9FA113CF96BE065FDBDE55D5A30288B0D21E`
- Release ZIP SHA-256：`F7AF762E2F7AB2CDA68174E7669319A94D4CF8F09C1C4256380F3176ECFF3D94`
- Service Worker：`bsphone-v98-20261107-r1`
- 设备内版本：3.87 / versionCode 98
- 设备内回拉 APK SHA-256：`9434AAD1E1ABE37EE127B4250A39B51F3DA3EA7CDFC9529FF508731563B9C513`
- `firstInstallTime` 保持 `2026-10-20 23:07:55`
- 真机测试使用 `adb install -r`，未执行 `pm clear`
- 测试后已覆盖安装回 Release，并冷启动成功

### 2.2 线上

- `https://blkst123.github.io/bsphone/version.json`：HTTP 200
- 线上版本：3.87 / 98
- 线上 cacheKey：`bsphone-v98-20261107-r1`
- 线上 APK：HTTP 200，549,846 bytes
- 线上 APK SHA-256：`9434AAD1E1ABE37EE127B4250A39B51F3DA3EA7CDFC9529FF508731563B9C513`
- 本地 Release APK 与线上 APK：一致

---

## 3. P1 阻断项

### P1-01｜真机连续触摸拖动不生效，主队“触屏长按拖动 PASS”只覆盖了瞬移式单点移动

**需求：** 卡包必须支持鼠标和触屏稳定长按拖动排序，Pointer Capture 不能只在测试脚本的特殊事件序列中有效。

**真机复现：**

1. 在 OPPO PMK110 安装 Debug 98；
2. 准备三张卡：甲、乙、丙，order 为 `a,b,c`；
3. 长按最上层“丙”650ms，确认出现 `data-dragging="1"`；
4. 从丙连续移动 10 次到甲的位置，每次间隔 35ms；
5. 浏览器在第二次移动后派发 `pointercancel`；
6. 松手后卡顺序仍为 `a,b,c`，没有把丙移动到甲前面。

**真机实际 trace：**

```text
pointerdown target=c
touchstart target=c
pointermove target=c
pointermove target=c
touchmove target=c
pointercancel target=c
touchmove ... (后续只有 touchmove，没有 pointermove)
touchend target=c
```

**实际对象状态：**

```json
{
  "entered": {"dragging": true, "order": ["a","b","c"]},
  "continuous": {"order": ["a","b","c"], "detail": false},
  "checks": {
    "continuous_touch_reorders_to_top": false,
    "single_move_reorders": true
  }
}
```

**问题实质：** 卡面没有在触摸拖动阶段阻止浏览器原生滚动/手势竞争，`touch-action` 仍为 `auto`；`pointermove` 里才调用 `preventDefault()`，但 `pointercancel` 已经先发生。主队真机套件只发一次 `touchMove`，没有覆盖真实手指连续移动。

**源码定位：**

- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html:9104`
- 相关代码创建 `#cardStack` 和卡面按钮、Pointer Capture、520ms 长按计时器，但卡面没有 `touch-action:none`；拖动时又会 `sheetCards()` 重绘 DOM。
- 同一文件 `9104` 的 `pointermove` 处理里才执行 `ev.preventDefault()`，对首次触摸手势竞争已经太晚。

**证据：**

- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\independent-phone-card-touch-audit-2026-11-07.json`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\independent-phone-card-touch-continuous-2026-11-07.png`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\independent-phone-card-touch-single-move-2026-11-07.png`

**返修要求：** 在拖动卡面/`#cardStack` 上明确设置 `touch-action:none`，pointerdown 进入拖动后阻止滚动，拖动过程使用稳定的指针坐标和一次性提交；必须用真实连续 touchmove 验证第三张拖到第一张、第一张拖到最后一张、拖到相邻卡和拖动中取消。

---

### P1-02｜人设删除引用检查漏掉情侣空间、外卖地址、支付和订单，能够删除后留下孤儿数据

**需求：** 删除被会话、情侣空间、外卖地址簿、小说引用的人设时必须阻止并列出引用。

**独立复现数据：**

```js
DB.couple.spaces = [{ id:'cs1', personaId:'p1' }];
DB.takeout.addresses.p1 = { items:[{ id:'addr1', label:'家' }] };
DB.takeout.payments.p1 = { type:'card', cardId:'card_orphan' };
DB.takeout.orders = [{ id:'order1', personaId:'p1' }];
```

**实际结果：**

```json
{
  "refsByFunction": [],
  "dom": {
    "hasReferenceBack": false,
    "hasDeleteConfirm": true,
    "text": "删除这个人设？……确认删除？"
  },
  "postDelete": {
    "personaStillExists": false,
    "coupleSpaceStillExists": true,
    "addressStillExists": true,
    "paymentStillExists": true,
    "orderStillExists": true
  }
}
```

即：界面允许永久删除，删除后情侣空间、地址、支付配置和订单仍引用已不存在的 `p1`。

**双重源码根因：**

1. 实际情侣空间存储在 `DB.couple.spaces`，但引用检查读取的是 `DB.coupleSpaces`：

   `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html:8928`

2. 实际外卖地址以 persona id 为 key 存在 `DB.takeout.addresses[p1]`，地址项本身没有 `personaId` 字段；当前检查把对象拍平后检查 `addr.personaId`，永远匹配不到：

   `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html:8930-8932`

**证据：**

- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-independent-edge-audit-2026-11-07.json`

**返修要求：** 检查 `DB.couple.spaces`，按 `Object.keys(DB.takeout.addresses)` 检查 persona key，并同时检查 `payments`、`orders` 等以 personaId 为索引的引用；先建立统一的引用索引，再由删除流程使用，不能维护两套数据路径。

---

### P1-03｜钱包金额和资产估值接受 `1e309`，运行时变成 Infinity，导出会进一步变成 null

**复现 A：钱包**

在钱包“记一笔”中填写：

```text
金额：1e309
备注：无穷金额
类型：收入
```

点击“保存这笔”后：

- 页面 toast：`账单已记录`
- 余额显示：`¥ Infinity`
- 收入显示：`¥Infinity`
- 账单记录 amount：`Infinity`
- `Number.isFinite(wallet.balance)`：`false`

**复现 B：资产**

在资产编辑页填写：

```text
名称：无穷资产
估值：1e309
```

保存后：

- 资产卡显示：`¥Infinity`
- 合计估值：`¥Infinity`
- `assetTotal()`：`Infinity`

**源码定位：**

- `walletRecord()`：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html:8975-8983`，只做了正数截断和两位小数，没有 `Number.isFinite()`。
- 资产保存：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html:9068`，直接把 `Number(value)||0` 写入对象，没有有限数值校验。

**影响：** Infinity 在 JSON 导出/ZIP 归档时被序列化成 `null`，会破坏数据可恢复性；也说明“钱包与资产完整”的主队结论不成立。

**证据：**

- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-independent-edge-audit-2026-11-07.json`
- 关键实际文本：`零钱余额 ¥ Infinity`、`收入 ¥Infinity`、`合计估值 ¥Infinity`

**返修要求：** 所有金额入口统一使用 `Number.isFinite` 且限定合理上限；输入 `Infinity`、`1e309`、`NaN`、空值、负数、超长小数都必须在写数据前拒绝，并保留原余额。导出前再做一次递归金额清理和完整性校验。

---

### P1-04｜启用人设后，“我的 → 编辑资料”保存成功但页面仍显示人设库姓名

**需求：** 启用人设同步“我的”名称/头像，同时仍允许手动编辑资料覆盖。

**独立复现：**

1. 启用名为“人设甲”的人设；
2. 点击“我的 → 编辑资料”；
3. 把姓名改为“手动覆盖名”并保存；
4. 对象层 `DB.me.name` 确实变成“手动覆盖名”；
5. 回到“我的”页面仍显示“人设甲”；
6. 页面 DOM 文本中不存在“手动覆盖名”。

**实际对象：**

```json
{
  "storedName": "手动覆盖名",
  "activeName": "人设甲",
  "afterHasManual": false,
  "afterHasActive": true
}
```

**源码定位：**

- `wxMine()`：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html:8845` 在存在人设时无条件用 active persona 覆盖 `DB.me` 的 name/avatar。
- `sheetMe()`：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html:15640-15649` 只写 `DB.me`，没有写 active persona，也没有建立覆盖标记。

**返修要求：** 明确两种语义之一并在 UI 上一致：
- 编辑资料直接编辑当前启用的人设；
- 或增加“手动覆盖”层，优先级高于人设默认值；
不能出现“保存成功但页面无效”。

**证据：**

- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-independent-edge-audit-2026-11-07.json`

---

### P1-05｜微信资产缺少“关联角色/世界线”字段和持久化

**需求：** `02_微信.md` 11.3 明确要求资产关联角色/世界线并持久化；`23` 的审计清单也把资产卡与关联关系列为验收项。

**实际资产编辑 DOM 只有：**

```json
[
  {"id":"ae_name","tag":"INPUT","placeholder":"名称，比如：江边那套房子"},
  {"id":"ae_kind","tag":"SELECT","placeholder":""},
  {"id":"ae_status","tag":"SELECT","placeholder":""},
  {"id":"ae_val","tag":"INPUT","placeholder":"估值（元）"},
  {"id":"ae_note","tag":"TEXTAREA","placeholder":"备注"}
]
```

没有角色选择、世界线选择或关联关系字段。

**源码定位：**

- `sheetAssetEdit()`：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html:9065-9068`
- 保存对象仅有 `id/name/kind/status/value/note/updatedAt`，没有 `characterIds`、`worldlineId`、`bindingId` 等关联字段。

**证据：**

- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-independent-edge-audit-2026-11-07.json`
- 同一证据中的 `assetForm` 字段清单。

**返修要求：** 资产编辑器补角色/世界线关联控件，保存、编辑、删除、人设切换和 ZIP 导入导出都要保持一致；至少验证“同一人设两个世界线的资产关联不会串线”。

---

## 4. P2 缺口与测试设计问题

### P2-01｜卡包“叠放可逐张切换”没有实现，且视觉最上层卡与列表第一张不一致

独立设置三张卡，order 为：

```json
["ca","cb","cc"]
```

实际：

```json
{
  "sorted": ["ca","cb","cc"],
  "topCard": "cc",
  "stackCount": 3,
  "cycleControls": 0
}
```

列表从上到下是甲、乙、丙，但卡包实际绘制在最上层的是丙。DOM 顺序以数组 map 顺序绘制，后面的按钮覆盖前面的按钮，导致视觉首卡是 order 最后一张；页面也没有上一张/下一张/切换控件。

**源码定位：**

- `sheetCards()`：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\index.html:9104`
- 堆叠卡按 `cards.map()` 生成，后面的卡没有额外层级/选中态控制。

**返修要求：** 定义明确的当前选中卡和堆叠层级，让列表顺序、视觉最上层、拖动起点、详情入口一致；补“逐张切换”的可操作入口。

**证据：**

- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-independent-edge-audit-2026-11-07.json`
- 真机截图：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-phone-cards.png`

### P2-02｜人设删除只有“返回”，没有 D-15 要求的迁移流程

当前被引用时只显示引用列表和“返回”，没有：

- 选择迁移到哪个人设；
- 迁移前预览；
- 失败回滚；
- 迁移完成后的引用更新。

这不是当前 P1 数据孤儿问题的替代修复。引用检测修完后仍需补迁移流程，否则用户只能手工逐页拆引用。

**证据：**

- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-independent-edge-audit-2026-11-07.json`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\主队文档\23_终极审计_差异与遗漏清单.md` 的 D-15。

### P2-03｜主队测试设计存在覆盖盲区，不能把 17/17、15/15 当成完整验收

主队本次测试的主要盲区：

| 盲区 | 主队测试实际覆盖 | QA 发现 |
|---|---|---|
| 触屏拖动 | 只发一次 touchMove 的瞬移式测试 | 连续 touchmove 触发 pointercancel，真机失败 |
| 人设引用 | 只放一个 `DB.chats` 引用 | 情侣空间/外卖地址/支付/订单漏检 |
| 金额边界 | 只测普通正数 | `1e309` 变成 Infinity |
| 资产关联 | 只测新增/编辑/合计 | 没有角色/世界线字段 |
| 手动资料覆盖 | 没有测试 | 保存后 My 页面仍显示 active persona |
| 叠放卡顺序 | 只数 stack/list 数量 | 最上层卡是最后一张，没有切换控件 |
| 证据 schema | 49 个 JSON 统一按 `checks` 统计 | `round121-phone-image-branch-hidden-zip.json` 无 `checks` 字段，清单显示 `presentChecks=0` |

说明：`presentChecks=0` 不表示 R121 真机完全没有执行；该 JSON 仍有 `menu/rerolled/branch/restored/hidden/unhidden/zip/errors` 等实质证据，且本次独立复跑通过。但证据清单自动统计逻辑对旧 schema 的测试会发生“0 项覆盖但 ok=true”的误导，需统一 schema 或在清单里明确标注“非 checks 结构”。

---

## 5. 独立回归结果

### 5.1 当前模块

- 桌面微信“我的”套件：**17/17 PASS**
- 真机微信“我的”套件：**15/15 PASS**（但不覆盖连续触摸拖动、金额 Infinity、完整引用类型）
- 图片重 roll / 图片分支 / 隐藏内容 / ZIP 桌面：**9 组 PASS**
- 图片重 roll / 图片分支 / 隐藏内容 / ZIP 真机：**PASS**
- 小屏全屏页：320×568、280×480 PASS，无横向溢出
- 持久化复跑：钱包、卡号、资产、表情、刷新后保留，切换人设不改编旧会话：**6/6 PASS**
- 连续触摸真机：**FAIL**（连续拖动为 4/5 check，核心重排 false）

### 5.2 历史遗留回归

- QA-385 群聊备注名摘要：7/7 PASS
- 数据管理：17/17 PASS
- 独立批次 3：14/14 PASS
- 批次 3 红队修复：13/13 PASS
- 亮色页面：33 桌面 + 33 窄屏 PASS
- 暗色页面：33 桌面 + 33 窄屏 PASS
- R108：PASS
- R109：PASS，cacheKey `bsphone-v98-20261107-r1`
- 25 个核心脚本逐个运行：最终无业务断言失败；其中独立审计脚本曾因本地端口占用瞬时失败，单独复跑通过，不把它算成功能失败

### 5.3 发布与证据

- Release ZIP：17 entries / 15 checksums PASS
- Release APK / 根 APK / 设备回拉 APK：三处 SHA-256 一致
- 线上 version / index / sw / APK：HTTP 200
- 证据总清单：49 个测试 JSON、6 个日志、11 张截图
- 证据文件缺失：0
- 测试 JSON 源码绑定：已有 `source.indexSha256` 的 16 个测试均与当前源码一致；另 33 个 JSON 未在文件内部控制源码哈希，只能依赖总清单的全局绑定
- 证据清单原始 `ok:true` 可复现，但它不能替代上面的新增边界测试

---

## 6. 复现命令与证据索引

### 6.1 主要复跑命令

```powershell
node _round122_wechat_mine_suite_test.cjs
node _round122_phone_wechat_mine_suite_test.cjs
node _round121_image_branch_hidden_zip_test.cjs
node _round121_phone_image_branch_hidden_zip_test.cjs
node _independent_card_unbind_wallet_adjust_2026-11-07.cjs
node _qa_round122_persistence_audit_2026-11-07.cjs
node _qa_round122_edge_audit_2026-11-07.cjs
node _independent_phone_card_touch_audit_2026-11-07.cjs
```

### 6.2 QA 新增证据

- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-independent-edge-audit-2026-11-07.json`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-persistence-audit-2026-11-07.json`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-phone-touch-adjacent-audit-2026-11-07.json`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\independent-phone-card-touch-audit-2026-11-07.json`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\independent-phone-card-touch-continuous-2026-11-07.png`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\independent-phone-card-touch-single-move-2026-11-07.png`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-independent-manifest-audit-2026-11-07.json`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-qa-independent-core-rerun-2026-11-07.log`
- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-qa-key-regression-rerun-2026-11-07.log`

### 6.3 QA 证据总清单

- `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\testing\round122-independent-qa-evidence-manifest-2026-11-07.json`

---

## 7. 必须返修清单

### 阻断（修完才能再交卷）

- [ ] P1-01：真机连续 touchmove 长按拖动稳定排序；禁止 pointercancel 后丢失拖动；鼠标多步移动顺序确定。
- [ ] P1-02：修复 `DB.couple.spaces` / `DB.takeout.addresses` / `payments` / `orders` 引用检查，删除前必须阻止并列出全部引用。
- [ ] P1-03：钱包金额、资产估值统一 `Number.isFinite` 校验，拒绝 Infinity/NaN/空值/负数/超限值；补导出前清理。
- [ ] P1-04：手动编辑“我的资料”必须真正覆盖 active persona，或直接编辑 active persona；不能保存成功后显示旧名字。
- [ ] P1-05：资产增加角色/世界线关联并持久化，补跨世界线隔离测试。

### 非阻断但需收口

- [ ] P2-01：修复卡包叠放最上层与列表顺序不一致，补逐张切换。
- [ ] P2-02：补人设迁移选择、预览、失败回滚。
- [ ] P2-03：统一 R121 真机证据 schema；主队测试加入连续拖动、Infinity、完整引用类型、手动覆盖、资产关联边界。

---

## 8. 明确不签收的边界

本轮通过的范围仅限：

- 正常金额的钱包账单和余额调整；
- 普通金额资产 CRUD 与当前人设隔离；
- 卡包添加、尾号展示、详情、单次/瞬移式排序、解绑、历史账单保留；
- 表情和收藏基础路径；
- 图片重 roll、图片分支、隐藏内容、ZIP + assets；
- 版本、APK/ZIP 和 Pages 发布完整性。

不签收：

- 微信“我的”完整模块；
- 银行卡连续触屏拖动；
- 人设删除引用保护和迁移；
- 钱包/资产异常金额；
- 资产角色/世界线关联；
- 其它未在本报告中独立复跑的 App。

---

## 9. 最终签署

```text
微信“我的”入口全屏页：PASS
用户人设库基础 CRUD：PASS
人设引用阻止删除：FAIL（P1）
人设手动资料覆盖：FAIL（P1）
钱包正常账单/余额调整：PASS
钱包异常金额防护：FAIL（P1）
卡包基础添加/尾号/详情/解绑/账单：PASS
卡包真机连续触摸拖动：FAIL（P1）
卡包叠放切换/视觉顺序：FAIL（P2）
资产基础 CRUD/持久化：PASS
资产角色/世界线关联：FAIL（P1）
资产异常估值防护：FAIL（P1）
表情分组基础路径：PASS
收藏基础路径：PASS
图片/隐藏/ZIP 旧能力回归：PASS
Release APK/ZIP/真机哈希：PASS
GitHub Pages 3.87 / Build98：PASS
```

**最终判定：REJECT（微信“我的”模块与卡包返修范围内仍有 5 个 P1、3 个 P2，不得按主队报告的 PASS 版本对外签收）。**


