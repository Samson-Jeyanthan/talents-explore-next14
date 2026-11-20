const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(file)
      : /\.tsx?$/.test(file)
        ? [file]
        : [];
  });
}

test("client import paths cannot reach server-only modules through shared component indexes", () => {
  const metadata = new Map();
  function inspect(file) {
    if (metadata.has(file)) return metadata.get(file);
    const ast = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const directives = ast.statements
      .filter(
        (node) =>
          ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression),
      )
      .map((node) => node.expression.text);
    const imports = [];
    for (const node of ast.statements) {
      if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node))
        continue;
      if (
        !node.moduleSpecifier ||
        !ts.isStringLiteral(node.moduleSpecifier) ||
        node.isTypeOnly ||
        node.importClause?.isTypeOnly
      )
        continue;
      const bindings = node.importClause?.namedBindings || node.exportClause;
      if (
        bindings &&
        ts.isNamedImports(bindings) &&
        !node.importClause.name &&
        bindings.elements.every((element) => element.isTypeOnly)
      )
        continue;
      imports.push(node.moduleSpecifier.text);
    }
    const result = { directives, imports };
    metadata.set(file, result);
    return result;
  }
  function resolve(file, specifier) {
    const base = specifier.startsWith("@/")
      ? path.resolve(specifier.slice(2))
      : specifier.startsWith(".")
        ? path.resolve(path.dirname(file), specifier)
        : null;
    if (!base) return null;
    return [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
    ].find(
      (candidate) => /\.tsx?$/.test(candidate) && fs.existsSync(candidate),
    );
  }
  const visited = new Set();
  function walk(file, chain) {
    if (visited.has(file)) return;
    visited.add(file);
    const info = inspect(file);
    if (info.directives.includes("use server")) return;
    for (const specifier of info.imports) {
      assert(
        !["server-only", "next/headers"].includes(specifier),
        [...chain, file, specifier].join(" -> "),
      );
      const child = resolve(file, specifier);
      if (child) walk(child, [...chain, file]);
    }
  }
  for (const directory of ["app", "components", "context", "lib"]) {
    for (const file of sourceFiles(directory)) {
      if (inspect(path.resolve(file)).directives.includes("use client"))
        walk(path.resolve(file), []);
    }
  }
});

function sessionActions(token, profile, failure) {
  let reads = 0;
  const testModule = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync("actions/session.action.ts", "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      module: testModule,
      exports: testModule.exports,
      require: (name) =>
        name === "@/lib/session"
          ? { getSession: async () => token }
          : name === "./auth.action"
            ? {
                getUserPersonalInfoAction: async (argument) => {
                  reads++;
                  assert.equal(argument, "");
                  if (failure) throw failure;
                  return profile;
                },
              }
            : {},
    },
  );
  return { actions: testModule.exports, reads: () => reads };
}

test("browser auth bootstrap receives profile data without a public token-reading action", async () => {
  const response = {
    status: "7400",
    response: { _id: "viewer", userName: "tester" },
  };
  const h = sessionActions("private-test-token", response);
  const actual = await h.actions.getCurrentSessionUserAction();
  assert.equal(actual, response);
  assert(!JSON.stringify(actual).includes("private-test-token"));
  assert.equal(h.actions.getSession, undefined);
  assert.equal(h.reads(), 1);
});

test("signed-out auth bootstrap returns null without redirecting or loading a profile", async () => {
  const h = sessionActions("");
  assert.equal(await h.actions.getCurrentSessionUserAction(), null);
  assert.equal(h.reads(), 0);
});

test("profile failures and session redirects propagate instead of pretending the user is signed out", async () => {
  const failure = new Error("Refresh required or temporarily unavailable");
  const h = sessionActions("private-test-token", null, failure);
  await assert.rejects(
    h.actions.getCurrentSessionUserAction(),
    (error) => error === failure,
  );
});
