import {sourceFor} from './traffic-source.js';
const words={"ru":["Помогите улучшить сайт","Разрешить статистику посещений? Сохраняются только общие счётчики, приблизительная страна и источник перехода. Без рекламных трекеров.","Разрешить","Не разрешать","Настройки статистики"],"en":["Help improve the site","Allow aggregate visit statistics? Only counts, approximate country and traffic source are saved. No advertising trackers.","Allow","Decline","Analytics settings"],"lv":["Palīdzi uzlabot vietni","Atļaut apkopotu apmeklējumu statistiku? Saglabā tikai skaitītājus, aptuveno valsti un avotu. Bez reklāmas izsekotājiem.","Atļaut","Neatļaut","Statistikas iestatījumi"],"de":["Hilf uns, die Website zu verbessern","Aggregierte Besuchsstatistik erlauben? Nur Zähler, ungefähres Land und Herkunft werden gespeichert. Keine Werbetracker.","Erlauben","Ablehnen","Statistik-Einstellungen"],"lt":["Padėkite tobulinti svetainę","Leisti apibendrintą apsilankymų statistiką? Saugomi tik skaičiai, apytikslė šalis ir šaltinis. Be reklamos sekiklių.","Leisti","Neleisti","Statistikos nustatymai"],"et":["Aita veebilehte parandada","Kas lubad koondatud külastusstatistikat? Salvestatakse vaid loendurid, ligikaudne riik ja allikas. Reklaamijälgijaid pole.","Luba","Keela","Statistika seaded"]};
const W=words[document.documentElement.lang]||words.en;
const KEY='mm-traffic-consent-v1',SESSION='mm-traffic-session-v1';
const storage=(type,key,value)=>{try{const s=window[type];if(value===undefined)return s.getItem(key);if(value===null)s.removeItem(key);else s.setItem(key,value)}catch{}};
const optOut=()=>navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1';
let counted=false;
async function count(){
 if(counted||optOut()||storage('localStorage',KEY)!=='yes'||document.visibilityState!=='visible')return;
 counted=true;
 const now=Date.now();let old=null;try{old=JSON.parse(storage('sessionStorage',SESSION))}catch{}
 const visit=!(old&&Number.isFinite(old.at)&&now>=old.at&&now-old.at<1800000);
 const source=visit?sourceFor(location.search,document.referrer,location.hostname):old.source;
 storage('sessionStorage',SESSION,JSON.stringify({at:now,source}));
 try{if(window.MM_authReady)await window.MM_authReady;if(optOut()||storage('localStorage',KEY)!=='yes')return;
 await fetch('/api/traffic',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consent:true,visit,source}),cache:'no-store',credentials:'same-origin',referrerPolicy:'no-referrer',keepalive:true})}catch{}
}
const el=(tag,txt)=>{const x=document.createElement(tag);if(txt)x.textContent=txt;return x};
const btn=(txt,fn)=>{const b=el('button',txt);b.type='button';b.className='mm-traffic-btn';b.onclick=fn;return b};
function show(){
 if(optOut())return;
 document.getElementById('mmTrafficConsent')?.remove();
 const box=el('aside');box.id='mmTrafficConsent';box.setAttribute('aria-label',W[0]);box.append(el('strong',W[0]),el('p',W[1]));
 const row=el('div');row.append(btn(W[2],()=>{storage('localStorage',KEY,'yes');box.remove();count()}),btn(W[3],()=>{storage('localStorage',KEY,'no');storage('sessionStorage',SESSION,null);box.remove()}));box.append(row);document.body.append(box)
}
function init(){
 if(optOut())return;
 const settings=btn(W[4],show);settings.id='mmTrafficSettings';(document.querySelector('.footer-links')||document.querySelector('footer')||document.querySelector('main')||document.body).append(settings);
 const value=storage('localStorage',KEY);if(value==='yes')count();else if(value!=='no')show()
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')count()});
