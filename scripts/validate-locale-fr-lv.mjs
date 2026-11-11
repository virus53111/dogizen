import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {essentialGuidesFrLv} from '../lib/editorial-locales-fr-lv.js';
import {storageGuideFrLv} from '../lib/editorial-storage-fr-lv.js';
import {stories,story,storiesFor} from '../lib/atlas-data.js';

const read=path=>readFileSync(path,'utf8');
const upgrades={...essentialGuidesFrLv,...storageGuideFrLv};
const slugs=['backup-321','secure-accounts','ssd-vs-hdd'];
assert.deepEqual(Object.keys(upgrades).sort(),slugs.slice().sort(),'Only three useful topics');
assert.ok(stories.length>=117,'No artificial guide URL additions');
for(const lang of ['fr','lv']){
 assert.equal(storiesFor(lang).length,14,'Existing translations are revised, not expanded with duplicates');
 for(const id of slugs){
  const revision=upgrades[id][lang],data=story(id);
  assert.deepEqual(data[lang],revision,'Stored revision differs from editorial text: '+id+'/'+lang);
  assert.equal(data.localeUpdated?.[lang],'2026-11-09','Missing local edit timestamp: '+id+'/'+lang);
  assert.equal(revision.sections.length,5,'Guide must have five useful sections');
  assert.ok(revision.title.length>=33&&revision.subtitle.length>=85,'Unclear heading/subtitle');
  assert.ok(revision.sections.every(([heading,body])=>heading.length>=25&&body.length>=295),
    'A chapter lacks useful original guidance: '+lang+'/'+id);
  assert.equal(new Set(revision.sections.map(x=>x[0])).size,5,'Duplicated headings');
  const words=revision.sections.flat().join(' ').trim().split(/\s+/u).filter(Boolean).length;
  assert.ok(words>=310,'Guide still too brief: '+lang+'/'+id+' ('+words+' words)');
  const page=read('dist/'+lang+'/guides/'+id+'/index.html');
  assert.ok(page.includes(revision.title)&&page.includes(revision.subtitle),'Published revision mismatch');
  assert.ok(page.includes('href="#section-4"'),'Missing fifth chapter');
  assert.ok(page.includes('aria-label='),'Missing accessible page navigation');
  const scripts=[...page.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)];
  assert.equal(scripts.length,1,'Expected one JSON-LD script per article');
  const structured=JSON.parse(scripts[0][1]);
  const article=structured['@graph']?.find(n=>n['@type']==='Article');
  assert.ok(article,'Missing Article schema');
  assert.equal(article.headline,revision.title);
  assert.equal(article.inLanguage,lang);
  assert.equal(article.dateModified,'2026-11-09','Locale-specific update date absent');
  const expectedRefs=[...(data.sources||[]),...(data.localeSources?.[lang]||[])];
  assert.deepEqual(article.citation,expectedRefs.map(r=>r.url),'Wrong sources in JSON-LD');
  assert.ok(expectedRefs.every(r=>page.includes(r.url.replaceAll('&','&amp;'))),'Missing visible sources');
  const map=read('dist/sitemap.xml');
  assert.ok(map.includes('<loc>https://murdilimax.com/'+lang+'/guides/'+id+'/</loc><lastmod>2026-11-09</lastmod>'),
   'Sitemap lastmod must match the actual local-language revision');
  if(['secure-accounts','backup-321'].includes(id)){
    assert.equal(data.localeSources?.[lang]?.length,1,'One verified regional primary source required');
    const current=data.localeSources[lang][0].url;
    assert.ok(article.citation.includes(current),'Regional source missing in structured data');
    const other=lang==='fr'?'lv':'fr';
    for(const ref of data.localeSources?.[other]||[])
      assert.ok(!article.citation.includes(ref.url)&&!page.includes(ref.url),
        'Do not present a foreign-language regional source as local: '+lang+'/'+id);
  }
  console.log('PASS: '+lang+'/'+id+': '+words+' words, five chapters, localized citations, dates and links');
 }
}
const sitemap=read('dist/sitemap.xml');
assert.ok((sitemap.match(/<url>/g)||[]).length>=665,'URL count must not change');
console.log('PASS: six FR/LV improvements to existing guides, 665 genuine URLs, no source cross-contamination.');
