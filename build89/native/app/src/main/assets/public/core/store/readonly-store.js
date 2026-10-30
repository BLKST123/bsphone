(function (root) {
  "use strict";

  const STORE_VERSION = "1.0.0";
  const SECRET_KEYS = new Set(["key", "apikey", "token", "authorization", "secret", "password"]);

  function clone(value) {
    if (value === undefined) return undefined;
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return value;
  }

  function readonlyClone(value, fallback) {
    return deepFreeze(clone(value === undefined ? fallback : value));
  }

  function redactSecrets(value) {
    const copied = clone(value);
    function walk(node, parentKey) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(function (item) { walk(item, parentKey); });
        return;
      }
      Object.keys(node).forEach(function (key) {
        const normalized = String(key).toLowerCase();
        if (SECRET_KEYS.has(normalized) && node[key]) {
          node[key] = "[redacted]";
          return;
        }
        walk(node[key], key);
      });
    }
    walk(copied, "");
    return copied;
  }

  function byId(list, id) {
    return (Array.isArray(list) ? list : []).find(function (item) { return item && item.id === id; }) || null;
  }

  function createReadonlyStore(getDatabase) {
    if (typeof getDatabase !== "function") throw new TypeError("getDatabase must be a function");
    let ready = false;
    let readyListeners = [];
    const selectors = Object.create(null);

    function db() {
      const value = getDatabase();
      if (!value) throw new Error("BS Store database is not available");
      return value;
    }

    function safeSelect(fn, fallback) {
      try {
        return readonlyClone(fn(db()), fallback === undefined ? null : fallback);
      } catch (error) {
        return readonlyClone(fallback === undefined ? null : fallback);
      }
    }

    selectors.selectPersonas = function () {
      return safeSelect(function (state) { return state.me && state.me.personas || []; }, []);
    };
    selectors.selectActivePersona = function () {
      return safeSelect(function (state) {
        const personas = state.me && state.me.personas || [];
        return personas.find(function (persona) { return persona.id === (state.me && state.me.personaId); }) || null;
      }, null);
    };
    selectors.selectContacts = function () {
      return safeSelect(function (state) { return state.contacts || []; }, []);
    };
    selectors.selectContact = function (id) {
      return safeSelect(function (state) { return byId(state.contacts, id); }, null);
    };
    selectors.selectGroups = function () {
      return safeSelect(function (state) { return state.groups || []; }, []);
    };
    selectors.selectChats = function () {
      return safeSelect(function (state) { return state.chats || []; }, []);
    };
    selectors.selectChat = function (id) {
      return safeSelect(function (state) { return byId(state.chats, id); }, null);
    };
    selectors.selectMessages = function (chatId) {
      return safeSelect(function (state) {
        const chat = byId(state.chats, chatId);
        return chat && Array.isArray(chat.msgs) ? chat.msgs : [];
      }, []);
    };
    selectors.selectContactMemory = function (contactId) {
      return safeSelect(function (state) {
        const contact = byId(state.contacts, contactId);
        return contact && Array.isArray(contact.memories) ? contact.memories : [];
      }, []);
    };
    selectors.selectSessionMemory = function (chatId) {
      return safeSelect(function (state) {
        const chat = byId(state.chats, chatId);
        return {
          baseMemorySnapshot: chat && Array.isArray(chat.baseMemorySnapshot) ? chat.baseMemorySnapshot : [],
          session: chat && chat.mem ? chat.mem : { ts: 0, items: [] }
        };
      }, { baseMemorySnapshot: [], session: { ts: 0, items: [] } });
    };
    selectors.selectWorldbooks = function () {
      return safeSelect(function (state) { return state.worldbooks || []; }, []);
    };
    selectors.selectRegexes = function () {
      return safeSelect(function (state) { return state.regexes || []; }, []);
    };
    selectors.selectRegexGroups = function () {
      return safeSelect(function (state) { return state.regexGroups || []; }, []);
    };
    selectors.selectTimeProfiles = function () {
      return safeSelect(function (state) { return state.clock && state.clock.items || []; }, []);
    };
    selectors.selectAssets = function () {
      return safeSelect(function (state) { return state.galleryPics || []; }, []);
    };
    selectors.selectAlbums = function () {
      return safeSelect(function (state) { return state.galleryAlbums || []; }, []);
    };
    selectors.selectBooks = function () {
      return safeSelect(function (state) { return state.books || []; }, []);
    };
    selectors.selectBook = function (id) {
      return safeSelect(function (state) { return byId(state.books, id); }, null);
    };
    selectors.selectReaders = function () {
      return safeSelect(function (state) { return state.np && state.np.readers || []; }, []);
    };
    selectors.selectReaderGroups = function () {
      return safeSelect(function (state) { return state.np && state.np.readerGroups || []; }, []);
    };
    selectors.selectReaderGroup = function (id) {
      return safeSelect(function (state) { return byId(state.np && state.np.readerGroups, id); }, null);
    };
    selectors.selectUiPreferences = function () {
      return safeSelect(function (state) {
        const ui = state.ui || {};
        return {
          theme: ui.theme,
          themeStyle: ui.themeStyle,
          dark: !!ui.dark,
          fontScale: Number(ui.fontScale) || 1,
          brightness: Number(ui.brightness) || 1,
          fullscreen: !!ui.fullscreen,
          pushEnabled: !!ui.pushEnabled
        };
      }, {});
    };
    selectors.selectApiConfig = function () {
      return safeSelect(function (state) {
        const api = state.api || {};
        return {
          base: String(api.base || ""),
          model: String(api.model || ""),
          keyConfigured: !!api.key
        };
      }, { base: "", model: "", keyConfigured: false });
    };
    selectors.selectRuntimeStatus = function () {
      return safeSelect(function (state) {
        return {
          textApiConfigured: !!(state.api && state.api.key),
          audioConfigured: !!(state.audio && state.audio.key && state.audio.voiceId),
          imageApiConfigured: !!(state.imageGen && state.imageGen.key),
          backgroundPushEnabled: !!(state.ui && state.ui.pushEnabled),
          notificationCount: (state.notify && state.notify.items || []).length,
          logCount: (state.logs || []).length
        };
      }, {});
    };
    selectors.selectModuleState = function (moduleName) {
      const allowed = {
        novel: "np",
        weibo: "wb",
        takeout: "takeout",
        date: "dates",
        out: "outings",
        hang: "hang",
        couple: "couple",
        soul: "soul",
        music: "music",
        clock: "clock",
        forum: "forum",
        diary: "diary",
        gallery: "galleryPics"
      };
      const key = allowed[moduleName];
      if (!key) return readonlyClone(null);
      return safeSelect(function (state) { return state[key]; }, null);
    };
    selectors.selectExactBinding = function (moduleName) {
      return safeSelect(function (state) {
        if (moduleName === "takeout") return state.takeout && state.takeout.binding || null;
        if (moduleName === "clock") return state.clock && state.clock.binding || null;
        if (moduleName === "couple") return state.couple && state.couple.activeBinding || null;
        if (moduleName === "music") return state.music && state.music.together && state.music.together.binding || null;
        if (moduleName === "date") return state.dateBinding || null;
        if (moduleName === "out") return state.outBinding || null;
        if (moduleName === "diary") return state.diaryBinding || null;
        if (moduleName === "hang") return state.hang && state.hang.binding || null;
        return null;
      }, null);
    };
    selectors.resolveExactBinding = function (binding) {
      return safeSelect(function (state) {
        const value = binding || {};
        const chat = byId(state.chats, value.chatId);
        const contact = byId(state.contacts, value.contactId) || (chat ? byId(state.contacts, (chat.memberIds || [])[0]) : null);
        const persona = byId(state.me && state.me.personas, value.personaId) || (chat ? byId(state.me && state.me.personas, chat.personaId) : null);
        return { binding: clone(value), chat: chat || null, contact: contact || null, persona: persona || null };
      }, { binding: clone(binding || {}), chat: null, contact: null, persona: null });
    };
    selectors.selectDiagnostics = function () {
      return safeSelect(function (state) {
        return {
          contacts: (state.contacts || []).length,
          chats: (state.chats || []).length,
          messages: (state.chats || []).reduce(function (sum, chat) { return sum + (chat.msgs || []).length; }, 0),
          personas: (state.me && state.me.personas || []).length,
          worldbooks: (state.worldbooks || []).length,
          regexes: (state.regexes || []).length,
          books: (state.books || []).length,
          readerGroups: (state.np && state.np.readerGroups || []).length,
          assets: (state.galleryPics || []).length,
          notifications: (state.notify && state.notify.items || []).length
        };
      }, {});
    };
    selectors.selectSafeSnapshot = function () {
      try { return readonlyClone(redactSecrets(db())); } catch (_) { return readonlyClone(null); }
    };

    Object.keys(selectors).forEach(function (name) { Object.freeze(selectors[name]); });
    Object.freeze(selectors);

    const api = {
      version: STORE_VERSION,
      mode: "readonly",
      selectors: selectors,
      getSelectorNames: function () { return Object.keys(selectors); },
      ready: function () { return ready && !!getDatabase(); },
      markReady: function () {
        if (ready) return;
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
        return function () { readyListeners = readyListeners.filter(function (item) { return item !== listener; }); };
      }
    };
    return Object.freeze(api);
  }

  function resolveDatabase() {
    try {
      return typeof DB !== "undefined" ? DB : null;
    } catch (_) {
      return null;
    }
  }

  root.BSCreateReadonlyStore = createReadonlyStore;
  root.BSReadonlyStore = createReadonlyStore(resolveDatabase);
})(typeof window !== "undefined" ? window : globalThis);
