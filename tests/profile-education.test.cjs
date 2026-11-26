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
const util = load("lib/utils/profile-education.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
const education = (id = first) => ({
  _id: id,
  course: "Film production",
  institution: "Test institute",
  from: 2020,
  to: "present",
});
const ok = (response) => ({ status: "7400", response });
function api(responses = [], authError, cacheError = false) {
  const calls = [],
    invalidations = [],
    logs = [];
  let auth = 0;
  const actions = load(
    "actions/profile-education.action.ts",
    {
      "@/lib/session": {
        getAuthHeaders: async () => {
          auth++;
          if (authError) throw authError;
          return { Authorization: "Bearer private-test-token" };
        },
      },
      "next/cache": {
        revalidatePath: (...args) => {
          invalidations.push(args);
          if (cacheError) throw new Error("Cache unavailable");
        },
      },
      "next/dist/client/components/redirect": {
        isRedirectError: (error) => error?.digest?.startsWith("NEXT_REDIRECT"),
      },
    },
    {
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      console: {
        log: (...args) => logs.push(args),
        error: (...args) => logs.push(args),
      },
      fetch: async (url, options) => {
        calls.push({
          url,
          options,
          body: options.body ? JSON.parse(options.body) : undefined,
        });
        const data = responses.shift();
        if (data instanceof Error) throw data;
        return {
          ok: data?.httpStatus ? data.httpStatus < 400 : true,
          json: async () => data,
        };
      },
    },
  );
  return { actions, calls, invalidations, logs, auth: () => auth };
}

test("education validates required fields, trims names, accepts Present and rejects reversed dates", () => {
  const schema = util.profileEducationValidation;
  assert.deepEqual(
    plain(schema.parse({ ...education(), course: " Film production " })),
    {
      course: "Film production",
      institution: "Test institute",
      from: "2020",
      to: "present",
    },
  );
  for (const changes of [
    { course: " " },
    { institution: " " },
    { from: "" },
    { to: "" },
    { from: "undefined" },
    { to: "2019" },
    { from: "present" },
    { to: String(new Date().getFullYear() + 1) },
  ]) {
    assert.equal(
      schema.safeParse({ ...education(), ...changes }).success,
      false,
      JSON.stringify(changes),
    );
  }
  assert.equal(schema.safeParse({ ...education(), to: 2020 }).success, true);
});
test("failed and malformed education loads remain distinct from a genuinely empty list", async () => {
  for (const response of [
    new Error("Offline"),
    { status: "400" },
    ok({}),
    ok([null]),
    { ...ok([]), httpStatus: 500 },
  ]) {
    assert.equal(
      (await api([response]).actions.getProfileEducationsAction(profile))
        .status,
      "400",
    );
  }
  assert.deepEqual(
    plain(await api([ok([])]).actions.getProfileEducationsAction(profile)),
    ok([]),
  );
});
test("older education records with missing dates remain readable and unrelated deletion preserves them", async () => {
  const legacy = {
    _id: second,
    course: "Older course",
    institution: "Older institute",
  };
  assert.deepEqual(
    plain(
      await api([ok([legacy])]).actions.getProfileEducationsAction(profile),
    ),
    ok([legacy]),
  );
  const h = api([ok({ _id: profile }), ok([education(), legacy]), ok([])]);
  assert.equal(
    (await h.actions.deleteProfileEducationAction(profile, first)).status,
    "7400",
  );
  assert.deepEqual(h.calls[2].body, [legacy]);
});
test("invalid education input never reaches auth or the backend", async () => {
  const h = api();
  assert.equal(
    (
      await h.actions.saveProfileEducationAction({
        profileId: profile,
        education: { ...education(), to: 2019 },
      })
    ).status,
    "400",
  );
  assert.equal(
    (await h.actions.deleteProfileEducationAction(profile, "")).status,
    "400",
  );
  assert.equal(h.auth(), 0);
  assert.equal(h.calls.length, 0);
});
test("adding education merges into fresh backend data and uses the mobile endpoint", async () => {
  const existing = {
    ...education(second),
    institution: "Other institute",
    extra: "preserve",
  };
  const h = api([ok({ _id: profile }), ok([existing]), ok([])]);
  assert.equal(
    (
      await h.actions.saveProfileEducationAction({
        profileId: profile,
        education: education(),
      })
    ).status,
    "7400",
  );
  assert.equal(
    h.calls[1].url,
    `https://backend.test/user/educations/${profile}`,
  );
  assert.equal(h.calls[2].url, "https://backend.test/user/educations");
  assert.equal(h.calls[2].options.method, "PUT");
  assert.deepEqual(h.calls[2].body[0], existing);
  assert.equal(h.calls[2].body[1].to, "present");
  assert.equal(h.invalidations.length, 1);
  assert.equal(h.logs.length, 0);
});
test("editing education preserves identity, metadata and unrelated records", async () => {
  const rows = [{ ...education(), extra: "keep" }, education(second)];
  const h = api([ok({ _id: profile }), ok(rows), ok([])]);
  await h.actions.saveProfileEducationAction({
    profileId: profile,
    educationId: first,
    education: { ...education(), course: "Updated course" },
  });
  assert.equal(h.calls[2].body[0]._id, first);
  assert.equal(h.calls[2].body[0].extra, "keep");
  assert.equal(h.calls[2].body[0].course, "Updated course");
  assert.deepEqual(h.calls[2].body[1], rows[1]);
});
test("deletion removes only the selected education after fresh reading", async () => {
  const h = api([
    ok({ _id: profile }),
    ok([education(), education(second)]),
    ok([]),
  ]);
  assert.equal(
    (await h.actions.deleteProfileEducationAction(profile, first)).status,
    "7400",
  );
  assert.deepEqual(h.calls[2].body, [education(second)]);
});
test("another user's profile and failed reads cannot cause a replacement PUT", async () => {
  for (const responses of [
    [ok({ _id: second })],
    [ok({ _id: profile }), new Error("Offline")],
    [ok({ _id: profile }), ok({})],
  ]) {
    const h = api(responses);
    assert.equal(
      (await h.actions.deleteProfileEducationAction(profile, first)).status,
      "400",
    );
    assert.equal(
      h.calls.some((c) => c.options.method === "PUT"),
      false,
    );
  }
});
test("HTTP errors, business rejection and network failures never report a successful delete", async () => {
  for (const response of [
    { status: "400" },
    { ...ok([]), httpStatus: 500 },
    new Error("Offline"),
  ]) {
    const h = api([ok({ _id: profile }), ok([education()]), response]);
    assert.equal(
      (await h.actions.deleteProfileEducationAction(profile, first)).status,
      "400",
    );
    assert.equal(h.invalidations.length, 0);
  }
});
test("retries avoid duplicate additions and already accepted deletions", async () => {
  const saved = api([ok({ _id: profile }), ok([education()])]);
  assert.equal(
    (
      await saved.actions.saveProfileEducationAction({
        profileId: profile,
        education: education(),
      })
    ).status,
    "7400",
  );
  assert.equal(saved.calls.length, 2);
  const removed = api([ok({ _id: profile }), ok([])]);
  assert.equal(
    (await removed.actions.deleteProfileEducationAction(profile, first)).status,
    "7400",
  );
  assert.equal(removed.calls.length, 2);
});
test("stale edits and ambiguous legacy entries cannot replace an arbitrary education", async () => {
  const legacy = { ...education(), _id: undefined };
  const h = api([ok({ _id: profile }), ok([legacy, legacy])]);
  assert.equal(
    (
      await h.actions.deleteProfileEducationAction(
        profile,
        util.educationKey(legacy),
      )
    ).status,
    "400",
  );
  assert.equal(h.calls.length, 2);
  const missing = api([ok({ _id: profile }), ok([])]);
  assert.equal(
    (
      await missing.actions.saveProfileEducationAction({
        profileId: profile,
        educationId: first,
        education: education(),
      })
    ).status,
    "400",
  );
});
test("legacy entries without IDs are targeted by their full content", async () => {
  const legacy = { ...education(), _id: undefined };
  const h = api([
    ok({ _id: profile }),
    ok([legacy, education(second)]),
    ok([]),
  ]);
  assert.equal(
    (
      await h.actions.deleteProfileEducationAction(
        profile,
        util.educationKey(legacy),
      )
    ).status,
    "7400",
  );
  assert.deepEqual(h.calls[2].body, [education(second)]);
});
test("cache failures do not turn an acknowledged education save into a failed retry", async () => {
  const h = api([ok({ _id: profile }), ok([]), ok([])], undefined, true);
  assert.equal(
    (
      await h.actions.saveProfileEducationAction({
        profileId: profile,
        education: education(),
      })
    ).status,
    "7400",
  );
});
test("authentication redirects propagate through education actions", async () => {
  const error = Object.assign(new Error("Redirect"), {
    digest: "NEXT_REDIRECT;replace;/session/refresh;307;",
  });
  const h = api([], error);
  await assert.rejects(
    h.actions.getProfileEducationsAction(profile),
    (e) => e === error,
  );
  await assert.rejects(
    h.actions.saveProfileEducationAction({
      profileId: profile,
      education: education(),
    }),
    (e) => e === error,
  );
  await assert.rejects(
    h.actions.deleteProfileEducationAction(profile, first),
    (e) => e === error,
  );
});

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

test("ongoing education from the API displays Present and numeric end years remain unchanged", () => {
  const { EducationCard } = load("components/cards/ProDetailCards.tsx", {
    "react/jsx-runtime": jsx,
    "../others/MotionDiv": { MotionDiv: "motion" },
    "../options": { ProInfoEditOptions: "options" },
  });
  for (const to of [null, "present", "Present", " PRESENT "]) {
    assert.ok(
      find(
        EducationCard({ data: { ...education(), to }, index: 0, length: 1 }),
        (node) => node.type === "p" && node.props.children === "Present",
      ),
    );
  }
  assert.ok(
    find(
      EducationCard({
        data: { ...education(), to: 2022 },
        index: 0,
        length: 1,
      }),
      (node) => node.type === "p" && node.props.children === 2022,
    ),
  );
});

test("editing a null end year restores Present while new education keeps an empty selection", () => {
  for (const [row, isEdit, expected] of [
    [{ ...education(), to: null }, true, "present"],
    [{ ...education(), to: 2022 }, true, "2022"],
    [undefined, false, ""],
  ]) {
    const host = hooks();
    let restored;
    const Component = load(
      "components/widgets/profile/ProfileEducationEditor.tsx",
      {
        ...ui,
        react: host.react,
        "next/navigation": {
          useParams: () => ({ userId: profile }),
          useRouter: () => ({ refresh() {} }),
        },
        "react-hook-form": {
          useForm: () => ({
            reset: (value) => {
              restored = value;
            },
            handleSubmit: (fn) => fn,
            formState: {},
          }),
        },
        "@hookform/resolvers/zod": { zodResolver() {} },
        "@/actions/profile-education.action": {
          saveProfileEducationAction: async () => ({ status: "7400" }),
        },
        "@/components/ui/form": { Form: "form-provider" },
        "@/components/forms/EducationEditForm": "editor",
      },
    ).default;
    host.render(() =>
      Component({ isOpen: true, data: row, isEdit, onClose() {} }),
    );
    assert.equal(restored.to, expected);
    if (isEdit)
      assert.equal(
        util.profileEducationValidation.safeParse(restored).success,
        true,
      );
  }
});

test("failed deletion keeps its confirmation open and duplicate clicks send once", async () => {
  const host = hooks();
  let finish,
    calls = 0,
    closed = 0,
    refreshes = 0;
  const component = load(
    "components/widgets/profile/ProfileEducationDeleteDialog.tsx",
    {
      ...ui,
      react: host.react,
      "next/navigation": {
        useParams: () => ({ userId: profile }),
        useRouter: () => ({ refresh: () => refreshes++ }),
      },
      "@/actions/profile-education.action": {
        deleteProfileEducationAction: async () => {
          calls++;
          return new Promise((resolve) => (finish = resolve));
        },
      },
    },
  ).default;
  const render = () =>
    host.render(() =>
      component({ isOpen: true, onClose: () => closed++, data: education() }),
    );
  const click = find(
    render(),
    (node) =>
      node.type === "button" && node.props.children === "Delete education",
  ).props.onClick;
  const pending = click();
  click();
  assert.equal(calls, 1);
  finish({ status: "400", message: "Offline" });
  await pending;
  assert.equal(closed, 0);
  assert.equal(refreshes, 0);
  assert.ok(find(render(), (node) => node.props?.role === "alert"));
  const retry = find(
    render(),
    (node) =>
      node.type === "button" && node.props.children === "Delete education",
  ).props.onClick();
  finish(ok([]));
  await retry;
  assert.equal(closed, 1);
  assert.equal(refreshes, 1);
});
test("failed list loads show retry instead of an empty profile and retry renders educations", async () => {
  const host = hooks();
  const component = load(
    "components/widgets/profile/ProfileEducationList.tsx",
    {
      ...ui,
      react: host.react,
      "@/components/buttons": { ProInfoAddBtn: "add" },
      "@/components/cards/ProDetailCards": { EducationCard: "card" },
      "@/actions/profile-education.action": {
        getProfileEducationsAction: async () => ok([education()]),
      },
    },
  ).default;
  const initialResult = { status: "400", response: [], message: "Offline" };
  const render = () =>
    host.render(() =>
      (() => {
        const view = component({
          profileId: profile,
          isOwnProfile: true,
          initialResult,
        });
        return view.type(view.props);
      })(),
    );
  render();
  assert.ok(find(render(), (node) => node.props?.role === "alert"));
  assert.equal(
    find(render(), (node) => node.type === "add"),
    undefined,
  );
  await find(render(), (node) => node.type === "button").props.onClick();
  assert.ok(find(render(), (node) => node.type === "card"));
  assert.ok(find(render(), (node) => node.type === "add"));
});
