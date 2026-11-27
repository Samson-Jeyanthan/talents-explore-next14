const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const userId = "111111111111111111111111";
const postId = "222222222222222222222222";
const otherId = "333333333333333333333333";
function load(file, mocks, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (name) => mocks[name] || {},
      AbortSignal,
      Error,
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      ...globals,
    },
  );
  return module.exports;
}
function server(reply, viewer = userId) {
  const calls = [],
    paths = [];
  const actions = load(
    "actions/post.action.tsx",
    {
      "next/cache": { revalidatePath: (...args) => paths.push(args) },
      "./account-access.action": {
        getCurrentAccountAccessAction: async () => ({
          _id: userId,
          isTalent: true,
        }),
      },
      "@/lib/session": {
        getAuthHeaders: async () => ({ Authorization: "Bearer test" }),
      },
      "./tokenAndHeaders.action": {
        resolveViewerIdAction: async () => {
          if (viewer instanceof Error) throw viewer;
          return viewer;
        },
      },
      "next/dist/client/components/redirect": {
        isRedirectError: (error) => error?.digest === "NEXT_REDIRECT",
      },
    },
    {
      fetch: async (url, options) => {
        calls.push({ url, options });
        if (reply instanceof Error) throw reply;
        return reply;
      },
    },
  );
  return { ...actions, calls, paths };
}
const ok = () => ({ ok: true, json: async () => ({ status: "7400" }) });
test("pin and unpin use authenticated identity and invalidate profile and post views only on success", async () => {
  for (const [action, endpoint] of [
    ["addPostToBestWorkAction", "addToBestWork"],
    ["removeFromBestWorkAction", "removeFromBestWork"],
  ]) {
    const h = server(ok());
    const result = await h[action](userId, postId);
    assert.equal(result.status, "7400");
    assert.equal(h.calls[0].url, `https://backend.test/te-post/${endpoint}`);
    assert.deepEqual(JSON.parse(h.calls[0].options.body), { userId, postId });
    assert.equal(h.calls[0].options.headers.Authorization, "Bearer test");
    assert.equal(h.calls[0].options.method, "POST");
    assert.equal(h.calls[0].options.cache, "no-store");
    assert.ok(h.calls[0].options.signal);
    assert.ok(
      h.paths.some(
        ([path, type]) =>
          path === "/profile/[username]/[userId]" && type === "layout",
      ),
    );
    assert.ok(h.paths.some(([path]) => path === `/post/${postId}`));
  }
});
test("HTTP, business, malformed JSON and network failures return explicit errors without invalidation", async () => {
  for (const reply of [
    { ok: false, json: async () => ({ status: "7400" }) },
    {
      ok: true,
      json: async () => ({
        status: "7407",
        message: "Best Work limit reached",
      }),
    },
    { ok: true, json: async () => null },
    {
      ok: true,
      json: async () => {
        throw Error("Invalid JSON");
      },
    },
    Error("Offline"),
  ]) {
    for (const action of [
      "addPostToBestWorkAction",
      "removeFromBestWorkAction",
    ]) {
      const h = server(reply);
      const result = await h[action](userId, postId);
      assert.notEqual(result.status, "7400");
      assert.ok(result.message);
      assert.equal(h.paths.length, 0);
      if (
        !(reply instanceof Error) &&
        (await reply.json().catch(() => null))?.status === "7407"
      )
        assert.equal(result.message, "Best Work limit reached");
    }
  }
});
test("invalid IDs and mismatched authenticated users never issue mutations", async () => {
  const h = server(ok(), otherId);
  assert.notEqual(
    (await h.addPostToBestWorkAction(userId, postId)).status,
    "7400",
  );
  assert.notEqual(
    (await h.removeFromBestWorkAction(userId, "../bad")).status,
    "7400",
  );
  assert.notEqual((await h.addPostToBestWorkAction("", postId)).status, "7400");
  assert.equal(h.calls.length, 0);
});
test("authentication redirects propagate instead of being swallowed", async () => {
  const error = Object.assign(Error("Refresh"), { digest: "NEXT_REDIRECT" });
  const h = server(ok(), error);
  await assert.rejects(
    h.addPostToBestWorkAction(userId, postId),
    (e) => e === error,
  );
});

