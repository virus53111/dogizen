import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  BadgeEuro,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  ExternalLink,
  GitCompare,
  Headphones,
  Heart,
  Laptop,
  Languages,
  Layers3,
  Link2,
  Menu,
  ScanSearch,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Store,
  TrendingDown,
  Tv,
  X,
  Zap,
} from 'lucide-react';

type Lang = 'ru' | 'lv';
type Category = 'all' | 'phones' | 'computers' | 'audio' | 'home';
type InfoPage = 'about' | 'how' | 'partners' | 'privacy' | 'disclosure';
type ViewMode = 'all' | 'favorites' | 'alerts';

type Offer = {
  store: string;
  price: number;
  delivery: string;
  source: string;
};

type Product = {
  id: number;
  title: string;
  model: string;
  brand: string;
  category: Exclude<Category, 'all'>;
  imageUrl?: string;
  emoji: string;
  meta: string;
  aliases: string[];
  offers: Offer[];
};

const products: Product[] = [
  {
    id: 1,
    title: 'Samsung Galaxy S25 Ultra 256GB',
    model: 'SM-S938B',
    brand: 'Samsung',
    category: 'phones',
    emoji: '📱',
    aliases: ['s25 ultra', 'galaxy s25 ultra', 'самсунг s25 ultra', 'samsung s 25 ultra'],
    imageUrl: 'https://files.tecnoblog.net/wp-content/uploads/2025/01/galaxy-s25-ultra-titanio-prata-700x700.png',
    meta: '256 GB · Titanium Black · 5G',
    offers: [
      { store: '220.lv', price: 1049, delivery: '0–3 €', source: 'Tradedoubler' },
      { store: 'Dateks.lv', price: 1069, delivery: '2.99 €', source: 'Direct' },
      { store: 'Samsung.lv', price: 1099, delivery: 'Bezmaksas', source: 'Awin' },
    ],
  },
  {
    id: 2,
    title: 'Apple MacBook Air 13 M4 16/256GB',
    model: 'MW0W3',
    brand: 'Apple',
    category: 'computers',
    emoji: '💻',
    aliases: ['macbook air m4', 'macbook m4', 'макбук air m4'],
    imageUrl: 'https://www.mobileciti.com.au/media/catalog/product/a/p/apple-macbook-air-13-inch-with-m4-chip-512gb-16gb-sky-blue-3.jpg?image-type=image&store=mobileciti',
    meta: '13.6″ · 16 GB · 256 GB SSD',
    offers: [
      { store: '220.lv', price: 1129, delivery: '0–3 €', source: 'Tradedoubler' },
      { store: 'Dateks.lv', price: 1149, delivery: '2.99 €', source: 'Direct' },
    ],
  },
  {
    id: 3,
    title: 'Sony WH-1000XM6',
    model: 'WH1000XM6B',
    brand: 'Sony',
    category: 'audio',
    emoji: '🎧',
    aliases: ['xm6', 'sony xm6', 'wh1000xm6'],
    imageUrl: 'https://pulsepad.com.ua/files/resized/products/sony-wh-1000xm6-midnight-blue.1800x1800w.jpg',
    meta: 'ANC · Bluetooth · Black',
    offers: [
      { store: '220.lv', price: 419, delivery: '0–3 €', source: 'Tradedoubler' },
      { store: 'Dateks.lv', price: 429, delivery: '2.99 €', source: 'Direct' },
    ],
  },
  {
    id: 4,
    title: 'Samsung OLED 55″ S95F',
    model: 'QE55S95F',
    brand: 'Samsung',
    category: 'home',
    emoji: '📺',
    aliases: ['s95f', 'samsung oled s95f', 'oled 55'],
    imageUrl: 'https://img-prd-pim.poorvika.com/product/Samsung-oled-4k-ultra-hd-smart-tv-s95f-55-inch-Front-Right-View.webp',
    meta: '55″ · OLED · 4K · Smart TV',
    offers: [
      { store: 'Samsung.lv', price: 1599, delivery: 'Bezmaksas', source: 'Awin' },
      { store: '220.lv', price: 1649, delivery: '0–15 €', source: 'Tradedoubler' },
    ],
  },
  {
    id: 5,
    title: 'Lenovo Legion 5 16IRX9',
    model: '83DG00A5PB',
    brand: 'Lenovo',
    category: 'computers',
    emoji: '🖥️',
    aliases: ['legion 5', 'lenovo legion', '16irx9'],
    imageUrl: 'https://goldentech.com.sa/media/catalog/product/cache/3b63c6023d7836f7abeed5960b50eab1/l/a/laptop_lenovo_legion_5_16irx9_gaming_intel_core_i9-14900hx_rtx_4060_83dg00fhad_1.jpg',
    meta: '16″ · i7 · RTX 4060 · 16/1000 GB',
    offers: [
      { store: 'Dateks.lv', price: 1299, delivery: '2.99 €', source: 'Direct' },
      { store: '220.lv', price: 1339, delivery: '0–3 €', source: 'Tradedoubler' },
    ],
  },
  {
    id: 6,
    title: 'Apple iPhone 16 Pro Max 256GB',
    model: 'MYWV3HX/A',
    brand: 'Apple',
    category: 'phones',
    emoji: '📱',
    aliases: ['16 pro max', 'iphone16promax', 'iphone 16 pro max', 'айфон 16 про макс', 'apple 16 pro max'],
    imageUrl: 'https://cdn.movertix.com/media/catalog/product/i/p/iphone-16-pro-max-white-titanium-1tb_1.jpg',
    meta: '256 GB · 6.9″ OLED · A18 Pro · Titanium',
    offers: [
      { store: '220.lv', price: 1339.95, delivery: 'Demo', source: 'Tradedoubler' },
      { store: 'Dateks.lv', price: 1376.27, delivery: 'Demo', source: 'Direct' },
    ],
  },
];

