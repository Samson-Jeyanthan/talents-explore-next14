const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { isRedirectError } = require("next/dist/client/components/redirect");

function load(file, modules, extra = {}) {
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
      Error,
      URL,
      URLSearchParams,
      AbortSignal,
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test/api" } },
      console: { log() {}, error() {}, warn() {} },
      ...extra,
    },
  );
  return testModule.exports;
}

const refreshRedirect = Object.assign(new Error("NEXT_REDIRECT"), {
  digest: "NEXT_REDIRECT;replace;/api/auth/refresh?next=%2Fsettings;307;",
});

test("settings resolves a fresh token before loading the profile", async () => {
  let requestedToken;
  const actions = load("actions/settings.action.tsx", {
    "@/lib/session": {
      getAuthHeaders: async () => ({ Authorization: "Bearer fresh-token" }),
    },
    "./auth.action": {
      getUserPersonalInfoAction: async (token) => {
        requestedToken = token;
        return { status: "7400", response: { _id: "user-1" } };
      },
    },
    "next/dist/client/components/redirect": { isRedirectError },
  });
  assert.equal((await actions.getCurrentSettingsUserAction())._id, "user-1");
  assert.equal(requestedToken, "fresh-token");
});

test("settings and nested requests preserve the route-refresh redirect", async () => {
  const actions = load("actions/settings.action.tsx", {
    "@/lib/session": {
      getAuthHeaders: async () => {
        throw refreshRedirect;
      },
    },
    "next/dist/client/components/redirect": { isRedirectError },
  });
  for (const action of [
    actions.getCurrentSettingsUserAction,
    actions.getAdvertisementRequestsAction,
    actions.getPrivacySettingsAction,
  ]) {
    await assert.rejects(action(), (error) => error === refreshRedirect);
  }
});

test("profile API failure is a retryable settings error, not a null user/signout", async () => {
  for (const profile of [
    async () => {
      throw new Error("Timeout");
    },
    async () => ({ status: "ERROR" }),
  ]) {
    const actions = load("actions/settings.action.tsx", {
      "@/lib/session": {
        getAuthHeaders: async () => ({ Authorization: "Bearer valid-token" }),
      },
      "./auth.action": { getUserPersonalInfoAction: profile },
      "next/dist/client/components/redirect": { isRedirectError },
    });
    await assert.rejects(
      actions.getCurrentSettingsUserAction(),
      /Unable to load your settings profile/,
    );
  }
});

test("settings page refreshes auth before rendering and does not send profile failures to sign-in", async () => {
  const page = load("app/(root)/settings/[[...slug]]/page.tsx", {
    "@/lib/session": {
      getAuthHeaders: async () => {
        throw refreshRedirect;
      },
    },
  });
  await assert.rejects(
    page.default({ params: {} }),
    (error) => error === refreshRedirect,
  );
  const unavailable = load("app/(root)/settings/[[...slug]]/page.tsx", {
    "@/lib/session": {
      getAuthHeaders: async () => ({ Authorization: "Bearer fresh-token" }),
    },
    "@/actions/settings.action": {
      getCurrentSettingsUserAction: async () => null,
    },
  });
  await assert.rejects(
    unavailable.default({ params: {} }),
    /Unable to load your settings/,
  );
});

test("temporary refresh failure preserves cookies and does not pretend the user is signed out", async () => {
  const deleted = [];
  const sessions = load(
    "lib/session.ts",
    {
      "jwt-decode": { jwtDecode: () => ({ exp: 0, sub: "user-1" }) },
      "next/headers": {
        cookies: () => ({
          get: (name) => ({
            value:
              name === "refresh_token" ? "refresh-token" : "expired-access",
          }),
          set() {},
          delete: (name) => deleted.push(name),
        }),
      },
    },
    {
      fetch: async () => {
        throw new Error("Connection unavailable");
      },
    },
  );
  await assert.rejects(sessions.getSession(), /could not be refreshed/);
  assert.equal(deleted.length, 0);
});

test("refresh route offers retry for outages, only clearing cookies for rejected credentials", async () => {
  const { NextResponse } = require("next/server");
  for (const invalid of [false, true]) {
    let cleared = false;
    const route = load("app/api/auth/refresh/route.ts", {
      "next/server": { NextResponse },
      "@/lib/session": {
        refreshSession: async () => ({ ok: false, invalid }),
        clearSession: async () => {
          cleared = true;
        },
      },
    });
    const url = "http://localhost:3000/api/auth/refresh?next=%2Fsettings";
    const response = await route.GET({ nextUrl: new URL(url), url });
    if (!invalid) {
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("location"), null);
      assert.match(await response.text(), /Try again/);
      assert.equal(cleared, false);
    } else {
      assert.equal(cleared, true);
      assert.match(
        response.headers.get("location"),
        /\/sign-in\?next=%2Fsettings/,
      );
    }
  }
});
