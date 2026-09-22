import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  Camera,
  Car,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Fish,
  Gamepad2,
  Headphones,
  Home,
  Languages,
  Laptop,
  Menu,
  PawPrint,
  Pill,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Sofa,
  Store,
  Tv,
  X,
} from 'lucide-react';

type Lang = 'ru' | 'lv';
type SortMode = 'relevance' | 'priceAsc' | 'priceDesc' | 'name';

type LiveProduct = {
  id: string;
  name: string;
  sku?: string;
  model?: string;
  mpn?: string;
  ean?: string;
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

type ConnectedStore = {
  name: string;
  count: number;
  mode?: string;
};

type FeedResponse = {
  products?: LiveProduct[];
  meta?: {
    live?: boolean;
    stale?: boolean;
    fetchedAt?: string | null;
    productCount?: number;
    storeCount?: number;
    stores?: ConnectedStore[];
  };
};

type MerchantDirectoryItem = {
  name: string;
  home: string;
  search?: (query: string) => string;
};

const CATALOG_API_URL = import.meta.env.VITE_FEED_API_URL || 'https://cenaradar-feed-api.onrender.com/api/products';
const SEARCH_API_URL = CATALOG_API_URL.replace(/\/api\/(?:products|ottocast)(?:\?.*)?$/, '/api/search');
const CATALOG_CACHE_KEY = 'cenaradar:catalog-preview:v1';
const FALLBACK_CONNECTED_STORES: ConnectedStore[] = [
  { name: 'EG Tools', count: 2875, mode: 'last-known' },
  { name: 'Vilders.lv', count: 2036, mode: 'last-known' },
  { name: 'Valenas.lv', count: 732, mode: 'last-known' },
  { name: 'Ottocast', count: 96, mode: 'last-known' },
];

function readCatalogCache(): FeedResponse | null {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FeedResponse;
    return parsed && Array.isArray(parsed.products) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCatalogCache(payload: FeedResponse) {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({
      products: (payload.products || []).slice(0, 160),
      meta: {
        ...payload.meta,
        stores: payload.meta?.stores || [],
      },
    }));
  } catch {
    // Storage can be disabled or full; live loading still works normally.
  }
}

const merchants: MerchantDirectoryItem[] = [
  { name: '220.lv', home: 'https://220.lv/', search: q => `https://220.lv/lv/search?q=${encodeURIComponent(q)}` },
  { name: '1a.lv', home: 'https://www.1a.lv/' },
  { name: 'Dateks.lv', home: 'https://www.dateks.lv/', search: q => `https://www.dateks.lv/en/meklet?q=${encodeURIComponent(q)}` },
  { name: 'RD Electronics', home: 'https://www.rdveikals.lv/' },
  { name: 'Euronics.lv', home: 'https://www.euronics.lv/' },
  { name: 'Ksenukai.lv', home: 'https://www.ksenukai.lv/' },
  { name: 'Tet', home: 'https://www.tet.lv/veikals/', search: q => `https://www.tet.lv/veikals/search?query=${encodeURIComponent(q)}` },
  { name: 'M79.lv', home: 'https://m79.lv/' },
  { name: 'AiO.lv', home: 'https://aio.lv/' },
  { name: 'iStore.lv', home: 'https://istore.lv/' },
  { name: 'BENU.lv', home: 'https://www.benu.lv/' },
  { name: 'Euroaptieka.lv', home: 'https://www.euroaptieka.lv/' },
  { name: 'Apotheka.lv', home: 'https://www.apotheka.lv/' },
  { name: 'Salmo.lv', home: 'https://www.salmo.lv/' },
  { name: 'IKEA', home: 'https://www.ikea.com/lv/lv/' },
  { name: 'JYSK', home: 'https://www.jysk.lv/' },
  { name: 'Mebeles1.lv', home: 'https://www.mebeles1.lv/' },
  { name: 'PetCity.lv', home: 'https://www.petcity.lv/' },
  { name: 'Valenas.lv', home: 'https://valenas.lv/' },
  { name: 'Vilders.lv', home: 'https://vilders.lv/' },
  { name: 'EG Tools', home: 'https://egtools.lv/' },
  { name: 'Ottocast', home: 'https://www.ottocast.com/', search: q => `https://www.ottocast.com/search?q=${encodeURIComponent(q)}` },
];

