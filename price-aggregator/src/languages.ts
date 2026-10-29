/**
 * Supported recognition languages in multilingual OpenAI Whisper.
 * Values are Whisper language codes from openai/whisper tokenizer.py.
 * Display names are localized by the browser (Intl.DisplayNames).
 */
export const WHISPER_LANGUAGES: ReadonlyArray<readonly [string, string]> = [
  ['en', 'english'],
  ['zh', 'chinese'],
  ['de', 'german'],
  ['es', 'spanish'],
  ['ru', 'russian'],
  ['ko', 'korean'],
  ['fr', 'french'],
  ['ja', 'japanese'],
  ['pt', 'portuguese'],
  ['tr', 'turkish'],
  ['pl', 'polish'],
  ['ca', 'catalan'],
  ['nl', 'dutch'],
  ['ar', 'arabic'],
  ['sv', 'swedish'],
  ['it', 'italian'],
  ['id', 'indonesian'],
  ['hi', 'hindi'],
  ['fi', 'finnish'],
  ['vi', 'vietnamese'],
  ['he', 'hebrew'],
  ['uk', 'ukrainian'],
  ['el', 'greek'],
  ['ms', 'malay'],
  ['cs', 'czech'],
  ['ro', 'romanian'],
  ['da', 'danish'],
  ['hu', 'hungarian'],
  ['ta', 'tamil'],
  ['no', 'norwegian'],
  ['th', 'thai'],
  ['ur', 'urdu'],
  ['hr', 'croatian'],
  ['bg', 'bulgarian'],
  ['lt', 'lithuanian'],
  ['la', 'latin'],
  ['mi', 'maori'],
  ['ml', 'malayalam'],
  ['cy', 'welsh'],
  ['sk', 'slovak'],
  ['te', 'telugu'],
  ['fa', 'persian'],
  ['lv', 'latvian'],
  ['bn', 'bengali'],
  ['sr', 'serbian'],
  ['az', 'azerbaijani'],
  ['sl', 'slovenian'],
  ['kn', 'kannada'],
  ['et', 'estonian'],
  ['mk', 'macedonian'],
  ['br', 'breton'],
  ['eu', 'basque'],
  ['is', 'icelandic'],
  ['hy', 'armenian'],
  ['ne', 'nepali'],
  ['mn', 'mongolian'],
  ['bs', 'bosnian'],
  ['kk', 'kazakh'],
  ['sq', 'albanian'],
  ['sw', 'swahili'],
  ['gl', 'galician'],
  ['mr', 'marathi'],
  ['pa', 'punjabi'],
  ['si', 'sinhala'],
  ['km', 'khmer'],
  ['sn', 'shona'],
  ['yo', 'yoruba'],
  ['so', 'somali'],
  ['af', 'afrikaans'],
  ['oc', 'occitan'],
  ['ka', 'georgian'],
  ['be', 'belarusian'],
  ['tg', 'tajik'],
  ['sd', 'sindhi'],
  ['gu', 'gujarati'],
  ['am', 'amharic'],
  ['yi', 'yiddish'],
  ['lo', 'lao'],
  ['uz', 'uzbek'],
  ['fo', 'faroese'],
  ['ht', 'haitian creole'],
  ['ps', 'pashto'],
  ['tk', 'turkmen'],
  ['nn', 'nynorsk'],
  ['mt', 'maltese'],
  ['sa', 'sanskrit'],
  ['lb', 'luxembourgish'],
  ['my', 'myanmar'],
  ['bo', 'tibetan'],
  ['tl', 'tagalog'],
  ['mg', 'malagasy'],
  ['as', 'assamese'],
  ['tt', 'tatar'],
  ['haw', 'hawaiian'],
  ['ln', 'lingala'],
  ['ha', 'hausa'],
  ['ba', 'bashkir'],
  ['jw', 'javanese'],
  ['su', 'sundanese'],
  ['yue', 'cantonese']
];

const suggested = ['ru', 'en', 'lv', 'uk', 'pl', 'de', 'fr', 'es', 'lt', 'et', 'it', 'pt', 'tr', 'ar', 'zh', 'ja', 'ko'];

function getName(code: string, englishName: string, names: Intl.DisplayNames): string {
  try {
    const name = names.of(code);
    return name && name.toLowerCase() !== code.toLowerCase() ? name : englishName;
  } catch {
    return englishName;
  }
}

const languageNames = new Intl.DisplayNames(['ru'], { type: 'language' });
export const LANGUAGE_OPTIONS = WHISPER_LANGUAGES.map(([code, english]) => ({
  code, english, label: getName(code, english, languageNames)
})).sort((a, b) => {
  const pa = suggested.indexOf(a.code);
  const pb = suggested.indexOf(b.code);
  if (pa >= 0 && pb >= 0) return pa - pb;
  if (pa >= 0) return -1;
  if (pb >= 0) return 1;
  return a.label.localeCompare(b.label, 'ru');
});

export function matchLanguages(query: string, current: string) {
  const search = query.trim().toLocaleLowerCase('ru');
  const filtered = LANGUAGE_OPTIONS.filter(item =>
    !search || [item.label, item.english, item.code].some(value => value.toLocaleLowerCase('ru').includes(search))
  );
  // A controlled select must always have a matching option.
  const selected = LANGUAGE_OPTIONS.find(item => item.code === current);
  return selected && !filtered.some(item => item.code === selected.code) ? [selected, ...filtered] : filtered;
}
