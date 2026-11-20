const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const id = "6aff08a32e63b493d0e6e337";
const other = "6aff08a32e63b493d0e6e338";
function load(file, mocks = {}, globals = {}) {
  const testModule = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    {
      module: testModule,
      exports: testModule.exports,
      require: (name) => mocks[name] || require(name),
      Error,
      AbortSignal,
      ...globals,
    },
  );
  return testModule.exports;
}
const utils = load("lib/utils/notifications.ts");
const item = (key = id, status = "2") => ({
  _id: key,
  status,
  type: "post",
  contentId: id,
  message: "Rated your post",
});
const list = (count = 20) =>
  Array.from({ length: count }, (_, i) =>
    item(i.toString(16).padStart(24, "0")),
  );
function api(responses = [], authError) {
  const calls = [];
  const actions = load(
    "actions/notification.action.tsx",
    {
      "@/lib/utils/notifications": utils,
      "@/lib/session": {
        getAuthHeaders: async () => {
          if (authError) throw authError;
          return { Authorization: "Bearer fresh-session" };
        },
      },
      "./tokenAndHeaders.action": {
        resolveViewerIdAction: async () => {
          if (authError) throw authError;
          return "authenticated-viewer";
        },
      },
    },
    {
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      fetch: async (url, options) => {
        calls.push({ url, options });
        const result = responses.shift();
        if (result instanceof Error) throw result;
        return {
          ok: result.httpOk !== false,
          status: result.httpOk === false ? 403 : 200,
          json: async () => result,
        };
      },
    },
  );
  return { actions, calls };
}
test("mobile status 2 means unread for numeric and string API values", () => {
  assert.equal(utils.isUnreadNotification(item(id, "2")), true);
  assert.equal(utils.isUnreadNotification(item(id, 2)), true);
  assert.equal(utils.isUnreadNotification(item(id, "1")), false);
  assert.equal(utils.isUnreadNotification(item(id, 1)), false);
});
test("notification routes match mobile follow, profile, chat, collaboration and post destinations", () => {
  const path = (value) =>
    utils.notificationPath(
      { _id: id, ...value },
      { currentUserId: other, username: "my name" },
    );
  assert.equal(
    path({
      type: "follow",
      contentId: id,
      senderId: other,
      senderUserName: "a/b",
    }),
    `/profile/a%2Fb/${id}`,
  );
  assert.equal(path({ type: "profile" }), `/profile/my%20name/${other}`);
  assert.equal(
    path({ type: "chat", roomId: other, contentId: id }),
    `/chat/${other}?type=chat`,
  );
  assert.equal(
    path({ jsonKey: "messageRequest", roomId: id }),
    `/chat/${id}?type=request`,
  );
  assert.equal(
    path({ type: "collaboration", contentId: id }),
    `/collaboration/${id}`,
  );
  assert.equal(path({ type: "post", contentId: id }), `/post/${id}`);
  assert.equal(path({ type: "report" }), null);
  assert.equal(path({ type: "post", contentId: "../bad" }), null);
});
test("comment aliases and parent post identifiers target the comment section", () => {
  for (const details of [
    { type: "commentReply", parentPostId: id, contentId: other },
    { type: "post", event: "comment", content: { postId: id } },
    { jsonKey: "commentPost", postId: id, contentId: other },
  ])
    assert.equal(
      utils.notificationPath({ _id: id, ...details }),
      `/post/${id}#comments`,
    );
});
test("timestamps avoid duplicated ago and absent timestamps stay absent", () => {
  assert.equal(
    utils.notificationTime({ _id: id, timeAgo: "2 hours ago" }),
    "2 hours ago",
  );
  assert.equal(
    utils.notificationTime({ _id: id, timeAgo: "2 hours" }),
    "2 hours ago",
  );
  assert.equal(
    utils.notificationTime({ _id: id, timeAgo: "Just now" }),
    "Just now",
  );
  assert.equal(utils.notificationTime({ _id: id }), "");
});
test("list errors and malformed data cannot masquerade as an empty inbox", async () => {
  const h = api([
    { status: "7400", response: [] },
    new Error("offline"),
    { status: "7401" },
    { status: "7400", response: [{}] },
  ]);
  assert.equal(
    (await h.actions.getAllNotificationsAction(undefined, 1, 20)).success,
    true,
  );
  for (let i = 0; i < 3; i++)
    assert.equal(
      (await h.actions.getAllNotificationsAction(undefined, 1, 20)).success,
      false,
    );
});
test("deduplicating a full server page preserves the ability to load more", async () => {
  const h = api([
    { status: "7400", response: Array.from({ length: 20 }, () => item()) },
  ]);
  const result = await h.actions.getAllNotificationsAction(undefined, 1, 20);
  assert.equal(result.data.length, 1);
  assert.equal(result.hasMore, true);
});
test("notification mutations use fresh authenticated identity and mobile endpoints", async () => {
  const h = api(
    Array.from({ length: 5 }, () => ({ status: "7400", response: [] })),
  );
  await h.actions.getAllNotificationsAction("untrusted-user", 2, 20);
  await h.actions.markNotificationAsReadAction(id);
  await h.actions.markAllNotificationsAsReadAction();
  await h.actions.deleteNotificationAction(id);
  await h.actions.deleteAllNotificationsAction();
  assert.equal(new URL(h.calls[0].url).searchParams.get("pageNumber"), "2");
  assert.deepEqual(
    h.calls
      .slice(1)
      .map((call) => [new URL(call.url).pathname, call.options.method]),
    [
      [`/notification/markAsRead/authenticated-viewer/${id}`, "PUT"],
      ["/notification/markAsRead/authenticated-viewer", "PUT"],
      [`/notification/authenticated-viewer/${id}`, "DELETE"],
      ["/notification/authenticated-viewer", "DELETE"],
    ],
  );
  for (const call of h.calls) {
    assert.equal(call.options.cache, "no-store");
    assert.equal(call.options.headers.Authorization, "Bearer fresh-session");
  }
});
test("rejected HTTP requests and network errors cannot report successful writes", async () => {
  const h = api([
    { status: "7400", httpOk: false },
    { status: "7401" },
    new Error("offline"),
  ]);
  for (let i = 0; i < 3; i++)
    assert.notEqual(
      (await h.actions.markNotificationAsReadAction(id)).status,
      "7400",
    );
});
test("invalid pages and notification identifiers never reach backend", async () => {
  const h = api();
  await h.actions.getAllNotificationsAction(undefined, 0, 20);
  await h.actions.getAllNotificationsAction(undefined, 1, 101);
  await h.actions.markNotificationAsReadAction("../bad");
  await h.actions.deleteNotificationAction("");
  await h.actions.markNotificationAsReadAction(undefined);
  await h.actions.deleteNotificationAction(undefined);
  assert.equal(h.calls.length, 0);
});
test("expired-session redirects survive notification reads and mutations", async () => {
  const redirect = new Error("redirect");
  redirect.digest = "NEXT_REDIRECT;replace;/sign-in;307;";
  const h = api([], redirect);
  await assert.rejects(
    h.actions.getAllNotificationsAction(undefined, 1, 20),
    (error) => error === redirect,
  );
  await assert.rejects(
    h.actions.markNotificationAsReadAction(id),
    (error) => error === redirect,
  );
});

