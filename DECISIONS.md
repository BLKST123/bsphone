# BS 小手机 DECISIONS

## LOCKED

- 默认分组与自定义分组都是全局标签集合，可跨 user 人设、跨世界线。
- 分组元数据全局一份；上下文隔离只发生在打开会话之后。
- 正式发布保留 ZIP + assets；数据管理页同时必须支持 JSON 全量/轻量导出和导入。
- 新消息必须在追加时生成 `turnId/messageGroupId`，不能依赖启动时 `fixAll()`。
- 分支切换必须先更新目标 `activeBranchId`，再保存消息与完整 `turnBranches` 映射。
- 动态时间只能进入 system 环境块，最后一条 user 消息只包含用户真实输入。
- 生成失败必须保持原消息和原分支快照不变。
- 自动总结记忆只在 `sourceMessageIds` 全部仍处于当前消息路径时注入；无来源旧摘要由 turn branch 的快照隔离。
- 手动、核心、用户已修正记忆保持跨分支可用；旧分支自动记忆只在对应旧分支激活时恢复。
- Prompt 固定顺序：stable → semi → history → memory → 本轮指令 → environment → final user。
- 重 roll nudge 不得写入 semi；记忆不得伪装成 user。
- Build98 使用 Service Worker 缓存键 `bsphone-v98-20261107-r1`。
- 编辑并重新生成必须创建新的 user message_id，旧 user/char/后续消息进入旧分支；turnId 不增加。
- 从这里创建新分支保留到当前 user 消息，当前气泡之后的内容进入旧分支；该操作不调用模型。
- 角色消息“忘记这条”必须两次确认，并按当前 chat/char 作用域清理当前聊天、分支快照、contact long-term memories、baseMemorySnapshot、branch legacy/memory ids、memoryEntries、chat digest 和记忆游标；订单/相册/收藏实体不自动删除。
- 忘记匹配优先使用 sourceMessageIds；无来源摘要只能规范化完全相等或匹配明确的“摘要/快照/记忆/记得/事实/设定”前缀壳，禁止对短文本做任意子串扫描。
- 角色消息忘记的作用域以消息发送者 `m.from` 为准；群聊不得把全部成员当作同一清理对象，同群其它角色记忆必须保留。
- 微信“我的”是完整模块：用户人设库、钱包、卡包、资产、表情、收藏都要全屏并可持久化。
- 切换启用用户人设只影响新建会话和非聊天场景；已有会话绑定不得被全局切换改写。
- 删除被会话、情侣空间、外卖地址或小说引用的人设必须阻止并列出引用。
- 银行卡卡包使用堆叠卡面、尾号展示、排序和账单入口；不得连接真实支付接口。
- 银行卡解绑必须二次确认；历史账单不得随卡面删除，需保留银行名/尾号并标记“已解绑”；引用该卡的支付方式安全降级为零钱。
- 钱包“调整余额”写入独立 adjustment 账单，不计入收入/支出；银行卡账单不改变零钱余额。
- 卡号输入按 4 位分组，列表和卡面只显示尾号。
- 卡包长按拖动必须使用指针捕获，保证触屏和鼠标拖动都能稳定排序。
- 收藏按消息/图片/链接/订单/位置/小说分类，支持搜索、取消和回到原会话。
- 群聊摘要归属必须使用 `contactDisplayName`/remark 以及原名，不能只看 name/displayName。
- 图片重 roll 必须在提示词编辑页确认后生成；新图替换原位，旧图进入图片分支，旧版本不可被静默覆盖。
- 图片分支是独立全屏列表，支持恢复、导出、删除；正常聊天流不显示版本号。
- 删除显示使用 `hiddenFromChat`，不进入 Prompt，可在聊天设置的已隐藏内容全屏页原位恢复。
- 正式发布同时保留 ZIP + assets；ZIP 必须含 manifest、data、assets、checksums，原生保存必须支持分块写入。
- 普通删除必须同步当前 active branch snapshot，不得让分支预览或切换复活已删除消息。
- 分支菜单必须提供导出和二次确认删除；当前 active 分支不能直接删除，必须先切换。
- 混合文字+图片/卡片组必须提供“保留”或“从新分支移除”选择；卡片不进入文字模型，保留模式下必须维持卡片原有相对位置。
- 44×44 验收使用稳定像素边界，不接受以浮点抖动为由降低标准。

## CURRENT

- 消息级 turn/group 归属由 `pushMsg` 与 `core-store.appendMessage(s)` 双重兜底。
- 聊天分支快照存放于 `chat.turnBranches[turnId]`，随 chats 进入备份。
- turn branch 可选保存 `memoryItemIds` 与 `legacyMemItems`，旧数据在使用时安全补齐。
- 连续组整组重 roll 仅支持纯文本组；非文本组不调用文本模型。


