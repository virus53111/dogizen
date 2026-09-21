import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Bell,
  CheckCircle2,
  ExternalLink,
  GitCompare,
  Heart,
  Search,
  ShieldCheck,
  ShoppingBag,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Store,
  TrendingDown,
  X,
} from 'lucide-react';

type Lang = 'ru' | 'lv';
type Category = 'all' | 'phones' | 'computers' | 'audio' | 'home';
type InfoPage = 'about' | 'how' | 'partners' | 'privacy' | 'disclosure';
type Offer = {
  store: string;
  price: number;
  delivery: string;
  affiliateNetwork: string;
};
type Product = {
  id: number;
  title: string;
  model: string;
  brand?: string;
  aliases?: string[];
  imageUrl?: string;
  category: Exclude<Category, 'all'>;
  emoji: string;
  meta: string;
  offers: Offer[];
};

const products: Product[] = [
  {
    id: 1,
    title: 'Samsung Galaxy S25 Ultra 256GB',
    model: 'SM-S938B',
    brand: 'Samsung',
    aliases: ['s25 ultra', 'galaxy s25 ultra', 'самсунг s25 ultra', 'samsung s 25 ultra'],
    imageUrl: 'https://files.tecnoblog.net/wp-content/uploads/2025/01/galaxy-s25-ultra-titanio-prata-700x700.png',
    category: 'phones',
    emoji: '📱',
    meta: '256 GB · Titanium Black · 5G',
    offers: [
      {
        store: '220.lv',
        price: 1049,
        delivery: '0–3 €',
        affiliateNetwork: 'Tradedoubler',
      },
      {
        store: 'Dateks.lv',
        price: 1069,
        delivery: '2.99 €',
        affiliateNetwork: 'Direct',
      },
      {
        store: 'Samsung.lv',
        price: 1099,
        delivery: 'Bezmaksas',
        affiliateNetwork: 'Awin',
      },
    ],
  },
  {
    id: 2,
    title: 'Apple MacBook Air 13 M4 16/256GB',
    model: 'MW0W3',
    brand: 'Apple',
    aliases: ['macbook air m4', 'macbook m4', 'макбук air m4'],
    imageUrl: 'https://www.mobileciti.com.au/media/catalog/product/a/p/apple-macbook-air-13-inch-with-m4-chip-512gb-16gb-sky-blue-3.jpg?image-type=image&store=mobileciti',
    category: 'computers',
    emoji: '💻',
    meta: '13.6″ · 16 GB · 256 GB SSD',
    offers: [
      {
        store: '220.lv',
        price: 1129,
        delivery: '0–3 €',
        affiliateNetwork: 'Tradedoubler',
      },
      {
        store: 'Dateks.lv',
        price: 1149,
        delivery: '2.99 €',
        affiliateNetwork: 'Direct',
      },
    ],
  },
  {
    id: 3,
    title: 'Sony WH-1000XM6',
    model: 'WH1000XM6B',
    brand: 'Sony',
    aliases: ['xm6', 'sony xm6', 'wh1000xm6'],
    imageUrl: 'https://pulsepad.com.ua/files/resized/products/sony-wh-1000xm6-midnight-blue.1800x1800w.jpg',
    category: 'audio',
    emoji: '🎧',
    meta: 'ANC · Bluetooth · Black',
    offers: [
      {
        store: '220.lv',
        price: 419,
        delivery: '0–3 €',
        affiliateNetwork: 'Tradedoubler',
      },
      {
        store: 'Dateks.lv',
        price: 429,
        delivery: '2.99 €',
        affiliateNetwork: 'Direct',
      },
    ],
  },
  {
    id: 4,
    title: 'Samsung OLED 55″ S95F',
    model: 'QE55S95F',
    brand: 'Samsung',
    aliases: ['s95f', 'samsung oled s95f', 'oled 55'],
    imageUrl: 'https://img-prd-pim.poorvika.com/product/Samsung-oled-4k-ultra-hd-smart-tv-s95f-55-inch-Front-Right-View.webp',
    category: 'home',
    emoji: '📺',
    meta: '55″ · OLED · 4K · Smart TV',
    offers: [
      {
        store: 'Samsung.lv',
        price: 1599,
        delivery: 'Bezmaksas',
        affiliateNetwork: 'Awin',
      },
      {
        store: '220.lv',
        price: 1649,
        delivery: '0–15 €',
        affiliateNetwork: 'Tradedoubler',
      },
    ],
  },
  {
    id: 5,
    title: 'Lenovo Legion 5 16IRX9',
    model: '83DG00A5PB',
    brand: 'Lenovo',
    aliases: ['legion 5', 'lenovo legion', '16irx9'],
    imageUrl: 'https://goldentech.com.sa/media/catalog/product/cache/3b63c6023d7836f7abeed5960b50eab1/l/a/laptop_lenovo_legion_5_16irx9_gaming_intel_core_i9-14900hx_rtx_4060_83dg00fhad_1.jpg',
    category: 'computers',
    emoji: '🖥️',
    meta: '16″ · i7 · RTX 4060 · 16/1000 GB',
    offers: [
      {
        store: 'Dateks.lv',
        price: 1299,
        delivery: '2.99 €',
        affiliateNetwork: 'Direct',
      },
      {
        store: '220.lv',
        price: 1339,
        delivery: '0–3 €',
        affiliateNetwork: 'Tradedoubler',
      },
    ],
  },
  {
    id: 6,
    title: 'Apple iPhone 16 Pro Max 256GB',
    model: 'MYWV3HX/A',
    brand: 'Apple',
    aliases: ['16 pro max', 'iphone16promax', 'iphone 16 pro max', 'айфон 16 про макс', 'apple 16 pro max'],
    imageUrl: 'https://cdn.movertix.com/media/catalog/product/i/p/iphone-16-pro-max-white-titanium-1tb_1.jpg',
    category: 'phones',
    emoji: '📱',
    meta: '256 GB · 6.9″ OLED · A18 Pro · Titanium',
    offers: [
      {
        store: '220.lv',
        price: 1339.95,
        delivery: 'Demo',
        affiliateNetwork: 'Tradedoubler',
      },
      {
        store: 'Dateks.lv',
        price: 1376.27,
        delivery: 'Demo',
        affiliateNetwork: 'Direct',
      },
    ],
  },
];

