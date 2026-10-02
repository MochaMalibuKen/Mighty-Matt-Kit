import {createClient} from '@libsql/client';

// Preserve the existing handler's D1 interface and atomic response/contact writes.
export function adaptTurso(client) {
 const prepare=(sql,args=[])=>({sql,args,
  bind(...values){return prepare(sql,values);},
  async first(){return (await client.execute({sql,args})).rows[0]||null;}
 });
 return {prepare,async batch(statements){
  const mode=statements.every(s=>/^\s*SELECT/i.test(s.sql))?'read':'write';
  const results=await client.batch(statements.map(({sql,args})=>({sql,args})),mode);
  return results.map(r=>({results:r.rows}));
 }};
}
export function openTurso(env) {
 if(!env.TURSO_DATABASE_URL||!env.TURSO_AUTH_TOKEN)return null;
 const url=new URL(env.TURSO_DATABASE_URL);
 if(!['libsql:','https:'].includes(url.protocol))throw new Error('Remote TLS database required.');
 return adaptTurso(createClient({url:url.href,authToken:env.TURSO_AUTH_TOKEN}));
}