const popularQueries = [
  'iPhone', 'Samsung Galaxy', 'MacBook', 'AirPods', 'PlayStation 5', 'RTX 5070',
  'Sony WH-1000XM6', 'Robot vacuum', 'Apple Watch', 'Nintendo Switch', 'CarPlay',
  'Smart TV', 'Gaming laptop', 'Dyson', 'Xiaomi', 'SSD 1TB', 'JBL', 'Garmin',
  'vitamīni', 'makšķere', 'dīvāns', 'suņu barība',
];

const categoryCards = [
  { key: 'phones', icon: Smartphone, query: 'iPhone Samsung Xiaomi' },
  { key: 'computers', icon: Laptop, query: 'laptop' },
  { key: 'audio', icon: Headphones, query: 'headphones' },
  { key: 'tv', icon: Tv, query: 'TV' },
  { key: 'home', icon: Home, query: 'robot vacuum' },
  { key: 'gaming', icon: Gamepad2, query: 'PlayStation' },
  { key: 'photo', icon: Camera, query: 'camera' },
  { key: 'auto', icon: Car, query: 'CarPlay' },
  { key: 'pharmacy', icon: Pill, query: 'vitamīni' },
  { key: 'fishing', icon: Fish, query: 'makšķere' },
  { key: 'furniture', icon: Sofa, query: 'dīvāns' },
  { key: 'pets', icon: PawPrint, query: 'suņu barība' },
] as const;

const copy = {
  ru: {
    navCatalog: 'Каталог', navStores: 'Магазины',
    heroEyebrow: 'СРАВНЕНИЕ ЦЕН В ЛАТВИИ', heroTitle: 'Ищи товар. Сравнивай цены.',
    heroText: 'Один поиск по подключённым каталогам магазинов. Где прямого каталога ещё нет — можно сразу открыть этот магазин и продолжить поиск там.',
    searchPlaceholder: 'Например: iPhone 17 Pro, витамины, диван, удочка...', searchButton: 'Найти',
    popular: 'Популярное', categories: 'Категории',
    phones: 'Смартфоны', computers: 'Компьютеры', audio: 'Аудио', tv: 'Телевизоры', home: 'Для дома', gaming: 'Игры', photo: 'Фото и видео', auto: 'Автоэлектроника',
    pharmacy: 'Аптеки и здоровье', fishing: 'Рыбалка', furniture: 'Мебель', pets: 'Зоотовары',
    catalogTitle: 'Товары и цены', catalogSub: 'Реальные позиции из подключённых источников магазинов.',
    results: 'Найдено', products: 'товаров', updated: 'Обновлено', live: 'Каталог обновляется',
    inStock: 'В наличии', relevance: 'По релевантности', priceAsc: 'Сначала дешевле', priceDesc: 'Сначала дороже', name: 'По названию', reset: 'Сбросить',
    currentPrice: 'Цена', merchant: 'Магазин', toStore: 'В магазин', delivery: 'Уточнить в магазине', showMore: 'Показать ещё',
    noResults: 'В подключённых каталогах ничего не найдено', noResultsText: 'Можно сразу проверить этот запрос в других магазинах ниже.',
    checkStores: 'Проверить в других магазинах', checkStoresSub: 'Прямые ссылки на магазины. Для части магазинов запрос сразу передаётся в их поиск.',
    storesTitle: 'Магазины', storesSub: 'Зелёная отметка означает, что товары этого магазина уже входят в общую выдачу CenaRadar.',
    inCatalog: 'товаров в каталоге', openStore: 'Открыть магазин',
    footer: 'CenaRadar — поиск товаров и сравнение цен в интернет-магазинах Латвии.', menu: 'Меню',
  },
  lv: {
    navCatalog: 'Katalogs', navStores: 'Veikali',
    heroEyebrow: 'CENU SALĪDZINĀŠANA LATVIJĀ', heroTitle: 'Meklē preci. Salīdzini cenas.',
    heroText: 'Viena meklēšana pieslēgto veikalu katalogos. Ja tiešais katalogs vēl nav pieejams, vari uzreiz atvērt veikalu un turpināt meklēšanu tur.',
    searchPlaceholder: 'Piemēram: iPhone 17 Pro, vitamīni, dīvāns, makšķere...', searchButton: 'Meklēt',
    popular: 'Populāri', categories: 'Kategorijas',
    phones: 'Viedtālruņi', computers: 'Datori', audio: 'Audio', tv: 'Televizori', home: 'Mājai', gaming: 'Spēles', photo: 'Foto un video', auto: 'Auto elektronika',
    pharmacy: 'Aptiekas un veselība', fishing: 'Makšķerēšana', furniture: 'Mēbeles', pets: 'Mājdzīvniekiem',
    catalogTitle: 'Preces un cenas', catalogSub: 'Reālas preces no pieslēgtajiem veikalu datu avotiem.',
    results: 'Atrasts', products: 'preces', updated: 'Atjaunināts', live: 'Katalogs tiek atjaunināts',
    inStock: 'Pieejams', relevance: 'Pēc atbilstības', priceAsc: 'Lētākie vispirms', priceDesc: 'Dārgākie vispirms', name: 'Pēc nosaukuma', reset: 'Notīrīt',
    currentPrice: 'Cena', merchant: 'Veikals', toStore: 'Uz veikalu', delivery: 'Precizēt veikalā', showMore: 'Rādīt vēl',
    noResults: 'Pieslēgtajos katalogos nekas netika atrasts', noResultsText: 'Zemāk vari uzreiz pārbaudīt šo vaicājumu citos veikalos.',
    checkStores: 'Pārbaudīt citos veikalos', checkStoresSub: 'Tiešās saites uz veikaliem. Daļai veikalu vaicājums uzreiz tiek nodots meklēšanai.',
    storesTitle: 'Veikali', storesSub: 'Zaļā atzīme nozīmē, ka veikala preces jau ir CenaRadar kopējā meklēšanā.',
    inCatalog: 'preces katalogā', openStore: 'Atvērt veikalu',
    footer: 'CenaRadar — preču meklēšana un cenu salīdzināšana Latvijas interneta veikalos.', menu: 'Izvēlne',
  },
} satisfies Record<Lang, Record<string, string>>;

