const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
const profile = "6aff08a32e63b493d0e6e337",
  first = "6aff08a32e63b493d0e6e339",
  second = "6aff08a32e63b493d0e6e340";
const nativeFile = globalThis.File || require("node:buffer").File;
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
      require: (name) => {
        if (name in mocks) return mocks[name];
        if (name.startsWith("@/") || name.startsWith(".")) {
          const base = name.startsWith("@/")
            ? name.slice(2)
            : path.join(path.dirname(file), name);
          const target = [base, base + ".ts", base + ".tsx"].find(
            (file) => fs.existsSync(file) && fs.statSync(file).isFile(),
          );
          if (target) return load(target, mocks, globals);
        }
        return require(name);
      },
      Error,
      File: nativeFile,
      URL,
      AbortSignal,
      console,
      ...globals,
    },
  );
  return module.exports;
}
const util = load("lib/utils/profile-feed.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
function hooks() {
  const cells = [];
  let cursor = 0,
    effects = [];
  const changed = (a, b) =>
    !a ||
    a.length !== b.length ||
    a.some((value, i) => !Object.is(value, b[i]));
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
      useMemo(fn, deps) {
        const i = cursor++;
        if (changed(cells[i]?.deps, deps)) cells[i] = { deps, value: fn() };
        return cells[i].value;
      },
      useRef(initial) {
        const i = cursor++;
        return (cells[i] ||= { current: initial });
      },
      useId() {
        return `field-${cursor++}`;
      },
      useEffect(fn, deps) {
        const i = cursor++;
        if (changed(cells[i]?.deps, deps)) {
          const old = cells[i];
          cells[i] = { deps };
          effects.push(() => {
            old?.cleanup?.();
            cells[i].cleanup = fn();
          });
        }
      },
    },
    render(fn) {
      cursor = 0;
      const tree = fn(),
        pending = effects;
      effects = [];
      pending.forEach((fn) => fn());
      return tree;
    },
    unmount() {
      cells.forEach((cell) => cell?.cleanup?.());
    },
  };
}
function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return;
  if (Array.isArray(tree)) {
    for (const child of tree) {
      const result = find(child, predicate);
      if (result) return result;
    }
    return;
  }
  return predicate(tree) ? tree : find(tree.props?.children, predicate);
}
const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
const ui = {
  "react/jsx-runtime": jsx,
  "@/components/ui/button": { Button: "button" },
  "@/components/ui/input": { Input: "input" },
  "@/components/ui/dialog": Object.fromEntries(
    [
      "Dialog",
      "DialogContent",
      "DialogHeader",
      "DialogTitle",
      "DialogDescription",
    ].map((name) => [name, name]),
  ),
  "@/components/ui/alert-dialog": Object.fromEntries(
    [
      "AlertDialog",
      "AlertDialogContent",
      "AlertDialogHeader",
      "AlertDialogTitle",
      "AlertDialogDescription",
      "AlertDialogFooter",
    ].map((name) => [name, name]),
  ),
};

const post = (n = 1) => ({
  _id: n.toString(16).padStart(24, "0"),
  author: { _id: first, userName: "qa-author" },
  about: {
    title: `Post ${n}`,
    description: "QA description",
    country: "Sri Lanka",
    state: "Colombo",
  },
  media: [{ mediaType: "image", url: "https://example.test/photo.jpg" }],
  postRating: 4.5,
  numberOfRating: 3,
  timeAgo: "Today",
  website: null,
});
const rows = (start = 1, count = 10) =>
  Array.from({ length: count }, (_, index) => post(start + index));
