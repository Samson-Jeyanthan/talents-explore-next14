// Actual dashboard and filter controls with simulated responses; no account writes.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const files = [
  "lib/utils/collaboration.ts",
  "lib/hooks/useCollaborationLists.ts",
  "components/widgets/collaboration/CollaborationDashboard.tsx",
  "components/widgets/collaboration/CollaborationCard.tsx",
  "components/inputs/SearchLookupSelect.tsx",
  "components/others/UserProfileImg.tsx",
];
(async () => {
  const compiled = await postcss([
    tailwind(require("../tailwind.config.ts")),
  ]).process(fs.readFileSync("app/globals.css", "utf8"), {
    from: "app/globals.css",
  });
  const css = postcss.parse(compiled.css);
  css.walkAtRules("import", (rule) => rule.remove());
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
  const zod = fs.readFileSync(
    require.resolve("zod").replace(/index\.js$/, "index.umd.js"),
    "utf8",
  );
  const script = `
const sources=${JSON.stringify(sources)};
const h=React.createElement;let requests=[],lookups=[],navigation=[],failNext=false,failOptions=false;
const id='6aff08a32e63b493d0e6e337',viewer='6aff08a32e63b493d0e6e338',sub='6aff08a32e63b493d0e6e340',skill='6aff08a32e63b493d0e6e341';
const avatar='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="40" fill="#5363a7"/><text x="40" y="51" text-anchor="middle" fill="white" font-family="Arial" font-size="32">A</text></svg>');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function list(query){requests.push(JSON.parse(JSON.stringify(query)));const failed=failNext;failNext=false;await wait(query.filters?.keywords==='slow'?650:160);if(failed)return {status:'400',response:[],message:'Simulated network failure. Please retry.'};const empty=query.type==='APPLIED'||query.filters?.keywords==='empty';const prefix={ALL:1000,MY:2000,COMMITTED:3000,RECEIVED:4000,APPLIED:5000}[query.type];const records=Array.from({length:empty?0:24},(_,index)=>({collaboration:{_id:(prefix+index).toString(16).padStart(24,'0'),title:query.type+' '+(query.filters?.keywords||'project')+' '+(index+1),description:'A creative project looking for people to build something together.',location:query.filters?.country||'Colombo',expectedDays:14,deadlineToApply:'2026-12-30T12:00:00Z'},owner:{_id:viewer,userName:'artist',profileImage:avatar,professional:{professional:'Creative director'}},rolesCount:3}));return {status:'7400',response:records.slice((query.pageNo-1)*query.pageSize,query.pageNo*query.pageSize)};}
async function options(kind,parent='',shared=false){lookups.push({kind,parent,shared});const failed=failOptions;failOptions=false;await wait(80);if(failed)return {success:false,message:'Simulated filter option failure.'};const choices={categories:[{value:id,label:'Arts'},{value:viewer,label:'Sports'}],subcategories:[{value:sub,label:'Film'}],skills:[{value:skill,label:'Lighting'}],languages:[{value:id,label:'Tamil'}],ethnic:[{value:id,label:'Example ethnicity'}],countries:[{value:'Sri Lanka',label:'Sri Lanka'},{value:'India',label:'India'}],states:[{value:'Western',label:'Western'}]};return {success:true,data:choices[kind]||[]};}
const Button=React.forwardRef(({variant,className,...props},ref)=>h('button',{...props,ref,className:'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium disabled:pointer-events-none disabled:opacity-50 '+(className||'')})),Input=React.forwardRef(({className,...props},ref)=>h('input',{...props,ref,className:'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-light-900 '+(className||'')}));
const mocks={react:React,zod:Zod,'react/jsx-runtime':{jsx:(type,props,key)=>h(type,{...props,key}),jsxs:(type,props,key)=>h(type,{...props,key}),Fragment:React.Fragment},
'@/components/ui/button':{Button},'@/components/ui/input':{Input},'@/lib/utils':{cn:(...values)=>values.filter(Boolean).join(' ')},
'next/link':({href,children,...props})=>h('a',{...props,href,onClick:event=>{event.preventDefault();navigation.push(href);}},children),'next/image':({children,...props})=>h('img',props,children),
'date-fns':{format:date=>new Date(date).toISOString().slice(0,10)},'@/actions/collaboration.action':{getCollaborationListAction:list},'@/actions/search.action':{getExploreFilterOptionsAction:options},
'@/constants':{GENDER_VALUES:[{id:'male',name:'Male'},{id:'female',name:'Female'}],LEVEL_VALUES:[{_id:'beginner',name:'Beginner'},{_id:'advanced',name:'Advanced'}],TIME_DURATION_FILTERS:[{id:'one month',name:'One month'},{id:'one year',name:'One year'}]}};
const cache={};function resolve(name,from){if(name.startsWith('@/'))return name.slice(2);if(name.startsWith('.')){const parts=from.split('/');parts.pop();for(const part of name.split('/')){if(part==='..')parts.pop();else if(part!=='.')parts.push(part);}return parts.join('/');}return name;}
function load(name,from=''){const base=resolve(name,from);if(mocks[name])return mocks[name];if(mocks[base])return mocks[base];const file=[base,base+'.tsx',base+'.ts'].find(x=>sources[x]);if(!file)throw Error('Unknown preview module: '+base);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;new Function('require','module','exports',sources[file])(name=>load(name,file),module,module.exports);return module.exports;}
const Dashboard=load('components/widgets/collaboration/CollaborationDashboard.tsx').default;
const initialResult={status:'400',response:[],message:'Simulated initial outage. Please try again.'},user={_id:viewer,userName:'artist'};
function App(){return h('main',{className:'mx-auto w-full max-w-6xl'},h('header',{className:'flex flex-wrap items-center gap-4 p-4 text-xs text-light-600'},h('strong',{},'Collaboration UI — simulated data'),h('button',{id:'fail',onClick:()=>failNext=true},'Fail next request'),h('button',{id:'failOptions',onClick:()=>failOptions=true},'Fail next filter options'),h('button',{id:'theme',onClick:()=>document.documentElement.classList.toggle('dark')},'Toggle theme')),h(Dashboard,{currentUser:user,initialResult}));}
window.previewState=()=>({requests,lookups,navigation});ReactDOM.createRoot(document.getElementById('root')).render(h(App));
`;
  const destination = path.join(
    process.env.TEMP || "/tmp",
    "te-collaboration-preview.html",
  );
  fs.writeFileSync(
    destination,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TE collaboration preview</title><style>${css}${fs.readFileSync("styles/palette.css", "utf8")}body{font-family:Arial,sans-serif}button:focus-visible{outline:2px solid #c92437;outline-offset:3px}</style></head><body><div id="root"></div><script>${react}</script><script>${reactDOM}</script><script>${zod}</script><script>${script}</script></body></html>`,
  );
  process.stdout.write(destination + "\n");
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
