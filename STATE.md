# BS 小手机 STATE

## 当前版本

- 页面：2026-11-05 · 3.81 · 第 92 轮
- Android：3.81 / versionCode 92
- Service Worker：`bsphone-v92-20261105-r2`
- 源码提交：`fa358f461d2f87f858ccef4174a063bc1f2b434b`
- 源码 SHA-256：`5099E7921F441F402E096296A131A289D5F66691AED7A5AC722D1130666034ED`
- Debug APK SHA-256：`A5DFFDB099B96C6DF2BB796DD0DB54CBD2237394AD56564AFDDBE53D943FBC63`
- Release APK SHA-256：`6016BD519FEC58BA6F49E80BBE83D558385C909AB53BB20212F95A0A7BB4C95A`

## 当前阶段

- 连续 user 消息组整组重 roll 已完成打回重修。
- 真实 `pushMsg/sendText` 新消息即时生成 `turnId/messageGroupId`。
- core-store append 增加底层元数据兜底。
- 分支切换先更新 `activeBranchId`，再保存完整 `turnBranches` 与消息。
- 环境时间改为 system 环境块，最后一条 user 只包含真实输入。
- 旧分支自动摘要和结构化记忆已按当前消息来源隔离；切回旧分支会恢复对应记忆。
- 记忆块已移到历史之后、环境之前；重 roll nudge 已拆为独立本轮指令层。
- 缓存键升级为 r2，并重新构建 Debug/Release APK。
- 桌面独立复检、真机实际 touchstart 后等待 520ms（覆盖 450ms 阈值）的长按、导出、分组、数据管理全部通过。
- 真机 Debug 验证后已用 `adb install -r` 覆盖安装回 Release；设备内 APK 回拉哈希与发布候选一致，应用数据保留。

## 交付硬门槛

- 每次改动后必须进行真机巡检，并保留截图、设备状态和日志证据。
- 真机使用 `adb install -r` 覆盖安装，禁止 `pm clear`。
- 若使用 Debug/CDP 做真机测试，结束前必须覆盖安装回最终 Release，并核对设备内 APK 哈希。
- 每次交付红队和检查官的报告必须包含：设备、版本、哈希、断言结果、真机路径、日志和未完成边界。

## 尚未完成

- 编辑并重新生成
- 从任意节点手动创建分支
- 图片消息重 roll / 图片分支
- 已隐藏内容恢复页
- ZIP + assets 发布级归档
- GitHub Pages 线上发布

## 最近证据

- `docs/testing/independent-turn-reroll-audit-2026-11-05.json`
- `docs/testing/independent-turn-branch-switch-audit-2026-11-05.json`
- `docs/testing/qa-turn-reroll-independent-2026-11-05.json`
- `docs/testing/qa-turn-branch-switch-ui-2026-11-05.json`
- `docs/testing/qa-turn-reroll-multi-2026-11-05.json`
- `docs/testing/round114-phone-turn-reroll.json`
- `docs/testing/round115-phone-release-final-2026-11-05.json`
- `docs/testing/round115-phone-release-final-logcat-2026-11-05.txt`
- `docs/testing/build92-r2-native-build-2026-11-05.log`
- `docs/testing/qa-turn-auto-memory-branch-fix-2026-11-05.json`
- `docs/testing/qa-prompt-layers-2026-11-05.json`
- `docs/testing/round116-final-core-assertions-2026-11-05.log`
- `docs/testing/round116-final-regression-suite-2026-11-05.log`
- `docs/testing/round116-phone-debug-suite-final-2026-11-05.log`
- `docs/testing/round116-evidence-manifest-2026-11-05.json`