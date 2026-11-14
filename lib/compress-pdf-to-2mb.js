const copy = {
  "en": [
    "Compress PDF to 2 MB",
    "Combine PDFs and photos, reorder pages, and download a PDF that fits your upload limit.",
    "Add PDF, JPG, PNG or WebP files",
    "Size limit (MB)",
    "Prepare PDF",
    "Download PDF",
    "Before",
    "After",
    "Move up",
    "Move down",
    "Rotate",
    "Remove",
    "Processing…",
    "Could not read the file or create the PDF. Try a smaller, unlocked file.",
    "Could not meet this limit. Remove pages or choose a higher limit.",
    "Preview",
    "File is ready. Check legibility before sending.",
    "Choose files",
    "How to fit a PDF under 2 MB",
    "Add your documents and set the limit. Remove blank pages, put the remaining pages in order, then prepare the PDF. If the original pages fit, the tool keeps their content. If they need stronger compression, it creates image pages, so selectable text and interactive fields may be lost.",
    "How to combine photos on your phone",
    "Select photos from your gallery, use the arrow buttons to order them, and rotate sideways pages. Open the prepared PDF and zoom in on small print before downloading.",
    "What to do when an upload says the file is too large",
    "Check the portal’s exact limit, use a slightly smaller target if needed, and check all pages in the preview. Keep your original files, especially signed documents.",
    "Files are processed in your browser. Up to 50 pages and 50 MB of input.",
    "Earlier",
    "Later"
  ],
  "ru": [
    "Сжать PDF до 2 МБ",
    "Соберите PDF и фотографии, измените порядок страниц и скачайте документ, который подходит под лимит загрузки.",
    "Добавить PDF, JPG, PNG или WebP",
    "Лимит размера (МБ)",
    "Подготовить PDF",
    "Скачать PDF",
    "До",
    "После",
    "Выше",
    "Ниже",
    "Повернуть",
    "Удалить",
    "Обработка…",
    "Не удалось прочитать файл или создать PDF. Попробуйте файл меньшего размера без пароля.",
    "Не удалось уложиться в лимит. Удалите страницы или увеличьте лимит.",
    "Предпросмотр",
    "Файл готов. Проверьте читаемость перед отправкой.",
    "Выберите файлы",
    "Как сжать PDF до 2 МБ",
    "Добавьте документы и задайте лимит. Удалите пустые страницы и выставьте порядок. Если страницы укладываются в лимит, инструмент сохраняет их содержимое. При сильном сжатии страницы становятся изображениями, поэтому выделяемый текст и интерактивные поля могут пропасть.",
    "Как собрать фото в PDF на телефоне",
    "Выберите снимки из галереи, расставьте их стрелками и поверните боковые страницы. Перед скачиванием откройте готовый PDF и увеличьте мелкий текст.",
    "Что делать, если файл слишком большой",
    "Проверьте точный лимит на сайте, при необходимости задайте чуть меньший размер и просмотрите все страницы. Сохраните оригиналы, особенно если документ подписан.",
    "Файлы обрабатываются в браузере. До 50 страниц и 50 МБ исходных файлов.",
    "Раньше",
    "Позже"
  ]
};
export const uploadPdfTool = {
  id: 'compress-pdf-to-2mb',
  icon: '▤',
  en: {name: copy.en[0],title: 'Compress PDF to 2 MB Online — Free Document Tool',description: copy.en[1]},
  ru: {name: copy.ru[0],title: 'Сжать PDF до 2 МБ онлайн бесплатно',description: copy.ru[1]}
};
export function uploadPdfBody(lang, esc) {
  const w = copy[lang];
  return `<section class="section shell pdf-upload">
  <style>
  .pdf-upload{max-width:65rem}.pdf-upload h1{font-size:clamp(2rem,6vw,4.3rem);line-height:1.05}
  .pdf-controls,.pdf-page{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;margin:.7rem 0}
  .pdf-controls label{display:grid;gap:.35rem}.pdf-upload button,.pdf-upload input{font:inherit;padding:.5rem;border:1px solid #83978f;color:#172922;background:white;border-radius:.4rem;max-width:100%}
  .pdf-upload button:disabled{opacity:.5}.pdf-page{padding:.7rem;border-bottom:1px solid #9aada4}.pdf-page span{flex:1 1 13rem;overflow-wrap:anywhere}
  .pdf-upload [hidden]{display:none}.pdf-view{border:1px solid #83978f;padding:.8rem;border-radius:.6rem;margin:1rem 0}
  .pdf-view canvas{display:block;max-width:100%;height:auto;margin:.5rem auto}
  </style>
  <h1>${esc(w[0])}</h1><p>${esc(w[1])}</p><p>${esc(w[24])}</p>
  <div class="pdf-controls">
    <label>${esc(w[2])}<input id="up-files" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple></label>
    <label>${esc(w[3])}<input id="up-limit" type="number" min=".1" max="50" step=".1" value="2"></label>
    <button type="button" id="up-build" disabled>${esc(w[4])}</button>
    <a id="up-download" hidden download="prepared-document.pdf">${esc(w[5])}</a>
  </div>
  <p role="status" id="up-status"></p><div id="up-pages"></div>
  <section class="pdf-view" id="up-view" hidden>
    <h2>${esc(w[15])}</h2>
    <button type="button" id="up-prev">${esc(w[25])}</button>
    <span id="up-index"></span>
    <button type="button" id="up-next">${esc(w[26])}</button>
    <canvas id="up-canvas" aria-label="${esc(w[15])}"></canvas>
  </section>
  ${[18,20,22].map(i=>`<h2>${esc(w[i])}</h2><p>${esc(w[i+1])}</p>`).join('')}
  <script type="module">
    const words = ${JSON.stringify(w)};
    const el = id => document.getElementById('up-' + id);
    const files = el('files');
    const limit = el('limit');
    const status = el('status');
    const pages = [];
    let totalBytes = 0;
    let busy = false;
    let preview;
    let previewIndex = 1;
    let downloadUrl;
    let libraryPromise;

    function libraries() {
      libraryPromise ??= Promise.all([
        import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs'),
        import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js')
      ]).then(([reader, writer]) => {
        reader.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
        return {reader, writer};
      }).catch(error => { libraryPromise = undefined; throw error; });
      return libraryPromise;
    }

    function refresh() {
      files.disabled = limit.disabled = busy;
      el('build').disabled = busy || !pages.length;
      for (const button of el('pages').querySelectorAll('button')) {
        button.disabled = busy || button.dataset.unavailable === 'true';
      }
      el('prev').disabled = busy || previewIndex <= 1;
      el('next').disabled = busy || !preview || previewIndex >= preview.numPages;
    }

    function invalidate() {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = undefined;
      el('download').hidden = true;
      el('download').removeAttribute('href');
      el('view').hidden = true;
      if (preview) void preview.destroy().catch(() => {});
      preview = undefined;
    }

    function button(label, unavailable, action) {
      const control = document.createElement('button');
      control.type = 'button';
      control.textContent = label;
      control.dataset.unavailable = String(unavailable);
      control.addEventListener('click', () => {
        invalidate();
        status.textContent = '';
        action();
        showPages();
      });
      return control;
    }

    function showPages() {
      el('pages').replaceChildren();
      pages.forEach((entry,index) => {
        const row = document.createElement('div');
        row.className = 'pdf-page';
        const label = document.createElement('span');
        label.dir = 'auto';
        label.textContent = (index + 1) + '. ' + entry.file.name + (entry.document ? ' · ' + entry.number : '') + (entry.rotation ? ' · ' + entry.rotation + '°' : '');
        row.append(label,
          button(words[8], index === 0, () => { [pages[index-1],pages[index]] = [pages[index],pages[index-1]]; }),
          button(words[9], index === pages.length-1, () => { [pages[index],pages[index+1]] = [pages[index+1],pages[index]]; }),
          button(words[10], false, () => { entry.rotation = (entry.rotation + 90) % 360; }),
          button(words[11], false, () => {
            pages.splice(index,1);
            if (pages.some(page => page.file === entry.file)) return;
            totalBytes -= entry.file.size;
            if (entry.document) {
              void entry.document.destroy().catch(() => {});
            }
          }));
        el('pages').append(row);
      });
      refresh();
    }

    files.addEventListener('change', async () => {
      const selection = [...files.files];
      files.value = '';
      if (!selection.length) return;
      if (totalBytes + selection.reduce((sum,file) => sum + file.size,0) > 50000000) {
        status.textContent = words[24];
        return;
      }
      busy = true;
      refresh();
      status.textContent = words[12];
      const imported = [];
      const opened = [];
      try {
        const {reader} = await libraries();
        for (const file of selection) {
          if (/\\.pdf$/i.test(file.name)) {
            const doc = await reader.getDocument({data: new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise;
            opened.push(doc);
            if (pages.length + imported.length + doc.numPages > 50) throw new RangeError();
            for (let number = 1; number <= doc.numPages; number++) imported.push({file, document: doc, number, rotation: 0});
          } else {
            if (!/\\.(jpe?g|png|webp)$/i.test(file.name)) throw new Error();
            const bitmap = await createImageBitmap(file);
            bitmap.close();
            imported.push({file, rotation:0});
          }
          if (pages.length + imported.length > 50) throw new RangeError();
        }
        invalidate();
        pages.push(...imported);
        totalBytes += selection.reduce((sum,file) => sum + file.size,0);
        status.textContent = '';
      } catch (error) {
        await Promise.allSettled(opened.map(doc => doc.destroy()));
        status.textContent = error instanceof RangeError ? words[24] : words[13];
      } finally {
        busy = false;
        showPages();
      }
    });

    async function imagePage(entry, maxPixels, quality) {
      const canvas = document.createElement('canvas');
      let pageWidth, pageHeight;
      if (entry.document) {
        const page = await entry.document.getPage(entry.number);
        const rotation = (page.rotate + entry.rotation) % 360;
        const base = page.getViewport({scale: 1, rotation});
        pageWidth = base.width;
        pageHeight = base.height;
        const viewport = page.getViewport({scale: Math.min(2, maxPixels/Math.max(base.width,base.height)), rotation});
        canvas.width = Math.max(1,Math.ceil(viewport.width));
        canvas.height = Math.max(1,Math.ceil(viewport.height));
        await page.render({canvasContext:canvas.getContext('2d',{alpha:false}), viewport}).promise;
        page.cleanup();
      } else {
        const image = await createImageBitmap(entry.file);
        try {
          const scale = Math.min(1,maxPixels/Math.max(image.width,image.height));
          const width = Math.max(1,Math.round(image.width*scale));
          const height = Math.max(1,Math.round(image.height*scale));
          const rotated = entry.rotation % 180 !== 0;
          canvas.width = rotated ? height : width;
          canvas.height = rotated ? width : height;
          const context = canvas.getContext('2d',{alpha:false});
          context.fillStyle = 'white';
          context.fillRect(0,0,canvas.width,canvas.height);
          context.translate(canvas.width/2,canvas.height/2);
          context.rotate(entry.rotation*Math.PI/180);
          context.drawImage(image,-width/2,-height/2,width,height);
          const fit = Math.min(1,842/Math.max(canvas.width,canvas.height));
          pageWidth = canvas.width*fit;
          pageHeight = canvas.height*fit;
        } finally {
          image.close();
        }
      }
      const jpeg = await new Promise((resolve,reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error()),'image/jpeg',quality));
      canvas.width = canvas.height = 1;
      return {jpeg, pageWidth, pageHeight};
    }

    async function buildPdf(writer, rasterize, maxPixels, quality) {
      const output = await writer.PDFDocument.create();
      const originals = new Map();
      for (const entry of pages) {
        if (entry.document && !rasterize) {
          if (!originals.has(entry.file)) originals.set(entry.file,await writer.PDFDocument.load(await entry.file.arrayBuffer()));
          const [page] = await output.copyPages(originals.get(entry.file),[entry.number-1]);
          page.setRotation(writer.degrees((page.getRotation().angle+entry.rotation)%360));
          output.addPage(page);
        } else {
          const {jpeg,pageWidth,pageHeight} = await imagePage(entry,maxPixels,quality);
          const image = await output.embedJpg(await jpeg.arrayBuffer());
          output.addPage([pageWidth,pageHeight]).drawImage(image,{x:0,y:0,width:pageWidth,height:pageHeight});
        }
      }
      return output.save();
    }

    async function showPreview() {
      const page = await preview.getPage(previewIndex);
      const canvas = el('canvas');
      const base = page.getViewport({scale:1});
      const viewport = page.getViewport({scale:Math.min(2,1050/Math.max(base.width,base.height))});
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport}).promise;
      page.cleanup();
      el('index').textContent = previewIndex + ' / ' + preview.numPages;
      el('view').hidden = false;
    }

    el('build').addEventListener('click',async () => {
      if (!limit.reportValidity() || !pages.length) return;
      invalidate();
      busy = true;
      refresh();
      status.textContent = words[12];
      try {
        const {reader,writer} = await libraries();
        const max = Math.floor(Number(limit.value)*1000000);
        let bytes;
        try { bytes = await buildPdf(writer,false,2000,.9); } catch {}
        if (!bytes || bytes.length > max) {
          for (const [pixels,quality] of [[1600,.82],[1200,.7],[900,.57],[650,.44]]) {
            bytes = await buildPdf(writer,true,pixels,quality);
            if (bytes.length <= max) break;
          }
        }
        if (bytes.length > max) { status.textContent = words[14]; return; }
        downloadUrl = URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
        el('download').href = downloadUrl;
        el('download').hidden = false;
        const formatted = new Intl.NumberFormat(document.documentElement.lang,{maximumFractionDigits:3});
        status.textContent = words[16] + ' ' + words[6] + ' ' + formatted.format(totalBytes/1000000) + ' MB · ' + words[7] + ' ' + formatted.format(bytes.length/1000000) + ' MB';
        preview = await reader.getDocument({data:bytes,isEvalSupported:false}).promise;
        previewIndex = 1;
        await showPreview();
      } catch {
        invalidate();
        status.textContent = words[13];
      } finally {
        busy = false;
        refresh();
      }
    });
    for (const [id,delta] of [['prev',-1],['next',1]]) {
      el(id).addEventListener('click',async () => {
        busy = true;
        refresh();
        try { previewIndex += delta; await showPreview(); }
        catch { status.textContent = words[13]; }
        finally { busy = false; refresh(); }
      });
    }
    limit.addEventListener('input',() => { invalidate(); status.textContent = ''; refresh(); });
  </script>
  </section>`;
}
