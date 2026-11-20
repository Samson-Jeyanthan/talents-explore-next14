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
      File,
      Blob,
      setTimeout,
      clearTimeout,
      console: { error() {}, log() {} },
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test/api" } },
      ...extra,
    },
  );
  return testModule.exports;
}
const schema = load("lib/validations/chat.validation.ts");
const validVideo = {
  roomId: "room-1",
  mediaType: "video",
  media: "https://storage.test/video.mp4",
  videoThumbnail: "https://storage.test/preview.jpg",
};

test("chat accepts text-only, attachment-only and captioned attachment messages", () => {
  for (const data of [
    { roomId: "room-1", content: "Hello" },
    {
      roomId: "room-1",
      mediaType: "image",
      media: "https://storage.test/image.png",
    },
    validVideo,
    { ...validVideo, content: "Caption" },
  ]) {
    assert(schema.chatMessageValidation.safeParse(data).success);
  }
  for (const data of [
    { roomId: "room-1", content: " " },
    { ...validVideo, roomId: "" },
    { ...validVideo, videoThumbnail: null },
    { ...validVideo, media: null },
    { ...validVideo, media: "javascript:alert(1)" },
  ]) {
    assert.equal(schema.chatMessageValidation.safeParse(data).success, false);
  }
});

test("chat images decode before selection and their preview URLs are released", async () => {
  const revoked = [];
  class Image {
    naturalWidth = 100;
    get src() {
      return this._src;
    }

    set src(value) {
      this._src = value;
      queueMicrotask(() => this.onload?.());
    }
  }
  const media = load(
    "lib/utils/chatMedia.ts",
    {},
    {
      Image,
      URL: {
        createObjectURL: () => "blob:preview",
        revokeObjectURL: (url) => revoked.push(url),
      },
    },
  );
  const attachment = await media.prepareChatAttachment(
    new File(["image"], "image.png", { type: "image/png" }),
  );
  assert.equal(attachment.mediaType, "image");
  assert.equal(attachment.preview, "blob:preview");
  media.releaseChatAttachment(attachment);
  assert.deepEqual(revoked, ["blob:preview"]);
});

test("empty, unsupported and undecodable image files are rejected without retaining their URLs", async () => {
  const revoked = [];
  class Image {
    get src() {
      return this._src;
    }

    set src(value) {
      this._src = value;
      queueMicrotask(() => this.onerror?.());
    }
  }
  const media = load(
    "lib/utils/chatMedia.ts",
    {},
    {
      Image,
      URL: {
        createObjectURL: () => "blob:broken",
        revokeObjectURL: (url) => revoked.push(url),
      },
    },
  );
  assert.throws(() => media.validateChatFile({ size: 0, type: "image/png" }));
  assert.throws(() =>
    media.validateChatFile({ size: 10, type: "application/pdf" }),
  );
  await assert.rejects(
    media.prepareChatAttachment(
      new File(["broken"], "broken.png", { type: "image/png" }),
    ),
  );
  assert.deepEqual(revoked, ["blob:broken"]);
});

test("chat video thumbnails use chat validation without changing post limits", async () => {
  const revoked = [];
  const media = load(
    "lib/utils/chatMedia.ts",
    {
      "./postMedia": {
        createVideoThumbnail: async (file, checks) => {
          checks.file(file);
          checks.duration(700);
          return new File(["preview"], "preview.jpg", { type: "image/jpeg" });
        },
      },
    },
    {
      URL: {
        createObjectURL: (file) => `blob:${file.name}`,
        revokeObjectURL: (url) => revoked.push(url),
      },
    },
  );
  const attachment = await media.prepareChatAttachment(
    new File(["video"], "clip.mp4", { type: "video/mp4" }),
  );
  assert.equal(attachment.mediaType, "video");
  assert.equal(attachment.thumbnail.type, "image/jpeg");
  media.releaseChatAttachment(attachment);
  assert.deepEqual(revoked, ["blob:clip.mp4", "blob:preview.jpg"]);
});

test("upload retries retain successful media uploads and retry only the failed thumbnail", async () => {
  const media = load("lib/utils/chatMedia.ts");
  const file = new File(["video"], "clip.mp4");
  const thumbnail = new File(["preview"], "preview.jpg");
  const attachment = {
    file,
    thumbnail,
    mediaType: "video",
    preview: "blob:video",
  };
  const cache = new WeakMap();
  const calls = [];
  let rejectPreview = true;
  const upload = async (file) => {
    calls.push(file.name);
    if (file === thumbnail && rejectPreview) throw new Error("Interrupted");
    return { key: file.name, url: `https://storage.test/${file.name}` };
  };
  await assert.rejects(media.uploadChatAttachment(attachment, upload, cache));
  rejectPreview = false;
  const result = await media.uploadChatAttachment(attachment, upload, cache);
  await media.uploadChatAttachment(attachment, upload, cache);
  assert.deepEqual(calls, ["clip.mp4", "preview.jpg", "preview.jpg"]);
  assert.equal(result.media, "https://storage.test/clip.mp4");
  assert.equal(result.videoThumbnail, "https://storage.test/preview.jpg");
});

function actionHarness(
  response = {
    status: 200,
    data: { status: "7400", response: { _id: "message-1" } },
  },
  authError,
) {
  const calls = [];
  const actions = load("actions/chat.action.tsx", {
    "@/lib/validations/chat.validation": schema,
    "@/lib/session": {
      getAuthHeaders: async () => {
        if (authError) throw authError;
        return { Authorization: "Bearer fresh-token" };
      },
    },
    "./auth.action": {
      getUserPersonalInfoAction: async (token) => {
        assert.equal(token, "fresh-token");
        return {
          status: "7400",
          response: {
            _id: "trusted-user",
            userName: "test-user",
            personalInfo: { profileImage: null },
          },
        };
      },
    },
    "next/dist/client/components/redirect": { isRedirectError },
    axios: {
      default: {
        post: async (url, body, options) => {
          calls.push({ url, body, options });
          if (response instanceof Error) throw response;
          return response;
        },
      },
    },
  });
  return { send: actions.sendChatMessageAction, calls };
}

test("attachment send matches mobile fields and derives sender identity from the session", async () => {
  const h = actionHarness();
  assert.equal(
    (
      await h.send({
        ...validVideo,
        content: " Caption ",
        userId: "forged-user",
      })
    ).status,
    "7400",
  );
  const call = h.calls[0];
  assert.equal(call.url, "https://backend.test/api/chat/sendMessage");
  assert.equal(call.body.userId, "trusted-user");
  assert.equal(call.body.content, "Caption");
  assert.equal(call.body.mediaType, "video");
  assert.equal(call.body.videoThumbnail, validVideo.videoThumbnail);
  assert.equal(call.options.headers.Authorization, "Bearer fresh-token");
});

test("failed or empty sends cannot report success; auth redirects remain redirects", async () => {
  const empty = actionHarness();
  assert.notEqual(
    (await empty.send({ roomId: "room-1", content: "" })).status,
    "7400",
  );
  assert.equal(empty.calls.length, 0);
  for (const response of [
    { status: 403, data: { status: "7400" } },
    { status: 200, data: { status: "ERROR" } },
    new Error("Network unavailable"),
  ]) {
    assert.notEqual(
      (await actionHarness(response).send(validVideo)).status,
      "7400",
    );
  }
  const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/sign-in;307;",
  });
  await assert.rejects(
    actionHarness(null, redirect).send(validVideo),
    (error) => error === redirect,
  );
});
