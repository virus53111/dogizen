import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {editorial2026} from '../lib/editorial-2026.js';
import {stories,storiesFor} from '../lib/atlas-data.js';

assert.equal(editorial2026.length,11);
assert.equal(new Set(editorial2026.map(x=>x.id)).size,editorial2026.length);
assert.equal(stories.length,86,'Expected 86 fully published guides');
const seenGroups=new Set(editorial2026.map(x=>x.topic));
assert.equal(seenGroups.size,11,'Each new guide must expand a different category');
for(const article of editorial2026){
  assert.equal(article.sources.length,1,'Require grounded source');
  assert.ok(article.sources[0].url.startsWith('https://'));
  for(const locale of ['en','ru']){
    const d=article[locale];
    assert.ok(d?.title?.length>20&&d?.subtitle?.length>25);
    assert.ok(Array.isArray(d.sections)&&d.sections.length>=4);
    assert.ok(d.sections.every(([head,body])=>head.length>=8&&body.length>100),'Content too thin in '+article.id);
    const file=(locale==='en'?'dist/':'dist/'+locale+'/')+'guides/'+article.id+'/index.html';
    assert.ok(existsSync(file),file);
    const html=readFileSync(file,'utf8');
    assert.ok(html.includes(d.title),'Title missing '+file);
    assert.ok(html.includes(article.sources[0].url),'Source reference not linked '+file);
  }
  assert.ok(!existsSync('dist/de/guides/'+article.id+'/index.html'),'No fake German translation for '+article.id);
}
const map=readFileSync('dist/sitemap.xml','utf8');
assert.equal((map.match(/<url>/g)||[]).length,599,'Expected 599 correctly scoped indexable sitemap pages');
assert.ok(map.includes('xmlns:image='));
for(const lang of ['en','ru'])assert.ok(storiesFor(lang).length>=30);
console.log('PASS editorial QA: 11 meaningful bilingual guides, 11 distinct sections, verified source links, 599 sitemap URLs');
