import {handleApi} from './worker.js';
import {openTurso} from './turso-db.js';

export function createHandler(environment=()=>process.env,connect=openTurso) {
 let database;
 return async request=>{
  const env=environment();
  // Preview deployments must never write to the production campaign database.
  const enabled=env.POLL_ENABLED==='true'&&(!env.VERCEL_ENV||env.VERCEL_ENV==='production');
  try {
   if(enabled&&!database)database=connect(env);
   return await handleApi(request,{
    DB:enabled?database:null,POLL_ENABLED:enabled?'true':'false',
    POLL_SECRET:env.POLL_SECRET,ADMIN_TOKEN:env.ADMIN_TOKEN,
    PREVIEW_MODE:'false',ALLOWED_ORIGIN:env.ALLOWED_ORIGIN||'https://www.mightymattkit.com'
   });
  } catch {
   return Response.json({error:'The poll is temporarily unavailable. Please try again.'},
    {status:503,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
 };
}
export const fetch=createHandler();
