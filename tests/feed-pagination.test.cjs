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
      },
    }).outputText,
    {
      module: testModule,
      exports: testModule.exports,
      require: (name) => mocks[name] || require(name),
      Error,
      AbortSignal,
      URLSearchParams,
      ...globals,
    },
  );
  return testModule.exports;
}
const { FeedPagination } = load("lib/utils/feedPagination.ts");
const category = load("lib/utils/categoryFeed.ts");
const filters = load("lib/utils/postFilterQuery.ts");
const categoryId = "6aeb198b01147912a8369397";
const items = (count) =>
  Array.from({ length: count }, (_, index) => ({ _id: String(index) }));

test("a full category page loads page two and deduplicates overlapping results", async () => {
  const paging = new FeedPagination(items(20), 20);
  let requested;
  await paging.load(async (page) => {
    requested = page;
    return [{ _id: "19" }, { _id: "20" }];
  });
  assert.equal(requested, 2);
  assert.equal(paging.snapshot().items.length, 21);
  assert.equal(paging.snapshot().hasMore, false);
});

test("concurrent requests are blocked; failure retains content and retries the same page", async () => {
  const paging = new FeedPagination(items(10), 10);
  let finish;
  const first = paging.load(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await paging.load(() => assert.fail("duplicate request"));
  finish({ message: "Temporary outage" });
  await first;
  assert.equal(paging.snapshot().items.length, 10);
  assert.equal(paging.snapshot().page, 1);
  assert.equal(paging.snapshot().error, "Temporary outage");
  await paging.load(async (page) => {
    assert.equal(page, 2);
    return [];
  });
  assert.equal(paging.snapshot().error, "");
  assert.equal(paging.snapshot().hasMore, false);
});

test("old filter responses cannot replace a new feed or unlock its pending request", async () => {
  const paging = new FeedPagination(items(10), 10);
  let finishOld;
  let finishNew;
  const old = paging.load(
    () =>
      new Promise((resolve) => {
        finishOld = resolve;
      }),
  );
  paging.reset(items(10));
  const current = paging.load(
    () =>
      new Promise((resolve) => {
        finishNew = resolve;
      }),
  );
  finishOld([{ _id: "old-filter" }]);
  await old;
  assert.equal(paging.snapshot().loading, true);
  assert.equal(paging.snapshot().items.length, 10);
  finishNew([{ _id: "new-filter" }]);
  await current;
  assert.equal(paging.snapshot().items.at(-1)._id, "new-filter");
});

test("category query keeps route category and maps search and filters", () => {
  const query = category.buildCategoryFeedQuery(categoryId, {
    mainCategory: "ffffffffffffffffffffffff",
    q: "  test  ",
    primaryLanguage: categoryId,
    publicRating: "0",
    timeDuration: "one month",
    postDescription: "tutorial",
  });
  assert.equal(query.mainCategoryId, categoryId);
  assert.equal(query.searchText, "test");
  assert.equal(query.primaryLanguage, categoryId);
  assert.equal(query.publicRating, 0);
  assert.equal(query.resultTime, "one month");
  assert.equal(query.description, "tutorial");
  assert.throws(() =>
    category.buildCategoryFeedQuery(categoryId, { skill: "invalid" }),
  );
});

test("filter form hydrates URL values and can clear them while retaining search", () => {
  const defaults = filters.getPostFilterDefaults(
    `q=hello&primaryLanguage=${categoryId}&publicRating=4`,
  );
  assert.equal(defaults.primaryLanguage, categoryId);
  assert.equal(defaults.publicRating, 4);
  const query = filters.replacePostFilterParams(
    "q=hello&country=old&publicRating=4",
    filters.getPostFilterDefaults(""),
  );
  assert.equal(query, "q=hello");
});

test("category pages use the same authenticated category search on every page", async () => {
  const calls = [];
  const action = load("actions/category.action.ts", {
    "@/lib/utils/categoryFeed": category,
    "./tokenAndHeaders.action": {
      resolveViewerIdAction: async () => "authenticated-viewer",
    },
    "./search.action": {
      searchAction: async (query) => {
        calls.push(query);
        return { status: "7400", response: [] };
      },
    },
  });
  const query = category.buildCategoryFeedQuery(categoryId, {
    q: "test",
    primaryLanguage: categoryId,
  });
  await action.getCategoryPostsAction(query, 1);
  await action.getCategoryPostsAction(query, 2);
  for (const call of calls) {
    assert.equal(call.mainCategoryId, categoryId);
    assert.equal(call.searchText, "test");
    assert.equal(call.primaryLanguage, categoryId);
    assert.equal(call.viewUserId, "authenticated-viewer");
    assert.equal(call.pageSize, 20);
    assert.equal(call.searchType, "ALL");
  }
  assert.deepEqual(
    calls.map((call) => call.pageNo),
    [1, 2],
  );
  assert.equal((await action.getCategoryPostsAction(query, 0)).status, 400);
  assert.equal(calls.length, 2);
});

test("category failures remain retryable errors and auth redirects propagate", async () => {
  const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/sign-in;307;",
  });
  for (const failure of [new Error("offline"), redirect]) {
    const action = load("actions/category.action.ts", {
      "@/lib/utils/categoryFeed": category,
      "./tokenAndHeaders.action": {
        resolveViewerIdAction: async () => {
          throw failure;
        },
      },
      "./search.action": {},
    });
    if (failure === redirect)
      await assert.rejects(
        action.getCategoryPostsAction({ mainCategoryId: categoryId }),
        (error) => error === redirect,
      );
    else
      assert.equal(
        (await action.getCategoryPostsAction({ mainCategoryId: categoryId }))
          .status,
        500,
      );
  }
});

