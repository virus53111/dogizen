import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BadgeCheck, ExternalLink, PackageCheck } from 'lucide-react';

type Lang = 'ru' | 'lv';

type FeedProduct = {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  currency: 'USD';
  image: string;
  url: string;
  delivery: string;
};

const products: FeedProduct[] = [
  { id: '42007791802', name: 'U2AIR Pro', sku: 'CP82', description: 'Wireless CarPlay Adapter', price: 129, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/CP82_8ba506b5-1fd1-4412-b8c2-4255b320b903.jpg?v=1721700842&width=900', url: 'https://www.awin1.com/pclick.php?p=42007791802&a=3101606&m=96499', delivery: 'Varies by region' },
  { id: '42007791803', name: 'A2Air Pro', sku: 'AA82', description: 'Wireless Android Auto Adapter', price: 129, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/AA82_7bf37f12-61e4-4b93-bac9-295ea350c2f5.jpg?v=1721699426&width=900', url: 'https://www.awin1.com/pclick.php?p=42007791803&a=3101606&m=96499', delivery: 'Varies by region' },
  { id: '42007791804', name: 'Car TV Mate Pro', sku: 'CA361-C3', description: 'HDMI Multimedia & Wireless CarPlay Adapter', price: 99, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/CA361-c3.jpg?v=1723444955&width=900', url: 'https://www.awin1.com/pclick.php?p=42007791804&a=3101606&m=96499', delivery: 'Varies by region' },
  { id: '42007791805', name: 'Car TV Mate Max', sku: 'CA361-C4', description: 'Wireless CarPlay & Android Auto with HDMI Multimedia', price: 109, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/cartvmatepropicture.jpg?v=1738809161&width=1000', url: 'https://www.awin1.com/pclick.php?p=42007791805&a=3101606&m=96499', delivery: 'Varies by region' },
  { id: '42007791806', name: 'Play2Video Pro', sku: 'CA400-S2', description: 'Wireless CarPlay/ Android Auto All-in-one Adapter', price: 179, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/CA400-S.jpg?v=1721700829&width=900', url: 'https://www.awin1.com/pclick.php?p=42007791806&a=3101606&m=96499', delivery: 'Varies by region' },
  { id: '42007791807', name: 'OttoAibox P3 Lite', sku: 'PCS46(4+64)', description: 'CarPlay AI Box', price: 239, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/3_a89f6d17-f2a7-45e6-9215-f4d5ffdf228e.jpg?v=1730109528&width=900', url: 'https://www.awin1.com/pclick.php?p=42007791807&a=3101606&m=96499', delivery: 'Varies by region' },
  { id: '42007791808', name: 'OttoAibox P3', sku: 'PCS46(8+128)', description: 'CarPlay AI Box', price: 279, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/s46_37ef8e5d-6055-412a-9b64-aaf6e13bfdd7.jpg?v=1721700811&width=900', url: 'https://www.awin1.com/pclick.php?p=42007791808&a=3101606&m=96499', delivery: 'Varies by region' },
  { id: '42007791809', name: 'OttoAibox i3', sku: 'PCS46BM2', description: 'For BMW/Hyundai/KIA CarPlay AI Box', price: 279, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/2_255be732-49a9-41eb-8ff7-182c64507879.jpg?v=1728704780&width=900', url: 'https://www.awin1.com/pclick.php?p=42007791809&a=3101606&m=96499', delivery: 'Varies by region' },
  { id: '42007791810', name: 'NanoAI', sku: 'PCS50', description: 'AI voice control + GPT', price: 319, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/nanoai_thumb_457982f9-8861-4bdc-b020-f5d789be6e19.png?v=1741583568&width=800', url: 'https://www.awin1.com/pclick.php?p=42007791810&a=3101606&m=96499', delivery: 'Varies by region' },
  { id: '42007791811', name: 'Mini', sku: 'CA505T-EN', description: 'Wireless CarPlay/Android Auto Adapter', price: 99, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/CA500-T-1500_2_18e3d8a9-ff41-4b3e-8f0c-bc2db6fa406c.jpg?v=1745458420&width=1000', url: 'https://www.awin1.com/pclick.php?p=42007791811&a=3101606&m=96499', delivery: 'Varies by region' },
  { id: '42007791812', name: 'Mirror Touch', sku: 'CA450', description: 'Wireless CarPlay Adapter + DP Mirroring Link', price: 149, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/MirrorTouch1500-1.jpg?v=1747190726&width=1000', url: 'https://www.awin1.com/pclick.php?p=42007791812&a=3101606&m=96499', delivery: 'Varies by region' },
  { id: '42007791813', name: 'ScreenFlow Portable Car Display Screen', sku: 'N95O', description: 'Car Display Screen', price: 230, currency: 'USD', image: 'https://www.ottocast.com/cdn/shop/files/T88.jpg?v=1753170303&width=1000', url: 'https://www.awin1.com/pclick.php?p=42007791813&a=3101606&m=96499', delivery: 'Varies by region' },
];

const getLang = (): Lang => {
  const saved = localStorage.getItem('cenaradar:lang');
  if (saved === 'ru' || saved === 'lv') return saved;
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'lv';
};

export default function OttocastFeed() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [lang, setLang] = useState<Lang>(() => getLang());

  useEffect(() => {
    setTarget(document.getElementById('catalog'));

    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('.cr-lang button');
      if (!button) return;
      window.setTimeout(() => setLang(getLang()), 0);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  if (!target) return null;

  const c = lang === 'ru'
    ? {
        eyebrow: 'ПАРТНЁРСКИЙ PRODUCT FEED · AWIN',
        title: 'Ottocast — первые реальные товары CenaRadar',
        text: '12 товаров импортированы из одобренного product feed Ottocast в Awin. Цены указаны в USD так, как их передал рекламодатель; итоговую цену и доставку проверяйте на сайте магазина.',
        feed: 'Данные партнёра',
        delivery: 'Доставка зависит от региона',
        button: 'В Ottocast',
        disclosure: 'Партнёрская ссылка · CenaRadar может получить комиссию с покупки',
      }
    : {
        eyebrow: 'PARTNERU PRODUCT FEED · AWIN',
        title: 'Ottocast — pirmās reālās preces CenaRadar',
        text: '12 preces importētas no apstiprinātas Ottocast produktu plūsmas Awin. Cenas ir USD valūtā, kā tās norādījis reklāmdevējs; gala cenu un piegādi pārbaudiet veikala vietnē.',
        feed: 'Partnera dati',
        delivery: 'Piegāde atkarīga no reģiona',
        button: 'Uz Ottocast',
        disclosure: 'Partnera saite · CenaRadar var saņemt komisiju par pirkumu',
      };

  const section = (
    <section className="cr-ottocast-feed" aria-label="Ottocast product feed">
      <div className="cr-ottocast-head">
        <div>
          <span className="cr-eyebrow">{c.eyebrow}</span>
          <h3>{c.title}</h3>
          <p>{c.text}</p>
        </div>
        <div className="cr-ottocast-feed-badge"><BadgeCheck size={16} /> {c.feed}</div>
      </div>

      <div className="cr-ottocast-grid">
        {products.map(product => (
          <article className="cr-ottocast-card" key={product.id}>
            <div className="cr-ottocast-image">
              <img src={product.image} alt={product.name} loading="lazy" />
              <span>OTTOCAST</span>
            </div>
            <div className="cr-ottocast-body">
              <small className="cr-ottocast-sku">SKU {product.sku}</small>
              <h4>{product.name}</h4>
              <p>{product.description}</p>
              <div className="cr-ottocast-meta">
                <strong>{new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'lv-LV', { style: 'currency', currency: product.currency, currencyDisplay: 'code' }).format(product.price)}</strong>
                <span><PackageCheck size={14} /> {c.delivery}</span>
              </div>
              <a href={product.url} target="_blank" rel="sponsored noopener noreferrer">
                {c.button} <ExternalLink size={15} />
              </a>
              <small className="cr-ottocast-disclosure">{c.disclosure}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  return createPortal(section, target);
}
