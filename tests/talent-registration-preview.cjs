// Actual profile form, photo controls and canvas crop helper with simulated services and native field/crop adapters.
const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript"),
  postcss = require("postcss"),
  tailwind = require("tailwindcss");
(async () => {
  const files = [
    "lib/utils/profile-languages.ts",
    "lib/utils/profile-options.ts",
    "lib/hooks/useProfileOptions.ts",
    "components/inputs/ProfileOptionField.tsx",
    "lib/utils/birth-date.ts",
    "lib/utils/talent-registration.ts",
    "lib/utils/profile-skills.ts",
    "lib/utils/profile-education.ts",
    "lib/utils/profile-awards.ts",
    "lib/validations/auth.validation.ts",
    "lib/validations/complete-profile.validation.ts",
    "lib/validations/password.validation.ts",
    "lib/hooks/useDateSelector.ts",
    "lib/hooks/useProfileSkillOptions.ts",
    "components/multiStepForms/ParentTalentRegisterForm.tsx",
    "components/widgets/navigation/TalentRegisterStatusBar.tsx",
    "components/inputs/CertificateInput.tsx",
    ...["SkillsForm", "LangEducationForm", "AwardsForm", "CompleteForm"].map(
      (name) => `components/forms/talentsRegistration/${name}.tsx`,
    ),
    "lib/utils/profile-editor.ts",
    "lib/utils/profileLocation.ts",
    "lib/utils/getCroppedImg.js",
    "lib/validations/profile.validation.ts",
    "lib/hooks/useProfileAwardWrite.ts",
    "lib/hooks/useMedia.ts",
    "components/multiStepForms/EditProfileForm.tsx",
    "components/forms/EditPersonalInfoForm.tsx",
    "components/forms/EditProInfoForm.tsx",
    "components/inputs/MyPhotosInput.tsx",
    "components/inputs/ProfilePhoto.tsx",
    "components/inputs/CoverPhoto.tsx",
    "components/inputs/ProfileEthnicityInput.tsx",
    "components/modals/CropImg.tsx",
    "components/modals/PhotoAction.tsx",
  ];
  const sources = Object.fromEntries(
    files.map((file) => [
      file,
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2020,
          allowJs: true,
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
  const rhf = fs.readFileSync(
    "node_modules/react-hook-form/dist/index.umd.js",
    "utf8",
  );
  const script = String.raw`
const sources=SOURCES,h=React.createElement,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const id='6aff08a32e63b493d0e6e337',ethnicId='aaaaaaaaaaaaaaaaaaaaaaaa';
const uploads=[],writes=[],navigation=[],imageURLs={};let failSave=false,failUpload=false,failEthnicity=false;
const original={_id:id,userName:'qa-user',isTalent:true,location:'Colombo',personalInfo:{firstName:'QA',lastName:'User',dob:'2000-01-01',gender:'male',languageKnown:'111111111111111111111111',professionalId:'222222222222222222222222',shortBio:'Creative work and storytelling.',profileImage:'https://example.test/profile.jpg',coverImage:'https://example.test/cover.jpg'},morePersonalInfo:{_id:'6aff08a32e63b493d0e6e339',bio:'Film editing, photography, and creative projects.',ethnicId,ethnic:'Example ethnicity',featuredPhotos:['https://example.test/featured.jpg'],socialLinks:[{type:'website',url:'https://example.test/portfolio',show:false}]}};
const previewImage='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><linearGradient id="g"><stop stop-color="#2a4858"/><stop offset="1" stop-color="#758b72"/></linearGradient></defs><rect width="800" height="400" fill="url(#g)"/><circle cx="540" cy="140" r="70" fill="#f0d5a5"/><path d="M0 400 240 150 440 400 620 240 800 400" fill="#344c4b"/></svg>');
const icon=()=>h('svg',{width:20,height:20,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor'},h('circle',{cx:12,cy:12,r:8}));
const Button=React.forwardRef(({variant,className,...props},ref)=>h('button',{type:'button',...props,ref,className:'inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 '+(className||'')}));
const Input=React.forwardRef(({className,...props},ref)=>h('input',{...props,ref,className:'shad-auth_form_input '+(className||'')}));
const DialogContext=React.createContext(()=>{});
const dialogs={Dialog:({open,onOpenChange,children})=>open?h(DialogContext.Provider,{value:onOpenChange},h('div',{role:'dialog','aria-modal':'true',className:'fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-3'},children)):null,
DialogContent:({children,className})=>h('div',{className:'relative max-h-[90vh] w-full max-w-lg overflow-y-auto '+(className||'')},children),DialogHeader:({children,...props})=>h('header',props,children),DialogTitle:({children,...props})=>h('h2',props,children),DialogClose:({children,...props})=>{const close=React.useContext(DialogContext);return h('button',{...props,type:'button',onClick:()=>close(false)},children);}};
const fieldInput=({form,inputName,formLabel,placeholder,inputType='text'})=>{const {field,fieldState}=ReactHookForm.useController({control:form.control,name:inputName});return h('label',{className:'grid w-full gap-2 text-sm text-light-900'},formLabel,h(Input,{...field,value:field.value||'',placeholder,type:inputType}),fieldState.error?h('span',{role:'alert',className:'text-red-500'},fieldState.error.message):null);};
const dropdown=({form,inputName,formLabel,placeholder,options=[],value,onValueChange,disabled})=>{const {field}=ReactHookForm.useController({control:form.control,name:inputName});return h('label',{className:'grid gap-2 text-sm text-light-900'},formLabel,h('select',{...field,disabled,'aria-label':placeholder,value:value===undefined?field.value||'':value,onChange:event=>{field.onChange(event);onValueChange?.(event.target.value);},className:'shad-auth_form_input'},h('option',{value:''},placeholder),options.map(o=>h('option',{key:o._id,value:o._id},o.name))));};
const fields={FormInput:fieldInput,Dropdown:dropdown,TextArea:({form,inputName,formLabel,maxLength,className})=>{const {field}=ReactHookForm.useController({control:form.control,name:inputName});return h('label',{className:'grid gap-2 text-sm text-light-900'},formLabel,h('textarea',{...field,value:field.value||'',maxLength,className:'shad-auth_form_input min-h-24 '+(className||'')}));},
DateInput:({formLabel,fieldChange,isoDate})=>h('label',{className:'grid gap-2 text-sm text-light-900'},formLabel,h(Input,{name:'dob',type:'date',value:isoDate?.slice(0,10)||'',onChange:e=>fieldChange(e.target.value)})),
CheckboxInput:({form,inputName,formLabel})=>h('div',{},h('p',{className:'text-sm text-light-900'},formLabel),h(dropdown,{form,inputName,options:[{_id:'male',name:'Male'},{_id:'female',name:'Female'}]})),
SocialMediaInput:({values=[],fieldChange})=>h('label',{className:'grid gap-2 text-sm text-light-900'},'Social Links',h(Input,{'aria-label':'Website URL',value:values.find(row=>row.type==='website')?.url||'',placeholder:'https://example.test/portfolio',onChange:event=>fieldChange([{type:'website',url:event.target.value,show:false}])})),
CertificateInput:props=>h(load('components/inputs/CertificateInput.tsx').default,props),
CoverPhoto:props=>h(load('components/inputs/CoverPhoto.tsx').default,props),ProfilePhoto:props=>h(load('components/inputs/ProfilePhoto.tsx').default,props),MyPhotosInput:props=>h(load('components/inputs/MyPhotosInput.tsx').default,props)};
const mocks={react:React,zod:Zod,'react-hook-form':ReactHookForm,'react/jsx-runtime':{jsx:(type,props,key)=>h(type,{...props,key}),jsxs:(type,props,key)=>h(type,{...props,key}),Fragment:React.Fragment},
'@hookform/resolvers/zod':{zodResolver:schema=>async values=>{const parsed=schema.safeParse(values);return parsed.success?{values:parsed.data,errors:{}}:{values:{},errors:Object.fromEntries(parsed.error.issues.map(i=>[i.path[0],{type:'validate',message:i.message}]))};}},
'./Dropdown':dropdown,'@/components/ui/button':{Button},'../ui/button':{Button},'../ui/input':{Input},'@/components/ui/dialog':dialogs,'../ui/dialog':dialogs,
'@/components/ui/form':{Form:ReactHookForm.FormProvider,FormField:ReactHookForm.Controller,FormMessage:()=>null,FormControl:({children})=>h('div',{},children),FormItem:({children,...props})=>h('div',props,children),FormLabel:({children,...props})=>h('label',props,children)},'../ui/form':{Form:ReactHookForm.FormProvider,FormField:ReactHookForm.Controller,FormMessage:()=>null},
'@/components/forms':{...Object.fromEntries(['SkillsForm','LangEducationForm','AwardsForm','CompleteForm'].map(name=>[name,props=>h(load('components/forms/talentsRegistration/'+name+'.tsx').default,props)])),EditPersonalInfoForm:props=>h(load('components/forms/EditPersonalInfoForm.tsx').default,props),EditProInfoForm:props=>h(load('components/forms/EditProInfoForm.tsx').default,props)},'../inputs':fields,'@/components/inputs':fields,'@/components/ui/input':{Input},
'../inputs/ProfileLocation':({form})=>h(fieldInput,{form,inputName:'location',formLabel:'Location'}),
'next/image':({src,alt,width,height,...props})=>h('img',{...props,alt,src:src?.startsWith('blob:')?src:imageURLs[src]||previewImage}),
'next/navigation':{useRouter:()=>({push:path=>navigation.push(path),refresh:()=>navigation.push('refresh')})},
'sonner':{toast:{success:message=>window.lastToast=message}},
'@/context/AuthProvider':{AUTH_USER_CACHE_KEY:'qa-profile-user',useUserContext:()=>({user:{username:'qa-user',currentUserId:id,isTalent:false},setUser:update=>window.updatePreviewUser(update)})},
'@/lib/utils/uploadFile':{uploadFileToStorage:async(file,prefix,userId)=>{uploads.push({name:file.name,prefix,userId});await wait(120);if(failUpload){failUpload=false;throw Error('Simulated upload failure. Try again.');}const url='https://example.test/new/'+encodeURIComponent(file.name);imageURLs[url]=URL.createObjectURL(file);return {url,key:'qa/'+file.name};}},
'@/actions/user.action':{editUserProfessionalInfoAction:async(payload,profileId,agreed)=>{writes.push({payload,profileId});await wait(160);if(failSave){failSave=false;return {status:'400',message:'Simulated save failure. Your changes are still here.'};}return {status:'7400'};}},
'@/actions/utils.action':{getLanguagesAction:async()=>({status:'7400',response:[{_id:'111111111111111111111111',language:'English'}]}),getProfessionsAction:async()=>({status:'7400',response:[{_id:'222222222222222222222222',professional:'Editor'}]}),getEthnicAction:async()=>{await wait(100);if(failEthnicity){failEthnicity=false;return {status:'400',response:[]};}return {status:'7400',response:[{_id:ethnicId,ethnic:'Example ethnicity'},{_id:'bbbbbbbbbbbbbbbbbbbbbbbb',ethnic:'Another ethnicity'}]};}},
'@/constants':{FOOTER_LINKS:[{path:'https://talentsexplore.com/terms-and-conditions'},{path:'https://talentsexplore.com/privacy-policy'}],GENDER_VALUES:[],RatioOptions:[],LEVEL_VALUES:[{_id:'beginner',name:'Beginner'},{_id:'intermediate',name:'Intermediate'},{_id:'advanced',name:'Advanced'}],TALENT_REG_FORM_DETAILS:['About talent','Skills','Education','Awards','Complete'].map(title=>({title,description:'Complete your talent profile.'}))},'@/public/assets/svgs':{CameraIcon:icon,AtomicIcon:icon,AwardsIcon:icon,GraduationIcon:icon,UserIcon:icon},'react-icons/md':{MdEdit:icon,MdDelete:icon,MdClose:icon},'react-icons/bi':{BiPlus:icon},'react-icons/fa':{FaMinus:icon,FaPlus:icon},'react-icons/io':{IoMdClose:icon},
'lucide-react':{CheckIcon:icon,UserIcon:icon,ChevronRight:icon,X:icon},'react-icons/ai':{AiOutlineLogout:icon},'@/actions/auth.action':{logoutAction:async()=>{}},'@/lib/functions/auth.functions':{handleClearStorage:async()=>{}},
 '../widgets/navigation':{TalentRegisterStatusBar:props=>h(load('components/widgets/navigation/TalentRegisterStatusBar.tsx').default,props)},'../widgets':{Footer:()=>null},
 '@/components/modals':{TransparentLoader:({text})=>h('p',{role:'status'},text)},'@/components/ui/checkbox':{Checkbox:({checked,onCheckedChange,className})=>h('input',{type:'checkbox',checked,className,onChange:event=>onCheckedChange(event.target.checked)})},'next/link':({href,children,...props})=>h('a',{...props,href},children),
 '@/actions/profile-skills.action':{getProfileSkillOptionsAction:async(kind,parent)=>{await wait(60);return {status:'7400',response:kind==='main'?[{_id:'111111111111111111111111',name:'Arts'}]:kind==='sub'?[{_id:'222222222222222222222222',name:'Film'}]:[{_id:'333333333333333333333333',name:'Editing'},{_id:'444444444444444444444444',name:'Lighting'}]};}},
 '@/components/ui/slider':{Slider:({value,onValueChange})=>h('input',{type:'range',min:1,max:10,value:value?.[0]||1,onChange:e=>onValueChange([Number(e.target.value)])})},
'react-easy-crop':({image,onCropComplete})=>{React.useEffect(()=>onCropComplete(null,{x:0,y:0,width:20,height:20}),[image]);return h('img',{src:image,alt:'Crop preview',className:'size-full object-contain'});},
'../modals':{CropImgModal:props=>h(load('components/modals/CropImg.tsx').default,props),PhotoActionModal:props=>h(load('components/modals/PhotoAction.tsx').default,props),ErrorAlert:({isOpen,error,onClick})=>isOpen?h('div',{role:'alert',className:'fixed inset-x-3 top-3 z-[250] rounded-xl bg-dark-250 p-4 text-light-900'},error,h(Button,{onClick},'OK')):null}};
const cache={};function load(name,from=''){if(mocks[name])return mocks[name];let base=name.startsWith('@/')?name.slice(2):name;if(name.startsWith('.')){const parts=from.split('/');parts.pop();for(const part of name.split('/')){if(part==='..')parts.pop();else if(part!=='.')parts.push(part);}base=parts.join('/');}const file=[base,base+'.ts',base+'.tsx',base+'.js'].find(file=>sources[file]);if(!file)throw Error('Unknown preview module '+name);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;new Function('require','module','exports',sources[file])(name=>load(name,file),module,module.exports);return module.exports;}
const Editor=load('components/multiStepForms/ParentTalentRegisterForm.tsx').default;
function App(){const [viewer,setViewer]=React.useState({currentUserId:id,firstName:'QA',lastName:'User',imageUrl:original.personalInfo.profileImage}),[talent,setTalent]=React.useState(true);
window.updatePreviewUser=setViewer;
return h('main',{className:'mx-auto max-w-7xl p-4 sm:p-8'},h('header',{className:'mb-6 flex flex-wrap gap-3 text-sm text-light-700'},h('p',{},'Talent registration - simulated services'),h(Button,{id:'fail-upload',onClick:()=>failUpload=true},'Fail next upload'),h(Button,{id:'fail-save',onClick:()=>failSave=true},'Fail next save'),h(Button,{id:'theme',onClick:()=>document.documentElement.classList.toggle('dark')},'Toggle theme'),h(Button,{id:'profile-type',onClick:()=>setTalent(value=>!value)},talent?'Use basic profile':'Use talent profile'),h('p',{id:'viewer','data-talent':String(viewer.isTalent||false)},viewer.firstName+' '+viewer.lastName)),
h(Editor,{key:talent,userData:{...original,isTalent:talent},langData:{status:'7400',response:[{_id:'111111111111111111111111',language:'English'}]},professionData:{status:'7400',response:[{_id:'222222222222222222222222',professional:'Editor'}]}}));}
window.previewState=()=>({uploads,writes,navigation});ReactDOM.createRoot(document.getElementById('root')).render(h(App));

`.replace("SOURCES", () => JSON.stringify(sources));
  const target = path.join(
    process.env.TEMP || "/tmp",
    "te-talent-registration-preview.html",
  );
  fs.writeFileSync(
    target,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${fs.readFileSync("styles/palette.css", "utf8")}body{font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script>${react}</script><script>${dom}</script><script>${zod}</script><script>${rhf}</script><script>${script}</script></body></html>`,
  );
  process.stdout.write(target + "\n");
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
