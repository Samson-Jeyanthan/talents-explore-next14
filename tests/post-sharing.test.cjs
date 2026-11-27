const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, mocks = {}, globals = {}) {
  const testModule = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    {
      module: testModule,
      exports: testModule.exports,
      require: (name) => mocks[name] || require(name),
      URL,
      URLSearchParams,
      Error,
      ...globals,
    },
  );
  return testModule.exports;
}
const sharing = load("lib/utils/postSharing.ts");
const post = { id: "6aff08a32e63b493d0e6e337", title: "Title & details 🎬" };

test("post and shared-link sharing use the current site post route without query parameters", () => {
  const data = sharing.getPostShareData(
    "http://localhost:3000/home?q=old",
    post,
  );
  assert.equal(data.url, `http://localhost:3000/post/${post.id}`);
  assert.equal(data.title, post.title);
  assert.equal(
    sharing.getPostShareData("https://talentsexplore.com", post).url,
    `https://talentsexplore.com/post/${post.id}`,
  );
  assert.throws(() => sharing.getPostShareData("javascript:alert(1)", post));
  assert.throws(() =>
    sharing.getPostShareData("https://example.com", {
      ...post,
      id: "../logout",
    }),
  );
});

test("supported native sharing receives the title and post URL without touching clipboard", async () => {
  const data = sharing.getPostShareData("https://example.com", post);
  const calls = [];
  const result = await sharing.sharePostLink(data, {
    canShare: (value) => value.url === data.url,
    share: async (value) => calls.push(value),
    clipboard: { writeText: () => assert.fail("unnecessary clipboard write") },
  });
  assert.equal(result, "shared");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, data.url);
  assert.equal(calls[0].title, post.title);
});

test("native dismissal is quiet and never copies the link", async () => {
  const error = Object.assign(new Error("User cancelled"), {
    name: "AbortError",
  });
  const result = await sharing.sharePostLink(
    sharing.getPostShareData("https://example.com", post),
    {
      share: async () => {
        throw error;
      },
      clipboard: { writeText: () => assert.fail("cancel must not copy") },
    },
  );
  assert.equal(result, "cancelled");
});

test("unsupported or failed native sharing copies the link only after clipboard success", async () => {
  const data = sharing.getPostShareData("https://example.com", post);
  for (const native of [
    {},
    {
      canShare: () => false,
      share: () => assert.fail("unsupported native share"),
    },
    {
      share: async () => {
        throw new Error("Not supported");
      },
    },
    {
      canShare: () => {
        throw new Error("Unavailable");
      },
      share: async () => {},
    },
  ]) {
    const copied = [];
    const result = await sharing.sharePostLink(data, {
      ...native,
      clipboard: { writeText: async (url) => copied.push(url) },
    });
    assert.equal(result, "copied");
    assert.deepEqual(copied, [data.url]);
  }
});

test("unavailable and denied clipboard access return a manual-copy fallback", async () => {
  for (const browser of [
    {},
    {
      clipboard: {
        writeText: async () => {
          throw new Error("Not allowed");
        },
      },
    },
  ]) {
    assert.equal(
      await sharing.copyPostLink("https://example.com/post/id", browser),
      "manual",
    );
    assert.equal(
      await sharing.sharePostLink(
        { title: "Title", url: "https://example.com/post/id" },
        browser,
      ),
      "manual",
    );
  }
});

test("chat handoff preserves special characters and validates incoming post identifiers", () => {
  const params = new URLSearchParams(sharing.postShareParams(post));
  const parsed = sharing.readSharedPost(Object.fromEntries(params));
  assert.equal(parsed.id, post.id);
  assert.equal(parsed.title, post.title);
  assert.equal(sharing.readSharedPost({ sharePost: [post.id] }), undefined);
  assert.equal(
    sharing.readSharedPost({ sharePost: "https://evil.example" }),
    undefined,
  );
  assert.equal(
    sharing.readSharedPost({ sharePost: post.id, shareTitle: "a".repeat(1000) })
      .title.length,
    300,
  );
  assert.equal(
    sharing.sharedPostDraft("https://example.com", post),
    `${post.title}\nhttps://example.com/post/${post.id}`,
  );
});

test("consuming a chat share removes only share parameters, preserving conversation state and hash", () => {
  const clean = sharing.removeShareParams(
    `https://example.com/chat/room?type=group&${sharing.postShareParams(post)}#latest`,
  );
  assert.equal(clean, "/chat/room?type=group#latest");
  assert.equal(
    sharing.readSharedPost(
      Object.fromEntries(
        new URLSearchParams(new URL(clean, "https://example.com").search),
      ),
    ),
    undefined,
  );
});

