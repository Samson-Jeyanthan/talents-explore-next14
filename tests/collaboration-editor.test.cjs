const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
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
      require: (name) =>
        mocks[name] ||
        (name === "@/components/others/LinkedText"
          ? "linked-text"
          : require(name)),
      URL,
      ...globals,
    },
  );
  return module.exports;
}
const utils = load("lib/utils/collaboration-editor.ts");
const id = "6aff08a32e63b493d0e6e337";
const roleId = "6aff08a32e63b493d0e6e339";
const timeline = () => ({
  startDate: "2026-12-01T09:00",
  endDate: "2026-12-02T17:00",
  mode: "ONLINE",
  location: "Colombo",
  longitude: 0,
  latitude: 0,
});
const role = () => ({
  roleId,
  name: "Actor",
  description: "Acting role",
  skills: [
    { mainCategoryId: id, subCategoryId: roleId, skillId: "", level: "" },
  ],
  paymentDetails: { payment: "PAID", amount: "", currency: "", type: "" },
  timeLineType: "BY_DATE",
  timeLine: [timeline()],
});
const form = () => ({
  title: "Project",
  description: "A creative project",
  location: "Colombo",
  longitude: 0,
  latitude: 0,
  deadlineToApply: "2026-11-30T12:00",
  expectedStartDate: "2026-12-01T09:00",
  expectedEndDate: "2026-12-31T17:00",
  expectedDays: "",
  productionInfo: { title: "Example studio", type: "Film" },
  contactInfo: { email: "test@example.com", phone: "" },
  links: "https://example.com",
  targetedAudience: { ageMin: 13, ageMax: 60, publicRating: 0 },
  roles: [role()],
});
test("mobile collaboration fields, optional paid amount and zero coordinates are accepted", () => {
  for (let step = 0; step < 3; step++)
    assert.equal(utils.collaborationStepError(form(), step), "");
});
test("populated lookups, mobile dropdowns, ids and absent selections normalize", () => {
  for (const value of [id, { _id: id }, { id }, { value: id }])
    assert.equal(utils.collaborationSelection(value), id);
  for (const value of [null, undefined, {}])
    assert.equal(utils.collaborationSelection(value), "");
});
test("basic validation rejects whitespace, invalid deadlines and reversed or partial dates", () => {
  for (const patch of [
    { title: " " },
    { deadlineToApply: "invalid" },
    { expectedEndDate: "2026-11-01T12:00" },
    { expectedEndDate: "" },
    { longitude: 181 },
    { latitude: "oops" },
  ]) {
    assert.ok(utils.collaborationStepError({ ...form(), ...patch }, 0));
  }
  assert.equal(
    utils.collaborationStepError(
      {
        ...form(),
        expectedStartDate: "",
        expectedEndDate: "",
        expectedDays: "2 weeks",
      },
      0,
    ),
    "",
  );
});
test("incomplete skills, roles, payments and timeline details cannot be saved", () => {
  for (const patch of [
    { name: " " },
    { skills: [] },
    { skills: [{ mainCategoryId: id }] },
    { paymentDetails: {} },
    { paymentDetails: { payment: "PAID", amount: "-2" } },
    { timeLine: [] },
    { timeLine: [{ ...timeline(), location: "" }] },
    { timeLine: [{ ...timeline(), endDate: timeline().startDate }] },
  ]) {
    assert.ok(utils.collaborationRoleError({ ...role(), ...patch }));
  }
  assert.ok(utils.collaborationStepError({ ...form(), roles: [] }, 1));
});
test("all three mobile timeline types validate their own dates and duration", () => {
  assert.equal(
    utils.collaborationRoleError({
      ...role(),
      timeLineType: "BY_DAYS",
      timeLine: [{ ...timeline(), expectedDays: "3 months" }],
    }),
    "",
  );
  assert.ok(
    utils.collaborationRoleError({ ...role(), timeLineType: "BY_DAYS" }),
  );
  const schedule = {
    ...timeline(),
    date: "2026-12-01",
    title: "Rehearsal",
    startTime: "09:00",
    endTime: "17:00",
  };
  assert.equal(
    utils.collaborationRoleError({
      ...role(),
      timeLineType: "DATE_SETS",
      timeLine: [schedule],
    }),
    "",
  );
  for (const patch of [
    { title: "" },
    { date: "" },
    { endTime: "08:00" },
    { startTime: "" },
  ])
    assert.ok(
      utils.collaborationRoleError({
        ...role(),
        timeLineType: "DATE_SETS",
        timeLine: [{ ...schedule, ...patch }],
      }),
    );
});
test("production, contact, audience and links are checked without requiring optional phone or links", () => {
  for (const patch of [
    { productionInfo: { title: "Studio", type: "" } },
    { contactInfo: { email: "bad" } },
    { targetedAudience: { ageMin: 61, ageMax: 60, publicRating: 0 } },
    { targetedAudience: { ageMin: 13, ageMax: 60, publicRating: 6 } },
    { links: "javascript:alert(1)" },
  ])
    assert.ok(utils.collaborationStepError({ ...form(), ...patch }, 2));
  assert.equal(utils.collaborationStepError({ ...form(), links: "" }, 2), "");
});
function hooks() {
  const cells = [];
  let cursor = 0,
    effects = [];
  const changed = (a, b) =>
    !a ||
    a.length !== b.length ||
    a.some((value, index) => !Object.is(value, b[index]));
  return {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in cells))
          cells[index] = typeof initial === "function" ? initial() : initial;
        return [
          cells[index],
          (value) => {
            cells[index] =
              typeof value === "function" ? value(cells[index]) : value;
          },
        ];
      },
      useRef(initial) {
        const index = cursor++;
        return (cells[index] ||= { current: initial });
      },
      useMemo(fn, deps) {
        const index = cursor++;
        if (changed(cells[index]?.deps, deps))
          cells[index] = { deps, value: fn() };
        return cells[index].value;
      },
      useEffect(fn, deps) {
        const index = cursor++;
        if (changed(cells[index]?.deps, deps)) {
          const previous = cells[index];
          cells[index] = { deps };
          effects.push(() => {
            previous?.cleanup?.();
            cells[index].cleanup = fn();
          });
        }
      },
    },
    render(fn) {
      cursor = 0;
      const result = fn();
      const pending = effects;
      effects = [];
      pending.forEach((fn) => fn());
      return result;
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
const plain = (value) => JSON.parse(JSON.stringify(value));
function editor(options = {}) {
  const state = hooks(),
    calls = [],
    messages = [],
    uploads = [],
    revoked = [],
    navigation = [];
  const initial = form();
  const details = {
    collaboration: {
      ...initial,
      gpsLocation: { coordinates: [0, 0] },
      longitude: 80,
      latitude: 7,
      poster: {
        url: "https://example.com/original.jpg",
        urlKey: "original",
        thumbnailUrl: "https://example.com/thumb.jpg",
        thumbnailUrlKey: "thumb",
      },
      targetedAudience: { ageRange: "13-60", professional: { _id: id } },
    },
    roles: [
      {
        ...role(),
        _id: roleId,
        skills: [
          {
            mainCategoryId: { _id: id },
            subCategoryId: { _id: roleId },
            skillId: null,
          },
        ],
        timeLine: [
          {
            ...timeline(),
            gpsLocation: { coordinates: [0, 0] },
            longitude: 80,
          },
        ],
      },
    ],
  };
  const action = async (...args) => {
    calls.push(plain(args));
    return options.save
      ? options.save(...args)
      : { status: "400", message: "Please retry" };
  };
  const jsx = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  };
  const component = load(
    "components/widgets/collaboration/CollaborationEditor.tsx",
    {
      react: state.react,
      "react/jsx-runtime": jsx,
      "@/actions/collaboration.action": {
        createCollaborationAction: action,
        updateCollaborationAction: action,
      },
      "@/lib/utils/collaboration-editor": utils,
      "@/lib/utils/uploadFile": {
        uploadFileToStorage: async (file) => {
          uploads.push(file);
          return { key: "new-poster", url: "https://example.com/new.jpg" };
        },
      },
      "@/components/inputs/SearchLookupSelect": () => null,
      "@/components/ui/button": { Button: "button" },
      "@/components/ui/input": { Input: "input" },
      "@/components/ui/textarea": { Textarea: "textarea" },
      "@/components/ui/dialog": Object.fromEntries(
        [
          "Dialog",
          "DialogContent",
          "DialogDescription",
          "DialogFooter",
          "DialogHeader",
          "DialogTitle",
        ].map((name) => [name, name]),
      ),
      "@/components/widgets/collaboration/CollaborationFieldPickers": {
        NativePickerField: "picker",
        LocationPickerDialog: "location",
      },
      "@/constants": { GENDER_VALUES: [], LEVEL_VALUES: [] },
      "lucide-react": {
        ArrowLeft: "icon",
        ArrowRight: "icon",
        Plus: "icon",
        Trash2: "icon",
      },
      "next/image": "img",
      "next/link": "a",
      sonner: { toast: { error: (message) => messages.push(message) } },
    },
    {
      URL: {
        createObjectURL: () => "blob:poster",
        revokeObjectURL: (value) => revoked.push(value),
      },
      window: { location: { assign: (value) => navigation.push(value) } },
    },
  ).default;
  const render = () =>
    state.render(() =>
      component({
        mode: options.mode || "edit",
        collaborationId: options.mode === "create" ? undefined : id,
        currentUser: { _id: id, userName: "test" },
        initialDetails: options.empty ? undefined : details,
        lookupData: {
          mainCategories: [],
          languages: [],
          countries: [],
          ethnicities: [],
          professions: [],
        },
      }),
    );
  const button = (label) =>
    find(
      render(),
      (node) => node.type === "button" && node.props.children === label,
    );
  const next = () =>
    find(
      render(),
      (node) =>
        node.type === "button" &&
        Array.isArray(node.props.children) &&
        node.props.children[0] === "Next",
    ).props.onClick();
  const save = () =>
    button(
      options.mode === "create" ? "Post Request" : "Update Post Request",
    ).props.onClick();
  return {
    state,
    render,
    button,
    next,
    save,
    calls,
    messages,
    uploads,
    revoked,
    navigation,
  };
}
test("editing round-trips populated references, role identity, poster keys and zero coordinates", async () => {
  const h = editor();
  h.next();
  h.next();
  await h.save();
  const [idArgument, payload] = h.calls[0];
  assert.equal(idArgument, id);
  assert.equal(payload.collaboration.longitude, 0);
  assert.equal(payload.collaboration.latitude, 0);
  assert.equal(payload.collaboration.poster.thumbnailUrlKey, "thumb");
  assert.equal(payload.collaboration.targetedAudience.professional, id);
  assert.equal(payload.collaboratorRolesUpdate[0].roleId, roleId);
  assert.equal(
    payload.collaboratorRolesUpdate[0].data.skills[0].mainCategoryId,
    id,
  );
  assert.equal(
    payload.collaboratorRolesUpdate[0].data.timeLine[0].longitude,
    0,
  );
  assert.equal(payload.collaboratorRolesCreate.length, 0);
});
test("a pending save blocks duplicate clicks synchronously and unlocks after failure", async () => {
  let finish;
  const h = editor({
    save: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  h.next();
  h.next();
  const submit = h.button("Update Post Request").props.onClick;
  const first = submit();
  await submit();
  assert.equal(h.calls.length, 1);
  assert.equal(
    find(h.render(), (node) => node.type === "fieldset").props.disabled,
    true,
  );
  finish({ status: "400", message: "Offline" });
  await first;
  assert.equal(h.button("Update Post Request").props.disabled, false);
  const second = h.save();
  assert.equal(h.calls.length, 2);
  finish({ status: "400" });
  await second;
  assert.deepEqual(h.calls[0], h.calls[1]);
});
test("a successfully uploaded poster is reused after a failed API save; previews are revoked", async () => {
  const h = editor();
  const file = { name: "poster.png", type: "image/png", size: 100 };
  find(
    h.render(),
    (node) => node.type === "input" && node.props.type === "file",
  ).props.onChange({ target: { files: [file], value: "file" } });
  h.render();
  h.next();
  h.next();
  await h.save();
  await h.save();
  assert.equal(h.uploads.length, 1);
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[0][1].collaboration.poster.urlKey, "new-poster");
  assert.equal(h.calls[0][1].collaboration.poster.thumbnailUrlKey, "");
  h.state.unmount();
  assert.deepEqual(h.revoked, ["blob:poster"]);
});
test("rejecting an unsupported poster preserves the previous valid poster", async () => {
  const h = editor();
  find(
    h.render(),
    (node) => node.type === "input" && node.props.type === "file",
  ).props.onChange({
    target: {
      files: [{ name: "bad.svg", type: "image/svg+xml", size: 100 }],
      value: "file",
    },
  });
  assert.match(h.messages[0], /JPG/);
  h.next();
  h.next();
  await h.save();
  assert.equal(h.uploads.length, 0);
  assert.equal(h.calls[0][1].collaboration.poster.urlKey, "original");
});
test("role dialog cancellation does not mutate a saved role", async () => {
  const h = editor();
  h.next();
  h.button("Edit").props.onClick();
  const input = find(
    h.render(),
    (node) => node.props?.placeholder === "Role Name",
  );
  input.props.onChange({ target: { value: "Changed" } });
  find(h.render(), (node) => node.type === "Dialog").props.onOpenChange(false);
  h.next();
  await h.save();
  assert.equal(h.calls[0][1].collaboratorRolesUpdate[0].data.name, "Actor");
});
test("new collaboration uses the create contract and success keeps submission locked", async () => {
  const h = editor({
    mode: "create",
    save: async () => ({
      status: "7400",
      response: { collaboration: { _id: id } },
    }),
  });
  h.next();
  h.next();
  await h.save();
  assert.equal(h.calls[0].length, 1);
  assert.equal(h.calls[0][0].collaboratorRoles.length, 1);
  assert.deepEqual(h.navigation, [`/collaboration/success/${id}`]);
  assert.equal(
    find(h.render(), (node) => node.type === "fieldset").props.disabled,
    true,
  );
});

test("adding a replacement role sends its create payload and deletes only the removed persisted role", async () => {
  const h = editor();
  h.next();
  find(
    h.render(),
    (node) =>
      node.type === "button" &&
      Array.isArray(node.props.children) &&
      node.props.children.includes("Add Role"),
  ).props.onClick();
  for (const [placeholder, value] of [
    ["Role Name", "Director"],
    ["Description", "Direct the production"],
  ])
    find(
      h.render(),
      (node) => node.props?.placeholder === placeholder,
    ).props.onChange({ target: { value } });
  for (const [label, value] of [
    ["Main Category", id],
    ["Sub Category", roleId],
  ])
    find(h.render(), (node) => node.props?.label === label).props.onChange(
      value,
    );
  find(
    h.render(),
    (node) => node.type === "select" && node.props["aria-label"] === "Payment",
  ).props.onChange({ target: { value: "VOLUNTEER" } });
  for (const [placeholder, value] of [
    ["Select start date", "2026-12-01T09:00"],
    ["Select end date", "2026-12-02T17:00"],
  ])
    find(
      h.render(),
      (node) =>
        node.type === "picker" && node.props.placeholder === placeholder,
    ).props.onChange(value);
  find(
    h.render(),
    (node) => node.type === "select" && node.props["aria-label"] === "Mode",
  ).props.onChange({ target: { value: "ONLINE" } });
  h.button("Select location").props.onClick();
  find(h.render(), (node) => node.type === "location").props.onApply({
    address: "Colombo",
    longitude: 0,
    latitude: 0,
  });
  h.button("Add Role").props.onClick();
  find(
    h.render(),
    (node) =>
      node.type === "button" &&
      Array.isArray(node.props.children) &&
      node.props.children.includes("Delete"),
  ).props.onClick();
  h.next();
  await h.save();
  const payload = h.calls[0][1];
  assert.deepEqual(payload.deleteRoleIds, [roleId]);
  assert.equal(payload.collaboratorRolesUpdate.length, 0);
  assert.equal(payload.collaboratorRolesCreate.length, 1);
  assert.equal(payload.collaboratorRolesCreate[0].name, "Director");
});

test("closing a location picker invalidates a late geolocation callback", async () => {
  const state = hooks();
  let position,
    applied = 0,
    closed = 0;
  const picker = load(
    "components/widgets/collaboration/CollaborationFieldPickers.tsx",
    {
      react: state.react,
      "react/jsx-runtime": {
        jsx: (type, props) => ({ type, props }),
        jsxs: (type, props) => ({ type, props }),
      },
      "@/components/ui/button": { Button: "button" },
      "@/components/ui/input": { Input: "input" },
      "@/components/ui/dialog": {
        Dialog: "dialog",
        DialogContent: "content",
        DialogHeader: "header",
        DialogTitle: "title",
        DialogDescription: "description",
      },
      "lucide-react": { Search: "icon" },
      sonner: { toast: { error: () => {} } },
    },
    {
      navigator: {
        geolocation: {
          getCurrentPosition: (callback) => {
            position = callback;
          },
        },
      },
      AbortSignal,
      fetch: async () => ({
        ok: true,
        json: async () => ({ display_name: "Colombo" }),
      }),
    },
  ).LocationPickerDialog;
  const render = () =>
    state.render(() =>
      picker({
        open: true,
        title: "Select location",
        onClose: () => closed++,
        onApply: () => applied++,
      }),
    );
  find(
    render(),
    (node) =>
      node.type === "button" &&
      node.props.children === "Click here to select your current location",
  ).props.onClick();
  find(
    render(),
    (node) => node.type === "button" && node.props.children === "Close",
  ).props.onClick();
  await position({ coords: { latitude: 0, longitude: 0 } });
  assert.equal(applied, 0);
  assert.equal(closed, 1);
});
test("an incomplete create form cannot advance to roles or save", () => {
  const h = editor({ mode: "create", empty: true });
  h.next();
  assert.ok(h.messages.length);
  assert.ok(
    find(
      h.render(),
      (node) => node.type === "input" && node.props.type === "file",
    ),
  );
  assert.equal(h.calls.length, 0);
});

test("edit route rejects invalid ids, failed detail reads and another user's project", async () => {
  let reads = 0;
  let details = null;
  const page = load("app/(root)/collaboration/edit/[id]/page.tsx", {
    "react/jsx-runtime": { jsx: (type, props, key) => ({ type, props, key }) },
    "@/components/widgets/collaboration/CollaborationEditor": () => null,
    "@/lib/utils/collaboration-editor": utils,
    "@/actions/collaboration.action": {
      getCurrentCollaborationUserAction: async () => ({ _id: id }),
      getCollaborationDetailsAction: async () => {
        reads++;
        return details;
      },
    },
    "next/navigation": {
      notFound: () => {
        throw new Error("not-found");
      },
      redirect: (path) => {
        throw new Error(`redirect:${path}`);
      },
    },
  }).default;
  await assert.rejects(page({ params: { id: "bad" } }), /not-found/);
  assert.equal(reads, 0);
  await assert.rejects(
    page({ params: { id } }),
    /Unable to load collaboration/,
  );
  details = { collaboration: { title: "Project" }, owner: { _id: roleId } };
  await assert.rejects(page({ params: { id } }), /redirect:/);
  details.owner._id = id;
  const result = await page({ params: { id } });
  assert.equal(result.key, id);
  assert.equal(result.props.initialDetails, details);
});