const ok = (response) => ({ status: "7400", response });
const viewer = () => ({ _id: first });
const target = (privacy = {}, following = false) => ({
  _id: profile,
  privacySettings: privacy,
  isFollowing: following,
});
function api(responses = [], authError) {
  const calls = [],
    logs = [];
  let auth = 0;
  const actions = load(
    "actions/profile-feed.action.ts",
    {
      "@/lib/session": {
        getAuthHeaders: async () => {
          auth++;
          if (authError) throw authError;
          return { Authorization: "Bearer private-token" };
        },
      },
      "next/dist/client/components/redirect": {
        isRedirectError: (error) => error?.digest?.startsWith("NEXT_REDIRECT"),
      },
    },
    {
      URLSearchParams,
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      console: {
        log: (...args) => logs.push(args),
        error: (...args) => logs.push(args),
      },
      fetch: async (url, options) => {
        calls.push({ url, options });
        const result = responses.shift();
        if (result instanceof Error) throw result;
        return {
          ok: result?.httpStatus ? result.httpStatus < 400 : true,
          json: async () => result,
        };
      },
    },
  );
  return { actions, calls, logs, auth: () => auth };
}
test("profile pages use mobile endpoints, page size ten and the authenticated viewer", async () => {
  for (const kind of ["all", "credit", "sharelink"]) {
    const h = api([
      ok(viewer()),
      ok({ ...target(), isTalent: true }),
      ok(rows()),
    ]);
    const result = await h.actions.getProfilePostPageAction(profile, kind, 2);
    assert.equal(result.status, "7400");
    assert.equal(result.response.length, 10);
    const url = new URL(h.calls[2].url);
    assert.equal(url.pathname, `/feeds/profile/${kind}`);
    assert.equal(url.searchParams.get("pageNo"), "2");
    assert.equal(url.searchParams.get("pageSize"), "10");
    assert.equal(url.searchParams.get("viewUserId"), first);
    assert.equal(url.searchParams.get("userId"), profile);
    assert.ok(
      h.calls.every(
        (call) =>
          call.options.cache === "no-store" &&
          call.options.headers.Authorization === "Bearer private-token",
      ),
    );
    assert.equal(JSON.stringify(result).includes("private-token"), false);
    assert.equal(h.logs.length, 0);
  }
});
test("invalid profile IDs, tabs and page numbers never authenticate or fetch", async () => {
  const h = api();
  for (const [id, kind, page] of [
    ["token", "all", 1],
    [profile, "bad", 1],
    [profile, "all", 0],
    [profile, "all", -1],
    [profile, "all", 1.5],
    [profile, "all", NaN],
    [profile, "all", 100001],
  ])
    assert.equal(
      (await h.actions.getProfilePostPageAction(id, kind, page)).status,
      "400",
    );
  assert.equal(h.auth(), 0);
  assert.equal(h.calls.length, 0);
});
test("private profiles, posts and credits never request the feed", async () => {
  for (const [kind, privacy] of [
    ["all", { profileView: "NO_ONE" }],
    ["all", { postView: "NO_ONE" }],
    ["credit", { postShare: "NO_ONE" }],
    ["all", { postView: "FOLLOW" }],
  ]) {
    const h = api([ok(viewer()), ok(target(privacy))]);
    assert.equal(
      (await h.actions.getProfilePostPageAction(profile, kind, 2)).status,
      "private",
    );
    assert.equal(h.calls.length, 2);
  }
});
test("owners retain access and follower-restricted feeds require the authenticated relationship", async () => {
  const own = api([
    ok({
      _id: profile,
      privacySettings: { profileView: "NO_ONE", postView: "NO_ONE" },
    }),
    ok(rows()),
  ]);
  assert.equal(
    (await own.actions.getProfilePostPageAction(profile, "all", 1)).status,
    "7400",
  );
  assert.equal(own.calls.length, 2);
  const follower = api([
    ok(viewer()),
    ok(target({ postView: "FOLLOW" }, true)),
    ok([]),
  ]);
  assert.equal(
    (await follower.actions.getProfilePostPageAction(profile, "all", 1)).status,
    "7400",
  );
});
test("privacy is rechecked on later pages and revocation cannot fetch additional posts", async () => {
  const h = api([
    ok(viewer()),
    ok(target()),
    ok(rows()),
    ok(viewer()),
    ok(target({ postView: "NO_ONE" })),
  ]);
  assert.equal(
    (await h.actions.getProfilePostPageAction(profile, "all", 1)).status,
    "7400",
  );
  assert.equal(
    (await h.actions.getProfilePostPageAction(profile, "all", 2)).status,
    "private",
  );
  assert.equal(
    h.calls.filter((call) => call.url.includes("/feeds/")).length,
    1,
  );
});
test("outages, HTTP failures, backend errors and malformed rows remain errors rather than empty pages", async () => {
  for (const response of [
    new Error("Offline"),
    { status: "400" },
    { ...ok([]), httpStatus: 500 },
    ok({}),
    ok([null]),
    ok([{ ...post(), about: { title: { bad: "value" } } }]),
  ]) {
    const h = api([ok(viewer()), ok(target()), response]);
    assert.equal(
      (await h.actions.getProfilePostPageAction(profile, "all", 2)).status,
      "400",
    );
  }
  assert.deepEqual(
    plain(
      await api([
        ok(viewer()),
        ok(target()),
        ok([]),
      ]).actions.getProfilePostPageAction(profile, "all", 1),
    ),
    ok([]),
  );
});
test("failed identity and profile reads stop before requesting posts, and auth redirects propagate", async () => {
  for (const responses of [
    [ok({ _id: "" })],
    [{ status: "400" }],
    [ok(viewer()), ok({ _id: second })],
  ]) {
    const h = api(responses);
    assert.equal(
      (await h.actions.getProfilePostPageAction(profile, "all", 1)).status,
      "400",
    );
    assert.equal(
      h.calls.some((call) => call.url.includes("/feeds/")),
      false,
    );
  }
  const redirect = Object.assign(new Error("Redirect"), {
    digest: "NEXT_REDIRECT;replace;/session/refresh;307;",
  });
  await assert.rejects(
    api([], redirect).actions.getProfilePostPageAction(profile, "all", 1),
    (error) => error === redirect,
  );
});
test("legacy IDs and missing media normalize safely, while video and shared-link thumbnails are retained", () => {
  const legacy = {
    ...post(),
    _id: undefined,
    postId: second,
    media: undefined,
  };
  const normalized = util.profilePostRows([legacy]);
  assert.equal(normalized[0]._id, second);
  assert.deepEqual(plain(normalized[0].media), []);
  assert.equal(legacy.media, undefined);
  assert.equal(
    util.profilePostThumbnail(post()),
    "https://example.test/photo.jpg",
  );
  assert.equal(
    util.profilePostThumbnail({
      ...post(),
      media: [
        { mediaType: "video", thumbnailUrl: "https://example.test/video.jpg" },
      ],
    }),
    "https://example.test/video.jpg",
  );
  assert.equal(
    util.profilePostThumbnail({
      ...post(),
      media: [],
      website: "https://example.test",
      shareLinkThumbnail: "https://example.test/link.jpg",
    }),
    "https://example.test/link.jpg",
  );
  assert.equal(
    util.profilePostThumbnail({ ...post(), media: [] }),
    "/assets/images/sample-post-img.jpg",
  );
  assert.equal(
    util.profilePostThumbnail({
      ...post(),
      media: [{ mediaType: "image", url: "javascript:alert(1)" }],
    }),
    "/assets/images/sample-post-img.jpg",
  );
});