const copy = {
  ru: {
    navCatalog: 'Каталог', navHow: 'Как работает', navPartners: 'Партнёрам', navAbout: 'О проекте',
    heroBadge: 'Сервис сравнения цен для Латвии',
    heroTitle1: 'Ищи один раз.', heroTitle2: 'Сравнивай разумно.',
    heroText: 'ЦенаRadar собирает предложения магазинов в одном интерфейсе, чтобы сравнение цены, доставки и характеристик занимало минуты, а не часы.',
    searchPlaceholder: 'Например: iPhone 16 Pro Max, S25 Ultra, MacBook M4', searchButton: 'Сравнить цены',
    independent: 'Независимое сравнение', latvia: 'Фокус на Латвии', noAccount: 'Без обязательной регистрации',
    categoriesTitle: 'Популярные категории', categoriesSub: 'Быстрый вход в каталог по типу товара.',
    all: 'Все товары', phones: 'Смартфоны', computers: 'Ноутбуки и ПК', audio: 'Аудио', home: 'ТВ и техника',
    catalogEyebrow: 'КАТАЛОГ', catalogTitle: 'Сравни предложения в одном месте',
    sampleBanner: 'Каталог запуска: цены и предложения сейчас демонстрационные. Live-данные появятся после подключения разрешённых product feeds.',
    store: 'Магазин', priceTo: 'Цена до', reset: 'Сбросить', sort: 'Цена', found: 'Найдено',
    from: 'от', offers: 'предл.', best: 'Лучшая цена', delivery: 'Доставка', source: 'Источник', demo: 'DEMO',
    favorite: 'В избранное', compare: 'Сравнить', details: 'Подробнее', toStore: 'В магазин',
    disabledLink: 'Переход отключён до подключения одобренной партнёрской ссылки.',
    empty: 'Ничего не найдено', emptySub: 'Попробуй другой запрос или сбрось фильтры.',
    whyEyebrow: 'ПОЧЕМУ CENARADAR', whyTitle: 'Сравнение без лишнего шума',
    why1Title: 'Цена на первом месте', why1Text: 'Обычная сортировка строится по цене товара, а не по размеру партнёрской комиссии.',
    why2Title: 'Данные из разрешённых источников', why2Text: 'Для live-каталога используются merchant feeds, XML/CSV/API и другие согласованные источники.',
    why3Title: 'Локальный фокус', why3Text: 'Интерфейс и будущий каталог ориентированы на покупателей и магазины Латвии.',
    howEyebrow: 'КАК ЭТО РАБОТАЕТ', howTitle: 'От запроса до магазина — три шага',
    step1: 'Найди товар', step1Text: 'Введи бренд, модель или ключевые характеристики.',
    step2: 'Сравни предложения', step2Text: 'Посмотри цену, доставку и доступные магазины.',
    step3: 'Выбери магазин', step3Text: 'Перейди по одобренной tracking-ссылке, когда интеграция активна.',
    partnerEyebrow: 'ДЛЯ МАГАЗИНОВ И СЕТЕЙ', partnerTitle: 'Подключим каталог к CenaRadar',
    partnerText: 'Открыты к интеграциям с интернет-магазинами, affiliate-сетями и поставщиками товарных фидов. После одобрения подключаем feed и tracking-ссылки в соответствии с условиями партнёра.',
    partnerButton: 'Условия подключения',
    faqEyebrow: 'FAQ', faqTitle: 'Частые вопросы',
    faq1: 'ЦенаRadar продаёт товары?', faq1a: 'Нет. CenaRadar сравнивает предложения и направляет пользователя в выбранный магазин.',
    faq2: 'Почему цены сейчас помечены Demo?', faq2a: 'Пока партнёрские товарные фиды подключаются, launch-каталог показывает демонстрационный формат сравнения. Он не выдаётся за live-цены.',
    faq3: 'Как будет обновляться цена?', faq3a: 'После подключения магазина — из разрешённого product feed, XML/CSV/API или другого согласованного источника.',
    footer: 'Независимый сервис сравнения товарных предложений для покупателей в Латвии.',
    privacy: 'Privacy', disclosure: 'Affiliate disclosure', status: 'BETA',
    favoritesOnly: 'Показываем только избранное', alertsOnly: 'Показываем товары с уведомлениями', showAll: 'Показать всё',
    detailsPrice: 'Примерная лучшая цена', history: 'История цены', historyDemo: 'Демонстрационные данные', alertOn: 'Уведомление включено', alertOff: 'Сообщить о снижении цены', storeOffers: 'Предложения магазинов',
    copied: 'Ссылка скопирована.', maxCompare: 'Можно сравнить максимум 3 товара.',
  },
  lv: {
    navCatalog: 'Katalogs', navHow: 'Kā tas darbojas', navPartners: 'Partneriem', navAbout: 'Par projektu',
    heroBadge: 'Cenu salīdzināšanas serviss Latvijai',
    heroTitle1: 'Meklē vienreiz.', heroTitle2: 'Salīdzini gudri.',
    heroText: 'CenaRadar apkopo veikalu piedāvājumus vienā saskarnē, lai cenu, piegādes un parametru salīdzināšana aizņemtu minūtes, nevis stundas.',
    searchPlaceholder: 'Piemēram: iPhone 16 Pro Max, S25 Ultra, MacBook M4', searchButton: 'Salīdzināt cenas',
    independent: 'Neatkarīga salīdzināšana', latvia: 'Fokuss uz Latviju', noAccount: 'Bez obligātas reģistrācijas',
    categoriesTitle: 'Populāras kategorijas', categoriesSub: 'Ātra pāreja uz katalogu pēc preces veida.',
    all: 'Visas preces', phones: 'Viedtālruņi', computers: 'Datori', audio: 'Audio', home: 'TV un tehnika',
    catalogEyebrow: 'KATALOGS', catalogTitle: 'Salīdzini piedāvājumus vienuviet',
    sampleBanner: 'Palaišanas katalogs: cenas un piedāvājumi pašlaik ir demonstrācijas dati. Live dati būs pēc atļauto produktu plūsmu pieslēgšanas.',
    store: 'Veikals', priceTo: 'Cena līdz', reset: 'Notīrīt', sort: 'Cena', found: 'Atrasts',
    from: 'no', offers: 'piedāv.', best: 'Labākā cena', delivery: 'Piegāde', source: 'Avots', demo: 'DEMO',
    favorite: 'Izlasē', compare: 'Salīdzināt', details: 'Vairāk', toStore: 'Uz veikalu',
    disabledLink: 'Pāreja ir atslēgta līdz apstiprinātas partnera saites pieslēgšanai.',
    empty: 'Nekas nav atrasts', emptySub: 'Pamēģini citu vaicājumu vai notīri filtrus.',
    whyEyebrow: 'KĀPĒC CENARADAR', whyTitle: 'Salīdzināšana bez lieka trokšņa',
    why1Title: 'Cena pirmajā vietā', why1Text: 'Parastā kārtošana balstās uz preces cenu, nevis partnera komisijas lielumu.',
    why2Title: 'Dati no atļautiem avotiem', why2Text: 'Live katalogam paredzētas produktu plūsmas, XML/CSV/API un citi saskaņoti avoti.',
    why3Title: 'Lokāls fokuss', why3Text: 'Saskarne un topošais katalogs ir orientēts uz Latvijas pircējiem un veikaliem.',
    howEyebrow: 'KĀ TAS DARBOJAS', howTitle: 'No meklēšanas līdz veikalam — trīs soļi',
    step1: 'Atrodi preci', step1Text: 'Ievadi zīmolu, modeli vai galvenos parametrus.',
    step2: 'Salīdzini piedāvājumus', step2Text: 'Apskati cenu, piegādi un pieejamos veikalus.',
    step3: 'Izvēlies veikalu', step3Text: 'Pārej pa apstiprinātu tracking saiti, kad integrācija ir aktīva.',
    partnerEyebrow: 'VEIKALIEM UN TĪKLIEM', partnerTitle: 'Pieslēgsim katalogu CenaRadar',
    partnerText: 'Esam atvērti integrācijām ar interneta veikaliem, affiliate tīkliem un produktu datu plūsmu nodrošinātājiem. Pēc apstiprinājuma pieslēdzam feed un tracking saites saskaņā ar partnera noteikumiem.',
    partnerButton: 'Pieslēgšanas nosacījumi',
    faqEyebrow: 'FAQ', faqTitle: 'Biežākie jautājumi',
    faq1: 'Vai CenaRadar pārdod preces?', faq1a: 'Nē. CenaRadar salīdzina piedāvājumus un novirza lietotāju uz izvēlēto veikalu.',
    faq2: 'Kāpēc cenas ir atzīmētas kā Demo?', faq2a: 'Kamēr partneru produktu plūsmas tiek pieslēgtas, palaišanas katalogs rāda salīdzināšanas formātu, nevis live cenas.',
    faq3: 'Kā tiks atjaunota cena?', faq3a: 'Pēc veikala pieslēgšanas — no atļauta product feed, XML/CSV/API vai cita saskaņota avota.',
    footer: 'Neatkarīgs preču piedāvājumu salīdzināšanas serviss pircējiem Latvijā.',
    privacy: 'Privātums', disclosure: 'Affiliate disclosure', status: 'BETA',
    favoritesOnly: 'Rādām tikai izlasi', alertsOnly: 'Rādām preces ar paziņojumiem', showAll: 'Rādīt visu',
    detailsPrice: 'Demonstrācijas labākā cena', history: 'Cenas vēsture', historyDemo: 'Demonstrācijas dati', alertOn: 'Paziņojums ieslēgts', alertOff: 'Paziņot par cenas kritumu', storeOffers: 'Veikalu piedāvājumi',
    copied: 'Saite nokopēta.', maxCompare: 'Var salīdzināt ne vairāk kā 3 preces.',
  },
};

