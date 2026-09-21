import { useEffect } from 'react';

type Lang = 'lv' | 'ru';

const STORAGE_KEY = 'cenaradar:lang';

const normalizeLabel = (value: string | null | undefined): Lang | null => {
  const label = (value ?? '').trim().toUpperCase();
  if (label === 'LV') return 'lv';
  if (label === 'RU') return 'ru';
  return null;
};

export default function LanguageGuard() {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('translate', 'no');

    const shell = document.querySelector<HTMLElement>('.cr-shell');
    const switcher = document.querySelector<HTMLElement>('.cr-lang');
    shell?.setAttribute('translate', 'no');
    shell?.classList.add('notranslate');
    switcher?.setAttribute('translate', 'no');
    switcher?.classList.add('notranslate');

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.cr-lang button'));
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;

    if (saved === 'lv' || saved === 'ru') {
      const active = buttons.find(button => button.classList.contains('active'));
      const activeLang = normalizeLabel(active?.textContent);
      if (activeLang !== saved) {
        buttons.find(button => normalizeLabel(button.textContent) === saved)?.click();
      }
      html.lang = saved;
    } else {
      const active = buttons.find(button => button.classList.contains('active'));
      const activeLang = normalizeLabel(active?.textContent);
      if (activeLang) {
        localStorage.setItem(STORAGE_KEY, activeLang);
        html.lang = activeLang;
      }
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('.cr-lang button');
      if (!button) return;

      const nextLang = normalizeLabel(button.textContent);
      if (!nextLang) return;

      localStorage.setItem(STORAGE_KEY, nextLang);
      html.lang = nextLang;
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
