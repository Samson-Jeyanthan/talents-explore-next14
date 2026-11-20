// Actual rating components with a simulated backend. No account changes.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const files = [
  "lib/utils/ratings.ts",
  "lib/utils/feedPagination.ts",
  "lib/hooks/useRating.ts",
  "lib/hooks/useProfileRatings.ts",
  "components/inputs/StarRating.tsx",
  "components/others/LoadProfileRatingList.tsx",
  "components/others/HorzBar.tsx",
  "components/others/RadialBar.tsx",
  "components/cards/RatingCard.tsx",
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
const viewer='6aff08a32e63b493d0e6e338', first='6aff08a32e63b493d0e6e337', second='6aff08a32e63b493d0e6e339';
const h=React.createElement, Context=React.createContext({});
let failVote=false,failList=false,failSummary=false,empty=false,restricted=false,reads=[],votes=[],refreshes=0,formSubmits=0;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const avatar='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="40" fill="#5363a7"/><text x="40" y="51" text-anchor="middle" font-family="Arial" font-size="32" fill="white">A</text></svg>');
const users=Array.from({length:23},(_,i)=>({_id:(i+200).toString(16).padStart(24,'0'),userName:'artist.'+(i+1),firstName:'Artist '+(i+1),lastName:'',profileImage:avatar,professional:'Filmmaker',rating:4}));
async function list(target,page,size){reads.push({kind:'list',target,page});await pause(250);if(failList){failList=false;return {status:500,message:'Simulated list failure. Please try again.'};}if(restricted)return {status:403,restricted:true,message:'Private ratings'};return {status:'7400',response:empty?[]:users.slice((page-1)*size,page*size).map(u=>({...u,userName:target===second?'other.'+u.userName:u.userName}))};}
async function summary(target){reads.push({kind:'summary',target});await pause(300);if(failSummary){failSummary=false;return {status:500,message:'Simulated summary failure. Please try again.'};}if(restricted)return {status:403,restricted:true,message:'Private ratings'};return {status:'7400',response:empty?{avgRating:0,numberOfRating:0,oneStar:0,twoStar:0,threeStar:0,fourStar:0,fiveStar:0}:{avgRating:4.2,numberOfRating:23,oneStar:0,twoStar:0,threeStar:4,fourStar:10,fiveStar:9}};}
async function vote(kind,args){votes.push({kind,args});await pause(650);if(failVote){failVote=false;return {status:500,message:'Simulated save failure. Previous rating kept.'};}return {status:'7400'};}
const Button=React.forwardRef(({variant,asChild,...props},ref)=>h('button',{...props,ref}));
const native=tag=>({children,...props})=>h(tag,props,children);
const mocks={react:React,'react/jsx-runtime':{jsx:(type,props,key)=>h(type,{...props,key}),jsxs:(type,props,key)=>h(type,{...props,key}),Fragment:React.Fragment},
'next/navigation':{useParams:()=>React.useContext(Context).params,useRouter:()=>({refresh:()=>refreshes++})},
'@/context/AuthProvider':{useUserContext:()=>({user:{currentUserId:viewer}})},
'@/actions/connection.action':{getProfileRatingList:list,getProfileOverallRating:summary,addProfileRatingAction:(...args)=>vote('profile',args),addPostRating:(...args)=>vote('post',args)},
'@/lib/utils':{cn:(...values)=>values.filter(Boolean).join(' ')},'@/public/assets/svgs':{StarIcon:props=>h('svg',{...props,viewBox:'0 0 24 24','aria-hidden':true},h('path',{d:'m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1z'}))},
'next/link':native('a'),'next/image':native('img'),'components/ui/button':{Button},'components/others/MotionDiv':{MotionDiv:({children,className})=>h('div',{className},children)}};
const cache={};
function resolve(name,from){if(name.startsWith('@/'))return name.slice(2);if(name.startsWith('.')){const parts=from.split('/');parts.pop();for(const part of name.split('/')){if(part==='..')parts.pop();else if(part!=='.')parts.push(part);}return parts.join('/');}return name;}
function load(name,from=''){const base=resolve(name,from);if(mocks[name])return mocks[name];if(mocks[base])return mocks[base];const file=[base,base+'.tsx',base+'.ts'].find(x=>sources[x]);if(!file)throw Error('Unknown preview module: '+base);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;new Function('require','module','exports',sources[file])(name=>load(name,file),module,module.exports);return module.exports;}
const Stars=load('components/inputs/StarRating.tsx').default,List=load('components/others/LoadProfileRatingList.tsx').default;
function App(){const [target,setTarget]=React.useState(first),[filter,setFilter]=React.useState(3),[upload,setUpload]=React.useState(4);return h(Context.Provider,{value:{params:{userId:target}}},h('main',{className:'mx-auto flex max-w-3xl flex-col gap-5 p-4'},h('header',{},h('h1',{className:'text-xl font-semibold text-light-900'},'Ratings — simulated data'),h('p',{className:'mt-2 text-xs text-light-600'},'Actual web components. No account data is changed.')),h('div',{className:'flex flex-wrap gap-3 text-xs text-light-700'},h('button',{id:'failVote',onClick:()=>failVote=true},'Fail next save'),h('button',{id:'failList',onClick:()=>failList=true},'Fail next list'),h('button',{id:'failSummary',onClick:()=>failSummary=true},'Fail next summary'),h('button',{id:'target',onClick:()=>setTarget(v=>v===first?second:first)},'Switch target'),h('button',{id:'empty',onClick:()=>empty=!empty},'Toggle empty response'),h('button',{id:'privacy',onClick:()=>restricted=!restricted},'Toggle private response'),h('button',{id:'theme',onClick:()=>document.documentElement.classList.toggle('dark')},'Toggle theme')),h('section',{className:'flex flex-col gap-4 rounded-xl border border-dark-400 bg-dark-250 p-4'},...['PROFILE','POST','SHARE'].map(mode=>h('div',{'data-control':mode,key:mode,className:'flex flex-wrap items-start justify-between gap-2'},h('p',{className:'text-sm text-light-700'},mode==='PROFILE'?'Profile rating':mode==='POST'?'Post rating':'Shared-post rating'),h(Stars,{prevRatingValue:target===first?2:1,ratingFor:mode,authorId:target,postId:target,revalidatePath:'/home'})))),h('form',{className:'flex flex-col gap-4 rounded-xl border border-dark-400 bg-dark-250 p-4',onSubmit:e=>{e.preventDefault();formSubmits++;}},...['FILTER','UPLOAD'].map(mode=>h('div',{'data-control':mode,key:mode,className:'flex flex-wrap justify-between gap-2'},h('p',{className:'text-sm text-light-700'},mode==='FILTER'?'Filter minimum':'Upload self-rating'),h(Stars,{prevRatingValue:mode==='FILTER'?filter:upload,ratingFor:mode,authorId:'',revalidatePath:'',onChange:mode==='FILTER'?setFilter:setUpload}))),h('button',{id:'reset',type:'button',className:'self-start text-xs text-light-600 underline',onClick:()=>{setFilter(0);setUpload(0);}},'Reset form values')),h('div',{className:'rounded-xl border border-dark-400 bg-dark-250 p-4'},h(List))));}
window.previewState=()=>({reads,votes,refreshes,formSubmits});ReactDOM.createRoot(document.getElementById('root')).render(h(App));
`;
  const destination = path.join(
    process.env.TEMP || "/tmp",
    "te-ratings-preview.html",
  );
  fs.writeFileSync(
    destination,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TE ratings preview</title><style>${css}${fs.readFileSync("styles/palette.css", "utf8")}body{font-family:Arial,sans-serif}button:focus-visible{outline:2px solid #c92437;outline-offset:3px}</style></head><body><div id="root"></div><script>${react}</script><script>${reactDOM}</script><script>${script}</script></body></html>`,
  );
  process.stdout.write(destination + "\n");
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
