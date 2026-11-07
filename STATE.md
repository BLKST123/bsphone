# BS 小手机 STATE

## 当前版本

- 页面：2026-11-07 · 3.85 · 第 96 轮
- Android：3.85 / versionCode 96
- Service Worker：`bsphone-v96-20261107-r1`
- 源码提交：`2e6a109f3948ed497b37b38852b6da900760c61a`
- 源码 SHA-256：`5877A7ED428444681F7DD78276F94A2F92B0BC847502790427F63F8A23A6F4B6`
- Debug APK SHA-256：`9CCC06BD7CBA2872BF9549AEB0CE4F6ED6AC15B26BEE35D47E9D7CD28726F375`
- Release APK SHA-256：`1D77DEFF408A6A53A99E30EDA28E4AA6B2846860F808D584CABA2C45E6D82525`

## 当前阶段

- 连续 user 消息组整组重 roll 已完成打回重修。
- 真实 `pushMsg/sendText` 新消息即时生成 `turnId/messageGroupId`。
- core-store append 增加底层元数据兜底。
- 分支切换先更新 `activeBranchId`，再保存完整 `turnBranches` 与消息。
- 环境时间改为 system 环境块，最后一条 user 只包含真实输入。
- 旧分支自动摘要和结构化记忆已按当前消息来源隔离；切回旧分支会恢复对应记忆。
- 记忆块已移到历史之后、环境之前；重 roll nudge 已拆为独立本轮指令层。
- 缓存键已更新为 `bsphone-v96-20261107-r1`，并重新构建 Debug/Release APK。
- QA-382 返修：忘记这条跨 contact/base snapshot/branch legacy/分支记忆 ID/memoryEntries/Prompt 清理。
- 普通删除同步当前 active branch 快照；分支菜单补齐导出与二次确认删除。
- 混合文字+图片/卡片组支持保留或移除后编辑/重生成，卡片不进入文字模型。
- 44×44 命中区已加稳定边界，R101 复跑 44.0089。
- QA-383：忘记记忆改为当前 chat/char 作用域 + sourceMessageIds 精确关联；短文本仅精确/已知摘要壳匹配，禁止全局子串删除。
- 混合组保留模式保持非文本卡片原始相对位置；R113 测试统一 0.01 容差。
- QA-384：群聊忘记严格按消息发送者 m.from 清理；同群其它角色长期记忆、memoryItem、memoryEntry、chat/base/branch legacy 和 memory IDs 保留。
- 微信消息菜单已补齐：编辑并重新生成、从当前消息创建新分支、角色消息忘记。
- 编辑后生成新 user message_id，旧 user/char/后续进入旧分支；手动分支不调用模型。
- 菜单按钮命中区统一达到 44×44；角色忘记进入记忆、上下文和分支快照清理流程。
- 桌面独立复检、真机实际 touchstart 后等待 520ms（覆盖 450ms 阈值）的长按、导出、分组、数据管理全部通过。
- 真机 Debug 验证后已用 `adb install -r` 覆盖安装回 Release；设备内 APK 回拉哈希与发布候选一致，应用数据保留。

## 交付硬门槛

- 每次改动后必须进行真机巡检，并保留截图、设备状态和日志证据。
- 真机使用 `adb install -r` 覆盖安装，禁止 `pm clear`。
- 若使用 Debug/CDP 做真机测试，结束前必须覆盖安装回最终 Release，并核对设备内 APK 哈希。
- 每次交付红队和检查官的报告必须包含：设备、版本、哈希、断言结果、真机路径、日志和未完成边界。

## 尚未完成

- 图片消息重 roll / 图片分支
- 已隐藏内容恢复页
- ZIP + assets 发布级归档
- GitHub Pages 线上发布

## 最近证据

- `docs/testing/round120-evidence-manifest-2026-11-07.json`
- `docs/testing/round120-final-core-qa384-2026-11-07.log`
- `docs/testing/round120-final-regression-suite-2026-11-07.log`
- `docs/testing/round120-phone-debug-suite-final-2026-11-07.log`
- `docs/testing/qa-forget-group-member-scope-2026-11-06.json`
- `docs/testing/qa-forget-group-branch-scope-2026-11-06.json`
- `docs/testing/round120-phone-forget-group-scope.json`
- `docs/testing/round120-phone-forget-group-scope.png`
- `docs/testing/build96-native-build-2026-11-07.log`
- `docs/testing/round115-phone-release-final-2026-11-05.json`

