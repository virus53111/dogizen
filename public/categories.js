/* MurdiliMax category taxonomy, original labels and four-language translations. */
window.MM_CATEGORY_GROUPS=[
{id:"dating",icon:"♡",name:{ru:"Знакомства и отношения",en:"Dating & relationships",de:"Kontakte & Beziehungen",lv:"Iepazīšanās un attiecības"}},
{id:"adult",icon:"✦",name:{ru:"Знакомства 18+ и досуг",en:"Adult social & leisure",de:"Erwachsenen-Treffs",lv:"Pieaugušo tikšanās un atpūta"}},
{id:"services",icon:"◇",name:{ru:"Услуги и объявления",en:"Services & listings",de:"Dienstleistungen & Anzeigen",lv:"Pakalpojumi un sludinājumi"}},
{id:"community",icon:"✧",name:{ru:"Сообщество",en:"Community",de:"Community",lv:"Kopiena"}}
];
window.MM_CATEGORIES=[
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
{id:"open-relationships",group:"adult",icon:"◇",name:{ru:"Открытые отношения",en:"Open relationships",de:"Offene Beziehungen",lv:"Atvērtas attiecības"}},
{id:"swinger",group:"adult",icon:"✴",name:{ru:"Свингер-сообщество",en:"Swinger community",de:"Swinger-Community",lv:"Svingeru kopiena"}},
{id:"bdsm",group:"adult",icon:"✧",name:{ru:"БДСМ-знакомства",en:"BDSM connections",de:"BDSM-Kontakte",lv:"BDSM iepazīšanās"}},
{id:"events",group:"adult",icon:"✦",name:{ru:"Встречи и события",en:"Meetups & events",de:"Treffen & Events",lv:"Tikšanās un pasākumi"}},
{id:"clubs",group:"adult",icon:"◈",name:{ru:"Клубы и вечеринки 18+",en:"Adult clubs & parties",de:"Clubs & Partys 18+",lv:"Klubi un ballītes 18+"}},
{id:"escort-women",group:"services",icon:"♢",name:{ru:"Эскорт: женщины",en:"Escort: women",de:"Escort: Frauen",lv:"Eskorts: sievietes"}},
{id:"escort-men",group:"services",icon:"♢",name:{ru:"Эскорт: мужчины",en:"Escort: men",de:"Escort: Männer",lv:"Eskorts: vīrieši"}},
{id:"massage",group:"services",icon:"✿",name:{ru:"Массаж и релакс 18+",en:"Massage & relaxation 18+",de:"Massage & Entspannung 18+",lv:"Masāža un relaksācija 18+"}},
{id:"online",group:"services",icon:"◌",name:{ru:"Онлайн-общение и контент",en:"Online chat & content",de:"Online-Chat & Inhalte",lv:"Tiešsaistes saziņa un saturs"}},
{id:"show",group:"services",icon:"✶",name:{ru:"Танцевальные шоу 18+",en:"Adult dance shows",de:"Tanzshows 18+",lv:"Deju šovi 18+"}},
{id:"apartments",group:"services",icon:"⌂",name:{ru:"Апартаменты и аренда",en:"Apartments & rentals",de:"Apartments & Vermietung",lv:"Apartamenti un noma"}},
{id:"vacancies",group:"services",icon:"▣",name:{ru:"Вакансии и предложения",en:"Jobs & opportunities",de:"Jobs & Angebote",lv:"Darbs un piedāvājumi"}},
{id:"job-seeking",group:"services",icon:"◈",name:{ru:"Ищу работу",en:"Looking for work",de:"Arbeit gesucht",lv:"Meklēju darbu"}},
{id:"goods",group:"services",icon:"▱",name:{ru:"Товары для взрослых",en:"Adult products",de:"Produkte für Erwachsene",lv:"Preces pieaugušajiem"}},
{id:"advice",group:"community",icon:"☷",name:{ru:"Советы и обсуждения",en:"Advice & discussions",de:"Rat & Diskussionen",lv:"Padomi un diskusijas"}},
{id:"stories",group:"community",icon:"☼",name:{ru:"Истории и рассказы 18+",en:"Adult stories",de:"Geschichten 18+",lv:"Stāsti 18+"}},
{id:"other",group:"community",icon:"☰",name:{ru:"Другие объявления",en:"Other listings",de:"Andere Anzeigen",lv:"Citi sludinājumi"}}
];
window.MM_categoryById = id => window.MM_CATEGORIES.find(c=>c.id===id);
window.MM_categoryLabel = (id,lang) => (window.MM_categoryById(id)?.name?.[lang]||window.MM_categoryById(id)?.name?.ru||id);