function hooks() {
  const cells = [];
  let cursor = 0,
    effects = [];
  const changed = (a, b) => !a || a.some((v, i) => !Object.is(v, b[i]));
  return {
    react: {
      useState(value) {
        const i = cursor++;
        if (!(i in cells)) cells[i] = value;
        return [
          cells[i],
          (next) => {
            cells[i] = typeof next === "function" ? next(cells[i]) : next;
          },
        ];
      },
      useRef(value) {
        return (cells[cursor++] ||= { current: value });
      },
      useMemo(fn, deps) {
        const i = cursor++;
        if (changed(cells[i]?.deps, deps)) cells[i] = { deps, value: fn() };
        return cells[i].value;
      },
      useEffect(fn, deps) {
        const i = cursor++;
        if (changed(cells[i]?.deps, deps)) {
          const old = cells[i];
          cells[i] = { deps, fn };
          effects.push(() => {
            old?.cleanup?.();
            cells[i].cleanup = fn();
          });
        }
      },
    },
    render(fn) {
      cursor = 0;
      const result = fn();
      const pending = effects;
      effects = [];
      pending.forEach((f) => f());
      return result;
    },
    unmount() {
      cells.forEach((c) => c?.cleanup?.());
    },
    replayEffects() {
      cells
        .filter((c) => c?.fn)
        .forEach((c) => {
          c.cleanup?.();
          c.cleanup = c.fn();
        });
    },
  };
}
function client(initialPinned = false, canPin = true) {
  const host = hooks(),
    calls = [],
    messages = [];
  let refreshes = 0;
  const hook = load("lib/hooks/useBestWorkPin.ts", {
    react: host.react,
    "@/actions/post.action": Object.fromEntries(
      [
        ["addPostToBestWorkAction", "pin"],
        ["removeFromBestWorkAction", "unpin"],
      ].map(([name, kind]) => [
        name,
        (...args) =>
          new Promise((resolve, reject) =>
            calls.push({ kind, args, resolve, reject }),
          ),
      ]),
    ),
    "next/navigation": {
      useRouter: () => ({
        refresh() {
          refreshes++;
        },
      }),
    },
    sonner: {
      toast: {
        success: (message) => messages.push(["success", message]),
        error: (message) => messages.push(["error", message]),
      },
    },
  }).useBestWorkPin;
  const props = { postId, userId, initialPinned, canPin };
  const render = () =>
    host.render(() =>
      hook(props.postId, props.userId, props.initialPinned, props.canPin),
    );
  return { host, calls, props, render, messages, refreshes: () => refreshes };
}
test("pin and unpin wait for acknowledgement, block duplicate clicks, then refresh confirmed state", async () => {
  const h = client();
  const pin = h.render().togglePin();
  await h.render().togglePin();
  assert.equal(h.calls.length, 1);
  assert.equal(h.render().pinning, true);
  assert.equal(h.render().isPinned, false);
  h.calls[0].resolve({ status: "7400", message: "Pinned" });
  await pin;
  assert.equal(h.render().isPinned, true);
  assert.equal(h.render().pinning, false);
  assert.equal(h.refreshes(), 1);
  const unpin = h.render().togglePin();
  assert.equal(h.calls[1].kind, "unpin");
  assert.equal(h.render().isPinned, true);
  h.calls[1].resolve({ status: "7400", message: "Removed" });
  await unpin;
  assert.equal(h.render().isPinned, false);
  assert.equal(h.refreshes(), 2);
});
test("failed, missing and thrown responses preserve previous pin state and allow retry", async () => {
  for (const pinned of [true, false])
    for (const response of [
      undefined,
      { status: "7407", message: "Limit reached" },
      Error("Offline"),
    ]) {
      const h = client(pinned);
      const pending = h.render().togglePin();
      if (response instanceof Error) h.calls[0].reject(response);
      else h.calls[0].resolve(response);
      await pending;
      assert.equal(h.render().isPinned, pinned);
      assert.equal(h.render().pinning, false);
      assert.equal(h.messages[0][0], "error");
      assert.equal(h.refreshes(), 0);
      const retry = h.render().togglePin();
      h.calls[1].resolve({ status: "7400", message: "Saved" });
      await retry;
      assert.equal(h.render().isPinned, !pinned);
    }
});
test("server props synchronize the menu and late responses cannot change a different post or account", async () => {
  const h = client();
  const old = h.render().togglePin();
  h.props.postId = otherId;
  h.props.initialPinned = true;
  assert.equal(h.render().isPinned, true);
  const next = h.render().togglePin();
  h.calls[0].resolve({ status: "7400", message: "Old" });
  await old;
  assert.equal(h.render().pinning, true);
  assert.equal(h.messages.length, 0);
  h.calls[1].resolve({ status: "7400", message: "New" });
  await next;
  assert.equal(h.render().isPinned, false);
  h.props.initialPinned = false;
  assert.equal(h.render().isPinned, false);
  const previousAccount = h.render().togglePin();
  h.props.userId = otherId;
  h.render();
  h.calls[2].resolve({ status: "7400", message: "Old account" });
  await previousAccount;
  assert.equal(h.render().isPinned, false);
});
test("unmounted requests stay quiet and Strict Mode effect replay keeps pinning functional", async () => {
  const h = client();
  h.render();
  h.host.replayEffects();
  const pending = h.render().togglePin();
  assert.equal(h.calls.length, 1);
  h.host.unmount();
  h.calls[0].resolve({ status: "7400", message: "Saved" });
  await pending;
  assert.equal(h.messages.length, 0);
  assert.equal(h.refreshes(), 0);
});
test("visitors, shared links and signed-out users cannot pin", async () => {
  const visitor = client(false, false);
  await visitor.render().togglePin();
  assert.equal(visitor.calls.length, 0);
  const signedOut = client();
  signedOut.props.userId = "";
  await signedOut.render().togglePin();
  assert.equal(signedOut.calls.length, 0);
});

