
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, AudioLines, BadgeCheck, Check, ChevronDown,
  CircleHelp, Clock3, CloudOff, Code2, Download, Film, FileAudio, FileVideo,
  Globe2, Info, Languages, LockKeyhole, Menu, Mic2, Play, Plus,
  Scissors, ShieldCheck, Sparkles, Subtitles, Trash2, UploadCloud, WandSparkles, X
} from 'lucide-react';

type Caption = { id: number; start: number; end: number; text: string };
type Tab = 'studio' | 'how' | 'pricing';
type Preset = 'classic' | 'bold' | 'neon';
type Output = { text?: string; chunks?: { timestamp?: [number | null, number | null]; text?: string }[] };
const MODEL_ID = 'onnx-community/whisper-tiny';
const MAX_FILE_SIZE = 150 * 1024 * 1024;
let enginePromise: Promise<any> | null = null;
let asrPromise: Promise<any> | null = null;

function timecode(seconds: number, kind: 'srt' | 'vtt' = 'srt') {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
  const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  const rest = (ms % 1000).toString().padStart(3, '0');
  return h + ':' + m + ':' + s + (kind === 'srt' ? ',' : '.') + rest;
}
function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
}
function saveText(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
const sampleCaptions: Caption[] = [
  { id: 1, start: 0, end: 3.4, text: 'Привет! Это пример редактора субтитров.' },
  { id: 2, start: 3.4, end: 7.2, text: 'Загрузите своё видео, чтобы получить настоящую расшифровку.' },
  { id: 3, start: 7.2, end: 10.5, text: 'Текст и временные метки можно изменять вручную.' }
];
function loadSavedCaptions() {
  try {
    const raw = localStorage.getItem('sublume-captions-v1');
    if (!raw) return [];
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item: any) => typeof item.text === 'string' && typeof item.start === 'number' && typeof item.end === 'number').slice(0, 500) as Caption[] : [];
  } catch { return []; }
}

async function loadFfmpeg(onPhase: (message: string) => void) {
  if (!enginePromise) {
    enginePromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      const ff = new FFmpeg();
      onPhase('Загружаем движок обработки аудио…');
      const base = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
      await ff.load({
        coreURL: await toBlobURL(base + '/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL(base + '/ffmpeg-core.wasm', 'application/wasm')
      });
      return ff;
    })().catch((err: unknown) => { enginePromise = null; throw err; });
  }
  return enginePromise;
}

async function loadTranscriber(onPhase: (message: string) => void) {
  if (!asrPromise) {
    asrPromise = (async () => {
      const { env, pipeline } = await import('@huggingface/transformers');
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      onPhase('Скачиваем бесплатную модель Whisper — первый запуск может занять несколько минут…');
      return pipeline('automatic-speech-recognition', MODEL_ID, {
        device: 'wasm',
        dtype: 'q8',
        progress_callback: (progress: any) => {
          if (progress.status === 'progress' && typeof progress.progress === 'number') {
            const pct = Math.round(progress.progress);
            onPhase('Загрузка модели Whisper: ' + pct + '%');
          }
          if (progress.status === 'ready') onPhase('Модель готова. Начинаем распознавание…');
        }
      });
    })().catch((err: unknown) => { asrPromise = null; throw err; });
  }
  return asrPromise;
}

