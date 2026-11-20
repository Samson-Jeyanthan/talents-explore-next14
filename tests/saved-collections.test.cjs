const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { isRedirectError } = require("next/dist/client/components/redirect");
const folder = "6aff08a32e63b493d0e6e338";
const post = "6aff08a32e63b493d0e6e337";
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
const utils = load("lib/utils/savedCollections.ts");
function api(responses = [], authFailure) {
  const calls = [];
  const invalidations = [];
  const actions = load(
    "actions/save.action.tsx",
    {
      "@/components/cards/SavedItemCard": {},
      "@/components/cards/SavedFolderCard": {},
      "@/lib/utils/savedCollections": utils,
      "@/lib/session": {
        getAuthHeaders: async () => {
          if (authFailure) throw authFailure;
          return { Authorization: "Bearer fresh-session" };
        },
      },
      "./tokenAndHeaders.action": {
        resolveViewerIdAction: async () => "authenticated-viewer",
      },
      "next/cache": { revalidatePath: (path) => invalidations.push(path) },
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
  return { actions, calls, invalidations };
}
test("collection creation trims names and uses authenticated identity instead of caller identity", async () => {
  const h = api([{ status: "7400" }]);
  assert.equal(
    (
      await h.actions.createSaveCollectionFolderAction(
        "another-user",
        "  My work  ",
      )
    ).status,
    "7400",
  );
  assert.deepEqual(JSON.parse(h.calls[0].options.body), {
    userId: "authenticated-viewer",
    collectionName: "My work",
  });
  assert.equal(
    h.calls[0].options.headers.Authorization,
    "Bearer fresh-session",
  );
  assert.deepEqual(h.invalidations, ["/saved-collection"]);
});
test("HTTP failure, duplicate names and network failures never invalidate collections", async () => {
  const h = api([
    { status: "7400", httpOk: false },
    { status: "7407", message: "Already exists" },
    new Error("offline"),
  ]);
  for (let i = 0; i < 3; i++)
    assert.notEqual(
      (await h.actions.createSaveCollectionFolderAction("", "Work")).status,
      "7400",
    );
  assert.equal(h.invalidations.length, 0);
});
test("rename encodes slashes, spaces and unicode without altering the submitted name", async () => {
  const h = api([{ status: "7400" }]);
  const name = "Research / Art & 🎬";
  await h.actions.editSaveCollectionFolderAction(folder, name);
  assert.equal(
    h.calls[0].url,
    `https://backend.test/collection/${folder}/${encodeURIComponent(name)}`,
  );
  assert.equal(JSON.parse(h.calls[0].options.body).name, name);
});
test("save and unsave use correct methods and invalidate only after confirmed success", async () => {
  const h = api([{ status: "7400" }, { status: "7401" }, { status: "7400" }]);
  await h.actions.addPostToSaveCollectionAction(folder, post);
  await h.actions.removeFromSaveCollectionAction(folder, post);
  assert.equal(h.invalidations.length, 2);
  await h.actions.removeFromSaveCollectionAction(folder, post);
  assert.deepEqual(
    h.calls.map((call) => call.options.method),
    ["POST", "DELETE", "DELETE"],
  );
  assert.equal(h.invalidations.length, 4);
});
test("invalid identifiers, pagination and blank names never reach backend", async () => {
  const h = api();
  await h.actions.getSavedFoldersAction("../x");
  await h.actions.getSavedItemsAction(folder, 0);
  await h.actions.getSavedItemsAction(folder, 1, 101);
  await h.actions.createSaveCollectionFolderAction("", "   ");
  await h.actions.editSaveCollectionFolderAction(folder, " ");
  await h.actions.deleteSaveCollectionFolderAction("../x");
  await h.actions.addPostToSaveCollectionAction(folder, "invalid");
  assert.equal(h.calls.length, 0);
});
test("empty collections differ from unavailable or malformed responses", async () => {
  const h = api([
    { status: "7400", response: [] },
    new Error("offline"),
    { status: "7400", response: [{ _id: "broken" }] },
  ]);
  assert.equal((await h.actions.getSavedFoldersAction()).success, true);
  assert.equal((await h.actions.getSavedFoldersAction()).success, false);
  assert.equal((await h.actions.getSavedFoldersAction()).success, false);
});
test("folder contents paging always uses authenticated viewer and requested folder", async () => {
  const h = api([{ status: "7400", response: [] }]);
  assert.equal(
    (await h.actions.getSavedItemsAction(folder, 2, 20)).success,
    true,
  );
  const url = new URL(h.calls[0].url);
  assert.equal(url.pathname, `/feeds/collection/${folder}`);
  assert.equal(url.searchParams.get("userId"), "authenticated-viewer");
  assert.equal(url.searchParams.get("viewUserId"), "authenticated-viewer");
  assert.equal(url.searchParams.get("pageNo"), "2");
});
test("authentication redirects survive reads and mutations", async () => {
  const redirect = new Error("redirect");
  redirect.digest = "NEXT_REDIRECT;replace;/sign-in;307;";
  assert.ok(isRedirectError(redirect));
  const h = api([], redirect);
  await assert.rejects(
    h.actions.getSavedFoldersAction(),
    (error) => error === redirect,
  );
  await assert.rejects(
    h.actions.addPostToSaveCollectionAction(folder, post),
    (error) => error === redirect,
  );
});
test("status normalization avoids treating string false as saved and removes duplicate folders", () => {
  const rows = utils.normalizeSavedFolders([
    { _id: folder, collectionName: " Work ", status: "false" },
    { _id: folder, collectionName: "Work", status: true },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, false);
  assert.equal(rows[0].collectionName, "Work");
});

// Exercise real component handlers and effects with a small deterministic hook host.
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
      const tree = fn();
      const pending = effects;
      effects = [];
      pending.forEach((fn) => fn());
      return tree;
    },
  };
}
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
const flush = () => new Promise((resolve) => setImmediate(resolve));

