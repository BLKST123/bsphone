# BS 小手机 STATE

## 当前版本

- 页面：2026-11-07 · 3.87 · 第 98 轮
- Android：3.87 / versionCode 98
- Service Worker：`bsphone-v98-20261107-r1`
- 源码提交：`8f8a249f83494815311d8eb2cda34e6e6862bec2`
- 源码 SHA-256：`D3F4E538CC226F6361FC0B5DA50D29EF3A8FF36EC067A79D425F2F22DE2CCFB4`
- Debug APK SHA-256：`E88115A380025A404F529B5B291F9FA113CF96BE065FDBDE55D5A30288B0D21E`
- Release APK SHA-256：`9434AAD1E1ABE37EE127B4250A39B51F3DA3EA7CDFC9529FF508731563B9C513`
- Release ZIP SHA-256：`F7AF762E2F7AB2CDA68174E7669319A94D4CF8F09C1C4256380F3176ECFF3D94`

## 当前阶段

- 连续 user 消息组整组重 roll 已完成打回重修。
- 真实 `pushMsg/sendText` 新消息即时生成 `turnId/messageGroupId`。
- core-store append 增加底层元数据兜底。
- 分支切换先更新 `activeBranchId`，再保存完整 `turnBranches` 与消息。
- 环境时间改为 system 环境块，最后一条 user 只包含真实输入。
- 旧分支自动摘要和结构化记忆已按当前消息来源隔离；切回旧分支会恢复对应记忆。
- 记忆块已移到历史之后、环境之前；重 roll nudge 已拆为独立本轮指令层。
- 缓存键已更新为 `bsphone-v98-20261107-r1`，并重新构建 Debug/Release APK。
- QA-382 返修：忘记这条跨 contact/base snapshot/branch legacy/分支记忆 ID/memoryEntries/Prompt 清理。
- 普通删除同步当前 active branch 快照；分支菜单补齐导出与二次确认删除。
- 混合文字+图片/卡片组支持保留或移除后编辑/重生成，卡片不进入文字模型。
- 44×44 命中区已加稳定边界，R101 复跑 44.0089。
- QA-383：忘记记忆改为当前 chat/char 作用域 + sourceMessageIds 精确关联；短文本仅精确/已知摘要壳匹配，禁止全局子串删除。
- 混合组保留模式保持非文本卡片原始相对位置；R113 测试统一 0.01 容差。
- QA-384：群聊忘记严格按消息发送者 m.from 清理；同群其它角色长期记忆、memoryItem、memoryEntry、chat/base/branch legacy 和 memory IDs 保留。
- QA-385：群聊摘要识别 contactDisplayName/remark；备注名摘要与 Prompt 无残留。
- 微信“我的”完整模块：用户人设库、钱包账单、银行卡卡包、资产、表情分组、收藏分类查询与原会话跳转全部为全屏页面并持久化。
- 人设删除前检查会话/情侣空间/外卖地址/小说引用，被引用时阻止删除；启用人设同步微信我的资料和头像。
- 卡包支持多卡叠放、详情账单、上移下移与长按拖动排序；卡号按 4 位分组输入，并且只展示尾号。
- 银行卡解绑使用二次确认；解绑只移除卡面，历史账单保留原银行/尾号并标记“已解绑”，正在使用该卡的外卖支付安全降级为零钱。
- 钱包保留“调整零钱余额”能力；调整写入独立 adjustment 账单，不计入收入/支出统计。
- 银行卡账单不改动零钱余额；卡片支付与零钱账单分开归属。
- 微信图片角色消息支持重 roll、提示词编辑、AI 编写、本次参考图、图片分支、恢复/导出/删除。
- 删除显示进入 hiddenFromChat，已隐藏内容全屏页支持原位恢复，隐藏项不进入 Prompt。
- 数据管理新增 ZIP + assets 发布级归档；原生桥支持分块写入大 ZIP。
- 微信消息菜单已补齐：编辑并重新生成、从当前消息创建新分支、角色消息忘记。
- 编辑后生成新 user message_id，旧 user/char/后续进入旧分支；手动分支不调用模型。
- 菜单按钮命中区统一达到 44×44；角色忘记进入记忆、上下文和分支快照清理流程。
- 桌面独立复检、真机实际 touchstart 后等待 520ms（覆盖 450ms 阈值）的长按、导出、分组、数据管理全部通过。
- 真机 Debug 验证后已用 `adb install -r` 覆盖安装回 Release；设备内 APK 回拉哈希与发布候选一致，应用数据保留。
- GitHub Pages 已发布到 main，线上 version/cacheKey/APK 哈希已验证为 3.87 / Build98；Pages build 1348685543 为 built。

## 交付硬门槛

- 每次改动后必须进行真机巡检，并保留截图、设备状态和日志证据。
- 真机使用 `adb install -r` 覆盖安装，禁止 `pm clear`。
- 若使用 Debug/CDP 做真机测试，结束前必须覆盖安装回最终 Release，并核对设备内 APK 哈希。
- 每次交付红队和检查官的报告必须包含：设备、版本、哈希、断言结果、真机路径、日志和未完成边界。

## 尚未完成
- 本轮请求的图片重 roll、图片分支、隐藏内容恢复、ZIP + assets、GitHub Pages 线上发布均已完成。
- 其它未经本轮完整审计的 App 模块不自动视为完成。


## 最近证据

- `docs/testing/round122-evidence-manifest-2026-11-07.json`
- `docs/testing/round122-online-publish-2026-11-07.json`
- `docs/testing/round122-release-package-audit-2026-11-07.json`
- `docs/testing/independent-card-unbind-wallet-adjust-2026-11-07.json`
- `docs/testing/round122-final-core-2026-11-07.log`
- `docs/testing/round122-final-regression-suite-2026-11-07.log`
- `docs/testing/round122-phone-debug-suite-final-2026-11-07.log`
- `docs/testing/qa-forget-group-remark-scope-2026-11-07.json`
- `docs/testing/round121-image-branch-hidden-zip-2026-11-07.json`
- `docs/testing/round122-phone-wechat-mine-suite.json`
- `docs/testing/round122-phone-cards.png`
- `docs/testing/round122-phone-persona.png`
- `docs/testing/round121-phone-image-branch-hidden-zip.json`
- `docs/testing/round121-phone-image-branch.png`
- `docs/testing/round121-phone-hidden-content.png`
- `docs/testing/round122-phone-release-final-2026-11-07.json`
- `docs/testing/round122-release-final-home.png`
- `docs/testing/build98-native-build-2026-11-07.log`









