const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const id = "111111111111111111111111",
  other = "222222222222222222222222",
  email = "qa@example.test";
const account = { _id: id, email, userName: "qa-user" };
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
      AbortSignal,
      Error,
      require: (name) =>
        name in mocks ? mocks[name] : name === "zod" ? require("zod") : {},
      process: {
        env: {
          NEXT_PUBLIC_BACKEND_URL: "https://backend.test/api",
          NODE_ENV: "production",
        },
      },
      ...globals,
    },
  );
  return module.exports;
}
const ok = (response) => ({
  ok: true,
  status: 200,
  json: async () => ({ status: "7400", response }),
});
function server(responses = [], options = {}) {
  const calls = [],
    writes = [],
    values = new Map(
      options.token ? [["te_account_delete", options.token]] : [],
    );
  let clears = 0,
    auth = 0;
  const actions = load(
    "actions/account-deletion.action.ts",
    {
      "node:crypto": { randomUUID: () => "qa-random-device" },
      "next/headers": {
        cookies: () => ({
          get: (name) =>
            values.has(name) ? { value: values.get(name) } : undefined,
          set(name, value, config) {
            writes.push({ name, value, config });
            if (config.maxAge === 0) values.delete(name);
            else values.set(name, value);
          },
        }),
      },
      "@/lib/session": {
        getAuthHeaders: async () => {
          auth++;
          if (options.authError) throw options.authError;
          return { Authorization: "Bearer current-account" };
        },
        clearSession: async () => {
          clears++;
          if (options.clearError) throw options.clearError;
          return { success: true };
        },
      },
      "next/dist/client/components/redirect": {
        isRedirectError: (e) => e?.digest === "NEXT_REDIRECT",
      },
    },
    {
      fetch: async (url, config) => {
        calls.push({ url, config });
        const response = responses.shift();
        if (response instanceof Error) throw response;
        if (!response) throw Error("Unexpected request");
        return response;
      },
    },
  );
  return {
    ...actions,
    calls,
    writes,
    values,
    clears: () => clears,
    auth: () => auth,
  };
}
test("public verification authenticates the selected account, stores a short-lived HttpOnly proof, and never returns tokens", async () => {
  const h = server([
    ok({ accessToken: "private-token", refreshToken: "private-refresh" }),
    ok(account),
  ]);
  const result = await h.verifyDeletionAccountAction({
    email: "  qa@example.test  ",
    password: "old-password",
  });
  assert.equal(result.status, "7400");
  assert.equal(result.account.id, id);
  assert.equal(h.calls[0].url, "https://backend.test/api/auth/login");
  assert.equal(h.calls[0].config.method, "POST");
  assert.equal(JSON.parse(h.calls[0].config.body).email, email);
  assert.equal(h.calls[1].config.headers.Authorization, "Bearer private-token");
  const proof = h.writes.find((w) => w.value === "private-token");
  assert.ok(proof.config.httpOnly && proof.config.secure);
  assert.equal(proof.config.sameSite, "strict");
  assert.equal(proof.config.maxAge, 600);
  assert.equal(proof.config.path, "/");
  assert.equal(JSON.stringify(result).includes("private-token"), false);
  assert.equal(JSON.stringify(result).includes("private-refresh"), false);
  assert.equal(h.clears(), 0);
  assert.equal(h.auth(), 0);
  assert.ok(
    h.calls.every((c) => c.config.cache === "no-store" && c.config.signal),
  );
});
test("failed or malformed verification cannot leave an earlier account's deletion proof active", async () => {
  for (const responses of [
    [],
    [
      {
        ok: false,
        status: 401,
        json: async () => ({
          status: "7400",
          response: { accessToken: "bad" },
        }),
      },
    ],
    [ok({})],
    [
      ok({ accessToken: "token" }),
      ok({ ...account, email: "other@example.test" }),
    ],
    [ok({ accessToken: "token" }), ok({ email })],
    [Error("Offline")],
  ]) {
    const h = server(responses, { token: "earlier-account" });
    const input = responses.length
      ? { email, password: "test" }
      : { email: "invalid", password: "" };
    assert.notEqual(
      (await h.verifyDeletionAccountAction(input)).status,
      "7400",
    );
    assert.equal(h.values.has("te_account_delete"), false);
    assert.equal(h.clears(), 0);
  }
});
test("deletion requires explicit confirmation and a valid expected account before any requests", async () => {
  for (const [expected, confirmed] of [
    [id, false],
    [id, "true"],
    [id, undefined],
    ["bad", true],
    [null, true],
  ]) {
    const h = server([], { token: "verified" });
    assert.equal(
      (await h.deleteVerifiedAccountAction(expected, confirmed)).status,
      "7401",
    );
    assert.equal(
      (await h.deleteCurrentAccountAction(expected, confirmed)).status,
      "7401",
    );
    assert.equal(h.calls.length, 0);
    assert.equal(h.auth(), 0);
  }
});
test("missing verification, changed accounts and expired identities cannot issue DELETE", async () => {
  const missing = server();
  assert.equal(
    (await missing.deleteVerifiedAccountAction(id, true)).reauthenticate,
    true,
  );
  assert.equal(missing.calls.length, 0);
  for (const response of [
    ok({ ...account, _id: other }),
    { ok: false, status: 401, json: async () => ({ status: "7403" }) },
  ]) {
    const h = server([response], { token: "changed-token" });
    assert.equal(
      (await h.deleteVerifiedAccountAction(id, true)).reauthenticate,
      true,
    );
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].config.method, undefined);
    assert.equal(h.clears(), 0);
  }
});
test("acknowledged public deletion calls the mobile endpoint and clears verification and the main session", async () => {
  const h = server([ok(account), ok({})], { token: "verified-token" });
  const result = await h.deleteVerifiedAccountAction(id, true);
  assert.equal(result.status, "7400");
  assert.equal(h.calls[1].url, "https://backend.test/api/user/deleteAccount");
  assert.equal(h.calls[1].config.method, "DELETE");
  assert.equal(
    h.calls[1].config.headers.Authorization,
    "Bearer verified-token",
  );
  assert.equal(h.values.has("te_account_delete"), false);
  assert.equal(h.clears(), 1);
});
test("DELETE failures preserve sessions and distinguish expired verification from retryable outages", async () => {
  for (const response of [
    { ok: false, status: 500, json: async () => ({ status: "7400" }) },
    { ok: true, status: 200, json: async () => ({ status: "7401" }) },
    {
      ok: true,
      status: 200,
      json: async () => {
        throw Error("Bad JSON");
      },
    },
    Error("Offline"),
    { ok: false, status: 401, json: async () => ({ status: "7403" }) },
  ]) {
    const h = server([ok(account), response], { token: "verified-token" });
    const result = await h.deleteVerifiedAccountAction(id, true);
    assert.notEqual(result.status, "7400");
    assert.equal(h.clears(), 0);
    assert.equal(h.values.get("te_account_delete"), "verified-token");
    if (response.status === 401) assert.equal(result.reauthenticate, true);
  }
});
test("cancel only clears the deletion proof and acknowledged deletion survives cleanup failures", async () => {
  const cancel = server([], { token: "verified" });
  assert.equal((await cancel.cancelAccountDeletionAction()).success, true);
  assert.equal(cancel.calls.length, 0);
  assert.equal(cancel.clears(), 0);
  assert.equal(cancel.values.size, 0);
  const success = server([ok(account), ok({})], {
    token: "verified",
    clearError: Error("Cookie cleanup"),
  });
  assert.equal(
    (await success.deleteVerifiedAccountAction(id, true)).status,
    "7400",
  );
});
test("settings uses the freshly authenticated identity and preserves refresh redirects", async () => {
  const h = server([ok(account), ok({})]);
  assert.equal((await h.deleteCurrentAccountAction(id, true)).status, "7400");
  assert.equal(h.auth(), 1);
  assert.equal(
    h.calls[1].config.headers.Authorization,
    "Bearer current-account",
  );
  const mismatch = server([ok({ ...account, _id: other })]);
  assert.notEqual(
    (await mismatch.deleteCurrentAccountAction(id, true)).status,
    "7400",
  );
  assert.equal(mismatch.calls.length, 1);
  const redirect = Object.assign(Error("Refresh"), { digest: "NEXT_REDIRECT" });
  await assert.rejects(
    server([], { authError: redirect }).deleteCurrentAccountAction(id, true),
    (e) => e === redirect,
  );
});

