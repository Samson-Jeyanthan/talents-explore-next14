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
        esModuleInterop: true,
      },
    }).outputText,
    {
      module: testModule,
      exports: testModule.exports,
      require: (name) => mocks[name] || require(name),
      ...globals,
    },
  );
  return testModule.exports;
}
const theme = load("lib/theme.ts");

test("palette compiles as a standalone Next.js CSS import", async () => {
  const postcss = require("postcss");
  const tailwind = require("tailwindcss");
  const source = fs.readFileSync("styles/palette.css", "utf8");
  const result = await postcss([
    tailwind({
      content: ["./components/options/AppearanceSettings.tsx"],
      corePlugins: { preflight: false },
    }),
  ]).process(source, { from: "styles/palette.css" });
  assert(result.css.includes("--canvas: 250 250 250"));
  assert(result.css.includes(":root.dark"));
  assert(result.css.includes("--canvas: 17 19 27"));
});

function browser(stored, systemDark = false, blocked = false) {
  let value = stored;
  const mediaListeners = new Set();
  const storageListeners = new Set();
  const classes = new Set(["font-sans"]);
  const root = {
    dataset: {},
    style: {},
    classList: {
      toggle: (name, enabled) =>
        enabled ? classes.add(name) : classes.delete(name),
    },
  };
  const storage = {
    getItem: () => {
      if (blocked) throw new Error("Storage blocked");
      return value;
    },
    setItem: (key, next) => {
      if (blocked) throw new Error("Storage blocked");
      assert.equal(key, "theme");
      value = next;
    },
  };
  const media = {
    matches: systemDark,
    addEventListener: (event, listener) => mediaListeners.add(listener),
    removeEventListener: (event, listener) => mediaListeners.delete(listener),
  };
  return {
    globals: {
      document: { documentElement: root },
      localStorage: storage,
      window: {
        matchMedia: () => media,
        addEventListener: (event, listener) => storageListeners.add(listener),
        removeEventListener: (event, listener) =>
          storageListeners.delete(listener),
      },
    },
    root,
    classes,
    mediaListeners,
    storageListeners,
    systemChange: (dark) => {
      media.matches = dark;
      mediaListeners.forEach((listener) => listener());
    },
    storageChange: (next) => {
      value = next;
      storageListeners.forEach((listener) =>
        listener({ key: "theme", newValue: next, storageArea: storage }),
      );
    },
    stored: () => value,
  };
}

function provider(env) {
  const effects = [];
  const state = [];
  const react = {
    createContext: () => ({ Provider: "provider" }),
    useState: (initial) => {
      const index = state.length;
      state.push(initial);
      return [
        initial,
        (next) => {
          state[index] = next;
        },
      ];
    },
    useRef: (initial) => ({ current: initial }),
    useCallback: (callback) => callback,
    useEffect: (effect) => effects.push(effect),
  };
  const exported = load(
    "context/ThemeProvider.tsx",
    {
      react,
      "@/lib/theme": theme,
      "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    },
    env.globals,
  );
  const rendered = exported.ThemeProvider({ children: null });
  const cleanups = effects.map((effect) => effect());
  return {
    setMode: rendered.props.value.setMode,
    state,
    unmount: () => cleanups.forEach((cleanup) => cleanup?.()),
  };
}

test("first-paint theme honours saved choices, system preference, and invalid storage", () => {
  for (const [stored, systemDark, expected] of [
    ["dark", false, "dark"],
    ["light", true, "light"],
    ["system", true, "dark"],
    [null, false, "light"],
    ["invalid", true, "dark"],
  ]) {
    const env = browser(stored, systemDark);
    vm.runInNewContext(theme.themeBootstrapScript, env.globals);
    assert.equal(env.root.dataset.theme, expected);
    assert.equal(env.classes.has("dark"), expected === "dark");
    assert.equal(env.root.style.colorScheme, expected);
    assert(env.classes.has("font-sans"));
  }
});

test("blocked storage still permits first paint and changing appearance", () => {
  const env = browser(null, true, true);
  vm.runInNewContext(theme.themeBootstrapScript, env.globals);
  assert.equal(env.root.dataset.theme, "dark");
  const instance = provider(env);
  instance.setMode("light");
  assert.equal(env.root.dataset.theme, "light");
  env.systemChange(true);
  assert.equal(env.root.dataset.theme, "light");
  instance.unmount();
});

test("theme selection persists, restores on remount, and explicit choices ignore OS changes", () => {
  const env = browser("system", false);
  const instance = provider(env);
  instance.setMode("dark");
  assert.equal(env.stored(), "dark");
  assert.equal(instance.state[0], "dark");
  assert.equal(instance.state[1], "dark");
  env.systemChange(false);
  assert.equal(env.root.dataset.theme, "dark");
  instance.unmount();
  const restored = provider(env);
  assert.equal(restored.state[0], "dark");
  assert.equal(env.root.style.colorScheme, "dark");
  restored.unmount();
});

test("system appearance follows live changes after toggling modes and releases listeners", () => {
  const env = browser("light", false);
  const instance = provider(env);
  instance.setMode("dark");
  instance.setMode("system");
  assert.equal(env.root.dataset.theme, "light");
  env.systemChange(true);
  assert.equal(env.root.dataset.theme, "dark");
  env.systemChange(false);
  assert.equal(env.root.dataset.theme, "light");
  instance.unmount();
  assert.equal(env.mediaListeners.size, 0);
  assert.equal(env.storageListeners.size, 0);
});

test("another tab's preference updates this tab and clearing storage restores system mode", () => {
  const env = browser("light", true);
  const instance = provider(env);
  env.storageChange("dark");
  assert.equal(env.root.dataset.theme, "dark");
  env.storageChange("light");
  assert.equal(env.root.dataset.theme, "light");
  env.storageChange(null);
  assert.equal(instance.state[0], "system");
  assert.equal(env.root.dataset.theme, "dark");
  instance.unmount();
});
