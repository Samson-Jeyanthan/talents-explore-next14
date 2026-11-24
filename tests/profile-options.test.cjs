const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
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
      AbortSignal,
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      console: { error() {} },
      require(name) {
        if (name in mocks) return mocks[name];
        if (name.startsWith("@/") || name.startsWith(".")) {
          const base = name.startsWith("@/")
            ? name.slice(2)
            : path.join(path.dirname(file), name);
          const target = [base, base + ".ts", base + ".tsx"].find(
            (p) => fs.existsSync(p) && fs.statSync(p).isFile(),
          );
          if (target) return load(target, mocks, globals);
        }
        return require(name);
      },
      ...globals,
    },
  );
  return module.exports;
}
const first = "111111111111111111111111",
  second = "222222222222222222222222";
const language = (name = "English", id = first) => ({
  status: "7400",
  response: [{ _id: id, language: name }],
});
const profession = (name = "Editor", id = second) => ({
  status: "7400",
  response: [{ _id: id, professional: name }],
});
const failed = { status: "400", response: [] };
const util = load("lib/utils/profile-options.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function host() {
  const cells = [];
  let cursor = 0,
    effects = [],
    dirty = false,
    writes = 0;
  const changed = (a, b) =>
    !a ||
    a.length !== b.length ||
    a.some((value, i) => !Object.is(value, b[i]));
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in cells)) {
        const cell = {
          value: typeof initial === "function" ? initial() : initial,
        };
        cell.set = (next) => {
          const value = typeof next === "function" ? next(cell.value) : next;
          writes++;
          if (!Object.is(value, cell.value)) {
            cell.value = value;
            dirty = true;
          }
        };
        cells[i] = cell;
      }
      return [cells[i].value, cells[i].set];
    },
    useRef(initial) {
      const i = cursor++;
      return (cells[i] ||= { current: initial });
    },
    useCallback(fn, deps) {
      const i = cursor++;
      if (changed(cells[i]?.deps, deps)) cells[i] = { deps, fn };
      return cells[i].fn;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (changed(cells[i]?.deps, deps)) {
        const previous = cells[i];
        const cell = (cells[i] = { deps });
        effects.push(() => {
          previous?.cleanup?.();
          cell.cleanup = fn();
        });
      }
    },
  };
  return {
    react,
    render(fn) {
      let result,
        attempt = 0;
      do {
        dirty = false;
        cursor = 0;
        effects = [];
        result = fn();
        effects.forEach((effect) => effect());
        if (++attempt > 10) throw Error("Render loop");
      } while (dirty);
      return result;
    },
    unmount() {
      cells.forEach((cell) => cell?.cleanup?.());
    },
    writes: () => writes,
  };
}
function hook(
  initial = failed,
  kind = "language",
  fetcher = async () => language(),
) {
  const state = host(),
    calls = [];
  let props = { initial, kind };
  const useOptions = load("lib/hooks/useProfileOptions.ts", {
    react: state.react,
    "@/actions/utils.action": {
      getLanguagesAction: () => {
        calls.push("language");
        return fetcher("language");
      },
      getProfessionsAction: () => {
        calls.push("profession");
        return fetcher("profession");
      },
    },
  }).useProfileOptions;
  const read = () => state.render(() => useOptions(props.kind, props.initial));
  read();
  return {
    read,
    calls,
    state,
    update(initial, kind = props.kind) {
      props = { initial, kind };
      return read();
    },
  };
}
const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
  Fragment: "fragment",
};
function find(tree, fn) {
  if (!tree || typeof tree !== "object") return;
  if (Array.isArray(tree)) {
    for (const node of tree) {
      const result = find(node, fn);
      if (result) return result;
    }
    return;
  }
  return fn(tree) ? tree : find(tree.props?.children, fn);
}
test("lookups distinguish errors, empty lists and validated sorted options", () => {
  for (const value of [
    undefined,
    null,
    { status: "400", response: [] },
    { status: "7400", response: {} },
    { status: "7400", response: [null] },
    { status: "7400", response: [{ _id: first, language: " " }] },
    { status: "7400", response: [{ _id: "bad", language: "English" }] },
  ])
    assert.equal(util.parseProfileOptions(value, "language").status, "error");
  assert.equal(
    util.parseProfileOptions({ status: "7400", response: [] }, "language")
      .status,
    "empty",
  );
  const result = util.parseProfileOptions(
    {
      status: "7400",
      response: [
        { _id: first, language: "Zulu" },
        { _id: second, language: " English " },
        { _id: first, language: "Duplicate" },
      ],
    },
    "language",
  );
  assert.deepEqual(plain(result.options), [
    { _id: second, name: "English" },
    { _id: first, name: "Zulu" },
  ]);
  assert.equal(result.status, "ready");
  assert.equal(
    util.parseProfileOptions(profession(), "profession").options[0].name,
    "Editor",
  );
});
test("server-provided failures are visible immediately and retry recovers without duplicate requests", async () => {
  const wait = deferred(),
    h = hook(failed, "language", () => wait.promise);
  assert.equal(h.read().status, "error");
  assert.equal(h.calls.length, 0);
  const one = h.read().retry(),
    two = h.read().retry();
  assert.deepEqual(h.calls, ["language"]);
  assert.equal(h.read().status, "loading");
  wait.resolve(language());
  await Promise.all([one, two]);
  assert.equal(h.read().status, "ready");
  assert.equal(h.read().options[0].name, "English");
});
test("missing initial choices load automatically while successful server choices need no extra request", async () => {
  const h = hook();
  h.update(undefined);
  await new Promise(setImmediate);
  assert.equal(h.read().status, "ready");
  assert.deepEqual(h.calls, ["language"]);
  const seeded = hook(language());
  assert.equal(seeded.read().status, "ready");
  assert.equal(seeded.calls.length, 0);
});
test("network rejection remains retryable and an empty response gets its own state", async () => {
  let count = 0;
  const h = hook(failed, "profession", async () => {
    if (++count === 1) throw Error("offline");
    if (count === 2) return { status: "7400", response: [] };
    return profession();
  });
  await h.read().retry();
  assert.equal(h.read().status, "error");
  await h.read().retry();
  assert.equal(h.read().status, "empty");
  await h.read().retry();
  assert.equal(h.read().status, "ready");
  assert.deepEqual(h.calls, ["profession", "profession", "profession"]);
});
test("unmount and new server props invalidate delayed responses", async () => {
  const wait = deferred(),
    h = hook(failed, "language", () => wait.promise);
  const pending = h.read().retry();
  h.state.unmount();
  const writes = h.state.writes();
  wait.resolve(language());
  await pending;
  assert.equal(h.state.writes(), writes);
  const older = deferred(),
    updated = hook(failed, "language", () => older.promise);
  const request = updated.read().retry();
  updated.update(language("New selection", second));
  older.resolve(language("Outdated"));
  await request;
  assert.equal(updated.read().options[0].name, "New selection");
});
test("language and profession requests stay separate when the lookup kind changes", async () => {
  const old = deferred(),
    h = hook(failed, "language", (kind) =>
      kind === "language" ? old.promise : Promise.resolve(profession()),
    );
  const pending = h.read().retry();
  h.update(failed, "profession");
  await h.read().retry();
  old.resolve(language());
  await pending;
  assert.deepEqual(h.calls, ["language", "profession"]);
  assert.equal(h.read().options[0].name, "Editor");
});
function field(
  initial,
  values = {
    knownLanguage: first,
    profession: second,
    firstName: "Unsaved",
    photo: { name: "selected.jpg" },
  },
) {
  const h = hook(initial);
  const form = {
    watch: (name) => values[name],
    setValue() {
      throw Error("Choices must not change form values");
    },
    reset() {
      throw Error("Form must not reset");
    },
  };
  const module = load("components/inputs/ProfileOptionField.tsx", {
    "react/jsx-runtime": jsx,
    "./Dropdown": "dropdown",
    "@/components/ui/button": { Button: "button" },
    "@/lib/hooks/useProfileOptions": { useProfileOptions: () => h.read() },
  });
  const render = (extra = {}) =>
    module.default({
      form,
      kind: "language",
      initialResult: initial,
      selectedLabel: "Saved language",
      savedId: first,
      ...extra,
    });
  return { h, form, values, module, render };
}
test("failed lookup keeps the saved selection visible and retries without resetting any form value", async () => {
  const f = field(failed),
    snapshot = { ...f.values };
  const dropdown = find(f.render(), (node) => node.type === "dropdown");
  assert.equal(dropdown.props.value, first);
  assert.equal(dropdown.props.disabled, true);
  assert.equal(dropdown.props.options[0].name, "Saved language");
  await f.h.read().retry();
  assert.equal(
    find(f.render(), (node) => node.type === "dropdown").props.disabled,
    false,
  );
  assert.deepEqual(f.values, snapshot);
  assert.equal(f.values.photo, snapshot.photo);
  f.values.knownLanguage = second;
  assert.equal(
    find(f.render(), (node) => node.type === "dropdown").props.options[0].name,
    "Current native language",
  );
});
test("loading and failure controls use status messages and retry buttons cannot submit the form", () => {
  const f = field(failed);
  const Status = f.module.ProfileOptionsStatus;
  assert.equal(Status({ status: "ready", kind: "language", retry() {} }), null);
  const loading = Status({ status: "loading", kind: "profession", retry() {} });
  assert.equal(loading.props.role, "status");
  for (const status of ["error", "empty"]) {
    const view = Status({ status, kind: "language", retry() {} });
    assert.equal(view.props.role, "alert");
    assert.equal(
      find(view, (node) => node.type === "button").props.type,
      "button",
    );
  }
});
test("talent registration keeps selected levels, added languages and education through retry", async () => {
  const state = host(),
    wait = deferred(),
    fields = {
      languageKnown: [
        { languageId: first, language: "Existing", level: "advanced" },
      ],
      education: [
        { course: "Course", institution: "School", from: "2000", to: "2001" },
      ],
    };
  const Component = load(
    "components/forms/talentsRegistration/LangEducationForm.tsx",
    {
      react: state.react,
      "react/jsx-runtime": jsx,
      "@/actions/utils.action": { getLanguagesAction: () => wait.promise },
      "@/components/inputs": { Dropdown: "dropdown" },
      "@/components/ui/button": { Button: "button" },
      "@/components/ui/input": { Input: "input" },
      "@/components/inputs/ProfileOptionField": {
        ProfileOptionsStatus: "status",
      },
      "@/constants": { LEVEL_VALUES: [] },
      "@/lib/hooks/useDateSelector": {
        default: () => ({ years: [] }),
        __esModule: true,
      },
      "react-icons/md": { MdDelete: "icon" },
    },
  ).default;
  const form = {
    getValues: (key) => fields[key],
    setValue: (key, value) => {
      fields[key] = value;
    },
  };
  const render = () =>
    state.render(() => Component({ form, langData: failed }));
  find(
    render(),
    (node) =>
      node.type === "dropdown" && node.props.inputName === "levelPicker",
  ).props.onValueChange("intermediate");
  find(
    render(),
    (node) => node.type === "input" && node.props.placeholder === "Course Name",
  ).props.onChange({ target: { value: "Unfinished course" } });
  assert.equal(
    find(
      render(),
      (node) =>
        node.type === "dropdown" && node.props.inputName === "languagePicker",
    ).props.disabled,
    true,
  );
  const retry = find(render(), (node) => node.type === "status").props.retry();
  wait.resolve(language("New language", second));
  await retry;
  assert.equal(
    find(
      render(),
      (node) =>
        node.type === "dropdown" && node.props.inputName === "levelPicker",
    ).props.value,
    "intermediate",
  );
  assert.equal(
    find(
      render(),
      (node) =>
        node.type === "input" && node.props.placeholder === "Course Name",
    ).props.value,
    "Unfinished course",
  );
  find(
    render(),
    (node) =>
      node.type === "dropdown" && node.props.inputName === "languagePicker",
  ).props.onValueChange(second);
  find(
    render(),
    (node) => node.type === "button" && node.props.children === "Add Language",
  ).props.onClick({ preventDefault() {} });
  assert.equal(fields.languageKnown.length, 2);
  assert.equal(fields.languageKnown[1].level, "intermediate");
  assert.equal(fields.education.length, 1);
});
function server(reply, failure) {
  const calls = [],
    redirect = { digest: "NEXT_REDIRECT" };
  const actions = load(
    "actions/utils.action.tsx",
    {
      "@/lib/session": {
        getAuthHeaders: async () => {
          if (failure === "auth") throw redirect;
          return { Authorization: "test" };
        },
      },
      "next/dist/client/components/redirect": {
        isRedirectError: (error) => error === redirect,
      },
    },
    {
      fetch: async (url, options) => {
        calls.push({ url, options });
        if (failure === "network") throw Error("offline");
        return {
          ok: reply.ok,
          json: async () => {
            if (failure === "json") throw Error("bad JSON");
            return reply.body;
          },
        };
      },
    },
  );
  return { actions, calls, redirect };
}
test("lookup actions retain failure status, timeouts and session redirects", async () => {
  for (const name of ["getLanguagesAction", "getProfessionsAction"]) {
    for (const [reply, failure] of [
      [{ ok: false }, undefined],
      [{ ok: true, body: { status: "7400", response: {} } }, undefined],
      [{}, "network"],
      [{ ok: true }, "json"],
    ]) {
      const h = server(reply, failure);
      assert.equal((await h.actions[name]()).status, "400");
      assert.ok(h.calls[0].options.signal instanceof AbortSignal);
    }
    const h = server({}, "auth");
    await assert.rejects(h.actions[name](), (error) => error === h.redirect);
  }
});