function normalise(value = '') {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function directMerchantUrl(product: LiveProduct) {
  return product.merchantUrl || product.url || '';
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

function merchantHref(name: string, query: string) {
  const merchant = merchants.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (!merchant) return '';
  const q = query.trim();
  return q && merchant.search ? merchant.search(q) : merchant.home;
}

export default function PremiumApp() {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('cenaradar:lang');
    if (saved === 'ru' || saved === 'lv') return saved;
    return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'lv';
  });
  const [cachedCatalog] = useState<FeedResponse | null>(() => readCatalogCache());
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('relevance');
  const [onlyStock, setOnlyStock] = useState(false);
  const [limit, setLimit] = useState(40);
  const [products, setProducts] = useState<LiveProduct[]>(() => cachedCatalog?.products || []);
  const [connectedStores, setConnectedStores] = useState<ConnectedStore[]>(() => (
    cachedCatalog?.meta?.stores?.length ? cachedCatalog.meta.stores : FALLBACK_CONNECTED_STORES
  ));
  const [loading, setLoading] = useState(() => !(cachedCatalog?.products?.length));
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => cachedCatalog?.meta?.fetchedAt || null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = copy[lang];

  useEffect(() => localStorage.setItem('cenaradar:lang', lang), [lang]);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;
    let interval: number | undefined;

    const load = async (retry = true) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), submittedQuery ? 25000 : 35000);
      setLoading(true);
      try {
        const endpoint = submittedQuery ? `${SEARCH_API_URL}?q=${encodeURIComponent(submittedQuery)}` : CATALOG_API_URL;
        const response = await fetch(endpoint, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as FeedResponse;
        if (!cancelled) {
          setProducts(payload.products || []);
          setConnectedStores(payload.meta?.stores?.length ? payload.meta.stores : FALLBACK_CONNECTED_STORES);
          setLive(Boolean(payload.meta?.live && !payload.meta?.stale));
          setUpdatedAt(payload.meta?.fetchedAt || null);
          setLoading(false);
          if (!submittedQuery) writeCatalogCache(payload);
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
      const haystack = normalise(`${product.name} ${product.brand || ''} ${product.model || ''} ${product.sku || ''} ${product.mpn || ''} ${product.ean || ''} ${product.description || ''} ${product.category || ''} ${product.merchant || ''}`);
      return localQuery.split(' ').filter(Boolean).every(token => haystack.includes(token));
    });
    if (sort === 'priceAsc') next = [...next].sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') next = [...next].sort((a, b) => b.price - a.price);
    if (sort === 'name') next = [...next].sort((a, b) => a.name.localeCompare(b.name));
    return next;
  }, [onlyStock, products, query, sort, submittedQuery]);

  const storeDirectory = useMemo(() => {
    const activeMap = new Map(connectedStores.map(store => [store.name.toLowerCase(), store]));
    const known = merchants.map(store => ({
      ...store,
      active: activeMap.has(store.name.toLowerCase()),
      count: activeMap.get(store.name.toLowerCase())?.count || 0,
    }));
    const extra = connectedStores
      .filter(store => !merchants.some(item => item.name.toLowerCase() === store.name.toLowerCase()))
      .map(store => ({ name: store.name, home: '', active: true, count: store.count }));
    return [...known, ...extra];
  }, [connectedStores]);

  const submitSearch = (value = query) => {
    const next = value.trim();
    setQuery(value);
    setSubmittedQuery(next);
    setLimit(40);
    window.setTimeout(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  const resetSearch = () => {
    setQuery('');
    setSubmittedQuery('');
    setOnlyStock(false);
    setSort('relevance');
    setLimit(40);
  };

  const formattedUpdate = useMemo(() => {
    if (!updatedAt) return null;
    const parsed = new Date(updatedAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'lv-LV', { dateStyle: 'short', timeStyle: 'short' }).format(parsed);
  }, [lang, updatedAt]);

  const activeQuery = submittedQuery || query;

  return (
    <div className="cr-shell">
      <header className="cr-header">
        <div className="cr-header-inner">
          <a className="cr-brand" href="#top" aria-label="CenaRadar"><img src="/favicon.svg" alt="" /><span>Cena<span>Radar</span></span></a>
          <nav className="cr-nav"><a href="#catalog">{t.navCatalog}</a><a href="#stores">{t.navStores}</a></nav>
          <div className="cr-header-actions">
            <div className="cr-lang"><Languages size={14} /><button className={lang === 'lv' ? 'active' : ''} onClick={() => setLang('lv')}>LV</button><button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>RU</button></div>
            <button className="cr-menu" onClick={() => setMobileOpen(value => !value)} aria-label={t.menu}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
        {mobileOpen && <div className="cr-mobile-nav"><a href="#catalog" onClick={() => setMobileOpen(false)}>{t.navCatalog}</a><a href="#stores" onClick={() => setMobileOpen(false)}>{t.navStores}</a></div>}
      </header>

      <main id="top">
        <section className="cr-search-hero">
          <div className="cr-search-hero-inner">
            <span className="cr-eyebrow">{t.heroEyebrow}</span>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroText}</p>
            <div className="cr-main-search">
              <Search size={23} />
              <input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === 'Enter' && submitSearch()} placeholder={t.searchPlaceholder} />
              <button onClick={() => submitSearch()}>{t.searchButton}<ArrowRight size={18} /></button>
            </div>
            <div className="cr-live-summary"><span className={live ? 'online' : ''}></span><strong>{connectedStores.length}</strong> {t.navStores}<i>·</i><strong>{products.length}</strong> {t.products}</div>
          </div>
        </section>

        <section className="cr-section cr-popular">
          <div className="cr-section-title"><h2>{t.popular}</h2></div>
          <div className="cr-query-cloud">{popularQueries.map(item => <button key={item} onClick={() => submitSearch(item)}>{item}</button>)}</div>
        </section>

        <section className="cr-section cr-categories">
          <div className="cr-section-title"><h2>{t.categories}</h2></div>
          <div className="cr-category-grid">
            {categoryCards.map(({ key, icon: Icon, query: categoryQuery }) => <button className="cr-category-card" key={key} onClick={() => submitSearch(categoryQuery)}><span><Icon size={23} /></span><strong>{t[key]}</strong><ArrowRight size={16} /></button>)}
          </div>
        </section>

        <section className="cr-section cr-catalog" id="catalog">
          <div className="cr-catalog-head">
            <div><span className="cr-eyebrow">CENARADAR</span><h2>{t.catalogTitle}</h2><p>{t.catalogSub}</p></div>
            <div className="cr-update"><span className={live ? 'online' : ''}></span>{t.live}{formattedUpdate && <small>{t.updated}: {formattedUpdate}</small>}</div>
          </div>

          <div className="cr-catalog-tools">
            <div className="cr-result-count"><strong>{t.results}: {visibleProducts.length}</strong><span>{t.products}</span></div>
            <div className="cr-filter-row">
              <label className="cr-stock-filter"><input type="checkbox" checked={onlyStock} onChange={event => setOnlyStock(event.target.checked)} />{t.inStock}</label>
              <label className="cr-sort-select"><SlidersHorizontal size={15} /><select value={sort} onChange={event => setSort(event.target.value as SortMode)}><option value="relevance">{t.relevance}</option><option value="priceAsc">{t.priceAsc}</option><option value="priceDesc">{t.priceDesc}</option><option value="name">{t.name}</option></select><ArrowDownUp size={14} /></label>
              {(query || onlyStock || sort !== 'relevance') && <button className="cr-reset" onClick={resetSearch}>{t.reset}</button>}
            </div>
          </div>

          {loading && visibleProducts.length === 0 ? <div className="cr-loading"><span></span><span></span><span></span></div> : visibleProducts.length === 0 ? (
            <div className="cr-empty"><Search size={32} /><h3>{t.noResults}</h3><p>{t.noResultsText}</p></div>
          ) : (
            <>
              <div className="cr-product-list">
                {visibleProducts.slice(0, limit).map(product => {
                  const directUrl = directMerchantUrl(product);
                  const merchant = product.merchant || 'Store';
                  return <article className="cr-product-row" key={`${merchant}-${product.id}`}>
                    <div className="cr-product-thumb">{product.image ? <img src={product.image} alt={product.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <ShoppingBag size={28} />}</div>
                    <div className="cr-product-copy"><div className="cr-product-meta"><span>{merchant}</span>{product.brand && <small>{product.brand}</small>}</div><h3>{product.name}</h3>{product.description && <p>{product.description}</p>}<div className="cr-mobile-price"><strong>{money(product.price, product.currency || 'EUR', lang)}</strong>{product.compareAtPrice && product.compareAtPrice > product.price ? <del>{money(product.compareAtPrice, product.currency || 'EUR', lang)}</del> : null}</div></div>
                    <div className="cr-product-store"><span>{t.merchant}</span><strong>{merchant}</strong><small><Clock3 size={13} />{product.delivery || t.delivery}</small></div>
                    <div className="cr-product-price"><span>{t.currentPrice}</span><strong>{money(product.price, product.currency || 'EUR', lang)}</strong>{product.compareAtPrice && product.compareAtPrice > product.price ? <del>{money(product.compareAtPrice, product.currency || 'EUR', lang)}</del> : null}</div>
                    {directUrl ? <a className="cr-shop-button" href={directUrl} target="_blank" rel="noopener noreferrer">{t.toStore}<ExternalLink size={15} /></a> : <span className="cr-shop-button disabled">{t.toStore}</span>}
                  </article>;
                })}
              </div>
              {limit < visibleProducts.length && <button className="cr-show-more" onClick={() => setLimit(value => value + 40)}>{t.showMore}<ArrowRight size={16} /></button>}
            </>
          )}

          {activeQuery.trim() && <div className="cr-direct-search"><div><strong>{t.checkStores}</strong><span>{t.checkStoresSub}</span></div><div className="cr-direct-links">{merchants.map(store => <a key={store.name} href={merchantHref(store.name, activeQuery)} target="_blank" rel="noopener noreferrer">{store.name}<ExternalLink size={13} /></a>)}</div></div>}
        </section>

        <section className="cr-section cr-stores" id="stores">
          <div className="cr-section-title"><span className="cr-eyebrow">LATVIA</span><h2>{t.storesTitle}</h2><p>{t.storesSub}</p></div>
          <div className="cr-store-grid">
            {storeDirectory.map(store => {
              const href = merchantHref(store.name, activeQuery) || store.home || '#catalog';
              return <a className={store.active ? 'cr-store-card active' : 'cr-store-card'} key={store.name} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                <span className="cr-store-logo">{store.name.slice(0, 2).toUpperCase()}</span>
                <span className="cr-store-info"><strong>{store.name}</strong><small>{store.active ? `${store.count} ${t.inCatalog}` : t.openStore}</small></span>
                {store.active ? <CheckCircle2 size={18} /> : <ExternalLink size={17} />}
              </a>;
            })}
          </div>
        </section>
      </main>

      <footer className="cr-footer"><a className="cr-brand" href="#top"><img src="/favicon.svg" alt="" /><span>Cena<span>Radar</span></span></a><p>{t.footer}</p><span>© 2026 · cenaradar.online</span></footer>
    </div>
  );
}
