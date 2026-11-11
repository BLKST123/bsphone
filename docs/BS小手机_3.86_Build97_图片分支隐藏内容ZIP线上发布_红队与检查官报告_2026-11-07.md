# BS 小手机 3.86 / Build 97｜图片、隐藏内容、ZIP 资产与线上发布｜红队与检查官完整报告

- 报告日期：2026-11-07
- 被检报告：
  - `C:\Users\lenovo\Documents\ChatGPT\各种的\BS小手机_3.85_Build96_完整独立复检报告_2026-11-07.md`
  - `C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages\docs\BS小手机_3.85_Build96_全项目QA复检报告_2026-11-07.md`
- 业务源码目录：`C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages`
- 业务源码提交：`afa3bd405d58dfa42c6eadab69d56faf7189b484`
- 版本：3.86 / Build 97
- Service Worker：`bsphone-v97-20261107-r1`
- 真机：OPPO PMK110 / Android 16 / 1272×2772
- 最终判定：**本轮微信图片/隐藏内容、数据管理 ZIP 资产、GitHub Pages 发布范围 PASS；不代表其它未审计模块自动签收**

## 0. 结论摘要

上一轮 QA-385 阻断项和本轮用户要求的功能已一起交付：

| 模块 | 结果 |
|---|---|
| QA-385 群聊备注名摘要清除 | PASS |
| QA-385 实际 Prompt 无备注名残留 | PASS |
| 微信图片重 roll | PASS |
| 微信图片分支 | PASS |
| 微信删除显示 / 已隐藏内容恢复 | PASS |
| 图片菜单顺序与恢复/导出/删除 | PASS |
| ZIP + assets 发布级归档 | PASS |
| ZIP 导入校验 | PASS |
| 大 ZIP 原生分块写入 | PASS |
| GitHub Pages 线上发布 | PASS |
| 原有消息组、分支、Prompt、记忆、数据管理和 44×44 回归 | PASS |

本轮按“一个 APP/一个功能模块整体交付”执行，没有把一个功能拆成多个点单独交卷。

## 1. 当前模块任务详情

### 1.1 微信：图片消息完整能力

用户路径：

1. 长按角色图片消息；
2. 菜单显示：引用、重 roll、图片分支、删除、收藏；
3. 重 roll 打开提示词编辑页；
4. 可手改提示词、调用 AI 编写提示词、上传本次参考图；
5. 成功后新图替换原位置，旧图进入图片分支；
6. 图片分支为独立全屏页，支持查看大图、恢复、导出、删除。

验收要求：

- 原图失败时不能丢；
- 参考图只在本次生效，不自动沿用；
- 新图不能覆盖旧版本；
- 正常聊天流不显示版本号；
- 版本恢复后 Prompt 和图片同步恢复；
- 分支操作使用现有 Store 接口，不直接改底层 Store 文件。

### 1.2 微信：删除显示与已隐藏内容

用户路径：

1. 长按图片/卡片；
2. 选择“删除显示”；
3. 消息从正常聊天流隐藏但实体不删除；
4. 从聊天设置进入“已隐藏内容”；
5. 查看缩略图、类型、隐藏时间；
6. 点击“恢复到原位”。

验收要求：

- 隐藏项不进入 Prompt；
- 不删除订单、相册、收藏或其它业务实体；
- 恢复后回到原消息位置；
- 当前最后一条被隐藏时，会话最后消息回退到上一条可见消息；
- 永久删除与删除显示是两个语义。

### 1.3 数据管理：ZIP + assets

ZIP 包含：

- `manifest.json`
- `data/snapshot.json`
- `data/settings.json`
- `data/characters.json`
- `data/user_personas.json`
- `data/chats.json`
- `data/messages.json`
- `data/branches.json`
- `data/usage.json`
- `data/memory_items.json`
- `data/memory_versions.json`
- `data/memory_settings.json`
- `data/model_settings.json`
- `data/novels.json`
- `data/forum.json`
- `data/couple_spaces.json`
- `data/orders.json`
- `data/appearance.json`
- `assets/images/`
- `assets/audio/`
- `assets/themes/`
- `assets/wardrobe/`
- `checksums.json`

ZIP 导入走同一套 manifest/checksum 校验；原生保存使用分块 base64 写入，避免大 ZIP 一次性跨 WebView 桥导致失败。

### 1.4 GitHub Pages

- 发布分支：`main`
- 线上地址：`https://blkst123.github.io/bsphone/`
- 线上版本：`3.86` / versionCode `97`
- 线上 cacheKey：`bsphone-v97-20261107-r1`
- 线上 APK 哈希与本地 Release 哈希一致

