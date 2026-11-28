import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cityNamesInRange } from './latvia-cities.js';
import { cityIndexMeta, noncommercialCityLinks } from './growth.js';

const labels = {
  ru: 'Опубликованные анкеты в Риге',
  en: 'Published profiles in Riga',
  de: 'Veröffentlichte Profile in Riga',
  lv: 'Publicētie profili Rīgā',
  lt: 'Paskelbtos anketos Rygoje',
  et: 'Avaldatud profiilid Riias',
};

export async function registerRigaPages(app, db, directory, growthLinks = async () => '') {
  let expires = 0;
  let total = null;
  let pending;
  function count() {
    if (Date.now() < expires) return total;
    pending ??= db.query(`SELECT COUNT(*)::integer AS total FROM mm_public_listings
      WHERE status='approved' AND is_commercial IS FALSE AND country='LV' AND city=ANY($1::text[])`, [cityNamesInRange('Рига')])
      .then(result => { total = result.rows[0].total; expires = Date.now() + 60000; })
      .catch(() => { total = null; expires = Date.now() + 10000; })
      .finally(() => { pending = undefined; });
    return pending.then(() => total);
  }

  for (const [lang, label] of Object.entries(labels)) {
    const prefix = lang === 'ru' ? '' : '/' + lang;
    const url = prefix + '/riga/';
    const page = await readFile(path.join(directory, prefix.slice(1), 'riga/index.html'), 'utf8');
    app.get(new RegExp('^' + url + 'index\\.html async (req, res, next) => {
      try {
        const n = await count();
        if (!Number.isSafeInteger(n)) return res.set('Retry-After','60').status(503).type('text').send('Temporarily unavailable');
        const summary = Number.isSafeInteger(n) ? '<p><strong>' + label + ': ' + n + '</strong></p>' : '';
        const links = await growthLinks(url);
        res.set('Cache-Control', 'no-cache').send(cityIndexMeta(noncommercialCityLinks(page.replace('<!--riga-count-->', summary + links)), n >= 5));
      } catch (error) { next(error); }
    });
  }
}
), (req,res)=>res.redirect(301,url));
    app.get(new RegExp('^' + url + ' async (req, res, next) => {
      try {
        const n = await count();
        if (!Number.isSafeInteger(n)) return res.set('Retry-After','60').status(503).type('text').send('Temporarily unavailable');
        const summary = Number.isSafeInteger(n) ? '<p><strong>' + label + ': ' + n + '</strong></p>' : '';
        const links = await growthLinks(url);
        res.set('Cache-Control', 'no-cache').send(cityIndexMeta(noncommercialCityLinks(page.replace('<!--riga-count-->', summary + links)), n >= 5));
      } catch (error) { next(error); }
    });
  }
}
), async (req, res, next) => {
      try {
        const n = await count();
        if (!Number.isSafeInteger(n)) return res.set('Retry-After','60').status(503).type('text').send('Temporarily unavailable');
        const summary = Number.isSafeInteger(n) ? '<p><strong>' + label + ': ' + n + '</strong></p>' : '';
        const links = await growthLinks(url);
        res.set('Cache-Control', 'no-cache').send(cityIndexMeta(noncommercialCityLinks(page.replace('<!--riga-count-->', summary + links)), n >= 5));
      } catch (error) { next(error); }
    });
  }
}
