export const version='farm-2026-v1';
export const locations={tractor:'Tractor / UTV',vehicle:'Work vehicle',barn:'Shop / barn',field:'Field / crew area',visitors:'Agritourism / visitor area',other:'Other'};
export const priorities={portability:'Portability',accessibility:'Accessibility',bleeding:'Bleeding-control capability',weather:'Weather / dust resistance',organization:'Organization',instructions:'Clear instructions',restocking:'Restocking',training:'Training support'};
export const usefulness={yes:'Yes',maybe:'Maybe',no:'No',depends:'Depends on where / how I could store it'};
export const concerns={bleeding:'Bleeding / cuts',breathing:'Breathing / choking',heat:'Heat-related emergencies',burns:'Burns',eyes:'Eye injuries',other:'Other',unsure:'Not sure'};
export const questions=[
 {key:'current',title:'Where do you currently keep emergency supplies on your farm?',hint:'Choose all that apply.',type:'checkbox',options:{...locations,none:'No designated place'}},
 {key:'placement',title:'Where would you most likely keep something like Mighty Matt GO?',hint:'Choose the one place that makes the most sense for your operation.',type:'radio',options:locations},
 {key:'concerns',title:'What emergency situations concern you most during the workday?',hint:'Choose up to three.',type:'checkbox',max:3,options:concerns},
 {key:'priorities',title:'What matters most in a farm emergency kit?',hint:'Choose up to three. These are research choices, not a list of GO features.',type:'checkbox',max:3,options:priorities},
 {key:'usefulness',title:'Would an over-the-shoulder kit like Mighty Matt GO be useful on your operation?',hint:'There is no right or wrong answer.',type:'radio',options:usefulness},
 {key:'improvement',title:'What would make a farm-focused emergency kit more useful to you?',hint:'Optional. Tell us about supplies, storage, instructions or anything else. Please do not include personal or medical details.',type:'text'}
];
export function validateResponse(body){
 if(!body||typeof body!=='object'||body.version!==version)throw new Error('Please refresh the poll and try again.');
 const out={version};
 for(const q of questions){const value=body[q.key];if(q.type==='text'){if(typeof value!=='string'||value.length>1500)throw new Error('Please keep your feedback to 1,500 characters.');out[q.key]=value.trim();continue;}
 if(q.type==='radio'){if(typeof value!=='string'||!Object.hasOwn(q.options,value))throw new Error('Please answer each research question.');out[q.key]=value;}
 else{if(!Array.isArray(value)||value.length<1||value.length>(q.max||Object.keys(q.options).length)||new Set(value).size!==value.length||value.some(x=>typeof x!=='string'||!Object.hasOwn(q.options,x)))throw new Error('Please check your selected answers.');out[q.key]=value;}}
 if(out.current.includes('none')&&out.current.length>1)throw new Error('Select a location or “No designated place,” not both.');
 if(out.concerns.includes('unsure')&&out.concerns.length>1)throw new Error('Select your concerns or “Not sure,” not both.');
 for(const key of ['currentOther','placementOther','concernsOther']){if(body[key]!==undefined&&(typeof body[key]!=='string'||body[key].length>250))throw new Error('Please keep other answers to 250 characters.');out[key]=(body[key]||'').trim();}
 if(typeof body.contactName!=='string'||body.contactName.length>100||typeof body.contactEmail!=='string'||body.contactEmail.length>254||typeof body.contactConsent!=='boolean')throw new Error('Please check your optional contact details.');
 out.contactName=body.contactName.trim();out.contactEmail=body.contactEmail.trim();out.contactConsent=body.contactConsent;
 if(out.contactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.contactEmail))throw new Error('Please enter a valid email address.');
 if((out.contactName||out.contactEmail)&&!out.contactConsent)throw new Error('Please allow ECS to contact you, or clear the optional contact fields.');
 if(out.contactConsent&&!out.contactEmail)throw new Error('Please add your email for follow-up, or leave follow-up unchecked.');
 return out;
}
