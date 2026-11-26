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
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (name) => mocks[name] || (name === "zod" ? require(name) : {}),
      ...globals,
    },
  );
  return module.exports;
}
const password = load("lib/validations/password.validation.ts");
test("passwords accept the original symbols plus hash", () => {
  for (const symbol of "@$!%*?&#") {
    const value = "Abc1234" + symbol;
    assert.equal(password.newPasswordValidation.parse(value), value);
  }
});
test("password strength and character restrictions are preserved", () => {
  for (const value of [
    "",
    "Abc#123",
    "Abc#" + "1".repeat(17),
    "abc#1234",
    "ABC#1234",
    "Abcd#efg",
    "Abcd1234",
    "Abcd123 ",
    " Abc#1234 ",
    "Abc_1234",
    "Abc-1234",
    "Abc#1234" + String.fromCodePoint(0x1f600),
    "Abc#1234" + String.fromCodePoint(0xe9),
    "Abc#1234\n",
  ]) {
    assert.equal(
      password.newPasswordValidation.safeParse(value).success,
      false,
      JSON.stringify(value),
    );
  }
  assert.equal(
    password.newPasswordValidation.safeParse("Abc#" + "1".repeat(16)).success,
    true,
  );
});
test("signup, reset and password change share the hash-enabled policy and exact confirmation", () => {
  const signup = load("lib/validations/signup.validation.ts", {
    "./password.validation": password,
  });
  const auth = load("lib/validations/auth.validation.ts", {
    "./password.validation": password,
  });
  const value = "Abc#1234";
  assert.equal(
    signup.signupRequestValidation.parse({
      email: "qa@example.test",
      userName: "synthetic",
      password: value,
      acceptedPolicies: true,
    }).password,
    value,
  );
  assert.equal(
    password.resetPasswordRequestValidation.parse({
      userId: "synthetic",
      otp: "000123",
      newPassword: value,
    }).newPassword,
    value,
  );
  assert.equal(
    password.changePasswordRequestValidation.parse({
      oldPassword: "legacy",
      newPassword: value,
    }).oldPassword,
    "legacy",
  );
  assert.equal(
    auth.ResetPasswordValidation.safeParse({
      password: value,
      confirmPassword: value,
    }).success,
    true,
  );
  assert.equal(
    auth.ResetPasswordValidation.safeParse({
      password: value,
      confirmPassword: value + " ",
    }).success,
    false,
  );
});
function server({ throws = false } = {}) {
  const calls = [],
    logs = [];
  const action = load(
    "actions/settings.action.tsx",
    {
      "@/lib/validations/password.validation": password,
      "@/lib/session": {
        getAuthHeaders: async () => ({ Authorization: "Bearer synthetic" }),
      },
      "./auth.action": {
        getUserPersonalInfoAction: async () => ({
          status: "7400",
          response: { _id: "111111111111111111111111" },
        }),
      },
      "next/dist/client/components/redirect": { isRedirectError: () => false },
      axios: {
        put: async (...args) => {
          calls.push(args);
          if (throws) throw Error("private password payload");
          return { data: { status: "7400" } };
        },
      },
    },
    {
      process: {
        env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.example.test" },
      },
      console: { error: (...args) => logs.push(args) },
    },
  ).changePasswordSettingsAction;
  return { action, calls, logs };
}
test("password-change server action rejects invalid requests before contacting the backend", async () => {
  for (const input of [
    null,
    {},
    { oldPassword: "", newPassword: "Abc#1234" },
    { oldPassword: "legacy", newPassword: "weak" },
    { oldPassword: 42, newPassword: "Abc#1234" },
  ]) {
    const h = server();
    assert.equal((await h.action(input)).status, "400");
    assert.equal(h.calls.length, 0);
  }
});
test("password-change server action sends hash-enabled passwords exactly and never logs failed password requests", async () => {
  const h = server();
  const value = "Abc#1234";
  assert.equal(
    (await h.action({ oldPassword: " old ", newPassword: value, extra: true }))
      .status,
    "7400",
  );
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls[0][1])), {
    oldPassword: " old ",
    newPassword: value,
  });
  assert.equal(h.calls[0][2].timeout, 15000);
  const failed = server({ throws: true });
  const result = await failed.action({
    oldPassword: "legacy",
    newPassword: value,
  });
  assert.equal(result.status, "400");
  assert.equal(JSON.stringify(result).includes("private"), false);
  assert.equal(failed.logs.length, 0);
});