## 2. 任务进程

| 阶段 | 动作 | 结果 |
|---|---|---|
| 1. 接单 | 读取 3.85 独立复检与全项目 QA 报告，提取 QA-385-01 和未完成边界 | 确认备注名是新的 P1 |
| 2. 语义确认 | 区分“忘记这条”“删除显示”“永久删除”“图片分支”“文字分支” | 不把删除显示实现成永久删除 |
| 3. QA-385 修复 | `forgottenChatWideTextMatches` 纳入 `contactDisplayName`、`remark`、原名、displayName；其它成员同样使用显示名 | 备注名摘要和实际 Prompt 均无残留 |
| 4. 图片基础 | 在现有图片生成和 `imageGenId` 上增加消息级 `imageBranch`、版本、活动版本 | 旧图保存，新图替换原位 |
| 5. 图片交互 | 增加图片重 roll 提示词页、AI 编写、本地参考图、生成失败重试和分支全屏页 | 菜单顺序与恢复/导出/删除完成 |
| 6. 隐藏交互 | 增加 `hiddenFromChat`、隐藏页、恢复、Prompt 排除和最后消息回退 | 隐藏项不进入上下文 |
| 7. ZIP 归档 | 增加 store-only ZIP 读写、manifest/data/assets/checksums、JSON 兼容导入 | ZIP 可构建、校验、导入 |
| 8. 大文件真机 | Java `NativeExport` 增加 begin/append/finish 分块写入，不把巨大 ZIP 一次塞进桥 | 70,209,760 bytes ZIP 真机导出成功 |
| 9. 桌面断言 | 运行核心 23 脚本、回归 7 轮 | 全部 PASS |
| 10. 真机 Debug/CDP | 顺序执行 10 个真机脚本，覆盖图片、隐藏、ZIP、消息组、分支、数据管理和 44×44 | 全部 PASS |
| 11. Release 恢复 | `adb install -r` 安装 Release 3.86 / Build97，不执行 `pm clear` | 设备数据保留，APK 回拉哈希一致 |
| 12. 线上发布 | 推送 `main`，等待 Pages 构建，验证 version.json、cacheKey 和线上 APK 哈希 | PASS |

## 3. 语义对齐颗粒度

这一节记录我对产品语义的理解，供产品经理、红队和检查官对齐。

| 术语 | 我的理解 | 实际实现 | 明确没有做 |
|---|---|---|---|
| QA-385“备注名” | 群聊摘要可能用 `remark` 而不是原名 | 发送者候选名包含 `contactDisplayName`、remark、name、displayName；其他成员也使用显示名比较 | 不只看原名，不把其他成员备注当发送者 |
| “忘记这条” | 隐私清理，不是普通删除 | 按 `m.from` 清理消息、长期记忆、结构化记忆和摘要 | 不清空全群 |
| “删除显示” | 只隐藏聊天流，实体保留 | `hiddenFromChat=true`，不进入可见消息集合和 Prompt | 不删除订单/相册/收藏 |
| “永久删除” | 删除聊天卡片，业务实体另存 | 永久删除前进入确认；图片记录进入小手机回收站数组 | 不删除外卖/网购实体 |
| “图片重 roll” | 重新生成一张角色图片并替换原位置 | 提示词编辑页、AI 编写、本次参考图、生成成功后替换 | 不覆盖旧图，不自动沿用参考图 |
| “图片分支” | 同一张图片的历史版本链 | 独立全屏页；当前版本/历史版本；查看大图；恢复/导出/删除 | 不在正常聊天流显示版本号 |
| “恢复图片版本” | 切换当前聊天显示的图片 | 更新消息 URL、提示词、活动版本 ID；其它版本保留 | 不删除其它版本 |
| “本次参考图” | 只为当前这次重 roll 选择的参考图 | 文件读取后只传入本次 `imageRefs`，不写入消息/下一次请求 | 不自动复用上次参考图 |
| “ZIP + assets” | 正式发布级归档，不只是 JSON | manifest + data + assets + checksums；支持 ZIP 构建和导入校验 | 不用 JSON 冒充正式 ZIP 归档 |
| “线上发布” | 用户可以通过 GitHub Pages 访问当前版本 | 推送 main 后验证线上 version 和 APK 哈希 | 不把本地文件存在当成线上已发布 |
| “一个 APP 一个功能” | 不把一个功能拆成孤立按钮点交卷 | 本轮按微信图片、隐藏内容、数据管理/发布三个模块整体交付 | 不在未完成时只报一个按钮结果 |

### 3.1 文字分支与图片分支的区别

