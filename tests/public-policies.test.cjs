const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const content = require("../content/legal/policies.json");
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
      Headers,
      atob,
      require: (name) => (name in mocks ? mocks[name] : require(name)),
    },
  );
  return module.exports;
}
const legal = load("lib/legal.ts", {
  "@/content/legal/policies.json": content,
  "./legal-links": load("lib/legal-links.ts"),
});
const navigation = {
  notFound() {
    throw Error("NOT_FOUND");
  },
  redirect(path) {
    throw Error("REDIRECT:" + path);
  },
};
const Link = ({ children, href, ...props }) =>
  React.createElement("a", { ...props, href }, children);
const page = load("app/(public)/[policy]/page.tsx", {
  "@/lib/legal": legal,
  "next/navigation": navigation,
  "next/link": Link,
});

test("all three public documents include the complete numbered sections and substantive policy text", () => {
  for (const [slug, count, phrases] of [
    [
      "terms-and-conditions",
      10,
      [
        "13169329",
        "What Services are Covered",
        "Suspending or Ending",
        "Contacting Talents Explore",
      ],
    ],
    [
      "privacy-policy",
      10,
      [
        "What Information We Collect",
        "Data Security and Retention",
        "Younger Users",
        "info@talentsexplore.com",
      ],
    ],
    [
      "community-guidelines",
      13,
      [
        "Minor Safety",
        "Bullying and Harassment",
        "Platform Security",
        "Ineligible for the For You Feed",
      ],
    ],
  ]) {
    const doc = legal.getPolicyDocument(slug);
    assert.equal(doc.sections.length, count);
    const html = renderToStaticMarkup(
      React.createElement(page.default, { params: { policy: slug } }),
    );
    for (const phrase of phrases) assert.ok(html.includes(phrase), phrase);
    assert.ok(html.length > 15000);
    assert.equal((html.match(/<section /g) || []).length, count);
    for (const section of doc.sections)
      assert.ok(html.includes(`id="${section.id}"`));
    assert.ok(html.includes('aria-label="On this page"'));
    assert.equal(
      /<script|onClick=|javascript:|samson@gmail|styled-components/.test(html),
      false,
    );
  }
});