function feed(initialResult = ok(rows()), request = async () => ok([])) {
  const host = hooks(),
    calls = [];
  const props = { profileId: profile, kind: "all", initialResult };
  const component = load("components/widgets/profile/ProfilePostFeed.tsx", {
    ...ui,
    react: { ...host.react, useCallback: (fn) => fn },
    "@/components/cards/AllPostCard": "card",
    "@/components/others/EmptyDetails": "empty",
    "@/public/assets/svgs/CameraIcon": "camera",
    "@/public/assets/svgs/CreditIcon": "credit",
    "@/public/assets/svgs/LinkIcon": "link",
    "@/actions/profile-feed.action": {
      getProfilePostPageAction: async (id, kind, page) => {
        calls.push({ id, kind, page });
        return request(id, kind, page);
      },
    },
  }).default;
  const render = () => host.render(() => component(props));
  render();
  const next = () =>
    find(render(), (node) => node.type === "button").props.onClick();
  const cards = () => {
    const found = [];
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (node.type === "card") found.push(node.props.allPostCard);
      walk(node.props?.children);
    };
    walk(render());
    return found;
  };
  return { host, props, render, next, cards, calls };
}
test("page two appends unique posts and the short final page stops further requests", async () => {
  const h = feed(ok(rows()), async () => ok([post(10), post(11)]));
  await h.next();
  assert.equal(h.calls[0].page, 2);
  assert.equal(h.cards().length, 11);
  assert.equal(
    find(h.render(), (node) => node.type === "button"),
    undefined,
  );
  assert.equal(h.cards()[10]._id, post(11)._id);
});
test("a failed later page preserves loaded cards and retries the same page", async () => {
  let failed = true;
  const h = feed(ok(rows()), async () =>
    failed ? { status: "400", message: "Offline" } : ok([post(11)]),
  );
  await h.next();
  assert.equal(h.cards().length, 10);
  assert.ok(find(h.render(), (node) => node.props?.role === "alert"));
  assert.equal(
    find(h.render(), (node) => node.type === "button").props.children,
    "Try again",
  );
  failed = false;
  await h.next();
  assert.deepEqual(
    h.calls.map((call) => call.page),
    [2, 2],
  );
  assert.equal(h.cards().length, 11);
});
test("first-page errors retry page one and genuine emptiness uses the existing empty state", async () => {
  const h = feed({ status: "400", message: "Offline" });
  assert.ok(find(h.render(), (node) => node.props?.role === "alert"));
  assert.equal(
    find(h.render(), (node) => node.type === "empty"),
    undefined,
  );
  await h.next();
  assert.equal(h.calls[0].page, 1);
  assert.ok(find(h.render(), (node) => node.type === "empty"));
  assert.equal(
    find(h.render(), (node) => node.type === "button"),
    undefined,
  );
});
test("duplicate loads issue one request and an empty later page keeps existing posts", async () => {
  let finish;
  const h = feed(
    ok(rows()),
    () => new Promise((resolve) => (finish = resolve)),
  );
  const pending = h.next();
  h.next();
  assert.equal(h.calls.length, 1);
  assert.equal(
    find(h.render(), (node) => node.type === "button").props.disabled,
    true,
  );
  finish(ok([]));
  await pending;
  assert.equal(h.cards().length, 10);
  assert.equal(
    find(h.render(), (node) => node.type === "button"),
    undefined,
  );
});
test("privacy revocation clears loaded cards and suppresses further pagination", async () => {
  const h = feed(ok(rows()), async () => ({
    status: "private",
    message: "Private posts",
  }));
  await h.next();
  assert.equal(h.cards().length, 0);
  assert.equal(
    find(h.render(), (node) => node.type === "button"),
    undefined,
  );
  assert.equal(h.render().props.children, "Private posts");
});
test("late responses from another profile cannot replace or unlock the current request", async () => {
  const finishes = [];
  const h = feed(
    ok(rows()),
    () => new Promise((resolve) => finishes.push(resolve)),
  );
  const old = h.next();
  h.props.profileId = second;
  h.props.kind = "credit";
  h.props.initialResult = ok(rows(40));
  h.render();
  const current = h.next();
  finishes[0]({ status: "private", message: "Old profile private" });
  await old;
  assert.equal(h.cards()[0]._id, post(40)._id);
  assert.equal(
    find(h.render(), (node) => node.type === "button").props.disabled,
    true,
  );
  finishes[1](ok([post(50)]));
  await current;
  assert.equal(h.cards().length, 11);
  assert.equal(h.calls[1].kind, "credit");
  assert.equal(h.calls[1].id, second);
});
test("refreshing server data resets pagination and unmounting discards pending results", async () => {
  let finish;
  const h = feed(
    ok(rows()),
    () => new Promise((resolve) => (finish = resolve)),
  );
  const pending = h.next();
  h.props.initialResult = ok(rows(60, 2));
  h.render();
  finish(ok(rows(20)));
  await pending;
  assert.deepEqual(
    h.cards().map((row) => row._id),
    rows(60, 2).map((row) => row._id),
  );
  let close;
  const gone = feed(
    ok(rows()),
    () => new Promise((resolve) => (close = resolve)),
  );
  const closing = gone.next();
  gone.host.unmount();
  close(ok([post(11)]));
  await closing;
  assert.equal(gone.cards().length, 10);
});

