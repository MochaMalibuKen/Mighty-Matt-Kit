import {DatabaseSync} from 'node:sqlite';
// Local adapter runs the same prepared SQL and transactions as the Worker.
export function openDatabase(path){
 const db=new DatabaseSync(path);db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
 const wrap=(sql,args=[])=>({sql,args,bind(...values){return wrap(sql,values);},async first(){return db.prepare(sql).get(...args)||null;}});
 return {raw:db,prepare:wrap,async batch(statements){db.exec('BEGIN');try{const results=statements.map(s=>{const p=db.prepare(s.sql);return /^\s*SELECT/i.test(s.sql)?{results:p.all(...s.args)}:{results:[],meta:p.run(...s.args)};});db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}},close(){db.close();}};
}
