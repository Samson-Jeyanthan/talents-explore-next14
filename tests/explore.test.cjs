const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const id = "6aff08a32e63b493d0e6e337";
const viewer = "6aff08a32e63b493d0e6e338";
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
      AbortSignal,
      URLSearchParams,
      setTimeout,
      clearTimeout,
      ...globals,
    },
  );
  return testModule.exports;
}
const utils = load("lib/utils/explore.ts");
const { FeedPagination } = load("lib/utils/feedPagination.ts");
const record = (key = id) => ({ _id: key, about: { title: "Example" } });
function api(responses = [], authError) {
  const calls = [];
  const actions = load(
    "actions/search.action.tsx",
    {
      "@/lib/utils/explore": utils,
      "@/lib/session": {
        getAuthHeaders: async () => {
          if (authError) throw authError;
          return { Authorization: "Bearer fresh-session" };
        },
      },
      "./tokenAndHeaders.action": {
        resolveViewerIdAction: async () => {
          if (authError) throw authError;
          return viewer;
        },
      },
    },
    {
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      fetch: async (url, options) => {
        calls.push({ url, options });
        const result = responses.shift();
        if (result instanceof Error) throw result;
        return {
          ok: !result.httpStatus,
          status: result.httpStatus || 200,
          json: async () => result,
        };
      },
    },
  );
  return { actions, calls };
}
test("ALL, FEED, SHARE and TALENT use fresh viewer identity and never include supplied tokens", async () => {
  const h = api(
    Array.from({ length: 4 }, () => ({ status: "7400", response: [] })),
  );
  for (const searchType of ["ALL", "FEED", "SHARE", "TALENT"]) {
    assert.equal(
      (
        await h.actions.searchAction({
          searchType,
          pageNo: 1,
          pageSize: 20,
          viewUserId: "secret.access.token",
        })
      ).status,
      "7400",
    );
  }
  for (const call of h.calls) {
    assert.equal(new URL(call.url).searchParams.get("viewUserId"), viewer);
    assert.ok(!call.url.includes("secret.access.token"));
    assert.equal(call.options.headers.Authorization, "Bearer fresh-session");
    assert.equal(call.options.cache, "no-store");
  }
  assert.equal(new URL(h.calls[3].url).searchParams.get("userId"), viewer);
});
test("all supported post filters, including zero rating and special characters, reach the API", async () => {
  const h = api([{ status: "7400", response: [] }]);
  const input = {
    searchType: "SHARE",
    pageNo: 2,
    pageSize: 20,
    searchText: "Art & music + film",
    mainCategoryId: id,
    subCategoryId: id,
    skillId: id,
    level: "advanced",
    primaryLanguage: id,
    secondaryLanguage: viewer,
    publicRating: 0,
    privateRating: 3,
    keywords: ["camera", "creative art"],
    description: "A & B",
    country: "Sri Lanka",
    state: "Western",
    creditTitle: "Director",
    creditPeopleTag: id,
    resultTime: "six month",
  };
  await h.actions.searchAction(input);
  const params = new URL(h.calls[0].url).searchParams;
  for (const [key, value] of Object.entries(input))
    assert.equal(
      params.get(key),
      Array.isArray(value) ? value.join(",") : String(value),
    );
});
test("talent query maps URL filters and does not accidentally apply post-only rating or language", () => {
  const query = utils.buildExploreQuery(
    "TALENT",
    `q=actor&profileRating=4&gender=female&userEthnicity=${id}&userLanguage=${viewer}&mainCategory=${id}&creditTitle=Producer&publicRating=5&primaryLanguage=${id}`,
  );
  assert.equal(query.userRating, 4);
  assert.equal(query.userGender, "female");
  assert.equal(query.ethnic, id);
  assert.equal(query.userLanguage, viewer);
  assert.equal(query.mainCategoryId, id);
  assert.equal(query.creditTitle, "Producer");
  assert.equal(query.publicRating, undefined);
  assert.equal(query.primaryLanguage, undefined);
});
test("legacy filter aliases map correctly and absent numeric filters are omitted", () => {
  const query = utils.buildExploreQuery(
    "FEED",
    `q=%20hello%20&mainCategoryId=${id}&subCategoryId=${viewer}&description=Film&resultTime=one+year`,
  );
  assert.equal(query.mainCategoryId, id);
  assert.equal(query.subCategoryId, viewer);
  assert.equal(query.description, "Film");
  assert.equal(query.resultTime, "one year");
  assert.equal(query.searchText, "hello");
  assert.equal(query.publicRating, undefined);
});
test("filter apply, clear and tab switching preserve search text and reset pagination", () => {
  const original = `q=Art+%26+film&publicRating=4&mainCategoryId=${id}&page=3&pageNo=4`;
  const values = utils.getExploreFilterValues(original);
  assert.equal(values.mainCategory, id);
  values.creditTitle = "Music & sound";
  const applied = new URLSearchParams(
    utils.replaceExploreFilters(original, values),
  );
  assert.equal(applied.get("q"), "Art & film");
  assert.equal(applied.get("mainCategory"), id);
  assert.equal(applied.get("mainCategoryId"), null);
  assert.equal(applied.get("page"), null);
  const cleared = new URLSearchParams(utils.clearExploreFilters(original));
  assert.equal(cleared.get("q"), "Art & film");
  assert.equal(cleared.get("publicRating"), null);
  const tab = new URL(
    utils.exploreTabHref("/explore/shared", original),
    "https://site.test",
  );
  assert.equal(tab.searchParams.get("q"), "Art & film");
  assert.equal(tab.searchParams.get("publicRating"), "4");
  assert.equal(tab.searchParams.get("pageNo"), null);
});
test("malformed filters, target IDs and page bounds cannot reach backend", async () => {
  const h = api();
  for (const input of [
    { searchType: "UNKNOWN" },
    { pageNo: 0 },
    { pageSize: 101 },
    { publicRating: NaN },
    { userRating: 6 },
    { mainCategoryId: "../bad" },
    { resultTime: "tomorrow" },
  ]) {
    assert.notEqual(
      (
        await h.actions.searchAction({
          searchType: "ALL",
          pageNo: 1,
          pageSize: 20,
          ...input,
        })
      ).status,
      "7400",
    );
  }
  assert.equal(h.calls.length, 0);
  assert.throws(() =>
    utils.buildExploreQuery("FEED", "publicRating=not-a-rating"),
  );
});
test("empty results differ from malformed payloads, HTTP failures and outages", async () => {
  const h = api([
    { status: "7400", response: [] },
    { status: "7400", response: null },
    { status: "7400", response: [{}] },
    { status: "7400", response: [], httpStatus: 500 },
    new Error("Offline"),
  ]);
  assert.equal(
    (
      await h.actions.searchAction({
        searchType: "ALL",
        pageNo: 1,
        pageSize: 20,
      })
    ).status,
    "7400",
  );
  for (let i = 0; i < 4; i++) {
    const result = await h.actions.searchAction({
      searchType: "ALL",
      pageNo: 1,
      pageSize: 20,
    });
    assert.notEqual(result.status, "7400");
    assert.ok(result.message);
  }
});
test("refresh redirects survive results, people lookup and filter lookup", async () => {
  const redirect = new Error("redirect");
  redirect.digest = "NEXT_REDIRECT;replace;/sign-in;307;";
  const h = api([], redirect);
  for (const pending of [
    h.actions.searchAction({ searchType: "ALL", pageNo: 1, pageSize: 20 }),
    h.actions.searchPeopleTag(viewer, "Artist", 1, 5),
    h.actions.getExploreFilterOptionsAction("languages"),
  ])
    await assert.rejects(pending, (error) => error === redirect);
});
test("people lookup encodes special characters, derives identity and respects requested page size", async () => {
  const h = api([{ status: "7400", response: [record()] }]);
  await h.actions.searchPeopleTag("secret.token", "  A&B + artist  ", 2, 5);
  const params = new URL(h.calls[0].url).searchParams;
  assert.equal(params.get("filter"), "A&B + artist");
  assert.equal(params.get("pageSize"), "5");
  assert.equal(params.get("pageNo"), "2");
  assert.equal(params.get("userId"), viewer);
  await h.actions.searchPeopleTag(viewer, "   ", 1, 5);
  assert.equal(h.calls.length, 1);
});
test("shared category metadata uses mobile shared endpoints and wrapped data is readable", async () => {
  const h = api([
    { status: "7400", response: { list: [{ _id: id, name: "Music" }] } },
    { status: "7400", response: [{ _id: id, name: "Film" }] },
    { status: "7400", response: [{ _id: id, name: "Lighting" }] },
  ]);
  assert.equal(
    (await h.actions.getExploreFilterOptionsAction("categories", "", true))
      .data[0].label,
    "Music",
  );
  await h.actions.getExploreFilterOptionsAction("subcategories", id, true);
  await h.actions.getExploreFilterOptionsAction("skills", id, true);
  assert.deepEqual(
    h.calls.map((call) => new URL(call.url).pathname),
    [
      "/category/mainCategory/shared",
      `/category/subCategory/shared/${id}`,
      `/category/skill/shared/${id}`,
    ],
  );
});
test("ethnicity uses ethnicity data, languages use language IDs, countries and states use names", async () => {
  const h = api([
    { status: "7400", response: [{ _id: id, ethnic: "Example ethnicity" }] },
    { status: "7400", response: [{ _id: id, language: "Tamil" }] },
    { status: "7400", response: [{ country: "Sri Lanka" }] },
    { status: "7400", response: [{ state: "Western" }] },
  ]);
  assert.equal(
    (await h.actions.getExploreFilterOptionsAction("ethnic")).data[0].value,
    id,
  );
  assert.equal(
    (await h.actions.getExploreFilterOptionsAction("languages")).data[0].label,
    "Tamil",
  );
  assert.equal(
    (await h.actions.getExploreFilterOptionsAction("countries")).data[0].value,
    "Sri Lanka",
  );
  assert.equal(
    (await h.actions.getExploreFilterOptionsAction("states", "Sri Lanka"))
      .data[0].value,
    "Western",
  );
  assert.equal(new URL(h.calls[3].url).pathname, "/country/states/Sri%20Lanka");
});
test("invalid lookup kinds and missing dependent selections never reach backend", async () => {
  const h = api();
  for (const [kind, parent] of [
    ["unknown", ""],
    ["subcategories", ""],
    ["skills", "../bad"],
    ["states", ""],
  ])
    assert.equal(
      (await h.actions.getExploreFilterOptionsAction(kind, parent)).success,
      false,
    );
  assert.equal(h.calls.length, 0);
});
test("missing media, video previews and string/object shared thumbnails have safe image fallbacks", () => {
  assert.equal(
    utils.exploreThumbnail(record()),
    "/assets/images/default-save-folder.png",
  );
  assert.equal(
    utils.exploreThumbnail({
      _id: id,
      shareLinkThumbnail: { url: "https://image.test/share.jpg" },
    }),
    "https://image.test/share.jpg",
  );
  assert.equal(
    utils.exploreThumbnail({
      _id: id,
      shareLinkThumbnail: "https://image.test/string.jpg",
    }),
    "https://image.test/string.jpg",
  );
  assert.equal(
    utils.exploreThumbnail({
      _id: id,
      media: [
        { mediaType: "video", thumbnailUrl: "https://image.test/video.jpg" },
      ],
    }),
    "https://image.test/video.jpg",
  );
  assert.equal(
    utils.exploreThumbnail({
      _id: id,
      shareLinkThumbnail: "javascript:alert(1)",
    }),
    "/assets/images/default-save-folder.png",
  );
});