test("shared links match mobile permissions for owners, talents and regular accounts", async () => {
  for (const data of [
    { ...target(), isTalent: true },
    { ...target(), isTalent: false, permissions: { canShare: true } },
    { ...target(), isTalent: false, canShare: "1" },
  ]) {
    const h = api([ok(viewer()), ok(data), ok([])]);
    assert.equal(
      (await h.actions.getProfilePostPageAction(profile, "sharelink")).status,
      "7400",
    );
  }
  for (const data of [
    { ...target(), isTalent: true, permissions: { canShare: false } },
    { ...target(), isTalent: true, permissions: { canShare: "false" } },
    { ...target(), isTalent: true, canShare: false },
    { ...target(), isTalent: false },
    { ...target({ profileView: "NO_ONE" }), permissions: { canShare: true } },
    { ...target({ profileView: "FOLLOW" }), permissions: { canShare: true } },
  ]) {
    const h = api([ok(viewer()), ok(data)]);
    assert.equal(
      (await h.actions.getProfilePostPageAction(profile, "sharelink")).status,
      "private",
    );
    assert.equal(
      h.calls.some((c) => c.url.includes("/feeds/")),
      false,
    );
  }
  const own = api([
    ok({
      _id: profile,
      isTalent: false,
      privacySettings: { profileView: "NO_ONE" },
      permissions: { canShare: false },
    }),
    ok([]),
  ]);
  assert.equal(
    (await own.actions.getProfilePostPageAction(profile, "sharelink")).status,
    "7400",
  );
  const follower = api([
    ok(viewer()),
    ok({
      ...target({ profileView: "FOLLOW" }, true),
      permissions: { canShare: true },
    }),
    ok([]),
  ]);
  assert.equal(
    (await follower.actions.getProfilePostPageAction(profile, "sharelink"))
      .status,
    "7400",
  );
});

