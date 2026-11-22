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
      process: {
        env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.example.test" },
      },
      require(name) {
        if (name in mocks) return mocks[name];
        if (name.startsWith(".") || name.startsWith("@/")) {
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
function hooks() {
  const cells = [];
  let cursor = 0,
    effects = [];
  return {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in cells)) cells[i] = initial;
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
        if (!cells[i] || deps.some((value, j) => value !== cells[i].deps[j])) {
          const previous = cells[i];
          cells[i] = { deps };
          effects.push(() => {
            previous?.cleanup?.();
            cells[i].cleanup = fn();
          });
        }
      },
    },
    render(fn) {
      cursor = 0;
      effects = [];
      const tree = fn();
      effects.forEach((fn) => fn());
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
    for (const node of tree) {
      const found = find(node, predicate);
      if (found) return found;
    }
    return;
  }
  return predicate(tree) ? tree : find(tree.props?.children, predicate);
}
const jsx = {
  Fragment: "fragment",
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function formHarness({ upload, save } = {}) {
  const state = hooks(),
    uploads = [],
    saves = [],
    redirects = [],
    users = [],
    notices = [];
  let user = {
    currentUserId: "111111111111111111111111",
    username: "qa-user",
    email: "qa@example.test",
  };
  const values = {
    firstName: "Test",
    lastName: "User",
    dob: "2000-01-01",
    gender: "male",
    knownLanguage: "language",
    profession: "profession",
    quotes: "Hello",
    location: "Test city",
    latitude: 0,
    longitude: 0,
    profilePhoto: { name: "profile.jpg" },
    coverPhoto: { name: "cover.jpg" },
  };
  const mocks = {
    react: state.react,
    "react/jsx-runtime": jsx,
    "../ui/form": {
      Form: "Form",
      FormField: "FormField",
      FormMessage: "FormMessage",
    },
    "../inputs": {},
    "@/constants": {},
    "../ui/button": { Button: "button" },
    "@/lib/validations/auth.validation": {},
    "@hookform/resolvers/zod": { zodResolver: () => ({}) },
    "react-hook-form": {
      useForm: () => ({
        control: {},
        formState: { isSubmitting: false },
        getValues: (key) => values[key],
        handleSubmit: (fn) => () => fn(values),
      }),
    },
    "@/context/AuthProvider": {
      useUserContext: () => ({ user, setUser: (value) => users.push(value) }),
    },
    "@/actions/auth.action": {
      completeProfileAction: async (payload) => {
        saves.push({ ...payload });
        return save ? save(payload) : { status: "7400" };
      },
    },
    "@/lib/utils/uploadFile": {
      uploadFileToStorage: async (file, prefix, id) => {
        uploads.push({ file, prefix, id });
        return upload
          ? upload(file, prefix, id)
          : { url: `https://example.test/${file.name}`, key: file.name };
      },
    },
    "next/navigation": {
      useRouter: () => ({ push: (route) => redirects.push(route) }),
    },
    "../modals": { TransparentLoader: "loader" },
    "../inputs/ProfileLocation": {},
    sonner: { toast: { success: (message) => notices.push(message) } },
  };
  const component = load(
    "components/forms/CompleteProfileForm.tsx",
    mocks,
  ).default;
  const render = () =>
    state.render(() =>
      component({
        langData: { response: [] },
        professionData: { response: [] },
      }),
    );
  render();
  return {
    values,
    uploads,
    saves,
    redirects,
    users,
    notices,
    render,
    submit: () =>
      find(render(), (node) => node.type === "form").props.onSubmit(),
    error: () =>
      find(render(), (node) => node.props?.role === "alert")?.props.children ||
      "",
    pending: () =>
      find(render(), (node) => node.type === "form").props["aria-busy"],
    disabled: () =>
      find(render(), (node) => node.type === "fieldset").props.disabled,
    unmount: state.unmount,
    switchUser() {
      user = { ...user, currentUserId: "222222222222222222222222" };
      render();
    },
  };
}
test("profile upload failure is shown inline, retains all entries and makes no save request", async () => {
  const h = formHarness({
      upload: async () => {
        throw Error("offline");
      },
    }),
    original = { ...h.values };
  await h.submit();
  assert.match(h.error(), /Unable to upload your profile photo/);
  assert.equal(h.pending(), false);
  assert.equal(h.disabled(), false);
  assert.deepEqual(h.values, original);
  assert.equal(h.saves.length, 0);
  assert.equal(h.redirects.length, 0);
});
test("cover retry reuses the successful profile upload and sends the complete payload", async () => {
  let fail = true;
  const h = formHarness({
    upload: async (file) => {
      if (file.name === "cover.jpg" && fail) throw Error("offline");
      return { url: `https://example.test/${file.name}`, key: file.name };
    },
  });
  await h.submit();
  assert.match(h.error(), /cover photo/);
  assert.equal(h.saves.length, 0);
  fail = false;
  await h.submit();
  assert.deepEqual(
    h.uploads.map((row) => row.file.name),
    ["profile.jpg", "cover.jpg", "cover.jpg"],
  );
  assert.ok(h.uploads.every((row) => row.id === "111111111111111111111111"));
  assert.equal(h.saves[0].profileImage, "https://example.test/profile.jpg");
  assert.equal(h.saves[0].coverImage, "https://example.test/cover.jpg");
  assert.equal(h.saves[0].firstName, "Test");
  assert.equal(h.saves[0].latitude, 0);
  assert.equal(h.error(), "");
  assert.deepEqual(h.redirects, ["/onboarding"]);
  assert.equal(h.users.length, 1);
});
test("backend save failure preserves uploads for retry and does not report success", async () => {
  let fail = true;
  const h = formHarness({
    save: async () =>
      fail ? { status: "400", message: "Please retry" } : { status: "7400" },
  });
  await h.submit();
  assert.equal(h.error(), "Please retry");
  assert.equal(h.users.length, 0);
  assert.equal(h.notices.length, 0);
  assert.equal(h.redirects.length, 0);
  fail = false;
  await h.submit();
  assert.equal(h.uploads.length, 2);
  assert.equal(h.saves.length, 2);
  assert.equal(h.redirects.length, 1);
});
test("a thrown save error is recoverable and the pending controls unlock", async () => {
  const h = formHarness({
    save: async () => {
      throw Error("network failure");
    },
  });
  await h.submit();
  assert.match(h.error(), /network failure/);
  assert.equal(h.pending(), false);
  assert.equal(h.disabled(), false);
});
test("changed and removed photos do not reuse stale uploaded URLs", async () => {
  const h = formHarness({ save: async () => ({ status: "400" }) });
  await h.submit();
  h.values.profilePhoto = { name: "replacement.jpg" };
  h.values.coverPhoto = null;
  await h.submit();
  assert.equal(h.uploads.length, 3);
  assert.equal(h.saves[1].profileImage, "https://example.test/replacement.jpg");
  assert.equal(h.saves[1].coverImage, undefined);
});
test("duplicate submits share one in-flight upload/save and disable the form", async () => {
  const wait = deferred();
  const h = formHarness({
    upload: async (file) => {
      await wait.promise;
      return { url: `https://example.test/${file.name}`, key: file.name };
    },
  });
  const first = h.submit(),
    second = h.submit();
  assert.equal(h.uploads.length, 1);
  assert.equal(h.pending(), true);
  assert.equal(h.disabled(), true);
  wait.resolve();
  await Promise.all([first, second]);
  assert.equal(h.uploads.length, 2);
  assert.equal(h.saves.length, 1);
});
test("leaving during upload prevents subsequent uploads, saving and navigation", async () => {
  const wait = deferred();
  const h = formHarness({ upload: () => wait.promise });
  const pending = h.submit();
  h.unmount();
  wait.resolve({ url: "https://example.test/profile.jpg", key: "profile.jpg" });
  await pending;
  assert.equal(h.uploads.length, 1);
  assert.equal(h.saves.length, 0);
  assert.equal(h.users.length, 0);
  assert.equal(h.redirects.length, 0);
});
test("switching accounts clears successful upload cache and ignores the old pending submission", async () => {
  const wait = deferred();
  let pending = true;
  const h = formHarness({
    upload: async (file) => {
      if (file.name === "cover.jpg" && pending) return wait.promise;
      return { url: `https://example.test/${file.name}`, key: file.name };
    },
  });
  const original = h.submit();
  await new Promise(setImmediate);
  h.switchUser();
  pending = false;
  await h.submit();
  wait.resolve({
    url: "https://example.test/old-cover.jpg",
    key: "old-cover.jpg",
  });
  await original;
  assert.equal(
    h.uploads.filter((row) => row.file.name === "profile.jpg").length,
    2,
  );
  assert.equal(h.saves.length, 1);
  assert.equal(h.users[0].currentUserId, "222222222222222222222222");
});
test("photos remain optional", async () => {
  const h = formHarness();
  h.values.profilePhoto = undefined;
  h.values.coverPhoto = undefined;
  await h.submit();
  assert.equal(h.uploads.length, 0);
  assert.equal(h.saves.length, 1);
  assert.equal(h.redirects.length, 1);
});
function server(reply, { networkError, jsonError, authError } = {}) {
  const calls = [],
    completed = [];
  const redirect = { digest: "NEXT_REDIRECT" };
  const action = load(
    "actions/auth.action.ts",
    {
      "@/lib/config/axiosInstance": {},
      "@/lib/validations/password.validation": {},
      "@/lib/validations/signup.validation": {},
      "@/lib/session": {
        getAuthHeaders: async () => {
          if (authError) throw redirect;
          return { Authorization: "Bearer test" };
        },
      },
      "./session.action": {
        storeIsAbout: async (value) => completed.push(value),
      },
      "next/dist/client/components/redirect": {
        isRedirectError: (error) => error === redirect,
      },
    },
    {
      fetch: async (url, options) => {
        calls.push({ url, options });
        if (networkError) throw Error("offline");
        return {
          ok: reply.ok,
          json: async () => {
            if (jsonError) throw Error("bad JSON");
            return reply.body;
          },
        };
      },
    },
  ).completeProfileAction;
  return { action, calls, completed, redirect };
}
test("save action returns serializable failures for HTTP, application, JSON and network errors", async () => {
  for (const [reply, options] of [
    [{ ok: false, body: { status: "7400" } }, {}],
    [{ ok: true, body: { status: "7401" } }, {}],
    [{ ok: true, body: null }, {}],
    [{ ok: true }, { jsonError: true }],
    [{}, { networkError: true }],
  ]) {
    const h = server(reply, options),
      result = await h.action({ firstName: "Test" });
    assert.equal(result.status, "400");
    assert.match(result.message, /try again/);
    assert.equal(h.completed.length, 0);
    assert.equal(
      h.calls[0].options.headers["Content-Type"],
      "application/json",
    );
    assert.ok(h.calls[0].options.signal instanceof AbortSignal);
  }
});
test("only a confirmed successful save marks profile setup complete", async () => {
  const h = server({ ok: true, body: { status: "7400" } });
  assert.equal((await h.action({ firstName: "Test" })).status, "7400");
  assert.deepEqual(h.completed, [true]);
});
test("authentication redirects retain Next.js handling", async () => {
  const h = server({}, { authError: true });
  await assert.rejects(h.action({}), (error) => error === h.redirect);
  assert.equal(h.calls.length, 0);
});
