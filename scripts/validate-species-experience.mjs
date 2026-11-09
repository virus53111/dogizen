import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {visualSpecies,visualSpeciesById} from '../lib/species-atlas.js';
import {relatedSpecies} from '../lib/species-render.js';
import {languages,storiesFor} from '../lib/atlas-data.js';
const read=path=>readFileSync(path,'utf8');
assert.equal(visualSpecies.length,78,'Species atlas count changed unexpectedly');
for(const lang of ['en','ru']){
 const prefix='dist/'+(lang==='ru'?'ru/':'');
 for(const p of visualSpecies){
  const related=relatedSpecies(p);
  assert.equal(related.length,3,'Exactly three related species expected: '+p.id);
  assert.equal(new Set(related.map(x=>x.id)).size,3,'Duplicate related links: '+p.id);
  assert.ok(related.every(x=>x.id!==p.id&&x.group===p.group),'Related profiles must stay in the same group: '+p.id);
  const sameGenus=visualSpecies.filter(x=>x.group===p.group&&x.id!==p.id&&x.latin.split(' ')[0]===p.latin.split(' ')[0]);
  if(sameGenus.length)assert.equal(related[0].latin.split(' ')[0],p.latin.split(' ')[0],'Genus relatedness should be preferred');
  const html=read(prefix+'species/'+p.id+'/index.html');
  assert.match(html,/<h1>/,'Species H1 missing: '+p.id);
  assert.match(html,/v-other-name/,'Cross-language common name missing: '+p.id);
  assert.match(html,/BreadcrumbList/,'Species breadcrumb structured data missing: '+p.id);
  assert.match(html,/v-related-explainer/,'Must explain related species limitations: '+p.id);
  assert.match(html,/v-all-link/,'Return to category link missing: '+p.id);
  assert.ok(html.includes('/'+(lang==='ru'?'ru/':'')+'topics/'+p.group+'/'),'Category link missing: '+p.id);
  assert.match(html,lang==='ru'?/Ограничения определения/:/Identification limits/);
  assert.doesNotMatch(html,/Scientific reference/,'Wikipedia overview must not be misleadingly called a scientific reference');
  for(const x of related)assert.ok(html.includes('/'+(lang==='ru'?'ru/':'')+'species/'+x.id+'/'),'Missing related species link '+x.id+' from '+p.id);
  if(p.group==='mushrooms')assert.match(html,/https:\/\/poisons\.ie\/garden-shed\//,'Must link mushroom safety guidance');
  if(p.group==='plants')assert.match(html,/https:\/\/www\.poison\.org\/articles\/plant/,'Must link plant safety guidance');
  const guides=storiesFor(lang).filter(s=>s.topic===p.group);
  if(guides.length)assert.ok(html.includes('/'+(lang==='ru'?'ru/':'')+'guides/'+guides[0].id+'/'),'Missing real related guide');
 }
 for(const group of ['mushrooms','plants']){
  const page=read(prefix+'topics/'+group+'/index.html');
  assert.match(page,/v-safety/,'Missing safety banner on '+group);
  assert.match(page,group==='mushrooms'?/poisons\.ie\/garden-shed/:/poison\.org\/articles\/plant/);
 }
}
for(const lang of languages){
 const prefix='dist/'+(lang==='en'?'':lang+'/');
 const index=JSON.parse(read(prefix+'search-index.json'));
 for(const group of ['mushrooms','fishing','plants']){
  assert.ok(index.some(x=>x.type==='topic'&&x.href==='/'+(lang==='en'?'':lang+'/')+'topics/'+group+'/'),'Missing published species topic in search: '+lang+'/'+group);
 }
 if(!['en','ru'].includes(lang))assert.equal(index.filter(x=>x.type==='species').length,0,'No unlocalized species result URLs');
}
assert.equal((read('dist/sitemap.xml').match(/<url>/g)||[]).length,625,'Species remain intact alongside ten new original illustrated bilingual guides');
console.log('PASS: 156 species pages, meaningful links, cited hazard notes, breadcrumb markup and 12-language topic discovery.');
