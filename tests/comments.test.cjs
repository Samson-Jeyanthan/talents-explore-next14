const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { isRedirectError } = require("next/dist/client/components/redirect");
const postId = "6aff08a32e63b493d0e6e337";
const parentId = "6aff08a32e63b493d0e6e338";
const nestedId = "6aff08a32e63b493d0e6e339";
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
      Error,
      URLSearchParams,
      ...globals,
    },
  );
  return testModule.exports;
}
const paging = load("lib/utils/commentPages.ts");
const item = (id) => ({
  _id: String(id),
  comment: "Text",
  author: { _id: "author", userName: "tester" },
  totalReplies: 0,
  totalLikes: 0,
});
const list = (count, start = 0) =>
  Array.from({ length: count }, (_, index) => item(start + index));
function api(responses, authFailure) {
  const calls = [];
  const invalidations = [];
  const actions = load(
    "actions/comment.action.tsx",
    {
      "@/lib/session": {
        getAuthHeaders: async () => {
          if (authFailure) throw authFailure;
          return { Authorization: "Bearer private-token" };
        },
      },
      "next/cache": { revalidatePath: (path) => invalidations.push(path) },
      "next/dist/client/components/redirect": { isRedirectError },
    },
    {
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      fetch: async (url, options) => {
        calls.push({ url, options });
        const response = responses.shift();
        if (response instanceof Error) throw response;
        return {
          ok: response.httpOk !== false,
          status: response.httpOk === false ? 403 : 200,
          json: async () => response.body || response,
        };
      },
    },
  );
  return { actions, calls, invalidations };
}

test("comments and replies request successive authenticated pages with the same page size", async () => {
  const h = api(
    Array.from({ length: 4 }, () => ({ status: "7400", response: [] })),
  );
  for (const page of [1, 2]) {
    assert.equal((await h.actions.getCommentsAction(postId, page)).status, 200);
    assert.equal(
      (await h.actions.getRepliesOfCommentAction(parentId, page, 20)).status,
      "7400",
    );
  }
  for (let index = 0; index < h.calls.length; index++) {
    const call = h.calls[index];
    const query = new URL(call.url).searchParams;
    assert.equal(query.get("pageNo"), String(Math.floor(index / 2) + 1));
    assert.equal(query.get("pageSize"), "20");
    assert.equal(call.options.cache, "no-store");
    assert.equal(call.options.headers.Authorization, "Bearer private-token");
  }
});

test("invalid identifiers, blank text and invalid pagination never reach the API", async () => {
  const h = api([]);
  assert.equal((await h.actions.getCommentsAction(undefined, 1)).status, 400);
  assert.equal((await h.actions.getCommentsAction(postId, 0)).status, 400);
  assert.equal(
    (await h.actions.getRepliesOfCommentAction(parentId, 1, 0)).status,
    400,
  );
  assert.equal((await h.actions.addCommentAction(postId, "  ")).status, 400);
  assert.equal(
    (await h.actions.addReplyAction(postId, null, "reply")).status,
    400,
  );
  assert.equal((await h.actions.commentLikeAction("../other")).status, 400);
  assert.equal(h.calls.length, 0);
});

test("HTTP rejection, malformed lists and network failures stay retryable errors", async () => {
  for (const response of [
    { httpOk: false, body: { status: "7400", response: [] } },
    { status: "7400", response: {} },
    new Error("offline"),
  ]) {
    const h = api([response]);
    assert.notEqual((await h.actions.getCommentsAction(postId, 1)).status, 200);
    assert.equal(h.invalidations.length, 0);
  }
});

test("comment, reply and like actions preserve session-refresh redirects", async () => {
  const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/api/auth/refresh;307;",
  });
  const h = api([], redirect);
  for (const call of [
    () => h.actions.getCommentsAction(postId, 1),
    () => h.actions.getRepliesOfCommentAction(parentId, 1),
    () => h.actions.addCommentAction(postId, "text"),
    () => h.actions.addReplyAction(postId, parentId, "text"),
    () => h.actions.commentLikeAction(parentId),
  ]) {
    await assert.rejects(call(), (error) => error === redirect);
  }
});

