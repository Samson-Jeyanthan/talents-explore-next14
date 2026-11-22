const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
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
      require: (name) => mocks[name] || (name === "zod" ? require("zod") : {}),
      ...globals,
    },
  );
  return module.exports;
}
const password = load("lib/validations/password.validation.ts");
const schemas = load("lib/validations/signup.validation.ts", {
  "./password.validation": password,
});
const valid = {
  userName: "qa_user",
  email: "qa@example.test",
  password: "QaTest@123",
  acceptedPolicies: true,
};
function server(reply = { status: "7400", response: "test-user" }) {
  const calls = [],
    logs = [];
  const action = load(
    "actions/auth.action.ts",
    {
      "@/lib/validations/signup.validation": schemas,
      "@/lib/config/axiosInstance": {
        post: async (...args) => {
          calls.push(args);
          if (reply instanceof Error) throw reply;
          return { data: reply };
        },
      },
    },
    { console: { error: (...args) => logs.push(args) } },
  ).registerAction;
  return { action, calls, logs };
}
test("account registration rejects missing, unchecked and coerced consent before contacting the backend", async () => {
  for (const value of [undefined, false, "true", "false", 1, null]) {
    const h = server();
    const result = await h.action({ ...valid, acceptedPolicies: value });
    assert.equal(result.status, "7401");
    assert.equal(h.calls.length, 0);
  }
});
test("accepted registration validates credentials and sends the existing backend payload without extra fields", async () => {
  const h = server();
  assert.equal((await h.action({ ...valid, admin: true })).status, "7400");
  assert.equal(h.calls[0][0], "/auth/register");
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls[0][1])), {
    userName: valid.userName,
    email: valid.email,
    password: valid.password,
  });
  for (const input of [
    { ...valid, userName: "bad user" },
    { ...valid, email: "bad" },
    { ...valid, password: "weak" },
    null,
  ]) {
    const invalid = server();
    assert.equal((await invalid.action(input)).status, "7401");
    assert.equal(invalid.calls.length, 0);
  }
});
test("failed registration returns serializable errors without logging credentials and preserves duplicate-account status", async () => {
  for (const duplicate of [false, true]) {
    const error = Object.assign(Error("request contains private credentials"), {
      response: { data: { status: duplicate ? "7405" : "7500" } },
    });
    const h = server(error),
      result = await h.action(valid);
    assert.equal(result.status, duplicate ? "7405" : "7500");
    assert.equal(h.logs.length, 0);
    assert.equal(JSON.stringify(result).includes("private credentials"), false);
  }
});
test("the signup schema requires an explicit checkbox value and keeps credential validation", () => {
  const input = {
    username: valid.userName,
    email: valid.email,
    password: valid.password,
    acceptedPolicies: false,
  };
  const result = schemas.SignupValidation.safeParse(input);
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "acceptedPolicies");
  assert.equal(
    schemas.SignupValidation.safeParse({ ...input, acceptedPolicies: true })
      .success,
    true,
  );
});

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
test("signup starts unchecked, gates submission, passes consent, and retains the OTP success flow", async () => {
  let accepted = false,
    config,
    submit,
    error;
  const calls = [],
    states = [],
    storage = [];
  const form = {
    control: {},
    formState: { isSubmitting: false, errors: {} },
    register: (name) => ({
      name,
      onChange: (event) => (accepted = event.target.checked),
    }),
    watch: () => accepted,
    setError: (...args) => (error = args),
    handleSubmit: (fn) => {
      submit = fn;
      return fn;
    },
  };
  const Component = load(
    "components/forms/JoinusForm.tsx",
    {
      "react/jsx-runtime": jsx,
      react: {
        useEffect() {},
        useState: (initial) => [initial, (next) => states.push(next)],
      },
      "react-hook-form": {
        useForm: (options) => {
          config = options;
          return form;
        },
      },
      "@hookform/resolvers/zod": { zodResolver: () => {} },
      "@/lib/validations/signup.validation": schemas,
      "@/components/ui/button": { Button: "button" },
      "@/components/ui/form": { Form: "provider" },
      "../inputs": { FormInput: "field" },
      "../ui/dialog": { Dialog: "dialog" },
      "next/link": "link",
      "@/components/legal/PolicyLinks": "policy-links",
      "@/actions/auth.action": {
        registerAction: async (input) => {
          calls.push(input);
          return { status: "7400", response: "qa-test-user" };
        },
      },
      "@/context/AuthProvider": {
        useUserContext: () => ({ setUser: (value) => states.push(value) }),
      },
      sonner: { toast: { success() {}, error() {} } },
    },
    { localStorage: { setItem: (...args) => storage.push(args) } },
  ).default;
  let tree = Component();
  assert.equal(config.defaultValues.acceptedPolicies, false);
  assert.equal(find(tree, (n) => n.type === "button").props.disabled, true);
  await submit({ ...valid, username: valid.userName, acceptedPolicies: false });
  assert.equal(calls.length, 0);
  assert.equal(error[0], "acceptedPolicies");
  const checkbox = find(
    tree,
    (n) => n.type === "input" && n.props.type === "checkbox",
  );
  assert.equal(checkbox.props["aria-required"], "true");
  checkbox.props.onChange({ target: { checked: true } });
  tree = Component();
  assert.equal(find(tree, (n) => n.type === "button").props.disabled, false);
  for (const href of ["/terms-and-conditions", "/privacy-policy"]) {
    const link = find(tree, (n) => n.type === "link" && n.props.href === href);
    assert.equal(link.props.target, "_blank");
    assert.equal(link.props.rel, "noopener noreferrer");
  }
  await submit({ ...valid, username: valid.userName });
  assert.equal(calls[0].acceptedPolicies, true);
  assert.ok(
    storage.some(([key, value]) => key === "isOTP" && value === "true"),
  );
  assert.ok(
    storage.some(
      ([key, value]) => key === "registerUserId" && value === "qa-test-user",
    ),
  );
  accepted = false;
  assert.equal(
    find(Component(), (n) => n.type === "button").props.disabled,
    true,
  );
});
test("login exposes all seven policy links without introducing a login consent gate", async () => {
  const policy = load("components/legal/PolicyLinks.tsx", {
    "react/jsx-runtime": jsx,
    "next/link": "link",
    "@/lib/legal-links": load("lib/legal-links.ts"),
  }).default;
  const Page = load("app/(auth)/sign-in/page.tsx", {
    "react/jsx-runtime": jsx,
    "next/image": "image",
    "@/components/forms": { SigninForm: "sign-in" },
    "@/components/legal/PolicyLinks": policy,
  }).default;
  const tree = await Page();
  assert.ok(find(tree, (n) => n.type === "sign-in"));
  assert.ok(find(tree, (n) => n.type === policy));
  for (const href of [
    "/terms-and-conditions",
    "/privacy-policy",
    "/community-guidelines",
    "/intellectual-property-policy",
    "/cookies-policy",
    "/branded-content-policy",
    "/child-safety-standards",
  ]) {
    const link = find(
      policy(),
      (n) => n.type === "link" && n.props.href === href,
    );
    assert.equal(link.props.target, "_blank");
  }
});