const infoPages = {
  ru: {
    about: ['О CenaRadar', 'CenaRadar — независимый сервис сравнения товарных предложений для покупателей в Латвии. Мы строим единый интерфейс для поиска товара по бренду или модели и сравнения цены, доставки и ключевых характеристик.', 'Проект находится на этапе запуска. Интерфейс и поиск уже работают, а live merchant feeds и tracking-ссылки подключаются только после одобрения магазинами и партнёрскими сетями.'],
    how: ['Как работает сравнение', 'Пользователь вводит модель или название товара, после чего CenaRadar показывает совпадающие карточки и предложения. После подключения live feeds данные будут обновляться из разрешённых товарных источников.', 'Сортировка по цене не должна скрыто зависеть от размера affiliate-комиссии. Спонсорские позиции, если появятся, будут обозначаться отдельно.'],
    partners: ['Для магазинов и партнёров', 'CenaRadar открыт к сотрудничеству с интернет-магазинами, affiliate-сетями и поставщиками товарных фидов в Латвии.', 'Поддерживаемая схема интеграции: product feed / XML / CSV / API, affiliate deep links и click tracking. Названия магазинов в launch-каталоге демонстрируют формат сравнения и не означают активную коммерческую интеграцию.'],
    privacy: ['Privacy', 'На текущем этапе CenaRadar не требует регистрации. Избранное, сравнение и уведомления сохраняются локально в браузере пользователя.', 'Если позже будут подключены аналитика, cookies или внешние уведомления, необходимые уведомления и согласия будут добавлены в соответствии с применимыми требованиями.'],
    disclosure: ['Affiliate disclosure', 'Некоторые будущие исходящие ссылки CenaRadar могут быть партнёрскими. При покупке после такого перехода CenaRadar может получить комиссию без увеличения цены для покупателя.', 'Размер комиссии не должен определять обычную сортировку по цене. Спонсорские размещения будут явно маркироваться.'],
  },
  lv: {
    about: ['Par CenaRadar', 'CenaRadar ir neatkarīgs preču piedāvājumu salīdzināšanas serviss pircējiem Latvijā. Veidojam vienotu saskarni preču meklēšanai pēc zīmola vai modeļa un cenas, piegādes un galveno parametru salīdzināšanai.', 'Projekts ir palaišanas posmā. Saskarne un meklēšana jau darbojas, bet live merchant feeds un tracking saites tiek pieslēgtas tikai pēc veikalu un partneru tīklu apstiprinājuma.'],
    how: ['Kā darbojas salīdzināšana', 'Lietotājs ievada modeli vai preces nosaukumu, un CenaRadar rāda atbilstošās preču kartītes un piedāvājumus. Pēc live plūsmu pieslēgšanas dati tiks atjaunoti no atļautiem avotiem.', 'Kārtošanai pēc cenas nav slēpti jābūt atkarīgai no affiliate komisijas. Sponsorētas pozīcijas tiks atzīmētas atsevišķi.'],
    partners: ['Veikaliem un partneriem', 'CenaRadar ir atvērts sadarbībai ar interneta veikaliem, affiliate tīkliem un produktu datu plūsmu nodrošinātājiem Latvijā.', 'Integrācijas shēma: product feed / XML / CSV / API, affiliate deep links un klikšķu uzskaite. Veikalu nosaukumi palaišanas katalogā demonstrē salīdzināšanas formātu un nenozīmē aktīvu komerciālu integrāciju.'],
    privacy: ['Privātums', 'Pašlaik CenaRadar neprasa reģistrāciju. Izlase, salīdzinājumi un paziņojumi tiek glabāti lokāli lietotāja pārlūkprogrammā.', 'Ja vēlāk tiks pieslēgta analītika, sīkdatnes vai ārējie paziņojumi, tiks pievienoti nepieciešamie paziņojumi un piekrišanas.'],
    disclosure: ['Affiliate disclosure', 'Dažas nākotnes izejošās CenaRadar saites var būt affiliate saites. Pēc pirkuma CenaRadar var saņemt komisiju, nepalielinot cenu pircējam.', 'Komisijas lielumam nav jānosaka parastā cenu kārtošana. Sponsorēts saturs tiks skaidri atzīmēts.'],
  },
} satisfies Record<Lang, Record<InfoPage, [string, string, string]>>;

