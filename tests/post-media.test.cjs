const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { webcrypto } = require("node:crypto");

function load(file, globals = {}) {
  const testModule = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      module: testModule,
      exports: testModule.exports,
      require,
      Error,
      File,
      Blob,
      Promise,
      Number,
      setTimeout,
      clearTimeout,
      crypto: webcrypto,
      AbortSignal,
      ...globals,
    },
  );
  return testModule.exports;
}

const media = load("lib/utils/postMedia.ts");
test("post limits accept 1 GB and 10 minutes exactly, rejecting empty, oversized and invalid media", () => {
  media.validatePostFile({ size: 1_000_000_000, type: "video/mp4" });
  media.validatePostDuration(600);
  for (const size of [0, NaN, 1_000_000_001]) {
    assert.throws(() => media.validatePostFile({ size, type: "video/mp4" }));
  }
  for (const type of ["application/pdf", "text/plain", ""]) {
    assert.throws(() => media.validatePostFile({ size: 100, type }));
  }
  for (const seconds of [0, NaN, Infinity, 600.01])
    assert.throws(() => media.validatePostDuration(seconds));
});

function videoHarness(duration, decodeError = false) {
  const revoked = [];
  let unloaded = false;
  let dimensions;
  const video = {
    duration,
    videoWidth: 1920,
    videoHeight: 1080,
    get src() {
      return this._src;
    },
    set src(value) {
      this._src = value;
      queueMicrotask(() => {
        if (decodeError) {
          this.onerror?.();
          return;
        }
        this.onloadedmetadata?.();
        this.onloadeddata?.();
      });
    },
    get currentTime() {
      return this._currentTime || 0;
    },
    set currentTime(value) {
      this._currentTime = value;
      queueMicrotask(() => this.onseeked?.());
    },
    removeAttribute() {
      unloaded = true;
    },
    load() {},
  };
  const canvas = {
    getContext: () => ({ drawImage() {} }),
    toBlob(callback) {
      dimensions = [this.width, this.height];
      callback(new Blob(["jpeg"], { type: "image/jpeg" }));
    },
  };
  const api = load("lib/utils/postMedia.ts", {
    window: { setTimeout },
    URL: {
      createObjectURL: () => "blob:video-test",
      revokeObjectURL: (url) => revoked.push(url),
    },
    document: { createElement: (tag) => (tag === "video" ? video : canvas) },
  });
  return {
    api,
    revoked,
    unloaded: () => unloaded,
    dimensions: () => dimensions,
  };
}

test("video creates bounded JPEG thumbnail and releases decoder and temporary URL", async () => {
  const h = videoHarness(600);
  const thumbnail = await h.api.createPostVideoThumbnail(
    new File(["video"], "clip.mp4", { type: "video/mp4" }),
  );
  assert.equal(thumbnail.type, "image/jpeg");
  assert.deepEqual(h.dimensions(), [1280, 720]);
  assert.deepEqual(h.revoked, ["blob:video-test"]);
  assert(h.unloaded());
});

test("overlong or undecodable videos are rejected and their resources released", async () => {
  for (const h of [
    videoHarness(601),
    videoHarness(NaN),
    videoHarness(20, true),
  ]) {
    await assert.rejects(
      h.api.createPostVideoThumbnail(
        new File(["video"], "clip.mp4", { type: "video/mp4" }),
      ),
    );
    assert.deepEqual(h.revoked, ["blob:video-test"]);
    assert(h.unloaded());
  }
});

test("upload sends original video bytes directly to signed storage and reports progress", async () => {
  const calls = [];
  const progress = [];
  const sent = [];
  class XHR {
    upload = {};
    open(method, url) {
      calls.push([method, url]);
    }

    setRequestHeader(name, value) {
      calls.push([name, value]);
    }

    send(file) {
      sent.push(file);
      this.upload.onprogress({ lengthComputable: true, loaded: 5, total: 10 });
      this.status = 200;
      this.onload();
    }
  }
  const api = load("lib/utils/uploadFile.ts", {
    XMLHttpRequest: XHR,
    fetch: async (url, options) => {
      assert.equal(url, "/api/s3/signedUrl");
      assert.equal(JSON.parse(options.body).contentType, "video/mp4");
      return {
        ok: true,
        json: async () => ({
          url: "https://storage.test/clip.mp4?signature=secret",
          key: "clip.mp4",
        }),
      };
    },
  });
  const file = new File(["video"], "clip.mp4", { type: "video/mp4" });
  const result = await api.uploadFileToStorage(file, "POST", "user", (n) =>
    progress.push(n),
  );
  assert.equal(sent[0], file);
  assert.equal(result.url, "https://storage.test/clip.mp4");
  assert.deepEqual(progress, [50, 100]);
});

test("failed storage upload rejects instead of returning an attachment", async () => {
  class XHR {
    upload = {};
    open() {}
    setRequestHeader() {}
    send() {
      this.status = 403;
      this.onload();
    }
  }
  const api = load("lib/utils/uploadFile.ts", {
    XMLHttpRequest: XHR,
    fetch: async () => ({
      ok: true,
      json: async () => ({ url: "https://storage.test/clip", key: "clip" }),
    }),
  });
  await assert.rejects(
    api.uploadFileToStorage(new File(["v"], "v.mp4"), "POST", "user", () => {}),
  );
});

test("existing callers without progress still use fetch, and invalid signing responses reject", async () => {
  let calls = 0;
  const file = new File(["image"], "image.png", { type: "image/png" });
  const api = load("lib/utils/uploadFile.ts", {
    fetch: async () =>
      ++calls === 1
        ? {
            ok: true,
            json: async () => ({
              url: "https://storage.test/image?sig=secret",
              key: "image",
            }),
          }
        : { ok: true },
  });
  assert.equal(
    (await api.uploadFileToStorage(file, "profile", "user")).key,
    "image",
  );
  assert.equal(calls, 2);
  for (const response of [
    { ok: false },
    { ok: true, json: async () => ({}) },
  ]) {
    const failing = load("lib/utils/uploadFile.ts", {
      fetch: async () => response,
    });
    await assert.rejects(failing.uploadFileToStorage(file, "POST", "user"));
  }
});
