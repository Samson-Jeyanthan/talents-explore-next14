// Actual overview sections, cards and Embla carousel with simulated failures. No account changes.
const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript"),
  postcss = require("postcss"),
  tailwind = require("tailwindcss");
(async () => {
  const files = [
    "lib/utils/profile-sections.ts",
    "lib/utils/profile-feed.ts",
    "lib/utils/profile-education.ts",
    "lib/utils/profile-awards.ts",
    "lib/hooks/useProfileSectionRead.ts",
    "components/widgets/profile/ProfileTopPosts.tsx",
    "components/widgets/profile/ProfileLanguageEducation.tsx",
    "components/widgets/profile/ProfileEducationList.tsx",
    "components/widgets/carousels/TopPostsCarousel.tsx",
    "components/widgets/carousels/EmblaCarouselArrowButtons.tsx",
    "components/cards/TopPostCard.tsx",
    "components/cards/ProDetailCards.tsx",
    "components/others/EmptyDetails.tsx",
    ...["PostIcon", "LanguageIcon", "GraduationIcon"].map(
      (name) => `public/assets/svgs/${name}.tsx`,
    ),
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
  ]).process(
    [
      "app/globals.css",
      "styles/topPostsCarousel.css",
      "styles/moreDetailPostCarousel.css",
    ]
      .map((file) => fs.readFileSync(file, "utf8"))
      .join("\n"),
    {
      from: "app/globals.css",
    },
  );
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
  const embla = fs.readFileSync(
    "node_modules/embla-carousel-react/embla-carousel-react.umd.js",
    "utf8",
  );
  const script = String.raw`
const sources=SOURCES,h=React.createElement,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const profile='6aff08a32e63b493d0e6e337',other='6aff08a32e63b493d0e6e340',calls=[];let failTop=false,failLanguages=false,slow=false;
const ok=response=>({status:'7400',response}),error=message=>({status:'400',response:[],message});
const topRows=id=>Array.from({length:3},(_,i)=>({_id:(i+(id===other?50:1)).toString(16).padStart(24,'0'),about:{title:(id===other?'Other profile':'Creative project')+' '+(i+1)},media:i===1?[]:[{mediaType:i===2?'video':'image',url:'https://example.test/photo.jpg',thumbnailUrl:'https://example.test/video.jpg'}],postRating:4.5}));
const languageRows=id=>[{_id:id,languageId:'111111111111111111111111',languageName:id===other?'Tamil':'English',level:'advanced'},{_id:'222222222222222222222222',languageId:'333333333333333333333333',languageName:'Sinhala',level:'intermediate'}];
const educationRows=()=>[{_id:'444444444444444444444444',course:'Film production',institution:'Example institute',from:2020,to:'present'}];
async function read(kind,id){calls.push({kind,id});const delayed=slow;slow=false;await wait(delayed?800:160);if(kind==='top'&&failTop){failTop=false;return error('Unable to load Top Posts. Please try again.');}if(kind==='languages'&&failLanguages){failLanguages=false;return error('Unable to load languages. Please try again.');}return ok(kind==='top'?topRows(id):kind==='languages'?languageRows(id):educationRows());}
const previewImage='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><defs><linearGradient id="g"><stop stop-color="#223c50"/><stop offset="1" stop-color="#849c83"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><circle cx="590" cy="140" r="80" fill="#efd0a0"/><path d="M0 450 250 150 500 450 640 250 800 450" fill="#334e4b"/></svg>');
const icon=()=>h('svg',{width:18,height:18,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor'},h('circle',{cx:12,cy:12,r:8}));
const Button=React.forwardRef(({variant,className,...props},ref)=>h('button',{type:'button',...props,ref,className:'inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 '+(className||'')}));
const mocks={react:React,zod:Zod,'react/jsx-runtime':{jsx:(type,props,key)=>h(type,{...props,key}),jsxs:(type,props,key)=>h(type,{...props,key}),Fragment:React.Fragment},
'embla-carousel-react':EmblaCarouselReact,
'@/actions/profile-overview.action':{getProfileTopPostsAction:id=>read('top',id),getProfileLanguagesAction:id=>read('languages',id)},'@/actions/profile-education.action':{getProfileEducationsAction:id=>read('education',id)},
'@/components/ui/button':{Button},'next/image':({src,alt,width,height,unoptimized,...props})=>h('img',{...props,alt,src:previewImage}),'next/link':({href,children,...props})=>h('a',{...props,href},children),
'@/public/assets/svgs':{StarIcon:icon},'react-icons/io':{IoIosArrowBack:icon,IoIosArrowForward:icon},
'../others/MotionDiv':{MotionDiv:({children,variants,initial,animate,transition,viewport,...props})=>h('div',props,children)},
'@/components/cards':{TopPostCard:props=>h(load('components/cards/TopPostCard.tsx').default,props)},
'../options':{ProInfoEditOptions:()=>window.previewOwn()?h('button',{type:'button','aria-label':'Edit detail',className:'text-light-500'},'✎'):null},
'@/components/buttons':{ProInfoAddBtn:({detailName})=>h('button',{type:'button','aria-label':'Add '+detailName,className:'teritory-button'},'+ ADD')}};
const cache={};function load(name,from=''){if(name.endsWith('.css'))return {};if(mocks[name])return mocks[name];let base=name.startsWith('@/')?name.slice(2):name;if(name.startsWith('.')){const parts=from.split('/');parts.pop();for(const part of name.split('/')){if(part==='..')parts.pop();else if(part!=='.')parts.push(part);}base=parts.join('/');}const file=[base,base+'.ts',base+'.tsx'].find(file=>sources[file]);if(!file)throw Error('Unknown preview module '+name);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;new Function('require','module','exports',sources[file])(name=>load(name,file),module,module.exports);return module.exports;}
const Top=load('components/widgets/profile/ProfileTopPosts.tsx').default,Details=load('components/widgets/profile/ProfileLanguageEducation.tsx').default;
function App(){const [id,setId]=React.useState(profile),[mode,setMode]=React.useState('error'),[own,setOwn]=React.useState(true),[revision,setRevision]=React.useState(0);window.previewOwn=()=>own;
const initial=React.useMemo(()=>({top:mode==='error'?error('Unable to load Top Posts. Please try again.'):mode==='empty'?ok([]):mode==='private'?{status:'private',response:[],message:'This profile is private.'}:ok(topRows(id)),languages:mode==='error'?error('Unable to load languages. Please try again.'):mode==='empty'?ok([]):mode==='private'?{status:'private',response:[],message:'This profile is private.'}:ok(languageRows(id)),education:mode==='empty'?ok([]):ok(educationRows())}),[id,mode,revision]);
return h('main',{className:'mx-auto max-w-5xl p-4 sm:p-8'},h('header',{className:'mb-6 flex flex-wrap gap-2 text-sm text-light-700'},h('p',{},'Profile overview - simulated services'),h(Button,{id:'fail-top',onClick:()=>failTop=true},'Fail next Top Posts'),h(Button,{id:'fail-languages',onClick:()=>failLanguages=true},'Fail next languages'),h(Button,{id:'slow',onClick:()=>slow=true},'Delay next request'),h(Button,{id:'switch',onClick:()=>setId(value=>value===profile?other:profile)},'Switch profile'),h(Button,{id:'error',onClick:()=>{setMode('error');setRevision(value=>value+1);}},'Load failures'),h(Button,{id:'empty',onClick:()=>setMode('empty')},'Empty'),h(Button,{id:'private',onClick:()=>setMode('private')},'Private'),h(Button,{id:'success',onClick:()=>setMode('success')},'Loaded'),h(Button,{id:'own',onClick:()=>setOwn(value=>!value)},own?'View as visitor':'View as owner'),h(Button,{id:'theme',onClick:()=>document.documentElement.classList.toggle('dark')},'Toggle theme')),
h('div',{className:'grid w-full min-w-0 gap-10 rounded-3xl border-2 border-dark-300 bg-dark-250 p-4'},h(Top,{profileId:id,isOwnProfile:own,initialResult:initial.top}),h(Details,{profileId:id,isOwnProfile:own,initialLanguages:initial.languages,initialEducation:initial.education})));
}
window.previewState=()=>({calls});ReactDOM.createRoot(document.getElementById('root')).render(h(App));

`.replace("SOURCES", () => JSON.stringify(sources));
  const target = path.join(
    process.env.TEMP || "/tmp",
    "te-profile-overview-preview.html",
  );
  fs.writeFileSync(
    target,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${fs.readFileSync("styles/palette.css", "utf8")}body{font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script>${react}</script><script>${dom}</script><script>${zod}</script><script>${embla}</script><script>${script}</script></body></html>`,
  );
  process.stdout.write(target + "\n");
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
