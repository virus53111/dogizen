
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