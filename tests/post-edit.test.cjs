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
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module: testModule,
      exports: testModule.exports,
      require: (name) =>
        modules[name] || (name === "zod" ? require("zod") : {}),
      Error,
      AbortSignal,
      File,
      URL,
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test/api" } },
      console: { error() {}, log() {} },
      ...extra,
    },
  );
  return testModule.exports;
}

const forms = load("lib/validations/post.validation.ts");
const schemas = load("lib/validations/postUpdate.validation.ts", {
  "./post.validation": forms,
});
const editing = load("lib/utils/postEditing.ts");
const viewer = "111111111111111111111111";
const postId = "222222222222222222222222";
const asset = {
  mediaType: "video",
  url: "https://storage.test/video.mp4",
  urlKey: "video-key",
  thumbnailUrl: "https://storage.test/preview.jpg",
  thumbnailUrlkey: "preview-key",
};
const original = {
  _id: postId,
  author: { _id: viewer },
  type: "POST",
  media: [asset],
  about: {
    title: "Hi",
    description: "",
    mainCategoryId: viewer,
    subCategoryId: viewer,
    primaryLanguageId: viewer,
    secondaryLanguageId: null,
    skillId: null,
    level: null,
    ownRating: 3,
    keywords: ["#video", "#test"],
    country: "sri lanka",
    state: "Trincomalee",
    peopleTag: [{ _id: viewer, userName: "creator", profileImage: null }],
    productionName: "Test production",
    productionDate: "2026-01-02T00:00:00.000Z",
  },
  isCreditWork: true,
  credit: [
    {
      creditTitle: "Producer",
      peopleTag: [{ _id: viewer, userName: "creator" }],
    },
  ],
  toolsUsed: [{ toolName: "Camera", level: "advanced" }],
};
const values = editing.getPostEditValues(original);
const payload = {
  type: "POST",
  media: [asset],
  website: null,
  shareLinkThumbnail: null,
  about: {
    ...original.about,
    primaryLanguage: viewer,
    secondaryLanguage: null,
    keywords: "#video #test",
    peopleTag: [viewer],
  },
  isCreditWork: true,
  credit: [{ creditTitle: "Producer", peopleTag: [viewer] }],
  toolsUsed: original.toolsUsed,
};

test("editing preloads mobile values without dropping media keys, tags, credits or production details", () => {
  assert.equal(
    JSON.stringify(values.media[0].originalAsset),
    JSON.stringify(asset),
  );
  assert.equal(values.media[0].croppedData, undefined);
  assert.equal(values.primaryLanguage, viewer);
  assert.equal(values.peopleTag[0]._id, viewer);
  assert.equal(values.credit[0].peopleTag[0]._id, viewer);
  assert.equal(values.productionDate, original.about.productionDate);
  assert.equal(values.toolsUsed[0].level, "advanced");
  assert.equal(values.keywords, "#video #test");
  assert(forms.editPostShareValidation.safeParse(values).success);
});

test("stored shared-link thumbnails retain both string and object API shapes", () => {
  for (const thumbnail of [
    "https://storage.test/share.jpg",
    { url: "https://storage.test/share.jpg", urlKey: "share-key" },
  ]) {
    const share = {
      ...original,
      type: "SHARELINK",
      website: "https://example.com",
      media: [],
      shareLinkThumbnail: thumbnail,
    };
    assert.equal(
      JSON.stringify(editing.getPostEditValues(share).shareLinkThumbnail),
      JSON.stringify(thumbnail),
    );
    assert(
      schemas.postUpdateValidation.safeParse({
        ...payload,
        type: "SHARELINK",
        website: share.website,
        media: [],
        shareLinkThumbnail: thumbnail,
      }).success,
    );
  }
});

test("shared website metadata is normalized back to its editable source URL", () => {
  const data = editing.getPostEditValues({
    ...original,
    type: "SHARELINK",
    website: {
      searchUrl: "https://example.com/original",
      url: "https://example.com/canonical",
    },
  });
  assert.equal(data.website, "https://example.com/original");
});

test("update validation rejects empty posts, unsafe links, missing share thumbnails and oversized galleries", () => {
  for (const data of [
    { ...payload, media: [] },
    { ...payload, media: Array(10).fill(asset) },
    {
      ...payload,
      type: "SHARELINK",
      website: "javascript:alert(1)",
      shareLinkThumbnail: "https://storage.test/share.jpg",
    },
    {
      ...payload,
      type: "SHARELINK",
      website: "https://example.com",
      shareLinkThumbnail: null,
    },
  ])
    assert.equal(schemas.postUpdateValidation.safeParse(data).success, false);
});

