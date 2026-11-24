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
        (name === "zod" || name === "jwt-decode" ? require(name) : {}),
      ...globals,
    },
  );
  return module.exports;
}
const id = "111111111111111111111111";
function storage() {
  const values = new Map();
  return {
    values,
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  };
}
function sessions() {
  const window = { sessionStorage: storage(), localStorage: storage() };
  return { window, ...load("lib/utils/otp-session.ts", {}, { window }) };
}
test("signup and password challenges survive reload independently without storing passwords, codes or tokens", () => {
  const h = sessions();
  h.startOtpSession("signup", id, 1000);
  h.startOtpSession("password", "qa@example.test", 2000);
  const reloaded = load("lib/utils/otp-session.ts", {}, { window: h.window });
  assert.equal(reloaded.readOtpSession("signup", 400000).identifier, id);
  assert.equal(reloaded.readOtpSession("signup").expiresAt, 181000);
  assert.deepEqual(Object.keys(reloaded.readOtpSession("password")).sort(), [
    "expiresAt",
    "identifier",
    "resendAt",
  ]);
  reloaded.clearOtpSession("signup");
  assert.equal(reloaded.readOtpSession("signup"), null);
  assert.equal(
    reloaded.readOtpSession("password").identifier,
    "qa@example.test",
  );
  assert.equal(h.window.localStorage.values.size, 0);
});
test("legacy verification recovers the target without restarting an unknown countdown", () => {
  const h = sessions();
  h.window.localStorage.setItem("isOTP", "true");
  h.window.localStorage.setItem("registerUserId", id);
  h.window.localStorage.setItem("countdown", "00:00");
  assert.equal(h.readOtpSession("password", 5000), null);
  assert.equal(h.readOtpSession("signup", 5000).resendAt, 5000);
  assert.equal(h.readOtpSession("signup", 6000).expiresAt, 5000);
  assert.equal(h.window.localStorage.values.size, 0);
});
test("ambiguous legacy flows, corrupt data and invalid identifiers cannot open the wrong challenge", () => {
  const h = sessions();
  for (const [k, v] of [
    ["isOTP", "true"],
    ["registerUserId", id],
    ["verifiedEmail", "qa@example.test"],
  ])
    h.window.localStorage.setItem(k, v);
  assert.equal(h.readOtpSession("signup"), null);
  assert.equal(h.readOtpSession("password"), null);
  h.window.sessionStorage.setItem("te-otp-signup", "{broken");
  assert.equal(h.readOtpSession("signup"), null);
  assert.equal(h.window.sessionStorage.getItem("te-otp-signup"), null);
  assert.throws(() => h.startOtpSession("signup", "../bad"));
});
test("blocked browser storage preserves the current in-memory challenge and stays recoverable", () => {
  const h = sessions();
  for (const store of [h.window.sessionStorage, h.window.localStorage]) {
    for (const key of ["getItem", "setItem", "removeItem"])
      store[key] = () => {
        throw Error("blocked");
      };
  }
  assert.equal(h.readOtpSession("signup"), null);
  assert.equal(h.startOtpSession("signup", id, 1000).resendAt, 31000);
  assert.doesNotThrow(() => h.clearOtpSession("password"));
});
function hooks() {
  const state = [],
    refs = [],
    effects = [],
    deps = [],
    cleanups = [];
  let cursor = 0,
    refCursor = 0,
    effectCursor = 0;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in state))
        state[i] = typeof initial === "function" ? initial() : initial;
      return [
        state[i],
        (value) =>
          (state[i] = typeof value === "function" ? value(state[i]) : value),
      ];
    },
    useRef(initial) {
      const i = refCursor++;
      return (refs[i] ||= { current: initial });
    },
    useEffect(fn, next) {
      const i = effectCursor++;
      if (!deps[i] || next.some((v, j) => v !== deps[i][j])) {
        deps[i] = next;
        effects.push(() => {
          cleanups[i]?.();
          cleanups[i] = fn();
        });
      }
    },
  };
  return {
    react,
    render(fn) {
      cursor = refCursor = effectCursor = 0;
      const result = fn();
      while (effects.length) effects.shift()();
      return result;
    },
    unmount() {
      cleanups.forEach((fn) => fn?.());
    },
  };
}
test("wall-clock timer catches up after backgrounding and refresh, and removes listeners on unmount", () => {
  let now = 1000;
  const h = hooks(),
    listeners = new Map(),
    intervals = new Map();
  const window = {
    setInterval: (fn) => {
      intervals.set(1, fn);
      return 1;
    },
    clearInterval: (n) => intervals.delete(n),
    addEventListener: (n, fn) => listeners.set(n, fn),
    removeEventListener: (n) => listeners.delete(n),
  };
  const document = {
    addEventListener: window.addEventListener,
    removeEventListener: window.removeEventListener,
  };
  const timer = load(
    "lib/hooks/useTimer.ts",
    { react: h.react },
    { Date: { now: () => now }, window, document },
  ).default;
  const pending = { expiresAt: 181000, resendAt: 31000 };
  let value = h.render(() => timer(pending));
  assert.equal(value.formatTime(value.countdown), "03:00");
  now = 81000;
  listeners.get("focus")();
  value = h.render(() => timer(pending));
  assert.equal(value.countdown, 100);
  assert.equal(value.resendCountdown, 0);
  now = 400000;
  listeners.get("visibilitychange")();
  assert.equal(h.render(() => timer(pending)).countdown, 0);
  h.unmount();
  assert.equal(intervals.size, 0);
  assert.equal(listeners.size, 0);
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
function otp({
  signup = true,
  verify = async () => id,
  resend = async () => true,
  cooldown = 0,
  missing = false,
} = {}) {
  const h = hooks(),
    calls = [],
    cleared = [],
    navigations = [],
    events = [];
  let session = missing
    ? null
    : {
        identifier: signup ? id : "qa@example.test",
        expiresAt: 181000,
        resendAt: 31000,
      };
  const services = {
    handleVerifyEmailOtp: async (data) => {
      calls.push(data);
      return verify(data);
    },
    handleVerifyForgotPasswordOtp: async (data) => {
      calls.push(data);
      return verify(data);
    },
    handleResendOtp: async (target) => {
      calls.push(target);
      return resend(target);
    },
    handleResendForgotpasswordOtp: async (target) => {
      calls.push(target);
      return resend(target);
    },
  };
  const Component = load(
    "components/modals/OTP.tsx",
    {
      react: h.react,
      "react/jsx-runtime": jsx,
      "@/components/ui/input-otp": {
        InputOTP: "otp",
        InputOTPGroup: "group",
        InputOTPSlot: "slot",
      },
      "@/components/ui/dialog": {
        DialogContent: "dialog",
        DialogTitle: "title",
        DialogDescription: "description",
      },
      "../ui/button": { Button: "submit" },
      "@/lib/hooks/useTimer": () => ({
        countdown: 100,
        resendCountdown: cooldown,
        formatTime: () => "01:40",
      }),
      "@/lib/functions/auth.functions": services,
      "@/lib/utils/otp-session": {
        readOtpSession: () => session,
        validOtpIdentifier: () => false,
        clearOtpSession: (kind) => cleared.push(kind),
        startOtpSession: (kind, target) => {
          session = { identifier: target, expiresAt: 361000, resendAt: 211000 };
          return session;
        },
      },
      "@/lib/utils/auth-user-cache": {
        clearCachedAuthUser: () => events.push("cache"),
      },
      sonner: { toast: { success: () => {} } },
    },
    { window: { location: { assign: (path) => navigations.push(path) } } },
  ).default;
  const props = {
    isSignup: signup,
    setVerifiedUserId: (value) => events.push(["user", value]),
    setVerifiedOtp: (value) => events.push(["proof", value]),
    setIsOpen: (value) => events.push(["step", value]),
  };
  const render = () => h.render(() => Component(props));
  const input = (value) => {
    find(render(), (n) => n.type === "otp").props.onChange(value);
  };
  const submit = () =>
    find(render(), (n) => n.type === "form").props.onSubmit({
      preventDefault() {},
    });
  const button = (label) =>
    find(render(), (n) => n.type === "button" && n.props.children === label);
  return {
    ...h,
    calls,
    cleared,
    navigations,
    events,
    render,
    input,
    submit,
    button,
  };
}
test("verification rejects incomplete codes and preserves zero-prefixed codes in the API formats", async () => {
  const h = otp();
  h.input("123");
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.ok(find(h.render(), (n) => n.props?.role === "alert"));
  h.input("000123");
  await h.submit();
  assert.equal(h.calls[0].emailVerificationCode, 123);
  assert.deepEqual(h.navigations, ["/complete-profile"]);
  assert.deepEqual(h.cleared, ["signup"]);
  await h.submit();
  assert.equal(h.calls.length, 1);
  const p = otp({ signup: false });
  p.input("000123");
  await p.submit();
  assert.equal(p.calls[0].otp, "000123");
  assert.deepEqual(
    p.events.map((e) => e[0]),
    ["user", "proof", "step"],
  );
  assert.deepEqual(p.cleared, ["password"]);
  assert.equal(p.navigations.length, 0);
});
test("failed codes stay editable, duplicate operations are ignored, and pending cancellation is blocked", async () => {
  let finish;
  const h = otp({
    verify: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  h.input("123456");
  const pending = h.submit();
  await h.submit();
  h.button("Cancel").props.onClick();
  assert.equal(h.navigations.length, 0);
  assert.equal(h.calls.length, 1);
  finish(false);
  await pending;
  assert.ok(find(h.render(), (n) => n.props?.role === "alert"));
  assert.equal(find(h.render(), (n) => n.type === "otp").props.value, "123456");
  assert.equal(find(h.render(), (n) => n.type === "otp").props.disabled, false);
});
test("resend respects cooldown, preserves a failed code and clears it only after acknowledgment", async () => {
  const blocked = otp({ cooldown: 15 });
  const button = find(
    blocked.render(),
    (n) => n.type === "button" && n.props.children === "Resend in 15s",
  );
  assert.equal(button.props.disabled, true);
  await button.props.onClick();
  assert.equal(blocked.calls.length, 0);
  let success = false;
  const h = otp({ resend: async () => success });
  h.input("123456");
  await h.button("Resend").props.onClick();
  assert.equal(find(h.render(), (n) => n.type === "otp").props.value, "123456");
  success = true;
  await h.button("Resend").props.onClick();
  assert.equal(find(h.render(), (n) => n.type === "otp").props.value, "");
});
test("late verification cannot clear a newer challenge or navigate after unmount", async () => {
  let finish;
  const h = otp({
    verify: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  h.input("123456");
  const pending = h.submit();
  h.unmount();
  finish(id);
  await pending;
  assert.equal(h.cleared.length, 0);
  assert.equal(h.navigations.length, 0);
});
test("missing context gives a recovery error, and cancellation clears only its own flow", async () => {
  const h = otp({ missing: true });
  h.input("123456");
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.ok(find(h.render(), (n) => n.props?.role === "alert"));
  const p = otp({ signup: false });
  p.button("Cancel").props.onClick();
  assert.deepEqual(p.cleared, ["password"]);
  assert.deepEqual(p.navigations, ["/sign-in"]);
});
const schemas = load("lib/validations/otp.validation.ts");
function forgot(pending = null, send = async () => "qa@example.test") {
  const h = hooks(),
    calls = [],
    started = [];
  const Component = load("components/modals/ForgotPassword.tsx", {
    react: h.react,
    "react/jsx-runtime": jsx,
    "react-hook-form": {
      useForm: () => ({ formState: {}, handleSubmit: (fn) => fn }),
    },
    "@hookform/resolvers/zod": { zodResolver: () => {} },
    "../ui/dialog": {
      Dialog: "dialog",
      DialogContent: "content",
      DialogTitle: "title",
      DialogDescription: "description",
    },
    "@/components/ui/form": { Form: "form-provider" },
    "@/components/ui/button": { Button: "submit" },
    "../inputs": { FormInput: "input" },
    ".": { OTPModal: "otp-modal", ResetPasswordModal: "reset-modal" },
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "@/lib/utils/otp-session": {
      readOtpSession: (kind) => {
        calls.push(kind);
        return pending;
      },
      startOtpSession: (...args) => started.push(args),
    },
    "@/lib/functions/auth.functions": { handleForgotPassword: send },
    sonner: { toast: { success() {} } },
  }).default;
  return { ...h, calls, started, render: () => h.render(Component) };
}
test("password recovery restores only its own challenge and keeps the reset step open with its proof", () => {
  const h = forgot({
    identifier: "qa@example.test",
    expiresAt: 0,
    resendAt: 0,
  });
  h.render();
  const otp = find(h.render(), (n) => n.type === "otp-modal");
  assert.equal(otp.props.email, "qa@example.test");
  otp.props.setVerifiedUserId(id);
  otp.props.setVerifiedOtp("000123");
  otp.props.setIsOpen({ isFP: false, isOTP: false, isReset: true });
  const reset = find(h.render(), (n) => n.type === "reset-modal");
  assert.equal(reset.props.verifiedUserId, id);
  assert.equal(reset.props.verifiedOtp, "000123");
  h.render();
  assert.deepEqual(h.calls, ["password"]);
  const refreshed = forgot();
  refreshed.render();
  assert.ok(find(refreshed.render(), (n) => n.type === "form"));
  assert.equal(
    find(refreshed.render(), (n) => n.type === "reset-modal"),
    undefined,
  );
});
test("forgot-password requests are deduplicated and late responses cannot create a challenge", async () => {
  let finish,
    count = 0;
  const h = forgot(null, () => {
    count++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  h.render();
  const submit = find(h.render(), (n) => n.type === "form").props.onSubmit;
  const pending = submit({ email: "qa@example.test" });
  await submit({ email: "qa@example.test" });
  assert.equal(count, 1);
  h.unmount();
  finish("qa@example.test");
  await pending;
  assert.equal(h.started.length, 0);
});
const jwt = (sub) =>
  "e30." +
  Buffer.from(JSON.stringify({ sub, exp: 9999999999 })).toString("base64url") +
  ".signature";
function server(reply, cookieSuccess = true) {
  const calls = [],
    cookies = [],
    logs = [];
  const actions = load(
    "actions/auth.action.ts",
    {
      "@/lib/validations/otp.validation": schemas,
      "@/lib/config/axiosInstance": {
        post: async (...args) => {
          calls.push(args);
          if (reply instanceof Error) throw reply;
          return { data: reply };
        },
      },
      "@/lib/session": {
        createSession: async (...args) => {
          cookies.push(args);
          return { success: cookieSuccess };
        },
      },
      "./session.action": { storeIsAbout: async () => {} },
    },
    {
      console: {
        log: (...args) => logs.push(args),
        error: (...args) => logs.push(args),
      },
    },
  );
  return { ...actions, calls, cookies, logs };
}
const request = { userId: id, emailVerificationCode: 123 };
test("signup verification saves cookies but returns only the verified user ID", async () => {
  const tokens = { accessToken: jwt(id), refreshToken: "synthetic-refresh" };
  const h = server({ status: "7400", response: tokens });
  const result = await h.otpVerificationAction(request);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    status: "7400",
    response: { userId: id },
  });
  assert.equal(h.cookies[0][0], tokens.accessToken);
  assert.equal(h.calls[0][2].timeout, 15000);
  assert.equal(h.logs.length, 0);
});
test("invalid signup codes and resend targets never contact the API", async () => {
  for (const value of [
    null,
    { ...request, userId: "../bad" },
    { ...request, emailVerificationCode: "123456" },
    { ...request, emailVerificationCode: -1 },
    { ...request, emailVerificationCode: 1000000 },
  ]) {
    const h = server({ status: "7400" });
    assert.equal((await h.otpVerificationAction(value)).status, "400");
    assert.equal(h.calls.length, 0);
  }
  const h = server({ status: "7400" });
  await h.resendOtpAction("../bad");
  assert.equal(h.calls.length, 0);
});
test("malformed tokens, mismatched subjects, failed cookies and transport errors cannot report verified", async () => {
  for (const [reply, cookieSuccess] of [
    [
      { status: "7400", response: { accessToken: "bad", refreshToken: "x" } },
      true,
    ],
    [
      {
        status: "7400",
        response: { accessToken: jwt("different"), refreshToken: "x" },
      },
      true,
    ],
    [
      { status: "7400", response: { accessToken: jwt(id), refreshToken: "" } },
      true,
    ],
    [
      { status: "7400", response: { accessToken: jwt(id), refreshToken: "x" } },
      false,
    ],
    [Error("private request body"), true],
    [{ status: "7401" }, true],
  ]) {
    const h = server(reply, cookieSuccess);
    const result = await h.otpVerificationAction(request);
    assert.equal(result.status, "400");
    assert.equal(JSON.stringify(result).includes("private"), false);
    assert.equal(h.logs.length, 0);
  }
});
test("password recovery validates before transport and preserves the six-digit string", async () => {
  const h = server({ status: "7400", response: id });
  await h.forgotPasswordAction("bad");
  await h.verifyForgotPasswordAction({ email: "qa@example.test", otp: 123456 });
  assert.equal(h.calls.length, 0);
  await h.forgotPasswordAction("qa+otp@example.test");
  assert.equal(h.calls[0][0], "/auth/forgotPassword/qa%2Botp%40example.test");
  await h.verifyForgotPasswordAction({
    email: "qa@example.test",
    otp: "000123",
    unexpected: true,
  });
  assert.equal(h.calls[1][1].otp, "000123");
  assert.equal(h.calls[1][1].unexpected, undefined);
  assert.equal(h.calls[1][2].timeout, 15000);
});
