import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const gone=read('dist/404.html');
assert.match(gone,/content="noindex,follow"/,'Missing-page response must not be indexed');
assert.doesNotMatch(gone,/<link rel="canonical"/,'Never claim a removed page is the homepage');
assert.doesNotMatch(gone,/<link rel="alternate" hreflang=/,'Removed pages have no live translated equivalents');
assert.doesNotMatch(gone,/property="og:url"/,'Do not share a missing page as the homepage');
assert.match(gone,/<form[^>]*class="error-search"[^>]*method="get"[^>]*action="\/"/,
 'Missing-page recovery must submit GET queries to live English homepage');
assert.match(gone,/name="q"/,'Missing search query field');
assert.match(gone,/data-error-page/,'404 must offer client-side localized guidance');
assert.match(gone,/href="\/ru\/"/,'Russian recovery link missing');
assert.match(gone,/href="\/lv\/"/,'Latvian recovery link missing');
assert.match(gone,/data-error-note/,'Be explicit that old classifieds were removed');
const en=read('dist/en/index.html');
assert.match(en,/<meta http-equiv="refresh" content="0; url=\/">/,
 'Only the equivalent old English homepage may redirect');
assert.match(en,/<link rel="canonical" href="https:\/\/murdilimax.com\/">/);
assert.doesNotMatch(en,/property="og:url"/);
const root=read('dist/index.html');
assert.match(root,/<link rel="canonical" href="https:\/\/murdilimax.com\/">/);
assert.match(root,/hreflang="ru"/);
assert.match(root,/index,follow,max-image-preview:large/);
for(const lang of ['ru','lv']){
 const homepage=read('dist/'+lang+'/index.html');
 assert.match(homepage,/rel="canonical"/);
}
const removed=[
 'stroitelnye-rascenki',
 'podrabotka',
 'lv/buvdarbu-cenas',
 'rabota/riga/courier',
 'traffic/murdilimax-com',
 'category/housemaid'
];
for(const path of removed)assert.equal(existsSync('dist/'+path+'/index.html'),false,
 'Deleted marketplace page must not reappear: '+path);
const sitemap=read('dist/sitemap.xml');
for(const path of removed)assert.ok(!sitemap.includes('<loc>https://murdilimax.com/'+path+'/'),
 'Removed classifieds entry in sitemap: '+path);
assert.ok(!sitemap.includes('<loc>https://murdilimax.com/en/'),
 'Redirect-only alias is not a canonical sitemap page');
assert.ok((sitemap.match(/<url>/g)||[]).length>=665);
const none=read('dist/lt/topics/construction/index.html');
assert.match(none,/content="noindex,follow"/);
assert.doesNotMatch(none,/<link rel="canonical"/,
 'Noindex empty category must not declare a misleading canonical');
assert.doesNotMatch(none,/rel="alternate" hreflang=/,
 'Unindexable category must not advertise hreflang');
for(const p of ['dist/species/esox-lucius/index.html','dist/ru/species/amanita-phalloides/index.html']){
 assert.match(read(p),/property="og:type" content="article"/,'Species pages are shareable articles');
}
const client=read('dist/site.js');
assert.match(client,/new URLSearchParams\(window.location.search\)\.get\('q'\)/,
 'Homepage must accept search queries coming from 404 forms');
assert.match(client,/messages=\{/,'404 must localize recovery for users');
assert.match(client,/data-error-search/);
console.log('PASS: 404 has honest noindex/no-canonical metadata, deleted marketplace pages stay gone, legacy /en/ points to the real English homepage, and 404 searches have accessible navigation.');
