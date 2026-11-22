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
const util = load("lib/utils/profile-editor.ts");
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
      useCallback(fn) {
        return fn;
      },
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

const ethnicId = "aaaaaaaaaaaaaaaaaaaaaaaa";
function user(talent = true) {
  return {
    _id: profile,
    userName: "qa-user",
    isTalent: talent,
    location: "Colombo",
    personalInfo: {
      firstName: "QA",
      lastName: "User",
      dob: "2000-01-01",
      gender: "male",
      languageKnown: first,
      professionalId: second,
      shortBio: "Quote",
      profileImage: "https://example.test/old-profile.jpg",
      coverImage: "https://example.test/old-cover.jpg",
    },
    morePersonalInfo: {
      _id: second,
      bio: "Biography",
      ethnicId,
      ethnic: "Example ethnicity",
      featuredPhotos: ["https://example.test/old-featured.jpg"],
      socialLinks: [
        { type: "facebook", url: "https://facebook.com/test", show: false },
      ],
    },
  };
}
function values() {
  return {
    firstName: "QA",
    lastName: "User",
    dob: "2000-01-01",
    gender: "male",
    knownLanguage: first,
    profession: second,
    quotes: "Quote",
    location: "Colombo",
    bio: "Biography",
    ethnic: ethnicId,
    socialLinks: user().morePersonalInfo.socialLinks,
    featuredPhotos: [],
  };
}
const photo = (name = "new.jpg", type = "image/jpeg") =>
  new nativeFile(["image bytes"], name, { type });
const uploader = async (file) => ({
  url: "https://example.test/" + file.name,
  key: file.name,
});
const body = () => ({
  firstName: "QA",
  lastName: "User",
  dob: "2000-01-01",
  gender: "male",
  languageKnown: first,
  professional: second,
  shortBio: "Quote",
  moreInfo: {
    bio: "Biography",
    ethnic: ethnicId,
    featuredPhotos: ["https://example.test/old-featured.jpg"],
    socialLinks: user().morePersonalInfo.socialLinks,
  },
});