test("shared link failures are explicit and successful rows retain URLs and thumbnails", async () => {
  const link = {
    ...post(),
    media: [],
    website: "https://example.test/project",
    shareLinkThumbnail: "https://example.test/link.jpg",
  };
  const success = api([
    ok(viewer()),
    ok({ ...target(), isTalent: true }),
    ok([link]),
  ]);
  const result = await success.actions.getProfilePostPageAction(
    profile,
    "sharelink",
  );
  assert.equal(result.response[0].website, link.website);
  assert.equal(
    util.profilePostThumbnail(result.response[0]),
    link.shareLinkThumbnail,
  );
  const failed = api([
    ok(viewer()),
    ok({ ...target(), isTalent: true }),
    Error("Offline"),
  ]);
  const error = await failed.actions.getProfilePostPageAction(
    profile,
    "sharelink",
  );
  assert.equal(error.status, "400");
  assert.match(error.message, /shared links/);
});

test("shared link pagination retries page two without dropping cards and has a distinct empty state", async () => {
  let fails = true;
  const h = feed(ok(rows()), async () =>
    fails
      ? { status: "400", message: "Links unavailable" }
      : ok([post(10), post(11)]),
  );
  h.props.kind = "sharelink";
  h.render();
  await h.next();
  assert.equal(h.cards().length, 10);
  assert.ok(find(h.render(), (n) => n.props?.role === "alert"));
  fails = false;
  await h.next();
  assert.deepEqual(
    h.calls.map((c) => [c.kind, c.page]),
    [
      ["sharelink", 2],
      ["sharelink", 2],
    ],
  );
  assert.equal(h.cards().length, 11);
  const empty = feed(ok([]));
  empty.props.kind = "sharelink";
  const view = find(empty.render(), (n) => n.type === "empty");
  assert.equal(view.props.text, "No Shared Links Available");
  assert.equal(view.props.Icon, "link");
});

