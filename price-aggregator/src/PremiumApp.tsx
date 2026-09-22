import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  Camera,
  Car,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Gamepad2,
  Headphones,
  Home,
  Languages,
  Laptop,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Store,
  Tv,
  X,
  Zap,
} from 'lucide-react';

type Lang = 'ru' | 'lv';
type SortMode = 'relevance' | 'priceAsc' | 'priceDesc' | 'name';

type LiveProduct = {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  image?: string;
  url?: string;
  merchantUrl?: string;
  merchant?: string;
  delivery?: string;
  brand?: string;
  inStock?: string;
  priceSource?: string;
  lastUpdated?: string | null;
  category?: string;
};

type FeedResponse = {
  products?: LiveProduct[];
  meta?: {
    live?: boolean;
    stale?: boolean;
    fetchedAt?: string | null;
    source?: string;
    productCount?: number;
    sources?: Array<{ name: string; ok: boolean; count: number }>;
  };
};

const CATALOG_API_URL = import.meta.env.VITE_FEED_API_URL || 'https://cenaradar-feed-api.onrender.com/api/products';
const SEARCH_API_URL = CATALOG_API_URL.replace(/\/api\/(?:products|ottocast)(?:\?.*)?$/, '/api/search');

const popularQueries = [
  'iPhone 16 Pro Max', 'Samsung S25 Ultra', 'MacBook Air M4', 'AirPods', 'PlayStation 5',
  'RTX 5070', 'Sony WH-1000XM6', 'Robot vacuum', 'Apple Watch', 'Nintendo Switch',
  'CarPlay adapter', 'Smart TV', 'Gaming laptop', 'Dyson', 'Xiaomi', 'SSD 1TB',
  'JBL', 'Garmin', 'GoPro', 'Coffee machine', 'Powerbank', 'Monitor 27', 'Tablet', 'Smart home',
];

const storeDirectory = [
  { name: 'Ottocast', active: true },
  { name: '220.lv', active: false },
  { name: 'Dateks.lv', active: false },
  { name: '1a.lv', active: false },
  { name: 'RD Electronics', active: false },
  { name: 'Euronics.lv', active: false },
  { name: 'Ksenukai.lv', active: false },
  { name: 'Samsung', active: false },
];

const categoryCards = [
  { key: 'phones', icon: Smartphone },
  { key: 'computers', icon: Laptop },
  { key: 'audio', icon: Headphones },
  { key: 'tv', icon: Tv },
  { key: 'home', icon: Home },
  { key: 'gaming', icon: Gamepad2 },
  { key: 'photo', icon: Camera },
  { key: 'auto', icon: Car },
] as const;

