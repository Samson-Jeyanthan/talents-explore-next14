const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, mocks = {}, extra = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    module, exports: module.exports,
    require: (name) => mocks[name] || (name === "react/jsx-runtime" ? {
      jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: "Fragment",
    } : {}),
    console: { error() {} }, AbortSignal, ...extra,
  });
  return module.exports;
}
const towns = load("lib/utils/towns.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const success = (...names) => ({ status: "7400", response: names.map((state) => ({ state })) });

function formHarness({ saved = false } = {}) {
  const cells = [], cleanups = [], calls = [];
  let cursor = 0;
  const values = { country: saved ? "Sri Lanka" : "", state: saved ? "Saved town" : "" };
  const form = {
    getValues: (key) => values[key],
    setValue: (key, value) => { values[key] = value; },
    resetField() { throw Error("Must not restore a previous country's town"); },
    formState: {}, handleSubmit: () => () => {},
  };
  const Component = load("components/multiStepForms/ParentCreatePostShareForm.tsx", {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in cells)) cells[i] = typeof initial === "function" ? initial() : initial;
        return [cells[i], (value) => { cells[i] = value; }];
      },
      useRef(initial) { const i = cursor++; return cells[i] ||= { current: initial }; },
      useEffect(effect) { const i = cursor++; if (!(i in cells)) { cells[i] = true; cleanups.push(effect()); } },
    },
    "react-hook-form": { useForm: () => form },
    "@hookform/resolvers/zod": { zodResolver: () => () => {} },
    "@/components/forms": { CreatePostAboutForm: "About", CreatePostCreditForm: "Credit" },
    "@/lib/utils/towns": towns,
    "@/lib/utils/postEditing": { getPostEditValues: () => ({ ...values }) },
    "@/actions/utils.action": { getStatesAction(country) {
      const request = deferred(); calls.push({ country, ...request }); return request.promise;
    } },
    "@/context/AuthProvider": { useUserContext: () => ({ user: {} }) },
    "next/navigation": { useRouter: () => ({}) },
  }).default;
  function find(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "About") return node.props;
    for (const child of [node.props?.children].flat(Infinity)) {
      const found = find(child); if (found) return found;
    }
  }
  return {
    calls, values,
    render() {
      cursor = 0;
      return find(Component({ formType: "POST", initialPost: saved ? { _id: "saved" } : undefined,
        initialOptions: { states: [{ state: "Zulu" }, { state: "Alpha" }] } }));
    },
    unmount() { cleanups.forEach((cleanup) => cleanup?.()); },
  };
}

test("town options sort, deduplicate and retain the backend's names as values", () => {
  assert.deepEqual(plain(towns.townOptions([{ state: "Zürich" }, { state: "Colombo" },
    { state: "Colombo" }, null, {}, "A town", { name: "B town" }, { state: 42 }])), [
    { _id: "A town", name: "A town" }, { _id: "B town", name: "B town" },
    { _id: "Colombo", name: "Colombo" }, { _id: "Zürich", name: "Zürich" },
  ]);
  assert.deepEqual(plain(towns.townOptions(null)), []);
});

test("editing preserves a saved town missing from the current country list", () => {
  const h = formHarness({ saved: true });
  const view = h.render();
  assert.equal(h.values.state, "Saved town");
  assert.ok(view.stateOptions.some((option) => option._id === "Saved town"));
});

test("changing country clears the edited town and ignores older country responses", async () => {
  const h = formHarness({ saved: true });
  const old = h.render().fetchStates("Old country");
  assert.equal(h.values.state, "");
  assert.equal(h.render().townLoading, true);
  const latest = h.render().fetchStates("New country");
  h.calls[1].resolve(success("New town")); await latest;
  h.calls[0].resolve(success("Old town")); await old;
  const view = h.render();
  assert.deepEqual(plain(view.stateOptions), [{ _id: "New town", name: "New town" }]);
  assert.equal(view.townLoading, false);
  assert.equal(view.townError, "");
});

test("failed town lookup can be retried and an empty country never calls the API", async () => {
  const h = formHarness();
  const failed = h.render().fetchStates("Sri Lanka");
  h.calls[0].reject(Error("offline")); await failed;
  assert.match(h.render().townError, /Unable to load towns/);
  assert.equal(h.render().townLoading, false);
  const retried = h.render().fetchStates("Sri Lanka");
  assert.equal(h.render().townError, "");
  h.calls[1].resolve(success("Colombo")); await retried;
  assert.equal(h.render().stateOptions[0]._id, "Colombo");
  await h.render().fetchStates("");
  assert.equal(h.calls.length, 2);
  assert.deepEqual(plain(h.render().stateOptions), []);
});

test("late failures and unmounted town requests do not change the latest list", async () => {
  const h = formHarness();
  const old = h.render().fetchStates("Old");
  const next = h.render().fetchStates("New");
  h.calls[1].resolve(success("New town")); await next;
  h.calls[0].reject(Error("old failure")); await old;
  assert.equal(h.render().townError, "");
  const final = h.render().fetchStates("Last");
  h.unmount(); h.calls[2].resolve(success("Late town")); await final;
  assert.deepEqual(plain(h.render().stateOptions), []);
});

test("post town action encodes country names, uses fresh auth, and rejects blank countries", async () => {
  const calls = [];
  const actions = load("actions/utils.action.tsx", {
    "@/lib/session": { getAuthHeaders: async () => ({ Authorization: "Bearer fresh" }) },
  }, {
    process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://api.test" } },
    fetch: async (url, options) => { calls.push({ url, options }); return { ok: true,
      json: async () => success("Town") }; },
  });
  assert.notEqual((await actions.getStatesAction(" ")).status, "7400");
  assert.equal(calls.length, 0);
  const result = await actions.getStatesAction("Côte d'Ivoire");
  assert.equal(result.response[0].state, "Town");
  assert.equal(calls[0].url, `https://api.test/country/states/${encodeURIComponent("Côte d'Ivoire")}`);
  assert.equal(calls[0].options.headers.Authorization, "Bearer fresh");
  assert.equal(calls[0].options.cache, "no-store");
  assert.ok(calls[0].options.signal);
});
