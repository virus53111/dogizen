import {visualSpecies} from '../lib/species-atlas.js';
import {fishPhotos} from '../lib/species-fish-photos.js';
import {plantPhotos} from '../lib/species-plant-photos.js';
import {mushroomPhotos} from '../lib/species-mushroom-photos.js';
import {existsSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

assert.equal(visualSpecies.length,78,'Expected 78 species profiles');
const fingerprints = new Set();
const banned = /(?:^|[_\W])(?:distribution|dist|range|map|globe|atlas|iucn|status|flag|cookbook|kokbok|medizinal|illustration|plate)(?:[_\W]|$)|distkils|ineurope|(?:world|range)[_-]?map/i;
for (const entry of visualSpecies) {
  assert.ok(entry.latin&&entry.ru&&entry.en,'Missing species name: '+entry.id);
  assert.ok(entry.detail?.ru?.length>70&&entry.detail?.en?.length>70,'Missing real description: '+entry.latin);
  assert.ok(entry.image?.startsWith('https://upload.wikimedia.org/wikipedia/commons/'),'External/untrusted image '+entry.latin);
  assert.ok(entry.photoCredit?.startsWith('https://commons.wikimedia.org/wiki/File:'),'Missing Commons credit '+entry.latin);
  const filename=decodeURIComponent(entry.image.split('/').pop()).replace(/^\d+px-/,'');
  assert.ok(!banned.test(filename),'MAP / unrelated thumbnail instead of species: '+entry.latin+' => '+filename);
  assert.ok(!fingerprints.has(entry.image),'Image reused for another species: '+entry.latin);
  fingerprints.add(entry.image);
  assert.ok(!/Eel_inEurope|Clupeaharengusdistkils/.test(entry.image),'REGRESSION: map for '+entry.latin);
  assert.ok(entry.source.endsWith('/'+entry.latin.replace(/\s+/g,'_')),'Scientific source differs from name: '+entry.latin);
}
assert.match(fishPhotos.Anguilla_anguilla.image,/Anguilla_anguilla\.jpg/);
assert.match(fishPhotos.Clupea_harengus.image,/Clupea_harengus_alive\.jpg/);
assert.match(plantPhotos.Taraxacum_officinale.image,/Taraxacum_officinale_flor/);
assert.match(plantPhotos.Lavandula_angustifolia.image,/Lavandula-angustifolia-flowering/);
assert.ok(mushroomPhotos.Amanita_phalloides.image.includes('Amanita_phalloides'));
for(const lang of ['ru','en']){
  const root=lang==='en'?'dist/':'dist/'+lang+'/';
  for(const id of ['anguilla-anguilla','clupea-harengus','amanita-phalloides','ocimum-basilicum']){
    const html=readFileSync(root+'species/'+id+'/index.html','utf8');
    assert.match(html,/upload\.wikimedia\.org/,'Missing species image in page');
    assert.ok(!/Eel_inEurope|Clupeaharengusdistkils/.test(html),'Map in published HTML: '+id);
    assert.match(html,/commons\.wikimedia\.org\/wiki\/File:/,'Missing license attribution');
  }
}
assert.ok(existsSync('dist/ru/topics/fishing/index.html'));
console.log('PASS species media gate: 78 unique references, no map filenames, 8 profile checks');