const text = {
  ru: {
    tagline: 'Сравнение цен в Латвии',
    heroTitle: 'Найди товар. Сравни цены. Купи дешевле.',
    heroText:
      'CenaRadar LV помогает находить товары и сравнивать предложения магазинов в одном месте. Сервис находится на этапе подключения партнёрских товарных фидов.',
    search: 'Например: Samsung S25 Ultra 256GB',
    searchButton: 'Найти',
    all: 'Все',
    phones: 'Телефоны',
    computers: 'Компьютеры',
    audio: 'Аудио',
    home: 'Техника',
    sort: 'Сортировка по цене',
    found: 'Найдено товаров',
    from: 'от',
    offers: 'предложения',
    best: 'Лучшая цена',
    delivery: 'Доставка',
    go: 'В магазин',
    affiliate: 'Партнёрка',
    demo: 'Launch-каталог: предложения и цены сейчас являются примерными до подключения live product feeds.',
    empty: 'По такому запросу товаров пока нет.',
    footer: 'CenaRadar LV · сервис сравнения цен для покупателей в Латвии',
    clickNotice: 'Здесь будет твоя партнёрская ссылка. Пока переход отключён.',
  },
  lv: {
    tagline: 'Cenu salīdzināšana Latvijā',
    heroTitle: 'Atrodi preci. Salīdzini cenas. Pērc izdevīgāk.',
    heroText:
      'CenaRadar LV palīdz atrast preces un salīdzināt veikalu piedāvājumus vienuviet. Pašlaik tiek pieslēgtas partneru produktu datu plūsmas.',
    search: 'Piemēram: Samsung S25 Ultra 256GB',
    searchButton: 'Meklēt',
    all: 'Visi',
    phones: 'Telefoni',
    computers: 'Datori',
    audio: 'Audio',
    home: 'Tehnika',
    sort: 'Kārtot pēc cenas',
    found: 'Atrastas preces',
    from: 'no',
    offers: 'piedāvājumi',
    best: 'Labākā cena',
    delivery: 'Piegāde',
    go: 'Uz veikalu',
    affiliate: 'Partneris',
    demo: 'Palaišanas katalogs: piedāvājumi un cenas pašlaik ir parauga dati līdz live produktu plūsmu pieslēgšanai.',
    empty: 'Šim meklējumam preču pagaidām nav.',
    footer: 'CenaRadar LV · cenu salīdzināšanas serviss pircējiem Latvijā',
    clickNotice: 'Šeit būs tava partnera saite. Pagaidām pāreja ir atslēgta.',
  },
};
const categories: Category[] = ['all', 'phones', 'computers', 'audio', 'home'];