function composerHarness(sharedPost) {
  const state = [];
  const effects = [];
  let cursor = 0;
  let firstRender = true;
  const sends = [];
  const history = [];
  const react = {
    useState: (initial) => {
      const index = cursor++;
      if (firstRender) state[index] = initial;
      return [
        state[index],
        (next) => {
          state[index] = typeof next === "function" ? next(state[index]) : next;
        },
      ];
    },
    useRef: (initial) => {
      const index = cursor++;
      if (firstRender) state[index] = { current: initial };
      return state[index];
    },
    useEffect: (callback) => {
      if (firstRender) effects.push(callback);
    },
  };
  const exported = load(
    "components/widgets/chat/ChatComposer.tsx",
    {
      react,
      "react/jsx-runtime": {
        jsx: (type, props) => ({ type, props }),
        jsxs: (type, props) => ({ type, props }),
      },
      "lucide-react": {},
      "@/components/ui/button": {},
      "@/lib/validations/chat.validation": load(
        "lib/validations/chat.validation.ts",
      ),
      "@/lib/utils/chatMedia": {},
      "@/lib/utils/uploadFile": {},
      "@/lib/utils/postSharing": sharing,
    },
    {
      window: {
        location: {
          origin: "https://example.com",
          href: `https://example.com/chat/room?type=chat&${sharing.postShareParams(post)}`,
        },
        history: {
          state: { retained: true },
          replaceState: (...args) => history.push(args),
        },
      },
    },
  );
  function render() {
    cursor = 0;
    const tree = exported.default({
      roomId: "room",
      userName: "tester",
      sharedPost,
      onTyping() {},
      onSend: async (payload) => {
        sends.push(payload);
        return { success: true };
      },
    });
    firstRender = false;
    return tree;
  }
  return { render, effects, sends, history };
}

function find(tree, type) {
  if (!tree || typeof tree !== "object") return;
  if (tree.type === type) return tree;
  const children = tree.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const result = find(child, type);
    if (result) return result;
  }
}

test("opening a shared post prefills an editable composer once, never sending automatically", async () => {
  const h = composerHarness(post);
  h.render();
  h.effects.forEach((effect) => effect());
  let tree = h.render();
  assert.equal(
    find(tree, "textarea").props.value,
    `${post.title}\nhttps://example.com/post/${post.id}`,
  );
  assert.equal(h.sends.length, 0);
  assert.equal(h.history[0][2], "/chat/room?type=chat");
  assert.equal(h.history[0][0].retained, true);
  find(tree, "textarea").props.onChange({
    target: { value: "My edited post link" },
  });
  tree = h.render();
  await tree.props.onSubmit({ preventDefault() {} });
  assert.equal(h.sends.length, 1);
  assert.equal(h.sends[0].content, "My edited post link");
  assert.equal(find(h.render(), "textarea").props.value, "");
  h.effects[0]();
  assert.equal(find(h.render(), "textarea").props.value, "");
});

test("share prefill preserves an existing draft and ordinary chat starts empty", () => {
  const h = composerHarness(post);
  find(h.render(), "textarea").props.onChange({
    target: { value: "Already typing" },
  });
  h.effects.forEach((effect) => effect());
  assert.equal(find(h.render(), "textarea").props.value, "Already typing");
  const ordinary = composerHarness(undefined);
  ordinary.render();
  ordinary.effects.forEach((effect) => effect());
  assert.equal(find(ordinary.render(), "textarea").props.value, "");
  assert.equal(ordinary.history.length, 0);
});

test("choosing a direct or group conversation preserves the shared post and special-character title", () => {
  for (const tab of ["chat", "group"]) {
    const dashboard = load("components/widgets/chat/ChatDashboard.tsx", {
      react: {
        useState: (initial) => [initial === "chat" ? tab : initial, () => {}],
        useMemo: (callback) => callback(),
        useCallback: (callback) => callback,
        useEffect() {},
        useTransition: () => [false, () => {}],
      },
      "react/jsx-runtime": {
        jsx: (type, props) => ({ type, props }),
        jsxs: (type, props) => ({ type, props }),
      },
      "next/link": "a",
      "lucide-react": {},
      "date-fns": {},
      "@/components/others/UserProfileImg": {},
      "@/components/ui/button": {},
      "@/lib/utils/postSharing": sharing,
    });
    const tree = dashboard.default({
      isTalent: true,
      initialChats: [
        { roomId: "direct-room", member: [{ userName: "Test user" }] },
      ],
      initialRequests: [],
      initialGroups: [{ roomId: "group-room", title: "Test group" }],
      initialUnreadCount: { oneToOne: 0, group: 0, request: 0 },
      sharedPost: post,
    });
    const links = [];
    function visit(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (node.type === "a") links.push(node.props.href);
      visit(node.props?.children);
    }
    visit(tree);
    const room = tab === "chat" ? "direct-room" : "group-room";
    const url = new URL(
      links.find((link) => link.startsWith(`/chat/${room}?`)),
      "https://example.com",
    );
    assert.equal(url.searchParams.get("type"), tab);
    assert.equal(url.searchParams.get("sharePost"), post.id);
    assert.equal(url.searchParams.get("shareTitle"), post.title);
    assert(links.includes("/chat"));
  }
});
