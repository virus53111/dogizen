/* Bilingual download page. Data attributes are authored, not dynamic HTML. */
(()=>{
  "use strict";
  const key="murdilimax-preview-lang";
  const params=new URLSearchParams(location.search);
  let stored="";
  try{stored=localStorage.getItem(key)||""}catch{}
  let language=params.get("lang");
  if(language!=="ru"&&language!=="en")language=stored==="en"||stored==="ru"?stored:"ru";
  const nodes=[...document.querySelectorAll("[data-ru][data-en]")];
  const titles={ru:"Скачать Murdilimax Browser — Windows и Mac",en:"Download Murdilimax Browser — Windows & Mac"};
  const descriptions={ru:"Скачать Murdilimax Browser для Windows и macOS. Бесплатная бета-версия и информация о совместимости.",en:"Download Murdilimax Browser for Windows and macOS. Free beta preview and compatibility information."};
  function localize(lang){
    if(!["ru","en"].includes(lang))return;
    language=lang;
    document.documentElement.lang=lang;
    try{localStorage.setItem(key,lang)}catch{}
    for(const node of nodes)node.textContent=node.dataset[lang];
    for(const btn of document.querySelectorAll("[data-lang]")){
      const active=btn.dataset.lang===lang;
      btn.classList.toggle("active",active);
      btn.setAttribute("aria-pressed",String(active));
    }
    for(const anchor of document.querySelectorAll("a[href]")){
      const raw=anchor.dataset.originalHref||anchor.getAttribute("href");
      if(!raw||!raw.startsWith("https://murdilimax-browser.hatchable.site/"))continue;
      anchor.dataset.originalHref=raw;
      const url=new URL(raw);url.searchParams.set("lang",lang);anchor.href=url.toString();
    }
    document.title=titles[lang];
    const description=document.querySelector('meta[name="description"]');
    if(description)description.setAttribute("content",descriptions[lang]);
  }
  document.querySelectorAll("[data-lang]").forEach(button=>
    button.addEventListener("click",()=>localize(button.dataset.lang)));
  localize(language);
})();
