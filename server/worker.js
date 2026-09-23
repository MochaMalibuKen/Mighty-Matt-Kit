import {version,validateResponse} from '../dist/poll-schema.js';
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function hash(value,secret){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
function markerFor(request){const cookie=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('mm_farm_device='))?.slice(15);const header=request.headers.get('X-Poll-Device');return uuid.test(cookie||'')?cookie:uuid.test(header||'')?header:null;}
function cookie(marker,url){return `mm_farm_device=${marker}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${url.protocol==='https:'?'; Secure':''}`;}
async function readBody(request){if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new Error('Send a JSON response.');const reader=request.body?.getReader();if(!reader)throw new Error('Response required.');const chunks=[];let length=0;while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>8192){await reader.cancel();throw new Error('Response is too large.');}chunks.push(value);}const data=new Uint8Array(length);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}try{return JSON.parse(new TextDecoder().decode(data));}catch{throw new Error('Invalid response format.');}}
async function exists(DB,key){return DB.prepare('SELECT id FROM responses WHERE version=? AND marker_hash=?').bind(version,key).first();}
export async function handleApi(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!['/api/status','/api/poll','/api/results','/api/admin/poll'].includes(path))return json({error:'Not found.'},404);
 const expected=path.endsWith('/poll')?'POST':'GET';if(request.method!==expected)return json({error:'Method not allowed.'},405,{Allow:expected});
 const enabled=!!env.DB&&env.POLL_ENABLED==='true'&&typeof env.POLL_SECRET==='string'&&env.POLL_SECRET.length>=32;
 if(!enabled)return path==='/api/status'?json({accepting:false,preview:env.PREVIEW_MODE==='true',submitted:false}):json({error:'The poll is not accepting responses yet. Please check back later.'},503);
 const marker=markerFor(request),staff=path==='/api/admin/poll';
 if(staff&&(!env.ADMIN_TOKEN||env.ADMIN_TOKEN.length<32||request.headers.get('Authorization')!==`Bearer ${env.ADMIN_TOKEN}`))return json({error:'Staff authorization required.'},401);
 if(expected==='POST'&&!staff&&request.headers.get('Origin')!==url.origin)return json({error:'Please submit from the campaign website.'},403);
 if(expected==='POST'&&!staff&&env.ALLOWED_ORIGIN&&url.origin!==env.ALLOWED_ORIGIN)return json({error:'This origin is not enabled for the campaign.'},403);
 if(!marker&&!staff&&path!=='/api/results')return json({error:'Please refresh the page to initialize the poll.'},400);
 try{
  const key=marker?await hash(marker,env.POLL_SECRET):null;
  if(path==='/api/status')return json({accepting:true,preview:env.PREVIEW_MODE==='true',submitted:!!await exists(env.DB,key)},200,{'Set-Cookie':cookie(marker,url)});
  if(path==='/api/results'){
   const results=await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS total FROM responses WHERE version=?').bind(version),
    env.DB.prepare('SELECT placement AS value, COUNT(*) AS count FROM responses WHERE version=? GROUP BY placement').bind(version),
    env.DB.prepare('SELECT usefulness AS value, COUNT(*) AS count FROM responses WHERE version=? GROUP BY usefulness').bind(version),
    env.DB.prepare('SELECT j.value AS value, COUNT(*) AS count FROM responses, json_each(responses.priorities) j WHERE version=? GROUP BY j.value').bind(version)
   ]);
   const counts=result=>Object.fromEntries(result.results.map(r=>[r.value,r.count]));
   return json({version,total:results[0].results[0].total,placement:counts(results[1]),usefulness:counts(results[2]),priorities:counts(results[3]),generatedAt:new Date().toISOString()});
  }
  let body,response;
  try{body=await readBody(request);if(body.website)throw new Error('Unable to accept this response.');response=validateResponse(body);if(staff&&!uuid.test(body.reference||''))throw new Error('A unique UUID reference is required for each verbal response.');}catch(e){return json({error:e.message},400);}
  const markerHash=staff?await hash('verbal:'+body.reference,env.POLL_SECRET):key;
  if(await exists(env.DB,markerHash))return json({error:'A response is already recorded for this browser or reference.'},409);
  const id=crypto.randomUUID(),now=new Date().toISOString();
  const statements=[env.DB.prepare('INSERT INTO responses (id,version,marker_hash,channel,created_at,current_locations,placement,concerns,priorities,usefulness,improvement,current_other,placement_other,concerns_other) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,version,markerHash,staff?'verbal':'web',now,JSON.stringify(response.current),response.placement,JSON.stringify(response.concerns),JSON.stringify(response.priorities),response.usefulness,response.improvement,response.currentOther,response.placementOther,response.concernsOther)];
  if(response.contactConsent)statements.push(env.DB.prepare('INSERT INTO contacts (response_id,name,email,consent,consent_at) VALUES (?,?,?,?,?)').bind(id,response.contactName,response.contactEmail,1,now));
  try{await env.DB.batch(statements);}catch(e){if(await exists(env.DB,markerHash))return json({error:'A response is already recorded for this browser or reference.'},409);throw e;}
  return json({saved:true,id},201,staff?{}:{'Set-Cookie':cookie(marker,url)});
 }catch{console.error('Poll database operation failed.');return json({error:'Your response could not be confirmed. Please try again; repeat submissions will not be counted twice.'},503);}
}
export default {async fetch(request,env){if(new URL(request.url).pathname.startsWith('/api/'))return handleApi(request,env);if(!env.ASSETS)return new Response('Site assets are not configured.',{status:503});const response=await env.ASSETS.fetch(request);const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");return new Response(response.body,{status:response.status,headers});}};