test("accepted comments trim text and refresh the correct post; rejected writes cannot report success", async () => {
  const h = api([
    { status: "7400", response: item(parentId) },
    { httpOk: false, body: { status: "7400" } },
  ]);
  assert.equal(
    (await h.actions.addCommentAction(postId, "  hello  ", "/home")).status,
    "7400",
  );
  assert.equal(JSON.parse(h.calls[0].options.body).comment, "hello");
  assert(h.invalidations.includes(`/post/${postId}`));
  assert(h.invalidations.includes("/home"));
  h.invalidations.length = 0;
  assert.notEqual(
    (await h.actions.addCommentAction(postId, "hello")).status,
    "7400",
  );
  assert.equal(h.invalidations.length, 0);
});

test("nested replies fall back to the root only for a rejected parent, never after success or an outage", async () => {
  const h = api([
    { status: "7404", message: "Parent not found" },
    { status: "7400", response: item(nestedId) },
  ]);
  assert.equal(
    (
      await h.actions.addReplyAction(
        postId,
        nestedId,
        "reply",
        "/home",
        parentId,
      )
    ).status,
    "7400",
  );
  assert.deepEqual(
    h.calls.map((call) => JSON.parse(call.options.body).parentCommentId),
    [nestedId, parentId],
  );
  for (const response of [
    { status: "7400", response: item(nestedId) },
    new Error("offline"),
  ]) {
    const single = api([response]);
    await single.actions.addReplyAction(
      postId,
      nestedId,
      "reply",
      "/home",
      parentId,
    );
    assert.equal(single.calls.length, 1);
  }
});

test("comment and reply pagination keeps content on failure, retries the same page, and deduplicates overlaps", async () => {
  const pages = new paging.CommentPages();
  await pages.load(async (page) => {
    assert.equal(page, 1);
    return { items: list(20) };
  });
  await pages.load(async (page) => {
    assert.equal(page, 2);
    return { message: "offline" };
  });
  assert.equal(pages.snapshot().items.length, 20);
  assert.equal(pages.snapshot().page, 1);
  await pages.load(async (page) => {
    assert.equal(page, 2);
    return { items: list(4, 19) };
  });
  assert.equal(pages.snapshot().items.length, 23);
  assert.equal(pages.snapshot().error, "");
  assert.equal(pages.snapshot().hasMore, false);
});

