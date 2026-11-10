import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stories,story,storiesFor,languages} from '../lib/atlas-data.js';
import {editorialRefresh2026} from '../lib/editorial-refresh-2026.js';
import {editorialRefreshNature2026} from '../lib/editorial-refresh-nature.js';

const upgrades={...editorialRefresh2026,...editorialRefreshNature2026};
assert.equal(Object.keys(upgrades).length,5,'Exactly five selected real articles');
assert.equal(stories.length,114,'Never inflate URLs merely to boost index size');
const seen=new Set();
for(const [id,revision] of Object.entries(upgrades)){
 assert.ok(!seen.has(id));seen.add(id);
 const published=story(id);
 assert.ok(published,'Missing original guide: '+id);
 assert.equal(published.localeUpdated?.en,'2026-11-09','English revision date missing');
 assert.equal(published.localeUpdated?.ru,'2026-11-09','Russian revision date missing');
 assert.deepEqual(Object.keys(published.localeUpdated).sort(),id==='secure-accounts'?['de','en','es','et','fr','it','lt','lv','nl','pl','pt','ru']:['en','ru'],'Only truly revised languages get new dates');
 assert.ok(published.sources.length>=revision.sources.length,'Earlier sources must be preserved');
 for(const source of revision.sources){
  assert.ok(source.url.startsWith('https://'),'Verified HTTPS source required');
  assert.ok(published.sources.some(s=>s.url===source.url),'Source not visible: '+id+' '+source.url);
 }
 for(const lang of ['en','ru']){
  const d=published[lang];
  assert.equal(d.sections.length,5,'Five distinct practical chapters required '+id+'/'+lang);
  assert.ok(d.title.length>=30&&d.subtitle.length>=60,'No vague titles or subtitles '+id+'/'+lang);
  const words=d.sections.map(x=>x.join(' ')).join(' ').trim().split(/\s+/u).length;
  assert.ok(words>=190,'The practical guide is still too short '+id+'/'+lang+' '+words+' words');
  assert.ok(d.sections.every(([heading,body])=>heading.length>=20&&body.length>=280),'Each chapter needs substantive, actionable advice '+id+'/'+lang);
  assert.equal(new Set(d.sections.map(s=>s[0])).size,5,'Avoid duplicated chapter headings');
  const file='dist/'+(lang==='en'?'':lang+'/')+'guides/'+id+'/index.html';
  const html=readFileSync(file,'utf8');
  assert.ok(html.includes(d.title),'Updated title not deployed '+id+'/'+lang);
  assert.ok(html.includes(d.subtitle),'Updated subtitle not deployed '+id+'/'+lang);
  assert.match(html,/href="#section-4"/,'Chapter outline must include all five chapters');
  assert.match(html,/BreadcrumbList/,'Preserve structured breadcrumbs '+id+'/'+lang);
  assert.ok(html.includes('dateModified'),'Must show actual revision date '+id+'/'+lang);
  assert.ok(published.sources.every(s=>html.includes(s.url)),'Citations missing from article '+id+'/'+lang);
 }
}
for(const lang of languages){
 assert.ok(storiesFor(lang).length>0,'Do not lose any language edition: '+lang);
}
const sitemap=readFileSync('dist/sitemap.xml','utf8');
assert.equal((sitemap.match(/<url>/g)||[]).length,659,'Sitemap should not gain artificial URLs');
console.log('PASS: Five substantive EN/RU editorial rewrites, ten published pages, primary citations, complete chapters, preserved locale coverage and 659 URLs.');
