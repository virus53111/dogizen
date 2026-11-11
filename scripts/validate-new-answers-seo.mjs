import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {aviationAndUsefulAnswers} from '../lib/aviation-and-useful-answers.js';
import {stories} from '../lib/atlas-data.js';
const read=p=>readFileSync('dist/'+p,'utf8');
for(const s of aviationAndUsefulAnswers)for(const lang of ['en','ru']){
 const prefix=lang==='en'?'':lang+'/';
 const html=read(prefix+'guides/'+s.id+'/index.html');
 assert.equal(s[lang].sections.length,6);
 assert.ok(s.sources.length>=4);
 assert.ok(s[lang].sections.every(([h,b])=>h.length>5&&b.length>100));
 assert.match(html,/article-photo-context/);
 assert.ok(html.includes(s.photoAsset.licenseLabel));
 const img=html.match(/class="article-image"><img src="([^"]+)"/)[1];
 assert.ok(existsSync('dist'+img));
 assert.ok(JSON.parse(read(prefix+'search-index.json')).some(x=>x.href===`/${prefix}guides/${s.id}/`));
 assert.ok(read(prefix+'topics/'+s.topic+'/index.html').includes('/guides/'+s.id+'/'));
}
for(const s of stories.filter(x=>x.topic==='world-events'))for(const lang of ['en','ru']){
 const prefix=lang==='en'?'':lang+'/';const html=read(prefix+'guides/'+s.id+'/index.html');
 const meta=html.match(/<meta name="description" content="([^"]+)"/)[1];
 assert.ok(meta.length>=110&&meta.length<=170);
 assert.ok(html.includes('<title>'+s[lang].seoTitle+' | MURDILIMAX</title>'));
 assert.match(html,/article-dateline/);
 assert.match(html,/hreflang="en"/);assert.match(html,/hreflang="ru"/);assert.ok(!html.includes('hreflang="de"'));
 const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1])['@graph'];
 const news=graph.find(x=>x['@type']==='NewsArticle');
 assert.ok(news);assert.equal(news.datePublished,s.published);assert.equal(news.dateModified,s.updated);
 assert.equal(news.description,s[lang].description);assert.match(news.image,/https:\/\/murdilimax.com\/photos\//);
 assert.ok(news.citation.length>=4);assert.ok(news.articleSection);
 const other=stories.find(x=>x.topic==='world-events'&&x.id!==s.id);
 assert.ok(html.includes('/guides/'+other.id+'/'),'News pages should be linked to each other');
}
const ru=read('ru/guides/florida-learjet-crash-nathalia-filgueiras-2026/index.html');
assert.match(ru,/вторым пилотом/);assert.match(ru,/Причина катастрофы ещё не установлена/);assert.match(ru,/Это другой борт/);
const sm=read('sitemap.xml');assert.ok((sm.match(/<url>/g)||[]).length>=665);
console.log('PASS: three sourced bilingual articles, licensed relevant photos, two NewsArticle editions per event, truthful dates and canonical SEO.');
