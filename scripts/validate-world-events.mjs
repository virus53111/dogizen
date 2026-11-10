import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {languages,stories,topics} from '../lib/atlas-data.js';
const id='krakow-shooting-november-2026';
const read=p=>readFileSync('dist/'+p,'utf8');
assert.equal(stories.length,117);
assert.equal(topics.length,17);
for(const lang of ['en','ru']){
 const prefix=lang==='en'?'':lang+'/';
 const page=read(prefix+'guides/'+id+'/index.html');
 const category=read(prefix+'topics/world-events/index.html');
 const home=read(prefix+'index.html');
 assert.match(page,/2026-11-09/);
 assert.match(page,/article-photo-context/);
 assert.match(page,/2019/);
 assert.match(page,/Rajeev Singh/);
 assert.match(page,/https:\/\/creativecommons.org\/licenses\/by\/4.0\//);
 assert.match(page,/krakow.pl/);
 assert.match(page,/policja.gov.pl/);
 assert.match(page,/polskieradio.pl/);
 assert.match(page,lang==='ru'?/Точная причина нападения.*не установлена/:/precise motive had not been established/);
 assert.match(page,lang==='ru'?/Это не фотография нападения/:/This does not show the attack/);
 const image=page.match(/class="article-image"><img src="([^"]+)"/)[1];
 assert.ok(existsSync('dist'+image));
 assert.ok(home.includes('/topics/world-events/'));
 assert.ok(category.includes('/guides/'+id+'/'));
 assert.match(category,/Rajeev Singh/);
 const index=JSON.parse(read(prefix+'search-index.json'));
 assert.ok(index.some(x=>x.href===`/${prefix}guides/${id}/`));
 assert.ok(index.some(x=>x.href===`/${prefix}topics/world-events/`));
 const options=category.match(/<select id="language-select"[^>]*>(.*?)<\/select>/)[1];
 assert.equal((options.match(/<option/g)||[]).length,2);
}
for(const lang of languages.filter(x=>!['en','ru'].includes(x))){
 assert.ok(!existsSync(`dist/${lang}/guides/${id}/index.html`));
 assert.ok(!existsSync(`dist/${lang}/topics/world-events/index.html`));
 assert.ok(!read(lang+'/index.html').includes('/topics/world-events/'));
}
const sitemap=read('sitemap.xml');
assert.equal((sitemap.match(/<url>/g)||[]).length,665);
assert.equal((sitemap.match(/<loc>[^<]*world-events\//g)||[]).length,2);
console.log('PASS: dated EN/RU event report, archival photo attribution, two real category editions, existing 625 canonical URLs plus four new pages.');
