const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { isRedirectError } = require("next/dist/client/components/redirect");

function load(file, modules = {}, extra = {}) {
  const testModule = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      module: testModule,
      exports: testModule.exports,
      require: (name) =>
        modules[name] || (name === "zod" ? require("zod") : {}),
      Error,
      AbortSignal,
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test/api" } },
      ...extra,
    },
  );
  return testModule.exports;
}
const validation = load("lib/validations/report.validation.ts");
const targetId = "111111111111111111111111";
const input = {
  targetType: "post",
  targetId,
  reason: "7",
  description: "  Test report details.  ",
};

function harness(
  response = { ok: true, json: async () => ({ status: "7400" }) },
  authError,
) {
  const requests = [];
  let authCalls = 0;
  const actions = load(
    "actions/report.action.ts",
    {
      "@/lib/validations/report.validation": validation,
      "@/lib/session": {
        getAuthHeaders: async () => {
          authCalls++;
          if (authError) throw authError;
          return {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          };
        },
      },
      "next/dist/client/components/redirect": { isRedirectError },
    },
    {
      fetch: async (url, options) => {
        requests.push({ url, options });
        if (response instanceof Error) throw response;
        return response;
      },
    },
  );
  return {
    submit: actions.submitReportAction,
    requests,
    authCalls: () => authCalls,
  };
}

test("post/shared, profile and collaboration reports use the mobile endpoints and reason labels", async () => {
  for (const [type, path] of [
    ["post", "post"],
    ["profile", "user"],
    ["collaboration", "collaboration"],
  ]) {
    const h = harness();
    assert.equal(
      (await h.submit({ ...input, targetType: type, reporterId: "forged-id" }))
        .success,
      true,
    );
    const { url, options } = h.requests[0];
    assert.equal(url, `https://backend.test/api/report/${path}/${targetId}`);
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.deepEqual(JSON.parse(options.body), {
      reason: "Spam or misleading content",
      description: "Test report details.",
    });
  }
});

test("all 15 mobile reason choices are accepted, while missing or unknown reasons and blank details are rejected", async () => {
  assert.equal(validation.REPORT_REASONS.length, 15);
  for (const reason of validation.REPORT_REASONS)
    assert(
      validation.reportValidation.safeParse({ ...input, reason: reason.value })
        .success,
    );
  const h = harness();
  for (const data of [
    { ...input, reason: "" },
    { ...input, reason: "99" },
    { ...input, description: "   " },
  ]) {
    assert.equal((await h.submit(data)).success, false);
  }
  assert.equal(h.authCalls(), 0);
  assert.equal(h.requests.length, 0);
});

test("arbitrary endpoint types and malformed target IDs cannot reach the API", async () => {
  const h = harness();
  for (const data of [
    { ...input, targetType: "user/other-path" },
    { ...input, targetId: "../another-user" },
    {},
  ]) {
    assert.equal((await h.submit(data)).success, false);
  }
  assert.equal(h.requests.length, 0);
});

test("success requires both HTTP success and application status 7400", async () => {
  for (const response of [
    { ok: false, json: async () => ({ status: "7400" }) },
    { ok: true, json: async () => ({ status: "ERROR" }) },
    {
      ok: false,
      json: async () => {
        throw new Error("Non-JSON response");
      },
    },
    new Error("Connection interrupted"),
  ])
    assert.equal((await harness(response).submit(input)).success, false);
});

test("backend validation messages remain readable for retry", async () => {
  const result = await harness({
    ok: false,
    json: async () => ({
      message: ["Report already exists", "Please try again later"],
    }),
  }).submit(input);
  assert.equal(result.success, false);
  assert.equal(result.message, "Report already exists. Please try again later");
});

test("expired-session redirects propagate instead of appearing as report failures", async () => {
  const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/sign-in;307;",
  });
  const h = harness(null, redirect);
  await assert.rejects(h.submit(input), (error) => error === redirect);
  assert.equal(h.requests.length, 0);
});
