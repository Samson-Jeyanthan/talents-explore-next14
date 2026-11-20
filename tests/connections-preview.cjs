// Actual connection components with a simulated backend; no account mutations.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const files = [
  "lib/utils/connections.ts",
  "lib/hooks/useFollowConnection.ts",
  "components/buttons/ConnectionButton.tsx",
  "components/cards/ConnectionCard.tsx",
  "components/others/ConnectionList.tsx",
  "components/others/LoadFollowerList.tsx",
  "components/others/LoadFollowingList.tsx",
  "components/modals/ConnectionListModal.tsx",
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
  const script = `
const sources=${JSON.stringify(sources)};
const viewer='6aff08a32e63b493d0e6e338', other='6aff08a32e63b493d0e6e339';
const h=React.createElement, Context=React.createContext({}), Confirm=React.createContext({});
let failNext=false, reads=[], writes=[], refreshes=0;
const users=Array.from({length:23},(_,i)=>({_id:(i+100).toString(16).padStart(24,'0'),isTalent:i%4!==0,userName:'creator.'+(i+1),name:'Creator '+(i+1),isFollow:1,profileImage:'data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="40" fill="#5363a7"/><text x="40" y="51" text-anchor="middle" fill="white" font-family="Arial" font-size="30">'+(i+1)+'</text></svg>'),professional:{professional:i%2?'Film director':'Digital artist'}}));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function read(kind,userId,_viewer,page,size){reads.push({kind,userId,page});await pause(200);if(failNext){failNext=false;return {status:500,message:'Simulated connection failure. Please try again.'};}const data=kind==='following'&&userId===viewer?users.filter(u=>u.isFollow===1):users.map(u=>({...u,userName:userId===other?'other.'+u.userName:u.userName}));return {status:'7400',response:data.slice((page-1)*size,page*size).map(u=>({...u})),hasMore:page*size<data.length};}
async function write(following,id){writes.push({following,id});await pause(650);if(failNext){failNext=false;return {status:500,message:'Simulated update failure. Your connection was kept.'};}const target=users.find(u=>u._id===id);if(target)target.isFollow=following?1:0;return {status:'7400'};}
const Button=React.forwardRef(({variant,asChild,...props},ref)=>h('button',{...props,ref}));
const icon=props=>h('svg',{...props,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','aria-hidden':true},h('path',{d:'M6 6l12 12M18 6L6 18'}));
const text=tag=>({children,...props})=>h(tag,props,children);
const alert={AlertDialog:({open,onOpenChange,children})=>open?h(Confirm.Provider,{value:{onOpenChange}},children):null,
AlertDialogContent:({children,className})=>ReactDOM.createPortal(h('div',{style:{position:'fixed',inset:0,zIndex:110,display:'grid',placeItems:'center',background:'#0007'}},h('section',{role:'alertdialog',className,style:{width:'calc(100% - 32px)',padding:24}},children)),document.body),
AlertDialogHeader:text('div'),AlertDialogTitle:text('h2'),AlertDialogDescription:text('p'),AlertDialogFooter:({children})=>h('div',{className:'mt-6 flex justify-end gap-3'},children),AlertDialogAction:Button,
AlertDialogCancel:props=>{const ctx=React.useContext(Confirm);return h(Button,{...props,onClick:()=>ctx.onOpenChange(false)});}};
const mocks={react:React,'react/jsx-runtime':{jsx:(type,props,key)=>h(type,{...props,key}),jsxs:(type,props,key)=>h(type,{...props,key}),Fragment:React.Fragment},
'next/navigation':{useParams:()=>React.useContext(Context).params,useRouter:()=>({refresh:()=>refreshes++})},
'@/context/AuthProvider':{useUserContext:()=>({user:{currentUserId:viewer}})},
'@/actions/connection.action':{getFollowerList:(...a)=>read('followers',...a),getFollowingList:(...a)=>read('following',...a),followUserAction:id=>write(true,id),unFollowUserAction:id=>write(false,id)},
'@/lib/utils':{cn:(...values)=>values.filter(Boolean).join(' ')},'lucide-react':{Loader2:icon,X:icon},'next/link':text('a'),'next/image':text('img'),'@/public/assets/svgs':{StarIcon:()=>null},
'components/ui/button':{Button},'components/ui/alert-dialog':alert,'components/ui/dialog':{DialogTitle:text('h2'),DialogClose:Button,DialogContent:({children,className,...props})=>h('section',{...props,className,role:'dialog',style:{position:'fixed',left:'50%',top:'54%',transform:'translate(-50%,-50%)',width:'calc(100% - 24px)',maxHeight:'78vh'}},children)},
'components/others/MotionDiv':{MotionDiv:({children,className})=>h('div',{className},children)},'components/others/LoadProfileRatingList':{default:()=>h('p',{},'Ratings are outside this preview.'),__esModule:true}};
const cache={};
function resolve(name,from){if(name.startsWith('@/'))return name.slice(2);if(name.startsWith('.')){const parts=from.split('/');parts.pop();for(const part of name.split('/')){if(part==='..')parts.pop();else if(part!=='.')parts.push(part);}return parts.join('/');}return name;}
function load(name,from=''){const base=resolve(name,from);if(mocks[name])return mocks[name];if(mocks[base])return mocks[base];const file=[base,base+'.tsx',base+'.ts'].find(x=>sources[x]);if(!file)throw Error('Unknown preview module: '+base);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;new Function('require','module','exports',sources[file])(name=>load(name,file),module,module.exports);return module.exports;}
const Modal=load('components/modals/ConnectionListModal.tsx').default;
function App(){const [tab,setTab]=React.useState(2),[profile,setProfile]=React.useState(viewer),[privateList,setPrivate]=React.useState(false);return h(Context.Provider,{value:{params:{userId:profile}}},h('header',{style:{position:'fixed',top:12,left:12,right:12,zIndex:1,display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',fontSize:12}},h('strong',{},'Connection UI — simulated data'),h('button',{id:'fail',onClick:()=>{failNext=true;}},'Fail next request'),h('button',{id:'profile',onClick:()=>setProfile(v=>v===viewer?other:viewer)},'Switch profile'),h('button',{id:'private',onClick:()=>setPrivate(v=>!v)},'Toggle privacy'),h('button',{id:'theme',onClick:()=>document.documentElement.classList.toggle('dark')},'Toggle theme')),h(Modal,{isTalent:true,currentTab:tab,onClick(){},setCuurentTab:setTab,canViewRatings:false,canViewFollowers:!privateList,canViewFollowings:!privateList}));}
window.previewState=()=>({reads,writes,refreshes,followed:users.filter(u=>u.isFollow===1).length});
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
`;
  const destination = path.join(
    process.env.TEMP || "/tmp",
    "te-connections-preview.html",
  );
  fs.writeFileSync(
    destination,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TE connections preview</title><style>${css}${fs.readFileSync("styles/palette.css", "utf8")}body{font-family:Arial,sans-serif}.connection-modal-content{box-shadow:0 12px 50px #0002}button:focus-visible{outline:2px solid #c92437;outline-offset:3px}</style></head><body><div id="root"></div><script>${react}</script><script>${reactDOM}</script><script>${script}</script></body></html>`,
  );
  process.stdout.write(destination + "\n");
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
