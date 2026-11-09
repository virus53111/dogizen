import {mushroomPhotos} from './species-mushroom-photos.js';
import {fishPhotos} from './species-fish-photos.js';
import {plantPhotos} from './species-plant-photos.js';
import {mushroomProfiles} from './species-mushroom-content.js';
import {fishProfiles} from './species-fish-content.js';
import {plantProfiles} from './species-plant-content.js';
const groups=[['mushrooms',mushroomProfiles,mushroomPhotos],['fishing',fishProfiles,fishPhotos],['plants',plantProfiles,plantPhotos]];
export const visualSpecies=groups.flatMap(([group,data,photos])=>data.map(p=>{
 const key=p.latin.replace(/\s+/g,'_'),photo=photos[key]||null;
 return {...p,id:p.latin.toLowerCase().replace(/[^a-z0-9]+/g,'-'),group,image:photo?.image||null,photoCredit:photo?.credit||null,source:photo?.source||'https://en.wikipedia.org/wiki/'+encodeURIComponent(key)};
}));
export const visualSpeciesById=id=>visualSpecies.find(x=>x.id===id);
export const visualSpeciesFor=group=>visualSpecies.filter(x=>x.group===group);
export const speciesLanguages=['en','ru'];
export const specLocale=(p,lang)=>lang==='ru'?'ru':'en';
