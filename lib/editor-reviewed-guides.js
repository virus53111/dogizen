// Reviewed editorial articles are the only automation-produced articles allowed into site output.
// Candidate drafts live OUTSIDE this folder and are never imported here automatically.
import {readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const approvedDir=path.join(repoRoot,'editorial','approved');
const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const date=/^\d{4}-\d{2}-\d{2}$/;
const unsafe=/\[(?:VERIFY|SOURCE|CITATION|TODO)[^\]]*\]|(?:\bTODO\b|\bTBD\b|\bPLACEHOLDER\b|\bEDITOR\s*:)|<\s*(?:script|iframe|img|a|svg)\b/i;
const licenseNames=new Set(['CC0 1.0','CC BY 2.0','CC BY 3.0','CC BY 4.0','CC BY-SA 2.0','CC BY-SA 3.0','CC BY-SA 4.0','Public Domain']);

function validDate(s) {
 if(typeof s!=='string'||!date.test(s))return false;
 const d=new Date(s+'T12:00:00Z');
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;
}
function https(value,host) {
 try{
  const u=new URL(value);
  return u.protocol==='https:'&&!u.username&&!u.password&&(!host||u.hostname===host)&&(!u.port||u.port==='443');
 }catch{return false;}
}
function check(cond,message){if(!cond)throw new Error('Reviewed article validation: '+message);}
function text(value,min,max,label){
 check(typeof value==='string'&&value.trim().length>=min&&value.length<=max,'Invalid '+label);
 check(!unsafe.test(value),'Unverified or unsafe text in '+label);
 return value.trim();
}
export function validateReviewedArticle(s,{filename='',topics=[]}={}){
 check(s&&typeof s==='object'&&!Array.isArray(s),'Invalid article JSON '+filename);
 check(slug.test(s.id)&&s.id.length<=74&&(!filename||filename===s.id+'.json'),'Filename must match safe article id');
 check(topics.length===0||topics.some(t=>t.id===s.topic),'Unknown category '+s.topic);
 check(Number.isInteger(s.minutes)&&s.minutes>=3&&s.minutes<=35,'Reading minutes');
 check(validDate(s.published),'Published date');
 check(s.approval?.status==='approved','Missing explicit approved status');
 check(s.approval?.factsVerified===true&&s.approval?.originalityReviewed===true&&s.approval?.imageRightsVerified===true,'Required human checks');
 check(validDate(s.approval?.checkedAt),'Approval date');
 text(s.approval?.reviewer,3,100,'editor reviewer');
 check(s.approval.checkedAt>=s.published,'Approval date cannot precede publication date');
 check(Array.isArray(s.sources)&&s.sources.length>=3&&s.sources.length<=12,'Need at least three independently reviewed source links');
 const sourceHosts=new Set();
 for(const [i,source] of s.sources.entries()){
  text(source?.label,8,180,'source label '+i);
  check(https(source.url),'Unsafe/non-HTTPS source URL '+i);
  sourceHosts.add(new URL(source.url).hostname);
 }
 check(sourceHosts.size>=2,'Sources must have at least two distinct hostnames');
 const photo=s.photoAsset;
 check(photo&&typeof photo==='object','Real attributed photo required');
 check(https(photo.url,'commons.wikimedia.org')&&photo.url.includes('/wiki/Special:Redirect/file/'),'Wikimedia Commons direct redirect photo');
 check(https(photo.source,'commons.wikimedia.org')&&photo.source.includes('/wiki/File:'),'Wikimedia Commons file description URL');
 check(licenseNames.has(photo.licenseLabel),'Approved Wikimedia media license label');
 check(https(photo.license),'Media license page must be HTTPS');
 text(photo.credit,10,240,'photo author and credit');
 check(s.mediaAlt&&typeof s.mediaAlt==='object','Photo accessibility text missing');
 const langs=['en','ru'].filter(lang=>s[lang]);
 check(langs.length>=1,'At least one completed language edition is required');
 for(const lang of langs){
  const d=s[lang];
  text(d.title,20,115,lang+' title');
  text(d.subtitle,45,260,lang+' intro');
  text(d.description,75,230,lang+' meta description');
  text(s.mediaAlt[lang],15,200,lang+' photo alt');
  text(d.photoCaption,45,430,lang+' attribution caption');
  check(Array.isArray(d.sections)&&d.sections.length>=4&&d.sections.length<=9,
    lang+' needs 4–9 useful sections');
  for(const [i,sec] of d.sections.entries()){
   check(Array.isArray(sec)&&sec.length===2,lang+' section format '+i);
   text(sec[0],12,120,lang+' section title '+i);
   text(sec[1],300,2600,lang+' section body '+i);
  }
 }
 return {...s, image:photo.url,updated:s.updated&&validDate(s.updated)?s.updated:s.published};
}
export function loadReviewedArticles(topics=[]){
 let files=[];
 try{files=readdirSync(approvedDir).filter(f=>f.endsWith('.json'));}catch(e){
  if(e.code==='ENOENT')return [];
  throw e;
 }
 return files.sort().map(filename=>{
  check(slug.test(filename.slice(0,-5)),'Unexpected file name '+filename);
  const raw=readFileSync(path.join(approvedDir,filename),'utf8');
  check(raw.length<80_000,'Article file too large: '+filename);
  return validateReviewedArticle(JSON.parse(raw),{filename,topics});
 });
}