const categoryMeta: Record<Exclude<Category, 'all'>, { icon: typeof Smartphone; tone: string }> = {
  phones: { icon: Smartphone, tone: 'orange' },
  computers: { icon: Laptop, tone: 'blue' },
  audio: { icon: Headphones, tone: 'violet' },
  home: { icon: Tv, tone: 'green' },
};

const readIds = (key: string) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
};

const normalize = (value: string) => value.toLowerCase().replace(/[“”″]/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const matchesQuery = (product: Product, query: string) => {
  const q = normalize(query);
  if (!q) return true;
  const haystack = normalize(`${product.brand} ${product.title} ${product.model} ${product.meta} ${product.aliases.join(' ')} ${product.offers.map(o => o.store).join(' ')}`);
  return q.split(' ').filter(Boolean).every(token => haystack.includes(token));
};

const priceHistory = (product: Product) => {
  const price = Math.min(...product.offers.map(o => o.price));
  return [1.09, 1.07, 1.08, 1.04, 1.02, 1].map((factor, index) => ({
    label: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][index],
    price: Math.round(price * factor),
  }));
};

function PremiumApp() {
  const [lang, setLang] = useState<Lang>(() => navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'lv');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [store, setStore] = useState('all');
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sortAsc, setSortAsc] = useState(true);
  const [favorites, setFavorites] = useState<number[]>(() => readIds('cenaradar:favorites'));
  const [compare, setCompare] = useState<number[]>(() => readIds('cenaradar:compare'));
  const [alerts, setAlerts] = useState<number[]>(() => readIds('cenaradar:alerts'));
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selected, setSelected] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [infoPage, setInfoPage] = useState<InfoPage | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = copy[lang];

  useEffect(() => localStorage.setItem('cenaradar:favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('cenaradar:compare', JSON.stringify(compare)), [compare]);
  useEffect(() => localStorage.setItem('cenaradar:alerts', JSON.stringify(alerts)), [alerts]);

  useEffect(() => {
    const match = location.hash.match(/^#product-(\d+)$/);
    if (match) setSelected(Number(match[1]));
  }, []);

  const stores = useMemo(() => ['all', ...Array.from(new Set(products.flatMap(p => p.offers.map(o => o.store))))], []);

  const visible = useMemo(() => {
    const filtered = products.filter(product => {
      const min = Math.min(...product.offers.map(o => o.price));
      const categoryOk = category === 'all' || product.category === category;
      const storeOk = store === 'all' || product.offers.some(o => o.store === store);
      const viewOk = viewMode === 'all' || (viewMode === 'favorites' && favorites.includes(product.id)) || (viewMode === 'alerts' && alerts.includes(product.id));
      return categoryOk && storeOk && viewOk && min <= maxPrice && matchesQuery(product, query);
    });
    return filtered.sort((a, b) => {
      const ap = Math.min(...a.offers.map(o => o.price));
      const bp = Math.min(...b.offers.map(o => o.price));
      return sortAsc ? ap - bp : bp - ap;
    });
  }, [alerts, category, favorites, maxPrice, query, sortAsc, store, viewMode]);

  const selectedProduct = products.find(p => p.id === selected) ?? null;
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const goCatalog = () => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const chooseCategory = (value: Category) => {
    setCategory(value);
    setViewMode('all');
    window.setTimeout(goCatalog, 30);
  };
  const toggleFavorite = (id: number) => setFavorites(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const toggleAlert = (id: number) => setAlerts(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const toggleCompare = (id: number) => setCompare(v => {
    if (v.includes(id)) return v.filter(x => x !== id);
    if (v.length >= 3) {
      showToast(t.maxCompare);
      return v;
    }
    return [...v, id];
  });
  const openProduct = (id: number) => {
    setSelected(id);
    history.replaceState(null, '', `${location.pathname}${location.search}#product-${id}`);
  };
  const closeProduct = () => {
    setSelected(null);
    history.replaceState(null, '', `${location.pathname}${location.search}#catalog`);
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast(t.copied);
    } catch {
      showToast(location.href);
    }
  };

  const info = infoPage ? infoPages[lang][infoPage] : null;

  return (
    <div className="cr-shell">
      <header className="cr-header">
        <div className="cr-header-inner">
          <a className="cr-brand" href="#top" aria-label="CenaRadar">
            <img src="/favicon.svg" alt="" />
            <span>Cena<span>Radar</span></span>
          </a>
          <nav className="cr-nav" aria-label="Primary">
            <a href="#catalog">{t.navCatalog}</a>
            <a href="#how">{t.navHow}</a>
            <a href="#partners">{t.navPartners}</a>
            <button onClick={() => setInfoPage('about')}>{t.navAbout}</button>
          </nav>
          <div className="cr-header-actions">
            <button className={viewMode === 'favorites' ? 'cr-icon-pill active' : 'cr-icon-pill'} onClick={() => { setViewMode(viewMode === 'favorites' ? 'all' : 'favorites'); goCatalog(); }} aria-label="Favorites">
              <Heart size={16} fill={viewMode === 'favorites' ? 'currentColor' : 'none'} /><span>{favorites.length}</span>
            </button>
            <button className={viewMode === 'alerts' ? 'cr-icon-pill active' : 'cr-icon-pill'} onClick={() => { setViewMode(viewMode === 'alerts' ? 'all' : 'alerts'); goCatalog(); }} aria-label="Alerts">
              <Bell size={16} /><span>{alerts.length}</span>
            </button>
            <div className="cr-lang"><Languages size={14} /><button className={lang === 'lv' ? 'active' : ''} onClick={() => setLang('lv')}>LV</button><button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>RU</button></div>
            <button className="cr-menu" onClick={() => setMobileOpen(v => !v)} aria-label="Menu"><Menu size={21} /></button>
          </div>
        </div>
        {mobileOpen && <div className="cr-mobile-nav"><a href="#catalog" onClick={() => setMobileOpen(false)}>{t.navCatalog}</a><a href="#how" onClick={() => setMobileOpen(false)}>{t.navHow}</a><a href="#partners" onClick={() => setMobileOpen(false)}>{t.navPartners}</a><button onClick={() => { setInfoPage('about'); setMobileOpen(false); }}>{t.navAbout}</button></div>}
      </header>

      <main id="top">
        <section className="cr-hero">
          <div className="cr-hero-grid"></div>
          <div className="cr-orb cr-orb-a"></div><div className="cr-orb cr-orb-b"></div>
          <div className="cr-hero-inner">
            <div className="cr-hero-copy">
              <div className="cr-kicker"><span></span>{t.heroBadge}</div>
              <h1>{t.heroTitle1}<br /><em>{t.heroTitle2}</em></h1>
              <p>{t.heroText}</p>
              <div className="cr-search">
                <Search size={22} />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && goCatalog()} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} />
                <button onClick={goCatalog}>{t.searchButton}<ArrowRight size={17} /></button>
              </div>
              <div className="cr-trust"><span><ShieldCheck size={16} />{t.independent}</span><span><Store size={16} />{t.latvia}</span><span><CheckCircle2 size={16} />{t.noAccount}</span></div>
            </div>
            <div className="cr-hero-panel">
              <div className="cr-radar-card">
                <div className="cr-radar-visual"><div className="cr-ring ring-1"></div><div className="cr-ring ring-2"></div><div className="cr-ring ring-3"></div><div className="cr-sweep"></div><div className="cr-dot dot-a"></div><div className="cr-dot dot-b"></div><Search size={25} /></div>
                <div className="cr-mini-offer"><span>Samsung Galaxy S25 Ultra</span><strong>1 049 €</strong><small>3 {t.offers}</small></div>
                <div className="cr-mini-offer second"><span>Apple iPhone 16 Pro Max</span><strong>1 339,95 €</strong><small>2 {t.offers}</small></div>
                <div className="cr-live-chip"><span></span>{lang === 'ru' ? 'Интеграции готовятся' : 'Integrācijas tiek gatavotas'}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="cr-section cr-category-section">
          <div className="cr-section-head"><div><span className="cr-eyebrow">CENARADAR</span><h2>{t.categoriesTitle}</h2><p>{t.categoriesSub}</p></div></div>
          <div className="cr-category-grid">
            {(['phones','computers','audio','home'] as const).map(item => {
              const Icon = categoryMeta[item].icon;
              return <button key={item} className={`cr-category-card ${categoryMeta[item].tone}`} onClick={() => chooseCategory(item)}><span className="cr-category-icon"><Icon size={27} /></span><span><strong>{t[item]}</strong><small>{products.filter(p => p.category === item).length} {t.offers}</small></span><ArrowRight size={18} /></button>;
            })}
          </div>
        </section>

        <section className="cr-section cr-catalog" id="catalog">
          <div className="cr-section-head split"><div><span className="cr-eyebrow">{t.catalogEyebrow}</span><h2>{t.catalogTitle}</h2></div><div className="cr-beta"><span></span>{t.status}</div></div>
          <div className="cr-notice"><Sparkles size={18} /><span>{t.sampleBanner}</span></div>
          <div className="cr-toolbar">
            <div className="cr-tabs">
              {(['all','phones','computers','audio','home'] as Category[]).map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{t[item]}</button>)}
            </div>
            <button className="cr-sort" onClick={() => setSortAsc(v => !v)}><ArrowDownUp size={16} />{t.sort} {sortAsc ? '↑' : '↓'}</button>
          </div>
          <div className="cr-filters">
            <div className="cr-filter-label"><SlidersHorizontal size={16} />{lang === 'ru' ? 'Фильтры' : 'Filtri'}</div>
            <label><span>{t.store}</span><select value={store} onChange={e => setStore(e.target.value)}>{stores.map(value => <option key={value} value={value}>{value === 'all' ? (lang === 'ru' ? 'Все магазины' : 'Visi veikali') : value}</option>)}</select></label>
            <label className="cr-range"><span>{t.priceTo}<strong>{maxPrice} €</strong></span><input type="range" min="300" max="2000" step="50" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} /></label>
            <button className="cr-reset" onClick={() => { setStore('all'); setMaxPrice(2000); setCategory('all'); setQuery(''); setViewMode('all'); }}>{t.reset}</button>
          </div>
          {viewMode !== 'all' && <div className="cr-view-banner"><span>{viewMode === 'favorites' ? t.favoritesOnly : t.alertsOnly}</span><button onClick={() => setViewMode('all')}><X size={14} />{t.showAll}</button></div>}
          <div className="cr-result-head"><strong>{t.found}: {visible.length}</strong><span>{lang === 'ru' ? 'Launch catalogue · sample data' : 'Palaišanas katalogs · parauga dati'}</span></div>

          <div className="cr-products">
            {visible.map(product => {
              const offers = [...product.offers].sort((a,b) => a.price - b.price);
              const min = offers[0].price;
              return <article className="cr-product" key={product.id}>
                <div className="cr-product-main">
                  <div className="cr-product-image"><span>{product.emoji}</span>{product.imageUrl && <img src={product.imageUrl} alt={product.title} loading="lazy" onError={e => e.currentTarget.style.display = 'none'} />}</div>
                  <div className="cr-product-copy"><div className="cr-product-topline"><span>{product.brand} · {product.model}</span><b>{t.demo}</b></div><h3>{product.title}</h3><p>{product.meta}</p><div className="cr-price-line"><span>{t.from}</span><strong>{min.toFixed(2)} €</strong><small>{product.offers.length} {t.offers}</small></div>
                    <div className="cr-product-actions"><button className={favorites.includes(product.id) ? 'active' : ''} onClick={() => toggleFavorite(product.id)}><Heart size={14} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />{t.favorite}</button><button className={compare.includes(product.id) ? 'active' : ''} onClick={() => toggleCompare(product.id)}><GitCompare size={14} />{t.compare}</button><button onClick={() => openProduct(product.id)}><TrendingDown size={14} />{t.details}</button></div>
                  </div>
                </div>
                <div className="cr-offers">
                  {offers.map((offer, index) => <div className={index === 0 ? 'cr-offer best' : 'cr-offer'} key={`${product.id}-${offer.store}`}><div><strong>{offer.store}</strong><small>{t.source}: {offer.source}</small></div><div className="cr-offer-delivery"><small>{t.delivery}</small><span>{offer.delivery}</span></div><div className="cr-offer-price">{index === 0 && <small>{t.best}</small>}<strong>{offer.price.toFixed(2)} €</strong></div><button onClick={() => showToast(t.disabledLink)}>{t.toStore}<ExternalLink size={14} /></button></div>)}
                </div>
              </article>;
            })}
            {visible.length === 0 && <div className="cr-empty"><ScanSearch size={34} /><h3>{t.empty}</h3><p>{t.emptySub}</p><button onClick={() => { setQuery(''); setStore('all'); setCategory('all'); setMaxPrice(2000); setViewMode('all'); }}>{t.reset}</button></div>}
          </div>
        </section>

        <section className="cr-section cr-why">
          <div className="cr-section-head"><div><span className="cr-eyebrow">{t.whyEyebrow}</span><h2>{t.whyTitle}</h2></div></div>
          <div className="cr-feature-grid">
            <article><span className="cr-feature-icon"><BadgeEuro size={24} /></span><h3>{t.why1Title}</h3><p>{t.why1Text}</p></article>
            <article><span className="cr-feature-icon"><Database size={24} /></span><h3>{t.why2Title}</h3><p>{t.why2Text}</p></article>
            <article><span className="cr-feature-icon"><Layers3 size={24} /></span><h3>{t.why3Title}</h3><p>{t.why3Text}</p></article>
          </div>
        </section>

        <section className="cr-section cr-how" id="how">
          <div className="cr-section-head"><div><span className="cr-eyebrow">{t.howEyebrow}</span><h2>{t.howTitle}</h2></div></div>
          <div className="cr-steps"><article><b>01</b><span><Search size={23} /></span><h3>{t.step1}</h3><p>{t.step1Text}</p></article><article><b>02</b><span><GitCompare size={23} /></span><h3>{t.step2}</h3><p>{t.step2Text}</p></article><article><b>03</b><span><ShoppingBag size={23} /></span><h3>{t.step3}</h3><p>{t.step3Text}</p></article></div>
        </section>

        <section className="cr-section cr-partner" id="partners">
          <div className="cr-partner-art"><div className="cr-partner-grid"></div><div className="cr-partner-radar"><Link2 size={34} /></div></div>
          <div className="cr-partner-copy"><span className="cr-eyebrow light">{t.partnerEyebrow}</span><h2>{t.partnerTitle}</h2><p>{t.partnerText}</p><div className="cr-partner-pills"><span><Check size={14} />XML / CSV</span><span><Check size={14} />API</span><span><Check size={14} />Product feed</span><span><Check size={14} />Deep links</span></div><button onClick={() => setInfoPage('partners')}>{t.partnerButton}<ArrowRight size={17} /></button></div>
        </section>

        <section className="cr-section cr-faq">
          <div className="cr-section-head"><div><span className="cr-eyebrow">{t.faqEyebrow}</span><h2>{t.faqTitle}</h2></div></div>
          <div className="cr-faq-list"><details><summary>{t.faq1}<ChevronDown size={18} /></summary><p>{t.faq1a}</p></details><details><summary>{t.faq2}<ChevronDown size={18} /></summary><p>{t.faq2a}</p></details><details><summary>{t.faq3}<ChevronDown size={18} /></summary><p>{t.faq3a}</p></details></div>
        </section>
      </main>

      <footer className="cr-footer">
        <div className="cr-footer-brand"><a className="cr-brand" href="#top"><img src="/favicon.svg" alt="" /><span>Cena<span>Radar</span></span></a><p>{t.footer}</p></div>
        <div className="cr-footer-links"><button onClick={() => setInfoPage('about')}>{t.navAbout}</button><button onClick={() => setInfoPage('how')}>{t.navHow}</button><button onClick={() => setInfoPage('partners')}>{t.navPartners}</button><button onClick={() => setInfoPage('privacy')}>{t.privacy}</button><button onClick={() => setInfoPage('disclosure')}>{t.disclosure}</button></div>
        <div className="cr-footer-meta"><span>cenaradar.online</span><span>© 2026 CenaRadar</span></div>
      </footer>

      {compare.length > 0 && <div className="cr-compare-dock"><div><GitCompare size={18} /><strong>{t.compare}</strong><span>{compare.length}/3</span></div><div className="cr-compare-items">{products.filter(p => compare.includes(p.id)).map(p => <button key={p.id} onClick={() => openProduct(p.id)}>{p.emoji}<span>{p.title}</span><b>{Math.min(...p.offers.map(o => o.price)).toFixed(0)} €</b></button>)}</div><button className="cr-clear" onClick={() => setCompare([])}><X size={16} /></button></div>}

      {selectedProduct && <div className="cr-modal-backdrop" onClick={closeProduct}><section className="cr-modal" onClick={e => e.stopPropagation()}><button className="cr-modal-close" onClick={closeProduct}><X size={20} /></button><div className="cr-modal-head"><div className="cr-modal-image"><span>{selectedProduct.emoji}</span>{selectedProduct.imageUrl && <img src={selectedProduct.imageUrl} alt={selectedProduct.title} onError={e => e.currentTarget.style.display='none'} />}</div><div><span className="cr-model">{selectedProduct.brand} · {selectedProduct.model}</span><h2>{selectedProduct.title}</h2><p>{selectedProduct.meta}</p><div className="cr-modal-price"><small>{t.detailsPrice}</small><strong>{Math.min(...selectedProduct.offers.map(o => o.price)).toFixed(2)} €</strong></div><button className="cr-copy-link" onClick={copyLink}><Link2 size={14} />{lang === 'ru' ? 'Скопировать ссылку' : 'Kopēt saiti'}</button></div></div><div className="cr-modal-grid"><div className="cr-history"><div className="cr-modal-section-title"><TrendingDown size={18} /><span><strong>{t.history}</strong><small>{t.historyDemo}</small></span></div><div className="cr-bars">{(() => { const points = priceHistory(selectedProduct); const min = Math.min(...points.map(p => p.price)); const max = Math.max(...points.map(p => p.price)); return points.map(point => <div key={point.label}><span>{point.price}€</span><i style={{height: `${38 + ((point.price-min)/Math.max(1,max-min))*62}%`}}></i><small>{point.label}</small></div>); })()}</div><button className={alerts.includes(selectedProduct.id) ? 'cr-alert active' : 'cr-alert'} onClick={() => toggleAlert(selectedProduct.id)}><Bell size={16} />{alerts.includes(selectedProduct.id) ? t.alertOn : t.alertOff}</button></div><div className="cr-modal-offers"><div className="cr-modal-section-title"><Store size={18} /><span><strong>{t.storeOffers}</strong><small>{selectedProduct.offers.length} {t.offers}</small></span></div>{[...selectedProduct.offers].sort((a,b)=>a.price-b.price).map((o,i)=><div className="cr-modal-offer" key={o.store}><span><strong>{o.store}</strong><small>{t.delivery}: {o.delivery}</small></span><b>{o.price.toFixed(2)} €</b><button onClick={() => showToast(t.disabledLink)}>{t.toStore}<ExternalLink size={13} /></button>{i===0&&<em>{t.best}</em>}</div>)}</div></div></section></div>}

      {info && <div className="cr-modal-backdrop" onClick={() => setInfoPage(null)}><section className="cr-info-modal" onClick={e => e.stopPropagation()}><button className="cr-modal-close" onClick={() => setInfoPage(null)}><X size={20} /></button><img src="/favicon.svg" alt="" /><span className="cr-eyebrow">CENARADAR</span><h2>{info[0]}</h2><p>{info[1]}</p><p>{info[2]}</p><div className="cr-info-note"><Clock3 size={16} />{lang === 'ru' ? 'Статус: beta. Live merchant feeds подключаются после одобрения партнёром.' : 'Statuss: beta. Live merchant feeds tiek pieslēgtas pēc partnera apstiprinājuma.'}</div></section></div>}
      {toast && <div className="cr-toast"><Zap size={16} />{toast}</div>}
    </div>
  );
}

export default PremiumApp;
