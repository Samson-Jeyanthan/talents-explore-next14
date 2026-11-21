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
const util = load("lib/utils/talent-registration.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
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

const mainId = "111111111111111111111111",
  subId = "222222222222222222222222",
  skillId = "333333333333333333333333";
const photo = () =>
  new nativeFile(["image"], "photo.jpg", { type: "image/jpeg" });
const certificate = () =>
  new nativeFile(["document"], "certificate.pdf", { type: "application/pdf" });
const values = () => ({
  bio: "Talent biography",
  ethnic: first,
  featuredPhotos: [photo()],
  socialLinks: [
    { type: "website", url: "https://example.test/work", show: false },
  ],
  skillSets: [
    {
      mainCategory: "Arts",
      mainCategoryId: mainId,
      subCategory: "Film",
      subCategoryId: subId,
      skillsHave: [{ skillId, skill: "Editing", level: "advanced" }],
      description: "Editing films",
      hashTags: ["#film"],
    },
  ],
  languageKnown: [
    { languageId: first, language: "English", level: "advanced" },
  ],
  education: [
    { course: "Film", institution: "Institute", from: "2020", to: "present" },
  ],
  awardsOrCertificate: [
    {
      name: "Award",
      givenBy: "Authority",
      year: "2025",
      certificate: certificate(),
    },
  ],
  completeForm: true,
});
const upload = async (file) => ({
  url: "https://example.test/" + file.name,
  key: file.name,
});
test("registration saves every field and uploads featured photos and certificates using the account ID", async () => {
  const input = values(),
    calls = [];
  const result = await util.prepareTalentRegistration(
    input,
    profile,
    async (file, prefix, id) => {
      calls.push({ prefix, id });
      return upload(file);
    },
    new Map(),
    () => true,
  );
  assert.deepEqual(plain(result.moreInfo.featuredPhotos), [
    "https://example.test/photo.jpg",
  ]);
  assert.deepEqual(plain(result.moreInfo.socialLinks), input.socialLinks);
  assert.equal(result.moreInfo.ethnic, first);
  assert.equal(result.skillSets[0].description, "Editing films");
  assert.deepEqual(plain(result.skillSets[0].hashTags), ["#film"]);
  assert.deepEqual(plain(result.languageKnown), [
    { languageId: first, level: "advanced" },
  ]);
  assert.equal(result.education[0].from, 2020);
  assert.equal(result.education[0].to, null);
  assert.equal(input.education[0].to, "present");
  assert.equal(
    result.awardsOrCertificate[0].certificateUrl,
    "https://example.test/certificate.pdf",
  );
  assert.equal(
    result.awardsOrCertificate[0].certificateUrlKey,
    "certificate.pdf",
  );
  assert.deepEqual(calls, [
    { prefix: "featured-photo", id: profile },
    { prefix: "award-certificate", id: profile },
  ]);
});
test("numeric education dates remain numbers and optional awards and ethnicity can be omitted", async () => {
  const input = {
    ...values(),
    ethnic: "",
    featuredPhotos: [],
    awardsOrCertificate: [],
    education: [
      { course: "Film", institution: "Institute", from: "2010", to: "2015" },
    ],
  };
  const result = await util.prepareTalentRegistration(
    input,
    profile,
    upload,
    new Map(),
    () => true,
  );
  assert.equal(result.moreInfo.ethnic, null);
  assert.equal(result.education[0].to, 2015);
  assert.deepEqual(plain(result.awardsOrCertificate), []);
});
test("invalid and incomplete data, duplicate languages, absent skills, and missing consent never upload", async () => {
  let calls = 0;
  const input = values();
  for (const change of [
    { bio: " " },
    { completeForm: false },
    { skillSets: [] },
    { languageKnown: [] },
    { languageKnown: [...input.languageKnown, ...input.languageKnown] },
    {
      education: [
        { course: "Film", institution: "Institute", from: "", to: "" },
      ],
    },
    {
      education: [
        { course: "Film", institution: "Institute", from: "2020", to: "2019" },
      ],
    },
    { featuredPhotos: Array(4).fill(photo()) },
    { socialLinks: [{ type: "website", url: "javascript:alert(1)" }] },
    { awardsOrCertificate: [{ name: "A", givenBy: "B", year: "" }] },
  ]) {
    await assert.rejects(
      util.prepareTalentRegistration(
        { ...input, ...change },
        profile,
        async (file) => {
          calls++;
          return upload(file);
        },
        new Map(),
        () => true,
      ),
    );
  }
  assert.equal(calls, 0);
});
test("partial upload and API retries reuse completed files without changing the form values", async () => {
  const input = values(),
    cache = new Map(),
    calls = [];
  let fail = true;
  const uploader = async (file) => {
    calls.push(file.name);
    if (file.name === "certificate.pdf" && fail) throw Error("Offline");
    return upload(file);
  };
  await assert.rejects(
    util.prepareTalentRegistration(input, profile, uploader, cache, () => true),
  );
  fail = false;
  const result = await util.prepareTalentRegistration(
    input,
    profile,
    uploader,
    cache,
    () => true,
  );
  await util.prepareTalentRegistration(
    input,
    profile,
    uploader,
    cache,
    () => true,
  );
  assert.deepEqual(calls, ["photo.jpg", "certificate.pdf", "certificate.pdf"]);
  assert.equal(input.featuredPhotos[0].name, "photo.jpg");
  assert.equal(result.awardsOrCertificate.length, 1);
});
test("unmounting during upload prevents later uploads and submission", async () => {
  let finish,
    active = true,
    calls = 0;
  const pending = util.prepareTalentRegistration(
    values(),
    profile,
    () => {
      calls++;
      return new Promise((resolve) => (finish = resolve));
    },
    new Map(),
    () => active,
  );
  active = false;
  finish(await upload(photo()));
  await assert.rejects(pending);
  assert.equal(calls, 1);
});
test("an award without a document remains optional and an existing certificate URL is preserved", async () => {
  const input = values();
  input.featuredPhotos = [];
  input.awardsOrCertificate[0].certificate = undefined;
  let result = await util.prepareTalentRegistration(
    input,
    profile,
    upload,
    new Map(),
    () => true,
  );
  assert.equal("certificateUrl" in result.awardsOrCertificate[0], false);
  input.awardsOrCertificate[0].certificate =
    "https://example.test/existing.pdf";
  result = await util.prepareTalentRegistration(
    input,
    profile,
    upload,
    new Map(),
    () => true,
  );
  assert.equal(
    result.awardsOrCertificate[0].certificateUrl,
    "https://example.test/existing.pdf",
  );
});
function api(responses = [], authError, cacheError = false) {
  const calls = [],
    invalidations = [],
    logs = [];
  let auth = 0;
  const actions = load(
    "actions/user.action.tsx",
    {
      "@/components/cards/SkillCard": () => null,
      "@/components/cards": {},
      "./auth.action": {},
      "./session.action": {},
      "@/lib/session": {
        getAuthHeaders: async () => {
          auth++;
          if (authError) throw authError;
          return { Authorization: "private-test-token" };
        },
      },
      "next/cache": {
        revalidatePath: (...args) => {
          invalidations.push(args);
          if (cacheError) throw Error("Cache failed");
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
        const next = responses.shift();
        if (next instanceof Error) throw next;
        return {
          ok: next?.httpStatus ? next.httpStatus < 400 : true,
          json: async () => next,
        };
      },
    },
  );
  return { actions, calls, invalidations, logs, auth: () => auth };
}
const ok = (response) => ({ status: "7400", response });
const payload = () =>
  util.prepareTalentRegistration(
    values(),
    profile,
    upload,
    new Map(),
    () => true,
  );
test("server verifies account ownership and consent and uses the mobile professional-info endpoint", async () => {
  const h = api([ok({ _id: profile, isTalent: false }), ok({})]);
  const result = await h.actions.editUserProfessionalInfoAction(
    await payload(),
    profile,
    true,
  );
  assert.equal(result.status, "7400");
  assert.equal(result.success, true);
  assert.equal(h.calls[1].url, "https://backend.test/user/professionalInfo");
  assert.equal(h.calls[1].options.method, "PUT");
  assert.equal(h.calls[1].body.education[0].to, null);
  assert.equal(h.calls[1].body.moreInfo.socialLinks[0].show, false);
  assert.equal(h.invalidations.length, 1);
  assert.equal(h.logs.length, 0);
});
test("invalid data and unaccepted terms cannot reach authentication", async () => {
  const h = api();
  assert.equal(
    (
      await h.actions.editUserProfessionalInfoAction(
        await payload(),
        profile,
        false,
      )
    ).success,
    false,
  );
  assert.equal(
    (await h.actions.editUserProfessionalInfoAction({}, profile, true)).success,
    false,
  );
  assert.equal(
    (
      await h.actions.editUserProfessionalInfoAction(
        await payload(),
        profile,
        "false",
      )
    ).success,
    false,
  );
  assert.equal(h.auth(), 0);
});
test("other users, invalid identities, failed reads and existing talent profiles cannot be overwritten", async () => {
  for (const identity of [
    ok({ _id: second, isTalent: false }),
    ok({ _id: profile, isTalent: true }),
    ok({ _id: profile }),
    { status: "400" },
    new Error("Offline"),
  ]) {
    const h = api([identity]);
    assert.equal(
      (
        await h.actions.editUserProfessionalInfoAction(
          await payload(),
          profile,
          true,
        )
      ).success,
      false,
    );
    assert.equal(h.calls.length, 1);
  }
});
test("HTTP and business failures do not report success, while acknowledged saves survive cache failures", async () => {
  for (const response of [
    { status: "400" },
    { ...ok({}), httpStatus: 500 },
    new Error("Offline"),
  ]) {
    const h = api([ok({ _id: profile, isTalent: false }), response]);
    assert.equal(
      (
        await h.actions.editUserProfessionalInfoAction(
          await payload(),
          profile,
          true,
        )
      ).success,
      false,
    );
    assert.equal(h.invalidations.length, 0);
  }
  const cached = api(
    [ok({ _id: profile, isTalent: false }), ok({})],
    undefined,
    true,
  );
  assert.equal(
    (
      await cached.actions.editUserProfessionalInfoAction(
        await payload(),
        profile,
        true,
      )
    ).success,
    true,
  );
});
test("session-refresh redirects propagate through talent registration", async () => {
  const redirect = Object.assign(new Error("Redirect"), {
    digest: "NEXT_REDIRECT;replace;/session/refresh;307;",
  });
  await assert.rejects(
    api([], redirect).actions.editUserProfessionalInfoAction(
      await payload(),
      profile,
      true,
    ),
    (error) => error === redirect,
  );
});

function wizard(options = {}) {
  const host = hooks(),
    calls = [],
    uploads = [],
    navigation = [],
    users = [];
  let entries = values(),
    accepted = false;
  const form = {
    getValues: (name) => (name ? entries[name] : entries),
    setValue: (name, value) => (entries[name] = value),
    formState: { isSubmitting: false, errors: {} },
    getFieldState: () => ({}),
    trigger: options.trigger || (async () => true),
    handleSubmit: (onSubmit) => () => onSubmit(entries),
  };
  const component = load(
    "components/multiStepForms/ParentTalentRegisterForm.tsx",
    {
      ...ui,
      react: { ...host.react, useCallback: (fn) => fn },
      "@/components/forms": {
        EditProInfoForm: "info",
        SkillsForm: "skills",
        LangEducationForm: "education",
        AwardsForm: "awards",
        CompleteForm: "complete",
      },
      "@/components/modals": { TransparentLoader: "loader" },
      "../ui/form": { Form: "Form" },
      "../widgets/navigation": { TalentRegisterStatusBar: "status" },
      "../widgets": { Footer: "footer" },
      "@/constants": {
        TALENT_REG_FORM_DETAILS: [
          "Info",
          "Skills",
          "Education",
          "Awards",
          "Complete",
        ].map((title) => ({ title, description: "" })),
      },
      "@/public/assets/svgs": {
        AtomicIcon: "icon",
        AwardsIcon: "icon",
        GraduationIcon: "icon",
        UserIcon: "icon",
      },
      "@/context/AuthProvider": {
        AUTH_USER_CACHE_KEY: "user-cache",
        INITIAL_USER: {},
        useUserContext: () => ({
          user: { currentUserId: profile, username: "qa-user" },
          setUser: (update) =>
            users.push(update({ currentUserId: profile, isTalent: false })),
        }),
      },
      "@/actions/auth.action": { logoutAction: async () => {} },
      "@/lib/functions/auth.functions": { handleClearStorage: async () => {} },
      "next/navigation": {
        useRouter: () => ({
          push: (path) => navigation.push(path),
          refresh: () => navigation.push("refresh"),
        }),
      },
      sonner: { toast: { success() {} } },
      "react-hook-form": { useForm: () => form },
      "@hookform/resolvers/zod": { zodResolver: () => () => {} },
      "@/lib/utils/uploadFile": {
        uploadFileToStorage: async (file) => {
          uploads.push(file.name);
          if (options.upload) return options.upload(file);
          return upload(file);
        },
      },
      "@/actions/user.action": {
        editUserProfessionalInfoAction: async (payload, id, agreed) => {
          calls.push({ payload: plain(payload), id, agreed });
          if (options.save) return options.save(payload);
          return accepted
            ? { status: "7400", success: true }
            : { status: "400", success: false, message: "Offline" };
        },
      },
    },
    { sessionStorage: { removeItem() {} } },
  ).default;
  const render = () =>
    host.render(() => component({ langData: { response: [] } }));
  render();
  const click = (text) =>
    find(
      render(),
      (n) => n.type === "button" && n.props.children === text,
    ).props.onClick();
  const panel = () =>
    find(render(), (n) => n.props?.hidden === false).props.children.type;
  return {
    host,
    render,
    click,
    panel,
    calls,
    uploads,
    navigation,
    users,
    entries,
    accept: () => (accepted = true),
  };
}
test("wizard mounts every step and unfinished entries block Next without losing the draft", async () => {
  const h = wizard();
  await h.click("Next");
  assert.equal(h.panel(), "skills");
  find(h.render(), (n) => n.type === "skills").props.onDraftChange(true);
  await h.click("Next");
  assert.equal(h.panel(), "skills");
  assert.ok(find(h.render(), (n) => n.props?.role === "alert"));
  h.click("Back");
  assert.equal(h.panel(), "info");
  await h.click("Next");
  assert.equal(h.panel(), "skills");
  assert.ok(find(h.render(), (n) => n.type === "awards"));
  assert.ok(find(h.render(), (n) => n.type === "education"));
});
test("double Next validates once and advances one step", async () => {
  let calls = 0,
    finish;
  const h = wizard({
    trigger: () => {
      calls++;
      return new Promise((resolve) => (finish = resolve));
    },
  });
  const pending = h.click("Next");
  h.click("Next");
  assert.equal(calls, 1);
  finish(true);
  await pending;
  assert.equal(h.panel(), "skills");
});
test("failed registration retains all fields and uploads are reused before success updates context", async () => {
  const h = wizard();
  for (let i = 0; i < 4; i++) await h.click("Next");
  await h.click("Create Account");
  assert.equal(h.calls.length, 1);
  assert.equal(h.navigation.length, 0);
  assert.equal(h.users.length, 0);
  assert.equal(h.entries.education[0].to, "present");
  assert.equal(h.entries.featuredPhotos.length, 1);
  assert.ok(find(h.render(), (n) => n.props?.role === "alert"));
  h.accept();
  await h.click("Create Account");
  assert.deepEqual(h.uploads, ["photo.jpg", "certificate.pdf"]);
  assert.equal(h.users[0].isTalent, true);
  assert.ok(h.navigation.includes("/profile/qa-user/" + profile));
});
test("duplicate submission, upload failure and unmounting cannot cause extra registration writes", async () => {
  let finish;
  const h = wizard({
    save: () => new Promise((resolve) => (finish = resolve)),
  });
  for (let i = 0; i < 4; i++) await h.click("Next");
  const pending = h.click("Create Account");
  h.click("Create Account");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.calls.length, 1);
  finish({ status: "7400" });
  await pending;
  const failed = wizard({
    upload: async () => {
      throw Error("Upload failed");
    },
  });
  for (let i = 0; i < 4; i++) await failed.click("Next");
  await failed.click("Create Account");
  assert.equal(failed.calls.length, 0);
  let uploaded;
  const closed = wizard({
    upload: () => new Promise((resolve) => (uploaded = resolve)),
  });
  for (let i = 0; i < 4; i++) await closed.click("Next");
  const closing = closed.click("Create Account");
  closed.host.unmount();
  uploaded(await upload(photo()));
  await closing;
  assert.equal(closed.calls.length, 0);
  assert.equal(closed.navigation.length, 0);
});
test("consent is enforced before upload even when final submission is invoked directly", async () => {
  const h = wizard();
  for (let i = 0; i < 4; i++) await h.click("Next");
  h.entries.completeForm = false;
  await h.click("Create Account");
  assert.equal(h.calls.length, 0);
  assert.equal(h.uploads.length, 0);
});

test("unfinished social links report a draft until added or cleared, preserving existing link visibility", () => {
  const host = hooks(),
    drafts = [],
    updates = [];
  const component = load("components/inputs/SocialMediaInput.tsx", {
    ...ui,
    react: host.react,
    "@/constants": {
      SOCIAL_MEDIA_OPTIONS: [
        { type: "facebook", default: true, icon: "icon" },
        { type: "website", default: false, icon: "icon" },
      ],
    },
    "@/public/assets/svgs": { LinkIcon: "icon" },
    "../ui/input": { Input: "input" },
    "../ui/select": Object.fromEntries(
      [
        "Select",
        "SelectContent",
        "SelectItem",
        "SelectTrigger",
        "SelectValue",
      ].map((name) => [name, name]),
    ),
  }).default;
  const props = {
    values: [{ type: "facebook", url: "https://facebook.com/qa", show: false }],
    fieldChange: (rows) => updates.push(rows),
    onDraftChange: (value) => drafts.push(value),
  };
  const render = () => host.render(() => component(props));
  render();
  find(render(), (n) => n.type === "Select").props.onValueChange("website");
  find(
    render(),
    (n) => n.type === "input" && n.props.placeholder === "Add related URL",
  ).props.onChange({ target: { value: "https://example.test/work" } });
  render();
  assert.equal(drafts.at(-1), true);
  find(
    render(),
    (n) => n.type === "button" && n.props.children === "OK",
  ).props.onClick();
  render();
  assert.equal(drafts.at(-1), false);
  assert.equal(updates[0][0].show, false);
  assert.equal(updates[0][1].url, "https://example.test/work");
  find(render(), (n) => n.type === "Select").props.onValueChange("website");
  render();
  find(
    render(),
    (n) => n.type === "button" && n.props.children === "Clear",
  ).props.onClick();
  render();
  assert.equal(drafts.at(-1), false);
});
