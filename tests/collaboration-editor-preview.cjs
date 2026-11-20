// Render the actual editor with simulated saves/lookups; no account requests.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
(async () => {
  const files = [
    "lib/utils/collaboration-editor.ts",
    "components/widgets/collaboration/CollaborationEditor.tsx",
    "components/widgets/collaboration/CollaborationFieldPickers.tsx",
    "components/inputs/SearchLookupSelect.tsx",
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
    require.resolve("react").replace(/index\.js$/, "umd/react.development.js"),
    "utf8",
  );
  const reactDOM = fs.readFileSync(
    require
      .resolve("react-dom")
      .replace(/index\.js$/, "umd/react-dom.development.js"),
    "utf8",
  );
  const script = `
const sources=${JSON.stringify(sources)};
const h=React.createElement, wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const requests=[],messages=[],uploads=[];
const id='6aff08a32e63b493d0e6e337', roleId='6aff08a32e63b493d0e6e339';
const user={_id:id,userName:'test'};
const details={owner:user,collaboration:{title:'Example film production',description:'A preview project for checking collaboration editing.',location:'Colombo',longitude:0,latitude:0,deadlineToApply:'2026-12-01T12:00:00Z',expectedDays:'2 weeks',productionInfo:{title:'Example studio',type:'Film'},contactInfo:{email:'test@example.com'},targetedAudience:{ageRange:'13-60',publicRating:0}},roles:[{_id:roleId,name:'Actor',description:'A lead role in the production.',skills:[{mainCategoryId:id,subCategoryId:roleId}],paymentDetails:{payment:'PAID',currency:'USD',amount:'100',type:'PER_DAY'},timeLineType:'BY_DATE',timeLine:[{startDate:'2026-12-02T09:00:00Z',endDate:'2026-12-03T17:00:00Z',mode:'MEETUP',location:'Colombo',longitude:0,latitude:0}]}]};
const Button=React.forwardRef(({className,...props},ref)=>h('button',{...props,ref,className:'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 '+(className||'')}));
const Input=React.forwardRef(({className,...props},ref)=>h('input',{...props,ref,'aria-label':props['aria-label']||props.placeholder,className:'flex h-10 w-full rounded-md border px-3 py-2 text-sm '+(className||'')}));
const DialogContext=React.createContext(null);
const dialogs={Dialog:({open,onOpenChange,children})=>open?h(DialogContext.Provider,{value:onOpenChange},h('div',{role:'dialog','aria-modal':'true',className:'fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3'},children)):null,
DialogContent:({children,className})=>h('div',{className:'mx-auto my-4 p-5 '+className},h('button',{'aria-label':'Close dialog',className:'float-right p-2',onClick:()=>window.closeDialog?.()},'Close'),children)};
for(const name of ['DialogHeader','DialogFooter','DialogTitle','DialogDescription'])dialogs[name]=({children,...props})=>h('div',props,children);
function CloseBridge(){window.closeDialog=React.useContext(DialogContext);return null;}
const originalContent=dialogs.DialogContent;dialogs.DialogContent=props=>h(React.Fragment,null,h(CloseBridge),h(originalContent,props));
const mock={react:React,'react/jsx-runtime':{jsx:(type,props,key)=>h(type,{...props,key}),jsxs:(type,props,key)=>h(type,{...props,key}),Fragment:React.Fragment},
'@/components/ui/button':{Button},'@/components/ui/input':{Input},'@/components/ui/textarea':{Textarea:props=>h('textarea',{...props,'aria-label':props.placeholder})},'@/components/ui/dialog':dialogs,
'next/link':({href,children,...props})=>h('a',{...props,href,onClick:e=>e.preventDefault()},children),'next/image':props=>h('img',props),
'@/constants':{GENDER_VALUES:[{id:'male',name:'Male'}],LEVEL_VALUES:[{_id:'beginner',name:'Beginner'}]},
'sonner':{toast:{error:message=>{messages.push(message);document.getElementById('messages').textContent=message;}}},
'@/lib/utils/uploadFile':{uploadFileToStorage:async file=>{uploads.push(file.name);await wait(100);return{key:'poster',url:'https://example.com/poster.jpg'};}},
'@/actions/collaboration.action':{updateCollaborationAction:async(...args)=>{requests.push(args);await wait(300);return {status:'400',message:'Simulated save failure. Your changes are still here.'};},createCollaborationAction:async()=>({status:'400'})},
'@/actions/search.action':{getExploreFilterOptionsAction:async(kind)=>{await wait(60);return {success:true,data:kind==='categories'?[{value:id,label:'Arts'}]:kind==='subcategories'?[{value:roleId,label:'Acting'}]:[]};}}};
const cache={};function load(name){if(mock[name])return mock[name];if(name==='lucide-react')return new Proxy({},{get:(_,key)=>key==='__esModule'?false:props=>h('svg',{...props,width:'1em',height:'1em',viewBox:'0 0 24 24'},h('path',{d:'M5 12h14',stroke:'currentColor'}))});const base=name.replace(/^@\\//,'');const file=[base,base+'.ts',base+'.tsx'].find(file=>sources[file]);if(!file)throw Error('Unknown preview module '+name);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;new Function('require','module','exports',sources[file])(load,module,module.exports);return module.exports;}
const Editor=load('components/widgets/collaboration/CollaborationEditor.tsx').default;
function App(){return h('main',{className:'mx-auto max-w-6xl'},h('div',{className:'p-4 text-sm text-light-700'},'Collaboration editor — simulated data ',h('button',{onClick:()=>document.documentElement.classList.toggle('dark')},'Toggle theme')),h('div',{id:'messages',role:'status',className:'px-4 text-primary-500'}),h(Editor,{mode:'edit',collaborationId:id,currentUser:user,initialDetails:details,lookupData:{mainCategories:[],languages:[],countries:[],ethnicities:[],professions:[]}}));}
window.previewState=()=>({requests,messages,uploads});ReactDOM.createRoot(document.getElementById('root')).render(h(App));
`;
  const destination = path.join(
    process.env.TEMP || "/tmp",
    "te-collaboration-editor-preview.html",
  );
  fs.writeFileSync(
    destination,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Collaboration editor preview</title><style>${css}${fs.readFileSync("styles/palette.css", "utf8")}body{font-family:Arial,sans-serif}button:focus-visible{outline:2px solid #c92437;outline-offset:3px}</style></head><body><div id="root"></div><script>${react}</script><script>${reactDOM}</script><script>${script}</script></body></html>`,
  );
  process.stdout.write(destination + "\n");
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
