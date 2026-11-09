import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,topics,availableIn,languages} from '../lib/atlas-data.js';
import {illustratedGuidesC} from '../lib/illustrated-guides-c.js';
const read=p=>readFileSync(p,'utf8');
const photo=(url)=>{
 assert.match(url,/^\/photos\/[a-f0-9]{18}\.jpg$/,'Every cover must use locally hosted JPEG photography');
 const p='dist'+url;
 assert.ok(existsSync(p),'JPEG missing '+p);
 const b=readFileSync(p);
 assert.ok(b.length>12000&&b[0]===0xff&&b[1]===0xd8&&b[b.length-2]===0xff&&b[b.length-1]===0xd9,
  'Real JPG bytes required '+p);
 return b.length;
};
let editions=0;
const photos=new Set();
for(const guide of stories){
 for(const lang of languages.filter(lang=>availableIn(guide,lang))){
  const prefix=lang==='en'?'':lang+'/';
  const html=read('dist/'+prefix+'guides/'+guide.id+'/index.html');
  const local=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
  assert.ok(local,'Visible photo must be included '+guide.id+'/'+lang);
  photo(local);photos.add(local);
  const alt=(guide.mediaAlt?.[lang]||guide[lang].title)
    .replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  assert.ok(html.includes('alt="'+alt+'"'),'Descriptive localized alt missing '+lang+'/'+guide.id);
  assert.ok(html.includes('property="og:image" content="https://murdilimax.com'+local+'"'),
   'Share image missing '+lang+'/'+guide.id);
  editions++;
 }
}
for(const lang of ['en','ru']){
 const prefix=lang==='en'?'':lang+'/';
 const html=read('dist/'+prefix+'index.html');
 assert.match(html,/class="hero-image hero-photo-stage"/,'Homepage must feature real photography');
 const topPhotos=[...html.matchAll(/<img class="topic-image"[^>]*src="(\/photos\/[a-f0-9]{18}\.jpg)"/g)];
 assert.equal(topPhotos.length,topics.length,'All topic cards must have real photos');
 for(const image of topPhotos)photo(image[1]);
}
for(const newer of illustratedGuidesC){
 for(const lang of ['en','ru']){
  const prefix=lang==='en'?'':lang+'/';
  const html=read('dist/'+prefix+'topics/'+newer.topic+'/index.html');
  assert.ok(html.includes('/'+prefix+'guides/'+newer.id+'/'),'New content must be discoverable via its category');
 }
}
assert.equal(stories.length,92);
// Regression check for hand-reviewed subject-specific article photography.
// A photograph may be shared across translations, never across the reviewed stories.
const handReviewed=["heat-exhaustion-signs","check-medical-information","better-sleep-routine","carbon-monoxide-home-safety","wood-stove-sauna-carbon-monoxide","sauna-heat-vs-heatstroke","sauna-safety-guide","smoke-alarm-home-placement","tick-bite-first-steps","mushroom-poisoning-warning-signs","international-travel-documents","windows-laptop-battery-care","usb-c-cable-capabilities","organize-family-photo-archive","password-manager-passkeys","secure-our-world-four-habits","safe-public-wifi-travel","qr-code-scam-safety","review-browser-permissions","stop-cold-drafts-at-home","window-condensation-explained","leave-no-trace-forest","fishing-gear-clean-drain-dry","responsible-catch-and-release","warm-water-low-oxygen-fish","fish-senses-lateral-line","why-forests-need-fungi","lichens-miniature-ecosystems","watering-houseplants-right","home-garden-compost-basics","balcony-flowers-for-pollinators","mulch-garden-soil","sun-protection-travel-uv","day-hike-ten-essentials","thunderstorm-hiking-safety","read-contour-lines","physical-activity-after-break","everyday-movement-counts","beginner-strength-exercises","birdwatching-without-disturbance","why-dead-trees-matter","prevent-bird-window-collisions","animal-tracks-observation","solar-eclipse-eye-safety","meteor-showers-observation","what-is-a-light-year","why-earth-has-seasons","raw-meat-cross-contamination","best-before-vs-use-by-europe","freezer-food-storage","ryzen-upgrade","wifi-speed","ddr4-ddr5","backup-321","ssd-vs-hdd","latvia-property-tax-online","flu-cold-covid-differences","black-friday-real-discounts","ai-voice-scam-calls","change-flat-tire-safely","find-my-ip-address","simple-monthly-budget-plan","create-professional-invoice","lost-stolen-smartphone-first-steps","fake-remote-job-offer-warning-signs"];
const auditedHardwareSources={"ryzen-upgrade":"Ryzen_5_1600_CPU_on_a_motherboard.jpg","wifi-speed":"Close-up_of_the_internet_router.jpg","ddr4-ddr5":"Memory_modules.jpg","backup-321":"Typical_External_Hard_Drive.JPG","ssd-vs-hdd":"Last_and_next-generation_storage_media.jpg"};
for(const [id,filename] of Object.entries(auditedHardwareSources)){
 const html=read('dist/ru/guides/'+id+'/index.html');
 assert.ok(html.includes(encodeURIComponent(filename)),'Incorrect Commons image source for '+id);
}
const reviewedCovers=new Set();
for(const id of handReviewed){
 const html=read('dist/ru/guides/'+id+'/index.html');
 const match=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/);
 assert.ok(match,'Reviewed photo missing: '+id);
 assert.ok(!reviewedCovers.has(match[1]),'Reviewed stories share the same photo: '+id);
 reviewedCovers.add(match[1]);
 assert.match(html,/class="article-photo-credit"/,'Photo author/licence missing: '+id);
 assert.match(html,/Wikimedia Commons/,'Photo attribution link missing: '+id);
}
assert.equal(reviewedCovers.size,handReviewed.length);
// A transparent audit of remaining duplicates; future curation can then be incremental.
const ownersByPhoto=new Map();
for(const guide of stories){
 const html=read('dist/guides/'+guide.id+'/index.html');
 const cover=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
 if(cover)ownersByPhoto.set(cover,[...(ownersByPhoto.get(cover)||[]),guide.id]);
}
const duplicateGroups=[...ownersByPhoto.values()].filter(ids=>ids.length>1);
console.log('PHOTO UNIQUENESS AUDIT: '+ownersByPhoto.size+' unique photos for '+stories.length+' stories; '+duplicateGroups.length+' reused-photo groups remain.');
for(const group of duplicateGroups)console.log('REVIEW NEEDED: '+group.join(', '));
assert.equal(duplicateGroups.length,0,'Every guide needs a distinct genuine photograph relevant to its subject');
assert.equal(ownersByPhoto.size,stories.length,'One unique photographic cover per guide');

assert.equal(illustratedGuidesC.length,12);
assert.equal(new Set(illustratedGuidesC.map(a=>a.topic)).size,11);
assert.ok(photos.size>=22,'We expect a meaningful variety of actual photographs');
assert.ok(!existsSync('dist/media/guide-fallback.svg'),'Remove old SVG fallback');
const fallback=readFileSync('dist/photos/photo-fallback.jpg');
assert.ok(fallback.length>12000&&fallback[0]===0xff&&fallback[1]===0xd8,'Fallback must be real JPEG photography');
console.log('PASS: '+stories.length+' guides, '+editions+' localized photo editions, '+topics.length+' photographic categories and twelve additions linked in eleven categories.');
