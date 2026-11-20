const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const id = "6aff08a32e63b493d0e6e337";
const viewer = "6aff08a32e63b493d0e6e338";
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
const utils = load("lib/utils/connections.ts");
const privacy = load("lib/utils/profilePrivacy.ts", { "./connections": utils });
const row = (key = id, follow = 0) => ({
  _id: key,
  isTalent: true,
  userName: "creator",
  name: "Creator",
  isFollow: follow,
  profileImage: "",
  professional: { professional: "Artist" },
});
const page = (items, hasMore = items.length >= 10) => ({
  status: "7400",
  response: items,
  hasMore,
});
const rows = (count = 10) =>
  Array.from({ length: count }, (_, i) =>
    row(i.toString(16).padStart(24, "0")),
  );
function api(responses = [], authError) {
  const calls = [];
  const invalidations = [];
  const actions = load(
    "actions/connection.action.tsx",
    {
      "@/lib/utils/connections": utils,
      "@/lib/utils/ratings": load("lib/utils/ratings.ts"),
      "@/lib/session": {
        getAuthHeaders: async () => {
          if (authError) throw authError;
          return { Authorization: "Bearer fresh-session" };
        },
      },
      "./tokenAndHeaders.action": {
        resolveViewerIdAction: async () => {
          if (authError) throw authError;
          return viewer;
        },
      },
      "next/cache": { revalidatePath: (...args) => invalidations.push(args) },
    },
    {
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      fetch: async (url, options) => {
        calls.push({ url, options });
        const result = responses.shift();
        if (result instanceof Error) throw result;
        return {
          ok: !result.httpStatus,
          status: result.httpStatus || 200,
          json: async () => result,
        };
      },
    },
  );
  return { actions, calls, invalidations };
}
test("list requests derive viewer from fresh auth instead of trusting supplied viewer", async () => {
  const h = api([page([]), page([])]);
  await h.actions.getFollowerList(id, "untrusted-viewer", 1, 10);
  await h.actions.getFollowingList(id, "untrusted-viewer", 2, 10);
  for (const [index, call] of h.calls.entries()) {
    const url = new URL(call.url);
    assert.equal(url.searchParams.get("viewerId"), viewer);
    assert.equal(url.searchParams.get("userId"), id);
    assert.equal(url.searchParams.get("pageNo"), String(index + 1));
    assert.equal(
      url.pathname,
      `/connect-user/${index ? "followingList" : "followerList"}`,
    );
    assert.equal(call.options.headers.Authorization, "Bearer fresh-session");
    assert.equal(call.options.cache, "no-store");
  }
});
test("follow and unfollow match mobile endpoints and invalidate profile counts only after success", async () => {
  const h = api([{ status: "7400" }, { status: "7401" }, { status: "7400" }]);
  await h.actions.followUserAction(id, "");
  await h.actions.unFollowUserAction(id);
  assert.equal(h.invalidations.length, 1);
  await h.actions.unFollowUserAction(id);
  assert.deepEqual(
    h.calls.map((call) => new URL(call.url).pathname),
    [
      "/connect-user/follow",
      "/connect-user/unfollow",
      "/connect-user/unfollow",
    ],
  );
  for (const call of h.calls) {
    assert.equal(call.options.method, "POST");
    assert.deepEqual(JSON.parse(call.options.body), { followingId: id });
  }
  assert.deepEqual(
    h.invalidations,
    Array.from({ length: 2 }, () => ["/profile/[username]/[userId]", "layout"]),
  );
});
test("invalid targets, self follows and bad page bounds never reach backend", async () => {
  const h = api();
  await h.actions.followUserAction(undefined);
  await h.actions.unFollowUserAction("../bad");
  await h.actions.followUserAction(viewer);
  await h.actions.unFollowUserAction(viewer);
  await h.actions.getFollowerList(undefined, viewer, 1, 10);
  await h.actions.getFollowerList(id, viewer, 0, 10);
  await h.actions.getFollowingList(id, viewer, 1, 101);
  assert.equal(h.calls.length, 0);
});
test("HTTP errors, malformed results and outages are retryable errors rather than empty lists", async () => {
  const h = api([
    page([]),
    new Error("offline"),
    page([{}]),
    { status: "7400", response: [], httpStatus: 500 },
  ]);
  assert.equal(
    (await h.actions.getFollowerList(id, viewer, 1, 10)).status,
    "7400",
  );
  for (let i = 0; i < 3; i++)
    assert.notEqual(
      (await h.actions.getFollowerList(id, viewer, 1, 10)).status,
      "7400",
    );
});
test("private list rejections remain distinct from temporary failures", async () => {
  const h = api([
    { status: "7401", message: "This list is private" },
    { status: "7401", httpStatus: 403 },
    new Error("offline"),
  ]);
  assert.equal(
    (await h.actions.getFollowingList(id, viewer, 1, 10)).restricted,
    true,
  );
  assert.equal(
    (await h.actions.getFollowingList(id, viewer, 1, 10)).restricted,
    true,
  );
  assert.notEqual(
    (await h.actions.getFollowingList(id, viewer, 1, 10)).restricted,
    true,
  );
});
test("expired-session redirects survive lists and writes", async () => {
  const redirect = new Error("redirect");
  redirect.digest = "NEXT_REDIRECT;replace;/sign-in;307;";
  const h = api([], redirect);
  for (const request of [
    h.actions.getFollowerList(id, viewer, 1, 10),
    h.actions.getFollowingList(id, viewer, 1, 10),
    h.actions.followUserAction(id),
    h.actions.unFollowUserAction(id),
  ])
    await assert.rejects(request, (error) => error === redirect);
});
test("HTTP failure cannot be reported as accepted following or invalidate profiles", async () => {
  const h = api([{ status: "7400", httpStatus: 500 }, new Error("offline")]);
  assert.notEqual((await h.actions.followUserAction(id)).status, "7400");
  assert.notEqual((await h.actions.unFollowUserAction(id)).status, "7400");
  assert.equal(h.invalidations.length, 0);
});
test("list normalization handles string flags and absent professional details", () => {
  const result = utils.normalizeConnections([
    { _id: id, isTalent: "false", isFollow: "0" },
    {
      _id: viewer,
      isTalent: "true",
      isFollow: "1",
      professional: "Film director",
    },
  ]);
  assert.equal(result[0].isTalent, false);
  assert.equal(result[0].isFollow, 0);
  assert.equal(result[0].professional.professional, "");
  assert.equal(result[1].isTalent, true);
  assert.equal(result[1].isFollow, 1);
  assert.equal(result[1].professional.professional, "Film director");
});
test("deduplicating a full page does not stop pagination prematurely", async () => {
  const h = api([page(Array.from({ length: 10 }, () => row()))]);
  const controller = new utils.ConnectionPages();
  await controller.load(() => h.actions.getFollowerList(id, viewer, 1, 10));
  assert.equal(controller.snapshot().items.length, 1);
  assert.equal(controller.snapshot().hasMore, true);
});
test("list pages deduplicate overlaps, retain rows on failure and retry the same page", async () => {
  const controller = new utils.ConnectionPages();
  const requested = [];
  await controller.load(async (number) => {
    requested.push(number);
    return page(rows());
  });
  await controller.load(async (number) => {
    requested.push(number);
    return { status: 500, message: "Offline" };
  });
  assert.equal(controller.snapshot().items.length, 10);
  await controller.load(async (number) => {
    requested.push(number);
    return page([rows()[0], row(id)], false);
  });
  assert.deepEqual(requested, [1, 2, 2]);
  assert.equal(controller.snapshot().items.length, 11);
  assert.equal(controller.snapshot().hasMore, false);
});
test("a rejected first page can be retried and a private rejection hides stale rows", async () => {
  const controller = new utils.ConnectionPages();
  await controller.load(async () => ({ status: 500, message: "Offline" }));
  assert.equal(controller.snapshot().hasMore, true);
  await controller.load(async (number) => {
    assert.equal(number, 1);
    return page(rows());
  });
  await controller.load(async () => ({
    status: 403,
    message: "Private",
    restricted: true,
  }));
  assert.equal(controller.snapshot().restricted, true);
  assert.equal(controller.snapshot().items.length, 0);
});
test("old profile responses and duplicate loads cannot replace or unlock a newer list", async () => {
  const controller = new utils.ConnectionPages();
  let finishOld;
  let finishNew;
  let calls = 0;
  const old = controller.load(() => {
    calls++;
    return new Promise((resolve) => {
      finishOld = resolve;
    });
  });
  await controller.load(async () => {
    calls++;
    return page([]);
  });
  assert.equal(calls, 1);
  controller.reset();
  const current = controller.load(
    () =>
      new Promise((resolve) => {
        finishNew = resolve;
      }),
  );
  finishOld(page([row()]));
  await old;
  assert.equal(controller.snapshot().loading, true);
  assert.equal(controller.snapshot().items.length, 0);
  finishNew(page([row(viewer)], false));
  await current;
  assert.equal(controller.snapshot().items[0]._id, viewer);
});
test("confirmed follow state wins over an older page-one response", async () => {
  const controller = new utils.ConnectionPages();
  let finish;
  const pending = controller.load(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  controller.update(id, true);
  finish(page([row(id, 0)], false));
  await pending;
  assert.equal(controller.snapshot().items[0].isFollow, 1);
});
test("removing an account from own following restarts offsets without discarding remaining rows on failure", async () => {
  const controller = new utils.ConnectionPages();
  await controller.load(async () => page([row(id, 1), row(viewer, 1)], true));
  controller.update(id, false, true);
  controller.reset(true);
  await controller.load(async (number) => {
    assert.equal(number, 1);
    return { status: 500, message: "Offline" };
  });
  assert.equal(controller.snapshot().items.length, 1);
  assert.equal(controller.snapshot().items[0]._id, viewer);
  await controller.load(async (number) => {
    assert.equal(number, 1);
    return page([row(viewer, 1)], false);
  });
});
test("privacy and allowed tabs honor explicit permissions, follow-only access and own profile", () => {
  assert.equal(
    privacy.getProfileVisibilityState(
      { permissions: { canViewFollowers: false } },
      false,
    ).canViewFollowers,
    false,
  );
  assert.equal(
    privacy.getProfileVisibilityState(
      { permissions: { canSeeFollowing: false } },
      false,
    ).canViewFollowings,
    false,
  );
  assert.equal(
    privacy.getProfileVisibilityState(
      { privacySettings: { followers: "FOLLOW" }, isFollowing: "false" },
      false,
    ).canViewFollowers,
    false,
  );
  assert.equal(
    privacy.getProfileVisibilityState(
      { privacySettings: { followers: "FOLLOW" }, isFollowing: true },
      false,
    ).canViewFollowers,
    true,
  );
  assert.equal(
    privacy.getProfileVisibilityState(
      { permissions: { canViewFollowers: false } },
      true,
    ).canViewFollowers,
    true,
  );
  assert.equal(utils.connectionTabs(true, false, false, false).length, 0);
  assert.deepEqual(
    Array.from(utils.connectionTabs(false, true, false, true), (tab) => tab.id),
    [2],
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
function follow(responses, initial = 0) {
  const state = hooks();
  const calls = [];
  const changes = [];
  const props = { userId: id, viewerId: viewer, initial };
  const request = async (kind, target) => {
    calls.push({ kind, target });
    const value = responses.shift();
    if (value instanceof Error) throw value;
    return typeof value === "function" ? value() : value;
  };
  const hook = load("lib/hooks/useFollowConnection.ts", {
    react: state.react,
    "@/lib/utils/connections": utils,
    "@/actions/connection.action": {
      followUserAction: (target) => request("follow", target),
      unFollowUserAction: (target) => request("unfollow", target),
    },
  });
  const render = () =>
    state.render(() =>
      hook.useFollowConnection(
        props.userId,
        props.viewerId,
        props.initial,
        (value) => changes.push(value),
      ),
    );
  render();
  return { render, calls, changes, props, unmount: state.unmount };
}
test("follow waits for acknowledgement and rapid clicks send only one request", async () => {
  let finish;
  const h = follow([
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  ]);
  const pending = h.render().change(true);
  assert.equal(await h.render().change(true), false);
  assert.equal(h.calls.length, 1);
  assert.equal(h.render().following, false);
  assert.equal(h.render().pending, true);
  finish({ status: "7400" });
  assert.equal(await pending, true);
  assert.equal(h.render().following, true);
  assert.deepEqual(h.changes, [true]);
});
test("failed follow and unfollow retain last confirmed state and expose a retry", async () => {
  const h = follow([
    new Error("Offline"),
    { status: "7400" },
    { status: 500, message: "Try later" },
    { status: "7400" },
  ]);
  await h.render().change(true);
  assert.equal(h.render().following, false);
  assert.ok(h.render().error);
  await h.render().change(true);
  assert.equal(h.render().following, true);
  await h.render().change(false);
  assert.equal(h.render().following, true);
  assert.equal(h.render().error, "Try later");
  await h.render().change(false);
  assert.equal(h.render().following, false);
  assert.deepEqual(h.changes, [true, false]);
});
test("incoming follow props synchronize and switching identity ignores obsolete replies", async () => {
  let finish;
  const h = follow([
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  ]);
  h.props.initial = "1";
  h.render();
  assert.equal(h.render().following, true);
  const pending = h.render().change(false);
  h.props.userId = viewer;
  h.props.initial = 0;
  h.render();
  finish({ status: "7400" });
  assert.equal(await pending, false);
  assert.equal(h.render().following, false);
  assert.equal(h.changes.length, 0);
});
test("signed out, self actions and responses after unmount cannot change UI state", async () => {
  const self = follow([]);
  self.props.userId = viewer;
  self.render();
  assert.equal(await self.render().change(true), false);
  assert.equal(self.calls.length, 0);
  self.props.viewerId = "";
  self.render();
  assert.equal(await self.render().change(true), false);
  let finish;
  const h = follow([
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  ]);
  const pending = h.render().change(true);
  h.unmount();
  finish({ status: "7400" });
  assert.equal(await pending, false);
  assert.equal(h.changes.length, 0);
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
test("unfollow confirmation can cancel and remains open after failure until confirmed success", async () => {
  const state = hooks();
  const changes = [];
  let accepted = false;
  let refreshed = 0;
  const button = load("components/buttons/ConnectionButton.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "../ui/button": { Button: "button" },
    "lucide-react": {},
    "../ui/alert-dialog": {
      AlertDialog: "confirm",
      AlertDialogAction: "action",
      AlertDialogCancel: "cancel",
    },
    "@/lib/utils": { cn: (...values) => values.join(" ") },
    "@/context/AuthProvider": {
      useUserContext: () => ({ user: { currentUserId: viewer } }),
    },
    "next/navigation": {
      useParams: () => ({ userId: viewer }),
      useRouter: () => ({ refresh: () => refreshed++ }),
    },
    "@/lib/hooks/useFollowConnection": {
      useFollowConnection: () => ({
        following: true,
        pending: false,
        error: "",
        change: async (value) => {
          changes.push(value);
          return accepted;
        },
      }),
    },
  }).default;
  const render = () =>
    state.render(() =>
      button({
        isFollow: 1,
        userId: id,
        userName: "creator",
        connectionTab: 2,
      }),
    );
  render();
  find(render(), (node) => node.type === "button").props.onClick();
  assert.equal(
    find(render(), (node) => node.type === "confirm").props.open,
    true,
  );
  assert.equal(changes.length, 0);
  find(render(), (node) => node.type === "confirm").props.onOpenChange(false);
  assert.equal(changes.length, 0);
  find(render(), (node) => node.type === "button").props.onClick();
  await find(render(), (node) => node.type === "action").props.onClick({
    preventDefault() {},
  });
  assert.equal(
    find(render(), (node) => node.type === "confirm").props.open,
    true,
  );
  assert.equal(refreshed, 0);
  accepted = true;
  await find(render(), (node) => node.type === "action").props.onClick({
    preventDefault() {},
  });
  assert.equal(
    find(render(), (node) => node.type === "confirm").props.open,
    false,
  );
  assert.equal(refreshed, 1);
});
test("own following includes unfollow controls for non-talent accounts; public lists do not add follow controls", () => {
  const card = load("components/cards/ConnectionCard.tsx", {
    "react/jsx-runtime": jsx,
    "next/link": {},
    "../buttons/ConnectionButton": { default: "connection", __esModule: true },
    "../others/MotionDiv": {},
    "../others/UserProfileImg": {},
    "@/public/assets/svgs": {},
  }).default;
  const data = { ...row(), isTalent: false, isFollow: 0 };
  const own = card({
    connectCard: data,
    index: 0,
    connectionTab: 2,
    isOwnList: true,
  });
  assert.equal(
    find(own, (node) => node.type === "connection").props.isFollow,
    1,
  );
  const publicList = card({
    connectCard: data,
    index: 0,
    connectionTab: 2,
    isOwnList: false,
  });
  assert.equal(
    find(publicList, (node) => node.type === "connection"),
    undefined,
  );
});