test("posting during initial loading remains visible and duplicate concurrent loads are prevented", async () => {
  const pages = new paging.CommentPages();
  let finish;
  const request = pages.load(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await pages.load(() => assert.fail("duplicate request"));
  pages.prepend(item("new"));
  finish({ items: list(20) });
  await request;
  assert.equal(pages.snapshot().items[0]._id, "new");
  assert.equal(pages.snapshot().items.length, 21);
  assert.equal(pages.snapshot().hasMore, true);
  pages.update("new", (value) => ({
    ...value,
    totalReplies: value.totalReplies + 1,
  }));
  assert.equal(pages.snapshot().items[0].totalReplies, 1);
});

test("changing posts discards stale responses without unlocking the new request", async () => {
  const pages = new paging.CommentPages();
  let oldFinish;
  let newFinish;
  const old = pages.load(
    () =>
      new Promise((resolve) => {
        oldFinish = resolve;
      }),
  );
  pages.reset();
  const current = pages.load(
    () =>
      new Promise((resolve) => {
        newFinish = resolve;
      }),
  );
  oldFinish({ items: list(20) });
  await old;
  assert.equal(pages.snapshot().loading, true);
  assert.equal(pages.snapshot().items.length, 0);
  newFinish({ items: [item("current")] });
  await current;
  assert.equal(pages.snapshot().items[0]._id, "current");
});

function hooks() {
  const cells = [];
  const effects = [];
  let cursor = 0;
  let first = true;
  return {
    react: {
      useState: (initial) => {
        const index = cursor++;
        if (first)
          cells[index] = typeof initial === "function" ? initial() : initial;
        return [
          cells[index],
          (next) => {
            cells[index] =
              typeof next === "function" ? next(cells[index]) : next;
          },
        ];
      },
      useRef: (initial) => {
        const index = cursor++;
        if (first) cells[index] = { current: initial };
        return cells[index];
      },
      useEffect: (callback) => {
        if (first) effects.push(callback);
      },
      useCallback: (callback) => callback,
    },
    render: (callback) => {
      cursor = 0;
      const result = callback();
      first = false;
      return result;
    },
    effects,
  };
}
const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return;
  if (Array.isArray(tree)) {
    for (const child of tree) {
      const result = find(child, predicate);
      if (result) return result;
    }
    return;
  }
  if (predicate(tree)) return tree;
  return find(tree.props?.children, predicate);
}
function inputHarness(responses, reply = false) {
  const state = hooks();
  const sent = [];
  const calls = [];
  const call = async (...args) => {
    calls.push(args);
    const response = responses.shift();
    if (response instanceof Error) throw response;
    if (typeof response === "function") return response();
    return response;
  };
  const component = load("components/inputs/CommentInput.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "next/navigation": { usePathname: () => "/home" },
    "lucide-react": {},
    "../others/UserProfileImg": {},
    "../ui/button": { Button: "button" },
    "../ui/textarea": { Textarea: "textarea" },
    "../options": {},
    "@/public/assets/svgs": {},
    "@/context/AuthProvider": {
      useUserContext: () => ({
        user: { currentUserId: "viewer", username: "tester" },
      }),
    },
    "@/lib/utils/commentPages": paging,
    "@/actions/comment.action": {
      addCommentAction: call,
      addReplyAction: call,
    },
  });
  const render = () =>
    state.render(() =>
      component.default({
        postId,
        commentType: "PAGE",
        replyCommentId: reply ? nestedId : undefined,
        replyRootId: reply ? parentId : undefined,
        onSent: (event) => sent.push(event),
      }),
    );
  const textarea = () => find(render(), (node) => node.type === "textarea");
  const submit = () =>
    find(
      render(),
      (node) =>
        node.props?.["aria-label"] === (reply ? "Send reply" : "Send comment"),
    ).props.onClick();
  return { render, textarea, submit, sent, calls };
}

test("failed sends retain the draft and reply target; retry clears only after success", async () => {
  for (const reply of [false, true]) {
    const h = inputHarness(
      [
        { status: 400, message: "Rejected" },
        { status: "7400", response: { _id: nestedId } },
      ],
      reply,
    );
    h.textarea().props.onChange({ target: { value: "My draft" } });
    await h.submit();
    assert.equal(h.textarea().props.value, "My draft");
    assert.equal(h.sent.length, 0);
    assert(find(h.render(), (node) => node.props?.role === "alert"));
    await h.submit();
    assert.equal(h.textarea().props.value, "");
    assert.equal(h.sent.length, 1);
    assert.equal(h.sent[0].parentId, reply ? parentId : null);
    assert.equal(h.sent[0].comment.comment, "My draft");
    assert.equal(h.sent[0].comment.author.userName, "tester");
    if (reply) assert.equal(h.calls[1][1], nestedId);
  }
});

test("network failure preserves text and rapid clicks cannot submit the same draft twice", async () => {
  let finish;
  const h = inputHarness([
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  ]);
  h.textarea().props.onChange({ target: { value: "Draft" } });
  const first = h.submit();
  await h.submit();
  assert.equal(h.calls.length, 1);
  finish({ status: "7400", response: { _id: nestedId } });
  await first;
  const failed = inputHarness([new Error("offline")]);
  failed.textarea().props.onChange({ target: { value: "Kept" } });
  await failed.submit();
  assert.equal(failed.textarea().props.value, "Kept");
});

test("an accepted write without a returned record signals a refresh instead of fabricating a comment", async () => {
  const h = inputHarness([{ status: "7400" }]);
  h.textarea().props.onChange({ target: { value: "Accepted" } });
  await h.submit();
  assert.equal(h.sent[0].comment, null);
  assert.equal(h.textarea().props.value, "");
});

