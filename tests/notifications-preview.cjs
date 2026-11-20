// Standalone UI preview: actual notification cards, app CSS and fictional data.
// Run node tests/notifications-preview.cjs and open the printed HTML path.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const { twMerge } = require("tailwind-merge");
const { clsx } = require("clsx");
const modules = {
  "next/image": ({ src, alt, width, height, className }) =>
    React.createElement("img", { src, alt, width, height, className }),
  "@/lib/utils": { cn: (...values) => twMerge(clsx(values)) },
};
function load(file) {
  const absolute = path.resolve(file);
  const testModule = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    {
      module: testModule,
      exports: testModule.exports,
      require: (name) => {
        if (Object.hasOwn(modules, name)) return modules[name];
        if (name.startsWith("@/") || name.startsWith(".")) {
          const base = name.startsWith("@/")
            ? path.resolve(name.slice(2))
            : path.resolve(path.dirname(absolute), name);
          const local = [`${base}.tsx`, `${base}.ts`].find((file) =>
            fs.existsSync(file),
          );
          if (local) return load(local);
        }
        return require(name);
      },
    },
  );
  return testModule.exports;
}
const avatar = (letter, color) =>
  `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="40" fill="${color}"/><text x="40" y="51" text-anchor="middle" font-family="Arial" font-size="32" fill="white">${letter}</text></svg>`).toString("base64")}`;
const fixtures = [
  {
    _id: "6aff08a32e63b493d0e6e337",
    status: "2",
    type: "post",
    senderUserName: "maya.creates",
    senderProfilePicture: avatar("M", "#5363A7"),
    message: "Commented on your short film: The opening scene looks beautiful!",
    timeAgo: "5 minutes",
  },
  {
    _id: "6aff08a32e63b493d0e6e338",
    status: 2,
    type: "follow",
    senderUserName: "alex.films",
    senderProfilePicture: avatar("A", "#2C7B79"),
    message: "Started following you.",
    timeAgo: "18 minutes",
  },
  {
    _id: "6aff08a32e63b493d0e6e339",
    status: "1",
    type: "collaboration",
    senderUserName: "sam.design",
    senderProfilePicture: avatar("S", "#9C6538"),
    message: "Invited you to collaborate on a new creative project.",
    timeAgo: "2 hours ago",
  },
];
(async () => {
  const Card = load("components/cards/NotificationCard.tsx").default;
  const markup = (item, busy = false) =>
    renderToStaticMarkup(
      React.createElement(Card, {
        notificationCard: item,
        busy,
        disabled: busy,
        onOpen() {},
        onDelete() {},
        onMarkRead() {},
      }),
    );
  const readCards = Object.fromEntries(
    fixtures.map((item) => [item._id, markup({ ...item, status: "1" })]),
  );
  const pendingCards = Object.fromEntries(
    fixtures.map((item) => [item._id, markup(item, true)]),
  );
  const compiled = await postcss([
    tailwind(require("../tailwind.config.ts")),
  ]).process(fs.readFileSync("app/globals.css", "utf8"), {
    from: "app/globals.css",
  });
  const localCss = postcss.parse(compiled.css);
  localCss.walkAtRules("import", (rule) => rule.remove());
  const css =
    localCss.toString() + fs.readFileSync("styles/palette.css", "utf8");
  function document(theme) {
    const content = fixtures
      .map((item) => `<div data-item="${item._id}">${markup(item)}</div>`)
      .join("");
    return `<!doctype html><html lang="en" class="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{font-family:Arial,sans-serif}button{transition:background .15s}button:hover{filter:brightness(.94)}</style></head><body><main class="flex flex-col gap-4 p-4 sm:p-6"><header><h2 class="text-xl font-semibold text-light-900">Notifications</h2><p id="count" aria-live="polite" class="mt-2 text-xs text-light-500">2 unread in this list</p><div class="mt-4 flex flex-wrap gap-4 text-xs text-light-700"><button id="reset" type="button">↻ Reset preview</button><button id="all" type="button">Mark all read</button></div></header><div id="cards" class="flex flex-col gap-3">${content}</div><p class="mt-2 text-xs leading-relaxed text-light-500">Try “Mark as read”. This preview simulates a successful update and changes no account data.</p></main><script>
const readCards=${JSON.stringify(readCards)}, pendingCards=${JSON.stringify(pendingCards)};
let active=false;
function count(){const number=document.querySelectorAll('[data-read-state="unread"]').length; document.getElementById('count').textContent=number?number+' unread in this list':'No unread notifications in this list';}
document.getElementById('reset').onclick=()=>location.reload();
document.getElementById('all').onclick=()=>{if(active)return;document.querySelectorAll('[data-item]').forEach(row=>row.innerHTML=readCards[row.dataset.item]);count();};
document.getElementById('cards').onclick=event=>{const button=event.target.closest('button'),row=event.target.closest('[data-item]');if(!button||!row||active)return;if((button.getAttribute('aria-label')||'').startsWith('Delete')){if(confirm('Remove this fictional notification from the preview?')){row.remove();count();}return;}if(!row.querySelector('[data-read-state="unread"]'))return;active=true;row.innerHTML=pendingCards[row.dataset.item];setTimeout(()=>{row.innerHTML=readCards[row.dataset.item];active=false;count();},550);};
</script></body></html>`;
  }
  const escape = (value) =>
    value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const destination = path.join(
    process.env.TEMP || "/tmp",
    "te-notifications-preview.html",
  );
  const outer = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TE notifications — read and unread</title><style>*{box-sizing:border-box}body{margin:0;background:#e8ebf0;color:#0a1938;font-family:Arial,sans-serif}main{max-width:1080px;margin:auto;padding:28px 24px}h1{margin:0 0 10px;font-size:24px}p{margin:0 0 22px;font-size:14px;line-height:1.6;color:#49454f}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:24px}.panel h2{font-size:13px;margin:0 0 12px;letter-spacing:.06em;text-transform:uppercase;color:#5e5a64}iframe{border:1px solid #c7c7c7;border-radius:20px;width:100%;height:660px;background:white;box-shadow:0 12px 30px #0a193812}.legend{display:flex;flex-wrap:wrap;gap:12px 24px;margin-top:20px;font-size:13px;line-height:1.8}.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#c92437;margin-right:6px}@media(max-width:700px){.comparison{grid-template-columns:1fr}main{padding:20px 12px}}</style></head><body><main><h1>Notifications: read &amp; unread</h1><p>UI preview using the actual web notification cards and fictional activity.</p><div class="comparison"><section class="panel"><h2>Light mode</h2><iframe title="Light mode notification preview" srcdoc="${escape(document(""))}"></iframe></section><section class="panel"><h2>Dark mode</h2><iframe title="Dark mode notification preview" srcdoc="${escape(document("dark"))}"></iframe></section></div><div class="legend"><span><span class="dot"></span><b>Unread:</b> tinted card, accent border, bold text, unread label.</span><span><b>✓ Read:</b> neutral card, quieter text, read label.</span></div></main></body></html>`;
  fs.writeFileSync(destination, outer);
  process.stdout.write(destination + "\n");
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