test("post menu exposes pending progress, disables actions, and keeps shared-link pinning hidden", () => {
  const host = hooks();
  let pinState = { isPinned: false, pinning: true, togglePin: () => {} };
  let type = "POST";
  let isTalent = true;
  const jsx = (type, props) => ({ type, props });
  const Menu = load("components/options/PostOptions.tsx", {
    react: { ...host.react, default: { Fragment: "Fragment" } },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@/components/ui/menubar": Object.fromEntries(
      [
        "Menubar",
        "MenubarContent",
        "MenubarItem",
        "MenubarMenu",
        "MenubarTrigger",
      ].map((name) => [name, name]),
    ),
    "@/constants": {
      POST_OPTIONS: [0, 1, 2, 3].map((id) => ({
        id,
        name: `Option ${id}`,
        isOwnPost: true,
        icon: "icon",
      })),
    },
    "@/context/AuthProvider": {
      useUserContext: () => ({ user: { currentUserId: userId, isTalent } }),
    },
    "@/lib/hooks/useBestWorkPin": {
      useBestWorkPin: (post, user, pinned, allowed) => {
        assert.equal(allowed, isTalent && type !== "SHARELINK");
        return pinState;
      },
    },
    "@/lib/utils": { cn: (value) => value },
    "next/navigation": { useRouter: () => ({}), usePathname: () => "/home" },
  }).default;
  function all(tree, predicate) {
    if (!tree || typeof tree !== "object") return [];
    if (Array.isArray(tree))
      return tree.flatMap((child) => all(child, predicate));
    return [
      ...(predicate(tree) ? [tree] : []),
      ...all(tree.props?.children, predicate),
    ];
  }
  const render = () =>
    host.render(() =>
      Menu({ authorId: userId, postId, isBestWork: false, postType: type }),
    );
  let tree = render();
  assert.equal(
    all(tree, (n) => n.type === "MenubarTrigger")[0].props["aria-busy"],
    true,
  );
  assert.equal(
    all(tree, (n) => n.type === "MenubarTrigger")[0].props["aria-label"],
    "Saving Best Work",
  );
  assert.ok(
    all(tree, (n) => n.type === "MenubarItem").every((n) => n.props.disabled),
  );
  assert.equal(
    all(tree, (n) => n.type === "p")[0].props.children,
    "Pinning...",
  );
  pinState = { ...pinState, isPinned: true };
  assert.equal(
    all(render(), (n) => n.type === "p")[0].props.children,
    "Removing pin...",
  );
  pinState = { ...pinState, pinning: false };
  tree = render();
  assert.equal(
    all(tree, (n) => n.type === "p")[0].props.children,
    "Remove Pin",
  );
  assert.ok(
    all(tree, (n) => n.type === "MenubarItem").every((n) => !n.props.disabled),
  );
  type = "SHARELINK";
  assert.equal(all(render(), (n) => n.type === "MenubarItem").length, 3);
  isTalent = false;
  assert.equal(all(render(), (n) => n.type === "MenubarItem").length, 3);
  type = "POST";
  assert.equal(all(render(), (n) => n.type === "MenubarItem").length, 2);
});