function harness(
  post = original,
  putResponse = { ok: true, json: async () => ({ status: "7400" }) },
  authError,
  isTalent = true,
) {
  const calls = [];
  const invalidated = [];
  const actions = load(
    "actions/post.action.tsx",
    {
      "@/lib/validations/postUpdate.validation": schemas,
      "@/lib/utils/postEditing": editing,
      "./account-access.action": {
        getCurrentAccountAccessAction: async () => ({
          _id: viewer,
          isTalent,
        }),
      },
      "./tokenAndHeaders.action": { resolveViewerIdAction: async () => viewer },
      "./session.action": { getSession: async () => "token" },
      "@/lib/session": {
        getAuthHeaders: async () => {
          if (authError) throw authError;
          return { Authorization: "Bearer token" };
        },
      },
      "next/dist/client/components/redirect": { isRedirectError },
      "next/cache": { revalidatePath: (path) => invalidated.push(path) },
    },
    {
      fetch: async (url, options) => {
        calls.push({ url, options });
        if (options.method === "PUT") {
          if (putResponse instanceof Error) throw putResponse;
          return putResponse;
        }
        return {
          ok: true,
          json: async () => ({ status: "7400", response: post }),
        };
      },
    },
  );
  return { actions, calls, invalidated };
}

test("normal users cannot edit talent posts but can still edit their shared links", async () => {
  const normal = harness(original, undefined, undefined, false);
  assert.equal(
    (await normal.actions.updatePostAction(postId, payload)).status,
    "7403",
  );
  assert.equal(normal.calls.length, 0);
  const share = harness(
    { ...original, type: "SHARELINK" },
    undefined,
    undefined,
    false,
  );
  const result = await share.actions.updatePostAction(postId, {
    ...payload,
    type: "SHARELINK",
    media: [],
    website: "https://example.test/article",
    shareLinkThumbnail: "https://example.test/preview.png",
  });
  assert.equal(result.status, "7400");
  assert.equal(share.calls.at(-1).options.method, "PUT");
});

test("owned post edits use PUT, preserve asset keys and use the authenticated author instead of supplied userId", async () => {
  const h = harness();
  assert.equal(
    (
      await h.actions.updatePostAction(postId, {
        ...payload,
        userId: "forged-user",
      })
    ).status,
    "7400",
  );
  const call = h.calls.find((call) => call.options.method === "PUT");
  assert.equal(call.url, `https://backend.test/api/te-post/${postId}`);
  const sent = JSON.parse(call.options.body);
  assert.equal(sent.userId, viewer);
  assert.deepEqual(sent.media, [asset]);
  assert(h.invalidated.includes(`/post/${postId}`));
});

test("non-owners and content-type changes cannot send an update", async () => {
  const foreign = harness({
    ...original,
    author: { _id: "333333333333333333333333" },
  });
  assert.equal(
    (await foreign.actions.updatePostAction(postId, payload)).status,
    "7403",
  );
  assert.equal(
    foreign.calls.filter((call) => call.options.method === "PUT").length,
    0,
  );
  const changedType = harness();
  const res = await changedType.actions.updatePostAction(postId, {
    ...payload,
    type: "SHARELINK",
    website: "https://example.com",
    shareLinkThumbnail: "https://storage.test/share.jpg",
  });
  assert.notEqual(res.status, "7400");
  assert.equal(
    changedType.calls.filter((call) => call.options.method === "PUT").length,
    0,
  );
});

test("backend rejection, network errors and expired sessions cannot be reported as successful edits", async () => {
  for (const response of [
    { ok: false, json: async () => ({ status: "7400" }) },
    { ok: true, json: async () => ({ status: "ERROR" }) },
    new Error("Network unavailable"),
  ]) {
    const h = harness(original, response);
    assert.notEqual(
      (await h.actions.updatePostAction(postId, payload)).status,
      "7400",
    );
    assert.equal(h.invalidated.length, 0);
  }
  const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/sign-in;307;",
  });
  await assert.rejects(
    harness(original, null, redirect).actions.updatePostAction(postId, payload),
    (error) => error === redirect,
  );
});