const infoPages = {
  ru: {
    about: {
      title: 'О CenaRadar LV',
      paragraphs: [
        'CenaRadar LV — независимый сервис сравнения товарных предложений для покупателей в Латвии. Цель сервиса — собрать предложения разных магазинов в одном интерфейсе и помочь пользователю сравнить цену, доставку и основные характеристики.',
        'Сейчас проект находится на этапе запуска: интерфейс и поиск уже работают, а партнёрские product feeds и tracking-ссылки подключаются по мере одобрения магазинами и affiliate-сетями.',
      ],
      bullets: ['Фокус на латвийском рынке', 'Поиск по бренду, модели и характеристикам', 'Сравнение предложений без скрытого предпочтения по размеру комиссии'],
    },
    how: {
      title: 'Как работает сравнение',
      paragraphs: [
        'Пользователь вводит название или модель товара. CenaRadar сопоставляет запрос с карточкой товара и показывает предложения подключённых магазинов.',
        'После запуска live feeds цены, наличие, доставка и время обновления будут поступать из разрешённых товарных фидов, XML/CSV/API или других согласованных источников магазинов.',
      ],
      bullets: ['Поиск → карточка товара → предложения магазинов', 'Сортировка по цене и фильтры', 'Переход в магазин по отслеживаемой ссылке, если магазин подключён к партнёрской программе'],
    },
    partners: {
      title: 'Для магазинов и партнёров',
      paragraphs: [
        'CenaRadar LV открыт к сотрудничеству с интернет-магазинами, affiliate-сетями и поставщиками товарных фидов в Латвии.',
        'Названия магазинов в launch-каталоге используются для демонстрации будущего формата сравнения и не означают, что коммерческая интеграция уже активна. После одобрения партнёрства мы подключаем разрешённый feed и tracking-ссылки.',
      ],
      bullets: ['Product feed / XML / CSV / API', 'Affiliate deep links и click tracking', 'Прозрачная маркировка рекламных и спонсорских размещений'],
    },
    privacy: {
      title: 'Privacy',
      paragraphs: [
        'На текущем этапе CenaRadar LV не требует регистрации пользователя. Избранное, сравнение и ценовые уведомления сохраняются локально в браузере пользователя.',
        'Мы не продаём персональные данные. Если в дальнейшем будут подключены аналитика, cookies или уведомления, необходимые уведомления и согласия будут добавлены в соответствии с применимыми требованиями.',
      ],
      bullets: ['Нет обязательного аккаунта', 'Локальное хранение пользовательских настроек', 'Минимизация собираемых данных'],
    },
    disclosure: {
      title: 'Affiliate disclosure',
      paragraphs: [
        'Некоторые исходящие ссылки CenaRadar LV могут быть партнёрскими. Если пользователь перейдёт в магазин и совершит покупку, CenaRadar может получить комиссию без увеличения цены для покупателя.',
        'Размер партнёрской комиссии не должен определять обычную сортировку по цене. Платные или спонсорские размещения, если они появятся, будут обозначаться отдельно.',
      ],
      bullets: ['Комиссия возможна после покупки у партнёра', 'Цена для пользователя не повышается из-за affiliate-ссылки', 'Спонсорские позиции должны быть явно отмечены'],
    },
  },
  lv: {
    about: {
      title: 'Par CenaRadar LV',
      paragraphs: [
        'CenaRadar LV ir neatkarīgs preču piedāvājumu salīdzināšanas serviss pircējiem Latvijā. Mērķis ir apvienot dažādu veikalu piedāvājumus vienā saskarnē un palīdzēt salīdzināt cenu, piegādi un galvenos parametrus.',
        'Projekts pašlaik ir palaišanas posmā: meklēšana un saskarne jau darbojas, bet partneru produktu plūsmas un tracking saites tiek pieslēgtas pēc veikalu un affiliate tīklu apstiprinājuma.',
      ],
      bullets: ['Fokuss uz Latvijas tirgu', 'Meklēšana pēc zīmola, modeļa un parametriem', 'Salīdzināšana bez slēptas priekšrocības pēc komisijas lieluma'],
    },
    how: {
      title: 'Kā darbojas salīdzināšana',
      paragraphs: [
        'Lietotājs ievada preces nosaukumu vai modeli. CenaRadar sasaista vaicājumu ar preces kartīti un parāda pieslēgto veikalu piedāvājumus.',
        'Pēc live plūsmu pieslēgšanas cenas, pieejamība, piegāde un atjaunošanas laiks tiks saņemti no atļautām produktu plūsmām, XML/CSV/API vai citiem saskaņotiem avotiem.',
      ],
      bullets: ['Meklēšana → preces kartīte → veikalu piedāvājumi', 'Kārtošana pēc cenas un filtri', 'Pāreja uz veikalu ar tracking saiti, ja veikals ir partnerprogrammā'],
    },
    partners: {
      title: 'Veikaliem un partneriem',
      paragraphs: [
        'CenaRadar LV ir atvērts sadarbībai ar interneta veikaliem, affiliate tīkliem un produktu datu plūsmu nodrošinātājiem Latvijā.',
        'Veikalu nosaukumi palaišanas katalogā demonstrē paredzēto salīdzināšanas formātu un nenozīmē, ka komerciālā integrācija jau ir aktīva. Pēc apstiprinājuma tiek pieslēgta atļauta datu plūsma un tracking saites.',
      ],
      bullets: ['Product feed / XML / CSV / API', 'Affiliate deep links un klikšķu uzskaite', 'Skaidrs sponsorēta satura marķējums'],
    },
    privacy: {
      title: 'Privātums',
      paragraphs: [
        'Pašlaik CenaRadar LV neprasa lietotāja reģistrāciju. Izlase, salīdzinājumi un cenu paziņojumi tiek saglabāti lokāli lietotāja pārlūkprogrammā.',
        'Mēs nepārdodam personas datus. Ja vēlāk tiks pieslēgta analītika, sīkdatnes vai paziņojumi, tiks pievienoti nepieciešamie paziņojumi un piekrišanas atbilstoši piemērojamām prasībām.',
      ],
      bullets: ['Nav obligāta konta', 'Lietotāja iestatījumi glabājas lokāli', 'Datu minimizācija'],
    },
    disclosure: {
      title: 'Affiliate disclosure',
      paragraphs: [
        'Dažas CenaRadar LV izejošās saites var būt affiliate saites. Ja lietotājs pāriet uz veikalu un veic pirkumu, CenaRadar var saņemt komisiju, nepalielinot cenu pircējam.',
        'Affiliate komisijas lielums nedrīkst noteikt parasto cenu kārtošanu. Sponsorēti izvietojumi, ja tādi būs, tiks skaidri atzīmēti.',
      ],
      bullets: ['Komisija iespējama pēc pirkuma pie partnera', 'Affiliate saite nepalielina pircēja cenu', 'Sponsorētas pozīcijas tiek skaidri marķētas'],
    },
  },
} satisfies Record<Lang, Record<InfoPage, { title: string; paragraphs: string[]; bullets: string[] }>>;

