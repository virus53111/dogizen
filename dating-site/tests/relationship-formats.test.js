import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
test('localized relationship formats keep ban on paid-sex advertisements',async()=>{
 const category=await fs.readFile('public/categories.js','utf8');
 const rules=await fs.readFile('public/rules.html','utf8');
 const sql=await fs.readFile('migrations/017_relationship_formats.sql','utf8');
 for(const id of ['noncommercial','support']){assert.ok(category.includes('id:"'+id+'"'));assert.ok(sql.includes("'"+id+"'"))}
 assert.doesNotMatch(rules,/только собственные анкеты для некоммерческих знакомств/);
 assert.match(sql,/is_commercial IS FALSE/);
});
test('admin contains 50 city templates without fabricated person data',async()=>{
 const src=await fs.readFile('public/admin-manual.js','utf8');
 const m=src.match(/const GEO_PRESETS=(\[.*?\]);/);assert.ok(m);assert.equal(JSON.parse(m[1]).length,50);
 const html=await fs.readFile('public/admin-create.html','utf8');
 assert.match(html,/id="geoPreset"/);assert.match(html,/name="consentConfirmed"/);
});
