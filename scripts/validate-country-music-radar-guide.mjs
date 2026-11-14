import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {stories,storiesFor,topics} from '../lib/atlas-data.js';
import {countryMusicOriginsGuide as article} from '../lib/country-music-origins-2026.js';

const id='what-is-country-music-origins-and-sound';
assert.equal(article.id,id);
assert.equal(stories.filter(s=>s.id===id).length,1,'Radar guide must appear once');
assert.equal(topics.filter(t=>t.id==='culture').length,1,'New world-culture category must be unique');
assert.equal(article.sources.length,5,'Provide traceable institutional source links');
assert.equal(article.photoAsset.licenseLabel,'CC BY-SA 4.0','Use a verified Commons licensed photograph');
assert.equal(article.photoAsset.source,'https://commons.wikimedia.org/wiki/File:Mike_and_the_Moonpies_2023.jpg');
assert.match(article.photoAsset.credit,/Femmechase/);
for(const lang of ['en','ru']){
 assert(storiesFor(lang).includes(article),'Guide must be available in '+lang);
 assert.equal(article[lang].sections.length,6);
 assert(article[lang].sections.every(([title,body])=>title.length>=12&&body.length>=450),
   'Six substantive localized, original chapters required for '+lang);
 assert(article[lang].stepGuide.steps.length>=4,'Practical listening walkthrough');
 assert(article[lang].factTable.rows.length>=5,'Sound-identification comparison table');
 const prefix=lang==='ru'?'ru/':'';
 const link='https://murdilimax.com/'+prefix+'guides/'+id+'/';
 const html=await readFile('dist/'+prefix+'guides/'+id+'/index.html','utf8');
 assert(html.includes('<link rel="canonical" href="'+link+'"'),'Missing real canonical for '+lang);
 assert(html.includes('creativecommons.org/licenses/by-sa/4.0/'),'Missing live image licensing link');
 assert(html.includes('Femmechase'),'Missing authentic photographer attribution');
 assert(html.includes('countrymusichalloffame.org'),'Missing museum source reference');
 assert(html.includes('guides.loc.gov'),'Missing Library of Congress source reference');
 assert(html.includes('birthplaceofcountrymusic.org'),'Missing Bristol museum reference');
 assert(html.includes('article-fact-table'),'Missing illustrated identification table');
 assert(html.includes('article-step-showcase'),'Missing interactive-friendly listening steps');
 assert(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Missing bilingual alternate links');
 const cover=html.match(/<figure class="article-image"><img src="(\/photos\/[a-f0-9]+\.jpg)"/);
 assert(cover,'Cover must be locally downloaded real licensed JPEG');
 await stat('dist'+cover[1]);
 const search=await readFile('dist/'+prefix+'search-index.json','utf8');
 assert(search.includes('/'+prefix+'guides/'+id+'/'),'Search must find the article');
 const category=await readFile('dist/'+prefix+'topics/culture/index.html','utf8');
 assert(category.includes('/'+prefix+'guides/'+id+'/'),'Culture landing page must link the article');
 const sitemap=await readFile('dist/sitemap.xml','utf8');
 assert(sitemap.includes('<loc>'+link+'</loc>'),'Sitemap must index both language versions');
}
console.log('PASS: first source-grounded radar topic published in bilingual HTML, category, search and sitemap with genuine Commons attribution.');
