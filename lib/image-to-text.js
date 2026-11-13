export const ocrTool = {
  "id": "image-to-text",
  "icon": "▤",
  "en": {
    "name": "Image to text",
    "title": "Image to Text — Free Screenshot OCR",
    "description": "Paste a screenshot or choose a photo, then copy or download the recognized English or Russian text. Images are processed in your browser."
  },
  "ru": {
    "name": "Текст с фото",
    "title": "Распознать текст с фото и скриншота онлайн",
    "description": "Вставьте скриншот или выберите фото. Скопируйте или скачайте распознанный русский и английский текст. Фото обрабатывается в браузере."
  }
};

export function ocrToolBody(lang, esc) {
  const t = (en, ru) => lang === 'ru' ? ru : en;
  const words = ocrTool[lang];
  return `<section class="section shell ocr-tool">
    <style>
      .ocr-tool{max-width:64rem}.ocr-tool h1{font-size:clamp(2.5rem,7vw,5rem);line-height:1.05;margin:0 0 1rem}
      .ocr-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.5rem 0}
      .ocr-panel{display:grid;gap:.8rem;align-content:start;min-width:0;border:1px solid #8caaa0;border-radius:1rem;padding:clamp(.9rem,3vw,1.6rem)}
      .ocr-panel label{display:grid;gap:.35rem}.ocr-panel button,.ocr-panel select,.ocr-panel textarea,.ocr-panel input{font:inherit;color:#192d26;background:#fff;border:1px solid #83978f;border-radius:.5rem;padding:.55rem;min-width:0;max-width:100%}
      .ocr-panel button{cursor:pointer}.ocr-panel button:disabled{opacity:.55;cursor:default}.ocr-panel .ocr-primary{color:#fff;background:#195743}
      .ocr-panel img{max-width:100%;max-height:320px;object-fit:contain}.ocr-actions{display:flex;flex-wrap:wrap;gap:.65rem}.ocr-tool [hidden]{display:none}
      @media(max-width:740px){.ocr-grid{grid-template-columns:1fr}}
    </style>
    <h1>${esc(words.name)}</h1><p>${esc(words.description)}</p>
    <div class="ocr-grid">
      <form id="ocr-form" class="ocr-panel">
        <label>${t('Choose a PNG, JPEG or WebP image (up to 15 MB)','Выберите PNG, JPEG или WebP (до 15 МБ)')}
          <input id="ocr-file" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp">
        </label>
        <p>${t('You can also paste an image with Ctrl+V or ⌘+V.','Можно также вставить картинку через Ctrl+V или ⌘+V.')}</p>
        <img id="ocr-preview" alt="${t('Selected image','Выбранное изображение')}" hidden>
        <label>${t('Text language','Язык текста')}
          <select id="ocr-language"><option value="eng">${t('English','Английский')}</option><option value="rus"${lang==='ru'?' selected':''}>${t('Russian','Русский')}</option><option value="both">${t('English + Russian','Английский + русский')}</option></select>
        </label>
        <button type="submit" id="ocr-run" class="ocr-primary" disabled>${t('Recognize text','Распознать текст')}</button>
        <progress id="ocr-progress" max="1" aria-label="${t('Recognition progress','Ход распознавания')}" hidden></progress>
        <p id="ocr-status" role="status"></p>
      </form>
      <div class="ocr-panel">
        <label>${t('Recognized text (editable)','Распознанный текст (можно исправить)')}
          <textarea id="ocr-result" rows="12" dir="auto" spellcheck="false"></textarea>
        </label>
        <div class="ocr-actions">
          <button type="button" id="ocr-copy" disabled>${t('Copy text','Скопировать')}</button>
          <button type="button" id="ocr-download" disabled>${t('Download TXT','Скачать TXT')}</button>
        </div>
      </div>
    </div>
    <h2>${t('Copy text from a screenshot','Как скопировать текст со скриншота')}</h2>
    <p>${t('Capture just the part you need, paste it here and choose the language. A sharp screenshot of an error message, a slide or a scanned page works best. Check names and numbers before using the result.','Сделайте скриншот нужного участка, вставьте его сюда и выберите язык. Лучше всего подходят чёткие снимки сообщений об ошибках, слайдов и печатных страниц. Проверьте имена и числа в результате.')}</p>
    <p>${t('The first run downloads the OCR engine and language data.','При первом запуске загружаются модуль распознавания и языковые данные.')} <a href="https://github.com/naptha/tesseract.js">Tesseract.js</a></p>
    <script>
    (() => {
      const get = id => document.getElementById('ocr-' + id);
      const fileInput = get('file');
      const preview = get('preview');
      const language = get('language');
      const result = get('result');
      const status = get('status');
      const progress = get('progress');
      let image;
      let previewUrl;
      let busy = false;
      let engine;

      function update() {
        get('run').disabled = !image || busy;
        fileInput.disabled = language.disabled = busy;
        get('copy').disabled = get('download').disabled = busy || !result.value.trim();
      }

      function selectImage(file) {
        if (!file) return;
        if (!/^image\\/(png|jpeg|webp)$/.test(file.type) || !file.size || file.size > 15000000) {
          status.textContent = ${JSON.stringify(t('Choose a PNG, JPEG or WebP image up to 15 MB.','Выберите PNG, JPEG или WebP до 15 МБ.'))};
          return;
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        image = file;
        previewUrl = URL.createObjectURL(file);
        preview.src = previewUrl;
        preview.hidden = false;
        result.value = '';
        status.textContent = '';
        update();
      }

      function loadEngine() {
        engine ??= new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
          script.onload = () => window.Tesseract?.createWorker ? resolve(window.Tesseract) : reject(new Error('OCR engine unavailable'));
          script.onerror = () => reject(new Error('OCR engine unavailable'));
          document.head.append(script);
        }).catch(error => { engine = undefined; throw error; });
        return engine;
      }

      fileInput.addEventListener('change', () => selectImage(fileInput.files[0]));
      document.addEventListener('paste', event => {
        if (busy) return;
        const pasted = [...(event.clipboardData?.files || [])].find(file => file.type.startsWith('image/'));
        if (!pasted) return;
        event.preventDefault();
        fileInput.value = '';
        selectImage(pasted);
      });
      get('form').addEventListener('submit', async event => {
        event.preventDefault();
        if (!image || busy) return;
        busy = true;
        update();
        status.textContent = ${JSON.stringify(t('Loading OCR…','Загружаем распознавание…'))};
        progress.hidden = false;
        progress.removeAttribute('value');
        let worker;
        try {
          const library = await loadEngine();
          const langs = language.value === 'both' ? ['eng','rus'] : language.value;
          worker = await library.createWorker(langs, 1, {logger(message) {
            if (message.status === 'recognizing text') {
              status.textContent = ${JSON.stringify(t('Recognizing text…','Распознаём текст…'))};
              progress.value = message.progress;
            }
          }});
          const {data} = await worker.recognize(image);
          result.value = data.text.trim();
          status.textContent = result.value
            ? ${JSON.stringify(t('Text is ready.','Текст готов.'))}
            : ${JSON.stringify(t('No text found. Try a sharper image or a different language.','Текст не найден. Попробуйте более чёткое изображение или другой язык.'))};
        } catch {
          status.textContent = ${JSON.stringify(t('Recognition failed. Check your connection and try another image.','Распознавание не удалось. Проверьте подключение и попробуйте другое изображение.'))};
        } finally {
          if (worker) await worker.terminate().catch(() => {});
          busy = false;
          progress.hidden = true;
          update();
        }
      });
      result.addEventListener('input', update);
      get('copy').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(result.value);
          status.textContent = ${JSON.stringify(t('Copied.','Скопировано.'))};
        } catch {
          result.focus();
          result.select();
          status.textContent = ${JSON.stringify(t('Text selected. Use your device’s copy command.','Текст выделен. Скопируйте его командой вашего устройства.'))};
        }
      });
      get('download').addEventListener('click', () => {
        const url = URL.createObjectURL(new Blob([result.value], {type:'text/plain;charset=utf-8'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'recognized-text.txt';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      update();
    })();
    </script>
  </section>`;
}
