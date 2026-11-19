const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { isRedirectError } = require("next/dist/client/components/redirect");

function load(
  file,
  modules,
  fetch = () => {
    throw new Error("Unexpected network request");
  },
) {
  const testModule = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module: testModule,
      exports: testModule.exports,
      require: (name) => modules[name] || {},
      fetch,
      console: { error() {}, log() {} },
      Error,
      String,
    },
  );
  return testModule.exports;
}

const refreshRedirect = Object.assign(new Error("NEXT_REDIRECT"), {
  digest: "NEXT_REDIRECT;replace;/api/auth/refresh?next=%2Fhome;307;",
});
test("viewer identity propagates refresh redirects rather than decoding an expired token", async () => {
  const viewer = load("actions/tokenAndHeaders.action.ts", {
    "@/lib/session": {
      getAuthHeaders: async () => {
        throw refreshRedirect;
      },
    },
  });
  await assert.rejects(
    viewer.resolveViewerIdAction(),
    (error) => error === refreshRedirect,
  );
});

test("viewer identity decodes the freshly resolved token", async () => {
  const viewer = load("actions/tokenAndHeaders.action.ts", {
    "@/lib/session": {
      getAuthHeaders: async () => ({ Authorization: "Bearer fresh-token" }),
    },
    "jwt-decode": {
      jwtDecode: (token) => {
        assert.equal(token, "fresh-token");
        return { sub: "viewer-1" };
      },
    },
  });
  assert.equal(await viewer.resolveViewerIdAction(), "viewer-1");
});

test("home and shared feeds preserve refresh redirects instead of returning a generic error", async () => {
  assert(isRedirectError(refreshRedirect));
  const actions = load("actions/post.action.tsx", {
    "./tokenAndHeaders.action": {
      resolveViewerIdAction: async () => {
        throw refreshRedirect;
      },
    },
    "next/dist/client/components/redirect": { isRedirectError },
  });
  await assert.rejects(
    actions.getAllPostsAction(1, 10),
    (error) => error === refreshRedirect,
  );
  await assert.rejects(
    actions.getAllSharesAction(1, 10),
    (error) => error === refreshRedirect,
  );
});

test("post details preserve auth redirects", async () => {
  const actions = load("actions/post.action.tsx", {
    "./session.action": { getSession: async () => "stored-token" },
    "@/lib/session": {
      getAuthHeaders: async () => {
        throw refreshRedirect;
      },
    },
    "next/dist/client/components/redirect": { isRedirectError },
  });
  await assert.rejects(
    actions.getPostByIdAction("post-1", "viewer-1"),
    (error) => error === refreshRedirect,
  );
});

test("ordinary feed failures still return a recoverable error result", async () => {
  const actions = load("actions/post.action.tsx", {
    "./tokenAndHeaders.action": {
      resolveViewerIdAction: async () => {
        throw new Error("Network unavailable");
      },
    },
    "next/dist/client/components/redirect": { isRedirectError },
  });
  const result = await actions.getAllPostsAction(1, 10);
  assert.equal(result.status, 500);
});
