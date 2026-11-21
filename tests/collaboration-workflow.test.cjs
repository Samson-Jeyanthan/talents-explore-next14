const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const id = "6aff08a32e63b493d0e6e337",
  roleId = "6aff08a32e63b493d0e6e339",
  personId = "6aff08a32e63b493d0e6e340";
function load(file, mocks = {}, globals = {}) {
  const module = { exports: {} };
  const requireLocal = (name) => {
    if (name in mocks) return mocks[name];
    if (name.startsWith("@/") || name.startsWith(".")) {
      const base = name.startsWith("@/")
        ? name.slice(2)
        : path.join(path.dirname(file), name);
      const target = [base, base + ".ts", base + ".tsx"].find(
        (name) => fs.existsSync(name) && fs.statSync(name).isFile(),
      );
      if (target) return load(target, mocks, globals);
    }
    return require(name);
  };
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
      require: requireLocal,
      Error,
      URL,
      AbortSignal,
      console,
      ...globals,
    },
  );
  return module.exports;
}
const utils = load("lib/utils/collaboration-workflow.ts");
const validation = load("lib/utils/collaboration.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
const ok = (response) => ({ status: "7400", response });
const tick = () => new Promise((resolve) => setImmediate(resolve));
function hooks() {
  const cells = [];
  let cursor = 0,
    effects = [];
  const changed = (a, b) =>
    !a ||
    a.length !== b.length ||
    a.some((value, i) => !Object.is(value, b[i]));
  const react = {
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
    useMemo(fn, deps) {
      const i = cursor++;
      if (changed(cells[i]?.deps, deps)) cells[i] = { deps, value: fn() };
      return cells[i].value;
    },
    useCallback(fn, deps) {
      return react.useMemo(() => fn, deps);
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
  };
  return {
    react,
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
      const found = find(child, predicate);
      if (found) return found;
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
  "@/components/ui/textarea": { Textarea: "textarea" },
  "@/components/ui/dialog": Object.fromEntries(
    [
      "Dialog",
      "DialogContent",
      "DialogHeader",
      "DialogTitle",
      "DialogDescription",
      "DialogFooter",
    ].map((name) => [name, name]),
  ),
  "next/link": "link",
  "@/components/others/UserProfileImg": "avatar",
  "@/constants": {
    GENDER_VALUES: [],
    LEVEL_VALUES: [],
    TIME_DURATION_FILTERS: [],
  },
  "@/components/inputs/SearchLookupSelect": "lookup",
};
test("review transitions match mobile, including restore and pending invitation protection", () => {
  const actions = (status) =>
    plain(
      utils.reviewOptions({
        applicantStatus: status,
        applicantType: "APPLIED",
      }),
    ).map((item) => item.action);
  assert.deepEqual(actions("APPLIED"), ["ACCEPT"]);
  assert.deepEqual(actions("ACCEPTED"), ["SHORTLIST", "REJECT"]);
  assert.deepEqual(actions("SHORTLISTED"), ["FINALIZED", "ACCEPT", "REJECT"]);
  assert.deepEqual(actions("FINALIZED"), ["ACCEPT", "REJECT"]);
  assert.deepEqual(actions("REJECTED"), ["ACCEPT"]);
  assert.equal(
    utils.reviewOptions({
      applicantStatus: "APPLIED",
      applicantType: "INVITED",
    }).length,
    0,
  );
  assert.equal(
    utils.applicantStatusLabel({
      applicantStatus: "APPLIED",
      applicantType: "INVITED",
    }),
    "Invitation pending",
  );
  assert.equal(
    utils.applicantStatusLabel({ applicantStatus: "DECLINED" }),
    "Invitation declined",
  );
});
test("application validation requires the mobile name, email and uploaded resume fields", () => {
  const valid = {
    collaborationRoleId: roleId,
    applicantName: " Artist ",
    applicantEmail: "artist@example.test",
    resumeFileUrl: "https://example.test/cv.pdf",
    resumeFileKey: "cv.pdf",
  };
  assert.equal(
    validation.applyCollaborationValidation.parse(valid).applicantName,
    "Artist",
  );
  for (const key of [
    "applicantName",
    "applicantEmail",
    "resumeFileUrl",
    "resumeFileKey",
  ]) {
    const payload = { ...valid };
    delete payload[key];
    assert.equal(
      validation.applyCollaborationValidation.safeParse(payload).success,
      false,
    );
  }
  assert.equal(
    validation.applyCollaborationValidation.safeParse({
      ...valid,
      resumeFileUrl: "javascript:alert(1)",
    }).success,
    false,
  );
});
test("list normalization distinguishes malformed results from empty success and accepts id aliases", () => {
  assert.deepEqual(plain(utils.workflowRows(ok([]), "applicants")), []);
  assert.equal(utils.workflowRows(ok({}), "applicants"), null);
  assert.equal(utils.workflowRows(ok([{}]), "people"), null);
  assert.equal(
    utils.workflowRows(ok({ list: [{ applicationId: id }] }), "applicants")
      .length,
    1,
  );
  assert.equal(utils.workflowRows(ok([{ id }]), "people").length, 1);
  assert.equal(
    utils.applicantIdentity({ applicant: { id: personId } }),
    personId,
  );
});
test("resume selection accepts mobile formats and rejects oversized, empty or unsupported files", () => {
  for (const type of [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
  ])
    assert.equal(utils.resumeFileError({ name: "cv", type, size: 100 }), "");
  for (const file of [
    { type: "application/pdf", size: 0 },
    { type: "text/html", size: 10 },
    { type: "application/pdf", size: 21 * 1024 * 1024 },
  ])
    assert.ok(utils.resumeFileError({ ...file, name: "cv" }));
});
test("writes lock synchronously, report failures and ignore completion after unmount", async () => {
  const host = hooks();
  const hook = load("lib/hooks/useCollaborationWorkflow.ts", {
    react: host.react,
  });
  const render = () => host.render(() => hook.useCollaborationWrite(id));
  let finish,
    calls = 0,
    saved = 0;
  const run = render().run;
  const first = run(
    () => {
      calls++;
      return new Promise((resolve) => (finish = resolve));
    },
    () => saved++,
  );
  await run(
    async () => {
      calls++;
      return ok({});
    },
    () => saved++,
  );
  assert.equal(calls, 1);
  assert.equal(render().pending, true);
  finish({ status: "400", message: "Offline" });
  await first;
  assert.equal(render().error, "Offline");
  assert.equal(saved, 0);
  const pending = render().run(
    () => new Promise((resolve) => (finish = resolve)),
    () => saved++,
  );
  host.unmount();
  finish(ok({}));
  await pending;
  assert.equal(saved, 0);
});
test("an accepted write is not described as failed if its refresh callback throws", async () => {
  const host = hooks();
  const hook = load("lib/hooks/useCollaborationWorkflow.ts", {
    react: host.react,
  });
  const render = () => host.render(() => hook.useCollaborationWrite(id));
  await render().run(
    async () => ok({}),
    () => {
      throw new Error("Refresh failed");
    },
  );
  assert.match(render().error, /were saved/);
});
test("load more retries the failed page, retains accepted rows and deduplicates results", async () => {
  const host = hooks();
  const hook = load("lib/hooks/useCollaborationWorkflow.ts", {
    react: host.react,
  });
  const calls = [];
  let finish;
  const initial = Array.from({ length: 20 }, (_, i) => ({
    _id: i.toString(16).padStart(24, "0"),
  }));
  const request = (query) => {
    calls.push(plain(query));
    return new Promise((resolve) => (finish = resolve));
  };
  const render = () =>
    host.render(() =>
      hook.useWorkflowPages(id, initial, request, (row) => row._id),
    );
  const loading = render().more();
  render().more();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].pageNo, 2);
  finish({ status: "400", response: [], message: "Offline" });
  await loading;
  assert.equal(render().items.length, 20);
  assert.ok(render().error);
  const retry = render().retry();
  assert.equal(calls[1].pageNo, 2);
  finish(ok([initial[0], { _id: id }]));
  await retry;
  assert.equal(render().items.length, 21);
  assert.equal(render().hasMore, false);
});
test("changing filters invalidates late results and load more uses applied search", async () => {
  const host = hooks();
  const hook = load("lib/hooks/useCollaborationWorkflow.ts", {
    react: host.react,
  });
  const calls = [];
  const request = (query) =>
    new Promise((resolve) => calls.push({ query: plain(query), resolve }));
  const render = () =>
    host.render(() => hook.useWorkflowPages(id, [], request, (row) => row._id));
  const old = render().apply({ search: "old", filter: "ALL" });
  const current = render().apply({ search: "new", filter: "INVITED" });
  calls[1].resolve(ok([{ _id: id }]));
  await current;
  calls[0].resolve(ok([{ _id: roleId }]));
  await old;
  assert.equal(render().items[0]._id, id);
  const more = render().more();
  assert.equal(calls[2].query.search, "new");
  assert.equal(calls[2].query.filter, "INVITED");
  calls[2].resolve(ok([]));
  await more;
});
function application(save) {
  const host = hooks(),
    writes = [],
    uploads = [],
    closed = [],
    applied = [];
  const props = {
    collaborationId: id,
    role: { _id: roleId, name: "Actor" },
    currentUser: {
      email: "artist@example.test",
      userName: "artist",
      personalInfo: { firstName: "Artist" },
    },
    onClose: () => closed.push(true),
    onApplied: async (role) => applied.push(role),
  };
  const component = load(
    "components/widgets/collaboration/CollaborationApplicationDialog.tsx",
    {
      ...ui,
      react: host.react,
      "@/actions/collaboration.action": {
        applyToCollaborationRoleAction: async (...args) => {
          writes.push(plain(args));
          return save ? save(...args) : { status: "400", message: "Offline" };
        },
      },
      "@/lib/utils/uploadFile": {
        uploadFileToStorage: async (file) => {
          uploads.push(file);
          return { url: "https://example.test/cv.pdf", key: "cv.pdf" };
        },
      },
    },
  ).default;
  const render = () => host.render(() => component(props));
  const button = (text) =>
    find(
      render(),
      (node) => node.type === "button" && node.props.children === text,
    );
  const choose = (file) =>
    find(
      render(),
      (node) => node.type === "input" && node.props.type === "file",
    ).props.onChange({ target: { files: [file], value: "file" } });
  return {
    host,
    props,
    render,
    button,
    choose,
    writes,
    uploads,
    closed,
    applied,
  };
}
test("application retries retain uploaded resume, contact details and role-specific drafts", async () => {
  const h = application();
  const file = { name: "cv.pdf", type: "application/pdf", size: 100 };
  h.choose(file);
  await h.button("Send application").props.onClick();
  await h.button("Send application").props.onClick();
  assert.equal(h.uploads.length, 1);
  assert.equal(h.writes.length, 2);
  assert.equal(h.writes[0][1].resumeFileKey, "cv.pdf");
  assert.equal(h.writes[0][1].applicantName, "Artist");
  assert.equal(h.closed.length, 0);
  h.props.role = { _id: personId, name: "Other role" };
  h.render();
  assert.equal(
    find(
      h.render(),
      (node) =>
        node.type === "button" &&
        node.props.children === "Remove r\u00e9sum\u00e9",
    ),
    undefined,
  );
  h.props.role = { _id: roleId, name: "Actor" };
  assert.ok(h.button("Remove r\u00e9sum\u00e9"));
});
test("invalid resume keeps a previous valid file and a missing resume never sends", async () => {
  const h = application();
  await h.button("Send application").props.onClick();
  assert.equal(h.writes.length, 0);
  h.choose({ name: "cv.pdf", type: "application/pdf", size: 100 });
  h.choose({ name: "bad.html", type: "text/html", size: 100 });
  await h.button("Send application").props.onClick();
  assert.equal(h.uploads.length, 1);
  assert.equal(h.uploads[0].name, "cv.pdf");
});
test("successful application double click sends once and acknowledges the selected role", async () => {
  let finish;
  const h = application(() => new Promise((resolve) => (finish = resolve)));
  h.choose({ name: "cv.pdf", type: "application/pdf", size: 100 });
  const submit = h.button("Send application").props.onClick;
  const first = submit();
  await tick();
  await submit();
  assert.equal(h.writes.length, 1);
  finish(ok({}));
  await first;
  assert.deepEqual(h.applied, [roleId]);
  assert.equal(h.closed.length, 1);
});
test("management routes reject invalid identifiers and nonowners before rendering private pages", async () => {
  let reads = 0;
  let owner = personId;
  const helper = load("lib/collaboration-management.ts", {
    "server-only": {},
    "next/navigation": {
      notFound: () => {
        throw new Error("not found");
      },
      redirect: () => {
        throw new Error("redirect");
      },
    },
    "@/actions/collaboration.action": {
      getCurrentCollaborationUserAction: async () => ({ _id: id }),
      getCollaborationDetailsAction: async () => {
        reads++;
        return { collaboration: { title: "Project" }, owner: { _id: owner } };
      },
    },
  });
  await assert.rejects(helper.loadOwnedCollaboration("bad"), /not found/);
  assert.equal(reads, 0);
  await assert.rejects(helper.loadOwnedCollaboration(id), /redirect/);
  owner = id;
  assert.equal((await helper.loadOwnedCollaboration(id)).currentUser._id, id);
});
test("upload proxy preserves sessions after temporary refresh failures and clears rejected credentials", async () => {
  for (const invalid of [false, true]) {
    let cleared = 0;
    const handler = load(
      "app/api/s3/signedUrl/route.ts",
      {
        "next/server": {
          NextResponse: {
            json: (body, options) => ({ body, status: options.status }),
          },
        },
        "@/lib/session": {
          getSession: async () => "access",
          refreshSession: async () => ({ ok: false, invalid }),
        },
        "@/actions/session.action": { clearSession: async () => cleared++ },
      },
      {
        process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
        fetch: async () => ({ status: 401 }),
      },
    );
    const result = await handler.POST({
      json: async () => ({
        fileName: "cv.pdf",
        contentType: "application/pdf",
      }),
    });
    assert.equal(result.status, invalid ? 401 : 503);
    assert.equal(cleared, invalid ? 1 : 0);
  }
});

test("invitation selections survive searches and failed sends; successful duplicate clicks send once", async () => {
  const host = hooks(),
    requests = [],
    writes = [],
    navigation = [];
  let complete;
  const component = load(
    "components/widgets/collaboration/CollaborationInvitePeople.tsx",
    {
      ...ui,
      react: host.react,
      "./CollaborationPeopleFilters": "filters",
      "@/actions/collaboration.action": {
        searchCollaborationPeopleAction: async (query) => {
          requests.push(plain(query));
          return ok([
            { _id: personId, userName: "Artist" },
            { _id: id, userName: "Owner" },
          ]);
        },
        invitePeopleToCollaborationAction: async (...args) => {
          writes.push(plain(args));
          return new Promise((resolve) => (complete = resolve));
        },
      },
    },
    { window: { location: { assign: (href) => navigation.push(href) } } },
  ).default;
  const render = () =>
    host.render(() =>
      component({
        collaborationId: id,
        currentUser: { _id: id },
        selectedRoleIds: [roleId, roleId],
      }),
    );
  render();
  await tick();
  const people = () =>
    find(
      render(),
      (node) =>
        node.type === "button" &&
        typeof node.props["aria-pressed"] === "boolean",
    );
  people().props.onClick();
  assert.equal(people().props["aria-pressed"], true);
  await find(render(), (node) => node.type === "filters").props.onApply({
    searchText: "Someone else",
  });
  assert.equal(people().props["aria-pressed"], true);
  const send = () =>
    find(
      render(),
      (node) =>
        node.type === "button" && node.props.children === "Send invitations",
    ).props.onClick;
  const callback = send();
  callback();
  callback();
  assert.equal(writes.length, 1);
  assert.equal(writes[0][1].invites.length, 1);
  complete({ status: "400", message: "Offline" });
  await tick();
  assert.equal(people().props["aria-pressed"], true);
  send()();
  complete(ok({}));
  await tick();
  assert.deepEqual(navigation, [`/collaboration/${id}/invite/success`]);
  assert.equal(writes.length, 2);
  assert.equal(requests[1].searchText, "Someone else");
});
test("people filters clear dependent fields and preserve a zero rating", () => {
  const host = hooks(),
    calls = [];
  const component = load(
    "components/widgets/collaboration/CollaborationPeopleFilters.tsx",
    { ...ui, react: host.react },
  ).default;
  const render = () =>
    host.render(() =>
      component({
        disabled: false,
        loading: false,
        onApply: (query) => calls.push(plain(query)),
      }),
    );
  const lookup = (label) =>
    find(
      render(),
      (node) => node.type === "lookup" && node.props.label === label,
    );
  lookup("Main category").props.onChange(id);
  lookup("Subcategory").props.onChange(roleId);
  lookup("Skill").props.onChange(personId);
  lookup("Main category").props.onChange(personId);
  assert.equal(lookup("Subcategory").props.value, "");
  assert.equal(lookup("Skill").props.value, "");
  find(
    render(),
    (node) => node.type === "input" && node.props.type === "number",
  ).props.onChange({ target: { value: "0" } });
  find(render(), (node) => node.type === "form").props.onSubmit({
    preventDefault() {},
  });
  assert.equal(calls[0].userRating, 0);
  assert.equal(calls[0].mainCategoryId, personId);
});
test("rejecting an applicant requires confirmation and cancellation does not write", () => {
  const host = hooks(),
    calls = [];
  const component = load(
    "components/widgets/collaboration/CollaborationReviewButtons.tsx",
    { ...ui, react: host.react },
  ).default;
  const render = () =>
    host.render(() =>
      component({
        application: { applicantStatus: "ACCEPTED" },
        pending: false,
        onReview: (action) => calls.push(action),
      }),
    );
  const button = (text) =>
    find(
      render(),
      (node) => node.type === "button" && node.props.children === text,
    );
  button("Reject applicant").props.onClick();
  assert.equal(calls.length, 0);
  button("Cancel").props.onClick();
  assert.equal(button("Confirm rejection"), undefined);
  button("Reject applicant").props.onClick();
  button("Confirm rejection").props.onClick();
  assert.deepEqual(calls, ["REJECT"]);
});

test("accepted applicant review remains visible when refreshing its list and counts fails", async () => {
  const host = hooks();
  const component = load(
    "components/widgets/collaboration/CollaborationApplicantList.tsx",
    {
      ...ui,
      react: host.react,
      "next/image": "image",
      "./CollaborationReviewButtons": "review",
      "@/actions/collaboration.action": {
        reviewCollaborationApplicantAction: async () => ok({}),
        getCollaborationApplicantsAction: async () => ({
          status: "400",
          response: [],
          message: "List offline",
        }),
        getCollaborationApplicantsStatsAction: async () => null,
      },
    },
  ).default;
  const initial = {
    applicationId: id,
    roleId,
    applicantId: personId,
    applicantStatus: "ACCEPTED",
    applicantType: "APPLIED",
    applicant: { userName: "Artist" },
  };
  const render = () =>
    host.render(() =>
      component({
        collaborationId: id,
        initialStats: { totalApplicants: 1 },
        initialResult: ok([initial]),
      }),
    );
  await find(render(), (node) => node.type === "review").props.onReview(
    "SHORTLIST",
  );
  assert.equal(
    find(render(), (node) => node.type === "review").props.application
      .applicantStatus,
    "SHORTLISTED",
  );
  assert.ok(
    find(
      render(),
      (node) =>
        node.type === "button" && node.props.children === "Retry counts",
    ),
  );
  assert.ok(
    find(
      render(),
      (node) =>
        node.type === "button" && node.props.children === "Retry loading",
    ),
  );
});

test("invitation people route rejects unknown or malformed selected roles", async () => {
  let allowed = true;
  const page = load("app/(root)/collaboration/[id]/invite/people/page.tsx", {
    "react/jsx-runtime": jsx,
    "@/components/widgets/collaboration/CollaborationInvitePeople": "people",
    "@/lib/collaboration-management": {
      loadOwnedCollaboration: async () => ({
        currentUser: { _id: id },
        details: { roles: [{ _id: roleId }] },
      }),
    },
    "next/navigation": {
      redirect: () => {
        allowed = false;
        throw new Error("redirect");
      },
    },
  }).default;
  for (const roles of ["bad", personId, `${roleId},bad`, ""])
    await assert.rejects(
      page({ params: { id }, searchParams: { roles } }),
      /redirect/,
    );
  const result = await page({
    params: { id },
    searchParams: { roles: `${roleId},${roleId}` },
  });
  assert.equal(allowed, false);
  assert.deepEqual(plain(result.props.selectedRoleIds), [roleId]);
});
