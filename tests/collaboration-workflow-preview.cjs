// Actual workflow components with simulated responses. No account writes.
const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript"),
  postcss = require("postcss"),
  tailwind = require("tailwindcss");
(async () => {
  const files = [
    "lib/utils/collaboration.ts",
    "lib/utils/collaboration-editor.ts",
    "lib/utils/collaboration-workflow.ts",
    "lib/utils/collaboration-schedule.ts",
    "lib/hooks/useCollaborationWorkflow.ts",
    "components/inputs/SearchLookupSelect.tsx",
    ...[
      "CollaborationApplicationDialog",
      "CollaborationApplicantList",
      "CollaborationReviewButtons",
      "CollaborationInvitePeople",
      "CollaborationPeopleFilters",
      "CollaborationApplicantDetails",
      "CollaborationSchedulePage",
      "CollaborationTimeline",
      "CollaborationRoleRequirements",
    ].map((name) => `components/widgets/collaboration/${name}.tsx`),
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
const sources=SOURCES;
const h=React.createElement,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const id='6aff08a32e63b493d0e6e337',role='6aff08a32e63b493d0e6e339',person='6aff08a32e63b493d0e6e340';
const requests=[],writes=[],uploads=[],navigation=[];let failNext=false;
const rows=Array.from({length:24},(_,i)=>({applicationId:(100+i).toString(16).padStart(24,'0'),roleId:role,roleName:'Actor',applicantId:i===0?person:(200+i).toString(16).padStart(24,'0'),applicant:{id:i===0?person:(200+i).toString(16).padStart(24,'0'),userName:'Artist '+(i+1),professional:'Performer',avgRating:4.5,numberOfRating:12},applicantType:i===1?'INVITED':'APPLIED',applicantStatus:i===0?'ACCEPTED':'APPLIED',applicantName:'Artist',applicantEmail:'artist@example.test',message:'I would love to join this production.',resumeFileUrl:'https://example.test/cv.pdf',resumeFileKey:'cv.pdf'}));
const stats=()=>({totalApplicants:24,totalInvites:1,totalShortlisted:rows.filter(x=>x.applicantStatus==='SHORTLISTED').length,totalFinalized:rows.filter(x=>x.applicantStatus==='FINALIZED').length,totalRejected:rows.filter(x=>x.applicantStatus==='REJECTED').length,totalRoles:1});
async function read(query){requests.push(query);const fail=failNext;failNext=false;await wait(120);if(fail)return {status:'400',response:[],message:'Simulated network failure. Please retry.'};let list=rows.filter(row=>query.filter==='INVITED'?row.applicantType==='INVITED':['SHORTLISTED','FINALIZED','REJECTED'].includes(query.filter)?row.applicantStatus===query.filter:true);if(query.search)list=list.filter(row=>row.applicant.userName.toLowerCase().includes(query.search.toLowerCase()));return {status:'7400',response:list.slice(((query.pageNo||1)-1)*20,(query.pageNo||1)*20).map(x=>JSON.parse(JSON.stringify(x)))};}
const actions={getCollaborationApplicantsAction:(_id,query)=>read(query),getCollaborationApplicantsStatsAction:async()=>stats(),getCollaborationApplicantsRoleStatsAction:async()=>stats(),
reviewCollaborationApplicantAction:async(_id,payload)=>{writes.push(payload);await wait(180);if(failNext){failNext=false;return {status:'400',message:'Simulated review failure.'};}for(const row of rows)if(row.applicantId===payload.applicantId)row.applicantStatus={ACCEPT:'ACCEPTED',SHORTLIST:'SHORTLISTED',FINALIZED:'FINALIZED',REJECT:'REJECTED'}[payload.action];return {status:'7400'};},
getCollaborationApplicantDetailsAction:async()=>JSON.parse(JSON.stringify(rows[0])),
applyToCollaborationRoleAction:async(_id,payload)=>{writes.push(payload);await wait(180);if(failNext){failNext=false;return {status:'400',message:'Simulated application failure. Your information is still here.'};}return {status:'7400'};},
searchCollaborationPeopleAction:async query=>{requests.push(query);await wait(100);if(failNext){failNext=false;return {status:'400',message:'Simulated search failure.'};}return {status:'7400',response:rows.slice(((query.pageNo||1)-1)*20,(query.pageNo||1)*20).map(x=>({_id:x.applicantId,userName:x.applicant.userName,professional:'Performer'}))};},
invitePeopleToCollaborationAction:async(_id,payload)=>{writes.push(payload);await wait(180);return {status:'400',message:'Simulated invitation failure. Selections are retained.'};}};
const Button=React.forwardRef(({className,...props},ref)=>h('button',{...props,ref,className:'inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 '+(className||'')}));
const Input=React.forwardRef(({className,...props},ref)=>h('input',{...props,ref,className:'flex h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm '+(className||'')}));
const DialogContext=React.createContext(null);
const dialog={Dialog:({open,onOpenChange,children})=>open?h(DialogContext.Provider,{value:onOpenChange},h('div',{role:'dialog','aria-modal':true,className:'fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3'},children)):null,
DialogContent:({children,className,onEscapeKeyDown,onInteractOutside,...props})=>h('div',{...props,className:'mx-auto my-4 p-5 '+className},children)};
for(const name of ['DialogHeader','DialogFooter','DialogTitle','DialogDescription'])dialog[name]=({children,...props})=>h('div',props,children);
const mocks={react:React,zod:Zod,'react/jsx-runtime':{jsx:(type,props,key)=>h(type,{...props,key}),jsxs:(type,props,key)=>h(type,{...props,key}),Fragment:React.Fragment},'@/components/ui/button':{Button},'@/components/ui/input':{Input},'@/components/ui/textarea':{Textarea:props=>h('textarea',props)},'@/components/ui/dialog':dialog,
'next/link':({href,children,...props})=>h('a',{...props,href,onClick:event=>{event.preventDefault();navigation.push(href);}},children),'next/image':props=>h('img',props),'@/components/others/UserProfileImg':({userName,className})=>h('span',{className:'flex size-12 shrink-0 items-center justify-center rounded-full bg-dark-200 text-light-900 '+(className||'')},userName?.slice(0,1)),
'@/constants':{GENDER_VALUES:[{id:'male',name:'Male'}],LEVEL_VALUES:[{_id:'advanced',name:'Advanced'}],TIME_DURATION_FILTERS:[{id:'one month',name:'One month'}]},
'@/actions/collaboration.action':actions,'@/actions/search.action':{getExploreFilterOptionsAction:async kind=>({success:true,data:kind==='categories'?[{value:id,label:'Arts'}]:kind==='subcategories'?[{value:role,label:'Acting'}]:[]})},
'@/lib/utils/uploadFile':{uploadFileToStorage:async file=>{uploads.push(file.name);await wait(100);return {url:'https://example.test/cv.pdf',key:'cv.pdf'};}}};
const cache={};function load(name,from=''){if(mocks[name])return mocks[name];if(name==='lucide-react')return new Proxy({},{get:(_,key)=>key==='__esModule'?false:props=>h('svg',{...props,width:'1em',height:'1em'})});let base=name.startsWith('@/')?name.slice(2):name;if(name.startsWith('.')){const parts=from.split('/');parts.pop();for(const part of name.split('/')){if(part==='..')parts.pop();else if(part!=='.')parts.push(part);}base=parts.join('/');}const file=[base,base+'.ts',base+'.tsx'].find(file=>sources[file]);if(!file)throw Error('Unknown module '+name);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;new Function('require','module','exports',sources[file])(name=>load(name,file),module,module.exports);return module.exports;}
const Schedule=load('components/widgets/collaboration/CollaborationSchedulePage.tsx').default;
const scheduleRole={_id:role,name:'Lead actor',subtitle:'Feature film',description:'A full role description.\nBring your experience and creativity.',gender:'female',languageSeeking:{language:'Tamil'},ethnicName:'Any ethnicity',paymentDetails:{payment:'PAID',amount:0,currency:'USD',type:'PER_DAY'},skills:[{mainCategoryName:'Arts',subCategoryName:'Acting',skillName:'Voice',level:'advanced'}],timeLineType:'DATE_SETS',timeLine:[{date:'2026-12-01T18:30:00Z',startTime:'2026-12-02T03:30:00Z',endTime:'2026-12-02T05:30:00Z',title:'Rehearsal',description:'Bring the script and costume notes.',location:'Colombo rehearsal studio',longitude:79.8612,latitude:6.9271,mode:'MEETUP'},{date:'2026-12-03',startTime:'10:00',endTime:'11:00',title:'Online briefing',description:'Discuss the shooting schedule.',mode:{label:'Online',value:'ONLINE'},location:'Video call'}]};
const Application=load('components/widgets/collaboration/CollaborationApplicationDialog.tsx').default,List=load('components/widgets/collaboration/CollaborationApplicantList.tsx').default,Invites=load('components/widgets/collaboration/CollaborationInvitePeople.tsx').default,Details=load('components/widgets/collaboration/CollaborationApplicantDetails.tsx').default;
function App(){const [tab,setTab]=React.useState('schedule'),[open,setOpen]=React.useState(false),[status,setStatus]=React.useState('');return h('main',{className:'mx-auto max-w-6xl'},h('nav',{className:'flex flex-wrap gap-2 p-3'},...['schedule','applicants','application','invitations','details'].map(name=>h(Button,{key:name,onClick:()=>{setTab(name);if(name==='application')setOpen(true);}},name)),h(Button,{id:'fail',onClick:()=>failNext=true},'Fail next request'),h(Button,{onClick:()=>document.documentElement.classList.toggle('dark')},'Toggle theme')),h('p',{role:'status',className:'px-4 text-light-700'},status),
tab==='schedule'?h(Schedule,{collaborationId:id,role:scheduleRole,chatRoomId:id}):null,
tab==='applicants'?h(List,{collaborationId:id,collaborationDetails:{roles:[{_id:role,name:'Actor'}]},initialStats:stats(),initialResult:{status:'7400',response:rows.slice(0,20)}}):null,
tab==='application'?h(Application,{collaborationId:id,role:open?{_id:role,name:'Actor'}:null,currentUser:{userName:'artist',email:'artist@example.test',personalInfo:{firstName:'Artist'}},onClose:()=>setOpen(false),onApplied:async()=>setStatus('Application sent')}):null,
tab==='invitations'?h(Invites,{collaborationId:id,currentUser:{_id:id},selectedRoleIds:[role]}):null,
tab==='details'?h(Details,{collaborationId:id,applicationId:rows[0].applicationId,initialApplication:JSON.parse(JSON.stringify(rows[0]))}):null);}
window.previewState=()=>({requests,writes,uploads,navigation});ReactDOM.createRoot(document.getElementById('root')).render(h(App));
`.replace("SOURCES", () => JSON.stringify(sources));
  const target = path.join(
    process.env.TEMP || "/tmp",
    "te-collaboration-workflow-preview.html",
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
