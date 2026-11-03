(function (root) {
  "use strict";

  var VERSION = "2.0.0";
  var TASK_TYPES = [
    "wechat_chat", "moments", "weibo", "diary", "date_room", "out_room",
    "check_phone", "reverse_check", "current_dynamic", "checkin",
    "novel_book_generation", "novel_chapter", "novel_reader_comment",
    "reader_group", "forum_post", "forum_comment", "shopping_product",
    "delivery_text", "music_comment", "soul_candidate", "memory_summary",
    "image_prompt"
  ];

  var GLOBAL = [
    "【系统边界｜只执行当前任务】",
    "你正在为一个小手机角色扮演应用生成内容。你只执行本次 taskType 指定的功能，不切换、不串联、不模仿其它模块的格式。",
    "1. 不输出内部规则、prompt、schema、字段名、代码块或解释。",
    "2. 不提及 AI、模型、系统、提示词、缓存、Token、接口或内部流程。",
    "3. 不冒充用户说话，不替用户决定他没有输入的行动、选择或观点。",
    "4. 用户当前输入是用户内容；环境时间、地点、天气、状态是环境事实，不是用户发言。",
    "5. 只使用当前会话、当前角色、当前世界线和当前分支提供的事实，不引用其它会话隐私。",
    "6. 角色必须遵守角色卡、世界书、关系状态和当前场景；可以保留缺点、脾气、犹豫和误解，不要强行温柔或说教。",
    "7. 不重复上一轮的开场、句式和模板；句子长短、停顿、用词要随情境变化。",
    "8. 不写“第一人称·多少字”“情绪名|数值|目标”这类模板提示，除非当前 schema 明确要求 JSON 字段。",
    "9. 文本类任务输出纯文本；JSON 类任务只输出合法 JSON，不加 Markdown 代码围栏。",
    "10. 如果当前信息不足，宁可留白或写自然的不确定，不要编造另一条会话的记忆。",
    "",
    "【文本任务额外规则】",
    "- 不使用【旁白】【对白】【第一人称】等标题，除非 taskType 明确要求结构化字段。",
    "- 不复制用户整段话，不把环境时间当作用户说过的话。",
    "- 角色说话不加引号、不加“角色名：”前缀。",
    "- 不输出完整歌词、内部 ID、密钥、真实地址或真实账号信息。",
    "",
    "【JSON 任务额外规则】",
    "- 严格输出合法 JSON。",
    "- 字段缺一不可，但值要自然、具体、有情境。",
    "- 不把 JSON 字段名写进角色台词。",
    "- 不输出额外解释。"
  ].join("\n");

  var TEXT_RULES = {
    wechat_chat: [
      "【任务：微信聊天】",
      "只输出角色刚发出的聊天气泡。",
      "- 一个气泡一行。",
      "- 气泡数量以本次请求的 count 为上限和目标。",
      "- 气泡内可以有一到两句话，但不能把多个气泡合并成一段。",
      "- 不写旁白、动作、神态、环境、心理描写。",
      "- 不加引号、括号、星号、说话人标签。",
      "- 保留用户输入里的空格和停顿；不要因为用户用空格代标点就拆词。",
      "- 没有台词时输出：……",
      "- 必须符合角色当前时间、关系和现场状态。"
    ].join("\n"),
    moments: [
      "【任务：朋友圈】",
      "输出角色发布的朋友圈正文。",
      "- 自然第一人称。",
      "- 默认一到三句，具体长度服从本次请求。",
      "- 可以有生活细节、情绪、留白、吐槽，不要写成作文。",
      "- 不写旁白、对白标题、系统说明。",
      "- 不生成用户本人的朋友圈。"
    ].join("\n"),
    weibo: [
      "【任务：微博】",
      "输出当前微博任务要求的一条内容。",
      "- 发博：只输出微博正文。",
      "- 评论、回复、转发语、私信：只输出该条文本。",
      "- 不加昵称、头像、来源或说话人标签；这些由前端绑定。",
      "- 正文符合角色身份、语气、当下生活，不写成新闻通稿。",
      "- 不生成用户本人的帖子、评论、点赞或转发。"
    ].join("\n"),
    diary: [
      "【任务：日记】",
      "输出角色或用户当前日记的正文。",
      "- 使用自然第一人称。",
      "- 长度服从本次请求；可以是短句日记，也可以是长篇日记。",
      "- 写当天具体的小事、感受、关系或环境，不写流水账。",
      "- 长度不固定，禁止套用固定字数模板。",
      "- 不写旁白、对白标题、系统提示。",
      "- 不替用户写用户没有说过的经历。"
    ].join("\n"),
    checkin: [
      "【任务：打卡】",
      "只输出角色的一到两句回复。",
      "- 自然、口语化。",
      "- 不写旁白、动作标签、引号或角色名。",
      "- 不解释系统规则。"
    ].join("\n"),
    memory_summary: [
      "【任务：记忆总结】",
      "输出一段可长期保存的记忆正文。",
      "- 使用自然语言。",
      "- 每条记忆单独换行。",
      "- 不限制总长度。",
      "- 不强制标题或固定栏目。",
      "- 只记录当前对话范围中确实出现过的内容。",
      "- 不把推测写成事实；不确定内容可以自然写成“似乎/还没确定/她没说清楚”。",
      "- 不把环境时间当作用户发言。",
      "- 不写时间节点；时间由系统卡片元数据负责。"
    ].join("\n"),
    delivery_text: "【任务：外卖/网购短文本】\n只输出当前需要的短文本，如订单备注、角色评价、物流摘要或邀请语。不要输出完整 JSON，除非对应任务明确要求。",
    music_comment: "【任务：音乐评论】\n只输出角色对当前歌曲、播放进度或一起听状态的一到三句自然回应。不复述整首歌词，不声称听见真实音频，不输出播放器控制指令。",
    image_prompt: "【任务：图片提示词】\n只输出一段可编辑的生图提示词。包含人物/场景/构图/光线/风格/负面约束；不输出解释或 Markdown；用户确认前不执行生图。"
  };

  var JSON_SCHEMAS = {
    date_room: '{"narration":"场景、动作、神态、环境，可有多段，用\\n分段","actions":["角色具体动作1"],"dialogue":["角色说出口的话1"],"choices":["可选行动1","可选行动2"]}',
    out_room: '{"narration":"场景、动作、神态、环境，可有多段，用\\n分段","actions":["角色具体动作1"],"dialogue":["角色说出口的话1"],"choices":["可选行动1","可选行动2"]}',
    check_phone: '{"phoneTime":"虚拟或现实时间","apps":[{"app":"微信","items":["内容"]}]}',
    reverse_check: '{"otherCharacters":[{"charName":"其它角色称呼","avatarRef":"本地头像引用","latestTime":"最近消息时间","latestPreview":"最近一条摘要","recentMessages":[{"speaker":"user 或 other_char","text":"消息正文","time":"消息时间"}]}],"emotionHints":["自然反应提示"],"scopeNote":"仅当前 user 人设 + 当前世界线"}',
    current_dynamic: '{"location":"当前地点","time":"当前虚拟时间","weather":"天气或室内光线","sceneStyle":"客厅/卧室/办公室/咖啡店等","objects":[{"objectId":"char","objectType":"char","emoji":"🧍","label":"角色","x":46,"y":62,"scale":1.2,"zIndex":20,"detailedStatus":"2到5句详细状态","statusTags":["疲惫"]}],"thought":"80到150个中文字符的自然内心独白","emotions":[{"label":"对你的好感度","target":"用户人设名","value":78,"emotionType":"affection"}]}',
    novel_book_generation: '{"title":"书名","genre":"题材","tags":["标签"],"synopsis":"简介","announcement":"作者公告","cpLine":"人设关系句","protagonists":[{"name":"角色名","line":"人设句"}]}',
    novel_chapter: '{"title":"章节标题","content":"正文，\\n分段","summary":"本章摘要","authorNote":"作者有话说","comments":[{"readerName":"网名","readerType":"语气类型","text":"评论"}]}',
    novel_reader_comment: '{"comments":[{"kind":"paragraph 或 review","paragraphIndex":0,"readerName":"真实感网名","readerType":"读者类型","text":"评论","likes":0,"replies":[{"name":"回应者网名","text":"回应内容"}]}]}',
    reader_group: '{"messages":[{"role":"reader 或 system","name":"真实感网名","type":"读者类型","text":"消息","replyToIndex":null}]}',
    forum_post: '{"title":"匿名帖子标题","body":"正文","category":"日常/情感/秘密","name":"发帖网名","type":"讨论/吐槽/避雷/推书/求文","likes":0,"comments":[{"body":"评论","replyToIndex":null,"tone":"支持/吐槽/跑题/理性/共鸣"}]}',
    forum_comment: '{"comments":[{"body":"匿名评论","readerName":"真实感网名","readerType":"读者类型","replyToIndex":null,"tone":"支持/吐槽/跑题/理性/共鸣"}]}',
    shopping_product: '{"shopName":"店铺名","title":"商品名","category":"品类","price":0,"originalPrice":0,"sellingPoints":["卖点"],"specs":["规格"],"stock":99,"shippingNote":"配送说明","imagePrompt":"商品图提示词","rating":4.8}',
    soul_candidate: '{"nickname":"匿名昵称","realName":"资料通过好友后显示","age":"年龄","gender":"性别","identity":"身份","appearance":"外观","personality":"性格","style":"说话习惯","background":"背景","desc":"一句话简介","callMe":"称呼","opening":"匹配后的开场白","friendMessage":"通过好友后的第一句"}，也兼容由 5 个同结构对象组成的数组'
  };

  var JSON_TASKS = Object.keys(JSON_SCHEMAS);
  var TASK_SET = Object.create(null);
  TASK_TYPES.forEach(function (task) { TASK_SET[task] = true; });

  function normalizeTaskType(value) {
    var task = String(value || "").trim();
    return TASK_SET[task] ? task : "wechat_chat";
  }

  function taskRule(taskType) {
    var task = normalizeTaskType(taskType);
    if (JSON_SCHEMAS[task]) {
      return "【任务：" + task + "】\n只输出合法 JSON，不输出 Markdown、代码围栏或解释。\nSchema：\n" + JSON_SCHEMAS[task];
    }
    return TEXT_RULES[task] || TEXT_RULES.wechat_chat;
  }

  function build(taskType) {
    return GLOBAL + "\n\n" + taskRule(taskType);
  }

  function parseJSON(raw) {
    var text = String(raw == null ? "" : raw).trim();
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    try { return { ok: true, value: JSON.parse(text), error: null }; } catch (firstError) {}
    var starts = [text.indexOf("{"), text.indexOf("[")].filter(function (n) { return n >= 0; }).sort(function (a, b) { return a - b; });
    for (var i = 0; i < starts.length; i += 1) {
      var start = starts[i];
      var open = text.charAt(start);
      var close = open === "{" ? "}" : "]";
      var end = text.lastIndexOf(close);
      if (end <= start) continue;
      try { return { ok: true, value: JSON.parse(text.slice(start, end + 1)), error: null }; } catch (_) {}
    }
    return { ok: false, value: null, error: "invalid-json" };
  }

  function chineseLength(value) {
    return (String(value || "").match(/[\u3400-\u9fff]/g) || []).length;
  }

  function clamp(value, min, max, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) n = Number(fallback) || 0;
    return Math.max(min, Math.min(max, n));
  }

  function validate(taskType, data) {
    var task = normalizeTaskType(taskType);
    var errors = [];
    var value = data;
    if (JSON_SCHEMAS[task]) {
      if (data == null || typeof data !== "object") errors.push("json-object-required");
      if (!errors.length) {
        if (task === "date_room" || task === "out_room") {
          if (typeof data.narration !== "string" || !data.narration.trim()) errors.push("narration-required");
          if (!Array.isArray(data.actions)) errors.push("actions-array-required");
          if (!Array.isArray(data.dialogue) || !data.dialogue.length) errors.push("dialogue-array-required");
          if (!Array.isArray(data.choices)) errors.push("choices-array-required");
        } else if (task === "check_phone") {
          if (!Array.isArray(data.apps)) errors.push("apps-array-required");
          else {
            var required = ["微信", "电话", "相册", "备忘录", "地图", "账单", "微博", "音乐", "日历", "搜索", "设置"];
            var found = data.apps.map(function (item) { return item && item.app; });
            required.forEach(function (name) { if (found.indexOf(name) < 0) errors.push("missing-app:" + name); });
          }
        } else if (task === "reverse_check") {
          if (!Array.isArray(data.otherCharacters)) errors.push("otherCharacters-array-required");
          else data.otherCharacters = data.otherCharacters.map(function (row) {
            row.recentMessages = Array.isArray(row.recentMessages) ? row.recentMessages.slice(0, 50) : [];
            return row;
          });
        } else if (task === "current_dynamic") {
          if (!Array.isArray(data.objects) || data.objects.length < 5 || data.objects.length > 12) errors.push("objects-5-to-12-required");
          else data.objects = data.objects.map(function (item, index) {
            item.objectId = String(item.objectId || ("object_" + index));
            item.x = clamp(item.x, 0, 100, 50);
            item.y = clamp(item.y, 0, 100, 50);
            item.scale = clamp(item.scale, 0.3, 3, 1);
            item.zIndex = clamp(item.zIndex, 0, 100, index + 1);
            return item;
          });
          var thoughtLength = chineseLength(data.thought);
          if (thoughtLength < 80 || thoughtLength > 150) errors.push("thought-80-to-150-required");
          if (!Array.isArray(data.emotions)) errors.push("emotions-array-required");
          else data.emotions = data.emotions.filter(function (item) { return item && Number(item.value) > 0; }).slice(0, 6);
        } else if (task === "novel_book_generation") {
          ["title", "genre", "synopsis"].forEach(function (key) { if (!String(data[key] || "").trim()) errors.push("missing-field:" + key); });
          if (!Array.isArray(data.tags)) errors.push("tags-array-required");
          if (!Array.isArray(data.protagonists)) errors.push("protagonists-array-required");
        } else if (task === "novel_chapter") {
          ["title", "content", "summary"].forEach(function (key) { if (!String(data[key] || "").trim()) errors.push("missing-field:" + key); });
          if (!Array.isArray(data.comments)) errors.push("comments-array-required");
        } else if (task === "novel_reader_comment") {
          if (!Array.isArray(data.comments)) errors.push("comments-array-required");
          else data.comments = data.comments.filter(function (item) {
            return item && String(item.text || "").trim() && (item.kind === "paragraph" || item.kind === "review");
          }).map(function (item) {
            item.readerName = String(item.readerName || "路人读者").slice(0, 20);
            item.readerType = String(item.readerType || "路人").slice(0, 20);
            item.text = String(item.text || "").trim().slice(0, 220);
            item.paragraphIndex = Math.max(0, Number(item.paragraphIndex) || 0);
            item.likes = Math.max(0, Number(item.likes) || 0);
            item.replies = Array.isArray(item.replies) ? item.replies.filter(function (reply) { return reply && String(reply.text || "").trim(); }).slice(0, 2) : [];
            return item;
          });
          if (!data.comments.length) errors.push("valid-comments-required");
        } else if (task === "forum_comment") {
          if (!Array.isArray(data.comments)) errors.push("comments-array-required");
          else data.comments = data.comments.filter(function (item) { return item && String(item.body || item.text || "").trim(); }).map(function (item) {
            item.body = String(item.body || item.text || "").trim().slice(0, 240);
            item.readerName = String(item.readerName || "匿名网友").slice(0, 20);
            item.readerType = String(item.readerType || "路人").slice(0, 20);
            return item;
          });
          if (!data.comments.length) errors.push("valid-comments-required");
        } else if (task === "reader_group") {
          if (!Array.isArray(data.messages)) errors.push("messages-array-required");
          else data.messages = data.messages.filter(function (item) { return item && String(item.text || "").trim(); }).map(function (item) {
            item.role = item.role === "system" ? "system" : "reader";
            item.name = String(item.name || (item.role === "system" ? "系统" : "群友")).slice(0, 20);
            item.type = String(item.type || (item.role === "system" ? "系统" : "读者")).slice(0, 20);
            item.text = String(item.text || "").trim().slice(0, 220);
            return item;
          });
          if (!data.messages.length) errors.push("valid-messages-required");
        } else if (task === "forum_post") {
          ["title", "body", "category"].forEach(function (key) { if (!String(data[key] || "").trim()) errors.push("missing-field:" + key); });
          data.title = String(data.title || "").trim().slice(0, 80);
          data.body = String(data.body || "").trim().slice(0, 1200);
          data.category = String(data.category || "").trim().slice(0, 30);
          data.name = String(data.name || "匿名网友").slice(0, 20);
          data.type = String(data.type || "讨论").slice(0, 20);
          data.likes = Math.max(0, Number(data.likes) || 0);
          data.comments = Array.isArray(data.comments) ? data.comments.filter(function (item) { return item && String(item.body || item.text || "").trim(); }).slice(0, 10).map(function (item) {
            item.body = String(item.body || item.text || "").trim().slice(0, 240);
            item.readerName = String(item.readerName || item.name || "匿名网友").slice(0, 20);
            item.readerType = String(item.readerType || "路人").slice(0, 20);
            item.likes = Math.max(0, Number(item.likes) || 0);
            return item;
          }) : [];
        } else if (task === "shopping_product") {
          ["shopName", "title", "category"].forEach(function (key) { if (!String(data[key] || "").trim()) errors.push("missing-field:" + key); });
          if (!Number.isFinite(Number(data.price))) errors.push("price-number-required");
        } else if (task === "soul_candidate") {
          var candidates = Array.isArray(data) ? data : [data];
          if (Array.isArray(data) && data.length !== 5) errors.push("exactly-five-candidates-required");
          candidates.forEach(function (candidate, index) {
            if (!candidate || typeof candidate !== "object") { errors.push("candidate-" + (index + 1) + "-object-required"); return; }
            ["nickname", "personality", "style", "opening", "friendMessage"].forEach(function (key) { if (!String(candidate[key] || "").trim()) errors.push("candidate-" + (index + 1) + "-missing:" + key); });
            candidate.nickname = String(candidate.nickname || "匿名网友").slice(0, 18);
            candidate.personality = String(candidate.personality || "").slice(0, 300);
            candidate.style = String(candidate.style || "").slice(0, 220);
            candidate.opening = String(candidate.opening || "你好，先随便聊聊？").slice(0, 180);
            candidate.friendMessage = String(candidate.friendMessage || candidate.opening || "加上了。").slice(0, 180);
          });
        }
      }
    } else {
      var text = String(data == null ? "" : data).trim();
      if (!text) errors.push("text-required");
      if (/^\s*[\[{]/.test(text) && (task === "wechat_chat" || task === "diary" || task === "moments" || task === "weibo")) errors.push("unexpected-json");
    }
    return { ok: errors.length === 0, taskType: task, value: value, errors: errors };
  }

  function fallback(taskType, context) {
    var task = normalizeTaskType(taskType);
    if (task === "date_room" || task === "out_room") {
      return {
        narration: context && context.scene ? "你们还在" + context.scene + "。" : "空气安静了一会儿。",
        actions: ["角色轻轻呼出一口气。"],
        dialogue: ["先别急，慢慢来。"],
        choices: ["继续待一会儿", "换个地方走走", "看着对方"]
      };
    }
    if (task === "check_phone") {
      return {
        phoneTime: context && context.time || "刚刚",
        apps: ["微信", "电话", "相册", "备忘录", "地图", "账单", "微博", "音乐", "日历", "搜索", "设置"].map(function (name) {
          return { app: name, items: [] };
        })
      };
    }
    if (task === "reverse_check") return { otherCharacters: [], emotionHints: [], scopeNote: "仅当前 user 人设 + 当前世界线" };
    if (task === "novel_reader_comment" || task === "forum_comment") return { comments: [] };
    if (task === "reader_group") return { messages: [] };
    if (task === "soul_candidate") return [];
    if (JSON_SCHEMAS[task]) return {};
    if (task === "memory_summary") return "这段对话暂时没有整理出可长期保存的新内容。";
    if (task === "image_prompt") return "自然生活摄影，真实光线，真实皮肤纹理，克制构图，不磨皮，无水印。";
    if (task === "delivery_text") return "记得按时吃饭。";
    if (task === "music_comment") return "这首歌放到这里刚刚好。";
    return "……";
  }

  function parseAndValidate(taskType, raw) {
    var task = normalizeTaskType(taskType);
    if (!JSON_SCHEMAS[task]) return validate(task, raw);
    var parsed = parseJSON(raw);
    if (!parsed.ok) return { ok: false, taskType: task, value: null, errors: [parsed.error] };
    return validate(task, parsed.value);
  }

  root.BSSysWorldV2 = Object.freeze({
    version: VERSION,
    taskTypes: Object.freeze(TASK_TYPES.slice()),
    jsonTaskTypes: Object.freeze(JSON_TASKS.slice()),
    GLOBAL: GLOBAL,
    TEXT_RULES: Object.freeze(TEXT_RULES),
    JSON_SCHEMAS: Object.freeze(JSON_SCHEMAS),
    normalizeTaskType: normalizeTaskType,
    ruleFor: taskRule,
    build: build,
    parseJSON: parseJSON,
    parseAndValidate: parseAndValidate,
    validate: validate,
    fallback: fallback,
    chineseLength: chineseLength
  });
})(window);
