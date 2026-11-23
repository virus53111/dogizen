import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
test('moderation panel restores the existing verified Firebase session before loading private queues',async()=>{
 const html=await fs.readFile('public/admin.html','utf8');
 const dash=await fs.readFile('public/admin-dashboard.js','utf8');
 const reports=await fs.readFile('public/admin-reports.js','utf8');
 const privacy=await fs.readFile('public/admin-privacy.js','utf8');
 assert.match(html,/window\.MM_authReady=new Promise/);
 assert.match(html,/src="\/auth\/refresh\.js"/);
 assert.ok(html.indexOf('MM_authReady')<html.indexOf('</head>'));
 assert.match(html,/setTimeout\(resolve,10000\)/);
 assert.match(dash,/Promise\.resolve\(window\.MM_authReady\)\.then/);
 assert.match(reports,/Promise\.resolve\(window\.MM_authReady\)\.then/);
 assert.match(privacy,/if\(window\.MM_authReady\)await window\.MM_authReady/);
});
test('owner-only API still performs verified-token and DB allowlist checks',async()=>{
 const mod=await fs.readFile('api/admin/reports.js','utf8');
 const manual=await fs.readFile('api/admin/manual.js','utf8');
 const privacy=await fs.readFile('api/admin/privacy-requests.js','utf8');
 const server=await fs.readFile('render/server.js','utf8');
 for(const str of [mod,manual,privacy])assert.match(str,/mm_admin_allowlist/);
 assert.match(server,/slug\.startsWith\('admin\/'\) && !owner\(req\.user\)/);
 assert.match(server,/const owner = u => !!u && u\.verified/);
});
