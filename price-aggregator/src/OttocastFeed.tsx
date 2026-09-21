import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BadgeCheck, ExternalLink, PackageCheck, RefreshCw } from 'lucide-react';
import fallbackProducts from './ottocast-products.json';

type Lang = 'ru' | 'lv';
type FeedProduct = (typeof fallbackProducts)[number] & {
  brand?: string;
  inStock?: string;
  lastUpdated?: string;
  compareAtPrice?: number | null;
  priceSource?: string;
  merchantUrl?: string;
};
type FeedResponse = {
  products?: FeedProduct[];
  meta?: {
    live?: boolean;
    stale?: boolean;
    feedLastImported?: string | null;
    fetchedAt?: string | null;
    source?: string;
    priceSource?: string;
    productCount?: number;
  };
};

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
  const [source, setSource] = useState<string>('snapshot');

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
          setSource(payload.meta?.priceSource || payload.meta?.source || 'live');
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
    const interval = window.setInterval(() => { void refresh(false); }, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, []);

  if (!target) return null;

  const storefrontPrices = source === 'merchant_storefront' || source.includes('storefront');
  const c = lang === 'ru'
    ? {
        eyebrow: 'OTTOCAST · ПАРТНЁР AWIN',
        title: 'Ottocast — товары с актуальными ценами магазина',
        text: storefrontPrices
          ? 'Каталог и текущие цены берутся напрямую с витрины Ottocast. Переход на покупку остаётся партнёрским через Awin, поэтому CenaRadar получает комиссию без наценки для покупателя.'
          : 'Сейчас используется резервный источник Awin. Итоговую цену проверяйте на странице магазина.',
        live: storefrontPrices ? 'ЦЕНЫ С МАГАЗИНА' : 'LIVE DATA', snapshot: 'РЕЗЕРВНАЯ КОПИЯ', updated: 'Обновлено', delivery: 'Уточняется при оформлении', button: 'Купить в Ottocast',
        currentPrice: storefrontPrices ? 'Цена сейчас' : 'Цена источника',
        disclosure: 'Партнёрская ссылка Awin · CenaRadar может получить комиссию с покупки',
      }
    : {
        eyebrow: 'OTTOCAST · AWIN PARTNERIS',
        title: 'Ottocast — preces ar aktuālajām veikala cenām',
        text: storefrontPrices
          ? 'Katalogs un pašreizējās cenas tiek ielādētas tieši no Ottocast veikala. Pirkuma saite joprojām ir partnera Awin saite, tāpēc CenaRadar var saņemt komisiju bez uzcenojuma pircējam.'
          : 'Pašlaik tiek izmantots rezerves Awin avots. Gala cenu pārbaudiet veikala lapā.',
        live: storefrontPrices ? 'VEIKALA CENAS' : 'LIVE DATA', snapshot: 'REZERVES KOPIJA', updated: 'Atjaunināts', delivery: 'Tiek precizēta noformēšanas laikā', button: 'Pirkt Ottocast',
        currentPrice: storefrontPrices ? 'Cena šobrīd' : 'Avota cena',
        disclosure: 'Awin partnera saite · CenaRadar var saņemt komisiju par pirkumu',
      };

  const formatUpdate = (value: string | null) => {
    if (!value) return null;
    const candidate = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
    const parsed = new Date(candidate);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'lv-LV', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
  };
  const money = (value: number, currency: string) => new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'lv-LV', { style: 'currency', currency: currency || 'USD', currencyDisplay: 'code' }).format(value);
  const formattedUpdate = formatUpdate(updatedAt);

  return createPortal(
    <section className="cr-ottocast-feed" aria-label="Ottocast products">
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
              <small className="cr-ottocast-sku">SKU {product.sku || '—'}</small><h4>{product.name}</h4><p>{product.description}</p>
              <div className="cr-ottocast-meta">
                <small>{c.currentPrice}</small>
                <div className="cr-ottocast-price-row">
                  <strong>{money(product.price, product.currency || 'USD')}</strong>
                  {product.compareAtPrice && product.compareAtPrice > product.price ? <del>{money(product.compareAtPrice, product.currency || 'USD')}</del> : null}
                </div>
                <span><PackageCheck size={14} /> {product.delivery || c.delivery}</span>
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
