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
const util = load("lib/utils/profile-sections.ts");
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

const top = (n = 1) => ({
  _id: n.toString(16).padStart(24, "0"),
  about: { title: `Top post ${n}` },
  media: [],
  postRating: 4,
});
const language = () => ({
  _id: second,
  languageId: second,
  languageName: "English",
  level: "advanced",
});
const education = () => ({
  _id: second,
  course: "Film",
  institution: "Institute",
  from: 2020,
  to: "present",
});
const ok = (response) => ({ status: "7400", response });
const error = (message) => ({ status: "400", response: [], message });
function api(responses = [], authError) {
  const calls = [],
    logs = [];
  let auth = 0;
  const actions = load(
    "actions/profile-overview.action.ts",
    {
      "@/lib/session": {
        getAuthHeaders: async () => {
          auth++;
          if (authError) throw authError;
          return { Authorization: "Bearer private-test-token" };
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
        const next = responses.shift();
        if (next instanceof Error) throw next;
        return {
          ok: next?.httpStatus ? next.httpStatus < 400 : true,
          json: async () => {
            if (next?.invalidJSON) throw Error("Invalid JSON");
            return next;
          },
        };
      },
    },
  );
  return { actions, calls, logs, auth: () => auth };
}
test("Top Posts uses the authenticated viewer and keeps the existing three-card endpoint", async () => {
  const h = api([ok({ _id: first }), ok({ _id: profile }), ok([top()])]);
  const result = await h.actions.getProfileTopPostsAction(profile);
  assert.equal(result.status, "7400");
  assert.equal(result.response.length, 1);
  const url = new URL(h.calls[2].url);
  assert.equal(url.pathname, "/feeds/profile/best-work");
  assert.equal(url.searchParams.get("viewUserId"), first);
  assert.equal(url.searchParams.get("userId"), profile);
  assert.equal(url.searchParams.get("pageSize"), "3");
  assert.equal(url.searchParams.get("pageNo"), "1");
  assert.ok(h.calls.every((call) => call.options.cache === "no-store"));
  assert.equal(h.logs.length, 0);
  assert.equal(JSON.stringify(result).includes("private-test-token"), false);
});
test("language loads return an explicit result and keep the stored IDs and levels", async () => {
  const h = api([ok({ _id: profile }), ok([language()])]);
  assert.deepEqual(
    plain(await h.actions.getProfileLanguagesAction(profile)),
    ok([language()]),
  );
  assert.equal(
    h.calls[1].url,
    `https://backend.test/user/languages/${profile}`,
  );
});
test("HTTP errors, malformed JSON, failed status and outages never become empty success or undefined", async () => {
  for (const name of [
    "getProfileTopPostsAction",
    "getProfileLanguagesAction",
  ]) {
    for (const bad of [
      new Error("Offline"),
      { status: "400" },
      { ...ok([]), httpStatus: 500 },
      { invalidJSON: true },
      ok({}),
      ok([null]),
    ]) {
      const h = api([ok({ _id: profile }), bad]);
      const result = await h.actions[name](profile);
      assert.equal(result.status, "400");
      assert.deepEqual(plain(result.response), []);
      assert.ok(result.message.includes("try again"));
    }
    assert.deepEqual(
      plain(await api([ok({ _id: profile }), ok([])]).actions[name](profile)),
      ok([]),
    );
  }
});
test("invalid profile IDs and failed identity/profile reads cannot reach section endpoints", async () => {
  const invalid = api();
  assert.equal(
    (await invalid.actions.getProfileTopPostsAction("invalid")).status,
    "400",
  );
  assert.equal(
    (await invalid.actions.getProfileLanguagesAction("invalid")).status,
    "400",
  );
  assert.equal(invalid.auth(), 0);
  for (const responses of [
    [ok({ _id: "" })],
    [{ status: "400" }],
    [ok({ _id: first }), ok({ _id: second })],
  ]) {
    const h = api(responses);
    assert.equal(
      (await h.actions.getProfileLanguagesAction(profile)).status,
      "400",
    );
    assert.equal(
      h.calls.some((call) => call.url.includes("/languages/")),
      false,
    );
  }
});
test("private sections never request their contents while owners retain access", async () => {
  const topPrivate = api([
    ok({ _id: first }),
    ok({ _id: profile, privacySettings: { postView: "NO_ONE" } }),
  ]);
  assert.equal(
    (await topPrivate.actions.getProfileTopPostsAction(profile)).status,
    "private",
  );
  assert.equal(topPrivate.calls.length, 2);
  const langPrivate = api([
    ok({ _id: first }),
    ok({ _id: profile, privacySettings: { profileView: "NO_ONE" } }),
  ]);
  assert.equal(
    (await langPrivate.actions.getProfileLanguagesAction(profile)).status,
    "private",
  );
  assert.equal(langPrivate.calls.length, 2);
  const own = api([
    ok({
      _id: profile,
      privacySettings: { profileView: "NO_ONE", postView: "NO_ONE" },
    }),
    ok([top()]),
  ]);
  assert.equal(
    (await own.actions.getProfileTopPostsAction(profile)).status,
    "7400",
  );
});
test("session-refresh redirects are preserved for both overview actions", async () => {
  const redirect = Object.assign(new Error("Redirect"), {
    digest: "NEXT_REDIRECT;replace;/session/refresh;307;",
  });
  for (const name of ["getProfileTopPostsAction", "getProfileLanguagesAction"])
    await assert.rejects(
      api([], redirect).actions[name](profile),
      (reason) => reason === redirect,
    );
});
test("top cards normalize absent media, invalid ratings and repeated IDs without changing the input", () => {
  const original = { ...top(), media: undefined, postRating: "invalid" };
  const rows = util.profileTopPostRows([original, original]);
  assert.equal(rows.length, 1);
  assert.deepEqual(plain(rows[0].media), []);
  assert.equal(rows[0].postRating, 0);
  assert.equal(original.media, undefined);
  assert.throws(() =>
    util.profileTopPostRows([{ ...top(), about: { title: { bad: true } } }]),
  );
  assert.throws(() => util.profileLanguageRows([language(), language()]));
  assert.throws(() =>
    util.profileLanguageRows([{ ...language(), languageName: { bad: true } }]),
  );
});
test("missing and malformed action results normalize to errors rather than crashing the view", () => {
  for (const invalid of [undefined, null, {}, ok(undefined), ok({})])
    assert.equal(
      util.profileSectionResult(invalid, "Retry failed").status,
      "400",
    );
  assert.deepEqual(
    plain(util.profileSectionResult(ok([]), "Retry failed")),
    ok([]),
  );
});

function sectionHook(
  initial = error("Offline"),
  loader = async () => ok([top()]),
) {
  const host = hooks(),
    calls = [];
  const props = { profileId: profile, initial };
  const stable = async (id) => {
    calls.push(id);
    return loader(id);
  };
  const hook = load("lib/hooks/useProfileSectionRead.ts", {
    react: host.react,
  }).useProfileSectionRead;
  const render = () =>
    host.render(() =>
      hook(props.profileId, props.initial, stable, "Retry failed"),
    );
  render();
  return { host, props, render, calls };
}
test("retry keeps failures explicit, then recovers without dropping a duplicate request guard", async () => {
  let finish;
  const h = sectionHook(
    error("Offline"),
    () => new Promise((resolve) => (finish = resolve)),
  );
  const pending = h.render().retry();
  h.render().retry();
  assert.equal(h.calls.length, 1);
  assert.equal(h.render().pending, true);
  finish(error("Still offline"));
  await pending;
  assert.equal(h.render().result.status, "400");
  assert.equal(h.render().pending, false);
  const retry = h.render().retry();
  finish(ok([top()]));
  await retry;
  assert.equal(h.render().result.response.length, 1);
  assert.equal(h.render().result.status, "7400");
});
test("thrown and undefined retries stay recoverable", async () => {
  for (const loader of [
    async () => {
      throw Error("Offline");
    },
    async () => undefined,
  ]) {
    const h = sectionHook(error("Offline"), loader);
    await h.render().retry();
    assert.equal(h.render().result.status, "400");
    assert.equal(h.render().result.message, "Retry failed");
    assert.equal(h.render().pending, false);
  }
});
test("old profile responses cannot replace or unlock a new profile's retry", async () => {
  const completions = [];
  const h = sectionHook(
    error("Offline"),
    () => new Promise((resolve) => completions.push(resolve)),
  );
  const old = h.render().retry();
  h.props.profileId = second;
  h.props.initial = error("New profile offline");
  h.render();
  const current = h.render().retry();
  completions[0](ok([top(1)]));
  await old;
  assert.equal(h.render().pending, true);
  assert.equal(h.render().result.message, "New profile offline");
  completions[1](ok([top(2)]));
  await current;
  assert.equal(h.render().result.response[0]._id, top(2)._id);
});
test("server refreshes and unmounts discard late retries", async () => {
  let finish;
  const h = sectionHook(
    error("Offline"),
    () => new Promise((resolve) => (finish = resolve)),
  );
  const pending = h.render().retry();
  h.props.initial = ok([top(3)]);
  h.render();
  finish(ok([top(1)]));
  await pending;
  assert.equal(h.render().result.response[0]._id, top(3)._id);
  let end;
  const gone = sectionHook(
    error("Offline"),
    () => new Promise((resolve) => (end = resolve)),
  );
  const closing = gone.render().retry();
  gone.host.unmount();
  end(ok([top()]));
  await closing;
  assert.equal(gone.render().result.status, "400");
});

function topView(
  initial = error("Offline"),
  own = true,
  loader = async () => ok([top()]),
) {
  const host = hooks();
  const props = {
    profileId: profile,
    isOwnProfile: own,
    initialResult: initial,
  };
  const component = load("components/widgets/profile/ProfileTopPosts.tsx", {
    ...ui,
    react: host.react,
    "@/actions/profile-overview.action": { getProfileTopPostsAction: loader },
    "@/components/widgets/carousels/TopPostsCarousel": "carousel",
    "@/public/assets/svgs/PostIcon": "icon",
  }).default;
  const render = () => host.render(() => component(props));
  render();
  return { props, render };
}
test("Top Posts failures show a retry instead of disappearing or claiming no posts", async () => {
  const h = topView();
  assert.ok(find(h.render(), (node) => node.props?.role === "alert"));
  assert.equal(
    find(h.render(), (node) => node.props?.children === "No posts yet"),
    undefined,
  );
  await find(h.render(), (node) => node.type === "button").props.onClick();
  assert.ok(find(h.render(), (node) => node.type === "carousel"));
  assert.equal(
    find(h.render(), (node) => node.props?.role === "alert"),
    undefined,
  );
});
test("genuine Top Posts emptiness and private sections retain the intended visibility", () => {
  const own = topView(ok([]));
  assert.ok(
    find(own.render(), (node) => node.props?.children === "No posts yet"),
  );
  const visitor = topView(ok([]), false);
  assert.equal(visitor.render(), null);
  const denied = topView(
    { status: "private", response: [], message: "Private posts" },
    false,
  );
  assert.equal(
    find(denied.render(), (node) => node.type === "button"),
    undefined,
  );
  assert.equal(
    find(denied.render(), (node) => node.type === "carousel"),
    undefined,
  );
});
function details(
  languages = error("Offline"),
  edu = ok([education()]),
  own = true,
  loadLang = async () => ok([language()]),
  loadEdu = async () => ok([]),
) {
  const host = hooks();
  const component = load(
    "components/widgets/profile/ProfileLanguageEducation.tsx",
    {
      ...ui,
      react: host.react,
      "@/actions/profile-overview.action": {
        getProfileLanguagesAction: loadLang,
      },
      "@/actions/profile-education.action": {
        getProfileEducationsAction: loadEdu,
      },
      "@/components/buttons": { ProInfoAddBtn: "add" },
      "@/components/cards/ProDetailCards": { LanguageCard: "language-card" },
      "./ProfileEducationList": {
        ProfileEducationSection: "education-section",
      },
      "@/components/others/EmptyDetails": "empty",
      "@/public/assets/svgs/LanguageIcon": "icon",
      "@/public/assets/svgs/GraduationIcon": "icon",
    },
  ).default;
  const props = {
    profileId: profile,
    isOwnProfile: own,
    initialLanguages: languages,
    initialEducation: edu,
  };
  const render = () => host.render(() => component(props));
  render();
  return { props, render };
}
test("language failures preserve education and never expose Add with an empty replacement array", async () => {
  const h = details();
  assert.ok(find(h.render(), (node) => node.props?.role === "alert"));
  assert.equal(
    find(h.render(), (node) => node.type === "add"),
    undefined,
  );
  assert.equal(
    find(h.render(), (node) => node.type === "empty"),
    undefined,
  );
  assert.equal(
    find(h.render(), (node) => node.type === "education-section").props.result
      .response.length,
    1,
  );
  await find(h.render(), (node) => node.type === "button").props.onClick();
  assert.ok(find(h.render(), (node) => node.type === "language-card"));
  assert.ok(find(h.render(), (node) => node.type === "add"));
});
test("public empty sections hide after a successful retry and private profiles hide both lists", async () => {
  const h = details(error("Offline"), ok([]), false, async () => ok([]));
  await find(h.render(), (node) => node.type === "button").props.onClick();
  assert.equal(h.render(), null);
  const denied = details(
    { status: "private", response: [], message: "Private profile" },
    ok([education()]),
    false,
  );
  assert.equal(
    find(denied.render(), (node) => node.type === "education-section"),
    undefined,
  );
  assert.equal(
    find(denied.render(), (node) => node.type === "add"),
    undefined,
  );
});