const readStoredIds = (key: string) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as number[]) : [];
  } catch {
    return [];
  }
};

const readProductFromHash = () => {
  const match = window.location.hash.match(/^#product-(\d+)$/);
  return match ? Number(match[1]) : null;
};

const stores = ['all', ...Array.from(new Set(products.flatMap(product => product.offers.map(offer => offer.store))))];

const buildPriceHistory = (product: Product) => {
  const current = Math.min(...product.offers.map(offer => offer.price));
  const factors = [1.09, 1.07, 1.08, 1.04, 1.02, 1];
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  return factors.map((factor, index) => ({
    label: months[index],
    price: Math.round(current * factor),
  }));
};

const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .replace(/[“”″]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const productMatchesQuery = (product: Product, query: string) => {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  const haystack = normalizeSearch(
    `${product.brand ?? ''} ${product.title} ${product.model} ${product.meta} ${(product.aliases ?? []).join(' ')} ${product.offers.map(offer => offer.store).join(' ')}`
  );
  return normalizedQuery.split(' ').filter(Boolean).every(token => haystack.includes(token));
};

function App() {
  const [lang, setLang] = useState<Lang>('ru');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [sortAsc, setSortAsc] = useState(true);
  const [toast, setToast] = useState('');
  const [favorites, setFavorites] = useState<number[]>(() => readStoredIds('cenaradar:favorites'));
  const [compareIds, setCompareIds] = useState<number[]>(() => readStoredIds('cenaradar:compare'));
  const [alertIds, setAlertIds] = useState<number[]>(() => readStoredIds('cenaradar:alerts'));
  const [storeFilter, setStoreFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState(2000);
  const [viewMode, setViewMode] = useState<'all' | 'favorites' | 'alerts'>('all');
  const [infoPage, setInfoPage] = useState<InfoPage | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(() => readProductFromHash());
  const t = text[lang];
  const activeInfo = infoPage ? infoPages[lang][infoPage] : null;

  useEffect(() => {
    window.localStorage.setItem('cenaradar:favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    window.localStorage.setItem('cenaradar:compare', JSON.stringify(compareIds));
  }, [compareIds]);

  useEffect(() => {
    window.localStorage.setItem('cenaradar:alerts', JSON.stringify(alertIds));
  }, [alertIds]);

  useEffect(() => {
    const onHashChange = () => setSelectedId(readProductFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const matchesCategory =
        category === 'all' || product.category === category;
      const matchesStore =
        storeFilter === 'all' || product.offers.some(offer => offer.store === storeFilter);
      const minPrice = Math.min(...product.offers.map(offer => offer.price));
      const matchesView =
        viewMode === 'all' ||
        (viewMode === 'favorites' && favorites.includes(product.id)) ||
        (viewMode === 'alerts' && alertIds.includes(product.id));
      const matchesQuery = productMatchesQuery(product, query);
      return matchesCategory && matchesStore && matchesView && minPrice <= maxPrice && matchesQuery;
    });
    return [...filtered].sort((a, b) => {
      const aMin = Math.min(...a.offers.map(offer => offer.price));
      const bMin = Math.min(...b.offers.map(offer => offer.price));
      return sortAsc ? aMin - bMin : bMin - aMin;
    });
  }, [alertIds, category, favorites, maxPrice, query, sortAsc, storeFilter, viewMode]);
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  const handleOfferClick = () => showToast(t.clickNotice);

  const toggleFavorite = (id: number) => {
    setFavorites(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    );
  };

  const toggleCompare = (id: number) => {
    setCompareIds(current => {
      if (current.includes(id)) {
        return current.filter(item => item !== id);
      }
      if (current.length >= 3) {
        showToast(lang === 'ru' ? 'Можно сравнить максимум 3 товара.' : 'Var salīdzināt ne vairāk kā 3 preces.');
        return current;
      }
      return [...current, id];
    });
  };

  const compareProducts = products.filter(product => compareIds.includes(product.id));
  const selectedProduct = products.find(product => product.id === selectedId) ?? null;
  const selectedHistory = selectedProduct ? buildPriceHistory(selectedProduct) : [];
  const historyMax = selectedHistory.length ? Math.max(...selectedHistory.map(point => point.price)) : 0;
  const historyMin = selectedHistory.length ? Math.min(...selectedHistory.map(point => point.price)) : 0;

  const openProduct = (id: number) => {
    setSelectedId(id);
    window.location.hash = `product-${id}`;
  };

  const closeProduct = () => {
    setSelectedId(null);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#top`);
  };

  const toggleAlert = (id: number) => {
    setAlertIds(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    );
  };

  const copyProductLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(lang === 'ru' ? 'Ссылка на товар скопирована.' : 'Preces saite nokopēta.');
    } catch {
      showToast(window.location.href);
    }
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CenaRadar LV">
          <span className="brand-mark">
            <Search size={19} />
          </span>
          <span>
            CenaRadar <strong>LV</strong>
          </span>
        </a>
        <nav className="top-nav" aria-label="Primary navigation">
          <button onClick={() => setInfoPage('about')}>{lang === 'ru' ? 'О проекте' : 'Par projektu'}</button>
          <button onClick={() => setInfoPage('how')}>{lang === 'ru' ? 'Как работает' : 'Kā tas darbojas'}</button>
          <button onClick={() => setInfoPage('partners')}>{lang === 'ru' ? 'Для партнёров' : 'Partneriem'}</button>
        </nav>
        <div className="top-actions">
          <button
            className={viewMode === 'favorites' ? 'mini-chip chip-button active' : 'mini-chip chip-button'}
            aria-label="Favorites count"
            onClick={() => setViewMode(current => current === 'favorites' ? 'all' : 'favorites')}
          >
            <Heart size={14} /> {favorites.length}
          </button>
          <button
            className={viewMode === 'alerts' ? 'mini-chip chip-button active' : 'mini-chip chip-button'}
            aria-label="Price alerts count"
            onClick={() => setViewMode(current => current === 'alerts' ? 'all' : 'alerts')}
          >
            <Bell size={14} /> {alertIds.length}
          </button>
          <span className="mini-chip" aria-label="Comparison count">
            <GitCompare size={14} /> {compareIds.length}/3
          </span>
          <span className="status-chip">
            <CheckCircle2 size={15} /> BETA
          </span>
          <div className="lang-switch">
            <button
              className={lang === 'lv' ? 'active' : ''}
              onClick={() => setLang('lv')}
            >
              LV
            </button>
            <button
              className={lang === 'ru' ? 'active' : ''}
              onClick={() => setLang('ru')}
            >
              RU
            </button>
          </div>
        </div>
      </header>
      <main id="top">
        <section className="hero">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-content">
            <div className="eyebrow">
              <Sparkles size={16} /> {t.tagline}
            </div>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroText}</p>
            <div className="search-box">
              <Search size={22} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={t.search}
                aria-label={t.search}
              />
              <button>{t.searchButton}</button>
            </div>
            <div className="trust-row">
              <span>
                <ShieldCheck size={16} /> {lang === 'ru' ? 'Независимое сравнение' : 'Neatkarīga salīdzināšana'}
              </span>
              <span>
                <Store size={16} /> {lang === 'ru' ? 'Фокус на магазинах Латвии' : 'Fokuss uz Latvijas veikaliem'}
              </span>
              <span>
                <ShoppingBag size={16} /> {lang === 'ru' ? 'Готов к product feeds' : 'Gatavs produktu plūsmām'}
              </span>
            </div>
          </div>
        </section>
        <section className="catalog-section">
          <div className="demo-banner">
            <span className="demo-dot" />
            {t.demo}
          </div>
          <div className="toolbar">
            <div className="category-list">
              {categories.map(item => (
                <button
                  key={item}
                  className={category === item ? 'category active' : 'category'}
                  onClick={() => setCategory(item)}
                >
                  {t[item]}
                </button>
              ))}
            </div>
            <button
              className="sort-button"
              onClick={() => setSortAsc(value => !value)}
            >
              <ArrowDownUp size={16} /> {t.sort} {sortAsc ? '↑' : '↓'}
            </button>
          </div>
          <div className="filter-panel">
            <div className="filter-title">
              <SlidersHorizontal size={16} />
              {lang === 'ru' ? 'Фильтры' : 'Filtri'}
            </div>
            <label>
              <span>{lang === 'ru' ? 'Магазин' : 'Veikals'}</span>
              <select value={storeFilter} onChange={event => setStoreFilter(event.target.value)}>
                {stores.map(store => (
                  <option value={store} key={store}>
                    {store === 'all' ? (lang === 'ru' ? 'Все магазины' : 'Visi veikali') : store}
                  </option>
                ))}
              </select>
            </label>
            <label className="price-filter">
              <span>{lang === 'ru' ? 'Цена до' : 'Cena līdz'} <strong>{maxPrice} €</strong></span>
              <input
                type="range"
                min="300"
                max="2000"
                step="50"
                value={maxPrice}
                onChange={event => setMaxPrice(Number(event.target.value))}
              />
            </label>
            <button
              className="reset-filters"
              onClick={() => {
                setStoreFilter('all');
                setMaxPrice(2000);
              }}
            >
              {lang === 'ru' ? 'Сбросить' : 'Notīrīt'}
            </button>
          </div>
          {viewMode !== 'all' && (
            <div className="quick-view-banner">
              <span>
                {viewMode === 'favorites'
                  ? (lang === 'ru' ? 'Показываем только избранное' : 'Rādām tikai izlasi')
                  : (lang === 'ru' ? 'Показываем товары с уведомлениями' : 'Rādām preces ar paziņojumiem')}
              </span>
              <button onClick={() => setViewMode('all')}>
                <X size={14} /> {lang === 'ru' ? 'Показать всё' : 'Rādīt visu'}
              </button>
            </div>
          )}
          <div className="results-head">
            <div>
              <span className="results-kicker">CenaRadar</span>
              <h2>
                {t.found}: {visibleProducts.length}
              </h2>
            </div>
            <div className="results-note">Beta · launch catalogue · sample prices</div>
          </div>
          <div className="product-list">
            {visibleProducts.map(product => {
              const sortedOffers = [...product.offers].sort(
                (a, b) => a.price - b.price
              );
              const minPrice = sortedOffers[0].price;
              return (
                <article className="product-card" key={product.id}>
                  <div className="product-summary">
                    <div className="product-visual">
                      <span className="image-fallback">{product.emoji}</span>
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          loading="lazy"
                          onError={event => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="product-info">
                      <span className="model">{product.brand ? `${product.brand} · ` : ''}{product.model}</span>
                      <h3>{product.title}</h3>
                      <p>{product.meta}</p>
                      <div className="product-stats">
                        <span>
                          {t.from} <strong>{minPrice.toFixed(2)} €</strong>
                        </span>
                        <span>
                          {product.offers.length} {t.offers}
                        </span>
                      </div>
                      <div className="product-actions">
                        <button
                          className={favorites.includes(product.id) ? 'utility-button active' : 'utility-button'}
                          onClick={() => toggleFavorite(product.id)}
                          aria-label={`${lang === 'ru' ? 'Избранное' : 'Izlase'} ${product.title}`}
                        >
                          <Heart size={14} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                          {lang === 'ru' ? 'Избранное' : 'Izlase'}
                        </button>
                        <button
                          className={compareIds.includes(product.id) ? 'utility-button active' : 'utility-button'}
                          onClick={() => toggleCompare(product.id)}
                          aria-label={`${lang === 'ru' ? 'Сравнить' : 'Salīdzināt'} ${product.title}`}
                        >
                          <GitCompare size={14} />
                          {lang === 'ru' ? 'Сравнить' : 'Salīdzināt'}
                        </button>
                        <button
                          className="utility-button"
                          onClick={() => openProduct(product.id)}
                        >
                          <TrendingDown size={14} />
                          {lang === 'ru' ? 'Подробнее' : 'Vairāk'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="offers-panel">
                    {sortedOffers.map((offer, index) => (
                      <div
                        className={index === 0 ? 'offer best-offer' : 'offer'}
                        key={`${product.id}-${offer.store}`}
                      >
                        <div className="store-cell">
                          <strong>{offer.store}</strong>
                          <span>
                            {t.affiliate}: {offer.affiliateNetwork}
                          </span>
                        </div>
                        <div className="delivery-cell">
                          <span>{t.delivery}</span>
                          <strong>{offer.delivery}</strong>
                        </div>
                        <div className="price-cell">
                          {index === 0 && (
                            <span className="best-badge">{t.best}</span>
                          )}
                          <strong>{offer.price.toFixed(2)} €</strong>
                        </div>
                        <button
                          className="shop-button"
                          onClick={handleOfferClick}
                        >
                          {t.go} <ExternalLink size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
            {visibleProducts.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <Search size={27} />
                </div>
                <h3>{t.empty}</h3>
                <button
                  onClick={() => {
                    setQuery('');
                    setCategory('all');
                  }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      {selectedProduct && (
        <div className="detail-overlay" role="presentation" onClick={closeProduct}>
          <section className="detail-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <button className="detail-close" onClick={closeProduct} aria-label="Close product details">
              <X size={20} />
            </button>
            <div className="detail-hero">
              <div className="detail-visual">
                <span className="image-fallback">{selectedProduct.emoji}</span>
                {selectedProduct.imageUrl && (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.title}
                    onError={event => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <div>
                <span className="model">{selectedProduct.brand ? `${selectedProduct.brand} · ` : ''}{selectedProduct.model}</span>
                <h2>{selectedProduct.title}</h2>
                <p>{selectedProduct.meta}</p>
                <div className="detail-price">
                  {lang === 'ru' ? 'Лучшая цена сейчас' : 'Labākā cena tagad'}
                  <strong>{Math.min(...selectedProduct.offers.map(offer => offer.price)).toFixed(2)} €</strong>
                </div>
                <button className="share-button" onClick={copyProductLink}>
                  <Share2 size={15} /> {lang === 'ru' ? 'Скопировать ссылку' : 'Kopēt saiti'}
                </button>
              </div>
            </div>
            <div className="detail-grid">
              <div className="history-card">
                <div className="detail-section-title">
                  <TrendingDown size={17} />
                  <div>
                    <strong>{lang === 'ru' ? 'История цены' : 'Cenas vēsture'}</strong>
                    <small>{lang === 'ru' ? 'Демонстрационные данные' : 'Demonstrācijas dati'}</small>
                  </div>
                </div>
                <div className="history-chart">
                  {selectedHistory.map(point => {
                    const range = Math.max(historyMax - historyMin, 1);
                    const height = 42 + ((point.price - historyMin) / range) * 58;
                    return (
                      <div className="history-column" key={point.label}>
                        <span>{point.price} €</span>
                        <div className="history-bar-wrap">
                          <div className="history-bar" style={{ height: `${height}%` }} />
                        </div>
                        <small>{point.label}</small>
                      </div>
                    );
                  })}
                </div>
                <button
                  className={alertIds.includes(selectedProduct.id) ? 'alert-button active' : 'alert-button'}
                  onClick={() => toggleAlert(selectedProduct.id)}
                >
                  <Bell size={16} />
                  {alertIds.includes(selectedProduct.id)
                    ? (lang === 'ru' ? 'Уведомление включено' : 'Paziņojums ieslēgts')
                    : (lang === 'ru' ? 'Сообщить о снижении цены' : 'Paziņot par cenas kritumu')}
                </button>
              </div>
              <div className="detail-offers">
                <div className="detail-section-title">
                  <Store size={17} />
                  <div>
                    <strong>{lang === 'ru' ? 'Предложения магазинов' : 'Veikalu piedāvājumi'}</strong>
                    <small>{selectedProduct.offers.length} {t.offers}</small>
                  </div>
                </div>
                {[...selectedProduct.offers].sort((a, b) => a.price - b.price).map((offer, index) => (
                  <div className="detail-offer" key={`detail-${offer.store}`}>
                    <div>
                      <strong>{offer.store}</strong>
                      <small>{t.delivery}: {offer.delivery}</small>
                    </div>
                    <b>{offer.price.toFixed(2)} €</b>
                    <button onClick={handleOfferClick}>
                      {t.go} <ExternalLink size={14} />
                    </button>
                    {index === 0 && <span className="detail-best">{t.best}</span>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
      {activeInfo && (
        <div className="detail-overlay" role="presentation" onClick={() => setInfoPage(null)}>
          <section className="info-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <button className="detail-close" onClick={() => setInfoPage(null)} aria-label="Close information">
              <X size={20} />
            </button>
            <span className="info-kicker">CenaRadar LV</span>
            <h2>{activeInfo.title}</h2>
            <div className="info-copy">
              {activeInfo.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <ul className="info-bullets">
              {activeInfo.bullets.map(item => <li key={item}>{item}</li>)}
            </ul>
            <div className="info-note">
              {lang === 'ru'
                ? 'Статус: beta. Live merchant feeds подключаются только после одобрения и в соответствии с условиями партнёров.'
                : 'Statuss: beta. Live veikalu plūsmas tiek pieslēgtas tikai pēc apstiprinājuma un saskaņā ar partneru noteikumiem.'}
            </div>
          </section>
        </div>
      )}
      {compareProducts.length > 0 && (
        <section className="compare-tray" aria-label="Product comparison">
          <div className="compare-head">
            <div>
              <span>{lang === 'ru' ? 'Сравнение' : 'Salīdzināšana'}</span>
              <strong>{compareProducts.length}/3</strong>
            </div>
            <button onClick={() => setCompareIds([])}>
              {lang === 'ru' ? 'Очистить' : 'Notīrīt'}
            </button>
          </div>
          <div className="compare-grid">
            {compareProducts.map(product => {
              const price = Math.min(...product.offers.map(offer => offer.price));
              return (
                <div className="compare-item" key={`compare-${product.id}`}>
                  <span className="compare-emoji">{product.emoji}</span>
                  <div>
                    <strong>{product.title}</strong>
                    <small>{product.model}</small>
                  </div>
                  <b>{price.toFixed(2)} €</b>
                  <button onClick={() => toggleCompare(product.id)} aria-label={`Remove ${product.title}`}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <footer>
        <div className="footer-brand">
          CenaRadar <strong>LV</strong>
        </div>
        <div className="footer-center">
          <p>{t.footer}</p>
          <div className="footer-links">
            <button onClick={() => setInfoPage('about')}>{lang === 'ru' ? 'О проекте' : 'Par projektu'}</button>
            <button onClick={() => setInfoPage('how')}>{lang === 'ru' ? 'Как работает' : 'Kā tas darbojas'}</button>
            <button onClick={() => setInfoPage('partners')}>{lang === 'ru' ? 'Партнёрам' : 'Partneriem'}</button>
            <button onClick={() => setInfoPage('privacy')}>Privacy</button>
            <button onClick={() => setInfoPage('disclosure')}>Affiliate disclosure</button>
          </div>
        </div>
        <span>© 2026</span>
      </footer>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
