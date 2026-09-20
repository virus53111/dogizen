import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  CheckCircle2,
  ExternalLink,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
} from 'lucide-react';

type Lang = 'ru' | 'lv';
type Category = 'all' | 'phones' | 'computers' | 'audio' | 'home';

type Offer = {
  store: string;
  price: number;
  delivery: string;
  affiliateNetwork: string;
  affiliateReady: boolean;
};

type Product = {
  id: number;
  title: string;
  model: string;
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
    category: 'phones',
    emoji: '📱',
    meta: '256 GB · Titanium Black · 5G',
    offers: [
      { store: '220.lv', price: 1049, delivery: '0–3 €', affiliateNetwork: 'Tradedoubler', affiliateReady: false },
      { store: 'Dateks.lv', price: 1069, delivery: '2.99 €', affiliateNetwork: 'Direct', affiliateReady: false },
      { store: 'Samsung.lv', price: 1099, delivery: 'Bezmaksas', affiliateNetwork: 'Awin', affiliateReady: false },
    ],
  },
  {
    id: 2,
    title: 'Apple MacBook Air 13 M4 16/256GB',
    model: 'MW0W3',
    category: 'computers',
    emoji: '💻',
    meta: '13.6″ · 16 GB · 256 GB SSD',
    offers: [
      { store: '220.lv', price: 1129, delivery: '0–3 €', affiliateNetwork: 'Tradedoubler', affiliateReady: false },
      { store: 'Dateks.lv', price: 1149, delivery: '2.99 €', affiliateNetwork: 'Direct', affiliateReady: false },
    ],
  },
  {
    id: 3,
    title: 'Sony WH-1000XM6',
    model: 'WH1000XM6B',
    category: 'audio',
    emoji: '🎧',
    meta: 'ANC · Bluetooth · Black',
    offers: [
      { store: '220.lv', price: 419, delivery: '0–3 €', affiliateNetwork: 'Tradedoubler', affiliateReady: false },
      { store: 'Dateks.lv', price: 429, delivery: '2.99 €', affiliateNetwork: 'Direct', affiliateReady: false },
    ],
  },
  {
    id: 4,
    title: 'Samsung OLED 55″ S95F',
    model: 'QE55S95F',
    category: 'home',
    emoji: '📺',
    meta: '55″ · OLED · 4K · Smart TV',
    offers: [
      { store: 'Samsung.lv', price: 1599, delivery: 'Bezmaksas', affiliateNetwork: 'Awin', affiliateReady: false },
      { store: '220.lv', price: 1649, delivery: '0–15 €', affiliateNetwork: 'Tradedoubler', affiliateReady: false },
    ],
  },
  {
    id: 5,
    title: 'Lenovo Legion 5 16IRX9',
    model: '83DG00A5PB',
    category: 'computers',
    emoji: '🖥️',
    meta: '16″ · i7 · RTX 4060 · 16/1000 GB',
    offers: [
      { store: 'Dateks.lv', price: 1299, delivery: '2.99 €', affiliateNetwork: 'Direct', affiliateReady: false },
      { store: '220.lv', price: 1339, delivery: '0–3 €', affiliateNetwork: 'Tradedoubler', affiliateReady: false },
    ],
  },
];

const text = {
  ru: {
    tagline: 'Сравнение цен в Латвии',
    heroTitle: 'Найди товар. Сравни цены. Купи дешевле.',
    heroText: 'Первая версия агрегатора для 220.lv, Dateks, Samsung и других магазинов. Сейчас используются демонстрационные цены.',
    search: 'Например: Samsung S25 Ultra 256GB',
    searchButton: 'Найти',
    all: 'Все',
    phones: 'Телефоны',
    computers: 'Компьютеры',
    audio: 'Аудио',
    home: 'Техника',
    sort: 'Сначала дешевле',
    found: 'Найдено товаров',
    from: 'от',
    offers: 'предложения',
    best: 'Лучшая цена',
    delivery: 'Доставка',
    go: 'В магазин',
    affiliate: 'Партнёрка',
    demo: 'Демо-версия — реальные фиды и партнёрские ссылки будут подключены после регистрации.',
    empty: 'По такому запросу товаров пока нет.',
    footer: 'CenaRadar LV · прототип агрегатора цен для Латвии',
    clickNotice: 'Здесь будет твоя партнёрская ссылка. Пока переход отключён.',
  },
  lv: {
    tagline: 'Cenu salīdzināšana Latvijā',
    heroTitle: 'Atrodi preci. Salīdzini cenas. Pērc izdevīgāk.',
    heroText: 'Pirmais agregatora prototips 220.lv, Dateks, Samsung un citiem veikaliem. Pašlaik tiek izmantotas demonstrācijas cenas.',
    search: 'Piemēram: Samsung S25 Ultra 256GB',
    searchButton: 'Meklēt',
    all: 'Visi',
    phones: 'Telefoni',
    computers: 'Datori',
    audio: 'Audio',
    home: 'Tehnika',
    sort: 'Lētākie vispirms',
    found: 'Atrastas preces',
    from: 'no',
    offers: 'piedāvājumi',
    best: 'Labākā cena',
    delivery: 'Piegāde',
    go: 'Uz veikalu',
    affiliate: 'Partneris',
    demo: 'Demo versija — reālie produktu fīdi un partneru saites tiks pieslēgtas pēc reģistrācijas.',
    empty: 'Šim meklējumam preču pagaidām nav.',
    footer: 'CenaRadar LV · cenu salīdzināšanas prototips Latvijai',
    clickNotice: 'Šeit būs tava partnera saite. Pagaidām pāreja ir atslēgta.',
  },
};

