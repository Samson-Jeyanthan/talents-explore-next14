// Interactive fixture using actual Explore components and simulated responses.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const files = [
  "components/inputs/SearchLookupSelect.tsx",
  "lib/utils/explore.ts",
  "lib/utils/ratings.ts",
  "lib/utils/feedPagination.ts",
  "lib/hooks/useRating.ts",
  "lib/hooks/usePeopleSearch.ts",
  "components/inputs/StarRating.tsx",
  "components/inputs/UserTagAndSearch.tsx",
  "components/others/UserProfileImg.tsx",
  "components/cards/ExplorePostCard.tsx",
  "components/cards/AllTalentsCard.tsx",
  "components/widgets/explore/ExploreSearchSection.tsx",
  "components/widgets/explore/ExploreTabs.tsx",
  "components/widgets/explore/ExploreFilterSheet.tsx",
  "components/widgets/explore/ExploreFilters.tsx",
  "components/widgets/explore/ExploreResults.tsx",
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
const h=React.createElement,Context=React.createContext({}),SheetContext=React.createContext({});
const id='6aff08a32e63b493d0e6e337',other='6aff08a32e63b493d0e6e339',sub='6aff08a32e63b493d0e6e340',skill='6aff08a32e63b493d0e6e341',lang='6aff08a32e63b493d0e6e342',ethnic='6aff08a32e63b493d0e6e343';
let failRead=false,failLookup=false,failPeople=false,requests=[],lookups=[],people=[],votes=[],routes=[];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const poster='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#5363a7"/><circle cx="200" cy="180" r="80" fill="#929cd4"/><text x="200" y="320" text-anchor="middle" font-family="Arial" font-size="26" fill="white">Creative work</text></svg>');
async function search(query){requests.push({...query});const failed=failRead;failRead=false;await wait(query.searchText==='slow'?650:160);if(failed)return {status:500,response:[],message:'Simulated search failure. Please retry.'};const records=query.searchText==='empty'?[]:Array.from({length:24},(_,i)=>({_id:(i+500).toString(16).padStart(24,'0'),userName:'artist.'+(i+1),professional:'Creative director',profileImage:poster,avgRating:4,numberOfRating:7,type:query.searchType==='SHARE'?'SHARELINK':'POST',website:query.searchType==='SHARE'?'https://example.test':undefined,shareLinkThumbnail:query.searchType==='SHARE'?{url:'https://img.test/shared.jpg'}:undefined,media:i%3===0?[]:[{mediaType:i%2?'image':'video',url:'https://img.test/post.jpg',thumbnailUrl:'https://img.test/video.jpg'}],about:{title:(query.searchText||'Discover')+' '+(query.searchType==='SHARE'?'shared link':'creative post')+' '+(i+1)},author:{_id:id,userName:'maya.creates',profileImage:poster},postRating:4.2}));return {status:'7400',response:records.slice((query.pageNo-1)*query.pageSize,query.pageNo*query.pageSize)};}
async function options(kind,parent,shared){lookups.push({kind,parent,shared});const failed=failLookup;failLookup=false;await wait(80);if(failed)return {success:false,message:'Simulated option failure.'};const items={categories:[{value:id,label:shared?'Shared Arts':'Arts'},{value:other,label:'Sports'}],subcategories:[{value:sub,label:'Film'}],skills:[{value:skill,label:'Lighting'}],languages:[{value:lang,label:'Tamil'},{value:other,label:'English'}],ethnic:[{value:ethnic,label:'Example ethnicity'}],countries:[{value:'Sri Lanka',label:'Sri Lanka'},{value:'India',label:'India'}],states:[{value:'Western',label:'Western'}]};return {success:true,data:items[kind]||[]};}
async function lookupPeople(viewer,term,page,size){people.push({term,page,size});const failed=failPeople;failPeople=false;await wait(term==='slow'?650:70);return failed?{status:500,response:[],message:'Simulated user-search failure.'}:{status:'7400',response:[{_id:id,userName:term==='slow'?'old.artist':'new.artist',personalInfo:{firstName:term==='slow'?'Old':'New',lastName:'Artist',profileImage:poster}}]};}
const Button=React.forwardRef(({variant,asChild,...props},ref)=>h('button',{...props,ref}));
const Input=React.forwardRef((props,ref)=>h('input',{...props,ref}));
const icon=props=>h('svg',{width:'1em',height:'1em',...props,viewBox:'0 0 24 24','aria-hidden':true},h('path',{d:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z'}));
const searchIcon=props=>h('svg',{width:'1em',height:'1em',...props,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','aria-hidden':true},h('circle',{cx:10,cy:10,r:6}),h('path',{d:'m14 14 7 7'}));
const filterIcon=props=>h('svg',{width:'1em',height:'1em',...props,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','aria-hidden':true},h('path',{d:'M4 5h16M4 12h16M4 19h16M9 2v6M15 9v6M9 16v6'}));
const native=tag=>({children,...props})=>h(tag,props,children);
const mocks={react:React,zod:Zod,'react/jsx-runtime':{jsx:(type,props,key)=>h(type,{...props,key}),jsxs:(type,props,key)=>h(type,{...props,key}),Fragment:React.Fragment},
'next/navigation':{usePathname:()=>React.useContext(Context).path,useSearchParams:()=>new URLSearchParams(React.useContext(Context).query),useParams:()=>({}),useRouter:()=>{const context=React.useContext(Context);return {push:context.navigate,refresh(){}};}},
'next/link':({href,children,onClick,scroll,...props})=>{const context=React.useContext(Context);return h('a',{...props,href,onClick:event=>{onClick?.(event);event.preventDefault();context.navigate(String(href));}},children);},
'next/image':({src,unoptimized,children,...props})=>h('img',{...props,src:src.startsWith('https://img.test')?poster:src},children),
'@/context/AuthProvider':{useUserContext:()=>({user:{currentUserId:other}})},'@/public/assets/svgs':{StarIcon:icon},'lucide-react':{X:icon},'react-icons/ci':{CiSearch:searchIcon},'react-icons/sl':{SlEqualizer:filterIcon},
'@/components/ui/button':{Button},'@/components/ui/input':{Input},'@/lib/utils':{cn:(...values)=>values.filter(Boolean).join(' ')},
'@/actions/search.action':{searchAction:search,getExploreFilterOptionsAction:options,searchPeopleTag:lookupPeople},'@/actions/connection.action':{addPostRating:(...args)=>{votes.push(args);throw Error('Unexpected saved rating');},addProfileRatingAction:(...args)=>{votes.push(args);throw Error('Unexpected saved rating');}},
'@/components/ui/sheet':{Sheet:({open,onOpenChange,children})=>h(SheetContext.Provider,{value:{open,onOpenChange}},children),SheetTrigger:({onClick,...props})=>{const context=React.useContext(SheetContext);return h(Button,{...props,onClick:()=>context.onOpenChange(true)});},SheetContent:({children,className,...props})=>{const context=React.useContext(SheetContext);return context.open?ReactDOM.createPortal(h('div',{style:{position:'fixed',inset:0,zIndex:110,background:'#0005'}},h('section',{...props,role:'dialog',className,style:{position:'absolute',right:0,top:0,height:'100%',maxWidth:440}},h('button',{'aria-label':'Close filters',style:{position:'absolute',right:20,top:20},onClick:()=>context.onOpenChange(false)},'×'),children)),document.body):null;},SheetHeader:native('div'),SheetTitle:native('h2')}};
const cache={};
function resolve(name,from){if(name.startsWith('@/'))return name.slice(2);if(name.startsWith('.')){const parts=from.split('/');parts.pop();for(const part of name.split('/')){if(part==='..')parts.pop();else if(part!=='.')parts.push(part);}return parts.join('/');}return name;}
function load(name,from=''){const base=resolve(name,from);if(mocks[name])return mocks[name];if(mocks[base])return mocks[base];const file=[base,base+'.tsx',base+'.ts'].find(x=>sources[x]);if(!file)throw Error('Unknown preview module: '+base);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;new Function('require','module','exports',sources[file])(name=>load(name,file),module,module.exports);return module.exports;}
const utils=load('lib/utils/explore.ts'),Results=load('components/widgets/explore/ExploreResults.tsx').default,Header=load('components/widgets/explore/ExploreSearchSection.tsx').default,Tabs=load('components/widgets/explore/ExploreTabs.tsx').default,People=load('components/inputs/UserTagAndSearch.tsx').default;
function App(){const [url,setUrl]=React.useState('/explore/shared?q=music');const [path,query='']=url.split('?');const navigate=next=>{routes.push(next);setUrl(next);};const type=path.endsWith('talents')?'TALENT':path.endsWith('shared')?'SHARE':path.endsWith('posts')?'FEED':'ALL';const request=utils.buildExploreQuery(type,query);return h(Context.Provider,{value:{path,query,navigate}},h('main',{className:'mx-auto flex w-full max-w-5xl flex-col gap-5 p-4'},h('header',{className:'flex flex-wrap items-center justify-between gap-3'},h('p',{className:'text-xs text-light-600'},'Explore UI — simulated data'),h(People,{isTag:false})),h('div',{className:'flex flex-wrap gap-4 text-xs text-light-600'},h('button',{id:'failRead',onClick:()=>failRead=true},'Fail next result request'),h('button',{id:'failLookup',onClick:()=>failLookup=true},'Fail next options'),h('button',{id:'failPeople',onClick:()=>failPeople=true},'Fail next user search'),h('button',{id:'theme',onClick:()=>document.documentElement.classList.toggle('dark')},'Toggle theme')),h('div',{className:'relative flex flex-col gap-4 rounded-2xl bg-dark-300 p-4'},h(Header),h(Tabs)),path.startsWith('/profile/')?h('p',{id:'opened'},'Opened profile '+path):h(Results,{key:JSON.stringify(request),query:request})));}
window.previewState=()=>({requests,lookups,people,votes,routes});ReactDOM.createRoot(document.getElementById('root')).render(h(App));
`;
  const destination = path.join(
    process.env.TEMP || "/tmp",
    "te-explore-preview.html",
  );
  fs.writeFileSync(
    destination,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TE Explore preview</title><style>${css}${fs.readFileSync("styles/palette.css", "utf8")}body{font-family:Arial,sans-serif}button:focus-visible{outline:2px solid #c92437;outline-offset:3px}</style></head><body><div id="root"></div><script>${react}</script><script>${reactDOM}</script><script>${zod}</script><script>${script}</script></body></html>`,
  );
  process.stdout.write(destination + "\n");
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
