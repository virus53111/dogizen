import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
for(const filename of ['dist/index.html','dist/404.html']){
 assert.ok(existsSync(filename),'Missing retired landing page: '+filename);
 const html=read(filename);
 assert.match(html,/CenaRadar/,'Retired-domain branding missing');
 assert.match(html,/noindex,nofollow/,'Retired page must not be indexed');
 assert.doesNotMatch(html,/murdilimax\.com/i,'Retired site must never link or forward to Murdilimax');
 assert.doesNotMatch(html,/<meta[^>]+http-equiv=["']refresh/i,'Meta redirect still active');
 assert.doesNotMatch(html,/location\.(?:replace|assign|href)/,'JavaScript redirect still active');
 assert.doesNotMatch(html,/<link[^>]+rel=["']canonical/i,'Retired pages must not canonicalize to a different site');
}
const robots=read('dist/robots.txt');
assert.equal(robots,'User-agent: *\nDisallow: /\n');
assert.equal(existsSync('dist/sitemap.xml'),false,'No active sitemap for retired domain');
assert.equal(existsSync('dist/CNAME'),false,'Never claim a GitHub Pages custom domain from this build');
console.log('PASS: retired CenaRadar static site has no redirect, cross-domain canonical, sitemap or MURDILIMAX link.');
