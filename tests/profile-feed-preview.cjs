// Actual profile pagination and cards using simulated pages. No real account changes.
const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript"),
  postcss = require("postcss"),
  tailwind = require("tailwindcss");
(async () => {
  const files = [
    "lib/utils/profile-feed.ts",
    "lib/utils/feedPagination.ts",
    "components/widgets/profile/ProfilePostFeed.tsx",
    "components/cards/AllPostCard.tsx",
    "components/others/EmptyDetails.tsx",
    "public/assets/svgs/CameraIcon.tsx",
    "public/assets/svgs/CreditIcon.tsx",
  ];
  const sources = Object.fromEntries(
    files.map((file) => [
      file,
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2020,
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
const profile='6aff08a32e63b493d0e6e337',other='6aff08a32e63b493d0e6e340';
const calls=[];let fail=false,privateNext=false,slow=false;
const previewImage='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><defs><linearGradient id="g"><stop stop-color="#223c50"/><stop offset="1" stop-color="#849c83"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><circle cx="590" cy="140" r="80" fill="#efd0a0"/><path d="M0 450 250 150 500 450 640 250 800 450" fill="#334e4b"/></svg>');
const icon=()=>h('svg',{width:18,height:18,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor'},h('circle',{cx:12,cy:12,r:8}));
const post=(n,id=profile,kind='all')=>({_id:(n+(id===other?1000:0)+(kind==='credit'?2000:0)).toString(16).padStart(24,'0'),isBestWork:n===1,timeAgo:'Today',numberOfRating:7,postRating:4.2,author:{_id:id,userName:'qa-user'},about:{title:(kind==='credit'?'Credited work ':'Profile post ')+n,description:'A sample creative project used to verify profile pagination and the existing post-card layout.',country:'Sri Lanka',state:'Colombo',mainCategory:'Arts',mainCategoryId:'111111111111111111111111',skill:'Film editing'},media:n===4?[]:[{mediaType:n===3?'video':'image',url:'https://example.test/post-'+n+'.jpg',thumbnailUrl:'https://example.test/video.jpg'}],website:n===4?'https://example.test':null,shareLinkThumbnail:n===4?'https://example.test/shared.jpg':null});
const pageRows=(page,id,kind)=>page===1?Array.from({length:10},(_,i)=>post(i+1,id,kind)):page===2?[post(10,id,kind),...Array.from({length:9},(_,i)=>post(i+11,id,kind))]:page===3?[post(20,id,kind),post(21,id,kind)]:[];
async function getPage(id,kind,page){calls.push({id,kind,page});const delayed=slow;slow=false;await wait(delayed?800:160);if(privateNext){privateNext=false;return {status:'private',message:'This user\'s posts are private.'};}if(fail){fail=false;return {status:'400',message:'Simulated page failure. Loaded posts are retained.'};}return {status:'7400',response:pageRows(page,id,kind)};}
const Button=React.forwardRef(({variant,className,...props},ref)=>h('button',{type:'button',...props,ref,className:'inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 '+(className||'')}));
const mocks={react:React,'react/jsx-runtime':{jsx:(type,props,key)=>h(type,{...props,key}),jsxs:(type,props,key)=>h(type,{...props,key}),Fragment:React.Fragment},
'@/actions/profile-feed.action':{getProfilePostPageAction:getPage},'@/components/ui/button':{Button},
'next/image':({src,alt,width,height,unoptimized,...props})=>h('img',{...props,alt,src:previewImage}),
'next/link':({children,href,...props})=>h('a',{...props,href},children),
'../others/MotionDiv':{MotionDiv:({children,variants,initial,animate,transition,viewport,...props})=>h('article',props,children)},
'@/public/assets/svgs':{MultiPostIcon:icon,PinIcon:icon,StarIcon:icon},'react-icons/go':{GoDotFill:icon},'react-icons/fa6':{FaLocationDot:icon},
'../options':{PostOptions:()=>h('button',{type:'button','aria-label':'Post options',className:'rounded-full bg-dark-300 px-2 py-1 text-light-700'},'...')},
'../others':{RenderTag:({name})=>h('span',{className:'rounded-lg bg-dark-300 px-4 py-3 text-xs uppercase text-light-500'},name)}};
const cache={};function load(name,from=''){if(mocks[name])return mocks[name];let base=name.startsWith('@/')?name.slice(2):name;if(name.startsWith('.')){const parts=from.split('/');parts.pop();for(const part of name.split('/')){if(part==='..')parts.pop();else if(part!=='.')parts.push(part);}base=parts.join('/');}const file=[base,base+'.ts',base+'.tsx'].find(file=>sources[file]);if(!file)throw Error('Unknown preview module '+name);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;new Function('require','module','exports',sources[file])(name=>load(name,file),module,module.exports);return module.exports;}
const Feed=load('components/widgets/profile/ProfilePostFeed.tsx').default;
function App(){const [kind,setKind]=React.useState('all'),[id,setId]=React.useState(profile),[mode,setMode]=React.useState('normal'),[revision,setRevision]=React.useState(0);
const result=React.useMemo(()=>mode==='error'?{status:'400',message:'Simulated initial failure. Try again.'}:mode==='empty'?{status:'7400',response:[]}:{status:'7400',response:pageRows(1,id,kind)},[mode,id,kind,revision]);
return h('main',{className:'mx-auto max-w-6xl p-4 sm:p-8'},h('header',{className:'mb-6 flex flex-wrap gap-2 text-sm text-light-700'},h('p',{},'Profile feed - simulated pages'),h(Button,{id:'all',onClick:()=>setKind('all')},'All posts'),h(Button,{id:'credit',onClick:()=>setKind('credit')},'Credits'),h(Button,{id:'fail',onClick:()=>fail=true},'Fail next page'),h(Button,{id:'private',onClick:()=>privateNext=true},'Make next page private'),h(Button,{id:'slow',onClick:()=>slow=true},'Delay next page'),h(Button,{id:'profile',onClick:()=>setId(value=>value===profile?other:profile)},'Switch profile'),h(Button,{id:'initial-error',onClick:()=>setMode('error')},'Initial error'),h(Button,{id:'empty',onClick:()=>setMode('empty')},'Empty'),h(Button,{id:'reset',onClick:()=>{setMode('normal');setRevision(value=>value+1);}},'Reset'),h(Button,{id:'theme',onClick:()=>document.documentElement.classList.toggle('dark')},'Toggle theme')),
h(Feed,{profileId:id,kind,initialResult:result}));}
window.previewState=()=>({calls});ReactDOM.createRoot(document.getElementById('root')).render(h(App));

`.replace("SOURCES", () => JSON.stringify(sources));
  const target = path.join(
    process.env.TEMP || "/tmp",
    "te-profile-feed-preview.html",
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
