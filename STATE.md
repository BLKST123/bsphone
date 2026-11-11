# BS 小手机 STATE

## 当前版本

- 页面：2026-11-11 · 3.97 · 第 108 轮
- Android：3.97 / versionCode 108
- Service Worker：bsphone-v108-20261111-r1
- 源码提交：本轮本地验收候选（待提交）
- 源码 SHA-256：EEF7186E58A3F38FBDA4DC1144B2759687E264AE3EE577F509DE11FF7243C43A
- Release APK SHA-256：AF816A20A8A26D739E0F11BD9E23BB5F189665DE12638AAC68A954CF6A2AC601
- Release ZIP SHA-256：848C11AD251512BD6355381F9FDD756B055BDA1F73719F87EBE28D079D297E0B

## 当前阶段
- 3.97 / Build108 完成第三轮卡片语义返修：主金额与手续费/运费/优惠/备注分句隔离；礼貌句、独立未来备注、已下单口语正例保留；未来承诺和条件反问继续回退纯文本。
- 使用主应用同包名同签名覆盖更新，未清主应用数据；合成数据卡片测试在主机浏览器执行，真机完成 Release 安装、版本、前台 Activity、APK hash 与 logcat 验收。
- 全量回归 26/26、微信历史分支 10/10；ZIP 17 entries、checksums 名称集合一致、反斜杠 0。
- 当前公开仓库继续使用干净树；私密词表扫描 0 命中。

- 3.90 / Build101 接入用户导出的 6 页桌面布局（JSON SHA-256 `ADB02DD949E3DBC7A1551CB4F981546BA1086C445E210B813E7C36717D87C167`）：4 列、80px 单元格、10px 间距、20px 左右安全边距、60px App 图标。
- 桌面内容改为 `DB.ui.userDesktopLayout` 独立数据；全部 18 个 App 已入布局，6 页无重叠、无越界。
- 新增相片三图直角拍立得框、2×2 图片卡、音乐播放、人物资料、拍立得文件夹、2×2 月历、书架、清单、摘录、三图拼贴等真实卡片。
- 卡片点击打开编辑页；标题、正文、日期/时间、图片、拍立得框颜色/图案/小字可修改并持久化。
- 桌面渲染保留旧 L7 代码作为回退，不改 core-store / readonly-store / 钱包 / 聊天业务数据流。


- 连续 user 消息组整组重 roll 已完成打回重修。
- 真实 `pushMsg/sendText` 新消息即时生成 `turnId/messageGroupId`。
- core-store append 增加底层元数据兜底。
- 分支切换先更新 `activeBranchId`，再保存完整 `turnBranches` 与消息。
- 环境时间改为 system 环境块，最后一条 user 只包含真实输入。
- 旧分支自动摘要和结构化记忆已按当前消息来源隔离；切回旧分支会恢复对应记忆。
- 记忆块已移到历史之后、环境之前；重 roll nudge 已拆为独立本轮指令层。
- 缓存键已更新为 `bsphone-v99-20261107-r1`，并重新构建 Debug/Release APK。
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
- 卡包支持多卡叠放、点击卡片在当前位置内联查看账单、点击账单行继续内联展开详情，并通过长按卡片上下拖动排序；不设置独立的账单详情按钮或页面；卡号按 4 位分组输入，并且只展示尾号。
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
- GitHub Pages 已发布 3.88 / Build99；部署 7622185887 为 success，线上 version/cacheKey/APK 哈希均已核验。

## 交付硬门槛

- 每次改动后必须进行真机巡检，并保留截图、设备状态和日志证据。
- 真机使用 `adb install -r` 覆盖安装，禁止 `pm clear`。
- 若使用 Debug/CDP 做真机测试，结束前必须覆盖安装回最终 Release，并核对设备内 APK 哈希。
- 每次交付红队和检查官的报告必须包含：设备、版本、哈希、断言结果、真机路径、日志和未完成边界。

## 尚未完成
- 微信“我的”与卡包返修范围已完成本地、桌面、真机、Release 和 Build99 线上发布验收。
- 其它未经本轮完整审计的 App 模块不自动视为完成。


## 最近证据

- `docs/testing/round143-full-regression-2026-11-11.log`
- `docs/testing/round143-wechat-branch-regression-2026-11-11.log`
- `docs/testing/round143-card-context.json`
- `docs/testing/round143-installed-release-audit.json`
- `docs/testing/round143-release-logcat-summary.json`
- `docs/testing/round143-zip-verify.json`

- `docs/testing/round142-full-regression-2026-11-11.log`
- `docs/testing/round142-wechat-branch-regression-2026-11-11.log`
- `docs/testing/round142-card-intent.json`
- `docs/testing/round142-phone-wechat-audit.json`
- `docs/testing/round142-phone-concurrency.json`
- `docs/testing/round142-installed-release-audit.json`
- `docs/testing/round142-zip-verify.json`

- `docs/testing/round141-full-regression-2026-11-10.log`
- `docs/testing/round141-wechat-branch-regression-2026-11-10.log`
- `docs/testing/round141-card-safety-2026-11-10.json`
- `docs/testing/round141-phone-wechat-audit.json`
- `docs/testing/round141-phone-concurrency.json`
- `docs/testing/round141-installed-release-audit.json`
- `docs/testing/round141-zip-verify.json`\n- `docs/testing/round141-online-publish.json`\n- `docs/testing/round141-privacy-audit.json`\n- `docs/testing/round141-evidence-manifest.json`