function hooks() {
  const cells = [];
  let cursor = 0;
  let effects = [];
  const changed = (a, b) =>
    !a || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
  return {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in cells))
          cells[i] = typeof initial === "function" ? initial() : initial;
        return [
          cells[i],
          (value) => {
            cells[i] = typeof value === "function" ? value(cells[i]) : value;
          },
        ];
      },
      useRef(initial) {
        const i = cursor++;
        return (cells[i] ||= { current: initial });
      },
      useEffect(fn, deps) {
        const i = cursor++;
        if (changed(cells[i]?.deps, deps)) {
          const previous = cells[i];
          cells[i] = { deps };
          effects.push(() => {
            previous?.cleanup?.();
            cells[i].cleanup = fn();
          });
        }
      },
      useCallback(fn, deps) {
        const i = cursor++;
        if (changed(cells[i]?.deps, deps)) cells[i] = { deps, fn };
        return cells[i].fn;
      },
    },
    render(fn) {
      cursor = 0;
      const result = fn();
      const pending = effects;
      effects = [];
      pending.forEach((fn) => fn());
      return result;
    },
    unmount() {
      cells.forEach((cell) => cell?.cleanup?.());
    },
  };
}
function inbox(
  initial = { success: true, data: list() },
  readResponses = [],
  writeResponses = [],
) {
  const state = hooks();
  const reads = [];
  const writes = [];
  const next = async (queue) => {
    const value = queue.shift();
    if (value instanceof Error) throw value;
    return typeof value === "function" ? value() : value;
  };
  const write = async (...args) => {
    writes.push(args);
    return next(writeResponses);
  };
  const hook = load("lib/hooks/useNotificationInbox.ts", {
    react: state.react,
    "@/lib/utils/notifications": utils,
    "@/actions/notification.action": {
      getAllNotificationsAction: async (...args) => {
        reads.push(args);
        return next(readResponses);
      },
      markNotificationAsReadAction: write,
      markAllNotificationsAsReadAction: write,
      deleteNotificationAction: write,
      deleteAllNotificationsAction: write,
    },
  });
  const render = () => state.render(() => hook.useNotificationInbox(initial));
  render();
  return { render, reads, writes, unmount: state.unmount };
}
test("failed load more preserves existing rows and retries the same page", async () => {
  const h = inbox(undefined, [
    { success: false, message: "Offline" },
    { success: true, data: [item()] },
  ]);
  await h.render().load();
  assert.equal(h.render().items.length, 20);
  assert.equal(h.render().loadError, "Offline");
  await h.render().load();
  assert.deepEqual(
    h.reads.map((args) => args[1]),
    [2, 2],
  );
  assert.equal(h.render().items.length, 21);
  assert.equal(h.render().hasMore, false);
});
test("failed initial load and refresh retry page one rather than skipping to page two", async () => {
  const h = inbox({ success: false, message: "Offline" }, [
    { success: true, data: list() },
    { success: false, message: "Offline" },
    { success: true, data: list() },
  ]);
  await h.render().load();
  await h.render().load(true);
  await h.render().load();
  assert.deepEqual(
    h.reads.map((args) => args[1]),
    [1, 1, 1],
  );
});
test("read changes wait for acknowledgement, block duplicate writes and preserve unread on failure", async () => {
  let finish;
  const h = inbox(
    { success: true, data: [item()] },
    [],
    [
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
      { status: "7400" },
    ],
  );
  const pending = h.render().mutate("read", id);
  assert.equal(await h.render().mutate("read", id), false);
  assert.equal(h.writes.length, 1);
  assert.equal(utils.isUnreadNotification(h.render().items[0]), true);
  finish({ status: 500, message: "Offline" });
  assert.equal(await pending, false);
  assert.equal(utils.isUnreadNotification(h.render().items[0]), true);
  assert.equal(await h.render().mutate("read", id), true);
  assert.equal(utils.isUnreadNotification(h.render().items[0]), false);
});
test("mark all read updates every loaded row only after success", async () => {
  const h = inbox(
    { success: true, data: [item(), item(other, 2)] },
    [],
    [new Error("Offline"), { status: "7400" }],
  );
  await h.render().mutate("readAll");
  assert.equal(h.render().items.filter(utils.isUnreadNotification).length, 2);
  await h.render().mutate("readAll");
  assert.equal(h.render().items.filter(utils.isUnreadNotification).length, 0);
});
test("failed delete keeps rows; accepted deletion reloads page one to avoid shifted offsets", async () => {
  const h = inbox(
    { success: true, data: [item(), item(other)], hasMore: true },
    [
      { success: false, message: "Offline" },
      { success: true, data: [item(other)] },
    ],
    [{ status: 500 }, { status: "7400" }],
  );
  assert.equal(await h.render().mutate("delete", id), false);
  assert.equal(h.render().items.length, 2);
  assert.equal(await h.render().mutate("delete", id), true);
  assert.equal(h.render().items[0]._id, other);
  await h.render().load();
  assert.deepEqual(
    h.reads.map((args) => args[1]),
    [1, 1],
  );
});
test("delete all retains content on failure and empties only on confirmed success", async () => {
  const h = inbox(undefined, [], [{ status: 500 }, { status: "7400" }]);
  await h.render().mutate("deleteAll");
  assert.equal(h.render().items.length, 20);
  await h.render().mutate("deleteAll");
  assert.equal(h.render().items.length, 0);
  assert.equal(h.render().hasMore, false);
});
test("overlapping reads and writes are serialized and unmounted writes cannot signal navigation", async () => {
  let finish;
  const h = inbox(
    undefined,
    [
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    ],
    [{ status: "7400" }],
  );
  const pending = h.render().load();
  await h.render().load();
  assert.equal(await h.render().mutate("read", id), false);
  assert.equal(h.reads.length, 1);
  finish({ success: true, data: [] });
  await pending;
  h.unmount();
  assert.equal(await h.render().mutate("read", id), false);
});

