/* Lightweight RU/EN page copy; shared language preference, no network or billing calls. */
(() => {
  "use strict";
  const key="murdilimax-preview-lang";
  const query=new URLSearchParams(location.search).get("lang");
  let saved="";
  try {saved=localStorage.getItem(key)||"";} catch {}
  let language=(query==="ru"||query==="en")?query:
    ((saved==="ru"||saved==="en")?saved:"ru");
  const translated=[...document.querySelectorAll("[data-ru][data-en]")];
  const titles={
    ru:"Обновления и планы — Murdilimax Browser",
    en:"Updates & roadmap — Murdilimax Browser"
  };
  const descriptions={
    ru:"Обновления и планы Murdilimax Browser: выпущенные функции, следующие сборки и идеи для будущих версий.",
    en:"Murdilimax Browser updates: published beta, source-only improvements and future roadmap."
  };
  function setLanguage(next) {
    if(next!=="ru"&&next!=="en")return;
    language=next;
    document.documentElement.lang=language;
    try {localStorage.setItem(key,language);} catch {}
    for(const element of translated) element.textContent=element.dataset[language];
    document.querySelectorAll("[data-lang]").forEach(button=>{
      const active=button.dataset.lang===language;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    document.querySelectorAll('a[href^="https://murdilimax-browser.hatchable.site/"]').forEach(link=>{
      const initial=link.dataset.baseHref||link.getAttribute("href");
      link.dataset.baseHref=initial;
      const url=new URL(initial);
      url.searchParams.set("lang",language);
      link.href=url.toString();
    });
    document.title=titles[language];
    const description=document.querySelector('meta[name="description"]');
    if(description)description.content=descriptions[language];
  }
  document.querySelectorAll("[data-lang]").forEach(button=>
    button.addEventListener("click",()=>setLanguage(button.dataset.lang)));
  setLanguage(language);
})();