const copy = {
  ru: {
    navCatalog: 'Каталог', navStores: 'Магазины', navForStores: 'Магазинам', navAbout: 'О проекте',
    heroEyebrow: 'СРАВНЕНИЕ ЦЕН В ЛАТВИИ',
    heroTitle: 'Найди товар и сравни цены',
    heroText: 'Ищи по названию, бренду или модели. CenaRadar собирает данные подключённых магазинов и ведёт прямо на страницу продавца.',
    searchPlaceholder: 'Например: iPhone 16 Pro Max, S25 Ultra, CarPlay...',
    searchButton: 'Найти',
    popular: 'Популярные запросы',
    categories: 'Категории',
    phones: 'Смартфоны', computers: 'Компьютеры', audio: 'Аудио', tv: 'Телевизоры', home: 'Для дома', gaming: 'Игры', photo: 'Фото и видео', auto: 'Автоэлектроника',
    liveCatalog: 'Товары и цены',
    liveCatalogSub: 'Показываем только данные из источников, которые удалось проверить. Новые магазины подключаются через их официальные товарные фиды.',
    updated: 'Обновлено', live: 'данные обновляются',
    results: 'Найдено', products: 'товаров',
    sort: 'Сортировка', relevance: 'По релевантности', priceAsc: 'Сначала дешевле', priceDesc: 'Сначала дороже', name: 'По названию',
    filters: 'Фильтры', inStock: 'В наличии', reset: 'Сбросить',
    merchant: 'Магазин', currentPrice: 'Цена сейчас', toStore: 'В магазин', delivery: 'Доставка',
    noResults: 'По этому запросу ничего не найдено', noResultsText: 'Попробуй другое название, модель или бренд.',
    showMore: 'Показать ещё',
    sourceNote: 'Ottocast уже подключён. Для 220.lv, Dateks.lv и других магазинов подготовлены коннекторы; полные каталоги включим после получения разрешённого XML/CSV/API feed.',
    storesTitle: 'Магазины', storesSub: 'Подключённые и подготовленные источники каталога.', activeStore: 'Источник подключён', waitingStore: 'Готов к подключению feed',
    forStoresEyebrow: 'ДЛЯ ИНТЕРНЕТ-МАГАЗИНОВ', forStoresTitle: 'Добавьте товары в CenaRadar',
    forStoresText: 'Подключаем каталоги через XML, CSV или API. Нужны название товара, ссылка, цена, изображение, категория и наличие. Данные магазина остаются первичным источником цены.',
    feed1: 'XML / CSV / API', feed2: 'Автоматическое обновление', feed3: 'Прямая ссылка на магазин',
    aboutTitle: 'Что такое CenaRadar', aboutText: 'CenaRadar — поисковик и сервис сравнения товарных предложений для покупателей в Латвии. Мы не продаём товары: пользователь выбирает предложение и переходит в интернет-магазин.',
    trust1: 'Цены из источника магазина', trust2: 'Без обязательной регистрации', trust3: 'Латвия в центре поиска',
    footer: 'Поиск товаров и сравнение цен в интернет-магазинах.',
    menu: 'Меню', close: 'Закрыть', searching: 'Ищем товары...',
  },
  lv: {
    navCatalog: 'Katalogs', navStores: 'Veikali', navForStores: 'Veikaliem', navAbout: 'Par projektu',
    heroEyebrow: 'CENU SALĪDZINĀŠANA LATVIJĀ',
    heroTitle: 'Atrodi preci un salīdzini cenas',
    heroText: 'Meklē pēc nosaukuma, zīmola vai modeļa. CenaRadar apkopo pieslēgto veikalu datus un aizved tieši uz pārdevēja lapu.',
    searchPlaceholder: 'Piemēram: iPhone 16 Pro Max, S25 Ultra, CarPlay...',
    searchButton: 'Meklēt',
    popular: 'Populāri meklējumi',
    categories: 'Kategorijas',
    phones: 'Viedtālruņi', computers: 'Datori', audio: 'Audio', tv: 'Televizori', home: 'Mājai', gaming: 'Spēles', photo: 'Foto un video', auto: 'Auto elektronika',
    liveCatalog: 'Preces un cenas',
    liveCatalogSub: 'Rādām tikai datus no pārbaudītiem avotiem. Jauni veikali tiek pieslēgti ar to oficiālajām produktu plūsmām.',
    updated: 'Atjaunināts', live: 'dati tiek atjaunināti',
    results: 'Atrasts', products: 'preces',
    sort: 'Kārtošana', relevance: 'Pēc atbilstības', priceAsc: 'Lētākie vispirms', priceDesc: 'Dārgākie vispirms', name: 'Pēc nosaukuma',
    filters: 'Filtri', inStock: 'Pieejams', reset: 'Notīrīt',
    merchant: 'Veikals', currentPrice: 'Cena tagad', toStore: 'Uz veikalu', delivery: 'Piegāde',
    noResults: 'Nekas netika atrasts', noResultsText: 'Pamēģini citu nosaukumu, modeli vai zīmolu.',
    showMore: 'Rādīt vēl',
    sourceNote: 'Ottocast jau ir pieslēgts. 220.lv, Dateks.lv un citiem veikaliem savienotāji ir sagatavoti; pilnus katalogus ieslēgsim pēc atļauta XML/CSV/API feed saņemšanas.',
    storesTitle: 'Veikali', storesSub: 'Pieslēgtie un integrācijai sagatavotie kataloga avoti.', activeStore: 'Avots pieslēgts', waitingStore: 'Gatavs feed pieslēgšanai',
    forStoresEyebrow: 'INTERNETA VEIKALIEM', forStoresTitle: 'Pievienojiet preces CenaRadar',
    forStoresText: 'Pieslēdzam katalogus ar XML, CSV vai API. Nepieciešams preces nosaukums, saite, cena, attēls, kategorija un pieejamība. Veikala dati paliek primārais cenas avots.',
    feed1: 'XML / CSV / API', feed2: 'Automātiska atjaunošana', feed3: 'Tieša saite uz veikalu',
    aboutTitle: 'Kas ir CenaRadar', aboutText: 'CenaRadar ir preču meklētājs un piedāvājumu salīdzināšanas serviss pircējiem Latvijā. Mēs nepārdodam preces: lietotājs izvēlas piedāvājumu un pāriet uz interneta veikalu.',
    trust1: 'Cenas no veikala avota', trust2: 'Bez obligātas reģistrācijas', trust3: 'Latvija meklēšanas centrā',
    footer: 'Preču meklēšana un cenu salīdzināšana interneta veikalos.',
    menu: 'Izvēlne', close: 'Aizvērt', searching: 'Meklējam preces...',
  },
} satisfies Record<Lang, Record<string, string>>;