function threadHarness(canComment, deletions = [], replyCount = 0) {
  const state = hooks();
  const items = [{ ...item(parentId), totalReplies: replyCount }];
  const inserted = [];
  const updates = [];
  let refreshes = 0;
  const thread = load("components/widgets/postMoreDetails/CommentThread.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "@/actions/comment.action": {
      deleteCommentAction: async () => {
        const result = deletions.shift();
        if (result instanceof Error) throw result;
        return result;
      },
    },
    "next/navigation": { usePathname: () => "/home" },
    "@/context/AuthProvider": {
      useUserContext: () => ({ user: { currentUserId: "viewer" } }),
    },
    "@/components/ui/alert-dialog": {},
    "@/lib/utils/commentPages": paging,
    "@/components/inputs/CommentInput": "composer",
    "@/components/cards/CommentCard": "comment-card",
    "@/components/ui/button": { Button: "button" },
    "@/lib/hooks/useCommentPages": {
      useCommentPages: () => ({
        items,
        loading: false,
        error: "",
        hasMore: false,
        prepend: (value) => inserted.push(value),
        refresh: () => {
          refreshes++;
        },
        update: (id, change) =>
          updates.push({
            id,
            value: change(items.find((value) => value._id === id)),
          }),
      }),
    },
  });
  const render = () =>
    state.render(() =>
      thread.default({
        postId,
        numberOfComments: 10,
        canComment,
        commentType: "PAGE",
      }),
    );
  return { render, inserted, updates, refreshes: () => refreshes };
}

test("new comments update the visible thread while replies update their parent rather than the root list", () => {
  const h = threadHarness(true);
  find(h.render(), (node) => node.type === "composer").props.onSent({
    comment: item("new"),
    parentId: null,
  });
  assert.equal(h.inserted[0]._id, "new");
  const counter = find(
    h.render(),
    (node) =>
      node.type === "span" &&
      Array.isArray(node.props.children) &&
      node.props.children.includes(11),
  );
  assert(counter);
  find(h.render(), (node) => node.type === "composer").props.onSent({
    comment: item("reply"),
    parentId,
  });
  assert.equal(h.inserted.length, 1);
  assert.equal(h.updates[0].id, parentId);
  assert.equal(h.updates[0].value.totalReplies, 1);
  find(h.render(), (node) => node.type === "composer").props.onSent({
    comment: null,
    parentId: null,
  });
  assert.equal(h.refreshes(), 1);
});

test("restricted threads show existing comments and omit the composer and all reply controls", () => {
  const h = threadHarness(false);
  const tree = h.render();
  assert.equal(
    find(tree, (node) => node.type === "composer"),
    undefined,
  );
  assert.equal(
    find(tree, (node) => node.type === "comment-card").props.canReply,
    false,
  );
});

test("mobile reply aliases preserve text, identity, timestamps, embedded replies and like state", () => {
  const comment = paging.normalizeComment(
    {
      data: {
        replyId: nestedId,
        content: "A nested reply",
        user: {
          userId: "author",
          userName: "talent",
          profileImage: "image.jpg",
        },
        timestamp: "2026-11-20T10:30:00Z",
        likes: ["viewer", { userId: "another" }],
        childComments: [{ _id: "child" }],
      },
    },
    "viewer",
  );
  assert.equal(comment._id, nestedId);
  assert.equal(comment.comment, "A nested reply");
  assert.equal(comment.author._id, "author");
  assert.equal(comment.author.userName, "talent");
  assert.equal(comment.createdAt, "2026-11-20T10:30:00Z");
  assert.equal(comment.isLiked, true);
  assert.equal(comment.totalLikes, 2);
  assert.equal(comment.totalReplies, 1);
  assert.equal(
    paging.commentLikeState(
      { liked: false, likeCount: -1, likes: ["viewer"] },
      "viewer",
    ).liked,
    false,
  );
  assert.equal(paging.commentLikeState({ likesCount: 3 }).count, 3);
  assert.equal(
    paging.normalizeComment({ id: nestedId, text: "Reply", authorName: "name" })
      .author.userName,
    "name",
  );
});

