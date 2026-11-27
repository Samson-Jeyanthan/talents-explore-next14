const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const viewer = "111111111111111111111111";
const target = "222222222222222222222222";
const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
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
      Error,
      AbortSignal,
      URL,
      File,
      process: { env: { NEXT_PUBLIC_BACKEND_URL: "https://backend.test" } },
      console: { log() {}, error() {} },
      require(name) {
        if (name in mocks) return mocks[name];
        if (name === "react/jsx-runtime") return jsx;
        if (name.startsWith("@/") || name.startsWith(".")) {
          const base = name.startsWith("@/")
            ? name.slice(2)
            : path.join(path.dirname(file), name);
          const next = [base, base + ".ts", base + ".tsx"].find(
            (p) => fs.existsSync(p) && fs.statSync(p).isFile(),
          );
          if (next) return load(next, mocks, globals);
        }
        return require(name);
      },
      ...globals,
    },
  );
  return module.exports;
}
const auth = { getAuthHeaders: async () => ({ Authorization: "Bearer test" }) };
const redirects = { isRedirectError: (e) => e?.digest === "NEXT_REDIRECT" };
test("account access accepts only a verified boolean role and returns no credentials", async () => {
  for (const isTalent of [true, false, undefined, "true", 1]) {
    const action = load(
      "actions/account-access.action.ts",
      { "@/lib/session": auth },
      {
        fetch: async (url, options) => {
          assert.equal(url, "https://backend.test/user/");
          assert.equal(options.cache, "no-store");
          return {
            ok: true,
            json: async () => ({
              status: "7400",
              response: { _id: viewer, isTalent, password: "private" },
            }),
          };
        },
      },
    ).getCurrentAccountAccessAction;
    if (typeof isTalent !== "boolean")
      await assert.rejects(action(), /Unable to verify/);
    else
      assert.deepEqual(JSON.parse(JSON.stringify(await action())), {
        _id: viewer,
        isTalent,
      });
  }
});
test("normal users can share links while talent posts and forged content types never write", async () => {
  for (const isTalent of [false, true]) {
    const calls = [];
    const actions = load(
      "actions/post.action.tsx",
      {
        "@/lib/session": auth,
        "./auth.action": {},
        "./account-access.action": {
          getCurrentAccountAccessAction: async () => ({
            _id: viewer,
            isTalent,
          }),
        },
        "./tokenAndHeaders.action": {
          resolveViewerIdAction: async () => viewer,
        },
        "next/cache": { revalidatePath() {} },
        "next/dist/client/components/redirect": redirects,
      },
      {
        fetch: async (url, options) => {
          calls.push({ url, options });
          return { ok: true, json: async () => ({ status: "7400" }) };
        },
      },
    );
    const post = await actions.createPostShareAction(
      target,
      { type: "POST", userId: target, isTalent: true },
      "POST",
      "/home",
    );
    assert.equal(post.status, isTalent ? "7400" : 403);
    assert.equal(calls.length, isTalent ? 1 : 0);
    const share = await actions.createPostShareAction(
      target,
      { type: "SHARELINK", userId: target },
      "SHARELINK",
      "/share-feed",
    );
    assert.equal(share.status, "7400");
    assert.equal(JSON.parse(calls.at(-1).options.body).userId, viewer);
    const count = calls.length;
    assert.equal(
      (
        await actions.createPostShareAction(
          viewer,
          { type: "POST" },
          "SHARELINK",
          "/home",
        )
      ).status,
      400,
    );
    assert.equal(calls.length, count);
    if (!isTalent) {
      assert.equal(
        (await actions.addPostToBestWorkAction(viewer, target)).status,
        "7403",
      );
      assert.equal(calls.length, count);
    }
  }
});
test("normal users cannot write professional profile sections even when they own the account", async () => {
  const sections = [
    [
      "profile-skills",
      "saveProfileSkillAction",
      "deleteProfileSkillAction",
      {
        skill: {
          mainCategoryId: viewer,
          subCategoryId: target,
          skillsHave: [],
          description: "Film",
          hashTags: ["#film"],
        },
      },
    ],
    [
      "profile-education",
      "saveProfileEducationAction",
      "deleteProfileEducationAction",
      {
        education: {
          course: "Film",
          institution: "School",
          from: "2020",
          to: "2021",
        },
      },
    ],
    [
      "profile-awards",
      "saveProfileAwardAction",
      "deleteProfileAwardAction",
      {
        award: {
          name: "Award",
          givenBy: "School",
          year: 2025,
          certificateUrl: "https://example.test/award.pdf",
        },
      },
    ],
    [
      "profile-languages",
      "saveProfileLanguageAction",
      "deleteProfileLanguageAction",
      { language: { languageId: target, level: "advanced" } },
    ],
  ];
  for (const [file, save, remove, data] of sections) {
    const calls = [];
    const actions = load(
      `actions/${file}.action.ts`,
      {
        "@/lib/session": auth,
        "next/cache": { revalidatePath() {} },
        "next/dist/client/components/redirect": redirects,
      },
      {
        fetch: async (url, options) => {
          calls.push({ url, options });
          return {
            ok: true,
            json: async () => ({
              status: "7400",
              response: { _id: viewer, isTalent: false },
            }),
          };
        },
      },
    );
    assert.notEqual(
      (await actions[save]({ profileId: viewer, ...data })).status,
      "7400",
    );
    assert.notEqual((await actions[remove](viewer, target)).status, "7400");
    assert.equal(calls.length, 2, file);
    assert.ok(
      calls.every(
        (c) => c.url.endsWith("/user/") && c.options.method === "GET",
      ),
    );
  }
});
test("normal accounts retain direct chat but cannot list, read, send to, or delete group conversations", async () => {
  for (const roomType of ["CHAT", "REQUEST", "GROUP", undefined]) {
    const calls = [];
    const actions = load("actions/chat.action.tsx", {
      "@/lib/session": auth,
      "./auth.action": {
        getUserPersonalInfoAction: async () => ({
          status: "7400",
          response: { _id: viewer, userName: "qa", isTalent: false },
        }),
      },
      "next/dist/client/components/redirect": redirects,
      axios: {
        get: async (url) => {
          calls.push({ method: "GET", url });
          return {
            data: {
              status: "7400",
              response: url.includes("/members/")
                ? {
                    info: { type: roomType },
                    list: [{ userId: viewer }, { userId: target }],
                  }
                : [],
            },
          };
        },
        post: async (url) => {
          calls.push({ method: "POST", url });
          return { status: 200, data: { status: "7400" } };
        },
      },
    });
    assert.equal((await actions.getGroupChatRoomsAction()).length, 0);
    assert.equal(await actions.getGroupChatRoomDetailsAction(target), null);
    assert.equal(calls.length, 0);
    const direct = ["CHAT", "REQUEST"].includes(roomType);
    assert.equal(
      (await actions.sendChatMessageAction({ roomId: target, content: "QA" }))
        .status,
      direct ? "7400" : "ERROR",
    );
    if (!direct) {
      await actions.getChatMessagesAction({ roomId: target });
      await actions.deleteChatMessageAction(target, viewer);
      await actions.deleteConversationAction(target);
      assert.ok(
        calls.every((c) => c.url.includes("/members/") && c.method === "GET"),
      );
    }
    assert.equal(await actions.createOneToOneChatAction(target), undefined);
    assert.ok(calls.some((c) => c.url.endsWith("/chat/oneToOneChat")));
  }
});
test("normal users can follow and rate talents but normal profiles cannot receive follows or ratings", async () => {
  for (const isTalent of [false, true]) {
    const writes = [];
    const actions = load(
      "actions/connection.action.tsx",
      {
        "@/lib/session": auth,
        "./tokenAndHeaders.action": {
          resolveViewerIdAction: async () => viewer,
        },
        "next/cache": { revalidatePath() {} },
        "next/dist/client/components/redirect": redirects,
      },
      {
        fetch: async (url, options) => {
          if (options.method === "POST") writes.push(url);
          return {
            ok: true,
            json: async () => ({
              status: "7400",
              response: { _id: target, isTalent },
            }),
          };
        },
      },
    );
    assert.equal(
      (await actions.followUserAction(target)).status,
      isTalent ? "7400" : 403,
    );
    assert.equal(
      (await actions.addProfileRatingAction(target, 5, "/home")).status,
      isTalent ? "7400" : 403,
    );
    assert.equal(writes.length, isTalent ? 2 : 0);
  }
});
test("normal accounts cannot change profile or social-link privacy", async () => {
  const writes = [];
  const actions = load("actions/settings.action.tsx", {
    "@/lib/session": auth,
    "./auth.action": {
      getUserPersonalInfoAction: async () => ({
        status: "7400",
        response: { _id: viewer, isTalent: false },
      }),
    },
    "./account-deletion.action": {},
    "next/dist/client/components/redirect": redirects,
    axios: { put: async (...args) => writes.push(args) },
  });
  assert.equal(await actions.getPrivacySettingsAction("forged-token"), null);
  assert.equal(
    (await actions.updatePrivacySettingsAction({ profileView: "EVERY_ONE" }))
      .status,
    "7403",
  );
  assert.equal(
    (await actions.updateSocialLinksPrivacyAction([])).status,
    "7403",
  );
  assert.equal(writes.length, 0);
});
test("direct talent-only routes show the upgrade notice before fetching feature data", async () => {
  const mocks = {
    "@/actions/account-access.action": {
      getCurrentAccountAccessAction: async () => ({
        _id: viewer,
        isTalent: false,
      }),
    },
    "@/components/others/TalentAccessNotice": "upgrade",
    "@/actions/utils.action": {},
    "@/components/multiStepForms": {},
    "@/components/forms/PostEditorPage": "editor",
  };
  for (const file of [
    "app/(root)/create-post/page.tsx",
    "app/(root)/post/edit/[id]/page.tsx",
    "app/(root)/collaboration/layout.tsx",
  ]) {
    const page = load(file, mocks).default;
    assert.equal(
      (await page({ params: { id: target }, children: "protected" })).type,
      "upgrade",
    );
  }
});

