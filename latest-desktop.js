/* Murdilimax Orbit: show only installers actually published to GitHub Releases. */
(function(){
 const root=document.getElementById('orbit-installer-list');if(!root)return;
 const locale=(new URLSearchParams(location.search).get('lang')||localStorage.getItem('murdilimax-language')||'ru').slice(0,2);
 const tr={
  ru:{title:'Установщики для компьютера',desc:'Выбери свою операционную систему. Доступны только успешно собранные версии.',mac:'Mac (Apple Silicon)',intel:'Mac (Intel)',win:'Windows 10/11',download:'Скачать установщик',pending:'Сборка проходит проверку',size:'Размер',beta:'Экспериментальная бета. Android-образы загружаются отдельно, Google-вход настраивается владельцем.',source:'Открыть все релизы'},
  en:{title:'Desktop installers',desc:'Choose your operating system. Only successfully published builds are shown.',mac:'Mac (Apple Silicon)',intel:'Mac (Intel)',win:'Windows 10/11',download:'Download installer',pending:'Build is being verified',size:'Size',beta:'Experimental beta. Android images require a separate download; Google sign-in requires owner setup.',source:'View all releases'},
  lv:{title:'Datora instalētāji',desc:'Izvēlies operētājsistēmu. Pieejamas tikai pārbaudītas versijas.',mac:'Mac (Apple Silicon)',intel:'Mac (Intel)',win:'Windows 10/11',download:'Lejupielādēt',pending:'Versija tiek pārbaudīta',size:'Izmērs',beta:'Eksperimentāla beta. Android attēli jālejupielādē atsevišķi.',source:'Visi laidieni'},
  et:{title:'Töölauarakenduse paigaldajad',desc:'Vali operatsioonisüsteem. Näidatakse ainult avaldatud versioone.',mac:'Mac (Apple Silicon)',intel:'Mac (Intel)',win:'Windows 10/11',download:'Laadi alla',pending:'Versiooni kontrollitakse',size:'Suurus',beta:'Katseversioon. Androidi süsteemipildid tuleb eraldi alla laadida.',source:'Kõik versioonid'},
  lt:{title:'Kompiuterio diegimo programos',desc:'Pasirink operacinę sistemą. Rodomos tik išleistos versijos.',mac:'Mac (Apple Silicon)',intel:'Mac (Intel)',win:'Windows 10/11',download:'Atsisiųsti',pending:'Versija tikrinama',size:'Dydis',beta:'Bandomoji versija. Android sistemos atvaizdai atsisiunčiami atskirai.',source:'Visos laidos'},
  de:{title:'Desktop-Installer',desc:'Wähle dein Betriebssystem. Nur veröffentlichte Builds werden angezeigt.',mac:'Mac (Apple Silicon)',intel:'Mac (Intel)',win:'Windows 10/11',download:'Installer laden',pending:'Build wird geprüft',size:'Größe',beta:'Experimentelle Beta. Android-Images müssen separat geladen werden.',source:'Alle Releases'}
 };
 const l=tr[locale]||tr.ru;
 const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const platforms=[
  {key:'mac',label:l.mac,ext:'.dmg',asset:'Murdilimax-Orbit-macOS-Apple-Silicon.dmg',version:'v0.3.0-mac-beta'},
  {key:'intel',label:l.intel,ext:'.dmg',asset:'Murdilimax-Orbit-macOS-Intel.dmg',version:'v0.3.0-mac-beta'},
  {key:'win',label:l.win,ext:'.exe',asset:'Murdilimax-Orbit-Windows-Setup.exe',version:'v0.3.0-win-beta'}
 ];
 root.style.cssText='margin-top:28px;padding:24px;border:1px solid #69548b;background:#201b3b;border-radius:17px';
 root.innerHTML='<h2 style="font-size:22px;margin:0 0 8px">'+esc(l.title)+'</h2><p style="font-size:12px;color:#b9b5d6;margin:0 0 16px">'+esc(l.desc)+'</p><p style="font-size:12px;color:#b8aec6">'+esc(l.pending)+'…</p>';
 const urls=['v0.3.0-mac-beta','v0.3.0-win-beta'].map(tag=>'https://api.github.com/repos/virus53111/dogizen/releases/tags/'+tag);
 Promise.all(urls.map(url=>fetch(url,{headers:{Accept:'application/vnd.github+json'}}).then(r=>r.ok?r.json():null).catch(()=>null))).then(releases=>{
  const assets=new Map();
  releases.filter(Boolean).forEach(release=>(release.assets||[]).forEach(a=>{if(a.browser_download_url&&a.name)assets.set(a.name,a)}));
  const cells=platforms.map(p=>{
   const a=assets.get(p.asset),ready=!!a;
   return '<div style="min-width:0;background:#30284a;border:1px solid #66547d;padding:16px;border-radius:12px;display:flex;flex-direction:column;gap:13px">'+
    '<div style="font-weight:800;font-size:14px">'+esc(p.label)+'</div>'+
    '<small style="color:#aaa0ca">'+(ready?'Beta 0.3 · '+esc(l.size)+': '+(a.size/1048576).toFixed(0)+' MB':esc(l.pending))+'</small>'+
    (ready?'<a href="'+esc(a.browser_download_url)+'" style="display:block;background:#c8adff;color:#241836;border-radius:9px;padding:12px;text-decoration:none;font-weight:800;text-align:center;font-size:12px">'+esc(l.download)+' '+p.ext+'</a>':'<span style="color:#8a829e;font-size:12px">⌛</span>')+'</div>';
  }).join('');
  root.innerHTML='<h2 style="font-size:22px;margin:0 0 8px">'+esc(l.title)+'</h2><p style="font-size:12px;color:#b9b5d6;margin:0 0 18px">'+esc(l.desc)+'</p>'+
   '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px">'+cells+'</div>'+
   '<p style="color:#a9a2c4;font-size:11px;line-height:1.7;margin:18px 0 12px">'+esc(l.beta)+'</p>'+
   '<a href="https://github.com/virus53111/dogizen/releases" target="_blank" rel="noopener" style="color:#d5baff;font-size:12px">'+esc(l.source)+' ↗</a>';
 });
})();