test("mobile delete controls are available only to the comment author or post owner", () => {
  const comment = item(parentId);
  assert.equal(paging.canDeleteComment(comment, "author", "post-owner"), true);
  assert.equal(
    paging.canDeleteComment(comment, "post-owner", "post-owner"),
    true,
  );
  assert.equal(
    paging.canDeleteComment(comment, "stranger", "post-owner"),
    false,
  );
  assert.equal(paging.canDeleteComment(comment, "", ""), false);
});

test("delete uses the mobile authenticated endpoint and backend rejection never invalidates the page", async () => {
  const h = api([
    { status: "7400" },
    { httpOk: false, body: { status: "7400", message: "Forbidden" } },
  ]);
  assert.equal(
    (await h.actions.deleteCommentAction(parentId, postId, "/home")).status,
    "7400",
  );
  assert.equal(h.calls[0].url, `https://backend.test/comments/${parentId}`);
  assert.equal(h.calls[0].options.method, "DELETE");
  assert.equal(h.calls[0].options.body, undefined);
  assert.equal(
    h.calls[0].options.headers.Authorization,
    "Bearer private-token",
  );
  assert(h.invalidations.includes(`/post/${postId}`));
  h.invalidations.length = 0;
  assert.notEqual(
    (await h.actions.deleteCommentAction(parentId, postId)).status,
    "7400",
  );
  assert.equal(h.invalidations.length, 0);
  const invalid = api([]);
  assert.equal(
    (await invalid.actions.deleteCommentAction("../other", postId)).status,
    400,
  );
  assert.equal(invalid.calls.length, 0);
});

test("delete errors keep the thread unchanged and confirmation open for retry", async () => {
  const h = threadHarness(true, [
    { status: 403, message: "Not allowed" },
    { status: "7400" },
  ]);
  find(h.render(), (node) => node.type === "comment-card").props.onDelete(
    parentId,
  );
  assert.equal(h.refreshes(), 0);
  await find(
    h.render(),
    (node) => node.props?.["aria-label"] === "Confirm deletion",
  ).props.onClick({ preventDefault() {} });
  assert.equal(h.refreshes(), 0);
  assert.equal(
    find(h.render(), (node) => node.props?.role === "alert").props.children,
    "Not allowed",
  );
  await find(
    h.render(),
    (node) => node.props?.["aria-label"] === "Confirm deletion",
  ).props.onClick({ preventDefault() {} });
  assert.equal(h.refreshes(), 1);
  assert.equal(
    find(h.render(), (node) => node.props?.role === "alert"),
    undefined,
  );
});

test("deleting a reply updates only its parent and reloads the reply list", async () => {
  const h = threadHarness(true, [{ status: "7400" }], 2);
  find(h.render(), (node) => node.type === "comment-card").props.onDelete(
    nestedId,
    parentId,
  );
  await find(
    h.render(),
    (node) => node.props?.["aria-label"] === "Confirm deletion",
  ).props.onClick({ preventDefault() {} });
  assert.equal(h.refreshes(), 0);
  assert.equal(h.updates[0].value.totalReplies, 1);
  assert.equal(
    find(h.render(), (node) => node.type === "comment-card").props.deletedReply
      .id,
    nestedId,
  );
});

test("replying to a child places an independent inline editor under that child", () => {
  const h = threadHarness(true);
  const rootComposer = find(h.render(), (node) => node.type === "composer");
  assert.equal(rootComposer.props.replyCommentId, undefined);
  find(h.render(), (node) => node.type === "comment-card").props.onReply(
    nestedId,
    { _id: "author", userName: "talent" },
    parentId,
  );
  const card = find(h.render(), (node) => node.type === "comment-card");
  assert.equal(card.props.replyTargetId, nestedId);
  assert.equal(card.props.inlineReply.props.commentType, "INLINE");
  assert.equal(card.props.inlineReply.props.replyCommentId, nestedId);
  assert.equal(card.props.inlineReply.props.replyRootId, parentId);
  card.props.inlineReply.props.onCancelReply();
  assert.equal(
    find(h.render(), (node) => node.type === "comment-card").props.inlineReply,
    undefined,
  );
});
