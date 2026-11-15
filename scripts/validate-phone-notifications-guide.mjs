// Regression gate for a manually authored, sourced EN/RU smartphone-notification guide.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,storiesFor,availableIn} from '../lib/atlas-data.js';
import {phoneNotificationsGuide2026 as g} from '../lib/phone-notifications-guide-2026.js';

assert.equal(stories.filter(s=>s.id===g.id).length,1,'Exactly one complete guide must be registered');
assert.equal(g.topic,'digital');
assert(g.sources.length>=5);
assert(g.sources.some(x=>x.url.includes('support.apple.com')));
assert(g.sources.some(x=>x.url.includes('support.google.com')));
assert(g.sources.some(x=>x.url.includes('samsung.com')));
assert.equal(g.photoAsset.source,'https://commons.wikimedia.org/wiki/File:A_person_is_focused_on_their_smartphone.jpg');
assert.equal(g.photoAsset.licenseLabel,'CC BY 2.0');
const sitemap=readFileSync('dist/sitemap.xml','utf8');
let photoFile;
for(const lang of ['en','ru']){
 const d=g[lang],prefix=lang==='en'?'':'ru/',route=prefix+'guides/'+g.id+'/',file='dist/'+route+'index.html';
 assert(availableIn(g,lang)&&storiesFor(lang).includes(g),'Real localized article not registered: '+lang);
 assert(existsSync(file),'HTML page missing: '+file);
 const html=readFileSync(file,'utf8');
 const canonical='https://murdilimax.com/'+route;
 assert(html.includes('<h1>'+d.title+'</h1>'),'Visible localized headline missing '+lang);
 assert(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical missing '+lang);
 assert(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Alternate languages missing');
 assert(!html.includes('hreflang="de"'),'Claimed nonexistent German translation');
 assert(html.includes(d.description),'SEO description missing '+lang);
 assert(html.includes(g.photoAsset.source)&&html.includes('CC BY 2.0'),'Image attribution missing '+lang);
 assert(html.includes('alt="'+g.mediaAlt[lang]+'"'),'Alt text missing '+lang);
 assert(html.includes('<table class="article-fact-table">'),'Symptom table not rendered '+lang);
 assert(!html.includes('article-photo-context'),'Do not repeat a pointless photo description under this guide: '+lang);
 assert.equal((html.match(/class="article-photo-credit"/g)||[]).length,1,'Exactly one photograph credit required: '+lang);
 assert(!html.includes('photograph resized/cropped for MURDILIMAX'),'Remove editor-facing photograph commentary: '+lang);
 assert(html.includes('class="article-fact-region phone-notification-facts"'),'Mobile table class missing: '+lang);
 assert(html.includes('data-label="'+d.factTable.headers[1]+'"'),'Localized mobile table labels missing: '+lang);
 assert(html.includes('class="article-step-showcase"'),'Six-step interactive-style checklist missing '+lang);
 assert(d.sections.length===6&&d.sections.every(x=>x[1].length>700),'Long practical sections missing '+lang);
 assert(d.stepGuide.steps.length===6&&d.factTable.rows.length===5);
 const photo=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
 assert(photo&&existsSync('dist'+photo),'Authentic local photo missing '+lang);
 if(photoFile)assert.equal(photo,photoFile);else photoFile=photo;
 assert(sitemap.includes('<loc>'+canonical+'</loc>'),'Sitemap missing '+lang);
 const search=JSON.parse(readFileSync('dist/'+prefix+'search-index.json','utf8'));
 assert(search.some(x=>x.type==='guide'&&x.href==='/'+route),'Site search missing '+lang);
 const home=readFileSync('dist/'+prefix+'index.html','utf8');
 assert(home.includes('/'+route),'Home not linking new article '+lang);
 const topic=readFileSync('dist/'+prefix+'topics/digital/index.html','utf8');
 assert(topic.includes('/'+route),'Topic hub not linking new article '+lang);
}
for(const lang of ['de','es','fr','lv','pt','it','pl','lt','et','nl'])
 assert(!existsSync('dist/'+lang+'/guides/'+g.id+'/index.html'),'Unwritten '+lang+' translation must not be public');
const visualCSS=readFileSync('dist/atlas-visual.css','utf8');
assert(visualCSS.includes('@media (max-width: 720px)')&&visualCSS.includes('.phone-notification-facts')&&visualCSS.includes('attr(data-label)'),'Mobile stacked cards CSS required');
const bytes=readFileSync('dist'+photoFile);
assert(bytes.length>12000&&bytes[0]===255&&bytes[1]===216&&bytes.at(-2)===255&&bytes.at(-1)===217,
 'Bundled photograph must be authentic JPEG with sufficient pixels');
console.log('PASS: one original, deeply researched EN/RU troubleshooting feature; real credited JPG, canonical/sitemap, table, steps, sources and internal discovery.');
