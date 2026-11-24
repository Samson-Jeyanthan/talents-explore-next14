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
      URL,
      File: globalThis.File,
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
const profile = "dddddddddddddddddddddddd",
  entry = "aaaaaaaaaaaaaaaaaaaaaaaa",
  otherEntry = "bbbbbbbbbbbbbbbbbbbbbbbb",
  english = "111111111111111111111111",
  french = "222222222222222222222222",
  spanish = "333333333333333333333333";
const row = (id = entry, languageId = english, name = "English") => ({
  _id: id,
  languageId,
  languageName: name,
  level: "beginner",
});
const ok = (response) => ({ status: "7400", response });
const input = (editing = true) => ({
  profileId: profile,
  ...(editing ? { entryId: entry } : {}),
  language: { languageId: english, level: "advanced" },
});
const plain = (value) => JSON.parse(JSON.stringify(value));
function api(responses = [], authError, cacheError = false) {
  const calls = [],
    invalidations = [];
  let auth = 0;
  const actions = load(
    "actions/profile-languages.action.ts",
    {
      "@/lib/session": {
        getAuthHeaders: async () => {
          auth++;
          if (authError) throw authError;
          return { Authorization: "Bearer test" };
        },
      },
      "next/cache": {
        revalidatePath: (...args) => {
          invalidations.push(args);
          if (cacheError) throw Error("cache");
        },
      },
      "next/dist/client/components/redirect": {
        isRedirectError: (error) => error?.digest?.startsWith("NEXT_REDIRECT"),
      },
    },
    {
      fetch: async (url, options) => {
        calls.push({
          url,
          options,
          body: options.body ? JSON.parse(options.body) : undefined,
        });
        const next = responses.shift();
        if (next instanceof Error) throw next;
        return {
          ok: next?.httpStatus ? next.httpStatus < 400 : true,
          json: async () => next,
        };
      },
    },
  );
  return {
    action: actions.saveProfileLanguageAction,
    deleteAction: actions.deleteProfileLanguageAction,
    calls,
    invalidations,
    auth: () => auth,
  };
}
test("level-only edit sends the stable language ID and preserves freshly read entries and metadata", async () => {
  const newer = {
    ...row(otherEntry, french, "French"),
    note: "added in another tab",
  };
  const h = api([
    ok({ _id: profile }),
    ok([{ ...row(), custom: "keep" }, newer]),
    ok({}),
  ]);
  const result = await h.action({ ...input(), dataArray: [] });
  assert.equal(result.status, "7400");
  assert.equal(h.calls.length, 3);
  assert.equal(
    h.calls[1].url,
    `https://backend.test/user/languages/${profile}`,
  );
  assert.equal(h.calls[2].url, "https://backend.test/user/languages");
  assert.equal(h.calls[2].body[0].languageId, english);
  assert.equal(h.calls[2].body[0].languageName, "English");
  assert.equal(h.calls[2].body[0].level, "advanced");
  assert.equal(h.calls[2].body[0].custom, "keep");
  assert.equal(h.calls[2].body[0]._id, entry);
  assert.deepEqual(h.calls[2].body[1], newer);
  assert.equal(h.invalidations.length, 1);
  assert.ok(
    h.calls.every((call) => call.options.signal instanceof AbortSignal),
  );
});
test("adding or changing a language uses the catalog label and retains other saved languages", async () => {
  for (const editing of [false, true]) {
    const data = {
      ...input(editing),
      language: {
        languageId: spanish,
        level: "intermediate",
        languageName: "Untrusted label",
      },
    };
    const h = api([
      ok({ _id: profile }),
      ok([row(), row(otherEntry, french, "French")]),
      ok([{ _id: spanish, language: "Spanish" }]),
      ok({}),
    ]);
    assert.equal((await h.action(data)).status, "7400");
    const body = h.calls[3].body;
    assert.equal(h.calls[2].url, "https://backend.test/language");
    const changed = editing ? body[0] : body[2];
    assert.equal(changed.languageName, "Spanish");
    assert.equal(changed.languageId, spanish);
    assert.equal(changed.level, "intermediate");
    assert.equal(body[1].languageId, french);
    assert.equal(body.length, editing ? 2 : 3);
  }
});
test("malformed IDs, labels used as IDs and unknown levels are rejected before authentication", async () => {
  for (const value of [
    null,
    {},
    { ...input(), profileId: "other" },
    { ...input(), entryId: "" },
    { ...input(), language: { languageId: "English", level: "advanced" } },
    { ...input(), language: { languageId: english, level: "fluent" } },
    { ...input(), language: { languageId: english } },
  ]) {
    const h = api();
    assert.equal((await h.action(value)).status, "400");
    assert.equal(h.auth(), 0);
    assert.equal(h.calls.length, 0);
  }
});
test("other owners and missing or malformed rows cannot be overwritten", async () => {
  const foreign = api([ok({ _id: otherEntry })]);
  assert.equal((await foreign.action(input())).status, "400");
  assert.equal(foreign.calls.length, 1);
  for (const rows of [
    [],
    {},
    [null],
    [row(), row()],
    [{ ...row(), languageId: undefined }],
  ]) {
    const h = api([ok({ _id: profile }), ok(rows)]);
    assert.equal((await h.action(input())).status, "400");
    assert.equal(
      h.calls.filter((call) => call.options.method === "PUT").length,
      0,
    );
  }
});
test("identical add retries are idempotent while conflicting duplicate languages are blocked", async () => {
  const h = api([ok({ _id: profile }), ok([{ ...row(), level: "advanced" }])]);
  assert.equal((await h.action(input(false))).status, "7400");
  assert.equal(h.calls.length, 2);
  const conflict = api([ok({ _id: profile }), ok([row()])]);
  assert.equal((await conflict.action(input(false))).status, "400");
  assert.equal(conflict.calls.length, 2);
  const edit = api([
    ok({ _id: profile }),
    ok([row(), row(otherEntry, french, "French")]),
  ]);
  assert.equal(
    (
      await edit.action({
        ...input(),
        language: { languageId: french, level: "advanced" },
      })
    ).status,
    "400",
  );
  assert.equal(edit.calls.length, 2);
});
test("unknown catalog selections and failed reads cannot issue a write", async () => {
  for (const result of [
    ok([]),
    ok([{ _id: french, language: "French" }]),
    { status: "400" },
    { ...ok([]), httpStatus: 500 },
    new Error("offline"),
  ]) {
    const h = api([ok({ _id: profile }), ok([row()]), result]);
    assert.equal(
      (
        await h.action({
          ...input(false),
          language: { languageId: spanish, level: "advanced" },
        })
      ).status,
      "400",
    );
    assert.equal(
      h.calls.filter((call) => call.options.method === "PUT").length,
      0,
    );
  }
});
test("failed writes retain retry errors and cache failure cannot undo an acknowledged save", async () => {
  for (const response of [
    { status: "400" },
    { ...ok({}), httpStatus: 500 },
    new Error("offline"),
  ]) {
    const h = api([ok({ _id: profile }), ok([row()]), response]);
    const result = await h.action(input());
    assert.equal(result.status, "400");
    assert.match(result.message, /still here/);
    assert.equal(h.invalidations.length, 0);
  }
  const saved = api(
    [ok({ _id: profile }), ok([row()]), ok({})],
    undefined,
    true,
  );
  assert.equal((await saved.action(input())).status, "7400");
  const redirect = Object.assign(Error("redirect"), {
    digest: "NEXT_REDIRECT;replace;/session/refresh;307;",
  });
  await assert.rejects(
    api([], redirect).action(input()),
    (error) => error === redirect,
  );
});
function hooks() {
  const cells = [];
  let cursor = 0,
    effects = [],
    dirty = false;
  const changed = (a, b) =>
    !a ||
    a.length !== b.length ||
    a.some((value, i) => !Object.is(value, b[i]));
  return {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in cells)) {
          const cell = {
            value: typeof initial === "function" ? initial() : initial,
          };
          cell.set = (value) => {
            const next =
              typeof value === "function" ? value(cell.value) : value;
            if (!Object.is(next, cell.value)) {
              cell.value = next;
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
          const previous = cells[i],
            cell = (cells[i] = { deps });
          effects.push(() => {
            previous?.cleanup?.();
            cell.cleanup = fn();
          });
        }
      },
    },
    render(fn) {
      let tree,
        count = 0;
      do {
        dirty = false;
        cursor = 0;
        effects = [];
        tree = fn();
        effects.forEach((fn) => fn());
        if (++count > 10) throw Error("Render loop");
      } while (dirty);
      return tree;
    },
    unmount() {
      cells.forEach((cell) => cell?.cleanup?.());
    },
  };
}
const jsx = {
  Fragment: "fragment",
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
function find(tree, fn) {
  if (!tree || typeof tree !== "object") return;
  if (Array.isArray(tree)) {
    for (const node of tree) {
      const found = find(node, fn);
      if (found) return found;
    }
    return;
  }
  return fn(tree) ? tree : find(tree.props?.children, fn);
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function editor({ editing = true, save, lookupFailure = false } = {}) {
  const host = hooks(),
    calls = [],
    navigation = [],
    closed = [];
  let fields = {},
    fail = false,
    badLookup = lookupFailure;
  const form = {
    formState: { isSubmitting: false },
    reset: (next) => {
      fields = { ...next };
    },
    watch: (key) => fields[key],
    handleSubmit: (fn) => () => fn(fields),
  };
  const props = {
    isOpen: true,
    isEdit: editing,
    data: editing ? row() : undefined,
    onClose: () => closed.push(true),
  };
  const component = load(
    "components/widgets/profile/ProfileLanguageEditor.tsx",
    {
      react: host.react,
      "react/jsx-runtime": jsx,
      "@/components/ui/dialog": {
        Dialog: "dialog",
        DialogContent: "content",
        DialogTitle: "title",
      },
      "@/components/ui/form": { Form: "form-provider" },
      "@/components/forms/LanguageEditForm": "language-form",
      "react-icons/md": { MdClose: "icon" },
      "react-hook-form": { useForm: () => form },
      "@hookform/resolvers/zod": { zodResolver: () => ({}) },
      "next/navigation": {
        useParams: () => ({ userId: profile }),
        useRouter: () => ({ refresh: () => navigation.push("refresh") }),
      },
      "@/actions/utils.action": {
        getLanguagesAction: async () =>
          badLookup
            ? { status: "400", response: [] }
            : ok([
                { _id: english, language: "English" },
                { _id: french, language: "French" },
              ]),
      },
      "@/actions/profile-languages.action": {
        saveProfileLanguageAction: async (payload) => {
          calls.push(plain(payload));
          return save
            ? save(payload)
            : fail
              ? { status: "400", message: "Offline" }
              : { status: "7400" };
        },
      },
    },
  ).default;
  const render = () => host.render(() => component(props));
  render();
  const child = () =>
    find(render(), (node) => node.type === "language-form").props;
  return {
    props,
    render,
    child,
    calls,
    navigation,
    closed,
    fields: () => fields,
    submit: () => child().onSubmit(fields),
    unmount: host.unmount,
    setFail(value) {
      fail = value;
    },
    recoverLookup() {
      badLookup = false;
    },
  };
}
test("level-only UI edits keep the saved language ID and refresh only after success", async () => {
  const h = editor();
  await new Promise(setImmediate);
  assert.equal(h.fields().languageId, english);
  h.fields().languageLevel = "advanced";
  await h.submit();
  assert.equal(h.calls[0].language.languageId, english);
  assert.equal(h.calls[0].language.level, "advanced");
  assert.equal(h.calls[0].entryId, entry);
  assert.equal(h.closed.length, 1);
  assert.deepEqual(h.navigation, ["refresh"]);
});
test("lookup retry preserves selected language and level; editing a saved language works during a catalog failure", async () => {
  const h = editor({ lookupFailure: true });
  await new Promise(setImmediate);
  assert.equal(h.child().lookup.status, "error");
  h.fields().languageLevel = "intermediate";
  h.recoverLookup();
  await h.child().lookup.retry();
  assert.equal(h.fields().languageId, english);
  assert.equal(h.fields().languageLevel, "intermediate");
  assert.equal(h.child().lookup.status, "ready");
  const saved = editor({ lookupFailure: true });
  await new Promise(setImmediate);
  saved.fields().languageLevel = "advanced";
  await saved.submit();
  assert.equal(saved.calls.length, 1);
  const adding = editor({ editing: false, lookupFailure: true });
  await new Promise(setImmediate);
  adding.fields().languageId = english;
  adding.fields().languageLevel = "advanced";
  await adding.submit();
  assert.equal(adding.calls.length, 0);
  assert.match(adding.child().error, /Reload/);
});
test("save failures leave the form open with its entry available for retry", async () => {
  const h = editor();
  await new Promise(setImmediate);
  h.fields().languageLevel = "intermediate";
  h.setFail(true);
  await h.submit();
  assert.equal(h.child().error, "Offline");
  assert.equal(h.fields().languageId, english);
  assert.equal(h.fields().languageLevel, "intermediate");
  assert.equal(h.closed.length, 0);
  h.setFail(false);
  await h.submit();
  assert.equal(h.calls.length, 2);
  assert.equal(h.closed.length, 1);
});
test("duplicate submission and pending close controls cannot interrupt a save", async () => {
  const wait = deferred(),
    h = editor({ save: () => wait.promise });
  await new Promise(setImmediate);
  const one = h.submit(),
    two = h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(h.child().pending, true);
  find(h.render(), (node) => node.type === "dialog").props.onOpenChange(false);
  let prevented = 0;
  find(h.render(), (node) => node.type === "content").props.onEscapeKeyDown({
    preventDefault() {
      prevented++;
    },
  });
  assert.equal(prevented, 1);
  assert.equal(h.closed.length, 0);
  assert.equal(
    find(
      h.render(),
      (node) => node.props?.["aria-label"] === "Close language editor",
    ).props.disabled,
    true,
  );
  wait.resolve({ status: "7400" });
  await Promise.all([one, two]);
  assert.equal(h.closed.length, 1);
});
test("changing entries resets the correct defaults and ignores an older pending save", async () => {
  const wait = deferred(),
    h = editor({ save: () => wait.promise });
  await new Promise(setImmediate);
  const pending = h.submit();
  h.props.data = row(otherEntry, french, "French");
  h.render();
  assert.equal(h.fields().languageId, french);
  wait.resolve({ status: "7400" });
  await pending;
  assert.equal(h.closed.length, 0);
  assert.equal(h.navigation.length, 0);
});
test("closing during a save cannot trigger a late refresh", async () => {
  const wait = deferred(),
    h = editor({ save: () => wait.promise });
  await new Promise(setImmediate);
  const pending = h.submit();
  h.unmount();
  wait.resolve({ status: "7400" });
  await pending;
  assert.equal(h.closed.length, 0);
  assert.equal(h.navigation.length, 0);
});
test("language form binds to the ID and shows Add/Update and pending labels correctly", () => {
  const Component = load("components/forms/LanguageEditForm.tsx", {
    "react/jsx-runtime": jsx,
    "../ui/button": { Button: "button" },
    "../inputs": { Dropdown: "dropdown" },
    "../inputs/ProfileOptionField": { ProfileOptionsStatus: "status" },
    "@/constants": { LEVEL_VALUES: [] },
  }).default;
  const form = {
    watch: (name) => (name === "languageId" ? english : "advanced"),
    formState: { isSubmitting: false },
    handleSubmit: (fn) => fn,
  };
  for (const isEdit of [false, true])
    for (const pending of [false, true]) {
      const tree = Component({
          form,
          isEdit,
          pending,
          error: "",
          savedLanguage: row(),
          lookup: { status: "error", options: [], retry() {} },
          onSubmit() {},
        }),
        button = find(tree, (node) => node.type === "button");
      assert.equal(
        button.props.children,
        pending
          ? isEdit
            ? "Updating..."
            : "Adding..."
          : isEdit
            ? "Update"
            : "Add",
      );
      assert.equal(button.props.type, "submit");
      const language = find(
        tree,
        (node) =>
          node.type === "dropdown" && node.props.formLabel === "Known Language",
      );
      assert.equal(language.props.inputName, "languageId");
      assert.equal(language.props.value, english);
      assert.equal(language.props.disabled, true);
      assert.equal(
        language.props.options[0].name,
        isEdit ? "English" : "Current language",
      );
    }
});
test("closed language dialogs do not mount lookups and education/award routing is preserved", () => {
  const Component = load("components/modals/ProDetailsModal.tsx", {
    "react/jsx-runtime": jsx,
    "@/components/widgets/profile/ProfileLanguageEditor": "language",
    "@/components/widgets/profile/ProfileEducationEditor": "education",
    "@/components/widgets/profile/ProfileAwardEditor": "award",
  }).default;
  assert.equal(Component({ isOpen: false, detailModalFor: "language" }), null);
  assert.equal(
    Component({ isOpen: true, detailModalFor: "languageEdit", isEdit: true })
      .type,
    "language",
  );
  for (const kind of ["education", "award"]) {
    const view = Component({
      isOpen: true,
      detailModalFor: kind + "Edit",
      isEdit: true,
    });
    assert.equal(view.type, kind);
    assert.equal(view.props.isEdit, true);
  }
});

test("deletion removes only the selected stable entry from the latest list", async () => {
  const newer = {
    ...row(otherEntry, french, "French"),
    note: "new in another tab",
  };
  const h = api([ok({ _id: profile }), ok([newer, row()]), ok({})]);
  assert.equal((await h.deleteAction(profile, entry)).status, "7400");
  assert.deepEqual(h.calls[2].body, [newer]);
  assert.equal(h.calls[2].options.method, "PUT");
  assert.equal(h.calls[2].url, "https://backend.test/user/languages");
  assert.equal(h.invalidations.length, 1);
});
test("deleting the last language sends an empty array and an already-deleted retry never removes another row", async () => {
  const last = api([ok({ _id: profile }), ok([row()]), ok({})]);
  assert.equal((await last.deleteAction(profile, entry)).status, "7400");
  assert.deepEqual(last.calls[2].body, []);
  const retry = api([
    ok({ _id: profile }),
    ok([row(otherEntry, french, "French")]),
  ]);
  assert.equal((await retry.deleteAction(profile, entry)).status, "7400");
  assert.equal(retry.calls.length, 2);
  assert.equal(retry.invalidations.length, 1);
});
test("invalid deletion selections, other owners and failed or malformed list reads cannot write", async () => {
  for (const [owner, id] of [
    ["bad", entry],
    [profile, ""],
    [profile, " "],
    [profile, undefined],
    [undefined, entry],
    [profile, "x".repeat(4097)],
  ]) {
    const h = api();
    assert.equal((await h.deleteAction(owner, id)).status, "400");
    assert.equal(h.auth(), 0);
  }
  const foreign = api([ok({ _id: otherEntry })]);
  assert.equal((await foreign.deleteAction(profile, entry)).status, "400");
  assert.equal(foreign.calls.length, 1);
  for (const rows of [
    ok(null),
    ok({}),
    ok([null]),
    ok([row(), row()]),
    { status: "400" },
    { ...ok([row()]), httpStatus: 500 },
    new Error("offline"),
  ]) {
    const h = api([ok({ _id: profile }), rows]);
    assert.equal((await h.deleteAction(profile, entry)).status, "400");
    assert.equal(
      h.calls.filter((call) => call.options.method === "PUT").length,
      0,
    );
  }
});
test("failed deletes remain retryable and cache failure cannot undo confirmed deletion", async () => {
  for (const response of [
    { status: "400" },
    { ...ok({}), httpStatus: 500 },
    new Error("offline"),
  ]) {
    const h = api([ok({ _id: profile }), ok([row()]), response]);
    const result = await h.deleteAction(profile, entry);
    assert.equal(result.status, "400");
    assert.match(result.message, /try again/);
    assert.equal(h.invalidations.length, 0);
  }
  const saved = api(
    [ok({ _id: profile }), ok([row()]), ok({})],
    undefined,
    true,
  );
  assert.equal((await saved.deleteAction(profile, entry)).status, "7400");
  const redirect = Object.assign(Error("redirect"), {
    digest: "NEXT_REDIRECT;replace;/session/refresh;307;",
  });
  await assert.rejects(
    api([], redirect).deleteAction(profile, entry),
    (error) => error === redirect,
  );
});
function deletionDialog({ save } = {}) {
  const host = hooks(),
    calls = [],
    closed = [],
    navigation = [];
  let fail = false;
  const component = load(
    "components/widgets/profile/ProfileLanguageDeleteDialog.tsx",
    {
      react: host.react,
      "react/jsx-runtime": jsx,
      "@/components/ui/button": { Button: "button" },
      "@/components/ui/alert-dialog": Object.fromEntries(
        [
          "AlertDialog",
          "AlertDialogCancel",
          "AlertDialogContent",
          "AlertDialogDescription",
          "AlertDialogFooter",
          "AlertDialogHeader",
          "AlertDialogTitle",
        ].map((name) => [name, name]),
      ),
      "next/navigation": {
        useParams: () => ({ userId: profile }),
        useRouter: () => ({ refresh: () => navigation.push("refresh") }),
      },
      "@/actions/profile-languages.action": {
        deleteProfileLanguageAction: async (...args) => {
          calls.push(args);
          return save
            ? save(...args)
            : fail
              ? { status: "400", message: "Delete failed. Retry." }
              : { status: "7400" };
        },
      },
    },
  ).default;
  const props = { isOpen: true, data: row(), onClose: () => closed.push(true) };
  const render = () => host.render(() => component(props));
  render();
  const click = () =>
    find(
      render(),
      (node) =>
        node.type === "button" &&
        node.props.className === "shad-button_primary",
    ).props.onClick();
  return {
    props,
    render,
    click,
    host,
    calls,
    closed,
    navigation,
    setFail(value) {
      fail = value;
    },
  };
}
test("deletion failure keeps the confirmation open with a retry error and success closes once", async () => {
  const h = deletionDialog();
  h.setFail(true);
  await h.click();
  assert.equal(h.closed.length, 0);
  assert.equal(h.navigation.length, 0);
  assert.equal(
    find(h.render(), (node) => node.props?.role === "alert").props.children,
    "Delete failed. Retry.",
  );
  assert.equal(
    find(h.render(), (node) => node.type === "AlertDialog").props.open,
    true,
  );
  h.setFail(false);
  await h.click();
  assert.deepEqual(h.calls, [
    [profile, entry],
    [profile, entry],
  ]);
  assert.equal(h.closed.length, 1);
  assert.deepEqual(h.navigation, ["refresh"]);
});
test("pending delete blocks duplicates, Cancel and Escape while idle cancellation makes no request", async () => {
  const wait = deferred(),
    h = deletionDialog({ save: () => wait.promise });
  const one = h.click(),
    two = h.click();
  assert.equal(h.calls.length, 1);
  const cancel = find(h.render(), (node) => node.type === "AlertDialogCancel");
  assert.equal(cancel.props.asChild, true);
  assert.equal(cancel.props.children.props.disabled, true);
  const dialog = find(h.render(), (node) => node.type === "AlertDialog");
  dialog.props.onOpenChange(false);
  assert.equal(h.closed.length, 0);
  let prevented = 0;
  find(
    h.render(),
    (node) => node.type === "AlertDialogContent",
  ).props.onEscapeKeyDown({
    preventDefault() {
      prevented++;
    },
  });
  assert.equal(prevented, 1);
  wait.resolve({ status: "7400" });
  await Promise.all([one, two]);
  assert.equal(h.closed.length, 1);
  const idle = deletionDialog();
  find(idle.render(), (node) => node.type === "AlertDialog").props.onOpenChange(
    false,
  );
  assert.equal(idle.closed.length, 1);
  assert.equal(idle.calls.length, 0);
});
test("changing or closing the selected dialog suppresses a late delete response", async () => {
  for (const close of [false, true]) {
    const wait = deferred(),
      h = deletionDialog({ save: () => wait.promise });
    const pending = h.click();
    if (close) h.host.unmount();
    else {
      h.props.data = row(otherEntry, french, "French");
      h.render();
    }
    wait.resolve({ status: "7400" });
    await pending;
    assert.equal(h.closed.length, 0);
    assert.equal(h.navigation.length, 0);
  }
  const missing = deletionDialog();
  missing.props.data = undefined;
  assert.equal(
    find(
      missing.render(),
      (node) =>
        node.type === "button" &&
        node.props.className === "shad-button_primary",
    ).props.disabled,
    true,
  );
});
test("delete routing preserves education and awards and passes no stale language list", () => {
  const Component = load("components/alerts/ProInfoDeleteAlert.tsx", {
    "react/jsx-runtime": jsx,
    "@/components/widgets/profile/ProfileLanguageDeleteDialog": "language",
    "@/components/widgets/profile/ProfileEducationDeleteDialog": "education",
    "@/components/widgets/profile/ProfileAwardDeleteDialog": "award",
  }).default;
  for (const modalFor of ["language", "education", "award"]) {
    const view = Component({
      modalFor,
      isOpen: true,
      data: row(),
      dataArray: [row()],
      onCancel() {},
    });
    assert.equal(view.type, modalFor);
    assert.equal(view.props.isOpen, true);
    assert.equal("dataArray" in view.props, false);
  }
});
