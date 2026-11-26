const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
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
      Date,
      File: globalThis.File,
      URL,
      require(name) {
        if (name in mocks) return mocks[name];
        if (name.startsWith("@/") || name.startsWith(".")) {
          const base = name.startsWith("@/")
            ? name.slice(2)
            : path.join(path.dirname(file), name);
          const target = [base, base + ".ts", base + ".tsx"].find(
            (p) => fs.existsSync(p) && fs.statSync(p).isFile(),
          );
          if (target) return load(target, mocks);
        }
        return require(name);
      },
    },
  );
  return module.exports;
}
const dates = load("lib/utils/birth-date.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
test("impossible, partial and malformed dates never roll over or throw", () => {
  for (const values of [
    ["2001", "02", "31"],
    ["2001", "02", "29"],
    ["1900", "02", "29"],
    ["2000", "04", "31"],
    ["2000", "13", "01"],
    ["2000", "00", "01"],
    ["2000", "01", "00"],
    ["2000", "01", ""],
    ["", "01", "01"],
    ["2000x", "01", "01"],
    ["2000", "1x", "01"],
  ]) {
    assert.equal(dates.convertToISOString(...values), "");
  }
  for (const value of [
    undefined,
    "",
    "bad",
    "2001-02-31",
    "1900-02-29",
    "2000-01-01Tbad",
  ])
    assert.deepEqual(plain(dates.formatISOStringDate(value)), {
      year: "",
      month: "",
      day: "",
    });
  assert.equal(
    dates.convertToISOString("2000", "2", "29"),
    "2000-02-29T00:00:00.000Z",
  );
  assert.equal(
    dates.convertToISOString("2001", "12", "31"),
    "2001-12-31T00:00:00.000Z",
  );
});
test("birthdays preserve their written calendar date in time zones on either side of UTC", () => {
  const previous = process.env.TZ;
  try {
    for (const zone of [
      "UTC",
      "America/Los_Angeles",
      "Pacific/Honolulu",
      "Pacific/Kiritimati",
      "Asia/Colombo",
    ]) {
      process.env.TZ = zone;
      for (const value of [
        "2000-01-01",
        "2000-01-01T00:00:00.000Z",
        "2000-01-01T00:00:00+05:30",
      ]) {
        const parts = dates.formatISOStringDate(value);
        assert.deepEqual(
          plain(parts),
          { year: "2000", month: "01", day: "01" },
          zone,
        );
        assert.equal(
          dates.convertToISOString(parts.year, parts.month, parts.day),
          "2000-01-01T00:00:00.000Z",
        );
      }
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
test("age validation rejects invalid dates and enforces the thirteenth birthday boundary", () => {
  const today = new Date("2026-11-22T12:00:00Z");
  assert.equal(dates.validProfileBirthDate("2013-11-22", today), true);
  assert.equal(dates.validProfileBirthDate("2013-11-23", today), false);
  assert.equal(dates.validProfileBirthDate("2027-01-01", today), false);
  assert.equal(dates.validProfileBirthDate("2001-02-31", today), false);
  assert.equal(dates.validProfileBirthDate("2000-02-29", today), true);
  assert.equal(
    dates.validProfileBirthDate("2012-02-29", new Date("2025-02-28T12:00:00Z")),
    false,
  );
  assert.equal(
    dates.validProfileBirthDate("2012-02-29", new Date("2025-03-01T12:00:00Z")),
    true,
  );
});

test("backend Date.toString DOBs restore the same calendar day in every viewer time zone", () => {
  const previous = process.env.TZ;
  try {
    for (const zone of [
      "UTC",
      "America/Los_Angeles",
      "Asia/Colombo",
      "Pacific/Kiritimati",
    ]) {
      process.env.TZ = zone;
      for (const value of [
        "Sat Jan 01 2000 00:00:00 GMT+0000 (Coordinated Universal Time)",
        "Sat Jan 01 2000 00:00:00 GMT+0530 (India Standard Time)",
        "Sat Jan 01 2000 23:59:59 GMT-1000",
      ]) {
        assert.deepEqual(plain(dates.formatISOStringDate(value)), {
          year: "2000",
          month: "01",
          day: "01",
        });
        assert.equal(
          dates.normalizeProfileBirthDate(value),
          "2000-01-01T00:00:00.000Z",
        );
        assert.equal(
          dates.validProfileBirthDate(value, new Date("2026-11-26T12:00:00Z")),
          true,
        );
      }
    }
    assert.equal(
      dates.validProfileBirthDate(
        "Wed Nov 27 2013 00:00:00 GMT+0000",
        new Date("2026-11-26T12:00:00Z"),
      ),
      false,
    );
    for (const value of [
      "Sat Feb 31 2000 00:00:00 GMT+0000",
      "Sat Jan 01 2000 99:00:00 GMT+0000",
      "01/02/2000",
    ]) {
      assert.equal(dates.formatISOStringDate(value).year, "");
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
test("profile setup and editing reject invalid and underage dates consistently", () => {
  const setup = load(
    "lib/validations/auth.validation.ts",
  ).CompleteProfileValidation;
  const edit = load(
    "lib/validations/profile.validation.ts",
  ).getEditProfileValidation(false);
  const values = {
    firstName: "Test",
    lastName: "User",
    gender: "male",
    knownLanguage: "111111111111111111111111",
    profession: "222222222222222222222222",
    quotes: "",
    location: "Test city",
    latitude: 0,
    longitude: 0,
  };
  for (const dob of ["", "2001-02-31", "1900-02-29", "2999-01-01"]) {
    assert.equal(setup.safeParse({ ...values, dob }).success, false);
    assert.equal(edit.safeParse({ ...values, dob }).success, false);
  }
  for (const dob of ["2000-01-01", "2000-02-29T00:00:00.000Z"]) {
    assert.equal(setup.safeParse({ ...values, dob }).success, true);
    assert.equal(edit.safeParse({ ...values, dob }).success, true);
  }
});
const jsx = {
  Fragment: "fragment",
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
function all(tree, type) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap((child) => all(child, type));
  return [
    ...(tree.type === type ? [tree] : []),
    ...all(tree.props?.children, type),
  ];
}
function picker(value = "", options = {}) {
  const cells = [];
  let cursor = 0,
    effects = [],
    changed = false,
    tree;
  const emitted = [];
  const props = {
    ...options,
    isoDate: value,
    formLabel: "Date of Birth",
    fieldChange(next) {
      emitted.push(next);
      props.isoDate = next;
    },
  };
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in cells))
        cells[i] = typeof initial === "function" ? initial() : initial;
      return [
        cells[i],
        (next) => {
          const value = typeof next === "function" ? next(cells[i]) : next;
          if (!Object.is(value, cells[i])) {
            cells[i] = value;
            changed = true;
          }
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      return (cells[i] ||= { current: initial });
    },
    useMemo(fn) {
      cursor++;
      return fn();
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!cells[i] || deps.some((v, j) => !Object.is(v, cells[i][j]))) {
        cells[i] = deps;
        effects.push(fn);
      }
    },
  };
  const component = load("components/inputs/DateInput.tsx", {
    react,
    "react/jsx-runtime": jsx,
    "../ui/select": Object.fromEntries(
      [
        "Select",
        "SelectContent",
        "SelectItem",
        "SelectTrigger",
        "SelectValue",
      ].map((key) => [key, key]),
    ),
  }).default;
  const render = () => {
    let attempts = 0;
    do {
      changed = false;
      cursor = 0;
      effects = [];
      tree = component(props);
      effects.forEach((fn) => fn());
      if (++attempts > 8) throw Error("Render loop");
    } while (changed);
    return all(tree, "Select");
  };
  return {
    emitted,
    render,
    values: () => render().map((select) => select.props.value),
    select(index, value) {
      render()[index].props.onValueChange(value);
      render();
    },
    reset(value) {
      props.isoDate = value;
      render();
    },
    dayOptions: () =>
      all(render()[2], "SelectItem").map((item) => item.props.value),
    options: (index) =>
      all(render()[index], "SelectItem").map((item) => item.props),
  };
}
test("opening or externally resetting the picker never rewrites the saved birthday", () => {
  const control = picker("2000-01-01T00:00:00.000Z");
  assert.deepEqual(control.values(), ["2000", "01", "01"]);
  assert.deepEqual(control.emitted, []);
  control.reset("2004-02-29");
  assert.deepEqual(control.values(), ["2004", "02", "29"]);
  assert.deepEqual(control.emitted, []);
  control.reset("");
  assert.deepEqual(control.values(), ["", "", ""]);
});
test("January 31 to February clears only the day and submitted DOB until a valid day is chosen", () => {
  const control = picker("2001-01-31");
  control.select(1, "02");
  assert.deepEqual(control.values(), ["2001", "02", ""]);
  assert.deepEqual(control.emitted, [""]);
  assert.equal(control.dayOptions().length, 28);
  assert.equal(control.dayOptions().includes("31"), false);
  control.select(2, "28");
  assert.equal(control.emitted.at(-1), "2001-02-28T00:00:00.000Z");
  assert.deepEqual(control.values(), ["2001", "02", "28"]);
});
test("changing a leap year clears February 29 but preserves valid days", () => {
  const control = picker("2000-02-29");
  control.select(0, "2001");
  assert.deepEqual(control.values(), ["2001", "02", ""]);
  assert.equal(control.emitted.at(-1), "");
  control.select(2, "28");
  control.select(0, "2004");
  assert.deepEqual(control.values(), ["2004", "02", "28"]);
  assert.equal(control.emitted.at(-1), "2004-02-28T00:00:00.000Z");
});
test("new profile selection retains partial year/month choices and submits only a complete date", () => {
  const control = picker();
  assert.equal(control.render()[2].props.disabled, true);
  control.select(0, "2000");
  assert.deepEqual(control.values(), ["2000", "", ""]);
  control.select(1, "02");
  assert.deepEqual(control.values(), ["2000", "02", ""]);
  assert.equal(control.render()[2].props.disabled, false);
  assert.equal(control.dayOptions().length, 29);
  control.select(2, "29");
  assert.deepEqual(control.emitted, ["", "", "2000-02-29T00:00:00.000Z"]);
});

test("DOB pickers exclude under-13 years and disable months and days beyond the thirteenth birthday cutoff", () => {
  const today = new Date();
  const year = String(today.getUTCFullYear() - 13);
  const month = String(today.getUTCMonth() + 1).padStart(2, "0");
  const day = String(
    Math.min(
      today.getUTCDate(),
      dates.getDaysInMonth(Number(year), Number(month)),
    ),
  ).padStart(2, "0");
  const control = picker("", { minimumAge: 13 });
  assert.equal(control.options(0)[0].value, year);
  assert.ok(
    control.options(0).every((option) => Number(option.value) <= Number(year)),
  );
  control.select(0, String(Number(year) + 1));
  assert.deepEqual(control.values(), ["", "", ""]);
  control.select(0, year);
  for (const option of control.options(1))
    assert.equal(!!option.disabled, Number(option.value) > Number(month));
  if (Number(month) < 12) {
    control.select(1, String(Number(month) + 1).padStart(2, "0"));
    assert.equal(control.values()[1], "");
  }
  control.select(1, month);
  for (const option of control.options(2))
    assert.equal(!!option.disabled, Number(option.value) > Number(day));
  control.select(2, day);
  assert.equal(control.emitted.at(-1), `${year}-${month}-${day}T00:00:00.000Z`);
  const accepted = control.emitted.at(-1);
  if (Number(day) < dates.getDaysInMonth(Number(year), Number(month))) {
    control.select(2, String(Number(day) + 1).padStart(2, "0"));
    assert.equal(control.emitted.at(-1), accepted);
  }
});

test("changing the DOB year to the age boundary clears any month or day beyond the limit", () => {
  const today = new Date();
  const year = String(today.getUTCFullYear() - 13);
  const control = picker(`${Number(year) - 1}-12-31`, { minimumAge: 13 });
  control.select(0, year);
  if (today.getUTCMonth() < 11) {
    assert.deepEqual(control.values(), [year, "", ""]);
    assert.equal(control.emitted.at(-1), "");
  } else if (today.getUTCDate() < 31) {
    assert.deepEqual(control.values(), [year, "12", ""]);
    assert.equal(control.emitted.at(-1), "");
  } else assert.equal(control.values()[2], "31");
});

test("birthday cutoff clamps leap years and other date pickers retain their existing year choices", () => {
  assert.equal(
    dates.profileBirthDateCutoff(13, new Date("2024-02-29T12:00:00Z")),
    "2011-02-28",
  );
  assert.equal(
    dates.profileBirthDateCutoff(13, new Date("2025-03-01T12:00:00Z")),
    "2012-03-01",
  );
  const creditPicker = picker();
  assert.equal(
    creditPicker.options(0)[0].value,
    String(new Date().getFullYear()),
  );
});