- 文字/连续消息组走 `turnBranches`，解决同一组用户消息的不同回复和后续剧情；
- 图片分支走消息级 `imageBranch`，解决同一张聊天图片的历史版本；
- 两者都不在正常聊天流显示版本号；
- 图片分支不能覆盖文字分支数据，文字分支不能误删图片版本；
- 图片分支的恢复只改当前显示版本，不修改消息顺序。

### 3.2 删除显示与 Prompt

- 隐藏图片/卡片不删除业务实体；
- `currentMessageIdSet` 排除 `hiddenFromChat`；
- 隐藏项不会被当前 Prompt 的记忆来源或历史历史注入；
- 恢复后重新进入可见消息集合和 Prompt 判断流程；
- 最后一条可见消息被隐藏时，会话列表最后消息回退到上一条可见消息。

### 3.3 ZIP 与 JSON

- 普通 JSON 全量/轻量导出继续保留；
- ZIP 是发布级资产归档，不会被当作唯一导入格式；
- ZIP 内的 `data/snapshot.json` 是恢复源，拆分文件保留 schema 结构；
- `manifest.json` 记录版本、构建号、导出时间、资产数、校验算法和范围；
- `checksums.json` 记录每个数据/资产文件哈希；
- 导入先校验，失败不改当前数据。

## 4. QA-385 备注名修复证据

- 测试：`docs/testing/qa-forget-group-remark-scope-2026-11-07.json`
- 结果：7/7 PASS
- 验证：
  - 目标消息移除；
  - 发送者联系人记忆清理；
  - 发送者 memoryItem 清理；
  - chat.mem/base/branch legacy 无备注名残留；
  - `memoryContextForCharacter` 的实际上下文中无“阿照”残留；
  - 同群其它角色数据不被误删。

## 5. 微信图片模块证据

截图：

- `docs/testing/round121-phone-image-branch.png`
- `docs/testing/round121-phone-image-branch-hidden-zip.png`

真机 JSON：

- `docs/testing/round121-phone-image-branch-hidden-zip.json`

关键检查：

```text
menu.hasReroll=true
menu.hasBranch=true
menu.hasDelete=true
rerolled.versions=2
rerolled.oldKept=true
rerolled.active=true
branch.thumbs=2
branch.restores=2
branch.exports=2
branch.deletes=2
restored.version=oldVersion
restored.customPrompt=first phone prompt
restored.active=true
```

真实生成路径中，新图替换消息 URL，旧版本仍保存在 `imageBranch.versions`，图片分支页可由长按菜单进入。

## 6. 隐藏内容模块证据

截图：

- `docs/testing/round121-phone-hidden-content.png`

真机 JSON 关键结果：

```text
hidden.hidden=1
hidden.visible=0
hidden.page=true
hidden.restore=1
unhidden.hidden=false
unhidden.visible=1
```

这证明隐藏项从正常聊天流和 Prompt 集合移除，并且可以从“已隐藏内容”恢复到原位置。

## 7. ZIP + assets 证据

桌面测试：

- `docs/testing/round121-image-branch-hidden-zip-2026-11-07.json`
- `buildZipBackupPackage()` 生成 ZIP；
- `zipExtract()` 读取 38 个条目；
- 存在 `manifest.json`、`assets/images/`、`checksums.json`；
- `parseZipBackup()`、`normalizeBackupPackage()`、`verifyBackupPackage()` 全部通过。

真机测试：

- `docs/testing/round121-phone-image-branch-hidden-zip.json`
- 导出的 ZIP：`70,209,760 bytes`
- 真机路径：`/storage/emulated/0/Download/BS小手机/ROUND121_PHONE_ZIP.zip`
- `saved.native=true`
- 线上 APK 之外，发布候选目录另有 `BS小手机_3.86_Build97_release.zip`。

发布候选 ZIP：

`C:\Users\lenovo\Documents\ChatGPT\各种的\_release_candidate_2026-11-07_Build97\BS小手机_3.86_Build97_release.zip`

- ZIP SHA-256：`462FD691662B9DD0CF45E728CEE277C16E4FB1059A6D00138C89D5C84D636C54`
- 内含 APK、assets/public、manifest.json、checksums.json。

## 8. 全量回归测试

核心断言日志：

`docs/testing/round121-final-core-2026-11-07.log`

23 个脚本全部 PASS：