test("profile image validation rejects wrong formats, extension mismatches, empty files, and oversized selections", () => {
  assert.equal(util.profileImageError(photo()), "");
  for (const file of [
    photo("x.pdf", "application/pdf"),
    photo("x.png", "image/jpeg"),
    new nativeFile([], "x.jpg", { type: "image/jpeg" }),
    new nativeFile([new Uint8Array(8 * 1024 * 1024 + 1)], "x.jpg", {
      type: "image/jpeg",
    }),
    "old URL",
  ])
    assert.ok(util.profileImageError(file));
});
test("birth dates reject calendar rollovers and verify the thirteenth birthday", () => {
  const today = new Date("2026-11-21T12:00:00Z");
  assert.equal(util.validProfileBirthDate("2013-11-21", today), true);
  assert.equal(util.validProfileBirthDate("2013-11-22", today), false);
  for (const date of [
    "2000-02-30",
    "2001-02-29",
    "2028-01-01",
    "undefined",
    "2000-13-01",
  ])
    assert.equal(util.validProfileBirthDate(date, today), false);
  assert.equal(util.validProfileBirthDate("2000-02-29", today), true);
});
test("unchanged images are omitted while ethnicity IDs, social visibility and unchanged locations are preserved", async () => {
  const result = await util.prepareProfileEditPayload(
    values(),
    user(),
    user().morePersonalInfo.featuredPhotos,
    async () => {
      throw Error("Unexpected upload");
    },
    new Map(),
    () => true,
  );
  assert.equal("profileImage" in result, false);
  assert.equal("coverImage" in result, false);
  assert.equal("location" in result, false);
  assert.equal("latitude" in result, false);
  assert.deepEqual(plain(result.moreInfo), body().moreInfo);
});
test("all selected photos upload and merge retained featured photos in order", async () => {
  const input = {
    ...values(),
    profilePhoto: photo("profile.jpg"),
    coverPhoto: photo("cover.jpg"),
    featuredPhotos: [photo("featured.jpg")],
  };
  const calls = [];
  const result = await util.prepareProfileEditPayload(
    input,
    user(),
    user().morePersonalInfo.featuredPhotos,
    async (file, prefix, id) => {
      calls.push({ prefix, id });
      return uploader(file);
    },
    new Map(),
    () => true,
  );
  assert.equal(result.profileImage, "https://example.test/profile.jpg");
  assert.equal(result.coverImage, "https://example.test/cover.jpg");
  assert.deepEqual(plain(result.moreInfo.featuredPhotos), [
    "https://example.test/old-featured.jpg",
    "https://example.test/featured.jpg",
  ]);
  assert.deepEqual(
    calls.map((c) => c.prefix),
    ["profile-pic", "cover-pic", "featured-photo"],
  );
  assert.ok(calls.every((c) => c.id === profile));
});
test("explicit photo removals and clearing ethnicity are sent without uploading", async () => {
  const result = await util.prepareProfileEditPayload(
    { ...values(), profilePhoto: null, coverPhoto: null, ethnic: "" },
    user(),
    [],
    uploader,
    new Map(),
    () => true,
    true,
  );
  assert.equal(result.profileImage, "");
  assert.equal(result.coverImage, "");
  assert.equal(result.moreInfo.ethnic, null);
  assert.deepEqual(plain(result.moreInfo.featuredPhotos), []);
});
test("all validation runs before uploading and the combined featured count cannot exceed three", async () => {
  let calls = 0;
  const upload = async () => {
    calls++;
    return uploader(photo());
  };
  for (const input of [
    { ...values(), featuredPhotos: [photo("x.pdf", "application/pdf")] },
    { ...values(), bio: " " },
    {
      ...values(),
      socialLinks: [{ type: "website", url: "javascript:alert(1)" }],
    },
  ])
    await assert.rejects(
      util.prepareProfileEditPayload(
        { ...input, profilePhoto: photo() },
        user(),
        [],
        upload,
        new Map(),
        () => true,
      ),
    );
  await assert.rejects(
    util.prepareProfileEditPayload(
      { ...values(), featuredPhotos: [photo()] },
      user(),
      Array(3).fill("https://example.test/old.jpg"),
      upload,
      new Map(),
      () => true,
    ),
  );
  assert.equal(calls, 0);
});
test("partial upload failures reuse completed uploads on retry and removed files never reach the payload", async () => {
  const input = {
      ...values(),
      profilePhoto: photo("profile.jpg"),
      featuredPhotos: [photo("featured.jpg")],
    },
    cache = new Map(),
    calls = [];
  let fail = true;
  const upload = async (file) => {
    calls.push(file.name);
    if (file.name === "featured.jpg" && fail) throw Error("Offline");
    return uploader(file);
  };
  await assert.rejects(
    util.prepareProfileEditPayload(
      input,
      user(),
      [],
      upload,
      cache,
      () => true,
    ),
  );
  fail = false;
  const result = await util.prepareProfileEditPayload(
    input,
    user(),
    [],
    upload,
    cache,
    () => true,
  );
  assert.deepEqual(calls, ["profile.jpg", "featured.jpg", "featured.jpg"]);
  assert.equal(result.moreInfo.featuredPhotos.length, 1);
  const removed = await util.prepareProfileEditPayload(
    { ...input, featuredPhotos: [] },
    user(),
    [],
    upload,
    cache,
    () => true,
  );
  assert.deepEqual(plain(removed.moreInfo.featuredPhotos), []);
});
test("closing during upload stops further uploads and cannot produce a late save payload", async () => {
  let active = true,
    finish,
    calls = 0;
  const pending = util.prepareProfileEditPayload(
    {
      ...values(),
      profilePhoto: photo("profile.jpg"),
      coverPhoto: photo("cover.jpg"),
    },
    user(),
    [],
    () => {
      calls++;
      return new Promise((resolve) => (finish = resolve));
    },
    new Map(),
    () => active,
  );
  active = false;
  finish(await uploader(photo()));
  await assert.rejects(pending);
  assert.equal(calls, 1);
});
test("basic profiles never submit talent-only fields and optional ethnicity does not block editing", async () => {
  const result = await util.prepareProfileEditPayload(
    { ...values(), bio: "", ethnic: "", featuredPhotos: [photo()] },
    user(false),
    [],
    async () => {
      throw Error("Unexpected upload");
    },
    new Map(),
    () => true,
  );
  assert.equal("moreInfo" in result, false);
  const schema = load(
    "lib/validations/profile.validation.ts",
  ).getEditProfileValidation;
  assert.equal(
    schema(true).safeParse({ ...values(), ethnic: "" }).success,
    true,
  );
  assert.equal(
    schema(false).safeParse({ ...values(), bio: "", ethnic: "" }).success,
    true,
  );
  assert.equal(schema(true).safeParse({ ...values(), bio: "" }).success, false);
});

