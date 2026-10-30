(function (root) {
  "use strict";

  const STORE_VERSION = "1.0.0";
  const CORE_COLLECTIONS = ["contacts", "chats", "worldbooks", "regexes"];

  function clone(value) {
    if (value === undefined) return undefined;
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function byId(list, id) {
    return (Array.isArray(list) ? list : []).find(function (item) {
      return item && item.id === id;
    }) || null;
  }

  function makeId(prefix) {
    return String(prefix || "core") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function createCoreStore(options) {
    const config = options || {};
    const getDatabase = config.getDatabase;
    const persistCallback = typeof config.persist === "function" ? config.persist : function () {};
    const now = typeof config.now === "function" ? config.now : Date.now;
    const idFactory = typeof config.idFactory === "function" ? config.idFactory : makeId;
    let ready = false;
    let sequence = 0;
    let writeLog = [];
    let readyListeners = [];

    if (typeof getDatabase !== "function") throw new TypeError("getDatabase must be a function");

    function db() {
      const state = getDatabase();
      if (!state) throw new Error("BS core store database is not available");
      return state;
    }

    function ensureCoreState() {
      const state = db();
      CORE_COLLECTIONS.forEach(function (key) {
        if (!Array.isArray(state[key])) state[key] = [];
      });
      state.me = state.me || {};
      if (!Array.isArray(state.me.personas)) state.me.personas = [];
      return state;
    }

    function ensureChatMessages(chat) {
      if (!chat) return [];
      if (!Array.isArray(chat.msgs)) chat.msgs = [];
      return chat.msgs;
    }

    function ensureContactMemories(contact) {
      if (!contact) return [];
      if (!Array.isArray(contact.memories)) contact.memories = [];
      return contact.memories;
    }

    function ensureSessionMemory(chat) {
      if (!chat) return null;
      if (!chat.mem || typeof chat.mem !== "object") chat.mem = {};
      if (!Array.isArray(chat.mem.items)) chat.mem.items = [];
      return chat.mem;
    }

    function notify(command, payload, entity) {
      if (root.dispatchEvent && typeof root.CustomEvent === "function") {
        try {
          root.dispatchEvent(new root.CustomEvent("bs:core-store-change", {
            detail: {
              command: command,
              entityId: entity && entity.id || null,
              payload: clone(payload || {})
            }
          }));
        } catch (_) {}
      }
    }

    function record(command, payload, entity, shouldPersist) {
      sequence += 1;
      const entry = {
        sequence: sequence,
        command: String(command || ""),
        entityId: entity && entity.id || null,
        at: now()
      };
      writeLog.unshift(entry);
      if (writeLog.length > 240) writeLog.length = 240;
      notify(command, payload, entity);
      if (shouldPersist !== false) {
        try {
          persistCallback(command, entity);
        } catch (_) {}
      }
      return entity;
    }

    const read = Object.freeze({
      contacts: function () { return ensureCoreState().contacts; },
      contact: function (id) { return byId(ensureCoreState().contacts, id); },
      personas: function () { return ensureCoreState().me.personas; },
      persona: function (id) { return byId(ensureCoreState().me.personas, id); },
      activePersona: function () {
        const state = ensureCoreState();
        return byId(state.me.personas, state.me.personaId);
      },
      chats: function () { return ensureCoreState().chats; },
      chat: function (id) { return byId(ensureCoreState().chats, id); },
      messages: function (chatId) {
        const chat = byId(ensureCoreState().chats, chatId);
        return ensureChatMessages(chat);
      },
      sessionMemory: function (chatId) {
        const chat = byId(ensureCoreState().chats, chatId);
        return ensureSessionMemory(chat);
      },
      worldbooks: function () { return ensureCoreState().worldbooks; },
      worldbook: function (id) { return byId(ensureCoreState().worldbooks, id); },
      regexes: function () { return ensureCoreState().regexes; },
      regex: function (id) { return byId(ensureCoreState().regexes, id); }
    });

    const commands = Object.create(null);

    commands.upsertContact = function (contact, commandOptions) {
      if (!contact || typeof contact !== "object") throw new TypeError("contact is required");
      const state = ensureCoreState();
      const opts = commandOptions || {};
      let target = contact.id ? byId(state.contacts, contact.id) : null;
      if (!target) {
        target = contact;
        if (!target.id) target.id = idFactory("contact");
        state.contacts.push(target);
      } else if (target !== contact) {
        Object.assign(target, contact);
      }
      return record("upsertContact", { fields: Object.keys(contact) }, target, opts.persist);
    };

    commands.patchContact = function (id, patch, commandOptions) {
      const target = read.contact(id);
      if (!target) return null;
      Object.assign(target, patch || {});
      return record("patchContact", { fields: Object.keys(patch || {}) }, target, (commandOptions || {}).persist);
    };

    commands.addContactMemory = function (contactId, memory, commandOptions) {
      const contact = read.contact(contactId);
      if (!contact) return null;
      const list = ensureContactMemories(contact);
      const item = typeof memory === "string"
        ? { id: idFactory("memory"), text: String(memory).trim() }
        : Object.assign({}, memory || {});
      const options = commandOptions || {};
      if (!item.personaId && options.personaId) item.personaId = options.personaId;
      if (!item.chatId && options.chatId) item.chatId = options.chatId;
      if (!item.scope) item.scope = options.scope || "character";
      if (!item.personaId) item.needsPersonaReview = true;
      if (!item.text) return null;
      if (!item.id) item.id = idFactory("memory");
      if (!list.some(function (existing) { return existing.id === item.id || existing.text === item.text; })) {
        list.push(item);
      }
      return record("addContactMemory", { contactId: contactId, text: item.text }, contact, (commandOptions || {}).persist);
    };

    commands.mergeContactMemories = function (contactId, memories, commandOptions) {
      const contact = read.contact(contactId);
      if (!contact) return { contact: null, added: 0 };
      const list = ensureContactMemories(contact);
      let added = 0;
      const options = commandOptions || {};
      (Array.isArray(memories) ? memories : []).forEach(function (memory) {
        const text = String(typeof memory === "string" ? memory : memory && memory.text || "").trim();
        if (!text) return;
        const source = typeof memory === "string" ? { text: text } : Object.assign({}, memory || {});
        const personaId = source.personaId || options.personaId || null;
        const scope = source.scope || options.scope || "character";
        const chatId = source.chatId || options.chatId || null;
        const duplicate = list.some(function (existing) {
          return String(existing.text || "").trim() === text
            && (existing.personaId || null) === personaId
            && (existing.scope || "character") === scope
            && (existing.chatId || null) === chatId;
        });
        if (duplicate) return;
        list.push(Object.assign({}, source, {
          id: source.id || idFactory("memory"),
          text: text,
          personaId: personaId,
          scope: scope,
          chatId: scope === "session" ? chatId : source.chatId || null,
          needsPersonaReview: !personaId
        }));
        added += 1;
      });
      record("mergeContactMemories", { contactId: contactId, added: added }, contact, (commandOptions || {}).persist);
      return { contact: contact, added: added };
    };

    commands.replaceContactMemories = function (contactId, memories, commandOptions) {
      const contact = read.contact(contactId);
      if (!contact) return null;
      contact.memories = (Array.isArray(memories) ? memories : []).filter(Boolean).map(function (memory) {
        if (typeof memory === "string") return { id: idFactory("memory"), text: memory };
        return Object.assign({}, memory, { id: memory.id || idFactory("memory") });
      });
      return record("replaceContactMemories", { contactId: contactId, count: contact.memories.length }, contact, (commandOptions || {}).persist);
    };

    commands.setContactBindings = function (contactId, bindings, commandOptions) {
      const contact = read.contact(contactId);
      if (!contact) return null;
      const patch = bindings || {};
      if (Array.isArray(patch.worldIds)) contact.worldIds = patch.worldIds.slice();
      if (Array.isArray(patch.regexIds)) contact.regexIds = patch.regexIds.slice();
      return record("setContactBindings", {
        contactId: contactId,
        worldIds: Array.isArray(contact.worldIds) ? contact.worldIds.length : 0,
        regexIds: Array.isArray(contact.regexIds) ? contact.regexIds.length : 0
      }, contact, (commandOptions || {}).persist);
    };

    commands.deleteContact = function (id, commandOptions) {
      const state = ensureCoreState();
      const target = byId(state.contacts, id);
      if (!target) return null;
      state.contacts = state.contacts.filter(function (contact) { return contact.id !== id; });
      state.chats = state.chats.filter(function (chat) {
        if (chat.type === "private" && (chat.memberIds || [])[0] === id) return false;
        chat.memberIds = (chat.memberIds || []).filter(function (memberId) { return memberId !== id; });
        return (chat.memberIds || []).length > 0;
      });
      return record("deleteContact", { removedChats: true }, target, (commandOptions || {}).persist);
    };

    commands.createChat = function (chat, commandOptions) {
      if (!chat || typeof chat !== "object") throw new TypeError("chat is required");
      const state = ensureCoreState();
      const target = chat;
      if (!target.id) target.id = idFactory("chat");
      ensureChatMessages(target);
      state.chats.push(target);
      return record("createChat", { type: target.type || "private" }, target, (commandOptions || {}).persist);
    };

    commands.patchChat = function (id, patch, commandOptions) {
      const target = read.chat(id);
      if (!target) return null;
      Object.assign(target, patch || {});
      return record("patchChat", { fields: Object.keys(patch || {}) }, target, (commandOptions || {}).persist);
    };

    commands.deleteChat = function (id, commandOptions) {
      const state = ensureCoreState();
      const target = byId(state.chats, id);
      if (!target) return null;
      state.chats = state.chats.filter(function (chat) { return chat.id !== id; });
      return record("deleteChat", { chatId: id }, target, (commandOptions || {}).persist);
    };

    commands.appendMessage = function (chatId, message, commandOptions) {
      const chat = read.chat(chatId);
      if (!chat || !message || typeof message !== "object") return null;
      const list = ensureChatMessages(chat);
      const target = Object.assign({
        id: idFactory("message"),
        ts: now()
      }, message);
      list.push(target);
      if (message.touchLastTs !== false && (commandOptions || {}).touchLastTs !== false) chat.lastTs = now();
      return record("appendMessage", {
        chatId: chatId,
        role: target.role || "",
        type: target.type || "text"
      }, target, (commandOptions || {}).persist);
    };

    commands.appendMessages = function (chatId, messages, commandOptions) {
      const chat = read.chat(chatId);
      if (!chat || !Array.isArray(messages)) return [];
      const list = ensureChatMessages(chat);
      const appended = messages.filter(function (message) { return message && typeof message === "object"; }).map(function (message, index) {
        const target = Object.assign({
          id: idFactory("message"),
          ts: now() + index
        }, message);
        list.push(target);
        return target;
      });
      if (appended.length) {
        if ((commandOptions || {}).touchLastTs !== false) chat.lastTs = now();
        record("appendMessages", { chatId: chatId, count: appended.length }, chat, (commandOptions || {}).persist);
      }
      return appended;
    };

    commands.patchMessage = function (chatId, messageId, patch, commandOptions) {
      const chat = read.chat(chatId);
      const target = chat && ensureChatMessages(chat).find(function (message) { return message.id === messageId; });
      if (!target) return null;
      const options = commandOptions || {};
      Object.assign(target, patch || {});
      (Array.isArray(options.removeKeys) ? options.removeKeys : []).forEach(function (key) {
        delete target[key];
      });
      return record("patchMessage", {
        chatId: chatId,
        fields: Object.keys(patch || {}),
        removedKeys: (options.removeKeys || []).slice()
      }, target, options.persist);
    };

    commands.deleteMessage = function (chatId, messageId, commandOptions) {
      const chat = read.chat(chatId);
      if (!chat) return null;
      const list = ensureChatMessages(chat);
      const index = list.findIndex(function (message) { return message.id === messageId; });
      if (index < 0) return null;
      const removed = list.splice(index, 1)[0];
      return record("deleteMessage", { chatId: chatId, messageId: messageId }, removed, (commandOptions || {}).persist);
    };

    commands.clearMessages = function (chatId, commandOptions) {
      const chat = read.chat(chatId);
      if (!chat) return null;
      chat.msgs = [];
      chat.lastTs = now();
      return record("clearMessages", { chatId: chatId }, chat, (commandOptions || {}).persist);
    };

    commands.replaceMessages = function (chatId, messages, commandOptions) {
      const chat = read.chat(chatId);
      if (!chat) return null;
      chat.msgs = (Array.isArray(messages) ? messages : []).filter(Boolean).map(function (message) {
        return Object.assign({ id: message.id || idFactory("message"), ts: message.ts || now() }, message);
      });
      return record("replaceMessages", { chatId: chatId, count: chat.msgs.length }, chat, (commandOptions || {}).persist);
    };

    commands.replaceSessionMemory = function (chatId, memory, commandOptions) {
      const chat = read.chat(chatId);
      if (!chat) return null;
      const source = Array.isArray(memory) ? { items: memory } : memory || {};
      chat.mem = {
        ts: source.ts || now(),
        items: (Array.isArray(source.items) ? source.items : []).map(String).filter(Boolean)
      };
      return record("replaceSessionMemory", { chatId: chatId, count: chat.mem.items.length }, chat, (commandOptions || {}).persist);
    };

    commands.mergeSessionMemory = function (chatId, items, commandOptions) {
      const chat = read.chat(chatId);
      if (!chat) return { chat: null, added: 0 };
      const memory = ensureSessionMemory(chat);
      let added = 0;
      (Array.isArray(items) ? items : []).forEach(function (item) {
        const text = String(item || "").trim();
        if (!text || memory.items.indexOf(text) >= 0) return;
        memory.items.push(text);
        added += 1;
      });
      memory.ts = now();
      record("mergeSessionMemory", { chatId: chatId, added: added }, chat, (commandOptions || {}).persist);
      return { chat: chat, added: added };
    };

    commands.setBaseMemorySnapshot = function (chatId, memories, commandOptions) {
      const chat = read.chat(chatId);
      if (!chat) return null;
      chat.baseMemorySnapshot = (Array.isArray(memories) ? memories : []).map(function (memory) {
        return String(typeof memory === "string" ? memory : memory && memory.text || "").trim();
      }).filter(Boolean);
      return record("setBaseMemorySnapshot", { chatId: chatId, count: chat.baseMemorySnapshot.length }, chat, (commandOptions || {}).persist);
    };

    commands.upsertPersona = function (persona, commandOptions) {
      if (!persona || typeof persona !== "object") throw new TypeError("persona is required");
      const state = ensureCoreState();
      let target = persona.id ? byId(state.me.personas, persona.id) : null;
      if (!target) {
        target = persona;
        if (!target.id) target.id = idFactory("persona");
        state.me.personas.push(target);
      } else if (target !== persona) {
        Object.assign(target, persona);
      }
      return record("upsertPersona", { fields: Object.keys(persona) }, target, (commandOptions || {}).persist);
    };

    commands.replacePersonas = function (personas, commandOptions) {
      const state = ensureCoreState();
      state.me.personas = (Array.isArray(personas) ? personas : []).filter(Boolean).map(function (persona) {
        return Object.assign({ id: persona.id || idFactory("persona") }, persona);
      });
      if (!byId(state.me.personas, state.me.personaId)) state.me.personaId = state.me.personas[0] && state.me.personas[0].id || null;
      return record("replacePersonas", { count: state.me.personas.length }, null, (commandOptions || {}).persist);
    };

    commands.setActivePersona = function (personaId, commandOptions) {
      const state = ensureCoreState();
      if (personaId && !byId(state.me.personas, personaId)) return null;
      state.me.personaId = personaId || null;
      const entity = byId(state.me.personas, personaId);
      return record("setActivePersona", { personaId: state.me.personaId }, entity, (commandOptions || {}).persist);
    };

    commands.upsertWorldbook = function (worldbook, commandOptions) {
      if (!worldbook || typeof worldbook !== "object") throw new TypeError("worldbook is required");
      const state = ensureCoreState();
      let target = worldbook.id ? byId(state.worldbooks, worldbook.id) : null;
      if (!target) {
        target = worldbook;
        if (!target.id) target.id = idFactory("worldbook");
        if (!Array.isArray(target.entries)) target.entries = [];
        state.worldbooks.push(target);
      } else if (target !== worldbook) {
        Object.assign(target, worldbook);
      }
      return record("upsertWorldbook", { fields: Object.keys(worldbook) }, target, (commandOptions || {}).persist);
    };

    commands.deleteWorldbook = function (id, commandOptions) {
      const state = ensureCoreState();
      const target = byId(state.worldbooks, id);
      if (!target) return null;
      state.worldbooks = state.worldbooks.filter(function (worldbook) { return worldbook.id !== id; });
      state.contacts.forEach(function (contact) {
        contact.worldIds = (contact.worldIds || []).filter(function (worldId) { return worldId !== id; });
      });
      return record("deleteWorldbook", { worldbookId: id }, target, (commandOptions || {}).persist);
    };

    commands.upsertRegex = function (regex, commandOptions) {
      if (!regex || typeof regex !== "object") throw new TypeError("regex is required");
      const state = ensureCoreState();
      let target = regex.id ? byId(state.regexes, regex.id) : null;
      if (!target) {
        target = regex;
        if (!target.id) target.id = idFactory("regex");
        state.regexes.push(target);
      } else if (target !== regex) {
        Object.assign(target, regex);
      }
      return record("upsertRegex", { fields: Object.keys(regex) }, target, (commandOptions || {}).persist);
    };

    commands.deleteRegex = function (id, commandOptions) {
      const state = ensureCoreState();
      const target = byId(state.regexes, id);
      if (!target) return null;
      state.regexes = state.regexes.filter(function (regex) { return regex.id !== id; });
      state.contacts.forEach(function (contact) {
        contact.regexIds = (contact.regexIds || []).filter(function (regexId) { return regexId !== id; });
      });
      return record("deleteRegex", { regexId: id }, target, (commandOptions || {}).persist);
    };

    commands.replaceWorldbooks = function (worldbooks, commandOptions) {
      const state = ensureCoreState();
      state.worldbooks = (Array.isArray(worldbooks) ? worldbooks : []).filter(Boolean);
      return record("replaceWorldbooks", { count: state.worldbooks.length }, null, (commandOptions || {}).persist);
    };

    commands.replaceRegexes = function (regexes, commandOptions) {
      const state = ensureCoreState();
      state.regexes = (Array.isArray(regexes) ? regexes : []).filter(Boolean);
      return record("replaceRegexes", { count: state.regexes.length }, null, (commandOptions || {}).persist);
    };

    commands.replaceContacts = function (contacts, commandOptions) {
      const state = ensureCoreState();
      state.contacts = (Array.isArray(contacts) ? contacts : []).filter(Boolean);
      return record("replaceContacts", { count: state.contacts.length }, null, (commandOptions || {}).persist);
    };

    commands.replaceChats = function (chats, commandOptions) {
      const state = ensureCoreState();
      state.chats = (Array.isArray(chats) ? chats : []).filter(Boolean).map(function (chat) {
        ensureChatMessages(chat);
        return chat;
      });
      return record("replaceChats", { count: state.chats.length }, null, (commandOptions || {}).persist);
    };

    commands.clearAll = function (commandOptions) {
      const state = ensureCoreState();
      state.contacts = [];
      state.chats = [];
      state.worldbooks = [];
      state.regexes = [];
      return record("clearAll", { collections: CORE_COLLECTIONS.slice() }, null, (commandOptions || {}).persist);
    };

    Object.keys(commands).forEach(function (name) {
      Object.freeze(commands[name]);
    });
    Object.freeze(commands);

    function snapshot() {
      const state = ensureCoreState();
      return clone({
        contacts: state.contacts,
        chats: state.chats,
        personas: state.me.personas,
        personaId: state.me.personaId,
        worldbooks: state.worldbooks,
        regexes: state.regexes
      });
    }

    const api = {
      version: STORE_VERSION,
      mode: "core",
      read: read,
      commands: commands,
      snapshot: snapshot,
      getWriteLog: function () { return clone(writeLog); },
      getLastWrite: function () { return clone(writeLog[0] || null); },
      diagnostics: function () {
        const state = ensureCoreState();
        return {
          contacts: state.contacts.length,
          chats: state.chats.length,
          messages: state.chats.reduce(function (sum, chat) { return sum + (chat.msgs || []).length; }, 0),
          personas: state.me.personas.length,
          worldbooks: state.worldbooks.length,
          regexes: state.regexes.length,
          writes: writeLog.length
        };
      },
      ready: function () { return ready && !!getDatabase(); },
      markReady: function () {
        if (ready) return;
        ensureCoreState();
        ready = true;
        readyListeners.slice().forEach(function (listener) {
          try { listener(); } catch (_) {}
        });
        readyListeners = [];
      },
      onReady: function (listener) {
        if (typeof listener !== "function") return function () {};
        if (ready && getDatabase()) {
          listener();
          return function () {};
        }
        readyListeners.push(listener);
        return function () {
          readyListeners = readyListeners.filter(function (item) { return item !== listener; });
        };
      }
    };

    return Object.freeze(api);
  }

  root.BSCreateCoreStore = createCoreStore;
})(typeof window !== "undefined" ? window : globalThis);
