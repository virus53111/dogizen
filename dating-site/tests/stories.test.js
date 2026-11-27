import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateStory,makeSlug,articlePage,catalogPage,appendStoriesSitemap} from '../render/stories.js';
const fixture={title:'Прогулка по Риге',author_name:'Автор',language:'ru',category:'romance',body:'Вечером они гуляли по парку и разговаривали о путешествиях.',status:'published',editorial_confirmed:true};
const s={...fixture,slug:makeSlug(fixture.title,'1234567890'),published_at:'2026-11-27T00:00:00Z',updated_at:'2026-11-27T01:00:00Z'};
test('safe editorial validation and predictable slug',()=>{
 assert.ok(validateStory(fixture));assert.equal(s.slug,'progulka-po-rige-1234567890');
 for(const bad of [{editorial_confirmed:false},{category:'invalid'},{language:'xx'},{title:'x'},{body:'short'},{seo_description:'x'.repeat(201)}])assert.equal(validateStory({...fixture,...bad}),null);
 assert.ok(validateStory({...fixture,status:'draft',editorial_confirmed:false}));
});
test('public article is server-rendered, escaped, canonical and marked adult',()=>{
 const html=articlePage({...s,title:'<script>alert(1)</script>',author_name:'</script><img src=x>',body:'<script>alert(2)</script>\n\nPlain text'});
 assert.match(html,/&lt;script&gt;alert\(2\)&lt;\/script&gt;/);
 assert.doesNotMatch(html,/<script>alert|<img src=x>/);
 assert.match(html,/rel="canonical" href="https:\/\/murdilimax.com\/stories\/progulka-po-rige-1234567890\/"/);
 assert.match(html,/name="rating" content="adult"/);
 const data=JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1]);
 assert.equal(data['@type'],'Article');assert.equal(data.author.name,'</script><img src=x>');
 assert.equal(data.inLanguage,'ru');
});
test('empty catalogs are not indexed; populated pages and sitemap expose only supplied public rows',()=>{
 assert.match(catalogPage([]),/noindex,follow/);
 assert.match(catalogPage([s]),/index,follow/);
 const xml='<urlset><url><loc>https://murdilimax.com/</loc></url></urlset>';
 assert.equal(appendStoriesSitemap(xml,[]),xml);
 const map=appendStoriesSitemap(xml,[s]);assert.match(map,/stories\/romance\//);assert.match(map,/stories\/progulka-po-rige-1234567890\//);assert.match(map,/<lastmod>2026-11-27/);
});
test('six catalogs and protected editorial page linked; no automatic import',async()=>{
 for(const lang of ['ru','en','de','lv','lt','et']){
  const html=await fs.readFile('public/'+(lang==='ru'?'':lang+'/')+'index.html','utf8');assert.match(html,/href="\/stories\/"/);
 }
 const api=await fs.readFile('api/admin/stories.js','utf8'),admin=await fs.readFile('public/admin-stories.html','utf8'),server=await fs.readFile('render/server.js','utf8');
 assert.match(api,/mm_admin_allowlist/);assert.match(api,/u\?\.verified/);assert.match(api,/validateStory/);
 assert.match(admin,/noindex,nofollow/);assert.match(admin,/editorial_confirmed/);assert.match(server,/registerStories\(app,db/);
});
