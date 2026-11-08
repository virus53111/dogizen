(async function buildSEO() {
  const fs=await import("node:fs/promises");
  const path=await import("node:path");
  const OUT=process.argv[2]||"_site";
  const BASE="https://murdilimax.com";
  const API="https://murdilimax.hatchable.site";
  const LANGS=["ru","lv","en"];
  const esc=(s)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const iso=new Date().toISOString().slice(0,10);
  const money=n=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(n)||0);
  const routes={
    realty:{ru:"nedvizhimost",lv:"nekustamais-ipasums",en:"real-estate"},
    cars:{ru:"avtomobili",lv:"auto",en:"cars"},
    electronics:{ru:"elektronika",lv:"elektronika",en:"electronics"},
    jobs:{ru:"rabota",lv:"darbs",en:"jobs"},
    services:{ru:"uslugi",lv:"pakalpojumi",en:"services"},
    home:{ru:"dom-i-sad",lv:"maja-un-darzs",en:"home-and-garden"},
    other:{ru:"raznoe",lv:"citi",en:"other"}
  };
  const textContent={
    ru:{
      heading:"Объявления в Латвии — находите выгодные предложения",
      lead:"Ищите объявления о квартирах, машинах, технике и товарах для дома. Предложения с других площадок имеют обозначение источника и ссылку на оригинал. Собственное объявление на MURDILIMAX можно разместить бесплатно.",
      browse:"Смотреть все предложения",post:"Подать своё объявление",tips:"Что проверить перед покупкой",categories:"Категории",source:"Предложения из открытых RSS-лент",sourceNotice:"Объявления опубликованы на SS.lv и представлены как ссылки на оригинал. Цены и наличие могут измениться. MURDILIMAX не является продавцом этих товаров.",back:"К объявлениям",more:"Открыть на SS.lv",
      realty:["Недвижимость","Недвижимость в Латвии: квартиры, дома и аренда","Сравнивайте цены, районы и площадь жилья в Риге, Юрмале и других городах. Внешние предложения отмечены источником.","Уточните коммунальные платежи и условия договора аренды.","При покупке проверьте документы и состояние дома.","Оцените транспорт, район и инфраструктуру до просмотра."],
      cars:["Автомобили","Автомобили в Латвии: сравните цены и марки","Подборка предложений Volkswagen, BMW, Audi, Volvo и других марок. Сведения о наличии подтверждайте у продавца на оригинальном сайте.","Проверьте VIN, пробег и историю обслуживания.","Уточните дату техосмотра и состояние автомобиля.","Перед оплатой осмотрите машину и проведите тест-драйв."],
      electronics:["Электроника","Телефоны, компьютеры и техника в Латвии","Сравнивайте цены на смартфоны, компьютеры и бытовую технику. Ссылки ведут на исходные объявления продавцов.","Проверьте работоспособность устройства и аккумулятора.","Уточните модель, комплектацию и серийный номер.","Убедитесь, что телефон отвязан от чужой учётной записи."],
      jobs:["Работа и вакансии","Работа в Латвии: реальные вакансии по профессиям","Выбирайте вакансии водителя, продавца, повара, программиста и других специалистов. Смотрите профессии и график, а детали и зарплату уточняйте на исходном сайте.","Уточняйте размер оплаты, график и вид трудового договора.","Проверяйте работодателя и условия работы до подписания документов.","Не отправляйте деньги за обещание трудоустройства."],
      services:["Услуги","Услуги в Латвии: ремонт, строительство и помощь","Сравнивайте предложения по ремонту, строительству и бытовым услугам. Узнавайте стоимость, сроки, необходимые материалы и контакты на странице источника.","Перед началом согласуйте цену работ и объём услуг.","По возможности изучите отзывы и примеры предыдущих работ.","Договаривайтесь об оплате и сроках письменно."],
      home:["Дом и сад","Мебель и товары для дома в Латвии","Диваны, столы, кресла и другие предложения для дома из открытых RSS. Уточняйте состояние товара и возможность доставки.","Измерьте мебель и проходы, через которые её нужно пронести.","Попросите фотографии дефектов и следов использования.","Осмотрите товар и уточните условия доставки."],
      other:["Разное","Другие объявления в Латвии: велосипеды и находки","Предложения, которые не вошли в основные разделы: велосипеды и различные товары. По каждому внешнему предложению есть ссылка на источник.","Уточняйте наличие до поездки к продавцу.","Избегайте предоплаты незнакомым людям.","Выбирайте безопасное место для личной встречи."]
    },
    lv:{
      heading:"Sludinājumi Latvijā — atrodi izdevīgus piedāvājumus",
      lead:"Meklē dzīvokļus, automašīnas, elektroniku un mājas preces. Citu vietņu piedāvājumiem norādām avotu un saiti uz oriģinālu. Savu sludinājumu MURDILIMAX vari ievietot bez maksas.",
      browse:"Skatīt piedāvājumus",post:"Ievietot sludinājumu",tips:"Ko pārbaudīt pirms pirkuma",categories:"Kategorijas",source:"Piedāvājumi no publiskām RSS plūsmām",sourceNotice:"Ārējie sludinājumi ir publicēti SS.lv, un tie šeit tiek parādīti ar saiti uz avotu. Cena un pieejamība var mainīties. MURDILIMAX nav šo preču pārdevējs.",back:"Uz sludinājumiem",more:"Atvērt SS.lv",
      realty:["Nekustamais īpašums","Nekustamais īpašums Latvijā: dzīvokļi un mājas","Salīdzini cenas, platību un apkaimi Rīgā, Jūrmalā un citviet Latvijā. Katram ārējam sludinājumam ir norādīts avots.","Noskaidro komunālos maksājumus un īres līguma noteikumus.","Pērkot īpašumu, pārbaudi dokumentus un ēkas stāvokli.","Novērtē transportu un apkārtnes infrastruktūru."],
      cars:["Automašīnas","Automašīnas Latvijā: salīdzini cenas un markas","Skati Volkswagen, BMW, Audi, Volvo un citu marku piedāvājumus. Pieejamību vienmēr precizē oriģinālajā sludinājumā.","Pārbaudi VIN, nobraukumu un servisa vēsturi.","Noskaidro tehniskās apskates termiņu un stāvokli.","Pirms maksāšanas apskati un izmēģini auto."],
      electronics:["Elektronika","Telefoni, datori un elektronika Latvijā","Salīdzini viedtālruņu, datoru un sadzīves tehnikas cenas. Saites ved pie sākotnējā piedāvājuma.","Pārbaudi ierīces funkcijas un akumulatoru.","Noskaidro precīzu modeli un komplektāciju.","Pārliecinies, ka tālrunis nav piesaistīts svešam kontam."],
      jobs:["Darbs un vakances","Vakances Latvijā: darbs dažādās profesijās","Atrodiet vakances autovadītājiem, pārdevējiem, pavāriem, programmētājiem un citiem speciālistiem. Algu un noteikumus precizējiet sākotnējā sludinājumā.","Pirms piekrišanas noskaidrojiet algu, grafiku un līguma nosacījumus.","Pārbaudiet darba devēju un piedāvājuma ticamību.","Nemaksājiet par solījumiem iekārtoties darbā."],
      services:["Pakalpojumi","Pakalpojumi Latvijā: remonts, būvniecība un palīdzība","Salīdziniet remonta, būvniecības un citu pakalpojumu piedāvājumus Latvijā. Cenas un pieejamību pārbaudiet pie izpildītāja.","Pirms darba saskaņojiet apjomu un cenu.","Apskatiet meistara iepriekšējo darbu piemērus.","Rakstiski vienojieties par apmaksu un termiņiem."],
      home:["Māja un dārzs","Mēbeles un mājas preces Latvijā","Dīvāni, galdi, krēsli un mājas preces no publiskajām RSS plūsmām. Pirms iegādes noskaidro preces stāvokli.","Nomēri mēbeles, kā arī durvju un koridoru platumu.","Pajautā par defektiem un lietojuma pazīmēm.","Saskaņo piegādi un pārbaudi preci pirms samaksas."],
      other:["Dažādi","Citi sludinājumi Latvijā: velosipēdi un preces","Dažādi piedāvājumi ārpus galvenajām kategorijām, tostarp velosipēdi. Pie katra norādīts oriģinālais avots.","Noskaidro pieejamību pirms brauciena.","Nesūti priekšapmaksu nepazīstamiem pārdevējiem.","Vienojies par drošu tikšanās vietu."]
    },
    en:{
      heading:"Classified ads in Latvia — find local deals",
      lead:"Explore apartments, cars, electronics and home goods. Offers from other sites are clearly attributed and link to the original listing. Post your own listing on MURDILIMAX for free.",
      browse:"Browse offers",post:"Post your listing",tips:"What to check before buying",categories:"Categories",source:"Offers from public RSS feeds",sourceNotice:"External offers were published on SS.lv and link to the original listing. Price and availability may change. MURDILIMAX is not the seller of these items.",back:"Back to classifieds",more:"Open on SS.lv",
      realty:["Real estate","Real estate in Latvia: apartments and houses","Compare housing prices, floor areas and neighborhoods in Riga, Jūrmala and other Latvian cities. External offers are attributed to their original publisher.","Ask about utilities, deposits and rental contract terms.","Check property documents and building condition before buying.","Assess transport links and the local neighborhood."],
      cars:["Cars","Cars for sale in Latvia: compare prices and brands","Browse Volkswagen, BMW, Audi, Volvo and other brands. Confirm current availability with the original seller.","Check the VIN, mileage and service history.","Ask about the inspection and technical condition.","Inspect the vehicle and arrange a test drive before paying."],
      electronics:["Electronics","Phones, computers and electronics in Latvia","Compare prices for smartphones, computers and appliances. Source links lead to the original advertisement.","Test the device and its battery performance.","Verify the exact model, accessories and serial number.","Make sure a second-hand phone is signed out of the previous owner's account."],
      jobs:["Jobs and vacancies","Jobs in Latvia: vacancies by profession","Browse vacancies for drivers, cooks, sales staff, programmers and more. Compare job categories and schedules, then verify compensation and terms with the original employer.","Confirm salary, work schedule and contract conditions.","Research the employer before sharing sensitive documents.","Never pay a stranger for a promised job."],
      services:["Services","Services in Latvia: home repairs and construction","Find construction, repair and other service providers across Latvia. Compare offers and verify price and availability with the original advertiser.","Agree on the scope, timeline and price in advance.","Request references or examples of completed work.","Keep a written record of payment and deadlines."],
      home:["Home & garden","Furniture and home goods in Latvia","Explore sofas, tables, chairs and other household items from public RSS feeds. Verify item condition with the seller.","Measure furniture and the space it needs to pass through.","Ask about damage and signs of wear.","Arrange delivery and inspect the item before paying."],
      other:["Other","More classifieds in Latvia: bicycles and finds","Browse varied offers outside the main categories, including bicycles. Every external card links to its original source.","Check current availability before traveling.","Avoid sending advance payments to strangers.","Choose a safe place to meet in person."]
    }
  };
  const links=(k,l)=>BASE+"/"+l+"/"+routes[k][l]+"/";
  const homeLink=l=>l==="ru"?BASE+"/":BASE+"/"+l+"/";
  const hrefLang=k=>["ru","lv","en"].map(l=>`<link rel="alternate" hreflang="${l}" href="${links(k,l)}">`).join("")+`<link rel="alternate" hreflang="x-default" href="${links(k,"ru")}">`;
  const homeAlternates=()=>["ru","lv","en"].map(l=>`<link rel="alternate" hreflang="${l}" href="${homeLink(l)}">`).join("")+`<link rel="alternate" hreflang="x-default" href="${BASE}/">`;
  const schema=x=>JSON.stringify(x).replace(/</g,"\\u003c");
  const stylesheet=`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');:root{font-family:Manrope,Arial,sans-serif;color:#1c3355}*{box-sizing:border-box}body{margin:0;background:#f8faff}a{text-decoration:none;color:#245cdc}a:hover{text-decoration:underline}.shell{width:min(1110px,calc(100% - 32px));margin:auto}.header{background:#fff;border-bottom:1px solid #dfe7f6}.header .shell{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:15px}.logo{font-size:23px;font-weight:800;letter-spacing:-1px}.languages{display:flex;gap:6px;align-items:center}.languages a{font-size:11px;font-weight:800;border-radius:8px;padding:9px;border:1px solid #dae6fb}.languages a.active{background:#2155e8;color:white}.hero{background:linear-gradient(115deg,#eaf8ff,#e7edff);padding:54px 0}.eyebrow{font-size:10px;letter-spacing:1.8px;font-weight:800;color:#386adb}.hero h1{font-size:clamp(32px,4.3vw,50px);letter-spacing:-1.8px;line-height:1.2;max-width:900px;margin:18px 0}.hero p{font-size:14px;line-height:1.85;max-width:810px;color:#637e9f}.cta{display:flex;gap:11px;flex-wrap:wrap;margin-top:24px}.cta a{display:inline-block;border-radius:10px;padding:13px 19px;background:#2155e8;color:#fff;font-size:12px;font-weight:800}.cta a.secondary{background:white;border:1px solid #bccff5;color:#245bd3}.main{padding:32px 0 70px}.panel{border:1px solid #e2eaf7;background:white;padding:25px;border-radius:16px;margin-bottom:21px}.panel h2{font-size:22px;letter-spacing:-.8px;margin:0 0 18px}.panel p{font-size:13px;line-height:1.85;color:#637b9b}.category-links{display:flex;flex-wrap:wrap;gap:9px}.category-links a{background:#f0f5ff;padding:11px 13px;border-radius:9px;font-size:12px;font-weight:800}.category-links a.current{background:#2155e8;color:white}.job-subnav{margin-top:16px;display:flex;flex-wrap:wrap;gap:12px}.job-subnav a{font-size:12px;font-weight:800;background:#e8f0ff;padding:9px 12px;border-radius:8px}.job-salary{font-size:13px!important;color:#2459c6!important;font-weight:800}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}.offer{background:#fff;border:1px solid #e3ebf6;border-radius:12px;overflow:hidden;min-width:0}.offer img{width:100%;height:149px;object-fit:cover;background:#e9f2ff}.offer .photo-empty{height:149px;display:grid;place-items:center;background:#eaf3fc;color:#8eabde;font-size:39px}.offer .copy{padding:14px}.offer .price{font-weight:800;font-size:17px;color:#1e59da}.offer h3{font-size:12px;line-height:1.5;min-height:34px;color:#273954}.offer small{display:block;font-size:10px;color:#7187a5}.offer .label{display:inline-block;background:#e6edff;border-radius:6px;padding:5px 7px;color:#2459c6;font-size:10px;font-weight:800;margin-top:10px}.tips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.tips div{font-size:12px;line-height:1.9;background:#f0f6ff;border-radius:12px;padding:17px;color:#587398}.tips strong{display:block;color:#2159de;font-size:25px}.notice{font-size:11px;line-height:1.9;color:#806c4b;background:#fff5e4;padding:16px;border-radius:10px;margin-top:17px}.foot{background:#172b4e;color:#bdd1ef;padding:34px 0;font-size:12px;line-height:1.9}.foot strong{color:white;font-size:22px}.foot a{color:white}.breadcrumbs{margin-bottom:24px;color:#778aaa;font-size:12px}.item-detail{font-size:13px;line-height:1.9;white-space:pre-wrap;color:#506885}@media(max-width:800px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.tips{grid-template-columns:1fr}}@media(max-width:520px){.panel{padding:18px}.grid{gap:8px}.offer img,.offer .photo-empty{height:125px}.offer .copy{padding:10px}.offer h3{font-size:11px}.hero h1{letter-spacing:-1px}.logo{font-size:18px}.languages a{font-size:10px;padding:7px}}`;
  function header(l,k){
    const options=LANGS.map(v=>({code:v,href:k?links(k,v):homeLink(v)}));
    return `<header class="header"><div class="shell"><a href="${BASE}/" class="logo">murdilimax ✦</a><nav class="languages">${options.map(v=>`<a href="${v.href}" hreflang="${v.code}" class="${l===v.code?"active":""}">${v.code.toUpperCase()}</a>`).join("")}</nav></div></header>`;
  }
  function categories(l,selected){
    return `<nav class="category-links" aria-label="${esc(textContent[l].categories)}">${Object.keys(routes).map(k=>`<a class="${k===selected?"current":""}" href="${links(k,l)}">${esc(textContent[l][k][0])}</a>`).join("")}</nav>`;
  }
  function footer(l){return `<footer class="foot"><div class="shell"><strong>MURDILIMAX</strong><p>${esc(textContent[l].sourceNotice)}</p><a href="${BASE}/">${esc(textContent[l].back)}</a></div></footer>`;}
  function head(l,title,description,canonical,alternates,structured){
    return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}">${alternates||""}<meta property="og:type" content="website"><meta property="og:site_name" content="MURDILIMAX"><meta property="og:url" content="${canonical}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/seo.css"><script type="application/ld+json">${schema(structured)}</script></head><body>`;
  }
  async function json(path){
    try{const r=await fetch(API+path,{signal:AbortSignal.timeout(8500)});if(r.ok)return r.json();console.warn("SEO data unavailable",path,r.status);}catch(e){console.warn("SEO API",path,e.message);}
    return {};
  }
  async function write(name,txt){
    const file=path.join(OUT,name);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,txt);
  }
  const jobSubSlugs={vacancy:{ru:"vakansii",lv:"vakances",en:"vacancies"},seeking:{ru:"ishut-rabotu",lv:"mekle-darbu",en:"seeking-work"}};
  const jobSubUrl=(lang,kind)=>links("jobs",lang)+jobSubSlugs[kind][lang]+"/";
  const workCopy={
   ru:{vacancy:["Вакансии в Латвии","Актуальные предложения работодателей: водитель, продавец, повар, строитель и другие профессии. Смотрите условия на странице источника."],seeking:["Ищут работу в Латвии","Объявления людей, которые ищут работу. Разместите своё резюме бесплатно, чтобы работодатели могли с вами связаться."],none:"Пока здесь нет объявлений соискателей. Вы можете разместить первое."},
   lv:{vacancy:["Vakances Latvijā","Darba devēju piedāvājumi autovadītājiem, pārdevējiem, pavāriem un citiem speciālistiem. Pārbaudiet nosacījumus avota vietnē."],seeking:["Meklē darbu Latvijā","Darba meklētāju sludinājumi. Ievietojiet savu sludinājumu bez maksas, lai darba devēji varētu sazināties."],none:"Pašlaik nav darba meklētāju sludinājumu. Ievietojiet pirmo."},
   en:{vacancy:["Job vacancies in Latvia","Current employer offers for drivers, salespeople, cooks, builders and other roles. Confirm conditions with the original publisher."],seeking:["Seeking work in Latvia","Job seekers available for opportunities. Post your own profile for free so employers can contact you."],none:"There are no job seeker posts yet. You can publish the first one."}
  };
  const jobNavigation=lang=>'<div class="job-subnav">'+["vacancy","seeking"].map(kind=>'<a href="'+jobSubUrl(lang,kind)+'">'+esc(workCopy[lang][kind][0])+'</a>').join(" · ")+'</div>';
  const offers={};
  for(const k of Object.keys(routes))offers[k]=(await json("/api/external?category="+k+(k==="jobs"?"&job_type=vacancy":""))).items||[];
  const nativeSeekers=(await json("/api/listings?category=jobs&job_type=seeking")).items||[];
  const externalSeekers=(await json("/api/external?category=jobs&job_type=seeking")).items||[];
  const seekerRoleNames={
    driver:{ru:"водителем",lv:"autovadītāju",en:"driver"},cleaner:{ru:"уборщиком",lv:"apkopēju",en:"cleaner"},
    builder:{ru:"строителем",lv:"celtnieku",en:"builder"},electrician:{ru:"электриком",lv:"elektriķi",en:"electrician"},
    programmer:{ru:"программистом",lv:"programmētāju",en:"programmer"},cook:{ru:"поваром",lv:"pavāru",en:"cook"},
    seller:{ru:"продавцом",lv:"pārdevēju",en:"salesperson"},worker:{ru:"рабочим",lv:"strādnieku",en:"worker"},
    administrator:{ru:"администратором",lv:"administratoru",en:"administrator"},nurse:{ru:"помощником по уходу",lv:"aprūpētāju",en:"caregiver"}
  };
  const seekerName=(a,lang)=>seekerRoleNames[a.attributes?.profession]?.[lang]
    ?({ru:"Ищу работу ",lv:"Meklēju darbu kā ",en:"Seeking work as a "}[lang]+seekerRoleNames[a.attributes.profession][lang])
    :a.title;
  const indexed=new Set([BASE+"/"]);
  await write("seo.css",stylesheet);
  for(const lang of LANGS){
    const t=textContent[lang];
    if(lang!=="ru"){
      const url=homeLink(lang);
      const title=lang==="lv"?"Sludinājumi Latvijā — dzīvokļi, auto, preces | MURDILIMAX":"Classified ads in Latvia — homes, cars, electronics | MURDILIMAX";
      const main=header(lang)+`<section class="hero"><div class="shell"><div class="eyebrow">MURDILIMAX · LATVIA</div><h1>${esc(t.heading)}</h1><p>${esc(t.lead)}</p><div class="cta"><a href="${BASE}/?lang=${lang}">${esc(t.browse)} →</a><a class="secondary" href="${BASE}/?view=post&lang=${lang}">${esc(t.post)}</a></div></div></section><main class="shell main"><div class="panel"><h2>${esc(t.categories)}</h2>${categories(lang)}</div></main>`+footer(lang);
      const structured={"@context":"https://schema.org","@type":"WebPage",name:t.heading,description:t.lead,url,inLanguage:lang};
      await write(lang+"/index.html",head(lang,title,t.lead.slice(0,158),url,homeAlternates(),structured)+main+"</body></html>");
      indexed.add(url);
    }
    for(const key of Object.keys(routes)){
      const [name,h1,lead,...tips]=t[key],canonical=links(key,lang);
      const title=h1+" | MURDILIMAX";
      const description=lead.slice(0,165);
      const cats=categories(lang,key);
      const cards=(offers[key]||[]).slice(0,8).map(a=>{
        const link=String(a.source_url||"");
        if(!/^https:\/\/(?:www\.)?ss\.(?:lv|com)\/msg\//i.test(link))return "";
        const roleNames={
         driver:{ru:"водитель",lv:"autovadītāju",en:"driver"},seller:{ru:"продавец",lv:"pārdevēju",en:"salesperson"},cook:{ru:"повар",lv:"pavāru",en:"cook"},
         cleaner:{ru:"уборщик",lv:"apkopēju",en:"cleaner"},builder:{ru:"строитель",lv:"celtnieku",en:"builder"},administrator:{ru:"администратор",lv:"administratoru",en:"administrator"},
         programmer:{ru:"программист",lv:"programmētāju",en:"programmer"},electrician:{ru:"электрик",lv:"elektriķi",en:"electrician"},
         cashier:{ru:"кассир",lv:"kasieri",en:"cashier"},dispatcher:{ru:"диспетчер",lv:"dispečeru",en:"dispatcher"},teacher:{ru:"преподаватель",lv:"skolotāju",en:"teacher"},nurse:{ru:"медсестра",lv:"medmāsu",en:"nurse"}
        };
        const role=roleNames[a.attributes?.profession]?.[lang],jobTitle=key==="jobs"&&role?({ru:"Требуется ",lv:"Meklē ",en:"Hiring "}[lang]+role):a.title;
        return `<article class="offer"><a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${a.image_url?`<img src="${esc(a.image_url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'<div class="photo-empty">✦</div>'}<div class="copy">${key==="jobs"?`<span class="label">${lang==="ru"?"Вакансия":lang==="lv"?"Vakance":"Vacancy"}</span>`:`<span class="price">${esc(a.price_unit==="negotiable"?(lang==="ru"?"Цена по запросу":lang==="lv"?"Cena pēc pieprasījuma":"Price on request"):money(a.price))}</span>`}<h3>${esc(jobTitle)}</h3>${jobTitle!==a.title?`<small>${esc(a.title)}</small>`:""}${key==="jobs"&&a.price_unit!=="negotiable"?`<small class="job-salary">${esc(money(a.price))}</small>`:""}<small>${esc(a.city||"Latvija")}</small><span class="label">SS.lv ↗</span></div></a></article>`;
      }).join("");
      const breadcrumb={"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"MURDILIMAX",item:homeLink(lang)},{"@type":"ListItem",position:2,name,item:canonical}]};
      const structured={"@context":"https://schema.org","@graph":[{"@type":"CollectionPage",name:h1,description,url:canonical,inLanguage:lang},breadcrumb]};
      const main=header(lang,key)+`<section class="hero"><div class="shell"><div class="eyebrow">MURDILIMAX · LATVIA</div><h1>${esc(h1)}</h1><p>${esc(lead)}</p><div class="cta"><a href="${BASE}/?lang=${lang}&category=${key}">${esc(t.browse)} →</a><a href="${BASE}/?lang=${lang}&view=post" class="secondary">${esc(t.post)}</a></div></div></section><main class="shell main"><div class="breadcrumbs"><a href="${homeLink(lang)}">MURDILIMAX</a> / ${esc(name)}</div><section class="panel"><h2>${esc(t.categories)}</h2>${cats}${key==="jobs"?jobNavigation(lang):""}</section><section class="panel"><h2>${esc(t.source)}</h2><p>${esc(lead)}</p>${cards?`<div class="grid">${cards}</div>`:""}<div class="notice">${esc(t.sourceNotice)}</div></section><section class="panel"><h2>${esc(t.tips)}</h2><div class="tips">${tips.map((s,i)=>`<div><strong>${String(i+1).padStart(2,"0")}</strong>${esc(s)}</div>`).join("")}</div></section></main>`+footer(lang);
      const alternates=LANGS.map(l=>`<link rel="alternate" hreflang="${l}" href="${links(key,l)}">`).join("")+`<link rel="alternate" hreflang="x-default" href="${links(key,"ru")}">`;
      await write(lang+"/"+routes[key][lang]+"/index.html",head(lang,title,description,canonical,alternates,structured)+main+"</body></html>");
      indexed.add(canonical);
    }
    // Dedicated SEO landing pages for vacancies and people seeking employment.
    for(const kind of ["vacancy","seeking"]){
      const [heading,lead]=workCopy[lang][kind],canonical=jobSubUrl(lang,kind);
      const title=heading+" | MURDILIMAX";
      const alternates=LANGS.map(l=>'<link rel="alternate" hreflang="'+l+'" href="'+jobSubUrl(l,kind)+'">').join("")+'<link rel="alternate" hreflang="x-default" href="'+jobSubUrl("ru",kind)+'">';
      const results=kind==="vacancy"
        ?(offers.jobs||[]).slice(0,8).map(a=>({title:a.title,city:a.city,source:a.source_url,image:a.image_url,price:a.price,price_unit:a.price_unit,external:true}))
        :[
          ...externalSeekers.map(a=>({title:seekerName(a,lang),city:a.city,source:a.source_url,image:null,price:null,external:true})),
          ...nativeSeekers.map(a=>({title:a.title,city:a.city,source:BASE+"/ads/"+Number(a.id)+"/",image:a.image_url,price:a.price,external:false}))
        ].slice(0,8);
      const cards=results.filter(a=>/^https:\/\//.test(a.source||"")).map(a=>'<article class="offer"><a href="'+esc(a.source)+'"'+(a.external?' target="_blank" rel="noopener noreferrer"':'')+'>'+(a.image?'<img src="'+esc(a.image)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<div class="photo-empty">▤</div>')+'<div class="copy"><span class="label">'+esc(kind==="vacancy"?(lang==="ru"?"Вакансия":lang==="lv"?"Vakance":"Vacancy"):workCopy[lang].seeking[0])+'</span><h3>'+esc(a.title)+'</h3>'+(Number(a.price)>0?'<small>'+esc(money(a.price))+'</small>':'')+'<small>'+esc(a.city||"Latvija")+'</small>'+(a.external?'<span class="label">SS.lv ↗</span>':'')+'</div></a></article>').join("");
      const ctaList=BASE+"/?lang="+lang+"&category=jobs&job_type="+kind;
      const ctaPost=BASE+"/?view=post&lang="+lang+"&category=jobs&job_type="+kind;
      const main=header(lang,"jobs")+'<section class="hero"><div class="shell"><div class="eyebrow">MURDILIMAX · JOBS</div><h1>'+esc(heading)+'</h1><p>'+esc(lead)+'</p><div class="cta"><a href="'+ctaList+'">'+esc(t.browse)+' →</a><a href="'+ctaPost+'" class="secondary">'+esc(t.post)+'</a></div></div></section><main class="shell main"><div class="panel"><h2>'+esc(t.categories)+'</h2>'+categories(lang,"jobs")+jobNavigation(lang)+'</div><div class="panel"><h2>'+esc(heading)+'</h2><p>'+esc(lead)+'</p>'+(cards?'<div class="grid">'+cards+'</div>':'<p class="notice">'+esc(workCopy[lang].none)+'</p>')+'</div></main>'+footer(lang);
      const structured={"@context":"https://schema.org","@type":"CollectionPage",name:heading,description:lead,url:canonical,inLanguage:lang};
      await write(lang+"/"+routes.jobs[lang]+"/"+jobSubSlugs[kind][lang]+"/index.html",head(lang,title,lead.slice(0,165),canonical,alternates,structured)+main+"</body></html>");
      indexed.add(canonical);
    }
  }
  // Index unique first-party content only; external SS.lv items remain links to SS.lv.
  for(let page=1;page<=20;page++){
    const d=await json("/api/listings?page="+page);
    if(!d.items?.length)break;
    for(const ad of d.items){
      const id=Number(ad.id);
      if(!Number.isSafeInteger(id)||id<=0||!ad.title||!ad.description)continue;
      const canonical=BASE+"/ads/"+id+"/",desc=String(ad.description).replace(/\s+/g," ").slice(0,155);
      const structured={"@context":"https://schema.org","@type":"WebPage",name:ad.title,url:canonical,description:desc,datePublished:ad.created_at};
      const main=header("ru")+`<main class="shell main"><div class="breadcrumbs"><a href="${BASE}/">MURDILIMAX</a> / ${esc(ad.category)} / ${id}</div><section class="panel"><div class="eyebrow">MURDILIMAX · № ${id}</div><h1>${esc(ad.title)}</h1><p>${esc(ad.city)} · ${esc(ad.created_at?.slice(0,10)||"")}</p><h2>${esc(money(ad.price))}</h2><p class="item-detail">${esc(ad.description)}</p><div class="cta"><a href="${BASE}/?view=ad&id=${id}">Открыть объявление и связаться с продавцом →</a></div><div class="notice">Уточняйте наличие и цену у продавца до оплаты.</div></section></main>`+footer("ru");
      await write("ads/"+id+"/index.html",head("ru",ad.title+" — "+ad.city+" | MURDILIMAX",desc,canonical,"",structured)+main+"</body></html>");
      indexed.add(canonical);
    }
    if(d.items.length<24)break;
  }
  const urls=[...indexed];
  await write("sitemap.xml",'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(url=>`<url><loc>${esc(url)}</loc><lastmod>${iso}</lastmod></url>`).join("\n")+'\n</urlset>\n');
  await write("robots.txt","User-agent: *\nAllow: /\nSitemap: https://murdilimax.com/sitemap.xml\n");
  console.log("MURDILIMAX SEO: generated",urls.length,"indexable URLs; source:",API,"; date:",iso);
})();