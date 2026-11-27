const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
const id = "6aff08a32e63b493d0e6e337",
  roleId = "6aff08a32e63b493d0e6e339",
  viewer = "6aff08a32e63b493d0e6e340";
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
      require: (name) => {
        if (name in mocks) return mocks[name];
        if (name.startsWith("@/") || name.startsWith(".")) {
          const base = name.startsWith("@/")
            ? name.slice(2)
            : path.join(path.dirname(file), name);
          const target = [base, base + ".ts", base + ".tsx"].find(
            (file) => fs.existsSync(file) && fs.statSync(file).isFile(),
          );
          if (target) return load(target, mocks, globals);
        }
        return require(name);
      },
      Error,
      Intl,
      Date,
      ...globals,
    },
  );
  return module.exports;
}
const utils = load("lib/utils/collaboration-schedule.ts");
const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
const mocks = {
  "react/jsx-runtime": jsx,
  react: { useState: (value) => [value, () => {}], useEffect: () => {} },
  "next/link": "link",
};
const plain = (value) => JSON.parse(JSON.stringify(value));
function text(tree) {
  if (tree == null || typeof tree === "boolean") return "";
  if (typeof tree !== "object") return String(tree);
  if (Array.isArray(tree)) return tree.map(text).join(" ");
  return text(tree.props?.children);
}
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