function api(responses = [], authError, cacheError = false) {
  const calls = [],
    logs = [],
    invalidations = [];
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
          if (cacheError) throw Error("Cache error");
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
  return { actions, calls, logs, invalidations, auth: () => auth };
}
const ok = (response) => ({ status: "7400", response });
test("server verifies ownership, preserves fresh unchanged photos, and derives the more-info ID from the account", async () => {
  const payload = body();
  payload.moreInfo._id = first;
  const h = api([ok(user()), ok({})]);
  assert.equal(
    (await h.actions.userPersonalInfoEditAction(payload, profile)).status,
    "7400",
  );
  assert.equal(h.calls[1].url, "https://backend.test/user/editPersonalInfo");
  assert.equal(h.calls[1].body.moreInfo._id, second);
  assert.equal(h.calls[1].body.profileImage, user().personalInfo.profileImage);
  assert.equal(h.calls[1].body.coverImage, user().personalInfo.coverImage);
  assert.equal(h.calls[1].body.moreInfo.socialLinks[0].show, false);
  assert.equal(h.logs.length, 0);
  assert.equal(h.invalidations.length, 1);
});
test("server respects explicit removals and preserves ethnicity when the lookup was unavailable", async () => {
  const payload = { ...body(), profileImage: "", coverImage: "" };
  delete payload.moreInfo.ethnic;
  const h = api([ok(user()), ok({})]);
  await h.actions.userPersonalInfoEditAction(payload, profile);
  assert.equal(h.calls[1].body.profileImage, "");
  assert.equal(h.calls[1].body.coverImage, "");
  assert.equal(h.calls[1].body.moreInfo.ethnic, ethnicId);
});
test("invalid payloads, other owners, failed reads and profile-type changes cannot write", async () => {
  const invalid = api();
  assert.equal(
    (
      await invalid.actions.userPersonalInfoEditAction(
        { ...body(), profileImage: "javascript:alert(1)" },
        profile,
      )
    ).status,
    "400",
  );
  assert.equal(invalid.auth(), 0);
  for (const response of [
    ok({ ...user(), _id: second }),
    { status: "400" },
    new Error("Offline"),
    ok({ _id: profile }),
    ok(user(false)),
  ]) {
    const h = api([response]);
    assert.equal(
      (await h.actions.userPersonalInfoEditAction(body(), profile)).status,
      "400",
    );
    assert.equal(h.calls.length, 1);
  }
});
test("HTTP, business and network failures never report a saved profile", async () => {
  for (const response of [
    { ...ok({}), httpStatus: 500 },
    { status: "400" },
    new Error("Offline"),
  ]) {
    const h = api([ok(user()), response]);
    assert.equal(
      (await h.actions.userPersonalInfoEditAction(body(), profile)).status,
      "400",
    );
    assert.equal(h.invalidations.length, 0);
  }
});
test("cache failures do not undo acknowledged saves and auth redirects propagate", async () => {
  const h = api([ok(user()), ok({})], undefined, true);
  assert.equal(
    (await h.actions.userPersonalInfoEditAction(body(), profile)).status,
    "7400",
  );
  const redirect = Object.assign(new Error("Redirect"), {
    digest: "NEXT_REDIRECT;replace;/session/refresh;307;",
  });
  await assert.rejects(
    api([], redirect).actions.userPersonalInfoEditAction(body(), profile),
    (e) => e === redirect,
  );
});

