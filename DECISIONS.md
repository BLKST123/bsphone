# BS 小手机 DECISIONS

## LOCKED

- 默认分组与自定义分组都是全局标签集合，可跨 user 人设、跨世界线。
- 分组元数据全局一份；上下文隔离只发生在打开会话之后。
- 正式发布保留 ZIP + assets；数据管理页同时必须支持 JSON 全量/轻量导出和导入。
- 新消息必须在追加时生成 `turnId/messageGroupId`，不能依赖启动时 `fixAll()`。
- 分支切换必须先更新目标 `activeBranchId`，再保存消息与完整 `turnBranches` 映射。
- 动态时间只能进入 system 环境块，最后一条 user 消息只包含用户真实输入。
- 生成失败必须保持原消息和原分支快照不变。

## CURRENT

- 消息级 turn/group 归属由 `pushMsg` 与 `core-store.appendMessage(s)` 双重兜底。
- 聊天分支快照存放于 `chat.turnBranches[turnId]`，随 chats 进入备份。
- 连续组整组重 roll 仅支持纯文本组；非文本组不调用文本模型。