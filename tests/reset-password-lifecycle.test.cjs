const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
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
function harness(service) {
  const state = [],
    refs = [],
    effects = [],
    cleanups = [],
    requests = [],
    navigation = [],
    notices = [],
    cleared = [];
  const values = {
    password: "Synthetic@12345",
    confirmPassword: "Synthetic@12345",
  };
  let cursor = 0,
    refCursor = 0,
    effectCursor = 0,
    resets = 0;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in state)) state[i] = initial;
      return [state[i], (next) => (state[i] = next)];
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
  const mocks = {
    react,
    "react/jsx-runtime": jsx,
    "next/navigation": {
      useRouter: () => ({ push: (path) => navigation.push(path) }),
    },
    "../ui/button": { Button: "submit" },
    "../ui/dialog": {
      DialogContent: "dialog",
      DialogTitle: "title",
      DialogDescription: "description",
      DialogOverlay: "overlay",
    },
    "@/lib/utils": { cn: (value) => value },
    "react-hook-form": {
      useForm: () => ({
        formState: { isSubmitting: false },
        handleSubmit: (fn) => () => fn(values),
        reset: () => resets++,
      }),
    },
    "@hookform/resolvers/zod": { zodResolver() {} },
    "../ui/form": { Form: "form-provider" },
    "../inputs": { FormInput: "input" },
    "@/actions/auth.action": {
      resetPasswordAction: async (payload) => {
        requests.push(payload);
        return service(payload);
      },
    },
    "@/lib/utils/otp-session": {
      clearOtpSession: (kind) => cleared.push(kind),
    },
    sonner: {
      toast: {
        success: (message) => notices.push(["success", message]),
        error: (message) => notices.push(["error", message]),
      },
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync("components/modals/ResetPassword.tsx", "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      },
    ).outputText,
    { module, exports: module.exports, require: (name) => mocks[name] || {} },
  );
  const Component = module.exports.default;
  const render = () => {
    cursor = refCursor = effectCursor = 0;
    const tree = Component({
      verifiedUserId: "111111111111111111111111",
      verifiedOtp: "000123",
    });
    while (effects.length) effects.shift()();
    return tree;
  };
  render();
  return {
    requests,
    navigation,
    notices,
    cleared,
    values,
    render,
    resets: () => resets,
    submit: () => find(render(), (n) => n.type === "form").props.onSubmit(),
    cancel: () => find(render(), (n) => n.type === "button").props.onClick(),
    escape() {
      let prevented = false;
      find(render(), (n) => n.type === "dialog").props.onEscapeKeyDown({
        preventDefault: () => {
          prevented = true;
        },
      });
      return prevented;
    },
    unmount: () => cleanups.forEach((fn) => fn?.()),
  };
}
test("pending password reset disables cancel and inputs, blocks Escape/outside dismissal and deduplicates writes", async () => {
  let finish;
  const h = harness(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = h.submit();
  await h.submit();
  h.cancel();
  assert.equal(h.escape(), true);
  let prevented = false;
  find(h.render(), (n) => n.type === "dialog").props.onInteractOutside({
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  assert.equal(h.requests.length, 1);
  assert.equal(h.navigation.length, 0);
  assert.equal(h.cleared.length, 0);
  const tree = h.render();
  assert.equal(find(tree, (n) => n.type === "fieldset").props.disabled, true);
  assert.equal(find(tree, (n) => n.type === "button").props.disabled, true);
  assert.equal(
    find(tree, (n) => n.type === "submit").props.children,
    "Submitting...",
  );
  assert.equal(find(tree, (n) => n.type === "form").props["aria-busy"], true);
  finish({ status: true });
  await pending;
});
test("successful reset keeps the mobile payload and remains locked while navigating", async () => {
  const h = harness(async () => ({ status: true }));
  await h.submit();
  assert.deepEqual(JSON.parse(JSON.stringify(h.requests[0])), {
    userId: "111111111111111111111111",
    otp: "000123",
    newPassword: h.values.password,
  });
  assert.deepEqual(h.cleared, ["password"]);
  assert.deepEqual(h.navigation, ["/sign-in"]);
  assert.deepEqual(
    h.notices.map((n) => n[0]),
    ["success"],
  );
  await h.submit();
  h.cancel();
  h.escape();
  assert.equal(h.requests.length, 1);
  assert.equal(h.navigation.length, 1);
});
test("backend rejection retains entered passwords and verification proof for a successful retry", async () => {
  let accepted = false;
  const h = harness(async () =>
    accepted
      ? { status: true }
      : { status: false, message: "Unable to reset. Please try again." },
  );
  await h.submit();
  assert.equal(h.resets(), 0);
  assert.equal(h.cleared.length, 0);
  assert.equal(h.navigation.length, 0);
  assert.equal(
    find(h.render(), (n) => n.type === "fieldset").props.disabled,
    false,
  );
  assert.equal(
    find(h.render(), (n) => n.type === "button").props.disabled,
    false,
  );
  assert.deepEqual(
    h.notices.map((n) => n[0]),
    ["error"],
  );
  accepted = true;
  await h.submit();
  assert.equal(h.requests.length, 2);
  assert.equal(h.requests[0].otp, h.requests[1].otp);
  assert.equal(h.requests[0].newPassword, h.requests[1].newPassword);
  assert.equal(h.navigation.length, 1);
});
test("transport failures are caught and release submission so users can retry or cancel", async () => {
  const h = harness(async () => {
    throw Error("private request contents");
  });
  await h.submit();
  assert.equal(
    find(h.render(), (n) => n.type === "submit").props.disabled,
    false,
  );
  assert.equal(h.notices[0][0], "error");
  assert.equal(h.notices[0][1].includes("private"), false);
  assert.equal(h.resets(), 0);
  h.cancel();
  assert.deepEqual(h.navigation, ["/sign-in"]);
});
test("success, rejection and transport errors arriving after unmount cannot navigate, notify or clear newer OTP state", async () => {
  for (const outcome of ["success", "failure", "throw"]) {
    let finish, fail;
    const h = harness(
      () =>
        new Promise((resolve, reject) => {
          finish = resolve;
          fail = reject;
        }),
    );
    const pending = h.submit();
    h.unmount();
    if (outcome === "throw") fail(Error("late failure"));
    else finish({ status: outcome === "success", message: "Try again" });
    await pending;
    assert.equal(h.navigation.length, 0);
    assert.equal(h.notices.length, 0);
    assert.equal(h.cleared.length, 0);
  }
});
test("idle cancellation works with keyboard or button and blocks a subsequent reset before unmount", async () => {
  for (const method of ["cancel", "escape"]) {
    const h = harness(async () => ({ status: true }));
    h[method]();
    await h.submit();
    h.cancel();
    assert.equal(h.requests.length, 0);
    assert.deepEqual(h.cleared, ["password"]);
    assert.deepEqual(h.navigation, ["/sign-in"]);
  }
});
