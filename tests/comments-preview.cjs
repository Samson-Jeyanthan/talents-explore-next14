// Static visual preview using the actual comment components and fictional data.
// Run: node tests/comments-preview.cjs, then open the printed HTML file.
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

const avatar = (letter, colour) =>
  `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="40" fill="${colour}"/><text x="40" y="51" text-anchor="middle" font-family="Arial" font-size="32" fill="white">${letter}</text></svg>`).toString("base64")}`;
const viewerId = "6aff08a32e63b493d0e6e340";
const postId = "6aff08a32e63b493d0e6e337";
const parent = {
  _id: "6aff08a32e63b493d0e6e338",
  comment:
    "The colours and transitions in this short film work beautifully. How did you light the opening scene?",
  author: {
    _id: "creator",
    userName: "maya.creates",
    profileImage: avatar("M", "#5363A7"),
  },
  totalLikes: 8,
  isLiked: true,
  totalReplies: 2,
  createdAt: "2026-11-20T09:15:00Z",
};
const replies = [
  {
    _id: "6aff08a32e63b493d0e6e339",
    comment: "Thank you! We used soft window light with a small reflector.",
    author: {
      _id: viewerId,
      userName: "alex.films",
      profileImage: avatar("A", "#2C7B79"),
    },
    totalLikes: 3,
    isLiked: false,
    totalReplies: 0,
    createdAt: "2026-11-20T09:22:00Z",
  },
  {
    _id: "6aff08a32e63b493d0e6e341",
    comment: "That explains the soft shadows. Thanks for sharing the setup!",
    author: parent.author,
    totalLikes: 1,
    isLiked: false,
    totalReplies: 0,
    createdAt: "2026-11-20T09:28:00Z",
  },
];
const user = {
  currentUserId: viewerId,
  username: "alex.films",
  imageUrl: replies[0].author.profileImage,
};
const cache = new Map();
let previewItems = replies;
const modules = {
  "next/link": "a",
  "next/image": (props) => React.createElement("img", props),
  "next/navigation": { usePathname: () => `/post/${postId}` },
  "@/lib/utils": { cn: (...values) => twMerge(clsx(values)) },
  "@/context/AuthProvider": { useUserContext: () => ({ user }) },
  "@/actions/comment.action": {},
  "@/lib/hooks/useCommentPages": {
    useCommentPages: () => ({
      items: previewItems,
      loading: false,
      hasMore: true,
      error: "",
      load() {},
      prepend() {},
      refresh() {},
    }),
  },
  "../options": {
    EmojisOptions: () =>
      React.createElement("span", { className: "text-light-500" }, "☺"),
  },
};
function load(file) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute);
  const testModule = { exports: {} };
  cache.set(absolute, testModule.exports);
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
        if (Object.prototype.hasOwnProperty.call(modules, name))
          return modules[name];
        if (name.startsWith("@/") || name.startsWith(".")) {
          const base = name.startsWith("@/")
            ? path.resolve(name.slice(2))
            : path.resolve(path.dirname(absolute), name);
          const local = [
            `${base}.tsx`,
            `${base}.ts`,
            path.join(base, "index.ts"),
          ].find((file) => fs.existsSync(file));
          if (local) return load(local);
        }
        return require(name);
      },
    },
  );
  return testModule.exports;
}

(async () => {
  const Card = load("components/cards/CommentCard.tsx").default;
  const Input = load("components/inputs/CommentInput.tsx").default;
  const markup = renderToStaticMarkup(
    React.createElement(
      "main",
      { className: "mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6" },
      React.createElement(
        "h1",
        { className: "text-xl font-semibold text-light-900" },
        "Comments",
      ),
      React.createElement(Card, {
        commentDetails: parent,
        canReply: true,
        postAuthorId: viewerId,
        onReply() {},
        onDelete() {},
        newReply: { comment: replies[0], parentId: parent._id, serial: 1 },
        replyTargetId: replies[1]._id,
        inlineReply: React.createElement(Input, {
          postId,
          commentType: "INLINE",
          replyCommentId: replies[1]._id,
          replyRootId: parent._id,
          author: parent.author,
          onCancelReply() {},
          onSent() {},
        }),
      }),
      React.createElement(Card, {
        commentDetails: {
          ...parent,
          _id: "6aff08a32e63b493d0e6e342",
          comment: "Great teamwork. Looking forward to your next project!",
          totalReplies: 0,
          totalLikes: 2,
          isLiked: false,
          author: {
            _id: "another",
            userName: "sam.design",
            profileImage: avatar("S", "#9C6538"),
          },
        },
        canReply: true,
        postAuthorId: viewerId,
        onReply() {},
        onDelete() {},
      }),
    ),
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
  const destination = path.join(
    process.env.TEMP || "/tmp",
    "te-comments-preview.html",
  );
  fs.writeFileSync(
    destination,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comment layout preview</title><style>${css}</style></head><body>${markup}</body></html>`,
  );
  process.stdout.write(destination + "\n");
  previewItems = Array.from({ length: 20 }, (_, index) => ({
    ...parent,
    _id: index.toString(16).padStart(24, "0"),
    totalReplies: 0,
  }));
  const Thread = load(
    "components/widgets/postMoreDetails/CommentThread.tsx",
  ).default;
  const modal = renderToStaticMarkup(
    React.createElement(
      "main",
      { className: "p-4" },
      React.createElement(
        "div",
        {
          className:
            "mx-auto flex h-[85dvh] max-h-[85dvh] max-w-xl flex-col gap-4 overflow-hidden rounded-2xl border border-dark-400 bg-dark-250 p-4 text-light-900",
        },
        React.createElement(
          "h1",
          { className: "text-xl font-semibold" },
          "Comments",
        ),
        React.createElement(Thread, {
          postId,
          numberOfComments: 20,
          canComment: true,
          commentType: "MODAL",
          postAuthorId: viewerId,
        }),
      ),
    ),
  );
  const modalDestination = destination.replace(".html", "-modal.html");
  fs.writeFileSync(
    modalDestination,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comment modal preview</title><style>${css}</style></head><body>${modal}</body></html>`,
  );
  process.stdout.write(modalDestination + "\n");
})().catch((error) => {
  process.stderr.write(error.message + "\n");
  process.exitCode = 1;
});
