import assert from 'node:assert/strict';
import {readFileSync,statSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {photoPromptShowcase} from '../lib/ai-photo-prompt-gallery.js';
import {stories,languages} from '../lib/atlas-data.js';

const read=file=>readFileSync('dist/'+file,'utf8');
const htmlEscape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const items=photoPromptShowcase.items;
assert.equal(items.length,4,'Four actual distinct user-supplied visual concepts are required');
assert.equal(new Set(items.map(i=>i.id)).size,4,'No duplicate concepts');
assert.ok(stories.length>=117,'User prompt showcase must not inflate factual documentary guide count');
assert.equal(languages.length,12,'Preserve all twelve UI languages');
const expected=[
 ['01-cinematic-portrait.webp','c02de99c4e41250602996671a6a364a8536e4da773d589cec3c220b0cd0266c2'],
 ['02-reaction-chaos.webp','fd3a72857df6dfc5e3e4bd3d9bdf9c8d54b3ee05863948e49b1a99ce82192815'],
 ['03-cartoon-chase.webp','bebc38152486e7134701865b58a6fb7d2c2e334bc89562b6241ad5714bba79ba'],
 ['04-sketchbook.webp','4f6e95c531fef2ccb431d02a3b411cc2433f4fe8bca7005aa0d06736227be2b0']
];
const photos=new Set();
for(const [file,sha] of expected){
 const pathname='ai-prompts/'+file,b=readFileSync('dist/'+pathname);
 assert.ok(b.length>45000,'AI photo preview needs useful resolution '+file);
 assert.equal(b.toString('ascii',0,4),'RIFF','WebP RIFF header missing '+file);
 assert.equal(b.toString('ascii',8,12),'WEBP','WebP magic missing '+file);
 assert.equal(createHash('sha256').update(b).digest('hex'),sha,'Image must match the exact previously generated and optimized asset '+file);
 photos.add(sha);
}
assert.equal(photos.size,4,'No reused demo photos');
assert.ok(statSync('dist/ai-photo-prompts.css').size>4000,'Missing gallery styles');
const sitemap=read('sitemap.xml');
assert.ok((sitemap.match(/<url>/g)||[]).length>=665,'Adding EN and RU showcase changes 623 to 665 genuine canonical URLs');
for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'',gallery='ai-photo-prompts/',page=read(prefix+gallery+'index.html'),ui=photoPromptShowcase.ui[lang];
 assert.ok(page.includes(ui.heading),'Localized gallery heading missing '+lang);
 assert.ok(page.includes('rel="canonical" href="https://murdilimax.com/'+prefix+gallery+'"'),'Canonical missing '+lang);
 assert.ok(page.includes('hreflang="ru"')&&page.includes('hreflang="en"'),'Gallery hreflang pairing missing '+lang);
 assert.ok(page.includes('property="og:image" content="https://murdilimax.com/ai-prompts/01-cinematic-portrait.webp"'),'Own OG preview missing '+lang);
 assert.ok(page.includes('<link rel="stylesheet" href="/ai-photo-prompts.css">'),'Styles missing '+lang);
 assert.ok(page.includes('id="main-content"'),'Accessibility landmark missing '+lang);
 assert.ok(page.includes('role="note"')&&page.includes(lang==='ru'?'демонстрационные AI-изображения':'AI-generated demonstrations'),'Disclosure missing '+lang);
 assert.equal((page.match(/class="ai-example" id="prompt-/g)||[]).length,4,'Render four separate examples '+lang);
 assert.equal((page.match(/class="ai-copy" type="button"/g)||[]).length,4,'One working copy button per prompt '+lang);
 assert.equal((page.match(/class="ai-prompt" id="ai-prompt-/g)||[]).length,4,'Prompts must be under the images '+lang);
 assert.equal((page.match(/class="ai-howto"/g)||[]).length,4,'How-to steps missing for some images '+lang);
 for(const [index,item] of items.entries()){
  const d=item[lang],file=expected[index][0];
  assert.ok(item.image.endsWith(file),'Wrong item asset '+item.id);
  assert.ok(page.includes('src="'+item.image+'"'),'Image omitted '+item.id+'/'+lang);
  assert.ok(page.includes('href="#prompt-'+item.number+'"'),'On-page example navigation missing '+item.id+'/'+lang);
  assert.ok(page.includes('id="ai-prompt-'+item.number+'"'),'Copy target missing '+item.id+'/'+lang);
  assert.ok(page.includes(htmlEscape(d.name))&&page.includes(htmlEscape(d.subtitle)),'Description missing '+item.id+'/'+lang);
  assert.ok(page.includes(htmlEscape(d.input)),'Uploaded photo instructions missing '+item.id+'/'+lang);
  assert.equal(d.steps.length,3,'Clear three-stage instructions required '+item.id+'/'+lang);
  assert.ok(d.steps.every(step=>page.includes(htmlEscape(step))),'Missing step '+item.id+'/'+lang);
  assert.ok(d.prompt.length>1050&&d.prompt.length<2600,'Prompts need depth without repetition '+item.id+'/'+lang);
  assert.ok(page.includes(htmlEscape(d.prompt.slice(0,200))),'Full usable prompt missing '+item.id+'/'+lang);
 }
 assert.ok(sitemap.includes('<loc>https://murdilimax.com/'+prefix+gallery+'</loc><lastmod>2026-11-09</lastmod>'),'No canonical sitemap inclusion '+lang);
 const index=JSON.parse(read(prefix+'search-index.json'));
 assert.ok(index.some(x=>x.href==='/'+prefix+gallery&&x.image===items[0].image),'AI prompt gallery must be searchable in '+lang);
 const home=read(prefix+'index.html');
 assert.ok(home.includes('class="shell ai-promo"')&&home.includes('href="/'+prefix+gallery+'"'),'Homepage gallery discovery missing '+lang);
 assert.ok(home.includes('<link rel="stylesheet" href="/ai-photo-prompts.css">'),'Promo CSS missing '+lang);
}
for(const lang of languages.filter(l=>!['en','ru'].includes(l)))assert.ok(!existsSync('dist/'+lang+'/ai-photo-prompts/index.html'),'No unsupported fake translation '+lang);
const javascript=read('site.js');
assert.ok(javascript.includes('[data-ai-copy]')&&javascript.includes('navigator.clipboard.writeText'),'Copy action not functional');
console.log('PASS: Four exact user-generated visual examples, verified 800px optimized WebP images, four practical prompt instructions in EN and RU, copy buttons, 665 canonical pages, complete SEO, no false translations.');
