// Isolated preview of the real deletion screen with simulated actions only.
const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript"),
  postcss = require("postcss"),
  tailwind = require("tailwindcss");
(async () => {
  const source = ts.transpileModule(
    fs.readFileSync("components/legal/DeleteAccountFlow.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const compiled = await postcss([
    tailwind(require("../tailwind.config.ts")),
  ]).process(fs.readFileSync("app/globals.css", "utf8"), {
    from: "app/globals.css",
  });
  const css = postcss.parse(compiled.css);
  css.walkAtRules("import", (rule) => rule.remove());
  const react = fs.readFileSync(
    require.resolve("react").replace(/index\.js$/, "umd/react.development.js"),
    "utf8",
  );
  const dom = fs.readFileSync(
    require
      .resolve("react-dom")
      .replace(/index\.js$/, "umd/react-dom.development.js"),
    "utf8",
  );
  const script = String.raw`
const h=React.createElement,calls=[];let failVerify=false,failDelete=false,expire=false,slow=false;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const actions={
async verifyDeletionAccountAction(input){calls.push({action:'verify',email:input.email});await wait(120);if(failVerify){failVerify=false;return {status:'7403',message:'Simulated invalid credentials.'};}return {status:'7400',account:{id:'111111111111111111111111',email:input.email,username:'qa-user'}};},
async deleteVerifiedAccountAction(id,confirmed){calls.push({action:'delete',id,confirmed});const delay=slow;slow=false;await wait(delay?700:120);if(expire){expire=false;return {status:'7403',reauthenticate:true,message:'Simulated expired verification. Please sign in again.'};}if(failDelete){failDelete=false;return {status:'7500',message:'Simulated deletion failure. Your account is unchanged.'};}return {status:'7400',message:'Simulated deletion acknowledged.'};},
async cancelAccountDeletionAction(){calls.push({action:'cancel'});await wait(120);return {success:true};}
};
const Button=({variant,className,children,...props})=>h('button',{...props,className:'rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50 '+(variant==='destructive'?'bg-primary-500 text-light-900 ':'border border-dark-400 text-light-900 ')+(className||'')},children);
const box=(tag,classes)=>( {children,className,...props})=>h(tag,{...props,className:classes+' '+(className||'')},children);
const dialog={AlertDialog:({open,children})=>open?h('div',{className:'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'},children):null,
AlertDialogCancel:({children})=>children,
AlertDialogContent:({children,className})=>h('section',{role:'alertdialog','aria-modal':true,'aria-label':'Confirm deletion',className:'w-full max-w-lg space-y-4 border p-6 '+(className||'')},children),
AlertDialogHeader:box('div','space-y-3'),AlertDialogTitle:box('h2','text-xl font-semibold'),AlertDialogDescription:box('p','text-sm leading-6'),AlertDialogFooter:box('div','flex flex-wrap justify-end gap-3')};
const mocks={'react':React,'react/jsx-runtime':{Fragment:React.Fragment,jsx:(type,props,key)=>h(type,{...props,key}),jsxs:(type,props,key)=>h(type,{...props,key})},
'next/link':({children,href,...props})=>h('a',{...props,href},children),
'@/components/ui/button':{Button},'@/components/ui/input':{Input:props=>h('input',{...props,className:'rounded-lg border border-dark-400 p-3 text-light-900 '+(props.className||'')})},
'@/components/ui/alert-dialog':dialog,'@/actions/account-deletion.action':actions,
'@/context/AuthProvider':{INITIAL_USER:{currentUserId:''},useUserContext:()=>({setUser:()=>calls.push({action:'signed-out'})})},
'@/lib/functions/auth.functions':{handleClearStorage:async()=>calls.push({action:'storage-cleared'})}};
const module={exports:{}};new Function('require','module','exports',SOURCE)(name=>{if(!mocks[name])throw Error('Unexpected preview module '+name);return mocks[name];},module,module.exports);
const Flow=module.exports.default;
function App(){const [version,setVersion]=React.useState(0);return h('main',{className:'mx-auto max-w-6xl p-4 sm:p-8'},h('div',{className:'mb-6 flex flex-wrap items-center gap-3 text-sm text-light-700'},h('p',{},'QA preview - simulated actions; no real account changes.'),h(Button,{id:'verify-fail',onClick:()=>failVerify=true},'Fail verification'),h(Button,{id:'delete-fail',onClick:()=>failDelete=true},'Fail deletion'),h(Button,{id:'expire',onClick:()=>expire=true},'Expire verification'),h(Button,{id:'slow',onClick:()=>slow=true},'Delay deletion'),h(Button,{id:'reset',onClick:()=>setVersion(v=>v+1)},'Reset'),h(Button,{id:'theme',onClick:()=>document.documentElement.classList.toggle('dark')},'Toggle theme')),h(Flow,{key:version}));}
window.deletionPreviewState=()=>({calls});ReactDOM.createRoot(document.getElementById('root')).render(h(App));
`.replace("SOURCE", () => JSON.stringify(source));
  const target = path.join(
    process.env.TEMP || "/tmp",
    "te-account-deletion-preview.html",
  );
  fs.writeFileSync(
    target,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${fs.readFileSync("styles/palette.css", "utf8")}body{font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script>${react}</script><script>${dom}</script><script>${script}</script></body></html>`,
  );
  process.stdout.write(target + "\n");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
