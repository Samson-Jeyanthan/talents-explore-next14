const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
const profile = "6aff08a32e63b493d0e6e337",
  first = "6aff08a32e63b493d0e6e339",
  second = "6aff08a32e63b493d0e6e340";
const nativeFile = globalThis.File || require("node:buffer").File;
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
      require: (name) => {
        if (name in mocks) return mocks[name];
        if (name.startsWith("@/") || name.startsWith(".")) {
          const base = name.startsWith("@/")
            ? name.slice(2)
            : path.join(path.dirname(file), name);
          const target = [base, base + ".ts", base + ".tsx"].find(
            (file) => fs.existsSync(file) && fs.statSync(file).isFile(),
          );
          if (target) return load(target, mocks, globals);
        }
        return require(name);
      },
      Error,
      File: nativeFile,
      URL,
      AbortSignal,
      console,
      ...globals,
    },
  );
  return module.exports;
}
const util = load("lib/utils/profile-awards.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
const award = (id = first) => ({
  _id: id,
  name: "Award",
  givenBy: "Test authority",
  year: 2025,
  certificateUrl: "https://example.test/certificate.pdf",
  certificateUrlKey: "certificate.pdf",
});
const ok = (response) => ({ status: "7400", response });
function api(responses = [], authError, cacheError = false) {
  const calls = [],
    invalidations = [],
    logs = [];
  let auth = 0;
  const actions = load(
    "actions/profile-awards.action.ts",
    {
      "@/lib/session": {
        getAuthHeaders: async () => {
          auth++;
          if (authError) throw authError;
          return { Authorization: "Bearer private-test-token" };
        },
      },
      "next/cache": {
        revalidatePath: (...args) => {
          invalidations.push(args);
          if (cacheError) throw new Error("Cache unavailable");
        },
      },
      "next/dist/client/components/redirect": {
        isRedirectError: (error) => error?.digest?.startsWith("NEXT_REDIRECT"),
      },
    },
    {
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      console: {
        log: (...args) => logs.push(args),
        error: (...args) => logs.push(args),
      },
      fetch: async (url, options) => {
        calls.push({
          url,
          options,
          body: options.body ? JSON.parse(options.body) : undefined,
        });
        const data = responses.shift();
        if (data instanceof Error) throw data;
        return {
          ok: data?.httpStatus ? data.httpStatus < 400 : true,
          json: async () => data,
        };
      },
    },
  );
  return { actions, calls, invalidations, logs, auth: () => auth };
}
test("certificate URLs support stored URLs, legacy objects and raw S3 keys without unsafe schemes", () => {
  assert.equal(
    util.certificateUrl({
      certificateUrl: { uri: "https://example.test/my award.pdf" },
    }),
    "https://example.test/my%20award.pdf",
  );
  assert.equal(
    util.certificateUrl({
      certificateUrl: { url: "https://example.test/a%20b.pdf" },
    }),
    "https://example.test/a%20b.pdf",
  );
  assert.equal(
    util.certificateUrl({ certificateUrlKey: "awards/my award%3A1.pdf" }),
    "https://te-files-media.s3.eu-west-2.amazonaws.com/awards/my%20award%253A1.pdf",
  );
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,test",
    "//other.test/file",
    "https://user:pass@example.test/file",
  ])
    assert.equal(util.certificateUrl({ certificateUrl: value }), "");
});
test("certificate selection accepts PDF, DOCX and images and rejects invalid replacements", () => {
  for (const [name, type] of [
    ["cv.pdf", "application/pdf"],
    [
      "award.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    ["photo.jpg", "image/jpeg"],
    ["scan.webp", "image/webp"],
    ["scan.pdf", ""],
  ])
    assert.equal(util.certificateFileError({ name, type, size: 100 }), "");
  for (const file of [
    { name: "empty.pdf", type: "application/pdf", size: 0 },
    { name: "huge.pdf", type: "application/pdf", size: 21 * 1024 * 1024 },
    { name: "script.html", type: "text/html", size: 100 },
    { name: "fake.pdf", type: "text/html", size: 100 },
  ])
    assert.ok(util.certificateFileError(file));
  assert.equal(
    util.certificateName(
      new nativeFile(["pdf"], "award.pdf", { type: "application/pdf" }),
    ),
    "award.pdf",
  );
});
test("award validation trims fields and rejects missing files, blank names and future years", () => {
  const data = { ...award(), name: " Award ", givenBy: " Authority " };
  assert.equal(util.profileAwardValidation.parse(data).name, "Award");
  for (const patch of [
    { name: " " },
    { givenBy: " " },
    { year: "undefined" },
    { year: new Date().getFullYear() + 1 },
    { certificateUrl: "" },
    { certificateUrl: "javascript:alert(1)" },
  ])
    assert.equal(
      util.profileAwardValidation.safeParse({ ...data, ...patch }).success,
      false,
    );
});
test("award reads distinguish empty success, backend errors, malformed data and outages", async () => {
  const h = api([
    ok([]),
    ok({}),
    { status: "7401" },
    new Error("Offline"),
    ok([award()]),
  ]);
  assert.equal(
    (await h.actions.getProfileAwardsAction(profile)).status,
    "7400",
  );
  for (let i = 0; i < 3; i++)
    assert.equal(
      (await h.actions.getProfileAwardsAction(profile)).status,
      "400",
    );
  assert.equal(
    (await h.actions.getProfileAwardsAction(profile)).response.length,
    1,
  );
  assert.equal(h.logs.length, 0);
});
test("invalid writes never request auth or a backend endpoint", async () => {
  const h = api();
  await h.actions.saveProfileAwardAction({
    profileId: profile,
    award: { name: "" },
  });
  await h.actions.deleteProfileAwardAction("bad", first);
  await h.actions.getProfileAwardsAction("bad");
  assert.equal(h.auth(), 0);
  assert.equal(h.calls.length, 0);
});
test("save verifies backend identity and merges against a fresh list instead of an old form array", async () => {
  const existing = { ...award(second), customMetadata: "Keep me" };
  const h = api([ok({ _id: profile }), ok([existing]), ok({})]);
  const result = await h.actions.saveProfileAwardAction({
    profileId: profile,
    award: { ...award(), certificateUrl: "https://example.test/new.pdf" },
  });
  assert.equal(result.status, "7400");
  assert.equal(h.calls[0].url, "https://backend.test/user/");
  assert.equal(h.calls[2].url, "https://backend.test/user/awardsOrCertificate");
  assert.equal(h.calls[2].options.method, "PUT");
  assert.equal(h.calls[2].body.length, 2);
  assert.deepEqual(h.calls[2].body[0], existing);
  assert.equal(
    h.calls[2].options.headers.Authorization,
    "Bearer private-test-token",
  );
  assert.equal(h.calls[2].options.cache, "no-store");
  assert.equal(h.invalidations.length, 1);
  assert.equal(h.logs.length, 0);
});
test("editing preserves the saved certificate, identity and unrelated awards", async () => {
  const original = award(),
    other = award(second);
  const h = api([ok({ _id: profile }), ok([original, other]), ok({})]);
  await h.actions.saveProfileAwardAction({
    profileId: profile,
    awardId: first,
    award: { ...original, name: "Updated" },
  });
  const rows = h.calls[2].body;
  assert.equal(rows[0]._id, first);
  assert.equal(rows[0].name, "Updated");
  assert.equal(rows[0].certificateUrlKey, "certificate.pdf");
  assert.deepEqual(rows[1], other);
});
test("another user's profile cannot be changed and failed reads never overwrite awards", async () => {
  for (const responses of [
    [ok({ _id: second })],
    [ok({ _id: profile }), new Error("Offline")],
    [ok({ _id: profile }), ok({})],
  ]) {
    const h = api(responses);
    assert.equal(
      (
        await h.actions.saveProfileAwardAction({
          profileId: profile,
          award: award(),
        })
      ).status,
      "400",
    );
    assert.ok(h.calls.every((call) => call.options.method !== "PUT"));
  }
});
test("deletion removes only its target and API rejection or HTTP failure cannot report success", async () => {
  const h = api([ok({ _id: profile }), ok([award(), award(second)]), ok({})]);
  assert.equal(
    (await h.actions.deleteProfileAwardAction(profile, first)).status,
    "7400",
  );
  assert.deepEqual(h.calls[2].body, [award(second)]);
  for (const failure of [
    { status: "7401" },
    { status: "7400", httpStatus: 500 },
    new Error("Timeout"),
  ]) {
    const f = api([ok({ _id: profile }), ok([award()]), failure]);
    assert.equal(
      (await f.actions.deleteProfileAwardAction(profile, first)).status,
      "400",
    );
    assert.equal(f.invalidations.length, 0);
  }
});
test("retried accepted additions and deletions are idempotent; a cache failure is not a failed save", async () => {
  const added = api([ok({ _id: profile }), ok([award()])]);
  assert.equal(
    (
      await added.actions.saveProfileAwardAction({
        profileId: profile,
        award: award(),
      })
    ).status,
    "7400",
  );
  assert.equal(added.calls.length, 2);
  const removed = api([ok({ _id: profile }), ok([])]);
  assert.equal(
    (await removed.actions.deleteProfileAwardAction(profile, first)).status,
    "7400",
  );
  assert.equal(removed.calls.length, 2);
  const cached = api(
    [ok({ _id: profile }), ok([award()]), ok({})],
    undefined,
    true,
  );
  assert.equal(
    (await cached.actions.deleteProfileAwardAction(profile, first)).status,
    "7400",
  );
});
test("stale edits and ambiguous legacy records never update an arbitrary award", async () => {
  const old = {
    name: "Old",
    givenBy: "Authority",
    year: 2020,
    certificateUrl: "https://example.test/old.pdf",
  };
  const h = api([ok({ _id: profile }), ok([old, old])]);
  assert.equal(
    (
      await h.actions.saveProfileAwardAction({
        profileId: profile,
        awardId: util.awardKey(old),
        award: award(),
      })
    ).status,
    "400",
  );
  assert.equal(h.calls.length, 2);
  const missing = api([ok({ _id: profile }), ok([])]);
  assert.equal(
    (
      await missing.actions.saveProfileAwardAction({
        profileId: profile,
        awardId: first,
        award: award(),
      })
    ).status,
    "400",
  );
});
test("session refresh redirects propagate through reads, saves and deletes", async () => {
  const redirect = Object.assign(new Error("Redirect"), {
    digest: "NEXT_REDIRECT;replace;/session/refresh;307;",
  });
  const h = api([], redirect);
  await assert.rejects(
    h.actions.getProfileAwardsAction(profile),
    (error) => error === redirect,
  );
  await assert.rejects(
    h.actions.saveProfileAwardAction({ profileId: profile, award: award() }),
    (error) => error === redirect,
  );
  await assert.rejects(
    h.actions.deleteProfileAwardAction(profile, first),
    (error) => error === redirect,
  );
});

function hooks() {
  const cells = [];
  let cursor = 0,
    effects = [];
  const changed = (a, b) =>
    !a ||
    a.length !== b.length ||
    a.some((value, i) => !Object.is(value, b[i]));
  return {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in cells))
          cells[i] = typeof initial === "function" ? initial() : initial;
        return [
          cells[i],
          (value) => {
            cells[i] = typeof value === "function" ? value(cells[i]) : value;
          },
        ];
      },
      useRef(initial) {
        const i = cursor++;
        return (cells[i] ||= { current: initial });
      },
      useId() {
        return `field-${cursor++}`;
      },
      useEffect(fn, deps) {
        const i = cursor++;
        if (changed(cells[i]?.deps, deps)) {
          const old = cells[i];
          cells[i] = { deps };
          effects.push(() => {
            old?.cleanup?.();
            cells[i].cleanup = fn();
          });
        }
      },
    },
    render(fn) {
      cursor = 0;
      const tree = fn(),
        pending = effects;
      effects = [];
      pending.forEach((fn) => fn());
      return tree;
    },
    unmount() {
      cells.forEach((cell) => cell?.cleanup?.());
    },
  };
}
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
const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
const ui = {
  "react/jsx-runtime": jsx,
  "@/components/ui/button": { Button: "button" },
  "@/components/ui/input": { Input: "input" },
  "@/components/ui/dialog": Object.fromEntries(
    [
      "Dialog",
      "DialogContent",
      "DialogHeader",
      "DialogTitle",
      "DialogDescription",
    ].map((name) => [name, name]),
  ),
  "@/components/ui/alert-dialog": Object.fromEntries(
    [
      "AlertDialog",
      "AlertDialogContent",
      "AlertDialogHeader",
      "AlertDialogTitle",
      "AlertDialogDescription",
      "AlertDialogFooter",
    ].map((name) => [name, name]),
  ),
};
function editor(options = {}) {
  const host = hooks(),
    calls = [],
    uploads = [],
    refreshes = [];
  let closed = 0;
  const props = {
    isOpen: true,
    isEdit: options.edit ?? true,
    data: options.edit === false ? undefined : award(),
    onClose: () => closed++,
  };
  const component = load("components/widgets/profile/ProfileAwardEditor.tsx", {
    ...ui,
    react: host.react,
    "next/navigation": {
      useParams: () => ({ userId: profile }),
      useRouter: () => ({ refresh: () => refreshes.push(true) }),
    },
    "@/components/inputs/CertificateInput": "certificate",
    "@/actions/profile-awards.action": {
      saveProfileAwardAction: async (payload) => {
        calls.push(plain(payload));
        return options.save
          ? options.save(payload)
          : { status: "400", message: "Offline" };
      },
    },
    "@/lib/utils/uploadFile": {
      uploadFileToStorage: async (file) => {
        uploads.push(file);
        return options.upload
          ? options.upload(file)
          : {
              key: "replacement.pdf",
              url: "https://example.test/replacement.pdf",
            };
      },
    },
  }).default;
  const render = () => host.render(() => component(props));
  render();
  const submit = () =>
    find(render(), (node) => node.type === "form").props.onSubmit({
      preventDefault() {},
    });
  const choose = (file) =>
    find(render(), (node) => node.type === "certificate").props.fieldChange(
      file,
    );
  const field = (position, value) => {
    const fields = [];
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (node.type === "input") fields.push(node);
      walk(node.props?.children);
    };
    walk(render());
    fields[position].props.onChange({ target: { value } });
  };
  return {
    host,
    props,
    render,
    submit,
    choose,
    field,
    calls,
    uploads,
    refreshes,
    closed: () => closed,
  };
}
test("editing text preserves its existing certificate and keeps failed form data", async () => {
  const h = editor();
  h.field(0, "New name");
  await h.submit();
  assert.equal(
    h.calls[0].award.certificateUrl,
    "https://example.test/certificate.pdf",
  );
  assert.equal(h.calls[0].award.certificateUrlKey, "certificate.pdf");
  assert.equal(h.uploads.length, 0);
  assert.equal(h.closed(), 0);
  assert.equal(h.refreshes.length, 0);
  assert.equal(
    find(h.render(), (node) => node.type === "input").props.value,
    "New name",
  );
});
test("a replacement certificate uploads once across retries and clears only after acknowledgement", async () => {
  let succeed = false;
  const h = editor({
    save: async () =>
      succeed ? ok([]) : { status: "400", message: "Offline" },
  });
  h.choose(
    new nativeFile(["pdf"], "replacement.pdf", { type: "application/pdf" }),
  );
  await h.submit();
  await h.submit();
  assert.equal(h.uploads.length, 1);
  assert.equal(h.closed(), 0);
  assert.equal(h.calls[0].award.certificateUrlKey, "replacement.pdf");
  succeed = true;
  await h.submit();
  assert.equal(h.uploads.length, 1);
  assert.equal(h.closed(), 1);
  assert.equal(h.refreshes.length, 1);
});
test("removing an existing certificate blocks saving until it is replaced", async () => {
  const h = editor();
  h.choose(null);
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.match(
    find(h.render(), (node) => node.props?.role === "alert").props.children,
    /Choose a certificate/,
  );
});
test("invalid form fields never upload a certificate or send a save", async () => {
  const h = editor();
  h.field(0, " ");
  h.choose(
    new nativeFile(["pdf"], "replacement.pdf", { type: "application/pdf" }),
  );
  await h.submit();
  assert.equal(h.uploads.length, 0);
  assert.equal(h.calls.length, 0);
});
test("duplicate submit clicks produce one save and unmounting during upload prevents a late save", async () => {
  let finish;
  const h = editor({
    save: () => new Promise((resolve) => (finish = resolve)),
  });
  const first = h.submit();
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(
    find(h.render(), (node) => node.type === "fieldset").props.disabled,
    true,
  );
  finish(ok([]));
  await first;
  let completeUpload;
  const late = editor({
    upload: () => new Promise((resolve) => (completeUpload = resolve)),
  });
  late.choose(
    new nativeFile(["pdf"], "replacement.pdf", { type: "application/pdf" }),
  );
  const pending = late.submit();
  late.host.unmount();
  completeUpload({ key: "late.pdf", url: "https://example.test/late.pdf" });
  await pending;
  assert.equal(late.calls.length, 0);
  assert.equal(late.closed(), 0);
});
test("certificate picker accepts documents, rejects a bad replacement, and removes the selected file", () => {
  const host = hooks(),
    changes = [];
  let value = null;
  const component = load("components/inputs/CertificateInput.tsx", {
    ...ui,
    react: host.react,
  }).default;
  const render = () =>
    host.render(() =>
      component({
        values: value,
        fieldChange: (file) => {
          changes.push(file);
          value = file;
        },
      }),
    );
  const choose = (file) =>
    find(render(), (node) => node.type === "input").props.onChange({
      target: { files: [file], value: "chosen" },
    });
  choose(new nativeFile(["pdf"], "test.pdf", { type: "application/pdf" }));
  assert.equal(changes.length, 1);
  choose(new nativeFile(["html"], "test.html", { type: "text/html" }));
  assert.equal(changes.length, 1);
  assert.equal(value.name, "test.pdf");
  assert.ok(find(render(), (node) => node.props?.role === "alert"));
  find(render(), (node) => node.type === "button").props.onClick();
  assert.equal(value, null);
});
test("failed deletion keeps its confirmation open and duplicate clicks send once", async () => {
  const host = hooks();
  let finish,
    calls = 0,
    closed = 0,
    refreshes = 0;
  const component = load(
    "components/widgets/profile/ProfileAwardDeleteDialog.tsx",
    {
      ...ui,
      react: host.react,
      "next/navigation": {
        useParams: () => ({ userId: profile }),
        useRouter: () => ({ refresh: () => refreshes++ }),
      },
      "@/actions/profile-awards.action": {
        deleteProfileAwardAction: async () => {
          calls++;
          return new Promise((resolve) => (finish = resolve));
        },
      },
    },
  ).default;
  const render = () =>
    host.render(() =>
      component({ isOpen: true, onClose: () => closed++, data: award() }),
    );
  const click = find(
    render(),
    (node) => node.type === "button" && node.props.children === "Delete award",
  ).props.onClick;
  const pending = click();
  click();
  assert.equal(calls, 1);
  finish({ status: "400", message: "Offline" });
  await pending;
  assert.equal(closed, 0);
  assert.equal(refreshes, 0);
  assert.ok(find(render(), (node) => node.props?.role === "alert"));
  const retry = find(
    render(),
    (node) => node.type === "button" && node.props.children === "Delete award",
  ).props.onClick();
  finish(ok([]));
  await retry;
  assert.equal(closed, 1);
  assert.equal(refreshes, 1);
});
test("failed list loads show retry instead of an empty profile and retry renders awards", async () => {
  const host = hooks();
  const component = load("components/widgets/profile/ProfileAwardsList.tsx", {
    ...ui,
    react: host.react,
    "@/components/buttons": { ProInfoAddBtn: "add" },
    "@/components/cards/ProDetailCards": { AwardCard: "card" },
    "@/actions/profile-awards.action": {
      getProfileAwardsAction: async () => ok([award()]),
    },
  }).default;
  const initialResult = { status: "400", response: [], message: "Offline" };
  const render = () =>
    host.render(() =>
      component({ profileId: profile, isOwnProfile: true, initialResult }),
    );
  render();
  assert.ok(find(render(), (node) => node.props?.role === "alert"));
  assert.equal(
    find(render(), (node) => node.type === "add"),
    undefined,
  );
  await find(render(), (node) => node.type === "button").props.onClick();
  assert.ok(find(render(), (node) => node.type === "card"));
  assert.ok(find(render(), (node) => node.type === "add"));
});
