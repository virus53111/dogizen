import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BadgeCheck, ExternalLink, PackageCheck, RefreshCw } from 'lucide-react';
import fallbackProducts from './ottocast-products.json';

type Lang = 'ru' | 'lv';
type FeedProduct = (typeof fallbackProducts)[number] & { brand?: string; inStock?: string; lastUpdated?: string };
type FeedResponse = { products?: FeedProduct[]; meta?: { live?: boolean; stale?: boolean; feedLastImported?: string | null; fetchedAt?: string | null } };

const API_URL = 'https://cenaradar-feed-api.onrender.com/api/ottocast';

const getLang = (): Lang => {
  const saved = localStorage.getItem('cenaradar:lang');
  if (saved === 'ru' || saved === 'lv') return saved;
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'lv';
};

export default function OttocastFeed() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [lang, setLang] = useState<Lang>(() => getLang());
  const [products, setProducts] = useState<FeedProduct[]>(fallbackProducts as FeedProduct[]);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    setTarget(document.getElementById('catalog'));
    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('.cr-lang button');
      if (button) window.setTimeout(() => setLang(getLang()), 0);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;

    const refresh = async (retry = true) => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(API_URL, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as FeedResponse;
        if (!cancelled && payload.products?.length) {
          setProducts(payload.products);
          setLive(Boolean(payload.meta?.live && !payload.meta?.stale));
          setUpdatedAt(payload.meta?.feedLastImported || payload.meta?.fetchedAt || null);
        }
      } catch {
        if (!cancelled) {
          setLive(false);
          if (retry) retryTimer = window.setTimeout(() => { void refresh(false); }, 12000);
        }
      } finally {
        window.clearTimeout(timer);
      }
    };

    void refresh();
    const interval = window.setInterval(() => { void refresh(false); }, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, []);

  if (!target) return null;

  const c = lang === 'ru'
    ? {
        eyebrow: 'ПАРТНЁРСКИЙ PRODUCT FEED · AWIN',
        title: 'Ottocast — товары из партнёрского фида',
        text: 'Карточки загружаются из разрешённого product feed Ottocast в Awin. Важно: Ottocast сейчас передаёт в этом фиде базовую цену, а на сайте магазина могут действовать более низкие акции и региональные цены. Поэтому окончательную цену всегда показываем как цену магазина после перехода.',
        live: 'LIVE FEED', snapshot: 'РЕЗЕРВНАЯ КОПИЯ', updated: 'Фид получен', delivery: 'Доставка зависит от региона', button: 'Проверить цену',
        feedPrice: 'Цена по фиду Awin',
        priceHint: 'На сайте Ottocast цена может быть ниже из-за акции или региона',
        disclosure: 'Партнёрская ссылка · CenaRadar может получить комиссию с покупки',
      }
    : {
        eyebrow: 'PARTNERU PRODUCT FEED · AWIN',
        title: 'Ottocast — preces no partnera datu plūsmas',
        text: 'Kartītes tiek ielādētas no atļautas Ottocast produktu plūsmas Awin. Svarīgi: Ottocast šajā plūsmā pašlaik nodod bāzes cenu, bet veikala vietnē var būt zemākas akcijas un reģionālās cenas. Tāpēc galīgā cena vienmēr jāpārbauda veikala vietnē.',
        live: 'LIVE FEED', snapshot: 'REZERVES KOPIJA', updated: 'Plūsma saņemta', delivery: 'Piegāde atkarīga no reģiona', button: 'Pārbaudīt cenu',
        feedPrice: 'Cena Awin plūsmā',
        priceHint: 'Ottocast vietnē cena var būt zemāka akcijas vai reģiona dēļ',
        disclosure: 'Partnera saite · CenaRadar var saņemt komisiju par pirkumu',
      };

  const formatUpdate = (value: string | null) => {
    if (!value) return null;
    const candidate = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
    const parsed = new Date(candidate);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'lv-LV', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
  };
  const formattedUpdate = formatUpdate(updatedAt);

  return createPortal(
    <section className="cr-ottocast-feed" aria-label="Ottocast product feed">
      <div className="cr-ottocast-head">
        <div><span className="cr-eyebrow">{c.eyebrow}</span><h3>{c.title}</h3><p>{c.text}</p></div>
        <div className={live ? 'cr-ottocast-feed-badge live' : 'cr-ottocast-feed-badge'}>
          {live ? <BadgeCheck size={16} /> : <RefreshCw size={16} />}
          <span>{live ? c.live : c.snapshot}{formattedUpdate && <small>{c.updated}: {formattedUpdate}</small>}</span>
        </div>
      </div>
      <div className="cr-ottocast-grid">
        {products.map(product => (
          <article className="cr-ottocast-card" key={product.id}>
            <div className="cr-ottocast-image"><img src={product.image} alt={product.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /><span>OTTOCAST</span></div>
            <div className="cr-ottocast-body">
              <small className="cr-ottocast-sku">SKU {product.sku}</small><h4>{product.name}</h4><p>{product.description}</p>
              <div className="cr-ottocast-meta">
                <small>{c.feedPrice}</small>
                <strong>{new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'lv-LV', { style: 'currency', currency: product.currency || 'USD', currencyDisplay: 'code' }).format(product.price)}</strong>
                <span><PackageCheck size={14} /> {product.delivery || c.delivery}</span>
                <em>{c.priceHint}</em>
              </div>
              <a href={product.url} target="_blank" rel="sponsored noopener noreferrer">{c.button} <ExternalLink size={15} /></a>
              <small className="cr-ottocast-disclosure">{c.disclosure}</small>
            </div>
          </article>
        ))}
      </div>
    </section>,
    target,
  );
}