test("profile navigation exposes Shared Links to regular owners and permitted visitors without talent-only tabs", () => {
  const tabs = load("lib/utils/profile-tabs.ts").getProfileTabs;
  const titles = (values) => values.map((t) => t.title).join(",");
  assert.equal(
    titles(tabs({ isTalent: true }, true, "qa-user", profile)),
    "Overview,All Posts,Shared Links,Credits,Skills",
  );
  const own = tabs({ isTalent: false }, true, "qa-user", profile);
  assert.equal(titles(own), "Overview,Shared Links");
  assert.equal(own[1].href, `/profile/qa-user/${profile}/shared-links`);
  assert.equal(
    titles(
      tabs(
        { isTalent: false, permissions: { canShare: true } },
        false,
        "qa-user",
        profile,
      ),
    ),
    "Overview,Shared Links",
  );
  assert.equal(
    titles(
      tabs(
        { isTalent: false, permissions: { canShare: false } },
        false,
        "qa-user",
        profile,
      ),
    ),
    "Overview",
  );
  assert.equal(
    tabs(
      { isTalent: true, permissions: { canShare: false } },
      false,
      "qa-user",
      profile,
    ).some((t) => t.value === "shared-links"),
    false,
  );
  assert.equal(
    tabs(
      { isTalent: true, privacySettings: { profileView: "NO_ONE" } },
      false,
      "qa-user",
      profile,
    ).some((t) => t.value === "shared-links"),
    false,
  );
});

test("shared links route loads its own endpoint and active profile tab is announced", async () => {
  const calls = [];
  const Page = load(
    "app/(root)/profile/[username]/[userId]/shared-links/page.tsx",
    {
      ...ui,
      "@/actions/profile-feed.action": {
        getProfilePostPageAction: async (...args) => {
          calls.push(args);
          return ok([]);
        },
      },
      "@/components/widgets/profile/ProfilePostFeed": "feed",
    },
  ).default;
  const page = await Page({ params: { userId: profile, username: "qa-user" } });
  assert.equal(calls[0].join(","), [profile, "sharelink", 1].join(","));
  assert.equal(page.props.kind, "sharelink");
  const tabs = load("lib/utils/profile-tabs.ts").getProfileTabs(
    { isTalent: true },
    true,
    "qa-user",
    profile,
  );
  const Tabs = load("components/widgets/profile/ProfileTabs.tsx", {
    ...ui,
    react: {},
    "framer-motion": { motion: { div: "div" } },
    "@/lib/utils": { cn: (...args) => args.filter(Boolean).join(" ") },
    "next/link": "link",
    "next/navigation": {
      usePathname: () => `/profile/qa-user/${profile}/shared-links`,
    },
  }).default;
  const tree = Tabs({ tabs });
  const active = find(tree, (n) => n.props?.["aria-current"] === "page");
  assert.equal(active.props.href, `/profile/qa-user/${profile}/shared-links`);
  assert.equal(tree.props["aria-label"], "Profile sections");
});
