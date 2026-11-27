const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const id = "6aff08a32e63b493d0e6e337";
const viewer = "6aff08a32e63b493d0e6e338";
const role = "6aff08a32e63b493d0e6e339";
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
      ...globals,
    },
  );
  return testModule.exports;
}
const utils = load("lib/utils/collaboration.ts");
const workflow = load("lib/utils/collaboration-workflow.ts", {
  "./collaboration": utils,
  "./collaboration-editor": load("lib/utils/collaboration-editor.ts"),
});
const item = (key = id) => ({
  collaboration: { _id: key, title: "Project" },
  owner: { _id: viewer, userName: "artist" },
});
const rows = (count = 20) =>
  Array.from({ length: count }, (_, i) =>
    item(i.toString(16).padStart(24, "0")),
  );
const ok = (response = []) => ({ status: "7400", response });
function api(
  responses = [],
  authError,
  account = { _id: viewer, isTalent: true },
) {
  const calls = [];
  const logs = [];
  let authCalls = 0;
  const transport = (method) => async (url, bodyOrConfig, config) => {
    const options = config || bodyOrConfig;
    if (url.endsWith("/user/") && account !== null)
      return { status: 200, data: ok(account) };
    calls.push({
      method,
      url,
      options,
      body: config ? bodyOrConfig : undefined,
    });
    const result = responses.shift();
    if (result instanceof Error) throw result;
    if (result?.httpStatus >= 400) {
      const error = new Error("HTTP error");
      error.config = { headers: { Authorization: "Bearer must-never-log" } };
      error.response = { data: result };
      throw error;
    }
    return { status: 200, data: result };
  };
  const actions = load(
    "actions/collaboration.action.tsx",
    {
      "@/lib/utils/collaboration": utils,
      "@/lib/utils/collaboration-workflow": workflow,
      "@/lib/session": {
        getAuthHeaders: async () => {
          authCalls++;
          if (authError) throw authError;
          return { Authorization: "Bearer fresh-private-token" };
        },
      },
      "jwt-decode": {
        jwtDecode: (token) => {
          assert.equal(token, "fresh-private-token");
          return { sub: viewer };
        },
      },
      axios: {
        get: transport("GET"),
        post: transport("POST"),
        patch: transport("PATCH"),
        delete: transport("DELETE"),
      },
    },
    {
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      console: {
        log: (...values) => logs.push(values),
        error: (...values) => logs.push(values),
      },
    },
  );
  return { actions, calls, logs, authCalls: () => authCalls };
}
test("dashboard tabs match mobile endpoints and derive applicant identity from fresh auth", async () => {
  const h = api(Array.from({ length: 5 }, () => ok([])));
  for (const type of utils.collaborationTabs)
    assert.equal(
      (await h.actions.getCollaborationListAction({ type })).status,
      "7400",
    );
  assert.deepEqual(
    h.calls.map((call) => new URL(call.url).pathname),
    [
      "/collaboration/open",
      "/collaboration",
      "/collaboration",
      "/collaboration/my",
      "/collaboration",
    ],
  );
  for (const [index, call] of h.calls.entries()) {
    assert.equal(
      call.options.headers.Authorization,
      "Bearer fresh-private-token",
    );
    assert.equal(call.options.timeout, 15000);
    if ([1, 2, 4].includes(index))
      assert.equal(call.options.params.userId, viewer);
    assert.ok(!call.url.includes("fresh-private-token"));
  }
  assert.equal(h.logs.length, 0);
  assert.equal(h.calls.length, 5);
});
test("applied filters and page bounds are sent without caller-controlled identity", async () => {
  const h = api([ok([item()])]);
  const result = await h.actions.getCollaborationListAction({
    type: "RECEIVED",
    userId: "someone-else",
    pageNo: 2,
    pageSize: 20,
    filters: {
      keywords: " Art & film ",
      country: "Sri Lanka",
      state: "Western",
      languageId: role,
      mainCategoryId: id,
    },
  });
  assert.equal(result.status, "7400");
  const params = h.calls[0].options.params;
  assert.equal(params.keywords, "Art & film");
  assert.equal(params.country, "Sri Lanka");
  assert.equal(params.userId, viewer);
  assert.equal(params.pageNo, 2);
});
test("empty success differs from backend failure, malformed lists and outages", async () => {
  const h = api([
    ok([]),
    { status: "7401", message: "Unavailable" },
    ok({ wrong: [] }),
    ok([{}]),
    new Error("Offline"),
  ]);
  assert.equal(
    (await h.actions.getCollaborationListAction({ type: "ALL" })).status,
    "7400",
  );
  for (let i = 0; i < 4; i++) {
    const result = await h.actions.getCollaborationListAction({ type: "ALL" });
    assert.equal(result.status, "400");
    assert.ok(result.message);
  }
  assert.equal(h.logs.length, 0);
});
test("wrapped collaboration lists and nested id aliases are accepted", async () => {
  const h = api([
    ok({ list: [item()] }),
    { status: "7400", data: [{ collaboration: { id } }] },
  ]);
  assert.equal(
    (await h.actions.getCollaborationListAction({ type: "MY" })).response
      .length,
    1,
  );
  assert.equal(
    (await h.actions.getCollaborationListAction({ type: "MY" })).response
      .length,
    1,
  );
});
test("invalid tabs, identifiers, enums and pagination never request auth or backend", async () => {
  const h = api();
  for (const query of [
    { type: "UNKNOWN" },
    { type: "ALL", pageNo: 0 },
    { type: "ALL", pageSize: 101 },
    { type: "ALL", filters: { mainCategoryId: "../bad" } },
    { type: "ALL", filters: { gender: "invalid" } },
  ])
    assert.equal(
      (await h.actions.getCollaborationListAction(query)).status,
      "400",
    );
  await h.actions.getCollaborationDetailsAction("bad");
  await h.actions.deleteCollaborationAction("bad");
  await h.actions.getCollaborationApplicantsStatsAction("bad");
  await h.actions.getCollaborationApplicantsRoleStatsAction(id, "bad");
  await h.actions.getCollaborationApplicantDetailsAction(id, "bad");
  await h.actions.getCollaborationApplicantsAction(id, { pageNo: 0 });
  await h.actions.getCollaborationApplicantsAction(id, { filter: "UNKNOWN" });
  await h.actions.searchCollaborationPeopleAction({ userRating: 6 });
  assert.equal(h.calls.length, 0);
  assert.equal(h.authCalls(), 0);
});
const createPayload = {
  collaboration: { title: "Project" },
  collaboratorRoles: [{ name: "Actor" }],
};
const validCalls = (actions) => [
  () => actions.getCurrentCollaborationUserAction(),
  () => actions.getCollaborationListAction({ type: "ALL" }),
  () => actions.getCollaborationDetailsAction(id),
  () => actions.deleteCollaborationAction(id),
  () =>
    actions.applyToCollaborationRoleAction(id, {
      collaborationRoleId: role,
      applicantEmail: "artist@example.test",
      applicantName: "Artist",
      resumeFileUrl: "https://example.test/resume.pdf",
      resumeFileKey: "resume.pdf",
    }),
  () =>
    actions.respondCollaborationInviteAction(id, {
      collaborationRoleId: role,
      action: "ACCEPT",
    }),
  () => actions.getCollaborationApplicantsStatsAction(id),
  () => actions.getCollaborationApplicantsRoleStatsAction(id, role),
  () => actions.getCollaborationApplicantsAction(id),
  () =>
    actions.reviewCollaborationApplicantAction(id, {
      collaborationRoleId: role,
      applicantId: viewer,
      action: "SHORTLIST",
    }),
  () => actions.getCollaborationApplicantDetailsAction(id, role),
  () => actions.searchCollaborationPeopleAction(),
  () => actions.createCollaborationAction(createPayload),
  () =>
    actions.updateCollaborationAction(id, {
      collaboration: { title: "Updated" },
      deleteRoleIds: [role],
    }),
  () =>
    actions.invitePeopleToCollaborationAction(id, {
      invites: [{ collaborationRoleId: role, applicantId: viewer }],
    }),
];
test("every collaboration action preserves session-refresh redirects", async () => {
  const redirect = new Error("redirect");
  redirect.digest = "NEXT_REDIRECT;replace;/auth/refresh;307;";
  const h = api([], redirect);
  for (const invoke of validCalls(h.actions))
    await assert.rejects(invoke(), (error) => error === redirect);
  assert.equal(h.calls.length, 0);
  assert.equal(h.logs.length, 0);
});
test("normal and unverified account types cannot access any collaboration operation", async () => {
  for (const isTalent of [false, undefined, "true", 1]) {
    const h = api([], undefined, { _id: viewer, isTalent });
    for (const invoke of validCalls(h.actions)) {
      try {
        const result = await invoke();
        assert.notEqual(result?.status, "7400");
      } catch (error) {
        assert.match(error.message, /Unable to load/);
      }
    }
    assert.equal(
      h.calls.length,
      0,
      "No collaboration endpoint should be called",
    );
  }
});
test("the current profile is fetched with fresh headers and exposes no token fields", async () => {
  const h = api(
    [
      ok({
        _id: viewer,
        isTalent: true,
        userName: "artist",
        email: "artist@example.test",
        accessToken: "private",
        refreshToken: "private",
        password: "private",
      }),
    ],
    undefined,
    null,
  );
  const user = await h.actions.getCurrentCollaborationUserAction();
  assert.equal(user._id, viewer);
  assert.equal(user.userName, "artist");
  assert.equal(user.accessToken, undefined);
  assert.equal(user.password, undefined);
  assert.equal(user.refreshToken, undefined);
  assert.equal(h.logs.length, 0);
  assert.equal(new URL(h.calls[0].url).pathname, "/user/");
});
test("profile outage or mismatched identity becomes a retryable error, never a signed-out result", async () => {
  const h = api(
    [new Error("Offline"), ok({ _id: id }), { status: "7401" }],
    undefined,
    null,
  );
  for (let i = 0; i < 3; i++)
    await assert.rejects(
      h.actions.getCurrentCollaborationUserAction(),
      /Unable to load your collaboration profile/,
    );
  assert.equal(h.logs.length, 0);
});
test("invalid role invitations, reviews and applications are rejected before sending writes", async () => {
  const h = api();
  await h.actions.applyToCollaborationRoleAction(id, {
    collaborationRoleId: "bad",
  });
  await h.actions.applyToCollaborationRoleAction(id, {
    collaborationRoleId: role,
    applicantEmail: "invalid",
  });
  await h.actions.respondCollaborationInviteAction(id, {
    collaborationRoleId: role,
    action: "UNKNOWN",
  });
  await h.actions.reviewCollaborationApplicantAction(id, {
    collaborationRoleId: role,
    applicantId: "bad",
    action: "ACCEPT",
  });
  await h.actions.invitePeopleToCollaborationAction(id, { invites: [] });
  await h.actions.invitePeopleToCollaborationAction(id, {
    invites: [{ collaborationRoleId: "bad", applicantId: viewer }],
  });
  await h.actions.createCollaborationAction({
    collaboration: { title: "" },
    collaboratorRoles: [],
  });
  await h.actions.updateCollaborationAction(id, {
    collaboration: { title: "Title" },
    deleteRoleIds: ["bad"],
  });
  assert.equal(h.calls.length, 0);
  assert.equal(h.authCalls(), 0);
});
test("valid application and invitation payloads retain mobile endpoints and HTTP failures cannot report success", async () => {
  const h = api([ok({}), ok({}), { status: "7400", httpStatus: 500 }]);
  assert.equal(
    (
      await h.actions.applyToCollaborationRoleAction(id, {
        collaborationRoleId: role,
        applicantEmail: "artist@example.test",
        applicantName: "Artist",
        resumeFileUrl: "https://example.test/resume.pdf",
        resumeFileKey: "resume.pdf",
        message: " Hello ",
      })
    ).status,
    "7400",
  );
  assert.equal(
    (
      await h.actions.respondCollaborationInviteAction(id, {
        collaborationRoleId: role,
        action: "DECLINE",
      })
    ).status,
    "7400",
  );
  assert.equal((await h.actions.deleteCollaborationAction(id)).status, "400");
  assert.equal(h.calls[0].body.message, "Hello");
  assert.equal(
    new URL(h.calls[1].url).pathname,
    `/collaboration/${id}/invite/respond`,
  );
  assert.equal(h.logs.length, 0);
});

