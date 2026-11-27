const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const a = "111111111111111111111111",
  b = "222222222222222222222222",
  roomId = "333333333333333333333333";
const jsx = {
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
};
function load(file, mocks = {}, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      Error,
      AbortController,
      AbortSignal,
      URL,
      URLSearchParams,
      console: { error() {}, log() {} },
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      require(name) {
        if (name in mocks) return mocks[name];
        if (name === "react/jsx-runtime") return jsx;
        if (name.startsWith("@/") || name.startsWith(".")) {
          const base = name.startsWith("@/")
            ? name.slice(2)
            : path.join(path.dirname(file), name);
          const next = [base, base + ".ts", base + ".tsx"].find(
            (p) => fs.existsSync(p) && fs.statSync(p).isFile(),
          );
          if (next) return load(next, mocks, globals);
        }
        return require(name);
      },
      ...globals,
    },
  );
  return module.exports;
}
function hooks() {
  const cells = [];
  let cursor = 0,
    effects = [],
    closed = false,
    lateWrites = 0;
  const changed = (x, y) =>
    !x || x.length !== y.length || x.some((v, i) => !Object.is(v, y[i]));
  const react = {
    useState(initial) {
      const i = cursor++;
      cells[i] ||= {
        value: typeof initial === "function" ? initial() : initial,
      };
      return [
        cells[i].value,
        (value) => {
          if (closed) {
            lateWrites++;
            return;
          }
          cells[i].value =
            typeof value === "function" ? value(cells[i].value) : value;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      return (cells[i] ||= { current: initial });
    },
    useCallback(fn, deps) {
      const i = cursor++;
      if (changed(cells[i]?.deps, deps)) cells[i] = { value: fn, deps };
      return cells[i].value;
    },
    useMemo(fn, deps) {
      const i = cursor++;
      if (changed(cells[i]?.deps, deps)) cells[i] = { value: fn(), deps };
      return cells[i].value;
    },
    useEffect(fn, deps = []) {
      const i = cursor++;
      if (changed(cells[i]?.deps, deps)) {
        const old = cells[i];
        cells[i] = { deps, setup: fn };
        effects.push(() => {
          old?.cleanup?.();
          cells[i].cleanup = fn();
        });
      }
    },
    createContext: () => ({ Provider: "provider" }),
    useTransition: () => [false, fn => fn()],
  };
  return {
    react,
    render(fn) {
      cursor = 0;
      const tree = fn();
      const jobs = effects;
      effects = [];
      jobs.forEach((fn) => fn());
      return tree;
    },
    unmount() {
      closed = true;
      cells.forEach((c) => c?.cleanup?.());
    },
    lateWrites: () => lateWrites,
  };
}
function all(tree, predicate) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap((t) => all(t, predicate));
  return [
    ...(predicate(tree) ? [tree] : []),
    ...all(tree.props?.children, predicate),
  ];
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
const chat = (name = "Own conversation") => ({
  _id: roomId,
  roomId,
  member: [{ userId: a, userName: name }],
  lastMessage: name,
  unread: 7,
});
const result = (viewerId, rooms = [], status = 200) => ({
  ok: status < 400,
  status,
  json: async () => ({ viewerId, rooms }),
});
function dashboard(accountId, fetch, storage = new Map(), initialChats = []) {
  const host = hooks(),
    calls = [],
    reads = [];
  const Component = load(
    "components/widgets/chat/ChatDashboard.tsx",
    {
      react: host.react,
      "next/link": "link",
      "date-fns": {},
      "lucide-react": {},
      "@/components/others/UserProfileImg": "avatar",
      "@/components/ui/button": { Button: "button" },
      "@/lib/utils/postSharing": {},
    },
    {
      window: {
        localStorage: {
          getItem: (key) => {
            reads.push(key);
            return storage.get(key);
          },
          removeItem: (key) => storage.delete(key),
        },
      },
      fetch: (url, options) => {
        calls.push({ url, options });
        return fetch(url, options);
      },
    },
  ).default;
  const props = {
    accountId,
    isTalent: true,
    initialChats,
    initialRequests: [],
    initialGroups: [],
    initialUnreadCount: { oneToOne: 0, group: 0, request: 0 },
  };
  const wrapper = Component(props);
  const render = () => host.render(() => wrapper.type(wrapper.props));
  return { render, host, calls, reads, wrapper };
}
test("a new account never restores the previous account's cached conversations or unread badges", async () => {
  const storage = new Map([
    ["te-web-recent-chats", JSON.stringify([chat("A PRIVATE DIRECT MESSAGE")])],
    ["te-web-recent-groups", JSON.stringify([chat("A PRIVATE GROUP")])],
    ["theme", "dark"],
  ]);
  const h = dashboard(b, async () => result(b), storage);
  assert.equal(JSON.stringify(h.render()).includes("A PRIVATE"), false);
  await flush();
  const tree = h.render();
  assert.equal(JSON.stringify(tree).includes("A PRIVATE"), false);
  assert.equal(JSON.stringify(tree).includes("No chat history found."), true);
  assert.equal(h.reads.length, 0, "Legacy chat data must never be read");
  assert.equal(storage.has("te-web-recent-chats"), false);
  assert.equal(storage.has("te-web-recent-groups"), false);
  assert.equal(storage.get("theme"), "dark");
  assert.ok(
    h.calls.every(
      (c) =>
        new URL(c.url, "https://local.test").searchParams.get("viewerId") === b,
    ),
  );
  h.host.unmount();
});
test("a successful empty refresh removes stale rooms rather than merging them back", async () => {
  const h = dashboard(a, async () => result(a), new Map(), [
    chat("Old confirmed room"),
  ]);
  assert.equal(JSON.stringify(h.render()).includes("Old confirmed room"), true);
  await flush();
  assert.equal(
    JSON.stringify(h.render()).includes("Old confirmed room"),
    false,
  );
  h.host.unmount();
});
test("account changes remount the list and late previous-account responses are aborted and ignored", async () => {
  const pending = [];
  const old = dashboard(
    a,
    () => new Promise((resolve) => pending.push(resolve)),
  );
  old.render();
  old.host.unmount();
  const current = dashboard(b, async () => result(b));
  current.render();
  assert.notEqual(old.wrapper.key, current.wrapper.key);
  assert.ok(old.calls.every((c) => c.options.signal.aborted));
  pending.forEach((resolve) =>
    resolve(result(a, [chat("A LATE PRIVATE DATA")])),
  );
  await flush();
  assert.equal(old.host.lateWrites(), 0);
  assert.equal(JSON.stringify(current.render()).includes("A LATE"), false);
  current.host.unmount();
});
test("a changed authenticated account blanks existing rooms instead of displaying the new account's response", async () => {
  const h = dashboard(
    a,
    async () => result(b, [chat("B PRIVATE DATA")]),
    new Map(),
    [chat("A OLD DATA")],
  );
  h.render();
  await flush();
  const tree = JSON.stringify(h.render());
  assert.equal(tree.includes("A OLD DATA"), false);
  assert.equal(tree.includes("B PRIVATE DATA"), false);
  assert.equal(tree.includes("Your account changed."), true);
  h.host.unmount();
});
test("network failures retain only the current account's confirmed rooms and show retry", async () => {
  const h = dashboard(
    a,
    async () => {
      throw Error("Offline");
    },
    new Map(),
    [chat("Current verified room")],
  );
  h.render();
  await flush();
  const tree = h.render();
  assert.equal(JSON.stringify(tree).includes("Current verified room"), true);
  assert.ok(all(tree, (n) => n.props?.role === "alert").length);
  assert.ok(
    all(tree, (n) => n.type === "button" && n.props.children === "Try again")
      .length,
  );
  h.host.unmount();
});
test("chat list HTTP responses belong to the cookie identity and cannot be cached or queried as another user", async () => {
  const calls = [];
  const route = load("app/api/chat/rooms/route.ts", {
    "@/lib/session": {
      getAuthHeaders: async () => ({ Authorization: "Bearer B" }),
    },
    "@/actions/auth.action": {
      getUserPersonalInfoAction: async () => ({
        status: "7400",
        response: { _id: b, isTalent: true },
      }),
    },
    axios: {
      get: async (url, options) => {
        calls.push({ url, options });
        return { data: { status: "7400", response: [] } };
      },
    },
    "next/server": {
      NextResponse: {
        json: (body, options) => ({
          body,
          ...options,
          status: options.status || 200,
        }),
      },
    },
  });
  const foreign = await route.GET({
    url: `https://local.test/api/chat/rooms?viewerId=${a}`,
  });
  assert.equal(foreign.status, 409);
  assert.equal(calls.length, 0);
  const own = await route.GET({
    url: `https://local.test/api/chat/rooms?viewerId=${b}`,
  });
  assert.equal(own.status, 200);
  assert.equal(own.body.viewerId, b);
  assert.equal(own.headers["Cache-Control"], "private, no-store, max-age=0");
  assert.equal(own.headers.Vary, "Cookie");
  assert.ok(calls[0].url.includes(`/getChatRooms/${b}/CHAT`));
  assert.equal(calls[0].options.headers.Authorization, "Bearer B");
});
function server(isTalent, member = false, failure = false) {
  const calls = [];
  const actions = load("actions/chat.action.tsx", {
    "@/lib/session": {
      getAuthHeaders: async () => ({ Authorization: "Bearer B" }),
    },
    "./auth.action": {
      getUserPersonalInfoAction: async () => ({
        status: "7400",
        response: { _id: b, userName: "B", isTalent },
      }),
    },
    "next/dist/client/components/redirect": { isRedirectError: () => false },
    axios: {
      get: async (url) => {
        calls.push({ method: "GET", url });
        if (failure) {
          const e = Error("Denied");
          e.response = {
            data: {
              status: "7400",
              response: [{ _id: "foreign", content: "A PRIVATE DATA" }],
            },
          };
          throw e;
        }
        return {
          data: {
            status: "7400",
            response: url.includes("/members/")
              ? { info: { type: "CHAT" }, list: [{ userId: member ? b : a }] }
              : [],
          },
        };
      },
      post: async (url) => {
        calls.push({ method: "POST", url });
        return { status: 200, data: { status: "7400" } };
      },
    },
  });
  return { actions, calls };
}
test("normal and talent accounts cannot read or mutate a room belonging to a previous account", async () => {
  for (const isTalent of [false, true]) {
    const h = server(isTalent);
    assert.equal((await h.actions.getChatMembersAction(roomId)).status, "403");
    assert.equal((await h.actions.getChatMessagesAction({ roomId })).length, 0);
    assert.equal(
      (await h.actions.sendChatMessageAction({ roomId, content: "Never send" }))
        .status,
      "ERROR",
    );
    assert.equal(await h.actions.deleteChatMessageAction(roomId, a), false);
    assert.equal(await h.actions.deleteConversationAction(roomId), false);
    assert.ok(
      h.calls.every((c) => c.method === "GET" && c.url.includes("/members/")),
    );
  }
});
test("expected viewer checks stop stale chat operations before any room read or write", async () => {
  const h = server(true, true);
  assert.equal(
    (await h.actions.getChatMessagesAction({ roomId, expectedViewerId: a }))
      .length,
    0,
  );
  assert.equal(
    (
      await h.actions.sendChatMessageAction(
        { roomId, content: "Old account draft" },
        a,
      )
    ).status,
    "ERROR",
  );
  assert.equal(await h.actions.deleteChatMessageAction(roomId, b, a), false);
  assert.equal(await h.actions.deleteConversationAction(roomId, a), false);
  assert.equal(await h.actions.acceptChatRequestAction(roomId, a), false);
  assert.equal(h.calls.length, 0);
});
test("legitimate normal and talent members still read and send, while HTTP error payloads never become chat data", async () => {
  for (const isTalent of [false, true]) {
    const h = server(isTalent, true);
    assert.equal(
      (await h.actions.getChatMessagesAction({ roomId, expectedViewerId: b }))
        .length,
      0,
    );
    assert.equal(
      (
        await h.actions.sendChatMessageAction(
          { roomId, content: "Authorized" },
          b,
        )
      ).status,
      "7400",
    );
    assert.equal(h.calls.filter((c) => c.method === "POST").length, 1);
  }
  const denied = server(true, true, true);
  assert.equal(
    (await denied.actions.getChatMessagesAction({ roomId })).length,
    0,
  );
  assert.equal((await denied.actions.getChatRoomsAction()).length, 0);
  assert.equal((await denied.actions.getGroupChatRoomsAction()).length, 0);
});
function storage() {
  const values = new Map();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
const cached = (id) => ({
  currentUserId: id,
  username: id === a ? "A" : "B",
  email: "qa@example.test",
  firstName: "QA",
  lastName: "Test",
  isTalent: false,
});
test("auth restoration rejects a prior tab's cached profile and logout removes only legacy chat storage", () => {
  const localStorage = storage(),
    sessionStorage = storage();
  const utils = load(
    "lib/utils/auth-user-cache.ts",
    {},
    { window: { localStorage, sessionStorage } },
  );
  sessionStorage.setItem(utils.AUTH_USER_CACHE_KEY, JSON.stringify(cached(a)));
  localStorage.setItem("te-web-recent-chats", "private");
  localStorage.setItem("te-web-recent-groups", "private");
  localStorage.setItem("theme", "dark");
  utils.publishAuthSessionChange(b);
  assert.equal(utils.readCachedAuthUser(), null);
  assert.equal(localStorage.getItem("te-web-recent-chats"), null);
  assert.equal(localStorage.getItem("te-web-recent-groups"), null);
  assert.equal(localStorage.getItem("theme"), "dark");
  assert.equal(utils.writeCachedAuthUser(cached(b)), true);
  assert.equal(utils.readCachedAuthUser().currentUserId, b);
  utils.publishAuthSessionChange(null);
  assert.equal(utils.readCachedAuthUser(), null);
});
test("a late auth restoration cannot replace the newly signed-in account", async () => {
  const host = hooks(),
    localStorage = storage(),
    sessionStorage = storage();
  let resolve;
  const response = new Promise((r) => {
    resolve = r;
  });
  const Component = load(
    "context/AuthProvider.tsx",
    {
      react: host.react,
      "@/actions/session.action": {
        getCurrentSessionUserAction: () => response,
      },
      sonner: { toast: { error() {}, info() {} } },
    },
    { window: { localStorage, sessionStorage } },
  ).default;
  const render = () => host.render(() => Component({ children: "test" }));
  render().props.value.setUser(cached(b));
  resolve({
    status: "7400",
    response: {
      _id: a,
      userName: "A",
      email: "qa@example.test",
      personalInfo: { firstName: "A" },
    },
  });
  await flush();
  assert.equal(render().props.value.user.currentUserId, b);
  host.unmount();
});
test("another tab's account change clears the current identity and navigates to a fresh document", () => {
  const host = hooks(),
    localStorage = storage(),
    sessionStorage = storage(),
    listeners = new Map(),
    navigations = [];
  const window = {
    localStorage,
    sessionStorage,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
    location: { assign: (path) => navigations.push(path) },
  };
  const cache = load("lib/utils/auth-user-cache.ts", {}, { window });
  cache.writeCachedAuthUser(cached(a));
  const Component = load(
    "context/AuthProvider.tsx",
    {
      react: host.react,
      "@/actions/session.action": {},
      sonner: { toast: { error() {}, info() {} } },
    },
    { window },
  ).default;
  const render = () => host.render(() => Component({ children: "test" }));
  render();
  assert.equal(render().props.value.user.currentUserId, a);
  cache.publishAuthSessionChange(b);
  listeners.get("storage")({ key: cache.AUTH_SESSION_CHANGE_KEY });
  assert.equal(render().props.value.user.currentUserId, "");
  assert.deepEqual(navigations, ["/home"]);
  host.unmount();
  assert.equal(listeners.size, 0);
});
test("returning to an anonymous signup or password-recovery tab does not redirect or discard the form", async () => {
  const host = hooks(),
    listeners = new Map(),
    navigations = [];
  let checks = 0;
  const window = {
    localStorage: storage(),
    sessionStorage: storage(),
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener() {},
    location: { assign: (path) => navigations.push(path) },
  };
  const Component = load(
    "context/AuthProvider.tsx",
    {
      react: host.react,
      "@/actions/session.action": {
        getCurrentSessionUserAction: async () => {
          checks++;
          return null;
        },
      },
      sonner: { toast: { error() {}, info() {} } },
    },
    { window },
  ).default;
  host.render(() => Component({ children: "registration draft" }));
  await flush();
  listeners.get("focus")();
  await flush();
  assert.equal(checks, 1);
  assert.equal(navigations.length, 0);
  host.unmount();
});
test("focusing an authenticated tab rechecks the cookie identity when cross-tab storage events are unavailable", async () => {
  const host = hooks(), listeners = new Map(), navigations = [];
  const window = { sessionStorage: storage(), addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener() {}, location: { assign: path => navigations.push(path) } };
  const cache = load("lib/utils/auth-user-cache.ts", {}, { window });
  cache.writeCachedAuthUser(cached(a));
  const Component = load("context/AuthProvider.tsx", {
    react: host.react,
    "@/actions/session.action": { getCurrentSessionUserAction: async () => ({ status: "7400", response: { _id: b } }) },
    sonner: { toast: { error() {}, info() {} } },
  }, { window }).default;
  const render = () => host.render(() => Component({ children: "test" }));
  render(); render();
  listeners.get("focus")();
  await flush();
  assert.equal(render().props.value.user.currentUserId, "");
  assert.deepEqual(navigations, ["/home"]);
  host.unmount();
});
test("chat sockets use server-verified identity and ignore other rooms and messages after unmount", () => {
  const host = hooks(), events = new Map(), emitted = []; let disconnected = false;
  const socket = { on: (name, fn) => events.set(name, fn), emit: (...args) => emitted.push(args), disconnect: () => { disconnected = true; } };
  const Component = load("components/widgets/chat/ChatRoom.tsx", {
    react: host.react, "next/link": "link", "next/navigation": { useRouter: () => ({}) },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
    "@/context/AuthProvider": { useUserContext: () => ({ user: { currentUserId: b } }) },
    "@/components/ui/button": { Button: "button" }, "@/components/ui/alert-dialog": {},
    "@/actions/chat.action": {}, "./ChatHeaderActions": "header", "./ChatComposer": "composer", "./ChatMessageMedia": "media",
    "socket.io-client": { io: () => socket }, "lucide-react": {}, "date-fns": { format: () => "date" }, sonner: { toast: { error() {}, success() {} } },
  }, { requestAnimationFrame: fn => fn() }).default;
  const props = { roomId, initialType: "chat", initialMessages: [], initialMembers: [{ userId: a }, { userId: b, userName: "Recipient" }], initialChatInfo: { type: "CHAT" }, initialGroupChatDetails: null, currentUser: { _id: a, userName: "A" } };
  const render = () => host.render(() => Component(props));
  render();
  events.get("connect")();
  assert.equal(emitted[0][1].userId, a);
  events.get("newMessage")({ _id: "one", roomId, content: "Current room" });
  assert.ok(JSON.stringify(render()).includes("Current room"));
  events.get("newMessage")({ _id: "two", roomId: b, content: "Other room private message" });
  assert.equal(JSON.stringify(render()).includes("Other room private message"), false);
  host.unmount();
  assert.equal(disconnected, true);
  events.get("newMessage")({ _id: "late", roomId, content: "Late message" });
  assert.equal(host.lateWrites(), 0);
});