test("public policy routes do not require sign-in while account pages remain protected", () => {
  const { NextRequest, NextResponse } = require("next/server");
  const middleware = load("middleware.ts", {
    "next/server": { NextResponse },
  }).middleware;
  for (const route of [
    "/",
    "/policies",
    "/terms-and-conditions",
    "/privacy-policy",
    "/community-guidelines",
    "/community-standards",
    "/intellectual-property-policy",
    "/cookies-policy",
    "/branded-content-policy",
    "/child-safety-standards",
  ]) {
    const response = middleware(
      new NextRequest("https://example.test" + route),
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
  }
  assert.equal(
    middleware(new NextRequest("https://example.test/home")).status,
    307,
  );
});

test("policy content and metadata are server rendered with the existing canonical URLs", () => {
  const params = page.generateStaticParams();
  for (const link of legal.PUBLIC_POLICY_LINKS) {
    const slug = link.href.slice(1);
    assert.ok(params.some((p) => p.policy === slug));
    const metadata = page.generateMetadata({ params: { policy: slug } });
    assert.equal(metadata.alternates.canonical, link.href);
    assert.ok(metadata.title.includes(legal.getPolicyDocument(slug).title));
  }
  assert.throws(
    () => page.default({ params: { policy: "community-standards" } }),
    /REDIRECT:\/community-guidelines/,
  );
});

test("unknown paths and inherited object keys cannot render a document or crash with missing sections", () => {
  for (const slug of [
    "missing-policy",
    "constructor",
    "toString",
    "__proto__",
  ]) {
    assert.equal(legal.getPolicyDocument(slug), undefined);
    assert.equal(legal.publicPolicyTitle(slug), undefined);
    assert.throws(
      () => page.default({ params: { policy: slug } }),
      /NOT_FOUND/,
    );
  }
});

test("terms contact anchors work and ancillary policy links have local destinations", () => {
  const terms = renderToStaticMarkup(
    React.createElement(page.default, {
      params: { policy: "terms-and-conditions" },
    }),
  );
  assert.ok(terms.includes('id="contactUs"'));
  assert.equal((terms.match(/id="contactUs"/g) || []).length, 1);
  assert.equal(terms.includes('href="/https://'), false);
  assert.ok(terms.includes('href="/terms-and-conditions#contactUs"'));
  assert.ok(terms.includes('href="mailto:info@talentsexplore.com"'));
  for (const slug of ["music-terms", "business-terms"]) {
    const html = renderToStaticMarkup(
      React.createElement(page.default, { params: { policy: slug } }),
    );
    assert.ok(html.includes('href="mailto:info@talentsexplore.com"'));
    assert.ok(html.includes(legal.publicPolicyTitle(slug)));
  }
  const ip = renderToStaticMarkup(
    React.createElement(page.default, {
      params: { policy: "intellectual-property-policy" },
    }),
  );
  assert.ok(ip.includes("Copyright Infringement"));
});

test("signed-out homepage exposes the public policy centre and signed-in routing is preserved", async () => {
  let session = "",
    about = true;
  const Home = load("app/page.tsx", {
    "@/lib/session": { getSession: async () => session },
    "@/actions/session.action": { checkIsAbout: async () => about },
    "next/navigation": navigation,
    "@/components/legal/PublicSiteShell": "shell",
    "@/components/legal/PolicyCentre": "policy-centre",
  }).default;
  assert.equal((await Home()).type, "shell");
  session = "authenticated";
  await assert.rejects(Home(), /REDIRECT:\/home/);
  about = false;
  await assert.rejects(Home(), /REDIRECT:\/complete-profile/);
});

test("public navigation and homepage expose the policies and the public deletion page", () => {
  const Centre = load("components/legal/PolicyCentre.tsx", {
    "@/lib/legal-links": legal,
    "next/link": Link,
  }).default;
  const Shell = load("components/legal/PublicSiteShell.tsx", {
    "@/lib/legal-links": legal,
    "next/link": Link,
    "@/components/options/Theme": () => null,
  }).default;
  const html = renderToStaticMarkup(
    React.createElement(Shell, {}, React.createElement(Centre)),
  );
  for (const link of legal.PUBLIC_POLICY_LINKS)
    assert.ok(html.includes(`href="${link.href}"`));
  assert.ok(html.includes('href="/sign-in"'));
  assert.equal(html.includes('href="/delete-account"'), true);
});

test("the four live policies contain substantive published sections instead of placeholder contact pages", () => {
  for (const [slug, count, phrases] of [
    [
      "intellectual-property-policy",
      3,
      ["Copyright Infringement", "Trademark", "General Note"],
    ],
    [
      "cookies-policy",
      9,
      [
        "What technologies are used?",
        "Categories of tracking technologies",
        "Local storage",
        "Contact us",
      ],
    ],
    [
      "branded-content-policy",
      2,
      [
        "Rules for posting Branded Content",
        "Prohibited Industries",
        "commercial relationship",
      ],
    ],
    [
      "child-safety-standards",
      5,
      [
        "Age Restriction",
        "Zero-Tolerance",
        "NCA",
        "CEOP",
        "How to Report a Concern",
      ],
    ],
  ]) {
    const document = legal.getPolicyDocument(slug);
    assert.equal(document.sections.length, count);
    assert.equal(Object.hasOwn(legal.UNPUBLISHED_POLICIES, slug), false);
    const html = renderToStaticMarkup(
      React.createElement(page.default, { params: { policy: slug } }),
    );
    for (const phrase of phrases) assert.ok(html.includes(phrase), phrase);
    assert.equal(/<script|onClick=|javascript:|<button/.test(html), false);
    assert.ok(html.includes('aria-label="On this page"'));
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
  }
  for (const slug of ["cookies-policy", "child-safety-standards"]) {
    const document = legal.getPolicyDocument(slug);
    assert.ok(
      document.sections.some((section) =>
        section.html.includes('href="mailto:info@talentsexplore.com"'),
      ),
    );
  }
});