- 微信消息编辑/手动分支；
- 连续 user 消息组重 roll；
- 独立 turn/reroll/branch 审计；
- Prompt 分层与上下文；
- 旧分支记忆隔离；
- 自动总结分支隔离；
- 混合组生命周期；
- 忘记短文本精确性；
- 跨角色/跨会话反证；
- 群聊双角色、branch legacy、memory IDs；
- QA-385 备注名；
- 图片重 roll/图片分支；
- 隐藏内容恢复；
- ZIP 构建、导入和校验。

全量回归日志：

`docs/testing/round121-final-regression-suite-2026-11-07.log`

PASS：

- R97 亮色 33 桌面 + 33 窄屏；
- R97 暗色 33 桌面 + 33 窄屏；
- R108；
- R109（`bsphone-v97-20261107-r1`）；
- 数据管理 17/17；
- 分组语义 14/14；
- 批次 3 红队修复 13/13。

真机 Debug/CDP 日志：

`docs/testing/round121-phone-debug-suite-final-2026-11-07.log`

10 个真机脚本全部 PASS：

- R117；
- R114；
- 分支切换 UI；
- R101；
- R112；
- R113；
- R119；
- R120；
- R118；
- R121 图片分支/隐藏/ZIP。

## 9. 版本、构建与真机

- 页面：`2026-11-07 · 3.86 · 第 97 轮`
- Android：3.86 / versionCode 97
- 源码 SHA-256：`3E80F5262A071CC1C7B34813D5674FB71863A04B92E6D599A9BB0D1D362E8571`
- Debug APK SHA-256：`3D7594846B25DF5D2FFE42BD14DBEDB20A8CF9249B1367F211506252652A6BA5`
- Release APK SHA-256：`E20B9C297F557CB99CCDA34F358EA72F884FCDD4CBBAE685FD6FB951FF1EEC1B`
- Release 候选：`C:\Users\lenovo\Documents\ChatGPT\各种的\_release_candidate_2026-11-07_Build97\BS小手机_3.86_Build97.apk`
- 设备：OPPO PMK110 / Android 16 / 1272×2772
- 设备内版本和回拉 APK 哈希：与 Release 候选一致
- `firstInstallTime=2026-10-20 23:07:55`
- `ceDataInode=2120975`
- 未执行 `pm clear`
- Release 冷启动：Status ok
- WebView 根节点存在
- 无 FATAL EXCEPTION / ANR
- Release smoke：9/9 PASS

Release smoke 证据：

- `docs/testing/round121-phone-release-final-2026-11-07.json`
- `docs/testing/round121-phone-release-final-logcat-2026-11-07.txt`
- `docs/testing/round121-release-final-home.png`

## 10. GitHub Pages 线上发布证据

- 页面：`https://blkst123.github.io/bsphone/`
- version.json：HTTP 200
- 线上版本：3.86 / 97
- 线上 cacheKey：`bsphone-v97-20261107-r1`
- 线上 APK SHA-256：`E20B9C297F557CB99CCDA34F358EA72F884FCDD4CBBAE685FD6FB951FF1EEC1B`
- 与本地发布 APK 哈希一致
- 线上证据：`docs/testing/round121-online-publish-2026-11-07.json`

## 11. 证据总清单

`docs/testing/round121-evidence-manifest-2026-11-07.json`

- `ok: true`
- 测试 JSON：42 个
- 日志：5 个
- 截图：6 张
- 业务源码提交：`afa3bd405d58dfa42c6eadab69d56faf7189b484`
- 源码哈希：`3E80F5262A071CC1C7B34813D5674FB71863A04B92E6D599A9BB0D1D362E8571`
- Debug/Release APK 哈希已绑定
- cacheKey：`bsphone-v97-20261107-r1`
- 缺失项：0
- 哈希不匹配项：0

## 12. 本轮停止边界

本轮完成的是：

- 微信图片模块；
- 微信隐藏内容模块；
- 数据管理 ZIP + assets 模块；
- GitHub Pages 发布；
- QA-385 备注名修复。

本轮不把其它尚未经过完整验收的 App 或旧审计遗留项冒充为完成。后续如继续推进，仍应按“一个 APP 一个完整功能模块”交付，不能只修一个点就交卷。

## 13. 最终签署

```text
QA-385 群聊备注名摘要：PASS
QA-385 实际 Prompt 无残留：PASS
微信图片重 roll：PASS
微信图片分支：PASS
删除显示 / 已隐藏内容恢复：PASS
ZIP + assets：PASS
ZIP 导入校验：PASS
原生大 ZIP 分块写入：PASS
核心断言 23/23：PASS
全量回归 7/7：PASS
真机 Debug/CDP 10/10：PASS
Release smoke 9/9：PASS
GitHub Pages 线上发布：PASS
```

**本轮最终判定：PASS（上述模块范围）。**