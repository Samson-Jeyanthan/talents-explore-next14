// Actual awards UI with simulated API responses. No real profile changes.
const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript"),
  postcss = require("postcss"),
  tailwind = require("tailwindcss");
(async () => {
  const files = [
    "lib/utils/profile-awards.ts",
    "lib/hooks/useProfileAwardWrite.ts",
    "components/inputs/CertificateInput.tsx",
    "components/cards/ProDetailCards.tsx",
    "public/assets/svgs/AwardsIcon.tsx",
    "components/others/EmptyDetails.tsx",
    ...[
      "ProfileAwardEditor",
      "ProfileAwardDeleteDialog",
      "ProfileAwardsList",
    ].map((name) => `components/widgets/profile/${name}.tsx`),
  ];
  const sources = Object.fromEntries(
    files.map((file) => [
      file,
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
    ]),
  );
  const compiled = await postcss([
    tailwind(require("../tailwind.config.ts")),
  ]).process(fs.readFileSync("app/globals.css", "utf8"), {
    from: "app/globals.css",
  });
  const css = postcss.parse(compiled.css);
  css.walkAtRules("import", (rule) => rule.remove());
  const react = fs.readFileSync(
      require
        .resolve("react")
        .replace(/index\.js$/, "umd/react.development.js"),
      "utf8",
    ),
    dom = fs.readFileSync(
      require
        .resolve("react-dom")
        .replace(/index\.js$/, "umd/react-dom.development.js"),
      "utf8",
    ),
    zod = fs.readFileSync(
      require.resolve("zod").replace(/index\.js$/, "index.umd.js"),
      "utf8",
    );
  const script = String.raw`
const sources=SOURCES,h=React.createElement,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const id='6aff08a32e63b493d0e6e337';let fail=false,sequence=10;
const writes=[],uploads=[];
let rows=[{_id:'6aff08a32e63b493d0e6e339',name:'Creative achievement award',givenBy:'Example arts academy',year:2025,certificateUrl:'https://example.test/certificate.pdf',certificateUrlKey:'awards/creative-achievement.pdf'},{_id:'6aff08a32e63b493d0e6e340',name:'Advanced production certificate',givenBy:'Example film institute',year:2023,certificateUrl:'https://example.test/certificate.docx',certificateUrlKey:'awards/production-certificate.docx'}];
async function save(payload){writes.push({type:'save',payload});await wait(200);if(fail){fail=false;return {status:'400',response:[],message:'Simulated save failure. Your information is still here.'};}if(payload.awardId)rows=rows.map(row=>row._id===payload.awardId?{...row,...payload.award}:row);else rows.push({_id:(sequence++).toString(16).padStart(24,'0'),...payload.award});return {status:'7400',response:rows};}
async function remove(profileId,awardId){writes.push({type:'delete',profileId,awardId});await wait(200);if(fail){fail=false;return {status:'400',response:[],message:'Simulated delete failure. Try again.'};}rows=rows.filter(row=>row._id!==awardId);return {status:'7400',response:rows};}
const Button=React.forwardRef(({variant,className,...props},ref)=>h('button',{...props,ref,className:'inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 '+(className||'')}));
const Input=React.forwardRef(({className,...props},ref)=>h('input',{...props,ref,className:'flex h-10 w-full min-w-0 rounded-md border bg-dark-200 px-3 py-2 text-sm text-light-900 '+(className||'')}));
const dialogs={};for(const name of ['Dialog','AlertDialog'])dialogs[name]=({open,children})=>open?h('div',{role:'dialog','aria-modal':'true',className:'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3'},children):null;
for(const name of ['DialogContent','AlertDialogContent'])dialogs[name]=({children,className,onEscapeKeyDown,onInteractOutside})=>h('div',{className:'w-full p-6 '+className},children);
for(const name of ['DialogHeader','AlertDialogHeader'])dialogs[name]=({children})=>h('header',{className:'mb-3 grid gap-2'},children);
for(const name of ['DialogTitle','AlertDialogTitle'])dialogs[name]=({children})=>h('h2',{className:'text-xl font-semibold'},children);
for(const name of ['DialogDescription','AlertDialogDescription'])dialogs[name]=({children})=>h('p',{className:'text-sm text-light-600'},children);
dialogs.AlertDialogFooter=({children})=>h('footer',{className:'mt-4 flex justify-end gap-2'},children);
const mocks={react:React,zod:Zod,'react/jsx-runtime':{jsx:(type,props,key)=>h(type,{...props,key}),jsxs:(type,props,key)=>h(type,{...props,key}),Fragment:React.Fragment},
'@/components/ui/button':{Button},'@/components/ui/input':{Input},'@/components/ui/dialog':dialogs,'@/components/ui/alert-dialog':dialogs,
'next/navigation':{useParams:()=>({userId:id}),useRouter:()=>({refresh:()=>window.refreshPreview()})},
'@/actions/profile-awards.action':{getProfileAwardsAction:async()=>({status:'7400',response:rows}),saveProfileAwardAction:save,deleteProfileAwardAction:remove},
'@/lib/utils/uploadFile':{uploadFileToStorage:async file=>{uploads.push(file.name);await wait(150);return {url:'https://example.test/'+encodeURIComponent(file.name),key:'awards/'+file.name};}},
'@/components/buttons':{ProInfoAddBtn:()=>h(Button,{onClick:()=>window.editPreview(null)},'Add award')},
'../options':{ProInfoEditOptions:({data})=>h('div',{className:'flex gap-2'},h(Button,{onClick:()=>window.editPreview(data),'aria-label':'Edit '+data.name},'Edit'),h(Button,{onClick:()=>window.deletePreview(data),'aria-label':'Delete '+data.name},'Delete'))},
'../others/MotionDiv':{MotionDiv:({children,variants,initial,animate,transition,viewport,...props})=>h('div',props,children)}};
const cache={};function load(name,from=''){if(mocks[name])return mocks[name];let base=name.startsWith('@/')?name.slice(2):name;if(name.startsWith('.')){const parts=from.split('/');parts.pop();for(const part of name.split('/')){if(part==='..')parts.pop();else if(part!=='.')parts.push(part);}base=parts.join('/');}const file=[base,base+'.ts',base+'.tsx'].find(file=>sources[file]);if(!file)throw Error('Unknown preview module '+name);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;new Function('require','module','exports',sources[file])(name=>load(name,file),module,module.exports);return module.exports;}
const List=load('components/widgets/profile/ProfileAwardsList.tsx').default,Editor=load('components/widgets/profile/ProfileAwardEditor.tsx').default,Delete=load('components/widgets/profile/ProfileAwardDeleteDialog.tsx').default;
function App(){const [revision,setRevision]=React.useState(0),[editing,setEditing]=React.useState(undefined),[deleting,setDeleting]=React.useState(null);
window.refreshPreview=()=>setRevision(value=>value+1);window.editPreview=setEditing;window.deletePreview=setDeleting;
const result=React.useMemo(()=>({status:'7400',response:rows.map(row=>({...row}))}),[revision]);
return h('main',{className:'mx-auto max-w-4xl p-4 sm:p-8'},h('header',{className:'mb-6 flex flex-wrap gap-3 text-sm text-light-700'},h('p',{},'Awards UI - simulated records'),h(Button,{id:'fail',onClick:()=>fail=true},'Fail next request'),h(Button,{onClick:()=>document.documentElement.classList.toggle('dark')},'Toggle theme')),
h(List,{profileId:id,isOwnProfile:true,initialResult:result}),h(Editor,{isOpen:editing!==undefined,isEdit:editing!=null,data:editing,onClose:()=>setEditing(undefined)}),deleting?h(Delete,{isOpen:true,data:deleting,onClose:()=>setDeleting(null)}):null);}
window.previewState=()=>({writes,uploads,rows});ReactDOM.createRoot(document.getElementById('root')).render(h(App));
`.replace("SOURCES", () => JSON.stringify(sources));
  const target = path.join(
    process.env.TEMP || "/tmp",
    "te-profile-awards-preview.html",
  );
  fs.writeFileSync(
    target,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${fs.readFileSync("styles/palette.css", "utf8")}body{font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script>${react}</script><script>${dom}</script><script>${zod}</script><script>${script}</script></body></html>`,
  );
  process.stdout.write(target + "\n");
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
