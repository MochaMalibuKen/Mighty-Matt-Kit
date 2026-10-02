import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createClient} from '@libsql/client';
import {adaptTurso,openTurso} from '../server/turso-db.js';
import {createHandler} from '../server/vercel.js';
import {version} from '../dist/poll-schema.js';
const origin='https://www.mightymattkit.com';
const schema=readFileSync(new URL('../db/001_poll.sql',import.meta.url),'utf8');
const valid={version,current:['barn'],placement:'vehicle',concerns:['bleeding'],priorities:['portability'],usefulness:'yes',improvement:'PRIVATE TEST',currentOther:'',placementOther:'',concernsOther:'',contactName:'',contactEmail:'',contactConsent:false};
const settings={VERCEL_ENV:'production',POLL_ENABLED:'true',POLL_SECRET:'test-only-secret-more-than-thirty-two-characters'};
const request=(path,marker,body)=>new Request(origin+path,{method:body?'POST':'GET',headers:{Origin:origin,'X-Poll-Device':marker,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
async function fixture(){const client=createClient({url:':memory:'});await client.executeMultiple(schema);const fetch=createHandler(()=>settings,()=>adaptTurso(client));return {client,fetch};}
test('all Vercel route files export a Web handler and fail closed without configuration',async()=>{
 for(const file of ['status','poll','results','admin/poll']){
  const {default:route}=await import('../api/'+file+'.js');assert.equal(typeof route.fetch,'function');
 }
 const fetch=createHandler(()=>({}));
 assert.equal((await (await fetch(request('/api/status',crypto.randomUUID()))).json()).accepting,false);
 assert.equal((await fetch(request('/api/poll',crypto.randomUUID(),valid))).status,503);
 assert.equal(openTurso({}),null);
 assert.throws(()=>openTurso({TURSO_DATABASE_URL:'file:/tmp/not-production.db',TURSO_AUTH_TOKEN:'test'}));
});
test('Vercel + libSQL stores once, handles retries, reports counts and keeps contact private',async()=>{
 const {client,fetch}=await fixture(),marker=crypto.randomUUID();try{
  assert.equal((await (await fetch(request('/api/status',marker))).json()).accepting,true);
  const body={...valid,contactName:'Private Person',contactEmail:'private@example.invalid',contactConsent:true};
  const saved=await fetch(request('/api/poll',marker,body));assert.equal(saved.status,201);const data=await saved.json();assert.equal(data.saved,true);
  assert.equal((await client.execute({sql:'SELECT id FROM responses WHERE id=?',args:[data.id]})).rows.length,1);
  assert.equal((await fetch(request('/api/poll',marker,body))).status,409);
  assert.equal((await (await fetch(request('/api/status',marker))).json()).submitted,true);
  const results=await (await fetch(request('/api/results',marker))).json();assert.equal(results.total,1);assert.equal(results.placement.vehicle,1);assert.equal(results.priorities.portability,1);
  assert.doesNotMatch(JSON.stringify(results),/Private Person|private@example|PRIVATE TEST/);
  assert.equal((await client.execute('SELECT COUNT(*) AS n FROM contacts')).rows[0].n,1);
 }finally{client.close();}
});
test('libSQL rolls back response if optional contact insertion fails',async()=>{
 const {client,fetch}=await fixture();try{
  await client.execute("CREATE TRIGGER fail_contact BEFORE INSERT ON contacts BEGIN SELECT RAISE(ABORT, 'test failure'); END");
  const result=await fetch(request('/api/poll',crypto.randomUUID(),{...valid,contactEmail:'test@example.invalid',contactConsent:true}));assert.equal(result.status,503);
  assert.equal((await client.execute('SELECT COUNT(*) AS n FROM responses')).rows[0].n,0);
 }finally{client.close();}
});
test('preview cannot connect or collect even if production settings are inherited',async()=>{
 const fetch=createHandler(()=>({...settings,VERCEL_ENV:'preview'}),()=>{throw new Error('Must not connect');});
 assert.equal((await (await fetch(request('/api/status',crypto.randomUUID()))).json()).accepting,false);
 assert.equal((await fetch(request('/api/poll',crypto.randomUUID(),valid))).status,503);
});
test('libSQL response persists across client and handler restart',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'mighty-turso-test-')),url='file:'+join(dir,'test.sqlite'),marker=crypto.randomUUID();
 let client=createClient({url});try{
  await client.executeMultiple(schema);
  const fetch=createHandler(()=>settings,()=>adaptTurso(client));
  assert.equal((await fetch(request('/api/poll',marker,valid))).status,201);
  client.close();client=createClient({url});
  const restarted=createHandler(()=>settings,()=>adaptTurso(client));
  assert.equal((await (await restarted(request('/api/status',marker))).json()).submitted,true);
  assert.equal((await restarted(request('/api/poll',marker,valid))).status,409);
 }finally{client.close();rmSync(dir,{recursive:true,force:true});}
});
test('database failures return a generic error without leaking connection details',async()=>{
 const fetch=createHandler(()=>settings,()=>{throw new Error('SECRET_TOKEN');});
 const response=await fetch(request('/api/status',crypto.randomUUID()));assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/SECRET_TOKEN/);
});
