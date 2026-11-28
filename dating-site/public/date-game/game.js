import { locales } from './locales.js';

const main = document.getElementById('game');
const selector = document.getElementById('language');
const params = new URLSearchParams(location.search);
const pathLanguage = /^\/([a-z]{2})\/date-game\/$/.exec(location.pathname)?.[1];
const candidates = [params.get('lang'), pathLanguage, document.documentElement.lang, ...(navigator.languages || [navigator.language])];
let lang = candidates.map(value => value?.toLowerCase().split('-')[0])
  .find(value => Object.hasOwn(locales, value)) || 'en';
let challenge = readChallenge();
let selections = [];
let screen = challenge ? 'guess' : 'create';
let adult = false;
try { adult = localStorage.getItem('mm-over18') === 'yes'; } catch { /* Storage is optional. */ }

function readChallenge() {
  return /^#v1-([01]{3})$/.exec(location.hash)?.[1] || '';
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(text, className, action) {
  const node = element('button', className, text);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function draw(focusHeading = false) {
  const t = locales[lang];
  selector.value = lang;
  document.documentElement.lang = lang;
  document.title = t.title + ' · MurdiliMax';
  document.querySelector('.language span').textContent = t.language;
  const catalog = document.getElementById('catalog');
  catalog.textContent = t.catalog;
  const home = lang === 'ru' ? '/' : '/' + lang + '/';
  catalog.href = home + '?utm_source=date_game#catalog';
  document.querySelector('.brand').href = home + '?utm_source=date_game';

  const title = !adult ? t.ageTitle : screen === 'ready' ? t.readyTitle : screen === 'result' ? t.resultTitle : t.title;
  const heading = element('h1', 'game-title', title);
  heading.tabIndex = -1;
  main.replaceChildren(heading);
  if (!adult) {
    const actions = element('div', 'actions');
    const enter = button(t.enterAge, 'primary', () => {
      adult = true;
      try { localStorage.setItem('mm-over18', 'yes'); } catch { /* Continue for this visit. */ }
      draw(true);
    });
    enter.id = 'enter-age';
    actions.append(enter, button(t.leaveAge, 'secondary', () => location.replace('https://www.google.com/')));
    main.append(actions);
  } else if (screen === 'ready') {
    drawShare(t);
  } else if (screen === 'result') {
    drawResult(t);
  } else {
    drawForm(t);
  }
  if (focusHeading) heading.focus();
}

function drawForm(t) {
  main.append(element('p', 'intro', screen === 'guess' ? t.guessIntro : t.createIntro));
  const form = element('form', 'choices');
  t.questions.forEach((question, index) => {
    const group = element('fieldset', 'choice-group');
    group.append(element('legend', '', question.title));
    const options = element('div', 'options');
    question.choices.forEach((text, value) => {
      const label = element('label', 'option');
      const radio = element('input');
      radio.type = 'radio';
      radio.name = 'choice-' + index;
      radio.value = String(value);
      radio.required = true;
      radio.checked = selections[index] === radio.value;
      radio.addEventListener('change', () => { selections[index] = radio.value; });
      label.append(radio, element('span', '', text));
      options.append(label);
    });
    group.append(options);
    form.append(group);
  });
  const submit = element('button', 'primary', screen === 'guess' ? t.guessButton : t.createButton);
  submit.type = 'submit';
  form.append(submit);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    selections = t.questions.map((_, i) => values.get('choice-' + i));
    screen = challenge ? 'result' : 'ready';
    draw(true);
  });
  main.append(form);
}

function makeShareUrl() {
  const url = new URL(lang === 'en' ? '/date-game/' : '/' + lang + '/date-game/', location.origin);
  url.searchParams.set('lang', lang);
  url.searchParams.set('utm_source', 'date_game');
  url.hash = 'v1-' + selections.join('');
  return url.href;
}

function restart() {
  challenge = '';
  selections = [];
  screen = 'create';
  const url = new URL(location.href);
  url.hash = '';
  url.searchParams.delete('utm_source');
  history.replaceState(null, '', url);
  draw(true);
}

function drawShare(t) {
  const url = makeShareUrl();
  main.append(element('p', 'intro', t.shareIntro));
  const actions = element('div', 'actions');
  const status = element('p', 'status');
  status.setAttribute('role', 'status');
  const field = element('input', 'share-url');
  field.hidden = true;
  field.readOnly = true;
  field.setAttribute('aria-label', t.copy);
  field.value = url;
  const selectLink = () => {
    field.hidden = false;
    status.textContent = t.manualCopy;
    field.focus();
    field.select();
  };
  if (typeof navigator.share === 'function') {
    actions.append(button(t.share, 'primary', async () => {
      try { await navigator.share({ text: t.shareText, url }); }
      catch (error) { if (error.name !== 'AbortError') selectLink(); }
    }));
  }
  const telegram = element('a', 'secondary telegram', t.telegram);
  const telegramUrl = new URL('https://t.me/share/url');
  telegramUrl.searchParams.set('url', url);
  telegramUrl.searchParams.set('text', t.shareText);
  telegram.href = telegramUrl.href;
  telegram.target = '_blank';
  telegram.rel = 'noopener noreferrer';
  const copy = button(t.copy, (actions.childElementCount ? 'secondary' : 'primary') + ' copy', async () => {
    try { await navigator.clipboard.writeText(url); status.textContent = t.copied; }
    catch { selectLink(); }
  });
  const whatsapp = element('a', 'secondary whatsapp', 'WhatsApp');
  const whatsappUrl = new URL('https://wa.me/');
  whatsappUrl.searchParams.set('text', t.shareText + ' ' + url);
  whatsapp.href = whatsappUrl.href;
  whatsapp.target = '_blank'; whatsapp.rel = 'noopener noreferrer';
  actions.append(copy, telegram, whatsapp, button(t.again, 'secondary', restart));
  main.append(actions, field, status);
}

function drawResult(t) {
  let score = 0;
  const list = element('ol', 'results');
  t.questions.forEach((question, index) => {
    const correct = selections[index] === challenge[index];
    if (correct) score++;
    const item = element('li', correct ? 'match' : 'miss');
    item.append(element('strong', '', question.title), element('p', '', (correct ? '✓ ' : '× ') + t.answer + ' ' + question.choices[Number(challenge[index])]));
    list.append(item);
  });
  const actions = element('div', 'actions');
  const browse = element('a', 'secondary', t.catalog);
  browse.href = (lang === 'ru' ? '/' : '/' + lang + '/') + '?utm_source=date_game#catalog';
  actions.append(button(t.again, 'primary', restart), browse);
  main.append(element('p', 'score', t.score.replace('{n}', String(score))), list, actions);
}

selector.addEventListener('change', () => {
  lang = selector.value;
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
  draw();
});
window.addEventListener('hashchange', () => {
  challenge = readChallenge();
  selections = [];
  screen = challenge ? 'guess' : 'create';
  draw(true);
});
draw();
import('../traffic.js?v=20261127-game').catch(() => {});