function all(tree, predicate) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree))
    return tree.flatMap((child) => all(child, predicate));
  return [
    ...(predicate(tree) ? [tree] : []),
    ...all(tree.props?.children, predicate),
  ];
}
const staticHooks = {
  useState: (value) => [value, () => {}],
  useEffect() {},
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useTransition: () => [false, () => {}],
};
test("normal-user menus keep share and direct chat available while hiding collaboration and groups", () => {
  for (const isTalent of [false, true]) {
    const role = {
      useUserContext: () => ({ user: { currentUserId: viewer, isTalent } }),
      INITIAL_USER: {},
    };
    const Sidebar = load("components/widgets/LeftSidebar.tsx", {
      react: staticHooks,
      "next/navigation": { usePathname: () => "/home" },
      "@/context/AuthProvider": role,
      "@/constants": {
        SIDEBAR_ITEMS: ["Home", "Collaboration"].map((name) => ({
          name,
          path: "/" + name.toLowerCase(),
          isLink: true,
          icon: "icon",
        })),
      },
      "next/image": "image",
      "next/link": "link",
      "react-icons/ai": {},
      "../ui/button": { Button: "button" },
      "../modals": {},
      "@/actions/auth.action": {},
      "@/lib/functions/auth.functions": {},
    }).default;
    const links = all(Sidebar(), (n) => n.type === "link");
    assert.equal(
      links.some((n) => n.props.href === "/collaboration"),
      isTalent,
    );
    assert.ok(links.some((n) => n.props.href === "/home"));

    const paths = [];
    const Drawer = load("components/modals/UploadDrawer.tsx", {
      "next/navigation": { useRouter: () => ({ push: (p) => paths.push(p) }) },
      "@/context/AuthProvider": role,
      "../ui/drawer": Object.fromEntries(
        [
          "Drawer",
          "DrawerContent",
          "DrawerDescription",
          "DrawerHeader",
          "DrawerTitle",
        ].map((n) => [n, n]),
      ),
      "../cards": { SelectionCard: "selection" },
      sonner: { toast: { info() {} } },
    }).default;
    const options = all(
      Drawer({ open: true, setOpen() {} }),
      (n) => n.type === "selection",
    );
    options.find((n) => n.props.title === "Create Post").props.onClick();
    assert.equal(paths.includes("/create-post"), isTalent);
    options.find((n) => n.props.title === "Share Anything").props.onClick();
    assert.ok(paths.includes("/share"));

    const Dashboard = load("components/widgets/chat/ChatDashboard.tsx", {
      react: staticHooks,
      "next/link": "link",
      "@/components/ui/button": { Button: "button" },
      "@/components/others/UserProfileImg": "avatar",
      "lucide-react": {},
      "date-fns": {},
      "@/lib/utils/postSharing": {},
    }).default;
    const tree = Dashboard({
      isTalent,
      initialChats: [],
      initialRequests: [],
      initialGroups: [],
      initialUnreadCount: {},
    });
    const labels = all(tree, (n) => n.type === "button").map((n) =>
      JSON.stringify(n.props.children),
    );
    assert.equal(
      labels.some((label) => label.includes("Groups")),
      isTalent,
    );
    assert.ok(labels.some((label) => label.includes("Messages")));
    assert.ok(labels.some((label) => label.includes("Requests")));
  }
});
test("the chat rooms HTTP endpoint rejects normal users requesting group rooms", async () => {
  let reads = 0;
  const route = load("app/api/chat/rooms/route.ts", {
    "@/lib/session": { getSession: async () => "test" },
    "@/actions/auth.action": {
      getUserPersonalInfoAction: async () => ({
        status: "7400",
        response: { _id: viewer, isTalent: false },
      }),
    },
    axios: {
      get: async () => {
        reads++;
        return { data: { status: "7400", response: [] } };
      },
    },
    "next/server": {
      NextResponse: {
        json: (body, options = {}) => ({ body, status: options.status || 200 }),
      },
    },
  });
  assert.equal(
    (await route.GET({ url: "https://local.test/api/chat/rooms?tab=group" }))
      .status,
    403,
  );
  assert.equal(reads, 0);
  assert.equal(
    (await route.GET({ url: "https://local.test/api/chat/rooms?tab=chat" }))
      .status,
    200,
  );
  assert.equal(reads, 1);
});