- `docs/testing/round140-full-regression-2026-11-10.log`
- `docs/testing/round140-wechat-branch-regression-2026-11-10.log`
- `docs/testing/round140-wechat-module-fix.json`
- `docs/testing/round140-widget-geometry.json`
- `docs/testing/round140-card-theme.json`
- `docs/testing/round140-gallery-wallpaper.json`
- `docs/testing/round140-phone-wechat-audit.json`
- `docs/testing/round140-phone-logcat-summary.json`
- `docs/testing/round140-installed-release-audit.json`
- `docs/testing/round140-zip-verify.json`

- `docs/testing/round139-appearance-regression-2026-11-09.log`
- `docs/testing/round139-full-regression-2026-11-09.log`
- `docs/testing/round139-all-app-preview.json`
- `docs/testing/round139-internal-app-pages.json`
- `docs/testing/round139-widget-background-all-types.json`
- `docs/testing/round139-widget-add-live.json`
- `docs/testing/round139-phone-appearance-audit.json`
- `docs/testing/round139-phone-widget-background-editor.png`
- `docs/testing/round139-installed-release-audit.json`
- `docs/testing/round139-zip-verify.json`

- `docs/testing/round123-evidence-manifest-2026-11-07.json`
- `docs/testing/round123-online-publish-2026-11-07.json`
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











## 2026-11-09 / 3.93 Build104 外观真实预览与组件底图
- 外观主页面是整屏长页面；设置卡片延伸至页面底部主题操作区，不存在卡片内纵向滚动。
- 恢复默认主题固定在实时预览区右下角；页标右侧只保留深色模式。
- App 背景与 APP内精修的预览必须调用真实 App 渲染函数，禁止手绘或另写一套 UI。
- 微信内页保留消息、联系人、朋友圈、我的；小说保留 7 个真实页面；微博、查岗、情侣空间按实际 App Tab 排列。
- 组件卡底图由 udCardHTML 统一附加 ud-has-bg 和 --ud-bg-image，使用独立 ::before 图层避免被各卡型材质背景覆盖。
- 清单、摘录、小记、月历、书架、相片三图、音乐播放、图片卡、大图等 14 种类型全部通过底图渲染与持久化断言。
- 本轮未修改 core/store、readonly-store、sysworld-v2、聊天、钱包或人设绑定数据流。


## 2026-11-10 / 3.94 Build105 微信完整模块与组件卡底图回归
- 角色结构化卡片使用独立标记解析：红包、转账、外卖、订单；外卖卡片会生成本地角色订单实体，订单卡片保持聊天快照。
- 离开聊天页不再中止 char 生成请求；返回列表或桌面后回复仍会落库并生成未读/通知。
- 重生成等长操作使用三秒临时忙碌提示；生成中私聊标题固定显示“对方正在输入……”。
- 会话标题优先级：显式会话名 > char 备注 > char 名字；自动“会话 N”不算显式名称。
- 用户人设库主页使用右侧启用图标，点击卡片进入编辑；启用人设后微信“我的”卡包数量即时刷新。
- 收藏语音显示波形/时长；右上角更多菜单承载回到原会话和取消收藏，取消收藏二次确认；跳转定位到原消息。
- 聊天更多菜单分为六组，全部原按钮保留，所有菜单按钮命中区至少 44px。
- 单会话壁纸从相册或上传都按当前聊天视口比例裁切后以 100%×100% 显示，避免二次放大模糊。
- 语音/视频通话仅为后续功能预留的真实感页面壳，不接实时媒体或 AI 视频。
- 组件卡背景为最后一个绝对定位子元素，禁止插入为第一个子元素破坏 nth-child 排版。
- `docs/testing/round140-online-publish.json`


## 2026-11-10 / 3.95 Build106 红队与检查官返修
- 同一会话新请求接管旧请求、A/B 会话并发生成时，输入状态按当前会话的活动请求集合同步，旧请求结束不得清除新请求标题。
- 自然语言结构化卡片兜底必须优先排除过去时、已收到、已送达、配送状态、第三人称、否定与劝阻语句。
- 红包、转账、外卖、订单只接受有限正金额；零金额、负数、NaN、Infinity、缺金额一律回退纯文本。
- 外卖非法金额不得调用 takeoutCreateOrder；订单非法金额不得生成业务快照。
- 公开证据只允许合成示例数据；旧敏感截图必须从工作区和 Git 历史移除。
- 真机 QA 脚本必须显式设置前置人设并在结束时恢复，不能依赖设备上次状态。
- 版本固定为 3.95 / Build106，Service Worker 缓存键固定为 bsphone-v106-20261110-r1。



## 2026-11-11 / 3.96 Build107 第二轮返修
- 自然语言金额必须按货币标记、元/块单位和分句上下文识别；订单号、编号、尾号、预计分钟、日期时间不得作为金额。
- 未来、意愿、条件、反事实、征求意见句不得生成红包/转账/外卖卡片，也不得创建本地订单实体。
- “收下”只在缺少明确动作过去时的情况下允许正例；“不要香菜”等备注不得阻断已经完成的下单动作。
- 并发测试使用活动请求轮询，不依赖固定 sleep。
- Release ZIP 内条目和 checksums 使用同一组正斜杠原始名称。
- 公开仓库使用干净树重建，旧公开 commit 不再作为交付历史保留。


## 2026-11-11 / 3.97 Build108 第三轮卡片语义返修
- 金额候选必须区分主金额与手续费、配送费、服务费、运费、优惠、折扣、备注等辅助金额；辅助金额不得覆盖主金额。
- 未来词只在动作分句内阻断；独立备注分句中的“下次/明天”不得否定已经完成的发送或下单动作。
- “不好意思/不用客气”等礼貌前缀不得误伤后续正向动作。
- 订单意图接受“我给你下单了”等无字面“订单”的口语表达。
- 最终 Release 直接覆盖主应用安装，不清理用户数据；不重复安装独立 QA 包。
