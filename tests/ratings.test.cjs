const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const postId = "6aff08a32e63b493d0e6e337";
const viewer = "6aff08a32e63b493d0e6e338";
const owner = "6aff08a32e63b493d0e6e339";
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
const ratings = load("lib/utils/ratings.ts");
const connections = load("lib/utils/connections.ts");
const { FeedPagination } = load("lib/utils/feedPagination.ts");
const post = (author = owner) => ({
  status: "7400",
  response: { _id: postId, author: { _id: author } },
});
const row = (id = viewer) => ({ _id: id, rating: 4, userName: "artist" });
function api(responses = [], authError) {
  const calls = [];
  const invalidations = [];
  const actions = load(
    "actions/connection.action.tsx",
    {
      "@/lib/utils/ratings": ratings,
      "@/lib/utils/connections": connections,
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
        if (url.includes("/user/public/"))
          return {
            ok: true,
            json: async () => ({
              status: "7400",
              response: { _id: url.split("/").pop(), isTalent: true },
            }),
          };
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
test("post/shared ratings use authenticated viewer and verified owner instead of caller identities", async () => {
  const h = api([post(), { status: "7400" }]);
  assert.equal(
    (
      await h.actions.addPostRating(
        "forged-viewer",
        postId,
        "forged-owner",
        4,
        "/category/example?sort=new#top",
      )
    ).status,
    "7400",
  );
  assert.equal(new URL(h.calls[0].url).pathname, `/feeds/${postId}/${viewer}`);
  assert.equal(new URL(h.calls[1].url).pathname, "/te-post/rating");
  assert.deepEqual(JSON.parse(h.calls[1].options.body), {
    userId: viewer,
    postId,
    postOwnerId: owner,
    rating: 4,
  });
  assert.ok(h.invalidations.some((args) => args[0] === `/post/${postId}`));
  assert.ok(h.invalidations.some((args) => args[0] === "/category/example"));
});
test("profile self-rating remains supported and follows the mobile payload", async () => {
  const h = api([{ status: "7400" }]);
  assert.equal(
    (await h.actions.addProfileRatingAction(viewer, 5, "/profile/me/id"))
      .status,
    "7400",
  );
  assert.deepEqual(JSON.parse(h.calls[0].options.body), {
    ratingUserId: viewer,
    rating: 5,
  });
  assert.equal(new URL(h.calls[0].url).pathname, "/user/rating");
});
test("post self-rating remains supported", async () => {
  const h = api([post(viewer), { status: "7400" }]);
  assert.equal(
    (await h.actions.addPostRating(viewer, postId, viewer, 3, "/home")).status,
    "7400",
  );
});
test("invalid votes, targets and page bounds cannot reach backend", async () => {
  const h = api();
  for (const value of [0, 6, -1, 2.5, NaN, Infinity, "4"]) {
    await h.actions.addProfileRatingAction(owner, value, "/home");
    await h.actions.addPostRating(viewer, postId, owner, value, "/home");
  }
  await h.actions.addProfileRatingAction("../bad", 4, "/home");
  await h.actions.addPostRating(viewer, undefined, owner, 4, "/home");
  await h.actions.getProfileRatingList(owner, 0, 10);
  await h.actions.getProfileRatingList(owner, 1, 101);
  await h.actions.getProfileOverallRating(undefined);
  assert.equal(h.calls.length, 0);
});
test("HTTP and application rejections and network errors cannot confirm a rating or invalidate views", async () => {
  const h = api([
    { status: "7400", httpStatus: 500 },
    { status: "7401", message: "Restricted" },
    new Error("Offline"),
  ]);
  for (let i = 0; i < 3; i++)
    assert.notEqual(
      (await h.actions.addProfileRatingAction(owner, 4, "/home")).status,
      "7400",
    );
  assert.equal(h.invalidations.length, 0);
});
test("unverifiable or explicitly restricted posts cannot receive a vote", async () => {
  const h = api([
    { status: "7400", response: { _id: owner } },
    {
      status: "7400",
      response: { ...post().response, permissions: { canRatePosts: false } },
    },
  ]);
  await h.actions.addPostRating(viewer, postId, owner, 4, "/home");
  await h.actions.addPostRating(viewer, postId, owner, 4, "/home");
  assert.equal(h.calls.length, 2);
  assert.ok(h.calls.every((call) => call.options.method === "GET"));
});
test("rating reads use mobile endpoints, authenticated headers and successive pages", async () => {
  const h = api([
    { status: "7400", response: [row()] },
    { status: "7400", response: [] },
    { status: "7400", response: {} },
  ]);
  await h.actions.getProfileRatingList(owner, 1, 10);
  await h.actions.getProfileRatingList(owner, 2, 10);
  await h.actions.getProfileOverallRating(owner);
  assert.equal(new URL(h.calls[0].url).searchParams.get("pageNo"), "1");
  assert.equal(new URL(h.calls[1].url).searchParams.get("pageNo"), "2");
  assert.equal(
    new URL(h.calls[2].url).pathname,
    `/user/rating/splitup/${owner}`,
  );
  for (const call of h.calls) {
    assert.equal(call.options.headers.Authorization, "Bearer fresh-session");
    assert.equal(call.options.cache, "no-store");
  }
});
test("malformed reads and outages remain retryable; private responses are distinguished", async () => {
  const h = api([
    { status: "7400", response: [{}] },
    { status: "7400", response: { avgRating: "bad" } },
    new Error("Offline"),
    { status: "7401", message: "This rating list is private" },
  ]);
  assert.notEqual(
    (await h.actions.getProfileRatingList(owner, 1, 10)).status,
    "7400",
  );
  assert.notEqual(
    (await h.actions.getProfileOverallRating(owner)).status,
    "7400",
  );
  assert.notEqual(
    (await h.actions.getProfileOverallRating(owner)).status,
    "7400",
  );
  assert.equal(
    (await h.actions.getProfileRatingList(owner, 1, 10)).restricted,
    true,
  );
});
test("session-refresh redirects propagate through all rating requests", async () => {
  const redirect = new Error("redirect");
  redirect.digest = "NEXT_REDIRECT;replace;/sign-in;307;";
  const h = api([], redirect);
  for (const request of [
    h.actions.getProfileRatingList(owner, 1, 10),
    h.actions.getProfileOverallRating(owner),
    h.actions.addProfileRatingAction(owner, 4, "/home"),
    h.actions.addPostRating(viewer, postId, owner, 4, "/home"),
  ])
    await assert.rejects(request, (error) => error === redirect);
});
test("empty and malformed rating values cannot generate NaN or infinite bars", () => {
  const empty = ratings.normalizeRatingSummary({});
  assert.equal(empty.avgRating, 0);
  assert.equal(empty.numberOfRating, 0);
  for (const item of ratings.ratingBreakdown(empty))
    assert.equal(item.percentage, 0);
  assert.equal(ratings.ratingPercentage(Infinity, 0), 0);
  assert.equal(ratings.ratingPercentage(20, 10), 100);
  assert.equal(ratings.displayRating(undefined), 0);
  assert.equal(ratings.displayRating("4.2"), 4.2);
  assert.equal(ratings.normalizeRatingSummary({ fiveStar: -1 }), null);
  assert.equal(ratings.normalizeRatingSummary({ avgRating: NaN }), null);
});
test("rating pagination begins on page one, blocks duplicate loads and retries failed pages", async () => {
  const controller = new FeedPagination([], 10, 0);
  let finish;
  const pages = [];
  const pending = controller.load((number) => {
    pages.push(number);
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  await controller.load(async (number) => {
    pages.push(number);
    return [];
  });
  finish(Array.from({ length: 10 }, (_, i) => row(String(i))));
  await pending;
  await controller.load(async (number) => {
    pages.push(number);
    return { message: "Offline" };
  });
  assert.equal(controller.snapshot().items.length, 10);
  await controller.load(async (number) => {
    pages.push(number);
    return [row("0"), row("new")];
  });
  assert.deepEqual(pages, [1, 2, 2]);
  assert.equal(controller.snapshot().items.length, 11);
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
      useId() {
        const i = cursor++;
        return `rating-${i}`;
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
      const tree = fn();
      const pending = effects;
      effects = [];
      pending.forEach((fn) => fn());
      return tree;
    },
    unmount() {
      cells.forEach((cell) => cell?.cleanup?.());
    },
  };
}
function input(responses, mode = "POST", initial = 2) {
  const state = hooks();
  const calls = [];
  const changes = [];
  const props = {
    initial,
    mode,
    authorId: owner,
    postId,
    viewerId: viewer,
    path: "/home",
    onChange: (value) => changes.push(value),
  };
  const request = async (...args) => {
    calls.push(args);
    const result = responses.shift();
    if (result instanceof Error) throw result;
    return typeof result === "function" ? result() : result;
  };
  const hook = load("lib/hooks/useRating.ts", {
    react: state.react,
    "@/lib/utils/ratings": ratings,
    "@/actions/connection.action": {
      addPostRating: request,
      addProfileRatingAction: request,
    },
  });
  const render = () => state.render(() => hook.useRating(props));
  render();
  return { render, props, calls, changes, unmount: state.unmount };
}
test("stars remain on last confirmed value until ACK and rapid clicks send one write", async () => {
  let finish;
  const h = input([
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  ]);
  const pending = h.render().submit(5);
  await h.render().submit(4);
  assert.equal(h.calls.length, 1);
  assert.equal(h.render().rating, 2);
  assert.equal(h.render().pending, true);
  finish({ status: "7400" });
  assert.equal(await pending, true);
  assert.equal(h.render().rating, 5);
  assert.deepEqual(h.changes, [5]);
  await h.render().submit(5);
  assert.equal(h.calls.length, 1);
});
test("failed votes preserve rating; retry and updating an earlier rating both work", async () => {
  const h = input([
    { status: 500, message: "Offline" },
    { status: "7400" },
    { status: "7400" },
  ]);
  await h.render().submit(4);
  assert.equal(h.render().rating, 2);
  assert.equal(h.render().error, "Offline");
  await h.render().submit(4);
  assert.equal(h.render().rating, 4);
  await h.render().submit(2);
  assert.equal(h.render().rating, 2);
  assert.deepEqual(h.changes, [4, 2]);
});
test("FILTER and UPLOAD are local, reset to zero and never submit ratings", async () => {
  for (const mode of ["FILTER", "UPLOAD"]) {
    const h = input([], mode);
    h.props.viewerId = undefined;
    h.render();
    await h.render().submit(5);
    await h.render().submit(0);
    assert.equal(h.calls.length, 0);
    assert.deepEqual(h.changes, [5, 0]);
    h.props.initial = 4;
    h.render();
    assert.equal(h.render().rating, 4);
    h.props.initial = 0;
    h.render();
    assert.equal(h.render().rating, 0);
  }
});
test("PROFILE and SHARE select their respective actions; signed-out saves are blocked", async () => {
  const profile = input([{ status: "7400" }], "PROFILE");
  await profile.render().submit(3);
  assert.deepEqual(profile.calls[0], [owner, 3, "/home"]);
  const share = input([{ status: "7400" }], "SHARE");
  await share.render().submit(3);
  assert.deepEqual(share.calls[0], [viewer, postId, owner, 3, "/home"]);
  share.props.viewerId = undefined;
  share.render();
  await share.render().submit(5);
  assert.equal(share.calls.length, 1);
});
test("switching targets, viewers or unmounting invalidates old replies without altering new controls", async () => {
  for (const change of [
    (h) => {
      h.props.postId = owner;
      h.render();
    },
    (h) => {
      h.props.viewerId = owner;
      h.render();
    },
    (h) => h.unmount(),
  ]) {
    let finish;
    const h = input([
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    ]);
    const pending = h.render().submit(5);
    change(h);
    finish({ status: "7400" });
    assert.equal(await pending, false);
    assert.equal(h.changes.length, 0);
  }
});
test("incoming confirmed values synchronize the star selection", () => {
  const h = input([]);
  h.props.initial = 4;
  h.render();
  assert.equal(h.render().rating, 4);
  h.props.postId = owner;
  h.props.initial = 0;
  h.render();
  assert.equal(h.render().rating, 0);
});
const flush = () => new Promise((resolve) => setImmediate(resolve));
test("summary failure stops loading and retries independently of a successful rating list", async () => {
  const state = hooks();
  let summaries = 0;
  let lists = 0;
  const hook = load("lib/hooks/useProfileRatings.ts", {
    react: state.react,
    "@/lib/utils/feedPagination": { FeedPagination },
    "@/actions/connection.action": {
      getProfileRatingList: async () => {
        lists++;
        return { status: "7400", response: [] };
      },
      getProfileOverallRating: async () => {
        summaries++;
        return summaries === 1
          ? { status: 500, message: "Offline" }
          : { status: "7400", response: ratings.normalizeRatingSummary({}) };
      },
    },
  });
  const render = () => state.render(() => hook.useProfileRatings(owner));
  render();
  await flush();
  assert.equal(render().summaryLoading, false);
  assert.equal(render().summaryError, "Offline");
  assert.equal(render().items.length, 0);
  await render().loadSummary();
  assert.ok(render().summary);
  assert.equal(lists, 1);
  assert.equal(summaries, 2);
});
test("profile switches discard old summaries and rows", async () => {
  const state = hooks();
  let target = owner;
  let finishSummary;
  let finishRows;
  const hook = load("lib/hooks/useProfileRatings.ts", {
    react: state.react,
    "@/lib/utils/feedPagination": { FeedPagination },
    "@/actions/connection.action": {
      getProfileRatingList: async (id) =>
        id === owner
          ? new Promise((resolve) => {
              finishRows = resolve;
            })
          : { status: "7400", response: [row(viewer)] },
      getProfileOverallRating: async (id) =>
        id === owner
          ? new Promise((resolve) => {
              finishSummary = resolve;
            })
          : {
              status: "7400",
              response: ratings.normalizeRatingSummary({ avgRating: 4 }),
            },
    },
  });
  const render = () => state.render(() => hook.useProfileRatings(target));
  render();
  target = viewer;
  render();
  await flush();
  finishSummary({
    status: "7400",
    response: ratings.normalizeRatingSummary({ avgRating: 1 }),
  });
  finishRows({ status: "7400", response: [row(owner)] });
  await flush();
  assert.equal(render().summary.avgRating, 4);
  assert.equal(render().items[0]._id, viewer);
});
test("explicit rating privacy hides the panel even when the other request succeeds", async () => {
  const state = hooks();
  const hook = load("lib/hooks/useProfileRatings.ts", {
    react: state.react,
    "@/lib/utils/feedPagination": { FeedPagination },
    "@/actions/connection.action": {
      getProfileRatingList: async () => ({
        status: 403,
        restricted: true,
        message: "Private",
      }),
      getProfileOverallRating: async () => ({
        status: "7400",
        response: ratings.normalizeRatingSummary({}),
      }),
    },
  });
  const render = () => state.render(() => hook.useProfileRatings(owner));
  render();
  await flush();
  assert.equal(render().restricted, true);
});
test("rating permissions distinguish viewing a profile's ratings from submitting one", () => {
  const privacy = load("lib/utils/profilePrivacy.ts", {
    "./connections": connections,
  });
  const state = privacy.getProfileVisibilityState(
    {
      permissions: {
        canViewProfileRatings: true,
        canRateProfile: false,
        canRatePosts: false,
      },
    },
    false,
  );
  assert.equal(state.canViewProfileRatings, true);
  assert.equal(state.canRateProfile, false);
  assert.equal(state.canRatePosts, false);
  assert.equal(
    privacy.getProfileVisibilityState(
      { permissions: { canRateProfile: false } },
      true,
    ).canRateProfile,
    true,
  );
});