function hooks() {
  const cells = [];
  let cursor = 0;
  return {
    react: {
      useState(value) {
        const i = cursor++;
        if (!(i in cells)) cells[i] = value;
        return [
          cells[i],
          (next) =>
            (cells[i] = typeof next === "function" ? next(cells[i]) : next),
        ];
      },
      useRef(value) {
        return (cells[cursor++] ||= { current: value });
      },
    },
    render(fn) {
      cursor = 0;
      return fn();
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
    for (const child of tree) {
      const result = find(child, predicate);
      if (result) return result;
    }
    return;
  }
  return predicate(tree) ? tree : find(tree.props?.children, predicate);
}
function client() {
  const host = hooks(),
    calls = [],
    users = [];
  let reply = { status: "7400", account: { id, email, username: "qa-user" } },
    deletion = { status: "7500", message: "Offline" },
    cancelResult = { success: true },
    resolver,
    delayed = false;
  const component = load("components/legal/DeleteAccountFlow.tsx", {
    react: host.react,
    "react/jsx-runtime": jsx,
    "next/link": "link",
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/input": { Input: "input" },
    "@/components/ui/password-input": { PasswordInput: "input" },
    "@/components/ui/alert-dialog": Object.fromEntries(
      [
        "AlertDialog",
        "AlertDialogContent",
        "AlertDialogDescription",
        "AlertDialogFooter",
        "AlertDialogHeader",
        "AlertDialogTitle",
      ].map((n) => [n, n]),
    ),
    "@/actions/account-deletion.action": {
      verifyDeletionAccountAction: async (input) => {
        calls.push(["verify", input]);
        return reply;
      },
      deleteVerifiedAccountAction: async (...args) => {
        calls.push(["delete", ...args]);
        return delayed ? new Promise((r) => (resolver = r)) : deletion;
      },
      cancelAccountDeletionAction: async () => {
        calls.push(["cancel"]);
        return cancelResult;
      },
    },
    "@/context/AuthProvider": {
      INITIAL_USER: { currentUserId: "" },
      useUserContext: () => ({ setUser: (value) => users.push(value) }),
    },
    "@/lib/functions/auth.functions": {
      handleClearStorage: async () => {
        calls.push(["cleanup"]);
        throw Error("Storage denied");
      },
    },
  }).default;
  const render = () => host.render(component);
  const verify = async () => {
    find(
      render(),
      (n) => n.type === "input" && n.props.name === "email",
    ).props.onChange({ target: { value: email } });
    find(
      render(),
      (n) => n.type === "input" && n.props.name === "password",
    ).props.onChange({ target: { value: "test-password" } });
    return find(render(), (n) => n.type === "form").props.onSubmit({
      preventDefault() {},
    });
  };
  const button = (text) =>
    find(render(), (n) => n.type === "button" && n.props.children === text);
  return {
    render,
    verify,
    button,
    calls,
    users,
    reply: (value) => (reply = value),
    deletion: (value) => (deletion = value),
    delay() {
      delayed = true;
    },
    finish(value) {
      resolver(value);
    },
  };
}
test("public UI verifies first, shows the verified account, and cancellation never calls DELETE", async () => {
  const h = client();
  assert.equal(
    find(h.render(), (n) => n.type === "AlertDialog").props.open,
    false,
  );
  await h.verify();
  assert.equal(
    find(h.render(), (n) => n.type === "AlertDialog").props.open,
    true,
  );
  assert.equal(
    find(h.render(), (n) => n.type === "input" && n.props.name === "password")
      .props.value,
    "",
  );
  await h.button("Cancel").props.onClick({ preventDefault() {} });
  assert.equal(
    find(h.render(), (n) => n.type === "AlertDialog").props.open,
    false,
  );
  assert.equal(h.calls.filter((c) => c[0] === "delete").length, 0);
  assert.equal(h.users.length, 0);
});
test("public UI keeps failures retryable, blocks repeated deletion and signs out only after success", async () => {
  const h = client();
  await h.verify();
  await h.button("Yes, delete my account").props.onClick();
  assert.equal(
    find(h.render(), (n) => n.type === "AlertDialog").props.open,
    true,
  );
  assert.ok(find(h.render(), (n) => n.props?.role === "alert"));
  assert.equal(h.users.length, 0);
  h.delay();
  const click = h.button("Yes, delete my account").props.onClick;
  const pending = click();
  await click();
  assert.equal(h.calls.filter((c) => c[0] === "delete").length, 2);
  assert.equal(h.button("Cancel").props.disabled, true);
  h.finish({ status: "7400", message: "Deleted" });
  await pending;
  assert.equal(h.users.length, 1);
  assert.equal(h.render().props.role, "status");
  assert.ok(h.calls.some((c) => c[0] === "cleanup"));
});
test("expired public verification returns to sign-in without claiming deletion", async () => {
  const h = client();
  await h.verify();
  h.deletion({ status: "7403", message: "Expired", reauthenticate: true });
  await h.button("Yes, delete my account").props.onClick();
  assert.equal(
    find(h.render(), (n) => n.type === "AlertDialog").props.open,
    false,
  );
  assert.equal(h.users.length, 0);
  assert.ok(find(h.render(), (n) => n.props?.role === "alert"));
});

test("failed verification never opens confirmation and repeated verification clicks issue one request", async () => {
  const failure = client();
  failure.reply({ status: "7403", message: "Wrong credentials" });
  await failure.verify();
  assert.equal(
    find(failure.render(), (n) => n.type === "AlertDialog").props.open,
    false,
  );
  assert.equal(failure.calls.filter((c) => c[0] === "delete").length, 0);
  const h = client();
  await Promise.all([h.verify(), h.verify()]);
  assert.equal(h.calls.filter((c) => c[0] === "verify").length, 1);
});

test("settings confirmation stays open on failure, blocks duplicates, and clears storage only after success", async () => {
  const host = hooks(),
    calls = [],
    navigation = [];
  let finish,
    delay = false;
  const Component = load(
    "components/widgets/settings/SettingsScreen.tsx",
    {
      react: {
        ...host.react,
        useEffect() {},
        useMemo: (fn) => fn(),
        useTransition: () => [false, (fn) => fn()],
      },
      "react/jsx-runtime": jsx,
      "next/link": "link",
      "@/components/ui/button": { Button: "button" },
      "@/components/ui/alert-dialog": Object.fromEntries(
        [
          "AlertDialog",
          "AlertDialogContent",
          "AlertDialogDescription",
          "AlertDialogFooter",
          "AlertDialogHeader",
          "AlertDialogTitle",
          "AlertDialogCancel",
          "AlertDialogAction",
        ].map((n) => [n, n]),
      ),
      "@/actions/settings.action": {
        deleteAccountSettingsAction: async (...args) => {
          calls.push(["delete", ...args]);
          return delay
            ? new Promise((r) => (finish = r))
            : { status: "7500", message: "Retry deletion" };
        },
      },
      "@/context/AuthProvider": {
        INITIAL_USER: {},
        useUserContext: () => ({ setUser: () => calls.push(["signed-out"]) }),
      },
      "@/actions/session.action": {
        clearSession: async () => calls.push(["clear-session"]),
      },
      "@/lib/functions/auth.functions": {
        handleClearStorage: async () => {
          calls.push(["clear-storage"]);
          throw Error("Storage blocked");
        },
      },
      sonner: { toast: { success() {}, error() {} } },
    },
    { window: { location: { assign: (value) => navigation.push(value) } } },
  ).default;
  const render = () =>
    host.render(() =>
      Component({
        slugPath: "account-centre",
        currentUser: account,
        initialPrivacy: {},
        initialNotification: {},
      }),
    );
  const button = (text) =>
    find(render(), (n) => n.type === "button" && n.props.children === text);
  button("Delete Account").props.onClick();
  await button("Yes, delete my account").props.onClick();
  assert.equal(
    find(render(), (n) => n.type === "AlertDialog").props.open,
    true,
  );
  assert.ok(find(render(), (n) => n.props?.role === "alert"));
  assert.equal(navigation.length, 0);
  delay = true;
  const click = button("Yes, delete my account").props.onClick;
  const pending = click();
  await click();
  assert.equal(calls.filter((c) => c[0] === "delete").length, 2);
  assert.equal(
    find(render(), (n) => n.type === "AlertDialogCancel").props.disabled,
    true,
  );
  find(render(), (n) => n.type === "AlertDialog").props.onOpenChange(false);
  assert.equal(
    find(render(), (n) => n.type === "AlertDialog").props.open,
    true,
  );
  finish({ status: "7400" });
  await pending;
  assert.deepEqual(calls[0], ["delete", id, true]);
  assert.deepEqual(navigation, ["/sign-in"]);
  assert.ok(calls.some((c) => c[0] === "clear-session"));
  assert.ok(calls.some((c) => c[0] === "signed-out"));
});
