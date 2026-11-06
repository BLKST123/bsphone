# BS 小手机 STATE

## 当前版本

- 页面：2026-11-06 · 3.82 · 第 93 轮
- Android：3.82 / versionCode 93
- Service Worker：`bsphone-v93-20261106-r1`
- 源码提交：`3926a366fcae9169d665bd0a87131cf45096c21a`
- 源码 SHA-256：`B29BFD700BF6345E59A63295D388309B843F3087B60FFAAD27E3AEC33701D439`
- Debug APK SHA-256：`27A66E50AB80B9A18883A986800F2FE8003C882BE726CAF99C53493449661798`
- Release APK SHA-256：`8A1A61FD57941A3DA9226A213CA22ABAF0E15B3DC9E859DC8F6BF09CAA765EBA`

## 当前阶段

- 连续 user 消息组整组重 roll 已完成打回重修。
- 真实 `pushMsg/sendText` 新消息即时生成 `turnId/messageGroupId`。
- core-store append 增加底层元数据兜底。
- 分支切换先更新 `activeBranchId`，再保存完整 `turnBranches` 与消息。
- 环境时间改为 system 环境块，最后一条 user 只包含真实输入。
- 旧分支自动摘要和结构化记忆已按当前消息来源隔离；切回旧分支会恢复对应记忆。
- 记忆块已移到历史之后、环境之前；重 roll nudge 已拆为独立本轮指令层。
- 缓存键升级为 r3，并重新构建 Debug/Release APK。
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

- `docs/testing/round117-evidence-manifest-2026-11-06.json`
- `docs/testing/qa-wechat-message-edit-branch-2026-11-06.json`
- `docs/testing/round117-phone-wechat-message-edit-branch.json`
- `docs/testing/round117-final-core-assertions-2026-11-06.log`
- `docs/testing/round117-final-regression-suite-2026-11-06.log`
- `docs/testing/round117-phone-debug-suite-final-2026-11-06.log`
- `docs/testing/build93-native-build-2026-11-06.log`
- `docs/testing/round115-phone-release-final-2026-11-05.json`
- `docs/testing/round115-phone-release-final-logcat-2026-11-05.txt`