const categories: Category[] = ['all', 'phones', 'computers', 'audio', 'home'];

function App() {
  const [lang, setLang] = useState<Lang>('ru');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [sortAsc, setSortAsc] = useState(true);
  const [toast, setToast] = useState('');
  const t = text[lang];

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const haystack = `${product.title} ${product.model} ${product.meta} ${product.offers.map((offer) => offer.store).join(' ')}`.toLowerCase();
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });

    return [...filtered].sort((a, b) => {
      const aMin = Math.min(...a.offers.map((offer) => offer.price));
      const bMin = Math.min(...b.offers.map((offer) => offer.price));
      return sortAsc ? aMin - bMin : bMin - aMin;
    });
  }, [category, query, sortAsc]);

  const handleOfferClick = () => {
    setToast(t.clickNotice);
    window.setTimeout(() => setToast(''), 3200);
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CenaRadar LV">
          <span className="brand-mark"><Search size={19} /></span>
          <span>CenaRadar <strong>LV</strong></span>
        </a>
        <div className="top-actions">
          <span className="status-chip"><CheckCircle2 size={15} /> MVP</span>
          <div className="lang-switch" aria-label="Language">
            <button className={lang === 'lv' ? 'active' : ''} onClick={() => setLang('lv')}>LV</button>
            <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>RU</button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-content">
            <div className="eyebrow"><Sparkles size={16} /> {t.tagline}</div>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroText}</p>
            <div className="search-box">
              <Search size={22} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                aria-label={t.search}
              />
              <button>{t.searchButton}</button>
            </div>
            <div className="trust-row">
              <span><ShieldCheck size={16} /> Neatkarīgs salīdzinājums</span>
              <span><Store size={16} /> 220.lv · Dateks · Samsung</span>
              <span><ShoppingBag size={16} /> Affiliate-ready</span>
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
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? 'category active' : 'category'}
                  onClick={() => setCategory(item)}
                >
                  {t[item]}
                </button>
              ))}
            </div>
            <button className="sort-button" onClick={() => setSortAsc((value) => !value)}>
              <ArrowDownUp size={16} /> {t.sort} {sortAsc ? '↑' : '↓'}
            </button>
          </div>

          <div className="results-head">
            <div>
              <span className="results-kicker">CenaRadar</span>
              <h2>{t.found}: {visibleProducts.length}</h2>
            </div>
            <div className="results-note">MVP · 5 demo products</div>
          </div>

          <div className="product-list">
            {visibleProducts.map((product) => {
              const sortedOffers = [...product.offers].sort((a, b) => a.price - b.price);
              const minPrice = sortedOffers[0].price;
              return (
                <article className="product-card" key={product.id}>
                  <div className="product-summary">
                    <div className="product-visual" aria-hidden="true">{product.emoji}</div>
                    <div className="product-info">
                      <span className="model">{product.model}</span>
                      <h3>{product.title}</h3>
                      <p>{product.meta}</p>
                      <div className="product-stats">
                        <span>{t.from} <strong>{minPrice.toFixed(2)} €</strong></span>
                        <span>{product.offers.length} {t.offers}</span>
                      </div>
                    </div>
                  </div>

                  <div className="offers-panel">
                    {sortedOffers.map((offer, index) => (
                      <div className={index === 0 ? 'offer best-offer' : 'offer'} key={`${product.id}-${offer.store}`}>
                        <div className="store-cell">
                          <strong>{offer.store}</strong>
                          <span>{t.affiliate}: {offer.affiliateNetwork}</span>
                        </div>
                        <div className="delivery-cell">
                          <span>{t.delivery}</span>
                          <strong>{offer.delivery}</strong>
                        </div>
                        <div className="price-cell">
                          {index === 0 && <span className="best-badge">{t.best}</span>}
                          <strong>{offer.price.toFixed(2)} €</strong>
                        </div>
                        <button className="shop-button" onClick={handleOfferClick}>
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
                <div className="empty-icon"><Search size={27} /></div>
                <h3>{t.empty}</h3>
                <button onClick={() => { setQuery(''); setCategory('all'); }}>Reset</button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">CenaRadar <strong>LV</strong></div>
        <p>{t.footer}</p>
        <span>© 2026</span>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
