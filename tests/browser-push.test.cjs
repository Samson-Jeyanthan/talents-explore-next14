const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const moduleUnderTest = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/browser-push.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { module: moduleUnderTest, exports: moduleUnderTest.exports },
);
const { createPushController } = moduleUnderTest.exports;
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function setup(overrides = {}) {
  const calls = [],
    events = {};
  let permission = "default",
    remembered = false;
  const sub = {
    optedIn: false,
    async optIn() {
      calls.push("optIn");
      permission = "granted";
      sub.optedIn = true;
    },
    async optOut() {
      calls.push("optOut");
      sub.optedIn = false;
    },
    addEventListener(event, fn) {
      events.subscription = fn;
    },
  };
  const sdk = {
    User: { PushSubscription: sub, externalId: "" },
    Notifications: {
      isPushSupported: () => true,
      addEventListener(event, fn) {
        events.permission = fn;
      },
    },
    async login(id) {
      calls.push(`login:${id}`);
      sdk.User.externalId = id;
    },
    async logout() {
      calls.push("logout");
      sdk.User.externalId = "";
    },
  };
  const controller = createPushController({
    configured: true,
    supported: () => true,
    load: async () => {
      calls.push("load");
      return sdk;
    },
    permission: () => permission,
    remembered: () => remembered,
    remember: (active) => {
      remembered = active;
    },
    ...overrides,
  });
  return {
    controller,
    calls,
    sdk,
    sub,
    events,
    permission: (value) => {
      permission = value;
    },
    remembered: () => remembered,
  };
}
test("unconfigured and unsupported browsers never load SDK or resolve identity", async () => {
  for (const config of [{ configured: false }, { supported: () => false }]) {
    const { controller, calls } = setup(config);
    await controller.connect(() => {
      throw new Error("must not verify");
    });
    assert.equal(calls.length, 0);
    assert.equal(controller.getSnapshot().enabled, false);
  }
});
test("anonymous first visit does not load SDK or request permission", async () => {
  const { controller, calls } = setup();
  await controller.connect(async () => "");
  assert.equal(calls.length, 0);
  assert.equal(controller.getSnapshot().status, "idle");
});
test("verified login never prompts; browser permission is requested only by explicit enabling", async () => {
  const { controller, calls } = setup();
  await controller.connect(async () => "verified-user");
  assert.deepEqual(calls, ["load", "login:verified-user"]);
  assert.equal(controller.getSnapshot().enabled, false);
  await controller.setEnabled(true);
  assert.equal(controller.getSnapshot().enabled, true);
  await controller.setEnabled(false);
  assert.equal(controller.getSnapshot().enabled, false);
});
test("blocked permission and subscription changes refresh displayed state", async () => {
  const { controller, sub, events, permission } = setup();
  await controller.connect(async () => "user");
  permission("granted");
  sub.optedIn = true;
  events.subscription();
  assert.equal(controller.getSnapshot().enabled, true);
  permission("denied");
  events.permission();
  assert.equal(controller.getSnapshot().enabled, false);
  assert.equal(controller.getSnapshot().blocked, true);
});
test("sign-out invalidates delayed session verification", async () => {
  const check = deferred();
  const { controller, calls } = setup();
  const connecting = controller.connect(() => check.promise);
  await controller.disconnect();
  check.resolve("previous-user");
  await connecting;
  assert.deepEqual(calls, []);
});
test("sign-out during SDK loading opts out and unlinks without late login", async () => {
  const loading = deferred();
  const { controller, sdk, calls } = setup({ load: () => loading.promise });
  const connecting = controller.connect(async () => "old-user");
  await new Promise(setImmediate);
  const signingOut = controller.disconnect();
  loading.resolve(sdk);
  await Promise.all([connecting, signingOut]);
  assert.deepEqual(calls, ["optOut", "logout"]);
  assert.equal(controller.getSnapshot().enabled, false);
});
test("account switch detaches existing subscription before associating new recipient", async () => {
  const { controller, calls } = setup();
  await controller.connect(async () => "first");
  await controller.setEnabled(true);
  await controller.connect(async () => "second");
  assert.deepEqual(calls, [
    "load",
    "login:first",
    "optIn",
    "optOut",
    "logout",
    "login:second",
  ]);
  assert.equal(controller.getSnapshot().enabled, false);
});
test("logout is attempted even if opt-out fails; cleanup marker survives failure", async () => {
  const { controller, sdk, sub, calls, remembered } = setup();
  await controller.connect(async () => "user");
  sub.optOut = async () => {
    throw new Error("offline");
  };
  sdk.logout = async () => {
    calls.push("logout");
    throw new Error("offline");
  };
  await controller.disconnect();
  assert.equal(calls.at(-1), "logout");
  assert.equal(remembered(), true);
  assert.match(controller.getSnapshot().error, /sign-out/);
  assert.equal(controller.getSnapshot().enabled, false);
});
test("signed-out visit retries a previous failed cleanup", async () => {
  const { controller, calls } = setup({ remembered: () => true });
  await controller.connect(async () => "");
  assert.deepEqual(calls, ["load", "optOut", "logout"]);
});
test("failed opt-in keeps actual state and allows retry", async () => {
  const { controller, sub } = setup();
  await controller.connect(async () => "user");
  const optIn = sub.optIn;
  sub.optIn = async () => {
    throw new Error("offline");
  };
  await controller.setEnabled(true);
  assert.equal(controller.getSnapshot().enabled, false);
  assert.equal(controller.getSnapshot().pending, false);
  assert.match(controller.getSnapshot().error, /try again/);
  sub.optIn = optIn;
  await controller.setEnabled(true);
  assert.equal(controller.getSnapshot().enabled, true);
});
test("identity failure never logs in or requests permission", async () => {
  const { controller, calls } = setup();
  await controller.connect(async () => {
    throw new Error("expired");
  });
  assert.deepEqual(calls, []);
  assert.equal(controller.getSnapshot().status, "error");
});
test("rapid enable clicks are serialized and sign-out waits for an in-flight opt-in", async () => {
  const work = deferred();
  const { controller, sub, calls } = setup();
  await controller.connect(async () => "user");
  sub.optIn = async () => {
    calls.push("optIn");
    await work.promise;
    sub.optedIn = true;
  };
  const first = controller.setEnabled(true);
  await new Promise(setImmediate);
  const second = controller.setEnabled(true);
  const logout = controller.disconnect();
  work.resolve();
  await Promise.all([first, second, logout]);
  assert.deepEqual(calls, ["load", "login:user", "optIn", "optOut", "logout"]);
  assert.equal(controller.getSnapshot().enabled, false);
  assert.equal(controller.getSnapshot().pending, false);
});
test("failed session revalidation stops a previously active subscription", async () => {
  const { controller, calls } = setup();
  await controller.connect(async () => "old-user");
  await controller.setEnabled(true);
  await controller.connect(async () => {
    throw new Error("session unavailable");
  });
  assert.deepEqual(calls.slice(-2), ["optOut", "logout"]);
  assert.equal(controller.getSnapshot().enabled, false);
  assert.equal(controller.getSnapshot().status, "error");
});
test("account switching opts out even before SDK externalId has propagated", async () => {
  const { controller, sdk, calls } = setup();
  await controller.connect(async () => "first");
  await controller.setEnabled(true);
  sdk.User.externalId = undefined;
  await controller.connect(async () => "second");
  assert.deepEqual(calls.slice(-3), ["optOut", "logout", "login:second"]);
  assert.equal(controller.getSnapshot().enabled, false);
});