function normalise(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function directMerchantUrl(product: LiveProduct) {
  if (product.merchantUrl) return product.merchantUrl;
  if (!product.url) return '';
  try {
    const url = new URL(product.url);
    const destination = url.searchParams.get('ued');
    return destination ? decodeURIComponent(destination) : product.url;
  } catch {
    return product.url;
  }
}

function money(value: number, currency = 'EUR', lang: Lang) {
  try {
    return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'lv-LV', {
      style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function PremiumApp() {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('cenaradar:lang');
    if (saved === 'ru' || saved === 'lv') return saved;
    return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'lv';
  });
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('relevance');
  const [onlyStock, setOnlyStock] = useState(false);
  const [limit, setLimit] = useState(30);
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = copy[lang];

  useEffect(() => {
    localStorage.setItem('cenaradar:lang', lang);
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;
    let interval: number | undefined;

    const load = async (retry = true) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), submittedQuery ? 25000 : 35000);
      setLoading(true);
      try {
        const endpoint = submittedQuery
          ? `${SEARCH_API_URL}?q=${encodeURIComponent(submittedQuery)}`
          : CATALOG_API_URL;
        const response = await fetch(endpoint, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as FeedResponse;
        if (!cancelled) {
          setProducts(payload.products || []);
          setLive(Boolean(payload.meta?.live && !payload.meta?.stale));
          setUpdatedAt(payload.meta?.fetchedAt || null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setLive(false);
          if (retry) retryTimer = window.setTimeout(() => void load(false), 7000);
        }
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void load();
    if (!submittedQuery) interval = window.setInterval(() => void load(false), 10 * 60 * 1000);
    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [submittedQuery]);

  const visibleProducts = useMemo(() => {
    const localQuery = submittedQuery ? '' : normalise(query);
    let next = products.filter(product => {
      if (onlyStock && product.inStock === '0') return false;
      if (!localQuery) return true;
      const haystack = normalise(`${product.name} ${product.brand || ''} ${product.sku || ''} ${product.description || ''} ${product.category || ''} ${product.merchant || ''}`);
      return localQuery.split(' ').filter(Boolean).every(token => haystack.includes(token));
    });

    if (sort === 'priceAsc') next = [...next].sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') next = [...next].sort((a, b) => b.price - a.price);
    if (sort === 'name') next = [...next].sort((a, b) => a.name.localeCompare(b.name));
    return next;
  }, [onlyStock, products, query, sort, submittedQuery]);

  const submitSearch = (value = query) => {
    const next = value.trim();
    setQuery(value);
    setSubmittedQuery(next);
    setLimit(30);
    window.setTimeout(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 20);
  };

  const resetSearch = () => {
    setQuery('');
    setSubmittedQuery('');
    setOnlyStock(false);
    setSort('relevance');
    setLimit(30);
  };

  const formattedUpdate = useMemo(() => {
    if (!updatedAt) return null;
    const parsed = new Date(updatedAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'lv-LV', { dateStyle: 'short', timeStyle: 'short' }).format(parsed);
  }, [lang, updatedAt]);

  return (
    <div className="cr-shell">
      <header className="cr-header">
        <div className="cr-header-inner">
          <a className="cr-brand" href="#top" aria-label="CenaRadar">
            <img src="/favicon.svg" alt="" />
            <span>Cena<span>Radar</span></span>
          </a>
          <div className="cr-header-search">
            <Search size={18} />
            <input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === 'Enter' && submitSearch()} placeholder={t.searchPlaceholder} />
            <button onClick={() => submitSearch()}>{t.searchButton}</button>
          </div>
          <nav className="cr-nav" aria-label="Primary navigation">
            <a href="#catalog">{t.navCatalog}</a>
            <a href="#stores">{t.navStores}</a>
            <a href="#for-stores">{t.navForStores}</a>
            <a href="#about">{t.navAbout}</a>
          </nav>
          <div className="cr-header-actions">
            <div className="cr-lang"><Languages size={14} /><button className={lang === 'lv' ? 'active' : ''} onClick={() => setLang('lv')}>LV</button><button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>RU</button></div>
            <button className="cr-menu" aria-label={t.menu} onClick={() => setMobileOpen(value => !value)}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
        {mobileOpen && (
          <div className="cr-mobile-nav">
            <a href="#catalog" onClick={() => setMobileOpen(false)}>{t.navCatalog}</a>
            <a href="#stores" onClick={() => setMobileOpen(false)}>{t.navStores}</a>
            <a href="#for-stores" onClick={() => setMobileOpen(false)}>{t.navForStores}</a>
            <a href="#about" onClick={() => setMobileOpen(false)}>{t.navAbout}</a>
          </div>
        )}
      </header>

      <main id="top">
        <section className="cr-search-hero">
          <div className="cr-search-hero-inner">
            <span className="cr-eyebrow">{t.heroEyebrow}</span>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroText}</p>
            <div className="cr-main-search">
              <Search size={24} />
              <input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === 'Enter' && submitSearch()} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} />
              <button onClick={() => submitSearch()}>{t.searchButton}<ArrowRight size={18} /></button>
            </div>
            <div className="cr-trust-row">
              <span><ShieldCheck size={16} />{t.trust1}</span>
              <span><CheckCircle2 size={16} />{t.trust2}</span>
              <span><Store size={16} />{t.trust3}</span>
            </div>
          </div>
        </section>

        <section className="cr-section cr-popular">
          <div className="cr-section-title"><h2>{t.popular}</h2></div>
          <div className="cr-query-cloud">
            {popularQueries.map(item => <button key={item} onClick={() => submitSearch(item)}>{item}</button>)}
          </div>
        </section>

        <section className="cr-section">
          <div className="cr-section-title"><h2>{t.categories}</h2></div>
          <div className="cr-category-grid">
            {categoryCards.map(({ key, icon: Icon }) => (
              <button className="cr-category-card" key={key} onClick={() => { setQuery(t[key]); setSubmittedQuery(''); document.querySelector<HTMLInputElement>('.cr-main-search input')?.focus(); }}>
                <span><Icon size={24} /></span><strong>{t[key]}</strong><ArrowRight size={16} />
              </button>
            ))}
          </div>
        </section>

        <section className="cr-section cr-catalog" id="catalog">
          <div className="cr-catalog-head">
            <div>
              <span className="cr-eyebrow">CENARADAR</span>
              <h2>{t.liveCatalog}</h2>
              <p>{t.liveCatalogSub}</p>
            </div>
            <div className={live ? 'cr-live-status active' : 'cr-live-status'}>
              <span></span>{loading && submittedQuery ? t.searching : t.live}{formattedUpdate && <small>{t.updated}: {formattedUpdate}</small>}
            </div>
          </div>

          <div className="cr-source-note"><Database size={18} /><span>{t.sourceNote}</span></div>

          <div className="cr-catalog-tools">
            <div className="cr-result-count"><strong>{t.results}: {visibleProducts.length}</strong><span>{t.products}</span></div>
            <div className="cr-filter-row">
              <label className="cr-stock-filter"><input type="checkbox" checked={onlyStock} onChange={event => setOnlyStock(event.target.checked)} />{t.inStock}</label>
              <label className="cr-sort-select"><SlidersHorizontal size={15} /><select value={sort} onChange={event => setSort(event.target.value as SortMode)}><option value="relevance">{t.relevance}</option><option value="priceAsc">{t.priceAsc}</option><option value="priceDesc">{t.priceDesc}</option><option value="name">{t.name}</option></select><ArrowDownUp size={14} /></label>
              {(query || submittedQuery || onlyStock || sort !== 'relevance') && <button className="cr-reset" onClick={resetSearch}>{t.reset}</button>}
            </div>
          </div>

          {loading ? (
            <div className="cr-loading"><span></span><span></span><span></span></div>
          ) : visibleProducts.length === 0 ? (
            <div className="cr-empty"><Search size={34} /><h3>{t.noResults}</h3><p>{t.noResultsText}</p><button onClick={resetSearch}>{t.reset}</button></div>
          ) : (
            <>
              <div className="cr-product-list">
                {visibleProducts.slice(0, limit).map(product => {
                  const directUrl = directMerchantUrl(product);
                  const merchant = product.merchant || 'Ottocast';
                  return (
                    <article className="cr-product-row" key={`${merchant}-${product.id}`}>
                      <div className="cr-product-thumb">
                        {product.image ? <img src={product.image} alt={product.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <ShoppingBag size={28} />}
                      </div>
                      <div className="cr-product-copy">
                        <div className="cr-product-meta"><span>{merchant}</span>{product.sku && <small>SKU {product.sku}</small>}</div>
                        <h3>{product.name}</h3>
                        {product.description && <p>{product.description}</p>}
                        <div className="cr-mobile-price">
                          <span>{t.currentPrice}</span><strong>{money(product.price, product.currency || 'EUR', lang)}</strong>
                          {product.compareAtPrice && product.compareAtPrice > product.price ? <del>{money(product.compareAtPrice, product.currency || 'EUR', lang)}</del> : null}
                        </div>
                      </div>
                      <div className="cr-product-store">
                        <span>{t.merchant}</span><strong>{merchant}</strong>
                        <small><Clock3 size={13} />{product.delivery || t.delivery}</small>
                      </div>
                      <div className="cr-product-price">
                        <span>{t.currentPrice}</span>
                        <strong>{money(product.price, product.currency || 'EUR', lang)}</strong>
                        {product.compareAtPrice && product.compareAtPrice > product.price ? <del>{money(product.compareAtPrice, product.currency || 'EUR', lang)}</del> : null}
                      </div>
                      {directUrl ? <a className="cr-shop-button" href={directUrl} target="_blank" rel="noopener noreferrer">{t.toStore}<ExternalLink size={15} /></a> : <span className="cr-shop-button disabled">{t.toStore}</span>}
                    </article>
                  );
                })}
              </div>
              {limit < visibleProducts.length && <button className="cr-show-more" onClick={() => setLimit(value => value + 30)}>{t.showMore}<ArrowRight size={16} /></button>}
            </>
          )}
        </section>

        <section className="cr-section" id="stores">
          <div className="cr-section-title split"><div><span className="cr-eyebrow">LATVIA</span><h2>{t.storesTitle}</h2><p>{t.storesSub}</p></div></div>
          <div className="cr-store-grid">
            {storeDirectory.map(store => <article className={store.active ? 'cr-store-card active' : 'cr-store-card'} key={store.name}><span className="cr-store-logo">{store.name.slice(0, 2).toUpperCase()}</span><div><strong>{store.name}</strong><small>{store.active ? t.activeStore : t.waitingStore}</small></div>{store.active ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}</article>)}
          </div>
        </section>

        <section className="cr-section cr-for-stores" id="for-stores">
          <div className="cr-for-stores-copy">
            <span className="cr-eyebrow light">{t.forStoresEyebrow}</span>
            <h2>{t.forStoresTitle}</h2>
            <p>{t.forStoresText}</p>
            <div className="cr-feed-pills"><span><Database size={15} />{t.feed1}</span><span><Zap size={15} />{t.feed2}</span><span><ExternalLink size={15} />{t.feed3}</span></div>
          </div>
          <div className="cr-feed-example">
            <code>&lt;product&gt;</code>
            <code>&nbsp;&nbsp;&lt;name&gt;Apple iPhone...&lt;/name&gt;</code>
            <code>&nbsp;&nbsp;&lt;link&gt;https://shop.lv/...&lt;/link&gt;</code>
            <code>&nbsp;&nbsp;&lt;price&gt;999.00&lt;/price&gt;</code>
            <code>&nbsp;&nbsp;&lt;image&gt;https://...&lt;/image&gt;</code>
            <code>&lt;/product&gt;</code>
          </div>
        </section>

        <section className="cr-section cr-about" id="about">
          <div><span className="cr-eyebrow">CENARADAR</span><h2>{t.aboutTitle}</h2><p>{t.aboutText}</p></div>
          <div className="cr-about-stats"><span><strong>{products.length}</strong><small>{t.products}</small></span><span><strong>{storeDirectory.filter(store => store.active).length}</strong><small>{t.activeStore}</small></span><span><strong>LV / RU</strong><small>Interface</small></span></div>
        </section>
      </main>

      <footer className="cr-footer">
        <div><a className="cr-brand" href="#top"><img src="/favicon.svg" alt="" /><span>Cena<span>Radar</span></span></a><p>{t.footer}</p></div>
        <div className="cr-footer-links"><a href="#catalog">{t.navCatalog}</a><a href="#stores">{t.navStores}</a><a href="#for-stores">{t.navForStores}</a><a href="#about">{t.navAbout}</a></div>
        <span>© 2026 CenaRadar · cenaradar.online</span>
      </footer>
    </div>
  );
}

export default PremiumApp;