function hooks() {
  const cells = [];
  let cursor = 0;
  let effects = [];
  const changed = (a, b) =>
    !a || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
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
        const i = cursor++;
        return `search-${i}`;
      },
      useEffect(fn, deps) {
        const i = cursor++;
        if (changed(cells[i]?.deps, deps)) {
          const previous = cells[i];
          cells[i] = { deps };
          effects.push(() => {
            previous?.cleanup?.();
            cells[i].cleanup = fn();
          });
        }
      },
      useCallback(fn, deps) {
        const i = cursor++;
        if (changed(cells[i]?.deps, deps)) cells[i] = { deps, fn };
        return cells[i].fn;
      },
    },
    render(fn) {
      cursor = 0;
      const tree = fn();
      const pending = effects;
      effects = [];
      pending.forEach((fn) => fn());
      return tree;
    },
    unmount() {
      cells.forEach((cell) => cell?.cleanup?.());
    },
  };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return;
  if (Array.isArray(tree)) {
    for (const node of tree) {
      const found = find(node, predicate);
      if (found) return found;
    }
    return;
  }
  return predicate(tree) ? tree : find(tree.props?.children, predicate);
}
test("each result tab loads successive pages with unchanged filters and retries the same failed page", async () => {
  for (const type of ["ALL", "FEED", "SHARE", "TALENT"]) {
    const state = hooks();
    const calls = [];
    const query = utils.buildExploreQuery(type, "q=Music");
    const component = load("components/widgets/explore/ExploreResults.tsx", {
      react: state.react,
      "react/jsx-runtime": jsx,
      "@/lib/utils/feedPagination": { FeedPagination },
      "@/lib/utils/explore": utils,
      "@/components/cards/ExplorePostCard": {},
      "@/components/cards/AllTalentsCard": {},
      "@/components/ui/button": { Button: "button" },
      "@/actions/search.action": {
        searchAction: async (params) => {
          calls.push(params);
          return calls.length === 2
            ? { status: 500, message: "Offline" }
            : {
                status: "7400",
                response:
                  calls.length === 1
                    ? Array.from({ length: 20 }, (_, i) =>
                        record(i.toString(16).padStart(24, "0")),
                      )
                    : [record()],
              };
        },
      },
    }).default;
    const render = () => state.render(() => component({ query }));
    render();
    await flush();
    await find(render(), (node) => node.type === "button").props.onClick();
    assert.ok(find(render(), (node) => node.props?.role === "alert"));
    await find(render(), (node) => node.type === "button").props.onClick();
    assert.deepEqual(
      calls.map((call) => call.pageNo),
      [1, 2, 2],
    );
    assert.ok(
      calls.every(
        (call) =>
          call.searchType === type &&
          call.searchText === "Music" &&
          call.pageSize === 20,
      ),
    );
  }
});
test("changing search filters invalidates old results before the new request finishes", async () => {
  const pages = new FeedPagination([], 20, 0);
  let finishOld;
  let finishNew;
  const old = pages.load(
    () =>
      new Promise((resolve) => {
        finishOld = resolve;
      }),
  );
  pages.reset([]);
  const current = pages.load(
    () =>
      new Promise((resolve) => {
        finishNew = resolve;
      }),
  );
  finishOld([record(id)]);
  await old;
  assert.equal(pages.snapshot().loading, true);
  assert.equal(pages.snapshot().items.length, 0);
  finishNew([record(viewer)]);
  await current;
  assert.equal(pages.snapshot().items[0]._id, viewer);
});
function people() {
  const state = hooks();
  const timers = new Map();
  let timerId = 0;
  const calls = [];
  const replies = [];
  const props = { query: "artist", viewer };
  const hook = load(
    "lib/hooks/usePeopleSearch.ts",
    {
      react: state.react,
      "@/actions/search.action": {
        searchPeopleTag: async (...args) => {
          calls.push(args);
          return new Promise((resolve) => replies.push(resolve));
        },
      },
    },
    {
      setTimeout: (fn) => {
        timers.set(++timerId, fn);
        return timerId;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  );
  const render = () =>
    state.render(() => hook.usePeopleSearch(props.query, props.viewer));
  render();
  const run = () => {
    const pending = [...timers.values()];
    timers.clear();
    pending.forEach((fn) => fn());
  };
  return { render, props, run, calls, replies, unmount: state.unmount };
}
test("people search debounces input and ignores responses for old terms", async () => {
  const h = people();
  assert.equal(h.calls.length, 0);
  h.run();
  h.props.query = "new artist";
  h.render();
  h.run();
  assert.equal(h.calls.length, 2);
  h.replies[0]({ status: "7400", response: [record(id)] });
  await flush();
  assert.equal(h.render().items.length, 0);
  h.replies[1]({
    status: "7400",
    response: [
      {
        _id: viewer,
        userName: "newArtist",
        personalInfo: { firstName: "New" },
      },
    ],
  });
  await flush();
  assert.equal(h.render().items[0]._id, viewer);
  assert.equal(h.render().items[0].firstName, "New");
  assert.equal(h.calls[1][3], 5);
});
test("clearing or unmounting people search rejects late results and failures can be retried", async () => {
  const h = people();
  h.run();
  h.replies[0]({ status: 500, message: "Offline" });
  await flush();
  assert.equal(h.render().error, "Offline");
  h.render().retry();
  h.render();
  h.run();
  h.props.query = "";
  h.render();
  h.replies[1]({ status: "7400", response: [record()] });
  await flush();
  assert.equal(h.render().items.length, 0);
  assert.equal(h.render().loading, false);
  h.props.query = "again";
  h.render();
  h.run();
  h.unmount();
  h.replies[2]({ status: "7400", response: [record()] });
  await flush();
  assert.equal(h.render().items.length, 0);
});
test("removing a person tag returns an array and external form resets synchronize tags", () => {
  const state = hooks();
  const changes = [];
  let values = [{ _id: id, firstName: "Artist", lastName: "" }];
  const component = load("components/inputs/UserTagAndSearch.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "next/link": {},
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "@/components/ui/input": {},
    "@/context/AuthProvider": {
      useUserContext: () => ({ user: { currentUserId: viewer } }),
    },
    "../others/UserProfileImg": {},
    "react-icons/ci": {},
    "lucide-react": {},
    "@/lib/hooks/usePeopleSearch": {
      usePeopleSearch: () => ({
        items: [],
        loading: false,
        error: "",
        retry() {},
      }),
    },
  }).default;
  const render = () =>
    state.render(() =>
      component({
        isTag: true,
        values,
        fieldChange: (value) => changes.push(value),
      }),
    );
  render();
  find(render(), (node) => node.type === "button").props.onClick();
  assert.ok(Array.isArray(changes[0]));
  assert.equal(changes[0].length, 0);
  values = [{ _id: viewer, firstName: "New", lastName: "" }];
  render();
  assert.ok(
    find(
      render(),
      (node) => node.props?.["aria-label"] === "Remove tag for New",
    ),
  );
});