test("applicant and invitation people reads reject malformed successful responses", async () => {
  const h = api([
    ok({}),
    ok([{}]),
    ok({ list: [{ applicationId: id }] }),
    ok([{ id: viewer }]),
  ]);
  assert.equal(
    (await h.actions.getCollaborationApplicantsAction(id)).status,
    "400",
  );
  assert.equal(
    (await h.actions.searchCollaborationPeopleAction()).status,
    "400",
  );
  assert.equal(
    (await h.actions.getCollaborationApplicantsAction(id)).response[0]
      .applicationId,
    id,
  );
  assert.equal(
    (await h.actions.searchCollaborationPeopleAction()).response[0].id,
    viewer,
  );
});

test("dashboard keeps each tab lazy and preserves an initial failed list as an error", () => {
  const controller = new utils.CollaborationPages({
    status: "400",
    response: [],
    message: "Offline",
  });
  const state = controller.snapshot();
  assert.equal(state.ALL.error, "Offline");
  assert.equal(state.ALL.loaded, false);
  for (const tab of utils.collaborationTabs.slice(1))
    assert.equal(state[tab].loaded, false);
});
test("page failures retain existing content, block duplicate requests, and retry the same page", async () => {
  const controller = new utils.CollaborationPages(ok(rows()));
  let finish;
  const pages = [];
  const pending = controller.load("ALL", (query) => {
    pages.push(query.pageNo);
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  await controller.load("ALL", async (query) => {
    pages.push(query.pageNo);
    return ok([]);
  });
  finish({ status: "400", message: "Offline", response: [] });
  await pending;
  assert.equal(controller.snapshot().ALL.items.length, 20);
  assert.equal(controller.snapshot().ALL.hasMore, true);
  await controller.load("ALL", async (query) => {
    pages.push(query.pageNo);
    return ok([rows()[0], item()]);
  });
  assert.deepEqual(pages, [2, 2]);
  assert.equal(controller.snapshot().ALL.items.length, 21);
});
test("tab requests are independent and response deduplication uses collaboration ids", async () => {
  const controller = new utils.CollaborationPages(ok([]));
  let finish;
  const old = controller.load(
    "RECEIVED",
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await controller.load("MY", async (query) => {
    assert.equal(query.type, "MY");
    return ok([item(viewer), item(viewer)]);
  });
  assert.equal(controller.snapshot().MY.items.length, 1);
  assert.equal(controller.snapshot().RECEIVED.loading, true);
  finish(ok([item()]));
  await old;
  assert.equal(controller.snapshot().RECEIVED.items[0].collaboration._id, id);
});
test("editing a draft cannot change the applied filters used for load-more requests", async () => {
  const controller = new utils.CollaborationPages(ok([]));
  const draft = { keywords: "old" };
  controller.prepare("ALL", draft);
  await controller.load("ALL", async () => ok(rows()));
  draft.keywords = "new";
  await controller.load("ALL", async (query) => {
    assert.equal(query.filters.keywords, "old");
    assert.equal(query.pageNo, 2);
    return ok([]);
  });
});
test("applying or resetting filters invalidates earlier responses and starts at page one", async () => {
  const controller = new utils.CollaborationPages(ok([]));
  let finishOld;
  let finishNew;
  controller.prepare("ALL", { keywords: "old" });
  const old = controller.load(
    "ALL",
    () =>
      new Promise((resolve) => {
        finishOld = resolve;
      }),
  );
  controller.prepare("ALL", {});
  const current = controller.load("ALL", (query) => {
    assert.equal(query.pageNo, 1);
    assert.equal(query.filters.keywords, undefined);
    return new Promise((resolve) => {
      finishNew = resolve;
    });
  });
  finishOld(ok([item(id)]));
  await old;
  assert.equal(controller.snapshot().ALL.items.length, 0);
  assert.equal(controller.snapshot().ALL.loading, true);
  finishNew(ok([item(viewer)]));
  await current;
  assert.equal(controller.snapshot().ALL.items[0].collaboration._id, viewer);
});
test("refresh retains confirmed rows during an outage and retries page one", async () => {
  const controller = new utils.CollaborationPages(ok([item()]));
  controller.prepare("ALL");
  await controller.load("ALL", async (query) => {
    assert.equal(query.pageNo, 1);
    return { status: "400", response: [], message: "Offline" };
  });
  assert.equal(controller.snapshot().ALL.items.length, 1);
  await controller.load("ALL", async (query) => {
    assert.equal(query.pageNo, 1);
    return ok([]);
  });
  assert.equal(controller.snapshot().ALL.items.length, 0);
  assert.equal(controller.snapshot().ALL.loaded, true);
});

function hooks() {
  const cells = [];
  let cursor = 0;
  let effects = [];
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
        return `control-${cursor++}`;
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
test("list hook loads only a selected unvisited tab and deduplicates rapid apply clicks", async () => {
  const state = hooks();
  const calls = [];
  let finish;
  const hook = load("lib/hooks/useCollaborationLists.ts", {
    react: state.react,
    "@/lib/utils/collaboration": utils,
    "@/actions/collaboration.action": {
      getCollaborationListAction: (query) => {
        calls.push(query);
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    },
  });
  const initial = ok([]);
  const render = () => state.render(() => hook.useCollaborationLists(initial));
  render();
  assert.equal(calls.length, 0);
  const pending = render().ensure("APPLIED");
  render().ensure("APPLIED");
  assert.equal(calls.length, 1);
  finish(ok([]));
  await pending;
  const applied = render().apply("APPLIED", { keywords: "new" });
  render().apply("APPLIED", { keywords: "new" });
  assert.equal(calls.length, 2);
  finish(ok([]));
  await applied;
});
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
test("dashboard renders retry on failure, and reset submits new empty filters immediately", async () => {
  const state = hooks();
  const calls = [];
  const tabs = Object.fromEntries(
    utils.collaborationTabs.map((tab) => [
      tab,
      {
        items: [],
        loaded: false,
        loading: false,
        error: "Offline",
        filters: {},
      },
    ]),
  );
  const component = load(
    "components/widgets/collaboration/CollaborationDashboard.tsx",
    {
      react: state.react,
      "react/jsx-runtime": jsx,
      "./CollaborationCard": {},
      "@/components/inputs/SearchLookupSelect": {},
      "@/components/ui/button": { Button: "button" },
      "@/components/ui/input": { Input: "input" },
      "next/link": {},
      "@/lib/utils/collaboration": utils,
      "@/constants": {
        GENDER_VALUES: [],
        LEVEL_VALUES: [],
        TIME_DURATION_FILTERS: [],
      },
      "@/lib/hooks/useCollaborationLists": {
        useCollaborationLists: () => ({
          tabs,
          ensure() {},
          refresh() {},
          load() {},
          apply: (tab, filters) => calls.push({ tab, filters }),
        }),
      },
    },
  ).default;
  const render = () =>
    state.render(() =>
      component({
        currentUser: { userName: "artist" },
        initialResult: { status: "400", response: [], message: "Offline" },
      }),
    );
  assert.ok(find(render(), (node) => node.props?.role === "alert"));
  find(render(), (node) => node.type === "input").props.onChange({
    target: { value: "old" },
  });
  find(render(), (node) => node.props?.children === "Show Filters").props.onClick();
  const back = find(render(), (node) => node.props?.children === "Back to results");
  assert.equal(back.props.type, "button");
  back.props.onClick();
  assert.ok(find(render(), (node) => node.props?.children === "Show Filters"));
  assert.equal(find(render(), (node) => node.type === "input").props.value, "old");
  assert.equal(calls.length, 0, "Closing filters must not apply or clear selections");
  find(
    render(),
    (node) => node.type === "button" && node.props.children === "Reset filters",
  ).props.onClick();
  assert.equal(calls[0].filters.keywords, undefined);
  assert.equal(find(render(), (node) => node.type === "input").props.value, "");
});
test("the server dashboard preserves list error status and requests only the initial tab", async () => {
  const calls = [];
  const page = load("app/(root)/collaboration/page.tsx", {
    "react/jsx-runtime": jsx,
    "@/components/widgets/collaboration/CollaborationDashboard": {},
    "@/actions/collaboration.action": {
      getCurrentCollaborationUserAction: async () => ({ _id: viewer }),
      getCollaborationListAction: async (query) => {
        calls.push(query);
        return { status: "400", response: [], message: "Offline" };
      },
    },
  }).default;
  const tree = await page();
  assert.equal(tree.props.initialResult.status, "400");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, "ALL");
});