test("failed collection rename retains draft and dialog; retry closes only on success", async () => {
  const state = hooks();
  let accepted = false;
  let closed = 0;
  let refreshed = 0;
  const component = load("components/modals/CRUDSaveFolder.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "@/components/ui/alert-dialog": { AlertDialogAction: "action" },
    "../ui/input": { Input: "input" },
    "next/navigation": { useRouter: () => ({ refresh: () => refreshed++ }) },
    sonner: { toast: { success() {} } },
    "@/actions/save.action": {
      editSaveCollectionFolderAction: async () =>
        accepted ? { status: "7400" } : { status: 500, message: "Offline" },
    },
  });
  const render = () =>
    state.render(() =>
      component.default({
        isFor: "EDIT",
        isOpen: true,
        folderId: folder,
        folderName: "Old",
        onClick: () => closed++,
      }),
    );
  render();
  find(render(), (node) => node.type === "input").props.onChange({
    target: { value: "New name" },
  });
  await find(render(), (node) => node.type === "action").props.onClick({
    preventDefault() {},
  });
  assert.equal(closed, 0);
  assert.equal(
    find(render(), (node) => node.type === "input").props.value,
    "New name",
  );
  accepted = true;
  await find(render(), (node) => node.type === "action").props.onClick({
    preventDefault() {},
  });
  assert.equal(closed, 1);
  assert.equal(refreshed, 1);
});