function editor(options = {}) {
  const host = hooks(),
    calls = [],
    uploads = [],
    navigation = [],
    users = [];
  let fields,
    fail = options.fail ?? true;
  const form = {
    formState: { dirtyFields: {}, isSubmitting: false, errors: {} },
    getValues: (key) => fields[key],
    setError() {},
    handleSubmit: (onSubmit) => () => onSubmit(fields),
  };
  const component = load(
    "components/multiStepForms/EditProfileForm.tsx",
    {
      ...ui,
      react: host.react,
      "@/components/forms": {
        EditPersonalInfoForm: "personal-fields",
        EditProInfoForm: "professional-fields",
      },
      "@/components/ui/form": { Form: "Form" },
      "react-hook-form": {
        useForm: ({ defaultValues }) => {
          fields ||= defaultValues;
          return form;
        },
      },
      "@hookform/resolvers/zod": { zodResolver: () => () => {} },
      "next/navigation": {
        useRouter: () => ({
          push: (path) => navigation.push(path),
          refresh: () => navigation.push("refresh"),
        }),
      },
      sonner: { toast: { success() {} } },
      "@/context/AuthProvider": {
        AUTH_USER_CACHE_KEY: "user-cache",
        useUserContext: () => ({
          user: { username: "qa-user" },
          setUser: (update) =>
            users.push(update({ currentUserId: profile, imageUrl: "old" })),
        }),
      },
      "@/lib/utils/uploadFile": {
        uploadFileToStorage: async (file) => {
          uploads.push(file.name);
          if (options.upload) return options.upload(file);
          return uploader(file);
        },
      },
      "@/actions/user.action": {
        userPersonalInfoEditAction: async (payload, id) => {
          calls.push({ payload: plain(payload), id });
          if (options.save) return options.save(payload);
          return fail ? { status: "400", message: "Offline" } : ok({});
        },
      },
    },
    { sessionStorage: { removeItem() {} } },
  ).default;
  const props = {
    userData: user(),
    langData: { response: [] },
    professionData: { response: [] },
  };
  const render = () => host.render(() => component(props));
  render();
  const submit = () =>
    find(render(), (n) => n.type === "form").props.onSubmit();
  return {
    host,
    props,
    render,
    submit,
    calls,
    uploads,
    navigation,
    users,
    fields: () => fields,
    accept: () => {
      fail = false;
    },
  };
}
function socialEditor(h) {
  const host = hooks();
  const section = load("components/forms/EditProInfoForm.tsx", {
    ...ui,
    "../inputs": {
      MyPhotosInput: "photos",
      SocialMediaInput: "social",
      TextArea: "textarea",
    },
    "../inputs/ProfileEthnicityInput": "ethnicity",
    "../ui/form": { FormField: "field", FormMessage: "message" },
  }).default;
  const component = load("components/inputs/SocialMediaInput.tsx", {
    ...ui,
    react: host.react,
    "@/constants": {
      SOCIAL_MEDIA_OPTIONS: [
        { type: "facebook", default: true, icon: "icon" },
        { type: "portfolio", default: false, icon: "icon" },
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
  const render = () => {
    const props = find(
      h.render(),
      (node) => node.type === "professional-fields",
    ).props;
    const tree = section(props);
    const field = find(
      tree,
      (node) => node.type === "field" && node.props.name === "socialLinks",
    );
    const input = field.props.render({
      field: {
        onChange: (value) => {
          h.fields().socialLinks = value;
        },
      },
    });
    return host.render(() => component(input.props));
  };
  render();
  return {
    render,
    choose(type) {
      find(render(), (node) => node.type === "Select").props.onValueChange(
        type,
      );
    },
    type(url) {
      find(
        render(),
        (node) =>
          node.type === "input" && node.props.placeholder === "Add related URL",
      ).props.onChange({ target: { value: url } });
    },
    click(label) {
      find(
        render(),
        (node) => node.type === "button" && node.props.children === label,
      ).props.onClick();
    },
  };
}
test("unfinished social link blocks uploads and saving immediately and retains the draft", async () => {
  const h = editor({ fail: false }),
    social = socialEditor(h);
  h.fields().profilePhoto = photo("profile.jpg");
  h.fields().firstName = "Changed";
  social.choose("portfolio");
  social.type("https://example.test/work");
  // Submit before rendering the child's effect for the final input event.
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.equal(h.uploads.length, 0);
  assert.equal(h.navigation.length, 0);
  assert.equal(h.fields().firstName, "Changed");
  assert.equal(h.fields().profilePhoto.name, "profile.jpg");
  assert.match(
    find(h.render(), (node) => node.props?.role === "alert").props.children,
    /Click OK.*Clear/,
  );
  assert.equal(
    find(social.render(), (node) => node.type === "Select").props.value,
    "portfolio",
  );
  assert.equal(
    find(
      social.render(),
      (node) =>
        node.type === "input" && node.props.placeholder === "Add related URL",
    ).props.value,
    "https://example.test/work",
  );
});
test("partial social links remain protected when OK cannot add them", async () => {
  for (const part of ["type", "url"]) {
    const h = editor({ fail: false }),
      social = socialEditor(h);
    if (part === "type") social.choose("portfolio");
    else social.type("https://example.test/work");
    social.click("OK");
    await h.submit();
    assert.equal(h.calls.length, 0);
    assert.equal(h.navigation.length, 0);
    assert.match(
      find(h.render(), (node) => node.props?.role === "alert").props.children,
      /unfinished social link/,
    );
  }
});
test("batched type and URL input retain both values before the next render", async () => {
  const h = editor({ fail: false });
  const social = socialEditor(h);
  const tree = social.render();
  find(tree, (node) => node.type === "Select").props.onValueChange("portfolio");
  find(
    tree,
    (node) =>
      node.type === "input" && node.props.placeholder === "Add related URL",
  ).props.onChange({ target: { value: "https://example.test/batched" } });
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.equal(
    find(social.render(), (node) => node.type === "Select").props.value,
    "portfolio",
  );
  social.click("OK");
  await h.submit();
  assert.equal(h.calls[0].payload.moreInfo.socialLinks[1].type, "portfolio");
  assert.equal(
    h.calls[0].payload.moreInfo.socialLinks[1].url,
    "https://example.test/batched",
  );
});
test("adding the social link clears its warning and saves the link with existing visibility preserved", async () => {
  const h = editor({ fail: false }),
    social = socialEditor(h);
  social.choose("portfolio");
  social.type("https://example.test/work");
  await h.submit();
  social.click("OK");
  assert.equal(
    find(h.render(), (node) => node.props?.role === "alert"),
    undefined,
  );
  await h.submit();
  assert.equal(h.calls.length, 1);
  const links = h.calls[0].payload.moreInfo.socialLinks;
  assert.equal(links[0].show, false);
  assert.equal(links[1].type, "portfolio");
  assert.equal(links[1].url, "https://example.test/work");
  assert.ok(h.navigation.includes("/profile/qa-user/" + profile));
});
test("clearing an unfinished link permits saving without adding it", async () => {
  const h = editor({ fail: false }),
    social = socialEditor(h),
    before = plain(h.fields().socialLinks);
  social.choose("portfolio");
  social.type("https://example.test/work");
  await h.submit();
  social.click("Clear");
  assert.equal(
    find(h.render(), (node) => node.props?.role === "alert"),
    undefined,
  );
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.calls[0].payload.moreInfo.socialLinks, before);
});
test("editing an existing social link saves directly without an extra OK step", async () => {
  const h = editor({ fail: false }),
    social = socialEditor(h);
  find(
    social.render(),
    (node) =>
      node.props?.type === "facebook" &&
      typeof node.props.onChange === "function",
  ).props.onChange("https://facebook.com/updated");
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(
    h.calls[0].payload.moreInfo.socialLinks[0].url,
    "https://facebook.com/updated",
  );
  assert.equal(h.calls[0].payload.moreInfo.socialLinks[0].show, false);
});
test("clearing a draft does not hide an unrelated backend save error", async () => {
  const h = editor(),
    social = socialEditor(h);
  await h.submit();
  assert.equal(
    find(h.render(), (node) => node.props?.role === "alert").props.children,
    "Offline",
  );
  social.choose("portfolio");
  social.click("Clear");
  assert.equal(
    find(h.render(), (node) => node.props?.role === "alert").props.children,
    "Offline",
  );
});
test("regular profile saving remains available without talent social-link controls", async () => {
  const h = editor({ fail: false });
  h.props.userData.isTalent = false;
  assert.equal(
    find(h.render(), (node) => node.type === "professional-fields"),
    undefined,
  );
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].payload.moreInfo, undefined);
});

test("editor retains text and selected files after rejection and reuses uploads before navigating on success", async () => {
  const h = editor();
  h.fields().firstName = "Changed";
  h.fields().profilePhoto = photo("profile.jpg");
  h.fields().featuredPhotos = [photo("featured.jpg")];
  await h.submit();
  assert.equal(h.fields().firstName, "Changed");
  assert.equal(h.fields().featuredPhotos.length, 1);
  assert.equal(h.navigation.length, 0);
  assert.equal(h.users.length, 0);
  assert.ok(find(h.render(), (n) => n.props?.role === "alert"));
  h.accept();
  await h.submit();
  assert.deepEqual(h.uploads, ["profile.jpg", "featured.jpg"]);
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[0].id, profile);
  assert.ok(h.navigation.includes("/profile/qa-user/" + profile));
  assert.equal(h.users[0].firstName, "Changed");
  assert.equal(h.users[0].imageUrl, "https://example.test/profile.jpg");
});
test("duplicate submissions issue one request and navigation is blocked while saving", async () => {
  let finish;
  const h = editor({
    save: () => new Promise((resolve) => (finish = resolve)),
  });
  const pending = h.submit();
  h.submit();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.calls.length, 1);
  assert.equal(
    find(h.render(), (n) => n.type === "fieldset").props.disabled,
    true,
  );
  assert.equal(h.navigation.length, 0);
  finish(ok({}));
  await pending;
  assert.equal(h.calls.length, 1);
});
test("upload failure cannot call the profile API and closing during upload prevents a late mutation", async () => {
  const failed = editor({
    upload: async () => {
      throw Error("Upload failed");
    },
  });
  failed.fields().profilePhoto = photo();
  await failed.submit();
  assert.equal(failed.calls.length, 0);
  assert.ok(find(failed.render(), (n) => n.props?.role === "alert"));
  let finish;
  const closing = editor({
    upload: () => new Promise((resolve) => (finish = resolve)),
  });
  closing.fields().profilePhoto = photo();
  const pending = closing.submit();
  closing.host.unmount();
  finish(await uploader(photo()));
  await pending;
  assert.equal(closing.calls.length, 0);
  assert.equal(closing.navigation.length, 0);
});
for (const kind of ["ProfilePhoto", "CoverPhoto"])
  test(`${kind} sends explicit removal and rejects invalid replacements without changing the saved image`, () => {
    const host = hooks(),
      changes = [];
    const component = load(
      `components/inputs/${kind}.tsx`,
      {
        ...ui,
        react: host.react,
        "next/image": "image",
        "../ui/dialog": ui["@/components/ui/dialog"],
        "../modals": {
          CropImgModal: "crop",
          PhotoActionModal: "photo-actions",
          ErrorAlert: "error-alert",
        },
        "@/public/assets/svgs": { CameraIcon: "camera" },
      },
      { URL: { createObjectURL: () => "blob:preview", revokeObjectURL() {} } },
    ).default;
    const render = () =>
      host.render(() =>
        component({
          mediaUrl: "https://example.test/old.jpg",
          fieldChange: (value) => changes.push(value),
        }),
      );
    render();
    find(render(), (n) => n.type === "input").props.onChange({
      target: { files: [photo("bad.pdf", "application/pdf")], value: "" },
    });
    assert.equal(changes.length, 0);
    assert.equal(
      find(render(), (n) => n.type === "error-alert").props.isOpen,
      true,
    );
    find(render(), (n) => n.type === "photo-actions").props.onDelete();
    assert.equal(changes.at(-1), null);
    const selected = photo();
    find(render(), (n) => n.type === "crop").props.handleCropComplete({
      croppedData: selected,
      croppedPrev: "blob:new",
    });
    assert.equal(changes.at(-1), selected);
  });
