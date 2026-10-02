import {readFileSync,existsSync,mkdirSync,cpSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..'),html=readFileSync(resolve(root,'dist/index.html'),'utf8');
for(const name of ['app.js','poll-schema.js','config.js'])execFileSync(process.execPath,['--check',resolve(root,'dist',name)]);
for(const name of ['server/worker.js','server/turso-db.js','server/vercel.js','api/status.js','api/poll.js','api/results.js','api/admin/poll.js'])execFileSync(process.execPath,['--check',resolve(root,name)]);
for(const match of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)){const value=match[1];if(!/^[a-z]+:/.test(value)&&!existsSync(resolve(root,'dist',value)))throw new Error(`Missing file: ${value}`);}
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
for(const match of html.matchAll(/href="#([^"]+)"/g))if(!ids.has(match[1]))throw new Error(`Missing anchor ${match[1]}`);
mkdirSync(resolve(root,'build'),{recursive:true});
for(const folder of ['dist','server','db'])cpSync(resolve(root,folder),resolve(root,'build',folder),{recursive:true});
writeFileSync(resolve(root,'build/package.json'),'{"type":"module"}\n');
console.log('Build passed: JavaScript syntax, local assets and navigation anchors verified. Static site + Worker + SQL copied to build/. No deployment performed.');
