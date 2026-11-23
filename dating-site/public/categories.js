/* MurdiliMax category taxonomy, original labels and four-language translations. */
window.MM_CATEGORY_GROUPS=[
{id:"formats",icon:"✧",name:{ru:"Формат отношений",en:"Dating preferences",de:"Kontaktarten",lv:"Iepazīšanās veidi"}},
{id:"dating",icon:"♡",name:{ru:"Знакомства и отношения",en:"Dating & relationships",de:"Kontakte & Beziehungen",lv:"Iepazīšanās un attiecības"}},
{id:"community",icon:"✧",name:{ru:"Сообщество",en:"Community",de:"Community",lv:"Kopiena"}}
];
window.MM_CATEGORIES=[
{id:"noncommercial",group:"formats",icon:"♡",name:{ru:"Без материальных ожиданий",en:"No financial expectations",de:"Ohne finanzielle Erwartungen",lv:"Bez materiālām gaidām"}},
{id:"support",group:"formats",icon:"✦",name:{ru:"Отношения с поддержкой",en:"Supportive relationships",de:"Unterstützende Beziehungen",lv:"Atbalstošas attiecības"}},
{id:"dating",group:"dating",icon:"♡",name:{ru:"Все знакомства",en:"All dating",de:"Alle Kontakte",lv:"Visas iepazīšanās"}},
{id:"women-men",group:"dating",icon:"♀",name:{ru:"Женщины ищут мужчин",en:"Women seeking men",de:"Frauen suchen Männer",lv:"Sievietes meklē vīriešus"}},
{id:"women-serious",group:"dating",icon:"♥",name:{ru:"Женщины — отношения",en:"Women seeking a relationship",de:"Frauen – Beziehung",lv:"Sievietes – attiecības"}},
{id:"women-women",group:"dating",icon:"♡",name:{ru:"Женщины ищут женщин",en:"Women seeking women",de:"Frauen suchen Frauen",lv:"Sievietes meklē sievietes"}},
{id:"men-women",group:"dating",icon:"♂",name:{ru:"Мужчины ищут женщин",en:"Men seeking women",de:"Männer suchen Frauen",lv:"Vīrieši meklē sievietes"}},
{id:"men-serious",group:"dating",icon:"♥",name:{ru:"Мужчины — отношения",en:"Men seeking a relationship",de:"Männer – Beziehung",lv:"Vīrieši – attiecības"}},
{id:"men-men",group:"dating",icon:"♂",name:{ru:"Мужчины ищут мужчин",en:"Men seeking men",de:"Männer suchen Männer",lv:"Vīrieši meklē vīriešus"}},
{id:"couples",group:"dating",icon:"♧",name:{ru:"Пары и знакомства",en:"Couples & dating",de:"Paare & Kontakte",lv:"Pāri un iepazīšanās"}},
{id:"trans-dating",group:"dating",icon:"✿",name:{ru:"Транс и небинарные знакомства",en:"Trans & nonbinary dating",de:"Trans & nichtbinäre Kontakte",lv:"Trans un nebināru cilvēku iepazīšanās"}},
{id:"social",group:"dating",icon:"☻",name:{ru:"Общение и дружба",en:"Social & friendship",de:"Freundschaft & Austausch",lv:"Saziņa un draudzība"}},
{id:"events",group:"community",icon:"✦",name:{ru:"Встречи и события",en:"Meetups & events",de:"Treffen & Events",lv:"Tikšanās un pasākumi"}},
];
window.MM_categoryById = id => window.MM_CATEGORIES.find(c=>c.id===id);
window.MM_categoryLabel = (id,lang) => (window.MM_categoryById(id)?.name?.[lang]||window.MM_categoryById(id)?.name?.ru||id);