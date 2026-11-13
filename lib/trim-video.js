export const trimTool = {
  "id": "trim-video",
  "icon": "✂",
  "en": {
    "name": "Trim MP4 video online",
    "title": "Trim MP4 Video Online — Free Video Cutter",
    "description": "Choose the start and end of an MP4 video and download the trimmed clip. Your video is processed in your browser."
  },
  "ru": {
    "name": "Обрезать MP4 онлайн",
    "title": "Обрезать видео MP4 онлайн бесплатно",
    "description": "Выберите начало и конец видео и скачайте обрезанный MP4. Файл обрабатывается в браузере."
  }
};

export function trimToolBody(lang, esc) {
  const t = (en, ru) => lang === 'ru' ? ru : en;
  const words = trimTool[lang];
  return `<section class="section shell clip-tool">
    <style>
      .clip-tool{max-width:54rem}.clip-tool h1{font-size:clamp(2rem,6vw,4rem);line-height:1.1;margin:0 0 1rem}
      .clip-tool form{display:grid;gap:1rem;border:1px solid #83978f;border-radius:1rem;padding:clamp(1rem,4vw,2rem);margin:1.5rem 0}
      .clip-tool video{width:100%;max-height:55vh;background:#101c20;border-radius:.6rem}
      .clip-tool label{display:grid;gap:.35rem;min-width:0}.clip-tool input{width:100%;min-width:0}
      .clip-tool input,.clip-tool button{font:inherit;padding:.55rem;border:1px solid #83978f;border-radius:.4rem;color:#152922;background:#fff}
      .clip-tool button{cursor:pointer}.clip-tool button:disabled{opacity:.55;cursor:default}
      .clip-tool .clip-primary{color:white;background:#195743}
      .clip-range{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}.clip-range button{margin-top:.4rem}
      .clip-actions{display:flex;flex-wrap:wrap;align-items:center;gap:1rem}
      .clip-tool progress{width:100%}.clip-tool [hidden]{display:none}
    </style>
    <h1>${esc(words.name)}</h1><p>${esc(words.description)}</p>
    <form id="clip-form">
      <label>${t('Select an MP4 file (up to 100 MB)','Выберите MP4 (до 100 МБ)')}
        <input id="clip-file" type="file" accept=".mp4,video/mp4" required>
      </label>
      <video id="clip-video" controls playsinline preload="metadata" hidden></video>
      <p id="clip-duration" hidden></p>
      <div class="clip-range">
        <div><label>${t('Start (seconds)','Начало (секунды)')}<input id="clip-start" type="number" min="0" step="any" value="0" required></label>
        <button type="button" id="clip-mark-start" disabled>${t('Use playback position','Взять позицию плеера')}</button></div>
        <div><label>${t('End (seconds)','Конец (секунды)')}<input id="clip-end" type="number" min="0" step="any" required></label>
        <button type="button" id="clip-mark-end" disabled>${t('Use playback position','Взять позицию плеера')}</button></div>
      </div>
      <div class="clip-actions">
        <button type="submit" id="clip-export" class="clip-primary" disabled>${t('Trim video','Обрезать видео')}</button>
        <a id="clip-download" hidden>${t('Download MP4','Скачать MP4')}</a>
      </div>
      <progress id="clip-progress" max="1" value="0" aria-label="${t('Export progress','Ход экспорта')}" hidden></progress>
      <p id="clip-status" role="status"></p>
    </form>
    <p>${t('For best compatibility, use an MP4 with H.264 video and AAC audio. Export support depends on your browser and device.','Для лучшей совместимости используйте MP4 с видео H.264 и звуком AAC. Поддержка экспорта зависит от браузера и устройства.')}</p>
    <p><a href="https://github.com/Vanilagy/mediabunny">Mediabunny</a></p>
    <script type="module">
      const get = id => document.getElementById('clip-' + id);
      const form = get('form');
      const picker = get('file');
      const video = get('video');
      const start = get('start');
      const end = get('end');
      const submit = get('export');
      const marks = [get('mark-start'), get('mark-end')];
      const status = get('status');
      const progress = get('progress');
      const download = get('download');
      let sourceUrl;
      let resultUrl;
      let source;
      let ready = false;
      let busy = false;

      function clearResult() {
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        resultUrl = undefined;
        download.hidden = true;
        download.removeAttribute('href');
      }

      function updateControls() {
        picker.disabled = busy;
        start.disabled = end.disabled = submit.disabled = !ready || busy;
        for (const mark of marks) mark.disabled = !ready || busy;
      }

      picker.addEventListener('change', () => {
        ready = false;
        source = undefined;
        updateControls();
        clearResult();
        status.textContent = '';
        get('duration').hidden = true;
        video.hidden = true;
        video.removeAttribute('src');
        video.load();
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        sourceUrl = undefined;
        const file = picker.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.mp4') || file.size > 100_000_000 || !file.size) {
          status.textContent = ${JSON.stringify(t('Choose a non-empty MP4 file up to 100 MB.','Выберите непустой MP4 размером до 100 МБ.'))};
          return;
        }
        source = file;
        sourceUrl = URL.createObjectURL(file);
        video.src = sourceUrl;
      });

      video.addEventListener('loadedmetadata', () => {
        ready = Boolean(source) && Number.isFinite(video.duration) && video.duration > 0;
        if (ready) {
          start.value = '0';
          end.value = String(video.duration);
          start.max = end.max = String(video.duration);
          get('duration').textContent = ${JSON.stringify(t('Duration (seconds) ','Длительность (секунды) '))} + video.duration.toFixed(2);
          get('duration').hidden = false;
          video.hidden = false;
        }
        updateControls();
      });

      video.addEventListener('error', () => {
        if (!source) return;
        ready = false;
        video.hidden = true;
        updateControls();
        status.textContent = ${JSON.stringify(t('This MP4 could not be opened in your browser.','Браузер не смог открыть этот MP4.'))};
      });

      for (const [index, field] of [start, end].entries()) {
        field.addEventListener('input', clearResult);
        marks[index].addEventListener('click', () => {
          field.value = String(video.currentTime);
          clearResult();
        });
      }

      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!ready || busy) return;
        const from = start.valueAsNumber;
        const to = end.valueAsNumber;
        if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to <= from || to > video.duration) {
          status.textContent = ${JSON.stringify(t('Set an end time after the start and within the video.','Укажите конец после начала и в пределах длительности видео.'))};
          return;
        }
        busy = true;
        video.pause();
        updateControls();
        clearResult();
        progress.value = 0;
        progress.hidden = false;
        status.textContent = ${JSON.stringify(t('Preparing export…','Готовим экспорт…'))};
        let input;
        try {
          const {Input, BlobSource, MP4, Output, Mp4OutputFormat, BufferTarget, Conversion} =
            await import('https://cdn.jsdelivr.net/npm/mediabunny@1.66.0/+esm');
          input = new Input({source: new BlobSource(source), formats: [MP4]});
          const target = new BufferTarget();
          const output = new Output({format: new Mp4OutputFormat(), target});
          const conversion = await Conversion.init({
            input, output, trim: {start: from, end: to},
            video: {codec: 'avc'},
            audio: {codec: 'aac'}
          });
          if (!conversion.isValid || conversion.discardedTracks.some(({track}) => track.isVideoTrack() || track.isAudioTrack())) {
            throw new Error('Unsupported tracks');
          }
          conversion.onProgress = value => { progress.value = value; };
          await conversion.execute();
          if (!target.buffer?.byteLength) throw new Error('Empty export');
          resultUrl = URL.createObjectURL(new Blob([target.buffer], {type: 'video/mp4'}));
          download.href = resultUrl;
          download.download = source.name.slice(0, -4) + '-trimmed.mp4';
          download.hidden = false;
          status.textContent = ${JSON.stringify(t('Your clip is ready.','Фрагмент готов.'))};
        } catch {
          status.textContent = ${JSON.stringify(t('Export failed. Try a smaller H.264/AAC MP4 in a current version of Chrome or Edge.','Экспорт не удался. Попробуйте MP4 меньшего размера с H.264/AAC в актуальной версии Chrome или Edge.'))};
        } finally {
          input?.dispose();
          busy = false;
          progress.hidden = true;
          updateControls();
        }
      });
      updateControls();
    </script>
  </section>`;
}