test("schedule date conversion uses the viewer zone and preserves calendar-only dates", () => {
  assert.equal(
    utils.formatScheduleValue("2026-12-01T23:30:00Z", "date", "Asia/Colombo"),
    "02 Dec 2026",
  );
  assert.equal(
    utils.formatScheduleValue("2026-12-01T23:30:00Z", "date", "UTC"),
    "01 Dec 2026",
  );
  assert.equal(
    utils.formatScheduleValue("2026-12-01", "date", "America/Los_Angeles"),
    "01 Dec 2026",
  );
  assert.equal(utils.formatScheduleValue("09:00", "time"), "09:00");
  for (const value of [null, {}, "broken", "2026-02-31"])
    assert.equal(utils.formatScheduleValue(value, "date"), "Not provided");
});
test("payment labels preserve zero amounts and format every mobile payment and charge option", () => {
  assert.deepEqual(
    plain(
      utils.paymentLabels({
        payment: "PAID",
        amount: 0,
        currency: "USD",
        type: "PER_HOUR",
      }),
    ),
    ["Paid", "0 USD", "Per hour"],
  );
  assert.deepEqual(
    plain(
      utils.paymentLabels({
        payment: { value: "NON_PAID" },
        type: "null",
        amount: "",
        currency: "null",
      }),
    ),
    ["Non-paid"],
  );
  assert.equal(utils.enumLabel("EXPENSE_ONLY"), "Expenses only");
  assert.equal(utils.enumLabel("NEGOTIABLE"), "Negotiable");
  assert.equal(utils.enumLabel({ label: "Hybrid", value: "HYBRID" }), "Hybrid");
});
test("lookup documents never render as objects or expose lookup ids as names", () => {
  assert.equal(
    utils.lookupLabel({ _id: id, language: "Tamil" }, ["language"]),
    "Tamil",
  );
  assert.equal(utils.lookupLabel({ _id: id }), "Not specified");
  assert.equal(utils.lookupLabel(id), "Not specified");
  assert.equal(utils.enumLabel("prefferNotToSay"), "Prefer not to say");
});
test("chat shortcut is limited to owners and accepted, shortlisted or finalized participants", () => {
  const details = {
    owner: { _id: id },
    roles: [{ myApplicant: { applicantStatus: "APPLIED" } }],
  };
  assert.equal(utils.canUseCollaborationChat({ _id: id }, details), true);
  assert.equal(utils.canUseCollaborationChat({ _id: viewer }, details), false);
  assert.equal(utils.canUseCollaborationChat(null, details), false);
  for (const status of ["ACCEPTED", "SHORTLISTED", "FINALIZED"]) {
    details.roles[0].myApplicant.applicantStatus = status;
    assert.equal(utils.canUseCollaborationChat({ _id: viewer }, details), true);
  }
  for (const status of ["APPLIED", "REJECTED", "DECLINED"]) {
    details.roles[0].myApplicant.applicantStatus = status;
    assert.equal(
      utils.canUseCollaborationChat({ _id: viewer }, details),
      false,
    );
  }
});
test("group access requires an actual member identity and never another user's entry", () => {
  assert.equal(
    utils.groupMemberAllowed({ _id: viewer }, [{ userId: viewer }]),
    true,
  );
  assert.equal(
    utils.groupMemberAllowed({ _id: viewer }, [{ userId: { _id: viewer } }]),
    true,
  );
  assert.equal(
    utils.groupMemberAllowed({ _id: viewer }, [{ userId: id }]),
    false,
  );
  assert.equal(utils.groupMemberAllowed(null, [{ userId: viewer }]), false);
});
test("map links preserve zero coordinates and safely encode addresses", () => {
  assert.equal(
    utils.scheduleMapLink({ mode: "ONLINE", location: "Video call" }),
    null,
  );
  assert.match(
    utils.scheduleMapLink({
      gpsLocation: { coordinates: [0, 0] },
      longitude: 80,
      latitude: 7,
    }),
    /query=0%2C0/,
  );
  assert.match(
    utils.scheduleMapLink({ location: "A & B / Colombo" }),
    /A%20%26%20B%20%2F%20Colombo/,
  );
  assert.equal(utils.scheduleMapLink({ latitude: Infinity }), null);
});
test("all scheduled dates, titles, times, notes, locations and modes render", () => {
  const component = load(
    "components/widgets/collaboration/CollaborationTimeline.tsx",
    mocks,
  ).default;
  const tree = component({
    role: {
      timeLineType: "DATE_SETS",
      timeLine: [
        {
          date: "2026-12-01",
          startTime: "09:00",
          endTime: "11:00",
          title: "Rehearsal",
          description: "Bring your script",
          mode: "ONLINE",
          location: "Colombo",
        },
        {
          date: "2026-12-02",
          startTime: "12:00",
          endTime: "13:00",
          title: "Shooting",
          mode: { label: "Meetup", value: "MEETUP" },
          location: "Studio",
        },
      ],
    },
  });
  const content = text(tree);
  for (const expected of [
    "Rehearsal",
    "Shooting",
    "09:00",
    "13:00",
    "Bring your script",
    "Colombo",
    "Studio",
    "Online",
    "Meetup",
    "01 Dec 2026",
    "02 Dec 2026",
  ])
    assert.ok(content.includes(expected), expected);
});
test("date ranges retain times, durations retain units and malformed or empty schedules are safe", () => {
  const component = load(
    "components/widgets/collaboration/CollaborationTimeline.tsx",
    mocks,
  ).default;
  const range = text(
    component({
      role: {
        timeLineType: "BY_DATE",
        timeLine: [
          {
            startDate: "2026-12-01T09:00:00Z",
            endDate: "2026-12-02T17:00:00Z",
            mode: "HYBRID",
          },
        ],
      },
    }),
  );
  assert.match(range, /09:00/);
  assert.match(range, /05:00 pm/);
  assert.match(
    text(
      component({
        role: { timeLineType: "BY_DAYS", timeLine: [{ expectedDays: 5 }] },
      }),
    ),
    /5 days/,
  );
  assert.match(
    text(
      component({
        role: {
          timeLineType: "BY_DAYS",
          timeLine: [{ expectedDays: "2 weeks" }],
        },
      }),
    ),
    /2 weeks/,
  );
  assert.match(text(component({ role: { timeLine: [null] } })), /Not provided/);
  assert.match(
    text(component({ role: { timeLine: [] } })),
    /No schedule has been added/,
  );
});
test("role requirements support populated references, full descriptions and optional skills", () => {
  const component = load(
    "components/widgets/collaboration/CollaborationRoleRequirements.tsx",
    mocks,
  ).default;
  const content = text(
    component({
      role: {
        gender: "female",
        languageSeeking: { language: "Tamil" },
        ethnic: { ethnic: "Example ethnicity" },
        description: "Full multiline\ndescription",
        paymentDetails: { payment: "VOLUNTEER" },
        skills: [
          {
            mainCategoryId: { name: "Arts" },
            subCategoryId: { name: "Acting" },
            skillId: { name: "Voice" },
            level: "advanced",
          },
        ],
      },
    }),
  );
  for (const value of [
    "Female",
    "Tamil",
    "Example ethnicity",
    "Volunteer",
    "Arts",
    "Acting",
    "Voice",
    "Advanced",
    "Full multiline\ndescription",
  ])
    assert.ok(content.includes(value), value);
});
test("schedule route validates ids and distinguishes unavailable details from missing roles", async () => {
  let reads = 0,
    details = null;
  const page = load(
    "app/(root)/collaboration/[id]/roles/[roleId]/schedule/page.tsx",
    {
      ...mocks,
      "@/components/widgets/collaboration/CollaborationSchedulePage":
        "schedule",
      "next/navigation": {
        notFound: () => {
          throw new Error("not-found");
        },
      },
      "@/actions/collaboration.action": {
        getCurrentCollaborationUserAction: async () => ({ _id: viewer }),
        getCollaborationDetailsAction: async () => {
          reads++;
          return details;
        },
      },
    },
  ).default;
  await assert.rejects(page({ params: { id: "bad", roleId } }), /not-found/);
  assert.equal(reads, 0);
  await assert.rejects(page({ params: { id, roleId } }), /Unable to load/);
  details = { collaboration: { roomId: id }, owner: { _id: id }, roles: [] };
  await assert.rejects(page({ params: { id, roleId } }), /not-found/);
  details.roles = [
    { id: roleId, timeLine: [], myApplicant: { applicantStatus: "APPLIED" } },
  ];
  const pending = await page({ params: { id, roleId } });
  assert.equal(pending.props.chatRoomId, undefined);
  details.roles[0].myApplicant.applicantStatus = "ACCEPTED";
  assert.equal((await page({ params: { id, roleId } })).props.chatRoomId, id);
  details.roles[0].timeLine = {};
  await assert.rejects(page({ params: { id, roleId } }), /Unable to read/);
});
test("group route checks membership before requesting messages or rendering the composer", async () => {
  let reads = 0,
    status = "400",
    members = [];
  const page = load("app/(root)/chat/[roomId]/page.tsx", {
    ...mocks,
    "@/components/widgets/chat/ChatRoom": "room",
    "@/components/widgets/chat/ChatAccessNotice": "notice",
    "@/lib/utils/postSharing": { readSharedPost: () => null },
    "@/actions/chat.action": {
      getCurrentChatUserAction: async () => ({ _id: viewer, isTalent: true }),
      getChatMembersAction: async () => ({ status, list: members, info: null }),
      getChatMessagesAction: async () => {
        reads++;
        return [];
      },
      getGroupChatRoomDetailsAction: async () => ({ title: "Project" }),
    },
  }).default;
  const props = { params: { roomId: id }, searchParams: { type: "group" } };
  assert.equal((await page(props)).type, "notice");
  assert.equal(reads, 0);
  status = "7400";
  members = [{ userId: id }];
  assert.equal((await page(props)).props.denied, true);
  assert.equal(reads, 0);
  members = [{ userId: viewer }];
  assert.equal((await page(props)).type, "room");
  assert.equal(reads, 1);
});
