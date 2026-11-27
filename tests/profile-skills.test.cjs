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
const util = load("lib/utils/profile-skills.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
const skillSet = (id = first) => ({
  _id: id,
  mainCategoryId: "111111111111111111111111",
  mainCategoryName: "Arts",
  subCategoryId: "222222222222222222222222",
  subCategoryName: "Film",
  skillsHave: [
    {
      skillId: "333333333333333333333333",
      skillName: "Editing",
      level: "advanced",
    },
  ],
  description: "Film editing",
  hashTags: ["#film"],
});
const ok = (response) => ({ status: "7400", response });
function api(responses = [], authError, cacheError = false, catalogs = {}) {
  const calls = [],
    invalidations = [],
    logs = [];
  let auth = 0;
  const actions = load(
    "actions/profile-skills.action.ts",
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
        const route = url.replace("https://backend.test", "");
        const defaults = {
          "/category/mainCategory": ok([
            { _id: "111111111111111111111111", name: "Arts" },
            { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", name: "Sports" },
          ]),
          "/category/subCategory/111111111111111111111111": ok([
            { _id: "222222222222222222222222", name: "Film" },
          ]),
          "/category/subCategory/aaaaaaaaaaaaaaaaaaaaaaaa": ok([]),
          "/category/skill/222222222222222222222222": ok([
            { _id: "333333333333333333333333", name: "Editing" },
            { _id: "444444444444444444444444", name: "Lighting" },
          ]),
        };
        const data =
          route in catalogs
            ? catalogs[route]
            : route in defaults
              ? defaults[route]
              : responses.shift();
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

test("skill validation covers categories, levels, required text, hashtags and duplicates", () => {
  assert.equal(util.profileSkillValidation.safeParse(skillSet()).success, true);
  for (const changes of [
    { mainCategoryId: "" },
    { subCategoryId: "" },
    { description: " " },
    { hashTags: [] },
    { hashTags: ["film"] },
    { skillsHave: [{ skillId: first, level: "expert" }] },
    { skillsHave: [...skillSet().skillsHave, ...skillSet().skillsHave] },
  ]) {
    assert.equal(
      util.profileSkillValidation.safeParse({ ...skillSet(), ...changes })
        .success,
      false,
      JSON.stringify(changes),
    );
  }
  assert.deepEqual(plain(util.parseSkillHashtags("#film, #art #film")), [
    "#film",
    "#art",
  ]);
  assert.equal(
    util.profileSkillValidation.safeParse({
      ...skillSet(),
      hashTags: ["#தமிழ்", "#film_2026"],
    }).success,
    true,
  );
});
test("hashtag errors use the mobile app wording", () => {
  for (const [hashTags, message] of [
    [[], "Add at least one hashtag starting with #."],
    [
      ["talent", "#explorer"],
      "Add # before every word (for example: #talent, #explorer).",
    ],
  ]) {
    const result = util.profileSkillValidation.safeParse({
      ...skillSet(),
      hashTags,
    });
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].message, message);
  }
});
test("adding skills uses the mobile endpoint, canonical catalogue names and fresh unrelated records", async () => {
  const existing = {
    ...skillSet(second),
    description: "Other record",
    extra: "keep",
  };
  const h = api([ok({ _id: profile, isTalent: true }), ok([existing]), ok([])]);
  const result = await h.actions.saveProfileSkillAction({
    profileId: profile,
    skill: {
      ...skillSet(),
      mainCategoryName: "Spoofed",
      subCategoryName: "Spoofed",
    },
  });
  assert.equal(result.status, "7400");
  const put = h.calls.find((call) => call.options.method === "PUT");
  assert.equal(put.url, "https://backend.test/user/skills");
  assert.deepEqual(put.body[0], existing);
  assert.equal(put.body[1].mainCategoryName, "Arts");
  assert.equal(put.body[1].subCategoryName, "Film");
  assert.equal(put.body[1].skillsHave[0].skillName, "Editing");
  assert.equal(put.body[1].skillsHave[0].level, "advanced");
  assert.equal(h.invalidations.length, 1);
  assert.equal(h.logs.length, 0);
});
test("editing preserves record identity and unrelated data while updating all skill fields", async () => {
  const h = api([
    ok({ _id: profile, isTalent: true }),
    ok([{ ...skillSet(), extra: "keep" }, skillSet(second)]),
    ok([]),
  ]);
  assert.equal(
    (
      await h.actions.saveProfileSkillAction({
        profileId: profile,
        skillSetId: first,
        skill: {
          ...skillSet(),
          description: "Updated",
          hashTags: ["#new"],
          skillsHave: [
            { skillId: "444444444444444444444444", level: "beginner" },
          ],
        },
      })
    ).status,
    "7400",
  );
  const rows = h.calls.find((call) => call.options.method === "PUT").body;
  assert.equal(rows[0]._id, first);
  assert.equal(rows[0].extra, "keep");
  assert.equal(rows[0].description, "Updated");
  assert.deepEqual(rows[0].hashTags, ["#new"]);
  assert.equal(rows[0].skillsHave[0].skillName, "Lighting");
  assert.deepEqual(rows[1], skillSet(second));
});
test("deletion sends only the remaining skill sets and no category lookups", async () => {
  const h = api([
    ok({ _id: profile, isTalent: true }),
    ok([skillSet(), skillSet(second)]),
    ok([]),
  ]);
  assert.equal(
    (await h.actions.deleteProfileSkillAction(profile, first)).status,
    "7400",
  );
  assert.deepEqual(h.calls[2].body, [skillSet(second)]);
  assert.equal(h.calls.length, 3);
});
test("invalid input and unauthorized owners never cause a write", async () => {
  const h = api();
  assert.equal(
    (
      await h.actions.saveProfileSkillAction({
        profileId: profile,
        skill: { ...skillSet(), description: " " },
      })
    ).status,
    "400",
  );
  assert.equal(
    (await h.actions.deleteProfileSkillAction(profile, "")).status,
    "400",
  );
  assert.equal(h.auth(), 0);
  const other = api([ok({ _id: second })]);
  assert.equal(
    (
      await other.actions.saveProfileSkillAction({
        profileId: profile,
        skill: skillSet(),
      })
    ).status,
    "400",
  );
  assert.equal(other.calls.length, 1);
});
test("invalid category relationships, absent skills and unavailable catalogues cannot overwrite records", async () => {
  const variants = [
    [{ ...skillSet(), mainCategoryId: second }, {}],
    [{ ...skillSet(), mainCategoryId: "aaaaaaaaaaaaaaaaaaaaaaaa" }, {}],
    [
      { ...skillSet(), skillsHave: [{ skillId: second, level: "advanced" }] },
      {},
    ],
    [{ ...skillSet(), skillsHave: [] }, {}],
    [skillSet(), { "/category/mainCategory": new Error("Offline") }],
    [
      skillSet(),
      { "/category/skill/222222222222222222222222": { status: "400" } },
    ],
  ];
  for (const [skill, catalogs] of variants) {
    const h = api(
      [ok({ _id: profile, isTalent: true }), ok([])],
      undefined,
      false,
      catalogs,
    );
    assert.equal(
      (await h.actions.saveProfileSkillAction({ profileId: profile, skill }))
        .status,
      "400",
    );
    assert.equal(
      h.calls.some((c) => c.options.method === "PUT"),
      false,
    );
  }
});
test("a category with no individual skills accepts an empty skills list", async () => {
  const h = api(
    [ok({ _id: profile, isTalent: true }), ok([]), ok([])],
    undefined,
    false,
    {
      "/category/skill/222222222222222222222222": ok([]),
    },
  );
  assert.equal(
    (
      await h.actions.saveProfileSkillAction({
        profileId: profile,
        skill: { ...skillSet(), skillsHave: [] },
      })
    ).status,
    "7400",
  );
});
test("failed loads remain errors and never produce a replacement array", async () => {
  for (const response of [
    new Error("Offline"),
    ok({}),
    ok([{}]),
    { status: "400" },
    { ...ok([]), httpStatus: 500 },
  ]) {
    assert.equal(
      (await api([response]).actions.getProfileSkillsAction(profile)).status,
      "400",
    );
    const h = api([ok({ _id: profile, isTalent: true }), response]);
    assert.equal(
      (await h.actions.deleteProfileSkillAction(profile, first)).status,
      "400",
    );
    assert.equal(
      h.calls.some((c) => c.options.method === "PUT"),
      false,
    );
  }
  assert.equal(
    (await api([ok([])]).actions.getProfileSkillsAction(profile)).status,
    "7400",
  );
});
test("rejected or interrupted writes cannot report success or invalidate the profile", async () => {
  for (const response of [
    new Error("Offline"),
    { status: "400" },
    { ...ok([]), httpStatus: 500 },
  ]) {
    const h = api([
      ok({ _id: profile, isTalent: true }),
      ok([skillSet()]),
      response,
    ]);
    assert.equal(
      (await h.actions.deleteProfileSkillAction(profile, first)).status,
      "400",
    );
    assert.equal(h.invalidations.length, 0);
  }
});
test("accepted addition and deletion retries are idempotent", async () => {
  const added = api([ok({ _id: profile, isTalent: true }), ok([skillSet()])]);
  assert.equal(
    (
      await added.actions.saveProfileSkillAction({
        profileId: profile,
        skill: skillSet(),
      })
    ).status,
    "7400",
  );
  assert.equal(added.calls.length, 2);
  const deleted = api([ok({ _id: profile, isTalent: true }), ok([])]);
  assert.equal(
    (await deleted.actions.deleteProfileSkillAction(profile, first)).status,
    "7400",
  );
  assert.equal(deleted.calls.length, 2);
});
test("ambiguous legacy entries and stale edits fail without changing arbitrary records", async () => {
  const legacy = { ...skillSet(), _id: undefined };
  const ambiguous = api([
    ok({ _id: profile, isTalent: true }),
    ok([legacy, legacy]),
  ]);
  assert.equal(
    (
      await ambiguous.actions.deleteProfileSkillAction(
        profile,
        util.skillSetKey(legacy),
      )
    ).status,
    "400",
  );
  const stale = api([ok({ _id: profile, isTalent: true }), ok([])]);
  assert.equal(
    (
      await stale.actions.saveProfileSkillAction({
        profileId: profile,
        skillSetId: first,
        skill: skillSet(),
      })
    ).status,
    "400",
  );
});
test("cache failures preserve acknowledged success and session redirects propagate", async () => {
  const h = api(
    [ok({ _id: profile, isTalent: true }), ok([skillSet()]), ok([])],
    undefined,
    true,
  );
  assert.equal(
    (await h.actions.deleteProfileSkillAction(profile, first)).status,
    "7400",
  );
  const error = Object.assign(new Error("Redirect"), {
    digest: "NEXT_REDIRECT;replace;/session/refresh;307;",
  });
  const redirect = api([], error);
  await assert.rejects(
    redirect.actions.getProfileSkillsAction(profile),
    (e) => e === error,
  );
  await assert.rejects(
    redirect.actions.saveProfileSkillAction({
      profileId: profile,
      skill: skillSet(),
    }),
    (e) => e === error,
  );
  await assert.rejects(
    redirect.actions.deleteProfileSkillAction(profile, first),
    (e) => e === error,
  );
  await assert.rejects(
    redirect.actions.getProfileSkillOptionsAction("main"),
    (e) => e === error,
  );
});
test("category choices sort by name, reject invalid parent IDs, and expose failures", async () => {
  const h = api();
  assert.equal(
    (await h.actions.getProfileSkillOptionsAction("sub", "bad")).status,
    "400",
  );
  assert.equal(h.auth(), 0);
  assert.deepEqual(
    plain((await h.actions.getProfileSkillOptionsAction("main")).response).map(
      (row) => row.name,
    ),
    ["Arts", "Sports"],
  );
  assert.equal(
    (
      await api([], undefined, false, {
        "/category/mainCategory": ok([{}]),
      }).actions.getProfileSkillOptionsAction("main")
    ).status,
    "400",
  );
});

function editor(save = async () => ({ status: "400", message: "Offline" })) {
  const host = hooks(),
    calls = [];
  let closed = 0,
    refreshes = 0;
  const catalogs = {
    main: [
      { _id: "111111111111111111111111", name: "Arts" },
      { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", name: "Sports" },
    ],
    sub: [{ _id: "222222222222222222222222", name: "Film" }],
    skill: [
      { _id: "333333333333333333333333", name: "Editing" },
      { _id: "444444444444444444444444", name: "Lighting" },
    ],
  };
  const props = { isOpen: true, data: skillSet(), onClose: () => closed++ };
  let status = "ready";
  const component = load("components/widgets/profile/ProfileSkillEditor.tsx", {
    ...ui,
    react: host.react,
    "next/navigation": {
      useParams: () => ({ userId: profile }),
      useRouter: () => ({ refresh: () => refreshes++ }),
    },
    "@/lib/hooks/useProfileSkillOptions": {
      useProfileSkillOptions: (kind) => ({
        status,
        options: catalogs[kind],
        retry() {},
      }),
    },
    "@/actions/profile-skills.action": {
      saveProfileSkillAction: async (payload) => {
        calls.push(plain(payload));
        return save(payload);
      },
    },
  }).default;
  const render = () => host.render(() => component(props));
  render();
  const field = (name, value) =>
    find(
      render(),
      (node) =>
        node.props?.name === name || node.props?.["aria-label"] === name,
    ).props.onChange({ target: { value } });
  const click = (text) =>
    find(
      render(),
      (node) => node.type === "button" && node.props.children === text,
    ).props.onClick();
  const submit = () =>
    find(render(), (node) => node.type === "form").props.onSubmit({
      preventDefault() {},
    });
  return {
    host,
    props,
    render,
    field,
    click,
    submit,
    calls,
    closed: () => closed,
    refreshes: () => refreshes,
    status: (value) => {
      status = value;
    },
  };
}
test("editor prefills and retains all fields after failed saves, then refreshes only on acknowledgement", async () => {
  let accepted = false;
  const h = editor(async () =>
    accepted ? ok([]) : { status: "400", message: "Offline" },
  );
  assert.equal(
    find(h.render(), (n) => n.props?.name === "hashtags").props.value,
    "#film",
  );
  h.field("description", "Updated description");
  h.field("hashtags", "#film, #talent");
  h.field("Level 1", "intermediate");
  await h.submit();
  assert.equal(h.closed(), 0);
  assert.equal(h.refreshes(), 0);
  assert.equal(
    find(h.render(), (n) => n.props?.name === "description").props.value,
    "Updated description",
  );
  assert.ok(find(h.render(), (n) => n.props?.role === "alert"));
  assert.deepEqual(h.calls[0].skill.hashTags, ["#film", "#talent"]);
  assert.equal(h.calls[0].skill.skillsHave[0].level, "intermediate");
  accepted = true;
  await h.submit();
  assert.equal(h.closed(), 1);
  assert.equal(h.refreshes(), 1);
});
test("editor category changes clear dependent selections without losing description or hashtags", () => {
  const h = editor();
  h.field("mainCategoryId", "aaaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(
    find(h.render(), (n) => n.props?.name === "subCategoryId").props.value,
    "",
  );
  assert.equal(
    find(h.render(), (n) => n.props?.["aria-label"] === "Skill 1"),
    undefined,
  );
  assert.equal(
    find(h.render(), (n) => n.props?.name === "description").props.value,
    "Film editing",
  );
  assert.equal(
    find(h.render(), (n) => n.props?.name === "hashtags").props.value,
    "#film",
  );
});
test("invalid or incomplete rows, duplicate skills, and missing hashtags cannot submit", async () => {
  const h = editor();
  h.click("Add skill & level");
  h.field("Skill 2", "444444444444444444444444");
  await h.submit();
  assert.equal(h.calls.length, 0);
  h.field("Level 2", "beginner");
  h.field("Skill 2", "333333333333333333333333");
  await h.submit();
  assert.equal(h.calls.length, 0);
  h.field("Skill 2", "444444444444444444444444");
  h.field("hashtags", "");
  await h.submit();
  assert.equal(h.calls.length, 0);
  h.field("hashtags", "#film");
  await h.submit();
  assert.equal(h.calls.length, 1);
});
test("double submits send once, pending dialogs cannot dismiss, and late saves cannot close a new editor", async () => {
  let finish;
  const h = editor(() => new Promise((resolve) => (finish = resolve)));
  const pending = h.submit();
  h.submit();
  assert.equal(h.calls.length, 1);
  find(h.render(), (n) => n.type === "Dialog").props.onOpenChange(false);
  assert.equal(h.closed(), 0);
  h.props.data = skillSet(second);
  h.render();
  finish(ok([]));
  await pending;
  assert.equal(h.closed(), 0);
  assert.equal(h.refreshes(), 0);
});
test("failed category choices block saving while retaining fields", async () => {
  const h = editor();
  h.field("description", "Retained text");
  h.status("error");
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.equal(
    find(h.render(), (n) => n.props?.name === "description").props.value,
    "Retained text",
  );
});
test("dependent option loading ignores out-of-order responses and retries errors", async () => {
  const host = hooks(),
    requests = [];
  const hook = load("lib/hooks/useProfileSkillOptions.ts", {
    react: host.react,
    "@/actions/profile-skills.action": {
      getProfileSkillOptionsAction: (kind, parent) =>
        new Promise((resolve) => requests.push({ kind, parent, resolve })),
    },
  }).useProfileSkillOptions;
  let parent = first;
  const render = () => host.render(() => hook("sub", parent, true));
  render();
  parent = second;
  render();
  assert.equal(render().status, "loading");
  requests[1].resolve(ok([{ _id: second, name: "New choices" }]));
  await Promise.resolve();
  requests[0].resolve(ok([{ _id: first, name: "Old choices" }]));
  await Promise.resolve();
  assert.equal(render().options[0].name, "New choices");
  parent = profile;
  render();
  requests[2].resolve({ status: "400", message: "Offline" });
  await Promise.resolve();
  assert.equal(render().status, "error");
  render().retry();
  render();
  requests[3].resolve(ok([]));
  await Promise.resolve();
  assert.equal(render().status, "ready");
  assert.equal(render().options.length, 0);
  host.unmount();
});
test("public skill lists hide management controls and failed own-profile loads offer retry", async () => {
  const host = hooks();
  const component = load("components/widgets/profile/ProfileSkillsList.tsx", {
    ...ui,
    react: host.react,
    "@/components/cards/SkillCard": "card",
    "./ProfileSkillEditor": "editor",
    "./ProfileSkillDeleteDialog": "delete-dialog",
    "@/actions/profile-skills.action": {
      getProfileSkillsAction: async () => ok([skillSet()]),
    },
  }).default;
  let own = false,
    result = ok([skillSet()]);
  const render = () =>
    host.render(() =>
      component({
        profileId: profile,
        isOwnProfile: own,
        initialResult: result,
      }),
    );
  render();
  assert.equal(
    find(render(), (n) => n.type === "button"),
    undefined,
  );
  assert.equal(
    find(render(), (n) => n.type === "card").props.actions,
    undefined,
  );
  own = true;
  result = { status: "400", response: [], message: "Offline" };
  render();
  assert.ok(find(render(), (n) => n.props?.role === "alert"));
  await find(render(), (n) => n.type === "button").props.onClick();
  assert.ok(find(render(), (n) => n.type === "card").props.actions);
});
