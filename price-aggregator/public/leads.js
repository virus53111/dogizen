(() => {
  'use strict';
  const API = 'https://cenaradar-feed-api.onrender.com/api/leads';
  const STORAGE_KEY = 'leadradar:favorites:v1';
  const $ = (id) => document.getElementById(id);
  const state = {
    items: [],
    favorites: readFavorites(),
    mode: 'search',
    searched: false,
    loading: false,
    city: '',
    sector: '',
    updated: ''
  };
  let toastTimer = null;

  function readFavorites() {
    try {
      const val = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(val) ? val.filter(x => x && x.id && x.name).slice(0, 200) : [];
    } catch {
      return [];
    }
  }

  function persistFavorites() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.favorites.slice(0, 200)));
      return true;
    } catch {
      showToast('Браузер не разрешил сохранять избранное. Можно выгрузить CSV.');
      return false;
    }
  }

  function showToast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('visible'), 3800);
  }

  function empty(icon, title, message, showButton = false) {
    $('result-content').hidden = true;
    $('empty-state').hidden = false;
    $('empty-icon').textContent = icon;
    $('empty-title').textContent = title;
    $('empty-detail').textContent = message;
    $('empty-start').hidden = !showButton;
  }

  function mode(next) {
    state.mode = next;
    $('mode-search').classList.toggle('active', next === 'search');
    $('mode-saved').classList.toggle('active', next === 'saved');
    $('mode-search').setAttribute('aria-pressed', String(next === 'search'));
    $('mode-saved').setAttribute('aria-pressed', String(next === 'saved'));
    $('search-form').hidden = next === 'saved';
    $('search-submit').disabled = state.loading;
    $('result-title').textContent = next === 'saved' ? 'Моё избранное' : 'Найденные компании';
    $('result-subtitle').textContent = next === 'saved'
      ? 'Сохранено в этом браузере. Можно скачать CSV и использовать без регистрации.'
      : state.searched ? state.sector + ' · ' + state.city + ' · OpenStreetMap' : 'Выбери город и сферу бизнеса.';
    $('results-status').textContent = next === 'saved' ? 'СОХРАНЕНО ЛОКАЛЬНО' : state.searched ? 'ОТКРЫТЫЕ ДАННЫЕ' : 'ГОТОВО К ПОИСКУ';
    if (next === 'saved') $('notice').hidden = true;
    render();
  }

  function resultData() {
    const source = state.mode === 'saved' ? state.favorites : state.items;
    const query = $('text-filter').value.trim().toLocaleLowerCase();
    return source.filter((item) => {
      if ($('filter-site').checked && !item.website) return false;
      if ($('filter-phone').checked && !item.phone) return false;
      if (!query) return true;
      return [item.name, item.address, item.website, item.city, item.sector].some(
        v => String(v || '').toLocaleLowerCase().includes(query)
      );
    });
  }

  function setStats(items) {
    $('stat-total').textContent = items.length.toLocaleString('ru-RU');
    $('stat-web').textContent = items.filter(x => x.website).length.toLocaleString('ru-RU');
    $('stat-phone').textContent = items.filter(x => x.phone).length.toLocaleString('ru-RU');
    $('stat-email').textContent = items.filter(x => x.email).length.toLocaleString('ru-RU');
  }

  function safeExternal(value) {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }

  function btnLink(label, value, className = '') {
    const a = document.createElement('a');
    a.className = 'link-button ' + className;
    a.textContent = label;
    a.href = value;
    if (value.startsWith('http')) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    return a;
  }

  function detail(parent, symbol, value) {
    if (!value) return;
    const line = document.createElement('div');
    line.className = 'detail';
    const em = document.createElement('span');
    em.className = 'emoji';
    em.textContent = symbol;
    const content = document.createElement('span');
    content.textContent = value;
    line.append(em, content);
    parent.append(line);
  }

  function card(item) {
    const node = document.createElement('article');
    node.className = 'lead-card';
    const head = document.createElement('div');
    head.className = 'lead-card-head';
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = String(item.name || '?').trim()[0]?.toUpperCase() || '?';
    const id = document.createElement('div');
    id.className = 'identity';
    const name = document.createElement('h4');
    name.textContent = item.name;
    const sub = document.createElement('span');
    sub.textContent = [item.city, item.sector].filter(Boolean).join(' · ');
    id.append(name, sub);
    const star = document.createElement('button');
    star.type = 'button';
    star.title = 'Добавить или убрать из избранного';
    star.setAttribute('aria-label', 'Избранное: ' + item.name);
    star.className = 'star' + (state.favorites.some(x => x.id === item.id) ? ' saved' : '');
    star.textContent = star.classList.contains('saved') ? '★' : '☆';
    star.addEventListener('click', () => {
      const index = state.favorites.findIndex(x => x.id === item.id);
      if (index >= 0) {
        state.favorites.splice(index, 1);
        showToast('Удалено из избранного');
      } else {
        if (state.favorites.length >= 200) {
          showToast('Можно сохранить не более 200 компаний');
          return;
        }
        state.favorites.unshift(item);
        showToast('Сохранено в избранное');
      }
      persistFavorites();
      $('saved-count').textContent = state.favorites.length;
      render();
    });
    head.append(avatar, id, star);

    const details = document.createElement('div');
    details.className = 'lead-details';
    detail(details, '⌖', item.address || item.city);
    detail(details, '☎', item.phone);
    detail(details, '✉', item.email);
    if (!item.phone && !item.email) {
      const emptyDetail = document.createElement('div');
      emptyDetail.className = 'detail empty-detail';
      emptyDetail.textContent = 'Контакты в открытой карте не указаны';
      details.append(emptyDetail);
    }

    const foot = document.createElement('div');
    foot.className = 'lead-footer';
    const website = safeExternal(item.website);
    if (website) foot.append(btnLink('↗ Сайт', website));
    if (item.phone) {
      const digits = item.phone.split(/[;,]/)[0].replace(/[^\d+]/g, '');
      if (/^\+?\d{5,18}$/.test(digits)) foot.append(btnLink('☎ Позвонить', 'tel:' + digits, 'muted-link'));
    }
    if (item.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) {
      foot.append(btnLink('✉ Email', 'mailto:' + item.email, 'muted-link'));
    }
    const osm = safeExternal(item.osm_url);
    if (osm) foot.append(btnLink('↗ OSM', osm, 'muted-link'));
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'link-button muted-link';
    copy.textContent = '⧉ Копия';
    copy.addEventListener('click', async () => {
      const text = [item.name,item.sector,item.city,item.address,item.website,item.phone,item.email].filter(Boolean).join('\n');
      try { await navigator.clipboard.writeText(text); showToast('Контакт скопирован'); }
      catch { showToast('Для копирования разреши доступ к буферу обмена'); }
    });
    foot.append(copy);
    node.append(head,details,foot);
    return node;
  }

  function render() {
    $('saved-count').textContent = state.favorites.length;
    if (state.loading && state.mode === 'search') {
      empty('…','Поиск организаций','Запрашиваем открытые данные OpenStreetMap. Это может занять некоторое время.');
      $('empty-icon').className = 'loading-dots';
      return;
    }
    $('empty-icon').className = 'empty-icon';
    const list = state.mode === 'saved' ? state.favorites : state.items;
    if (!list.length) {
      const notSearched = state.mode === 'search' && !state.searched;
      if (state.mode === 'saved') {
        empty('☆', 'В избранном пока пусто', 'Найди компании и нажми звёздочку рядом с интересной организацией.');
      } else if (notSearched) {
        empty('⌕','Твой поиск начинается здесь', 'Выбери город и направление, затем нажми «Найти компании».',true);
      } else {
        empty('⌕','Компании не найдены','Для этой сферы пока нет подходящих записей. Попробуй другой город или направление.',true);
      }
      return;
    }
    $('empty-state').hidden = true;
    $('result-content').hidden = false;
    const visible = resultData();
    setStats(list);
    $('filtered-count').textContent = 'Показано ' + visible.length + ' из ' + list.length + ' компаний';
    const grid = $('lead-grid');
    grid.replaceChildren();
    if (!visible.length) {
      const p = document.createElement('div');
      p.className = 'empty-state';
      const h = document.createElement('h3'); h.textContent = 'По фильтрам ничего нет';
      const t = document.createElement('p'); t.textContent = 'Убери часть фильтров или измени поисковую фразу.';
      p.append(h,t);grid.append(p);
      return;
    }
    const fragment = document.createDocumentFragment();
    visible.forEach(item => fragment.append(card(item)));
    grid.append(fragment);
  }

  async function search(event) {
    if (event) event.preventDefault();
    if (state.loading) return;
    state.loading = true;
    state.searched = false;
    state.mode = 'search';
    $('notice').hidden = true;
    $('search-submit').disabled = true;
    $('search-submit').textContent = 'Ищем компании…';
    $('result-title').textContent = 'Поиск организаций';
    $('result-subtitle').textContent = 'Получаем актуальные открытые записи';
    $('results-status').textContent = 'ЗАГРУЗКА';
    render();
    const city = $('city').value, sector = $('sector').value;
    try {
      const response = await fetch(API + '?city=' + encodeURIComponent(city) + '&sector=' + encodeURIComponent(sector), {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        signal: AbortSignal.timeout(65000)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Источник данных временно не отвечает');
      if (!Array.isArray(data.items)) throw new Error('Источник данных вернул неправильный формат');
      state.items = data.items;
      state.city = data.city || '';
      state.sector = data.sector || '';
      state.updated = data.updated_at || '';
      state.searched = true;
      $('result-title').textContent = data.city + ' · ' + data.sector;
      $('result-subtitle').textContent = 'Найдено ' + data.items.length + ' компаний · © OpenStreetMap · ' +
        (state.updated ? new Date(state.updated).toLocaleString('ru-RU') : 'данные из открытого источника');
      $('results-status').textContent = 'РЕЗУЛЬТАТЫ';
      if (data.partial) {
        $('notice').textContent = 'Публичный источник вернул неполные данные. Попробуй повторить запрос позднее.';
        $('notice').hidden = false;
      }
    } catch (e) {
      state.items = [];
      state.searched = false;
      $('result-title').textContent = 'Не удалось завершить поиск';
      $('result-subtitle').textContent = 'Публичный источник может быть перегружен.';
      $('results-status').textContent = 'ПОПРОБУЙ ЕЩЁ РАЗ';
      $('notice').textContent = 'Данные пока недоступны: ' +
        (e?.name === 'TimeoutError' ? 'превышено время ожидания сервера.' : e?.message || 'ошибка соединения.');
      $('notice').hidden = false;
    } finally {
      state.loading = false;
      $('search-submit').disabled = false;
      $('search-submit').textContent = 'Найти компании →';
      mode('search');
    }
  }

  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g,'""') + '"';
  }

  function exportCsv() {
    const list = resultData();
    if (!list.length) { showToast('Пока нечего выгружать'); return; }
    const columns = ['name','city','sector','website','phone','email','address','osm_url'];
    const lines = [columns.join(','), ...list.map(item => columns.map(key=>csvCell(item[key])).join(','))];
    const blob = new Blob(['\ufeff' + lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leadradar-' + (state.mode === 'saved'?'favorites':$('city').value+'-'+$('sector').value) + '.csv';
    document.body.append(a);a.click();a.remove();
    setTimeout(() => URL.revokeObjectURL(url),2500);
    showToast('CSV готов: ' + list.length + ' компаний');
  }

  $('search-form').addEventListener('submit',search);
  $('empty-start').addEventListener('click',() => {
    if (state.mode === 'saved') { mode('search'); return; }
    void search();
  });
  $('mode-search').addEventListener('click',()=>mode('search'));
  $('mode-saved').addEventListener('click',()=>mode('saved'));
  $('saved-count').textContent = state.favorites.length;
  ['text-filter','filter-site','filter-phone'].forEach((id) => {
    $(id).addEventListener(id === 'text-filter'?'input':'change',render);
  });
  $('clear-filters').addEventListener('click',()=>{
    $('text-filter').value = '';
    $('filter-site').checked = false;
    $('filter-phone').checked = false;
    render();
  });
  $('download').addEventListener('click',exportCsv);
  mode('search');
})();
