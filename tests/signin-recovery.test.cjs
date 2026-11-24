const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
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
      require: (name) =>
        mocks[name] ||
        (["zod", "jwt-decode"].includes(name) ? require(name) : {}),
      ...globals,
    },
  );
  return module.exports;
}
const id = "111111111111111111111111";
const credentials = {
  email: "qa@example.test",
  password: "synthetic-password",
};
const token = (claims = {}) =>
  "e30." +
  Buffer.from(JSON.stringify({ sub: id, exp: 9999999999, ...claims })).toString(
    "base64url",
  ) +
  ".signature";
const account = {
  _id: id,
  userName: "synthetic",
  email: credentials.email,
  isTalent: true,
  personalInfo: {
    firstName: "QA",
    lastName: "User",
    profileImage: "https://example.test/photo.jpg",
  },
};
const success = () => ({ status: "7400", response: account });
const schemas = load("lib/validations/signin.validation.ts");
function server(options = {}) {
  const calls = [],
    writes = [],
    flags = [],
    logs = [],
    rollbacks = [];
  const controller = new AbortController();
  let timeout;
  const actions = load(
    "actions/auth.action.ts",
    {
      "@/lib/validations/signin.validation": schemas,
      "@/lib/session": {
        createSession: async (...args) => {
          writes.push(args);
          if (options.cookieError) throw Error("private cookie error");
          return { success: options.cookieSuccess !== false };
        },
      },
      "./session.action": {
        storeIsAbout: async (flag) => {
          flags.push(flag);
          if (options.flagError) throw Error("private flag error");
        },
        clearSession: async () => {
          rollbacks.push(true);
          return { success: true };
        },
      },
    },
    {
      process: {
        env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.example.test" },
      },
      AbortSignal: {
        timeout: (ms) => {
          timeout = ms;
          return controller.signal;
        },
      },
      console: {
        log: (...args) => logs.push(args),
        error: (...args) => logs.push(args),
      },
      fetch: async (url, init) => {
        calls.push([url, init]);
        const profile = calls.length === 2;
        if (options.transportError) throw Error("private request payload");
        if (profile && options.abortOnProfile) {
          controller.abort();
          throw controller.signal.reason;
        }
        const status =
          (profile ? options.profileHttp : options.loginHttp) ?? 200;
        return {
          ok: status >= 200 && status < 300,
          status,
          json: async () => {
            if (options.badJson) throw Error("private invalid response");
            if (profile && options.abortInBody) controller.abort();
            return profile
              ? options.profile ?? success()
              : options.login ?? {
                  status: "7400",
                  response: {
                    accessToken: token(),
                    refreshToken: "synthetic-refresh",
                  },
                };
          },
        };
      },
    },
  );
  return {
    action: actions.signinAction,
    calls,
    writes,
    flags,
    logs,
    rollbacks,
    timeout: () => timeout,
  };
}
test("login validates credentials on the server before contacting the backend", async () => {
  for (const value of [
    null,
    {},
    { ...credentials, email: "bad" },
    { ...credentials, password: "" },
    { ...credentials, password: 123 },
    { ...credentials, deviceId: "" },
  ]) {
    const h = server();
    assert.equal((await h.action(value)).status, "400");
    assert.equal(h.calls.length, 0);
  }
});
test("login creates cookies only after checking profile identity and returns sanitized display fields", async () => {
  const h = server({
    profile: {
      status: "7400",
      response: {
        ...account,
        password: "private-hash",
        accessToken: "private-token",
        personalInfo: { ...account.personalInfo, phone: "private-phone" },
      },
    },
  });
  const result = await h.action({ ...credentials, admin: true });
  assert.equal(result.status, "7400");
  assert.equal(result.response._id, id);
  for (const privateValue of [
    "private-hash",
    "private-token",
    "private-phone",
    "synthetic-refresh",
  ])
    assert.equal(JSON.stringify(result).includes(privateValue), false);
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0][0], token());
  assert.deepEqual(h.flags, [true]);
  assert.equal(JSON.parse(h.calls[0][1].body).admin, undefined);
  assert.equal(h.calls[1][1].headers.Authorization, `Bearer ${token()}`);
  assert.equal(h.calls[0][1].cache, "no-store");
  assert.equal(h.calls[1][1].cache, "no-store");
  assert.equal(h.logs.length, 0);
});
test("accounts without personal details still sign in and are marked for profile completion", async () => {
  const h = server({
    profile: {
      status: "7400",
      response: { _id: id, userName: "synthetic", email: credentials.email },
    },
  });
  const result = await h.action(credentials);
  assert.equal(result.status, "7400");
  assert.equal(result.response.personalInfo.firstName, "");
  assert.equal(result.response.isTalent, false);
  assert.deepEqual(h.flags, [false]);
});
test("failed or partially written session cookies cannot report success", async () => {
  for (const options of [
    { cookieSuccess: false },
    { cookieError: true },
    { flagError: true },
  ]) {
    const h = server(options);
    const result = await h.action(credentials);
    assert.equal(result.status, "400");
    assert.equal(h.rollbacks.length, 1);
    assert.equal(h.logs.length, 0);
    if (options.cookieSuccess === false)
      assert.match(result.message, /session/);
  }
});
test("HTTP, business, malformed JSON and network failures return safe retryable results", async () => {
  for (const options of [
    { loginHttp: 401 },
    { loginHttp: 403 },
    { loginHttp: 500 },
    { login: { status: "7401", message: "private data" } },
    { profileHttp: 503 },
    { profile: { status: "7401" } },
    { badJson: true },
    { transportError: true },
  ]) {
    const h = server(options);
    const result = await h.action(credentials);
    assert.equal(result.status, "400");
    assert.equal(h.writes.length, 0);
    assert.equal(h.flags.length, 0);
    assert.equal(JSON.stringify(result).includes("private"), false);
    assert.equal(h.logs.length, 0);
  }
});
test("missing, expired and malformed tokens or mismatched account data never create a session", async () => {
  for (const login of [
    { status: "7400" },
    { status: "7400", response: { accessToken: "bad", refreshToken: "x" } },
    { status: "7400", response: { accessToken: token(), refreshToken: "" } },
    {
      status: "7400",
      response: { accessToken: token({ exp: 1 }), refreshToken: "x" },
    },
    {
      status: "7400",
      response: { accessToken: token({ sub: null }), refreshToken: "x" },
    },
  ]) {
    const h = server({ login });
    assert.equal((await h.action(credentials)).status, "400");
    assert.equal(h.writes.length, 0);
  }
  for (const response of [
    { ...account, _id: "222222222222222222222222" },
    { ...account, email: null },
    { ...account, personalInfo: { firstName: 42 } },
  ]) {
    const h = server({ profile: { status: "7400", response } });
    assert.equal((await h.action(credentials)).status, "400");
    assert.equal(h.writes.length, 0);
  }
});
test("one 15-second deadline covers login and profile including expired response-body work", async () => {
  for (const options of [{}, { abortOnProfile: true }, { abortInBody: true }]) {
    const h = server(options);
    const result = await h.action(credentials);
    assert.equal(h.timeout(), 15000);
    assert.equal(h.calls[0][1].signal, h.calls[1][1].signal);
    if (options.abortOnProfile || options.abortInBody) {
      assert.equal(result.status, "400");
      assert.match(result.message, /timed out/);
      assert.equal(h.writes.length, 0);
    }
  }
});
const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return;
  if (Array.isArray(tree)) {
    for (const child of tree) {
      const hit = find(child, predicate);
      if (hit) return hit;
    }
    return;
  }
  return predicate(tree) ? tree : find(tree.props?.children, predicate);
}
function form({ reply = async () => success(), blocked = false } = {}) {
  const states = [],
    refs = [],
    cleanups = [],
    effects = [],
    calls = [],
    notices = [],
    navigation = [],
    users = [],
    cache = new Map();
  let cursor = 0,
    refCursor = 0,
    effectCursor = 0,
    submit;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in states)) states[i] = initial;
      return [states[i], (value) => (states[i] = value)];
    },
    useRef(initial) {
      const i = refCursor++;
      return (refs[i] ||= { current: initial });
    },
    useEffect(fn) {
      const i = effectCursor++;
      if (!(i in cleanups))
        effects.push(() => {
          cleanups[i] = fn();
        });
    },
  };
  const window = {
    location: { assign: (path) => navigation.push(path) },
    sessionStorage: {
      setItem: (key, value) => {
        if (blocked) throw Error("storage blocked");
        cache.set(key, value);
      },
      removeItem: (key) => cache.delete(key),
    },
  };
  const cacheUtils = load("lib/utils/auth-user-cache.ts", {}, { window });
  const Component = load(
    "components/forms/SigninForm.tsx",
    {
      react,
      "react/jsx-runtime": jsx,
      "@/lib/validations/signin.validation": schemas,
      "@/actions/auth.action": {
        signinAction: async (data) => {
          calls.push(data);
          return reply(data);
        },
      },
      "@/context/AuthProvider": {
        useUserContext: () => ({ setUser: (value) => users.push(value) }),
      },
      "@/lib/utils/auth-user-cache": cacheUtils,
      "react-hook-form": {
        useForm: () => ({
          formState: { isSubmitting: false },
          handleSubmit: (fn) => {
            submit = fn;
            return fn;
          },
        }),
      },
      "@hookform/resolvers/zod": { zodResolver() {} },
      "@/components/ui/button": { Button: "button" },
      "@/components/ui/form": { Form: "form-provider" },
      "../inputs": { FormInput: "input" },
      sonner: {
        toast: {
          success: (message) => notices.push(["success", message]),
          error: (message) => notices.push(["error", message]),
        },
      },
    },
    { window },
  ).default;
  const render = () => {
    cursor = refCursor = effectCursor = 0;
    const tree = Component();
    while (effects.length) effects.shift()();
    return tree;
  };
  render();
  return {
    calls,
    notices,
    navigation,
    users,
    cache,
    render,
    submit: () => submit(credentials),
    unmount: () => cleanups.forEach((fn) => fn?.()),
  };
}
test("blocked browser cache no longer stops successful login or produces contradictory notices", async () => {
  const h = form({ blocked: true });
  await h.submit();
  assert.deepEqual(h.navigation, ["/home"]);
  assert.deepEqual(
    h.notices.map((n) => n[0]),
    ["success"],
  );
  assert.equal(h.users[0].currentUserId, id);
  assert.equal(h.cache.size, 0);
});
test("login caches only display data and sends incomplete profiles to setup", async () => {
  const h = form({
    reply: async () => ({
      status: "7400",
      response: {
        ...account,
        personalInfo: { firstName: "", lastName: "", profileImage: null },
      },
    }),
  });
  await h.submit();
  assert.deepEqual(h.navigation, ["/complete-profile"]);
  const stored = JSON.parse([...h.cache.values()][0]);
  assert.equal(stored.currentUserId, id);
  assert.equal(stored.password, undefined);
  assert.equal(stored.accessToken, undefined);
});
test("duplicate submission is blocked during the request and while document navigation is pending", async () => {
  let finish;
  const h = form({
    reply: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const pending = h.submit();
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(
    find(h.render(), (n) => n.type === "button").props.disabled,
    true,
  );
  finish(success());
  await pending;
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(
    find(h.render(), (n) => n.type === "button").props.disabled,
    true,
  );
});
test("failed requests keep the form retryable and display service messages without false success", async () => {
  let reject = true;
  const h = form({
    reply: async () => {
      if (reject) throw Error("private body");
      return { status: "400", message: "Sign in timed out. Please try again." };
    },
  });
  await h.submit();
  assert.equal(
    find(h.render(), (n) => n.type === "button").props.disabled,
    false,
  );
  reject = false;
  await h.submit();
  assert.equal(h.calls.length, 2);
  assert.deepEqual(
    h.notices.map((n) => n[0]),
    ["error", "error"],
  );
  assert.match(h.notices[1][1], /timed out/);
  assert.equal(h.users.length, 0);
  assert.equal(h.navigation.length, 0);
});
test("responses and rejections after leaving the sign-in screen cannot update cache, user, notices or navigation", async () => {
  for (const fails of [false, true]) {
    let finish, fail;
    const h = form({
      reply: () =>
        new Promise((resolve, reject) => {
          finish = resolve;
          fail = reject;
        }),
    });
    const pending = h.submit();
    h.unmount();
    if (fails) fail(Error("late transport failure"));
    else finish(success());
    await pending;
    assert.equal(h.users.length, 0);
    assert.equal(h.cache.size, 0);
    assert.equal(h.notices.length, 0);
    assert.equal(h.navigation.length, 0);
  }
});