function App() {
  const fileInput = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [tab, setTab] = useState<Tab>('studio');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [isAudio, setIsAudio] = useState(false);
  const [drag, setDrag] = useState(false);
  const [language, setLanguage] = useState('auto');
  const [preset, setPreset] = useState<Preset>('bold');
  const [captions, setCaptions] = useState<Caption[]>(loadSavedCaptions);
  const [processing, setProcessing] = useState(false);
  const [phase, setPhase] = useState('');
  const [errorText, setErrorText] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    try { localStorage.setItem('sublume-captions-v1', JSON.stringify(captions)); } catch { /* storage unavailable */ }
  }, [captions]);
  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  const activeCaption = captions.find(c => currentTime >= c.start && currentTime < c.end);
  const fileBase = (file?.name || 'sublume-subtitles').replace(/\.[^.]+$/, '').replace(/[^\wа-яА-ЯёЁ.-]/g, '_');

  function chooseFile(next: File | undefined | null) {
    if (!next) return;
    setErrorText('');
    if (next.size > MAX_FILE_SIZE) {
      setErrorText('Максимальный размер файла для браузерной версии — 150 МБ. Выберите файл поменьше.');
      return;
    }
    const extension = next.name.split('.').pop()?.toLowerCase() || '';
    if (!['mp4', 'mov', 'webm', 'mkv', 'mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(extension)) {
      setErrorText('Поддерживаются MP4, MOV, WebM, MKV, MP3, WAV, M4A, OGG и FLAC.');
      return;
    }
    setFile(next);
    setFileUrl(URL.createObjectURL(next));
    setIsAudio(['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(extension));
    setDuration(0);
    setCurrentTime(0);
    setCaptions([]);
    setDemo(false);
    setPhase('');
  }
  function updateCaption(id: number, patch: Partial<Caption>) {
    setCaptions(current => current.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function showSample() {
    setCaptions(sampleCaptions.map(c => ({ ...c })));
    setDemo(true);
    setErrorText('');
    setTab('studio');
  }
  function exportAs(kind: 'srt' | 'vtt' | 'txt') {
    if (!captions.length) return;
    const ordered = [...captions].sort((a, b) => a.start - b.start);
    let content = '';
    if (kind === 'txt') content = ordered.map(c => c.text.trim()).join('\n\n');
    else {
      content = (kind === 'vtt' ? 'WEBVTT\n\n' : '') + ordered.map((c, index) => {
        const interval = timecode(c.start, kind) + ' --> ' + timecode(c.end, kind);
        return (kind === 'srt' ? (index + 1) + '\n' : '') + interval + '\n' + c.text.trim();
      }).join('\n\n') + '\n';
    }
    saveText(fileBase + '.' + kind, content, 'text/plain;charset=utf-8');
  }
  async function transcribe() {
    if (!file || processing) return;
    setProcessing(true);
    setErrorText('');
    setDemo(false);
    try {
      setPhase('Подготавливаем видео и извлекаем звук…');
      const ffmpeg = await loadFfmpeg(setPhase);
      const { fetchFile } = await import('@ffmpeg/util');
      const suffix = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const inputName = 'upload.' + suffix;
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      const resultCode = await ffmpeg.exec(['-i', inputName, '-vn', '-ac', '1', '-ar', '16000', '-f', 'wav', 'audio.wav']);
      if (resultCode !== 0) throw new Error('Не удалось прочитать аудиодорожку файла.');
      const wav = await ffmpeg.readFile('audio.wav') as Uint8Array;
      const wavCopy = new Uint8Array(wav);
      const context = new AudioContext();
      let audio: AudioBuffer;
      try {
        audio = await context.decodeAudioData(wavCopy.buffer as ArrayBuffer);
      } finally {
        await context.close();
      }
      if (audio.duration > 15 * 60) throw new Error('Сейчас поддерживаются ролики до 15 минут. Обрежьте длинное видео.');
      const model = await loadTranscriber(setPhase);
      setPhase('ИИ распознаёт речь. Обработка выполняется на вашем устройстве…');
      const options: any = {
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
        task: 'transcribe'
      };
      if (language !== 'auto') options.language = language;
      const result = await model(audio.getChannelData(0), options) as Output | Output[];
      const output = Array.isArray(result) ? result[0] : result;
      const chunks = (output?.chunks || []).filter(chunk => chunk.text?.trim());
      let next: Caption[] = chunks.map((c, i) => ({
        id: i + 1,
        start: Math.max(0, c.timestamp?.[0] ?? i * 4),
        end: Math.min(audio.duration, Math.max((c.timestamp?.[0] ?? i * 4) + 0.5, c.timestamp?.[1] ?? (i + 1) * 4)),
        text: (c.text || '').trim()
      }));
      if (!next.length && output?.text?.trim()) {
        next = [{ id: 1, start: 0, end: audio.duration, text: output.text.trim() }];
      }
      if (!next.length) throw new Error('Речь не обнаружена. Попробуйте видео с более чётким звуком.');
      setCaptions(next);
      setDuration(audio.duration);
      setPhase('Готово: ' + next.length + ' фрагментов. Проверьте текст и скачайте субтитры.');
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile('audio.wav').catch(() => {});
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorText('Обработка не завершена. ' + message + ' Для браузерной модели нужны свободная память, поддерживаемый браузер и доступ к сети при первой загрузке.');
      setPhase('');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => { setTab('studio'); setShowMenu(false); }} aria-label="Открыть студию">
          <span className="brand-icon"><Subtitles size={25} strokeWidth={2.5} /></span>
          <span>sub<span className="brand-light">lume</span><small>AI VIDEO STUDIO</small></span>
        </button>
        <div className="side-section">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav className={'side-nav ' + (showMenu ? 'open' : '')}>
          <button className={tab === 'studio' ? 'nav-item active' : 'nav-item'} onClick={() => { setTab('studio'); setShowMenu(false); }}><WandSparkles size={18}/> AI-студия <span className="nav-dot" /></button>
          <button className={tab === 'how' ? 'nav-item active' : 'nav-item'} onClick={() => { setTab('how'); setShowMenu(false); }}><CircleHelp size={18}/> Как это работает</button>
          <button className={tab === 'pricing' ? 'nav-item active' : 'nav-item'} onClick={() => { setTab('pricing'); setShowMenu(false); }}><BadgeCheck size={18}/> Тарифы</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="model-card"><div className="model-title"><span className="status-light"/> WHISPER LOCAL</div><p>Работает без ключей API. Модель загружается на устройство.</p><div className="model-privacy"><ShieldCheck size={14}/> Файлы не загружаются на наш сервер</div></div>
          <div className="sidebar-copyright">© 2026 Sublume Studio · Beta</div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setShowMenu(v => !v)} aria-label="Открыть меню">{showMenu ? <X size={21}/> : <Menu size={21}/>}</button>
          <div className="crumb">Рабочее пространство <span>/</span> <strong>{tab === 'studio' ? 'AI-студия' : tab === 'pricing' ? 'Тарифы' : 'Как это работает'}</strong></div>
          <div className="topbar-right"><span className="beta-tag"><span/> BETA</span><span className="top-avatar">S</span></div>
        </header>
        {tab === 'studio' ? (
          <main className="page">
            <div className="hero">
              <div className="hero-bloom"/>
              <div className="hero-content">
                <div className="eyebrow"><Sparkles size={14}/> ТВОЯ ИИ-СТУДИЯ</div>
                <h1>Видео говорит.<br/><span>Мы превращаем в текст.</span></h1>
                <p>Создавай точные субтитры с открытой нейросетью. Никаких API-ключей, регистрации и платы за каждую минуту.</p>
                <div className="hero-tags"><span><Check size={14}/> Локальная обработка</span><span><Check size={14}/> 90+ языков модели</span><span><Check size={14}/> Экспорт SRT / VTT</span></div>
              </div>
              <div className="hero-deco"><div className="wave-line wave-one"/><div className="wave-line wave-two"/><div className="wave-line wave-three"/><div className="speech-tile"><AudioLines size={36}/><div className="speech-bar"><i/><i/><i/><i/><i/><i/><i/></div></div></div>
            </div>

            <div className="workspace-header"><div><h2>Новый проект</h2><p>Загрузите файл и запустите автоматическое распознавание</p></div><span className="workspace-helper"><LockKeyhole size={15}/> Приватная обработка</span></div>
            <div className="work-grid">
              <section className="card upload-panel">
                <div className="card-heading"><div className="card-icon"><FileVideo size={19}/></div><div><h3>Исходный файл</h3><p>Видео или аудиозапись для обработки</p></div></div>
                <input ref={fileInput} className="sr-only" type="file" accept="video/*,audio/*,.mkv,.mov,.m4a,.flac" onChange={event => chooseFile(event.target.files?.[0])}/>
                <div className={'dropzone ' + (drag ? 'dragging' : '') + (file ? ' has-file' : '')}
                  onDragOver={event => { event.preventDefault(); setDrag(true); }}
                  onDragLeave={event => { event.preventDefault(); setDrag(false); }}
                  onDrop={event => { event.preventDefault(); setDrag(false); chooseFile(event.dataTransfer.files?.[0]); }}>
                  {file ? (
                    <div className="file-added"><div className="file-pict">{isAudio ? <FileAudio size={25}/> : <Film size={25}/>}</div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(1)} МБ · Готов к обработке</span><button className="small-change" onClick={() => fileInput.current?.click()}>Выбрать другой файл</button></div>
                  ) : (
                    <div className="drop-inner"><div className="upload-symbol"><UploadCloud size={30}/></div><strong>Перетащи видео сюда</strong><span>или выбери файл с компьютера</span><button className="outline-btn" onClick={() => fileInput.current?.click()}><Plus size={16}/> Выбрать файл</button><small>MP4, MOV, WebM, MKV, MP3, WAV · до 150 МБ</small></div>
                  )}
                </div>
                <div className="settings">
                  <label htmlFor="audio-language">Язык речи</label>
                  <div className="select-wrap"><Languages size={17}/><select id="audio-language" value={language} onChange={event => setLanguage(event.target.value)}><option value="auto">Определить автоматически</option><option value="russian">Русский</option><option value="english">Английский</option><option value="ukrainian">Украинский</option><option value="german">Немецкий</option><option value="french">Французский</option><option value="spanish">Испанский</option><option value="latvian">Латышский</option></select><ChevronDown size={15}/></div>
                </div>
                <button className="primary-btn" disabled={!file || processing} onClick={transcribe}>{processing ? <><span className="spin-circle"/> Обрабатываем…</> : <><Sparkles size={18}/> Создать субтитры <ArrowRight size={17}/></>}</button>
                {phase && <div className={'notice ' + (processing ? 'working' : 'success')}><span className={processing ? 'pulse' : 'check-dot'} />{phase}</div>}
                {errorText && <div className="error-notice" role="alert"><Info size={17}/>{errorText}</div>}
                <p className="tiny-note"><Info size={13}/> Первая загрузка модели требует интернета. Обработка до 15 минут видео зависит от мощности устройства.</p>
              </section>

              <section className="card preview-panel">
                <div className="card-heading"><div className="card-icon purple"><Play size={18}/></div><div><h3>Предпросмотр</h3><p>Смотри субтитры синхронно с видео</p></div></div>
                <div className="preview-screen">
                  {fileUrl ? (
                    isAudio ? <div className="audio-stage"><div className="audio-disc"><AudioLines size={42}/></div><audio controls ref={el => { mediaRef.current = el; }} src={fileUrl} onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={event => setDuration(event.currentTarget.duration)}/></div> :
                    <video controls playsInline ref={el => { mediaRef.current = el; }} src={fileUrl} onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={event => setDuration(event.currentTarget.duration)}/>
                  ) : <div className="empty-stage"><div className="empty-play"><Play size={28} fill="currentColor"/></div><span>Предпросмотр появится здесь</span><small>Добавь видео, чтобы начать</small></div>}
                  {fileUrl && !isAudio && activeCaption && <div className={'caption-overlay ' + preset}>{activeCaption.text}</div>}
                </div>
                <div className="preview-foot"><span><Clock3 size={14}/> {formatDuration(currentTime)} / {formatDuration(duration)}</span><span><Film size={14}/> {file ? (isAudio ? 'Аудио' : 'Видео') : 'Файл не выбран'}</span></div>
                <div className="styles-row"><div><strong>Стиль субтитров</strong><p>Применяется к предпросмотру</p></div><div className="styles-options">{(['classic', 'bold', 'neon'] as Preset[]).map(name => <button key={name} className={'style-pill ' + (preset === name ? 'selected' : '')} onClick={() => setPreset(name)}>{name === 'classic' ? 'Classic' : name === 'bold' ? 'Bold' : 'Neon'}</button>)}</div></div>
              </section>
            </div>

            <section className="card transcript-panel">
              <div className="transcript-header"><div className="card-heading"><div className="card-icon teal"><Subtitles size={19}/></div><div><h3>Редактор субтитров</h3><p>{captions.length ? captions.length + ' фрагментов · можно исправить текст и тайминг' : 'Здесь появится распознанная речь'}</p></div></div><div className="export-actions"><button className="secondary-btn" disabled={!captions.length} onClick={() => exportAs('srt')}><Download size={16}/> SRT</button><button className="secondary-btn" disabled={!captions.length} onClick={() => exportAs('vtt')}><ArrowDownToLine size={16}/> VTT</button><button className="secondary-btn" disabled={!captions.length} onClick={() => exportAs('txt')}><Download size={16}/> TXT</button></div></div>
              {captions.length ? (
                <div className="caption-list">{captions.map((caption, idx) => <div className="caption-row" key={caption.id}><span className="caption-index">{(idx + 1).toString().padStart(2, '0')}</span><div className="caption-content"><div className="caption-times"><label>От <input aria-label={'Начало фрагмента ' + (idx + 1)} type="number" step="0.1" min="0" value={Number(caption.start.toFixed(1))} onChange={e => updateCaption(caption.id, { start: Number(e.target.value) })}/></label><span>→</span><label>До <input aria-label={'Конец фрагмента ' + (idx + 1)} type="number" step="0.1" min="0" value={Number(caption.end.toFixed(1))} onChange={e => updateCaption(caption.id, { end: Math.max(caption.start + 0.1, Number(e.target.value)) })}/></label></div><textarea aria-label={'Текст фрагмента ' + (idx + 1)} rows={2} value={caption.text} onChange={e => updateCaption(caption.id, {text:e.target.value})}/></div><button className="icon-btn" onClick={() => setCaptions(current => current.filter(c => c.id !== caption.id))} aria-label={'Удалить фрагмент ' + (idx + 1)}><Trash2 size={16}/></button></div>)}</div>
              ) : <div className="transcript-empty"><div className="transcript-empty-icon"><AudioLines size={29}/></div><strong>Здесь будет твоя расшифровка</strong><span>После обработки ты сможешь отредактировать текст и скачать субтитры.</span><button onClick={showSample}>Открыть демонстрационный пример <ArrowRight size={15}/></button></div>}
              {captions.length > 0 && <div className="transcript-footer"><span>{demo ? 'Демонстрационные субтитры — не результат обработки файла' : 'Сохраняем текст локально в этом браузере'}</span><button onClick={() => setCaptions(current => [...current, {id: Date.now(), start: current.length ? current[current.length-1].end : 0, end: current.length ? current[current.length-1].end + 3 : 3, text: 'Новый фрагмент'}])}><Plus size={15}/> Добавить строку</button></div>}
            </section>
            <div className="bottom-trust"><span><ShieldCheck size={16}/> Никаких секретных API-ключей</span><span><CloudOff size={16}/> Исходные файлы не покидают браузер</span><span><Code2 size={16}/> Open-source технологии</span></div>
          </main>
        ) : tab === 'how' ? (
          <main className="page info-page"><div className="info-heading"><div className="eyebrow dark"><Sparkles size={14}/> ПРОЗРАЧНЫЙ ИИ</div><h1>Как работает Sublume</h1><p>Никаких скрытых платежей за нейросеть. Файл обрабатывается локально в браузере.</p></div><div className="how-grid">{[{no:'01',ico:<UploadCloud/>,title:'Загрузи файл',desc:'Выбери видео или аудио до 150 МБ. Файл остаётся на твоём устройстве.'},{no:'02',ico:<Mic2/>,title:'Запусти Whisper',desc:'Мы скачиваем открытую модель и автоматически распознаём речь. Первый запуск самый долгий.'},{no:'03',ico:<Scissors/>,title:'Исправь субтитры',desc:'Проверь текст, измени интервалы и сравни с видео.'},{no:'04',ico:<Download/>,title:'Забери результат',desc:'Скачай стандартные файлы SRT, VTT или обычный текст — без водяного знака.'}].map(step => <div className="how-card" key={step.no}><span className="step-num">{step.no}</span><div className="step-ico">{step.ico}</div><h3>{step.title}</h3><p>{step.desc}</p></div>)}</div><div className="important-panel"><Info size={22}/><div><strong>Что умеет текущая бета-версия</strong><p>Распознавание речи и экспорт текстовых субтитров. Встраивание субтитров непосредственно в итоговый MP4, облачные задания, аккаунты и оплата ещё не подключены. Для работы нужен современный браузер и достаточно оперативной памяти.</p></div></div><button className="primary-btn page-return" onClick={() => setTab('studio')}>Перейти в студию <ArrowRight size={16}/></button></main>
        ) : (
          <main className="page info-page"><div className="info-heading"><div className="eyebrow dark"><BadgeCheck size={14}/> ТАРИФЫ</div><h1>Начни бесплатно</h1><p>Сначала проверим, насколько хорошо работает модель на твоём устройстве. Платежей в бета-версии нет.</p></div><div className="pricing-grid"><div className="plan active-plan"><div className="plan-icon"><Sparkles/></div><h3>Local Beta</h3><div className="plan-price">0 € <span>/ всегда в бета-версии</span></div><p>Всё необходимое, чтобы попробовать автоматические субтитры.</p><ul><li><Check/> Whisper на устройстве</li><li><Check/> Русская и многоязычная речь</li><li><Check/> Редактор таймингов</li><li><Check/> SRT, VTT и TXT</li></ul><button className="primary-btn" onClick={() => setTab('studio')}>Попробовать бесплатно</button></div><div className="plan"><span className="coming-tag">ПЛАНИРУЕТСЯ</span><div className="plan-icon secondary"><Globe2/></div><h3>Cloud Pro</h3><div className="plan-price">— <span>/ цена не назначена</span></div><p>Для тех, кому нужны длинные видео и автоматическая обработка на сервере.</p><ul><li><Check/> Обработка без нагрузки на ПК</li><li><Check/> Задания в очереди</li><li><Check/> Экспорт готового видео</li><li><Check/> История проектов</li></ul><div className="soon-btn">Пока недоступно</div></div></div><div className="important-panel"><LockKeyhole size={22}/><div><strong>Никаких фиктивных покупок</strong><p>Платёжная система и подписки не включены, пока нет проверки качества обработки и подключения платёжного аккаунта владельца проекта.</p></div></div></main>
        )}
      </div>
    </div>
  );
}
export default App;