test("saved posts load page two from their collection and retry the same page after failure", async () => {
  const state = hooks();
  const calls = [];
  const initialItems = Array.from({ length: 20 }, (_, i) => ({
    _id: String(i),
  }));
  const component = load(
    "components/widgets/savedCollections/SavedCollectionItems.tsx",
    {
      react: state.react,
      "react/jsx-runtime": jsx,
      "@/components/cards/SavedItemCard": {},
      "@/components/ui/button": { Button: "button" },
      "@/lib/utils/feedPagination": load("lib/utils/feedPagination.ts"),
      "@/actions/save.action": {
        getSavedItemsAction: async (...args) => {
          calls.push(args);
          return calls.length === 1
            ? { success: false, message: "Offline" }
            : { success: true, data: [{ _id: "next" }] };
        },
      },
    },
  );
  const render = () =>
    state.render(() => component.default({ folderId: folder, initialItems }));
  render();
  await find(render(), (node) => node.type === "button").props.onClick();
  assert.ok(find(render(), (node) => node.props?.role === "alert"));
  await find(render(), (node) => node.type === "button").props.onClick();
  assert.deepEqual(calls, [
    [folder, 2, 20],
    [folder, 2, 20],
  ]);
  assert.equal(
    find(render(), (node) => node.type === "button"),
    undefined,
  );
});
function cardHarness(action) {
  const state = hooks();
  const changed = [];
  const component = load("components/cards/SavedListCard.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "lucide-react": {},
    "@/actions/save.action": {
      addPostToSaveCollectionAction: action,
      removeFromSaveCollectionAction: action,
    },
  });
  const props = {
    collectionId: folder,
    collectionName: "Work",
    postId: post,
    postStatus: false,
    onChanged: (value) => changed.push(value),
  };
  const render = () => state.render(() => component.default(props));
  render();
  return {
    render,
    props,
    changed,
    button: () => find(render(), (node) => node.type === "button"),
  };
}
test("save checkmark waits for acknowledgement and duplicate clicks send only one write", async () => {
  let finish;
  let calls = 0;
  const h = cardHarness(() => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const button = h.button();
  const pending = button.props.onClick();
  await button.props.onClick();
  assert.equal(calls, 1);
  assert.equal(h.button().props["aria-pressed"], false);
  finish({ status: "7400" });
  await pending;
  assert.equal(h.button().props["aria-pressed"], true);
  assert.deepEqual(h.changed, [true]);
});
test("failed unsave retains checkmark and exposes retry", async () => {
  let fail = false;
  const h = cardHarness(async () =>
    fail ? { status: 500, message: "Offline" } : { status: "7400" },
  );
  await h.button().props.onClick();
  fail = true;
  await h.button().props.onClick();
  assert.equal(h.button().props["aria-pressed"], true);
  assert.ok(find(h.render(), (node) => node.props?.role === "alert"));
});
test("switching post ignores obsolete writes and resets saved status even when prop flag is unchanged", async () => {
  let finish;
  const h = cardHarness(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = h.button().props.onClick();
  h.props.postId = folder;
  h.render();
  finish({ status: "7400" });
  await pending;
  assert.equal(h.button().props["aria-pressed"], false);
  assert.equal(h.changed.length, 0);
});
test("create failures preserve typed name; refresh runs only after creation acknowledgement", async () => {
  const state = hooks();
  let reads = 0;
  let writes = 0;
  let finish;
  const component = load("components/modals/SaveCollection.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "lucide-react": {},
    "../ui/dialog": { Dialog: "dialog", DialogContent: "content" },
    "../buttons": {},
    "../cards/SavedListCard": {},
    "../ui/input": { Input: "input" },
    "../ui/button": { Button: "button" },
    sonner: { toast: { success() {} } },
    "@/actions/save.action": {
      getSavedFoldersAction: async () => {
        reads++;
        return { success: true, data: [] };
      },
      createSaveCollectionFolderAction: () => {
        writes++;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    },
  });
  const render = () => state.render(() => component.default({ postId: post }));
  render().props.onOpenChange(true);
  render();
  await flush();
  find(render(), (node) => node.type === "input").props.onChange({
    target: { value: "Keep this name" },
  });
  const submit = () =>
    find(render(), (node) => node.type === "form").props.onSubmit({
      preventDefault() {},
    });
  submit();
  submit();
  assert.equal(writes, 1);
  assert.equal(reads, 1);
  finish({ status: "7407", message: "Already exists" });
  await flush();
  assert.equal(
    find(render(), (node) => node.type === "input").props.value,
    "Keep this name",
  );
  assert.equal(reads, 1);
  submit();
  finish({ status: "7400" });
  await flush();
  assert.equal(reads, 2);
  assert.equal(find(render(), (node) => node.type === "input").props.value, "");
});
