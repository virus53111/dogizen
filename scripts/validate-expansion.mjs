import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {languages,topics,stories,availableIn} from '../lib/atlas-data.js';
import {expansionArticlesA} from '../lib/expansion-articles-a.js';
import {expansionArticlesB} from '../lib/expansion-articles-b.js';
import {expansionArticlesC} from '../lib/expansion-articles-c.js';
import {expansionArticlesD} from '../lib/expansion-articles-d.js';
import {expansionTopics,expansionIntros} from '../lib/atlas-expansion-topics.js';
const added=[...expansionArticlesA,...expansionArticlesB,...expansionArticlesC,...expansionArticlesD];
assert.equal(added.length,16);
assert.equal(stories.length,106);
assert.equal(topics.length,17);
assert.equal(languages.length,12);
assert.equal(new Set(stories.map(x=>x.id)).size,stories.length,'Duplicate article slugs');
assert.equal(new Set(topics.map(x=>x.id)).size,topics.length,'Duplicate topic slugs');
assert.equal(new Set(added.map(x=>x.id)).size,16,'Duplicate new material');
const enOnly=['en','ru'];
for(const t of expansionTopics){
  for(const lang of languages){
    assert.ok(t.names[lang]?.length>3,'Untranslated category '+t.id+' '+lang);
    assert.ok(expansionIntros[t.id]?.[lang]?.length>20,'Untranslated introduction '+t.id+' '+lang);
    const file=(lang==='en'?'dist/':'dist/'+lang+'/')+'topics/'+t.id+'/index.html';
    assert.ok(existsSync(file),'Missing category '+file);
    const html=readFileSync(file,'utf8');
    assert.ok(html.includes(t.names[lang]),'Missing native title '+file);
    assert.ok(html.includes(enOnly.includes(lang)?'index,follow':'noindex,follow'),'Topic indexing must reflect translated content: '+file);
  }
}
for(const x of added){
  assert.equal(x.sources?.length,1);
  assert.match(x.sources[0].url,/^https:\/\/(www\.|science\.|consumer\.)?/);
  assert.ok(x.image?.startsWith('https://'),'Original photo source must be genuine HTTPS before bundling');
  for(const lang of enOnly){
    assert.ok(availableIn(x,lang));
    assert.equal(x[lang].sections.length,4);
    assert.ok(x[lang].sections.every(([heading,text])=>heading.length>8&&text.length>100),'Thin article '+x.id+' '+lang);
    const page=(lang==='en'?'dist/':'dist/'+lang+'/')+'guides/'+x.id+'/index.html';
    assert.ok(existsSync(page),'Missing new guide '+page);
    const html=readFileSync(page,'utf8');
    assert.ok(html.includes(x.sources[0].url),'Sources not displayed '+page);
    assert.ok(html.includes(x[lang].title),'Article title missing '+page);
    assert.ok(html.includes('index,follow'),'Page should be indexable '+page);
  }
  assert.ok(!existsSync('dist/de/guides/'+x.id+'/index.html'),'Fake translation generated '+x.id);
}
const sitemap=readFileSync('dist/sitemap.xml','utf8');
const count=(sitemap.match(/<url>/g)||[]).length;
assert.equal(count,643,'Sitemap must list only 643 actual, translated indexable pages');
assert.ok(sitemap.includes('/ru/topics/astronomy/'));
assert.ok(sitemap.includes('/ru/topics/cooking/'));
assert.ok(!sitemap.includes('/de/topics/astronomy/'));
assert.ok(!sitemap.includes('/de/guides/moon-phases-explained/'));
console.log('PASS expansion QA: 16 substantive bilingual guides, 2 sections with 12 translated introductions, 643 honest indexed URLs');