test("shared feed loads subsequent pages through the shared endpoint", async () => {
  const calls = [];
  const shared = load("app/(root)/share-feed/feed.tsx", {
    react: { useCallback: (fn) => fn },
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    "@/components/widgets/feed/PaginatedPostFeed": {},
    "@/lib/utils/categoryFeed": category,
    "@/actions/post.action": {
      getAllSharesAction: async (...args) => {
        calls.push(args);
        return [];
      },
    },
  });
  const rendered = shared.default({ initialPosts: [] });
  await rendered.props.loadPage(2);
  assert.deepEqual(calls, [[2, 10]]);
});

test("category search sends all filters and zero rating with freshly resolved auth", async () => {
  let request;
  const search = load(
    "actions/search.action.tsx",
    {
      "@/components/cards/AllTalentsCard": {},
      "@/lib/utils/explore": load("lib/utils/explore.ts"),
      "./tokenAndHeaders.action": {
        resolveViewerIdAction: async () => "viewer",
      },
      "next/cache": {},
      "@/lib/session": {
        getAuthHeaders: async () => ({ Authorization: "Bearer fresh-token" }),
      },
    },
    {
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      fetch: async (url, options) => {
        request = { url, options };
        return {
          ok: true,
          json: async () => ({ status: "7400", response: [] }),
        };
      },
    },
  );
  await search.searchAction({
    ...category.buildCategoryFeedQuery(categoryId, {
      q: "TE WEB",
      publicRating: "0",
      primaryLanguage: categoryId,
    }),
    searchType: "ALL",
    viewUserId: "viewer",
    pageNo: 2,
    pageSize: 20,
  });
  const params = new URL(request.url).searchParams;
  for (const [key, value] of Object.entries({
    mainCategoryId: categoryId,
    searchText: "TE WEB",
    publicRating: "0",
    primaryLanguage: categoryId,
    pageNo: "2",
    pageSize: "20",
    viewUserId: "viewer",
  })) {
    assert.equal(params.get(key), value);
  }
  assert.equal(request.options.headers.Authorization, "Bearer fresh-token");
});