const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return;
  if (Array.isArray(tree)) {
    for (const node of tree) {
      const found = find(node, predicate);
      if (found) return found;
    }
    return;
  }
  return predicate(tree) ? tree : find(tree.props?.children, predicate);
}
test("read and unread cards expose distinct labels and mark-read controls without overlapping delete", () => {
  const card = load("components/cards/NotificationCard.tsx", {
    "react/jsx-runtime": jsx,
    "../others/UserProfileImg": {},
    "lucide-react": {},
    "@/lib/utils/notifications": utils,
  }).default;
  for (const [status, label] of [
    ["2", "unread"],
    [1, "read"],
  ]) {
    const tree = card({
      notificationCard: item(id, status),
      onOpen() {},
      onDelete() {},
      onMarkRead() {},
    });
    assert.equal(tree.props["data-read-state"], label);
    assert.ok(
      find(tree, (node) =>
        node.props?.["aria-label"]?.startsWith(
          label === "unread" ? "Unread notification" : "Read notification",
        ),
      ),
    );
    assert.equal(
      !!find(
        tree,
        (node) =>
          node.type === "button" && node.props.children === "Mark as read",
      ),
      label === "unread",
    );
  }
});
test("opening unread notification awaits confirmed read before navigation and failure stays in inbox", async () => {
  let finish;
  const routes = [];
  const state = hooks();
  let accepted;
  const component = load("components/widgets/NotificationSheet.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "../cards/NotificationCard": { default: "card", __esModule: true },
    "@/public/assets/svgs": {},
    "../ui/button": {},
    "lucide-react": {},
    "../ui/sheet": {},
    "../ui/alert-dialog": {},
    "@/context/AuthProvider": { useUserContext: () => ({ user: {} }) },
    "next/navigation": {
      usePathname: () => "/home",
      useRouter: () => ({ push: (route) => routes.push(route) }),
    },
    sonner: { toast: { info() {} } },
    "@/lib/utils/notifications": utils,
    "@/lib/hooks/useNotificationInbox": {
      useNotificationInbox: () => ({
        items: [item()],
        mutate: () =>
          new Promise((resolve) => {
            finish = (value) => {
              accepted = value;
              resolve(value);
            };
          }),
      }),
    },
  });
  const render = () =>
    state.render(() =>
      component.default({ data: { success: true, data: [] } }),
    );
  const pending = find(render(), (node) => node.type === "card").props.onOpen(
    item(),
  );
  assert.equal(routes.length, 0);
  finish(false);
  await pending;
  assert.equal(routes.length, 0);
  const retry = find(render(), (node) => node.type === "card").props.onOpen(
    item(),
  );
  finish(true);
  await retry;
  assert.equal(accepted, true);
  assert.deepEqual(routes, [`/post/${id}`]);
});
