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
- Build93 使用 Service Worker 缓存键 `bsphone-v93-20261106-r1`。
- 编辑并重新生成必须创建新的 user message_id，旧 user/char/后续消息进入旧分支；turnId 不增加。
- 从这里创建新分支保留到当前 user 消息，当前气泡之后的内容进入旧分支；该操作不调用模型。
- 角色消息“忘记这条”必须两次确认，并清理当前聊天、分支快照、来源记忆与记忆游标；订单/相册/收藏实体不自动删除。

## CURRENT

- 消息级 turn/group 归属由 `pushMsg` 与 `core-store.appendMessage(s)` 双重兜底。
- 聊天分支快照存放于 `chat.turnBranches[turnId]`，随 chats 进入备份。
- turn branch 可选保存 `memoryItemIds` 与 `legacyMemItems`，旧数据在使用时安全补齐。
- 连续组整组重 roll 仅支持纯文本组；非文本组不调用文本模型。