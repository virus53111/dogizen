// Two honest, lightweight RSS discovery feeds for the site's actual English
// and Russian article editions. No fabricated translations or external feeds.
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const xml=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const dateString=value=>{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const d=new Date(value+'T12:00:00.000Z');
 return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===value?d:null;
};
export async function writeRssFeeds({root,storiesFor,url,topics,site}){
 for(const lang of ['en','ru']){
  const entries=storiesFor(lang).map(s=>{
   const d=s[lang],published=dateString(s.published);
   if(!published||!d?.title||!s.id)return null;
   return {
    title:d.title,description:d.subtitle||d.description||'',
    published,link:site+url(lang,'guides/'+s.id),
    category:topics.find(t=>t.id===s.topic)?.[lang]||s.topic||'Guides'
   };
  }).filter(Boolean).sort((a,b)=>b.published-a.published||a.link.localeCompare(b.link)).slice(0,30);
  if(!entries.length)throw Error('Cannot publish empty RSS feed for '+lang);
  const title=lang==='ru'?'MURDILIMAX — новые статьи':'MURDILIMAX — latest guides';
  const desc=lang==='ru'?'Практичные ответы и объяснения на русском языке.':'Practical, independently edited answers and explanations in English.';
  const feedUrl=site+(lang==='ru'?'/ru/feed.xml':'/feed.xml');
  const body='<?xml version="1.0" encoding="UTF-8"?>\n'
   +'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n'
   +'<title>'+xml(title)+'</title>\n'
   +'<link>'+xml(site+url(lang))+'</link>\n'
   +'<description>'+xml(desc)+'</description>\n'
   +'<language>'+lang+'</language>\n'
   +'<atom:link href="'+xml(feedUrl)+'" rel="self" type="application/rss+xml"/>\n'
   +entries.map(item=>
       '<item><title>'+xml(item.title)+'</title>'
      +'<link>'+xml(item.link)+'</link>'
      +'<guid isPermaLink="true">'+xml(item.link)+'</guid>'
      +'<description>'+xml(item.description)+'</description>'
      +'<category>'+xml(item.category)+'</category>'
      +'<pubDate>'+item.published.toUTCString()+'</pubDate></item>'
   ).join('\n')+'\n</channel>\n</rss>\n';
  const dest=path.join(root,lang==='ru'?'ru/feed.xml':'feed.xml');
  await mkdir(path.dirname(dest),{recursive:true});
  await writeFile(dest,body,'utf8');
  console.log('RSS '+lang+': '+entries.length+' localized article links');
 }
}
