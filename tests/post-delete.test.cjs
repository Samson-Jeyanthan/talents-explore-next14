const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { isRedirectError } = require("next/dist/client/components/redirect");
const postId = "6aff08a32e63b493d0e6e337";

function harness(response, authError) {
  const calls = [];
  const invalidated = [];
  const testModule = { exports: {} };
  const modules = {
    "@/lib/session": {
      getAuthHeaders: async () => {
        if (authError) throw authError;
        return { Authorization: "Bearer test-token" };
      },
    },
    "next/cache": { revalidatePath: (path) => invalidated.push(path) },
    "next/dist/client/components/redirect": { isRedirectError },
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync("actions/post.action.tsx", "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module: testModule,
      exports: testModule.exports,
      require: (name) => modules[name] || {},
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test/api" } },
      fetch: async (url, options) => {
        calls.push({ url, options });
        if (response instanceof Error) throw response;
        return response;
      },
      console: { error() {}, log() {} },
      Error,
    },
  );
  return {
    deletePost: testModule.exports.deletePostAction,
    calls,
    invalidated,
  };
}

test("successful deletion uses authenticated mobile endpoint and invalidates affected views", async () => {
  const h = harness({ ok: true, json: async () => ({ status: "7400" }) });
  assert.equal((await h.deletePost(postId)).success, true);
  assert.equal(h.calls[0].url, `https://backend.test/api/te-post/${postId}`);
  assert.equal(h.calls[0].options.method, "DELETE");
  assert.equal(h.calls[0].options.headers.Authorization, "Bearer test-token");
  assert(h.invalidated.includes("/home"));
  assert(h.invalidated.includes("/settings/activity/deleted"));
});

test("invalid IDs cannot reach the backend", async () => {
  const h = harness();
  for (const id of ["", "../another-route", undefined])
    assert.equal((await h.deletePost(id)).success, false);
  assert.equal(h.calls.length, 0);
});

test("ownership rejection, application failure and network failure never report success or invalidate views", async () => {
  for (const response of [
    {
      ok: false,
      json: async () => ({ status: "7400", message: "Not allowed" }),
    },
    { ok: true, json: async () => ({ status: "ERROR" }) },
    {
      ok: false,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    },
    new Error("Network unavailable"),
  ]) {
    const h = harness(response);
    assert.equal((await h.deletePost(postId)).success, false);
    assert.equal(h.invalidated.length, 0);
  }
});

test("expired-session redirects remain redirects", async () => {
  const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/sign-in;307;",
  });
  const h = harness(null, redirect);
  await assert.rejects(h.deletePost(postId), (error) => error === redirect);
  assert.equal(h.calls.length, 0);
});
