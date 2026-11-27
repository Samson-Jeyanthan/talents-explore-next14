const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

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
      URL,
      require(name) {
        if (name in mocks) return mocks[name];
        if (name.startsWith("@/") || name.startsWith(".")) {
          const base = name.startsWith("@/")
            ? name.slice(2)
            : path.join(path.dirname(file), name);
          const next = [base, base + ".tsx", base + ".ts"].find(
            (p) => fs.existsSync(p) && fs.statSync(p).isFile(),
          );
          if (next) return load(next, mocks);
        }
        return require(name);
      },
    },
  );
  return module.exports;
}
const { linkedTextParts } = load("lib/utils/linked-text.ts");
const LinkedText = load("components/others/LinkedText.tsx").default;
const links = (value) => linkedTextParts(value).filter((p) => p.href);

test("HTTP, HTTPS, www and bare-domain links all become clickable without changing displayed text", () => {
  const text =
    "See http://example.com/a, https://example.org/path?q=one&next=two, www.example.net and talentsexplore.com/profile.";
  const rows = links(text);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].href, "http://example.com/a");
  assert.equal(rows[1].href, "https://example.org/path?q=one&next=two");
  assert.equal(rows[2].href, "https://www.example.net/");
  assert.equal(rows[3].href, "https://talentsexplore.com/profile");
  assert.equal(
    linkedTextParts(text)
      .map((p) => p.text)
      .join(""),
    text,
  );
});
test("trailing sentence punctuation is excluded while balanced URL parentheses and query strings survive", () => {
  const text =
    "Read (https://en.wikipedia.org/wiki/Film_(disambiguation)), then https://example.com/?q=film&lang=en#cast!";
  assert.equal(
    links(text)[0].text,
    "https://en.wikipedia.org/wiki/Film_(disambiguation)",
  );
  assert.equal(links(text)[1].href, "https://example.com/?q=film&lang=en#cast");
  assert.equal(
    linkedTextParts(text)
      .map((p) => p.text)
      .join(""),
    text,
  );
});
test("Unicode, line breaks, spacing, and repeated adjacent links are retained", () => {
  const text =
    "தமிழ்  https://example.com/தமிழ்\n\nwww.example.com\nhttps://example.org https://example.org";
  assert.equal(links(text).length, 4);
  assert.equal(
    linkedTextParts(text)
      .map((p) => p.text)
      .join(""),
    text,
  );
  assert.equal(links(text).length, 4, "A repeated render must not skip links");
});
test("modern domains and international domain names are detected", () => {
  for (const value of [
    "portfolio.studio",
    "demo.app/project",
    "example.dev",
    "https://例え.テスト/作品",
    "example.lk",
  ]) {
    assert.equal(links(value).length, 1, value);
  }
});
test("executable schemes, embedded credentials, emails and ordinary text remain non-clickable", () => {
  for (const text of [
    "javascript:alert(1)",
    "data:text/html,alert(1)",
    "ftp://example.com/file",
    "mailto:test@example.com",
    "test@example.com",
    "https://user:password@example.com",
    "Nothing to link",
    "",
    null,
    undefined,
  ]) {
    assert.equal(links(text).length, 0, String(text));
  }
});
test("renderer creates blue external anchors, escapes HTML and keeps paragraphs inline", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      "p",
      {},
      React.createElement(LinkedText, {
        text: "<img src=x onerror=alert(1)>\nhttps://example.com/?a=1&b=2",
      }),
    ),
  );
  assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt;"));
  assert.equal((html.match(/<p>/g) || []).length, 1);
  assert.equal(html.includes("<br"), false);
  assert.ok(html.includes('href="https://example.com/?a=1&amp;b=2"'));
  assert.ok(html.includes('target="_blank"'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(html.includes("!text-blue-600 dark:!text-blue-400"));
  const inverted = renderToStaticMarkup(
    React.createElement(LinkedText, {
      text: "https://example.com",
      inverted: true,
    }),
  );
  assert.ok(inverted.includes("!text-blue-400 dark:!text-blue-600"));
});
test("legacy detail and bio rendering uses the same inline links without added blank paragraphs", () => {
  const { addLineBreaks } = load("lib/utils/addLinkBreaks.tsx");
  const html = renderToStaticMarkup(
    addLineBreaks("First line\nhttps://example.com\nLast line"),
  );
  assert.ok(html.includes("First line\n<a"));
  assert.ok(html.includes("</a>\nLast line"));
  assert.equal(html.includes("<p"), false);
  assert.equal(
    renderToStaticMarkup(addLineBreaks(undefined)),
    '<span class="whitespace-pre-wrap [overflow-wrap:anywhere]"></span>',
  );
});
test("collaboration descriptions link externally without nesting anchors or removing the card's detail link", () => {
  const Card = load("components/widgets/collaboration/CollaborationCard.tsx", {
    "next/link": ({ children, ...props }) =>
      React.createElement("a", props, children),
    "next/image": () => null,
    "@/components/others/UserProfileImg": () => null,
  }).default;
  const html = renderToStaticMarkup(
    React.createElement(Card, {
      collaboration: {
        collaboration: {
          _id: "qa",
          title: "QA card",
          description: "Apply at https://example.com/jobs",
        },
        owner: { userName: "qa" },
      },
    }),
  );
  assert.ok(html.startsWith("<article"));
  assert.ok(html.includes('href="/collaboration/qa"'));
  assert.ok(html.includes('href="https://example.com/jobs"'));
  assert.equal((html.match(/<a\b/g) || []).length, 2);
  assert.ok(html.indexOf("</a>") < html.lastIndexOf("<a "));
});
