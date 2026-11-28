import { locales } from '../public/date-game/locales.js';
import { esc, origin } from './stories.js';
const langs=['ru','en','de','lv','lt','et'];
const names={ru:'Русский',en:'English',de:'Deutsch',lv:'Latviešu',lt:'Lietuvių',et:'Eesti'};
export const gamePath=lang=>lang==='en'?'/date-game/':'/'+lang+'/date-game/';
const alternatives=()=>langs.map(lang=>[lang,gamePath(lang)]).concat([['x-default',gamePath('en')]]);
export function gameSitemap(xml){
 const entries=langs.map(lang=>'<url><loc>'+origin+gamePath(lang)+'</loc>'+alternatives().map(([l,p])=>'<xhtml:link rel="alternate" hreflang="'+l+'" href="'+origin+p+'" />').join('')+'</url>').join('\n');
 return xml.replace('</urlset>',entries+'\n</urlset>');
}
export function gamePage(template,lang){
 const t=locales[lang],url=origin+gamePath(lang),title=t.title+' · MurdiliMax';
 const description=t.createIntro+' · 18+';
 const links=alternatives().map(([l,p])=>'<link rel="alternate" hreflang="'+l+'" href="'+origin+p+'">').join('');
 const navigation='<nav class="game-footer" aria-label="Languages">'+langs.map(l=>'<a lang="'+l+'" hreflang="'+l+'" href="'+gamePath(l)+'">'+names[l]+'</a>').join(' · ')+'</nav>';
 const intro='<p class="intro">'+esc(t.createIntro)+'</p><ol class="results">'+t.questions.map(q=>'<li>'+esc(q.title)+'</li>').join('')+'</ol>';
 return template.replace('<html lang="en">','<html lang="'+lang+'">')
  .replace(/<title>[^<]*<\/title>/,()=>'<title>'+esc(title)+'</title>')
  .replace(/<meta name="description" content="[^"]*">/,()=>'<meta name="description" content="'+esc(description)+'">')
  .replace(/<link rel="canonical" href="[^"]*">/,()=>'<link rel="canonical" href="'+url+'">'+links)
  .replace(/<meta property="og:title" content="[^"]*">/,()=>'<meta property="og:title" content="'+esc(title)+'">')
  .replace(/<meta property="og:description" content="[^"]*">/,()=>'<meta property="og:description" content="'+esc(description)+'">')
  .replace(/<meta property="og:url" content="[^"]*">/,()=>'<meta property="og:url" content="'+url+'">')
  .replace('href="./game.css"','href="/date-game/game.css"')
  .replace('src="./game.js"','src="/date-game/game.js?v=20261128-viral"')
  .replace('<h1 class="game-title">Guess my ideal date</h1>',()=>'<h1 class="game-title">'+esc(t.title)+'</h1>'+intro)
  .replace('<noscript><p>This game needs JavaScript. You can still visit the MurdiliMax catalog below.</p></noscript>','')
  .replace('<a id="catalog" href="/">Dating catalog</a>',()=>'<a id="catalog" href="'+(lang==='ru'?'/':'/'+lang+'/')+'?utm_source=date_game#catalog">'+esc(t.catalog)+'</a>')
  .replace('</body>',navigation+'</body>');
}
export function registerGamePages(app,template){
 for(const lang of langs){
  const route=gamePath(lang),html=gamePage(template,lang);
  app.get(new RegExp('^'+route+'$'),(req,res)=>res.set('Cache-Control','no-cache').type('html').send(html));
 }
}
