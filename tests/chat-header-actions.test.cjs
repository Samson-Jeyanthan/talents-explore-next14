const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const self = "111111111111111111111111",
  other = "222222222222222222222222",
  room = "333333333333333333333333",
  collaboration = "444444444444444444444444";
const jsx = {
  Fragment: "fragment",
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
};
function load(file, mocks = {}) {
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
      require: (name) => mocks[name] || {},
      process: { env: {} },
      console,
    },
  );
  return module.exports;
}
const utils = load("lib/utils/chat-header.ts");
function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return;
  if (Array.isArray(tree)) {
    for (const child of tree) {
      const value = find(child, predicate);
      if (value) return value;
    }
    return;
  }
  return predicate(tree) ? tree : find(tree.props?.children, predicate);
}
function hooks() {
  const cells = [];
  let cursor = 0;
  return {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in cells)) cells[i] = initial;
        return [
          cells[i],
          (value) =>
            (cells[i] = typeof value === "function" ? value(cells[i]) : value),
        ];
      },
      useRef(initial) {
        return (cells[cursor++] ||= { current: initial });
      },
      useEffect(fn) {
        const i = cursor++;
        if (!(i in cells)) cells[i] = { cleanup: fn() };
      },
    },
    render(fn) {
      cursor = 0;
      return fn();
    },
    unmount() {
      cells.forEach((c) => c?.cleanup?.());
    },
  };
}
function actions(type = "chat", recipientId = other, activeUserId = self) {
  const host = hooks(),
    calls = [],
    navigation = [];
  let reply = { status: "7500" },
    finish,
    delayed = false;
  const names = [
    "Menubar",
    "MenubarContent",
    "MenubarItem",
    "MenubarMenu",
    "MenubarTrigger",
  ];
  const alertNames = [
    "AlertDialog",
    "AlertDialogCancel",
    "AlertDialogContent",
    "AlertDialogDescription",
    "AlertDialogFooter",
    "AlertDialogHeader",
    "AlertDialogTitle",
  ];
  const Component = load("components/widgets/chat/ChatHeaderActions.tsx", {
    react: host.react,
    "react/jsx-runtime": jsx,
    "next/navigation": {
      useRouter: () => ({
        push: (href) => navigation.push(href),
        refresh: () => navigation.push("refresh"),
      }),
    },
    "@/components/ui/menubar": Object.fromEntries(names.map((n) => [n, n])),
    "@/components/ui/alert-dialog": Object.fromEntries(
      alertNames.map((n) => [n, n]),
    ),
    "@/components/ui/button": { Button: "button" },
    "@/components/modals/ReportDialog": "report",
    "@/lib/utils/chat-header": utils,
    "@/actions/chat.action": {
      deleteConversationAction: async (id) => {
        calls.push(id);
        if (delayed) return new Promise((r) => (finish = r));
        if (reply instanceof Error) throw reply;
        return reply;
      },
    },
  }).default;
  const render = () =>
    host.render(() =>
      Component({ roomId: room, type, recipientId, activeUserId }),
    );
  const item = (text) =>
    find(
      render(),
      (n) => n.type === "MenubarItem" && n.props.children.includes(text),
    );
  const button = () => find(render(), (n) => n.type === "button");
  render();
  return {
    host,
    render,
    item,
    button,
    calls,
    navigation,
    reply: (value) => (reply = value),
    delay() {
      delayed = true;
    },
    finish(value) {
      finish(value);
    },
  };
}
test("opening conversation options has no deletion side effect and reporting targets the other user", () => {
  const h = actions();
  const trigger = find(h.render(), (n) => n.type === "MenubarTrigger");
  assert.equal(trigger.props["aria-label"], "Conversation options");
  assert.equal(trigger.props.onClick, undefined);
  assert.equal(h.calls.length, 0);
  assert.equal(
    find(h.render(), (n) => n.type === "AlertDialog").props.open,
    false,
  );
  h.item("Report this account").props.onSelect();
  const report = find(h.render(), (n) => n.type === "report");
  assert.equal(report.props.open, true);
  assert.equal(report.props.targetType, "profile");
  assert.equal(report.props.targetId, other);
  assert.notEqual(report.props.targetId, room);
  assert.equal(
    find(h.render(), (n) => n.type === "AlertDialog").props.open,
    false,
  );
  assert.equal(h.calls.length, 0);
  let prevented = false;
  find(h.render(), (n) => n.type === "MenubarContent").props.onCloseAutoFocus({
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
});
test("requests can report but groups, own accounts, unavailable identities and invalid IDs cannot", () => {
  assert.ok(actions("request").item("Report this account"));
  for (const args of [
    ["group", other, self],
    ["chat", self, self],
    ["chat", null, self],
    ["chat", "../invalid", self],
    ["chat", other, ""],
    ["bad", other, self],
    ["chat", "ABCDEFABCDEFABCDEFABCDEF", "abcdefabcdefabcdefabcdef"],
  ]) {
    const h = actions(...args);
    assert.equal(h.item("Report this account"), undefined);
    assert.equal(
      find(h.render(), (n) => n.type === "report"),
      undefined,
    );
    assert.ok(h.item("Delete this conversation"));
  }
});
test("delete menu selection only opens confirmation and cancellation sends no request", async () => {
  const h = actions();
  await h.button().props.onClick();
  assert.equal(h.calls.length, 0);
  h.item("Delete this conversation").props.onSelect();
  assert.equal(
    find(h.render(), (n) => n.type === "AlertDialog").props.open,
    true,
  );
  assert.equal(h.calls.length, 0);
  find(h.render(), (n) => n.type === "AlertDialog").props.onOpenChange(false);
  assert.equal(
    find(h.render(), (n) => n.type === "AlertDialog").props.open,
    false,
  );
  assert.equal(h.calls.length, 0);
});
test("failed deletion keeps confirmation open and retries without premature navigation", async () => {
  for (const response of [undefined, { status: "7401" }, Error("Offline")]) {
    const h = actions();
    h.reply(response);
    h.item("Delete this conversation").props.onSelect();
    await h.button().props.onClick();
    assert.equal(
      find(h.render(), (n) => n.type === "AlertDialog").props.open,
      true,
    );
    assert.ok(find(h.render(), (n) => n.props?.role === "alert"));
    assert.equal(h.navigation.length, 0);
    h.reply({ status: "7400" });
    await h.button().props.onClick();
    assert.equal(
      find(h.render(), (n) => n.type === "AlertDialog").props.open,
      false,
    );
    assert.deepEqual(h.navigation, ["/chat", "refresh"]);
    assert.deepEqual(h.calls, [room, room]);
  }
});
test("pending deletion blocks repeated clicks and dismissal, and unmounted results cannot navigate", async () => {
  const h = actions();
  h.delay();
  h.item("Delete this conversation").props.onSelect();
  const click = h.button().props.onClick,
    pending = click();
  await click();
  assert.equal(h.calls.length, 1);
  assert.equal(h.button().props.disabled, true);
  assert.equal(
    find(h.render(), (n) => n.type === "AlertDialogCancel").props.disabled,
    true,
  );
  find(h.render(), (n) => n.type === "AlertDialog").props.onOpenChange(false);
  assert.equal(
    find(h.render(), (n) => n.type === "AlertDialog").props.open,
    true,
  );
  h.host.unmount();
  h.finish({ status: "7400" });
  await pending;
  assert.equal(h.navigation.length, 0);
});
test("collaboration links use validated collaboration identifiers rather than the chat room", () => {
  for (const details of [
    { _id: collaboration },
    { collaborationId: collaboration },
    { collaboration: { _id: collaboration } },
  ])
    assert.equal(
      utils.chatCollaborationHref(details),
      `/collaboration/${collaboration}`,
    );
  assert.equal(
    utils.chatCollaborationHref({ _id: room, collaborationId: collaboration }),
    `/collaboration/${collaboration}`,
  );
  for (const details of [null, {}, { _id: "../wrong" }, { roomId: room }])
    assert.equal(utils.chatCollaborationHref(details), null);
});
function roomTree(type, groupDetails, initialMembers) {
  const Component = load("components/widgets/chat/ChatRoom.tsx", {
    react: {
      useState: (value) => [value, () => {}],
      useRef: (value) => ({ current: value }),
      useMemo: (fn) => fn(),
      useEffect() {},
      useTransition: () => [false, () => {}],
    },
    "react/jsx-runtime": jsx,
    "@/context/AuthProvider": {
      useUserContext: () => ({ user: { currentUserId: self, username: "me" } }),
    },
    "next/navigation": { useRouter: () => ({}) },
    "next/link": "link",
    "@/components/ui/button": { Button: "button" },
    "./ChatHeaderActions": "actions",
    "@/lib/utils/chat-header": utils,
    "@/lib/utils": { cn: (value) => value },
  }).default;
  return Component({
    roomId: room,
    initialType: type,
    initialMessages: [],
    initialMembers: initialMembers || [
      { userId: self, userName: "me" },
      { userId: other, userName: "recipient" },
    ],
    initialChatInfo: null,
    initialGroupChatDetails: groupDetails,
    currentUser: { _id: self, userName: "me" },
  });
}
test("group header opens collaboration details and an unavailable collaboration has no broken link", () => {
  const group = roomTree("group", {
    _id: collaboration,
    title: "Creative project",
  });
  const link = find(
    group,
    (n) =>
      n.type === "link" && n.props.href === `/collaboration/${collaboration}`,
  );
  assert.ok(link);
  assert.equal(
    link.props["aria-label"],
    "Open collaboration: Creative project",
  );
  assert.equal(
    find(roomTree("group", { title: "Unavailable" }), (n) => n.type === "link"),
    undefined,
  );
});
test("direct header retains profile navigation and passes the normalized recipient to room-scoped actions", () => {
  const tree = roomTree("chat", null, [
    { userId: { _id: self }, userName: "me" },
    { userId: { _id: other }, userName: "recipient" },
  ]);
  assert.ok(
    find(
      tree,
      (n) =>
        n.type === "link" && n.props.href === `/profile/recipient/${other}`,
    ),
  );
  const menu = find(tree, (n) => n.type === "actions");
  assert.equal(menu.props.recipientId, other);
  assert.ok(menu.key.includes(room));
  assert.equal(menu.props.activeUserId, self);
});
