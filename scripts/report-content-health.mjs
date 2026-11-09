import {storiesFor,languages,availableIn} from '../lib/atlas-data.js';
const words=sections=>sections.flat().join(' ').trim().split(/\s+/u).filter(Boolean).length;
console.log('\nEDITORIAL COVERAGE REPORT (descriptive only; Google has no minimum word count)');
for(const lang of languages){
 const localized=storiesFor(lang);
 const stats=localized.map(article=>({
  title:article[lang].title,
  id:article.id,
  words:words(article[lang].sections),
  refs:(article.sources||[]).length+(article.localeSources?.[lang]||[]).length
 }));
 const counts=stats.map(x=>x.words).sort((a,b)=>a-b);
 const med=counts.length?counts[Math.floor(counts.length/2)]:0;
 const short=stats.filter(x=>x.words<120);
 console.log(lang.toUpperCase(), 'guides='+stats.length, 'medianWords='+med, 'below120Words='+short.length,
  'withSources='+stats.filter(x=>x.refs>0).length);
 if(short.length) console.log('  editorial review candidates: '+short.sort((a,b)=>a.words-b.words).slice(0,5).map(x=>x.id+' ('+x.words+')').join(', '));
}
console.log('Notes: thin content is a review flag, not an automatic SEO penalty or a signal to force word counts. Assess usefulness, originality and actual query intent.');
