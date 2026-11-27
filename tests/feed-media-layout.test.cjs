const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function carousel() {
  let height,
    selected = 0,
    resize,
    cleanup;
  let heights = [540, 240];
  let observed;
  const events = new Map();
  const slides = [
    { mediaType: "image", url: "photo" },
    { mediaType: "video", url: "video" },
  ];
  const nodes = () =>
    heights.map((value) => ({
      getBoundingClientRect: () => ({ height: value }),
    }));
  let elements = nodes();
  const api = {
    slideNodes: () => elements,
    selectedScrollSnap: () => selected,
    on: (name, fn) => events.set(name, fn),
    off: (name, fn) => {
      assert.equal(events.get(name), fn);
      events.delete(name);
    },
  };
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    react: {
      useState: () => [
        height,
        (next) => {
          height = next;
        },
      ],
      useEffect: (fn) => {
        if (!cleanup) cleanup = fn();
      },
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "embla-carousel-react": {
      default: () => [() => {}, api],
      __esModule: true,
    },
    "./EmblaCarouselDotButton": {
      useDotButton: () => ({ selectedIndex: selected }),
    },
    "./EmblaCarouselArrowButtons": {
      usePrevNextButtons: () => ({}),
      NextButton: "next",
      PrevButton: "prev",
    },
    "next/image": { default: "image", __esModule: true },
    "@/components/video/VideoCard": { default: "video", __esModule: true },
    "@/styles/postFeedCarousel.css": {},
  };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        "components/widgets/carousels/PostFeedCarousel.tsx",
        "utf8",
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
        },
      },
    ).outputText,
    {
      module,
      exports: module.exports,
      require: (name) => mocks[name] || {},
      ResizeObserver: class {
        constructor(fn) {
          resize = fn;
        }
        observe(node) {
          observed = node;
        }
        disconnect() {
          observed = undefined;
        }
      },
    },
  );
  const render = () =>
    module.exports.default({ slides, length: slides.length });
  const viewportHeight = () => render().props.children[0].props.style.height;
  render();
  return {
    viewportHeight,
    select(index) {
      selected = index;
      events.get("select")();
    },
    resize(value) {
      elements[selected].getBoundingClientRect = () => ({ height: value });
      resize();
    },
    reInit(values) {
      heights = values;
      elements = nodes();
      events.get("reInit")();
    },
    dispose() {
      cleanup();
    },
    events,
    observed: () => observed,
  };
}

test("a shorter selected video does not retain the adjacent image's height", () => {
  const h = carousel();
  assert.equal(h.viewportHeight(), 540);
  h.select(1);
  assert.equal(h.viewportHeight(), 240);
  h.select(0);
  assert.equal(h.viewportHeight(), 540);
  h.dispose();
});
test("video metadata, resized media and carousel reinitialization update the visible height", () => {
  const h = carousel();
  h.select(1);
  h.resize(302.25);
  assert.equal(h.viewportHeight(), 303);
  h.resize(180);
  assert.equal(h.viewportHeight(), 180);
  h.reInit([400, 225]);
  assert.equal(h.viewportHeight(), 225);
  h.dispose();
});
test("temporarily hidden media cannot collapse the viewport and unmount removes observers and handlers", () => {
  const h = carousel();
  h.resize(0);
  assert.equal(h.viewportHeight(), 540);
  assert.ok(h.observed());
  h.dispose();
  assert.equal(h.observed(), undefined);
  assert.equal(h.events.size, 0);
});