test("featured picker validates immediately, enforces the combined limit, and clears its file input", () => {
  const host = hooks(),
    changes = [];
  const component = load("components/inputs/MyPhotosInput.tsx", {
    ...ui,
    react: host.react,
    "next/image": "image",
  }).default;
  const props = {
    prevURLs: ["https://example.test/old.jpg"],
    values: [],
    setPrevURLs() {},
    fieldChange: (files) => changes.push(files),
  };
  const render = () => host.render(() => component(props));
  render();
  const choose = (files) => {
    const target = { files, value: "selected" };
    find(render(), (n) => n.type === "input").props.onChange({ target });
    assert.equal(target.value, "");
  };
  choose([photo("bad.pdf", "application/pdf")]);
  assert.equal(changes.length, 0);
  assert.ok(find(render(), (n) => n.props?.role === "alert"));
  choose([photo(), photo("b.jpg"), photo("c.jpg")]);
  assert.equal(changes.length, 0);
  choose([photo()]);
  assert.equal(changes[0].length, 1);
  assert.equal(
    find(render(), (n) => n.props?.role === "alert"),
    undefined,
  );
});

function cropper(crop) {
  const host = hooks(),
    completed = [],
    revoked = [];
  const component = load(
    "components/modals/CropImg.tsx",
    {
      ...ui,
      react: { ...host.react, useCallback: (fn) => fn },
      "@/components/ui/dialog": {
        DialogContent: "content",
        DialogHeader: "header",
        DialogTitle: "title",
        DialogClose: "close",
      },
      "../ui/button": { Button: "button" },
      "@/components/ui/slider": { Slider: "slider" },
      "@/constants": { RatioOptions: [] },
      "react-easy-crop": "cropper",
      "@/lib/utils/getCroppedImg": crop,
    },
    { URL: { revokeObjectURL: (url) => revoked.push(url) } },
  ).default;
  const render = () =>
    host.render(() =>
      component({
        modalFor: "profile",
        media: { preview: "blob:input" },
        handleCropComplete: (img) => completed.push(img),
      }),
    );
  render();
  const select = () =>
    find(render(), (n) => n.type === "cropper").props.onCropComplete(null, {
      x: 0,
      y: 0,
      width: 20,
      height: 20,
    });
  const done = () => find(render(), (n) => n.type === "button").props.onClick();
  return { host, render, select, done, completed, revoked };
}
test("crop slider uses a numeric zoom and duplicate Done clicks crop only once", async () => {
  let calls = 0,
    finish;
  const h = cropper(() => {
    calls++;
    return new Promise((resolve) => (finish = resolve));
  });
  assert.equal(
    find(h.render(), (n) => n.type === "button").props.disabled,
    true,
  );
  h.select();
  find(h.render(), (n) => n.type === "slider").props.onValueChange([3]);
  assert.equal(find(h.render(), (n) => n.type === "cropper").props.zoom, 3);
  const pending = h.done();
  h.done();
  assert.equal(calls, 1);
  assert.equal(
    find(h.render(), (n) => n.type === "close").props.disabled,
    true,
  );
  finish({ croppedData: photo(), croppedPrev: "blob:result" });
  await pending;
  assert.equal(h.completed.length, 1);
});
test("failed crops show an error and unmounting during a crop discards its result", async () => {
  const failed = cropper(async () => {
    throw Error("Canvas failure");
  });
  failed.select();
  await failed.done();
  assert.ok(find(failed.render(), (n) => n.props?.role === "alert"));
  assert.equal(failed.completed.length, 0);
  let finish;
  const h = cropper(() => new Promise((resolve) => (finish = resolve)));
  h.select();
  const pending = h.done();
  h.host.unmount();
  finish({ croppedData: photo(), croppedPrev: "blob:result" });
  await pending;
  assert.equal(h.completed.length, 0);
  assert.deepEqual(h.revoked, ["blob:result"]);
});
