// Run only with an authorized verbal response and approved production origin.
// ADMIN_TOKEN stays in the environment, never in public JavaScript.
import {readFileSync} from 'node:fs';
import {validateResponse} from '../dist/poll-schema.js';
const [origin,file]=process.argv.slice(2);
if(!origin||!file||!process.env.ADMIN_TOKEN)throw new Error('Usage: ADMIN_TOKEN=<secret> node scripts/staff-entry.mjs https://mightymattkit.com response.json');
const url=new URL('/api/admin/poll',origin);if(url.protocol!=='https:')throw new Error('HTTPS required.');
const body=JSON.parse(readFileSync(file,'utf8'));validateResponse(body);
if(!body.reference)throw new Error('Provide a stable UUID reference; reuse it if retrying this verbal response.');
const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${process.env.ADMIN_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
console.log('HTTP',response.status,await response.text());
if(!response.ok)process.exitCode=1;
