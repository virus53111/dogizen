export type CaptionFrame = { start: number; end: number; text: string };
export type SubtitleStyle = 'classic' | 'bold' | 'neon';
export type RenderResult = { blob: Blob; extension: 'mp4' | 'webm'; mime: string };
export const canRenderVideo = () => typeof MediaRecorder !== 'undefined' &&
  typeof HTMLCanvasElement.prototype.captureStream === 'function';

function chooseFormat() {
  // Only prefer MP4 if the recorder advertises H.264 + AAC; MP4/Opus can fail in phone galleries.
  const candidates = [
    'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4'
  ];
  return candidates.find(x => MediaRecorder.isTypeSupported(x));
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, limit: number) {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let row = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = row ? row + ' ' + word : word;
      if (ctx.measureText(next).width > limit && row) { lines.push(row); row = word; }
      else row = next;
      while (row.length > 1 && ctx.measureText(row).width > limit) {
        let n = row.length - 1;
        while (n > 1 && ctx.measureText(row.slice(0, n)).width > limit) n--;
        lines.push(row.slice(0, n));
        row = row.slice(n);
      }
    }
    if (row) lines.push(row);
  }
  return lines.slice(0, 5);
}

function paintText(ctx: CanvasRenderingContext2D, text: string, w: number, h: number, style: SubtitleStyle) {
  if (!text.trim()) return;
  const size = Math.max(16, Math.min(52, Math.round(Math.min(w,h) * .059)));
  const spacing = Math.round(size * 1.28);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 ' + size + 'px system-ui, sans-serif';
  ctx.lineJoin = 'round';
  const rows = wrapText(ctx, style === 'bold' ? text.toLocaleUpperCase() : text, w * .82);
  const top = h - Math.max(25, Math.round(h * .1)) - rows.length * spacing;
  if (style === 'classic') {
    const width = Math.min(w * .9, Math.max(140, ...rows.map(x=>ctx.measureText(x).width)) + 36);
    ctx.fillStyle = '#080810bd';
    ctx.fillRect((w-width)/2, top-9, width, spacing*rows.length+18);
  }
  rows.forEach((row,i)=>{
    ctx.lineWidth = Math.max(3, size * .16);
    ctx.strokeStyle = '#08080bef';
    ctx.fillStyle = style === 'bold' ? '#ffe46d' : style === 'neon' ? '#d6b9ff' : '#ffffff';
    ctx.shadowBlur = style === 'neon' ? 14 : 3;
    ctx.shadowColor = style === 'neon' ? '#c798ff' : '#090909';
    const y = top + (i+.5)*spacing;
    ctx.strokeText(row,w/2,y);
    ctx.fillText(row,w/2,y);
  });
  ctx.restore();
}

export async function renderVideoWithText(args: {
  sourceUrl: string;
  captions: CaptionFrame[];
  style: SubtitleStyle;
  onProgress: (message:string)=>void;
  signal?: AbortSignal;
}): Promise<RenderResult> {
  if (!canRenderVideo()) throw new Error('Этот браузер не поддерживает запись видео. Попробуй Chrome на компьютере или современный Chrome на Android.');
  const mime = chooseFormat();
  if (!mime) throw new Error('Браузер не поддерживает MP4 или WebM MediaRecorder.');
  if (args.signal?.aborted) throw new Error('Экспорт отменён.');
  const video = document.createElement('video');
  video.src=args.sourceUrl;
  video.preload='auto';
  video.playsInline=true;
  video.muted=false; // Audio will be muted in the recording if true.
  video.volume=1;
  video.style.cssText='position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
  document.body.appendChild(video);
  let audioContext: AudioContext | null=null;
  let recorder: MediaRecorder | null=null;
  let stream: MediaStream | null=null;
  let animation=0, interval: ReturnType<typeof setInterval>|null=null, timer: ReturnType<typeof setTimeout>|null=null;
  let frames=0;
  try {
    audioContext = new AudioContext();
    const resume = audioContext.resume();
    await new Promise<void>((resolve,reject)=>{
      if (video.readyState>=1&&video.videoWidth>0) return resolve();
      const finish=(error?:Error)=>{clearTimeout(t);video.removeEventListener('loadedmetadata',ready);video.removeEventListener('error',failed);error?reject(error):resolve()};
      const ready=()=>finish();
      const failed=()=>finish(new Error('Телефон не может открыть исходное видео. Попробуй MP4 H.264 или WebM.'));
      const t=setTimeout(()=>finish(new Error('Не удалось загрузить видео за 15 секунд.')),15000);
      video.addEventListener('loadedmetadata',ready);
      video.addEventListener('error',failed);
    });
    const dur=video.duration;
    if(!Number.isFinite(dur)||dur<=0) throw new Error('Неизвестная длительность видео.');
    const max=/Android|iPhone|iPad/i.test(navigator.userAgent)?90:180;
    if(dur>max) throw new Error('В этом браузере лимит '+max+' секунд. Используй более короткий файл.');
    const scale=Math.min(1,960/Math.max(video.videoWidth,video.videoHeight));
    const w=Math.max(2,Math.round(video.videoWidth*scale/2)*2);
    const h=Math.max(2,Math.round(video.videoHeight*scale/2)*2);
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx) throw new Error('Canvas недоступен.');
    const audioStream=audioContext.createMediaStreamDestination();
    audioContext.createMediaElementSource(video).connect(audioStream);
    await resume;
    if(audioContext.state!=='running') throw new Error('Браузер не разрешил запись звука. Попробуй повторно нажать кнопку.');
    const paint=()=>{
      if(video.readyState>=2){
        ctx.drawImage(video,0,0,w,h);
        const t=video.currentTime;
        const cue=args.captions.find(c=>c.start<=t&&t<c.end&&c.text.trim());
        if(cue) paintText(ctx,cue.text,w,h,args.style);
        frames++;
      } else {ctx.fillStyle='#101016';ctx.fillRect(0,0,w,h)}
      animation=requestAnimationFrame(paint);
    };
    paint();
    const canvasTrack=canvas.captureStream(24).getVideoTracks();
    stream=new MediaStream([...canvasTrack,...audioStream.stream.getAudioTracks()]);
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2000000,audioBitsPerSecond:128000});
    const chunks: Blob[]=[];
    recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data)};
    const done=new Promise<void>((resolve,reject)=>{
      const stop=()=>{cleanup();resolve()};
      const error=()=>{cleanup();reject(new Error('Браузер прервал запись.'))};
      const cleanup=()=>{recorder?.removeEventListener('stop',stop);recorder?.removeEventListener('error',error)};
      recorder!.addEventListener('stop',stop);
      recorder!.addEventListener('error',error);
    });
    args.onProgress('Создаём новое видео с субтитрами на кадрах. Не сворачивай вкладку.');
    recorder.start(500);
    const end=new Promise<void>((resolve,reject)=>{
      const cleanup=()=>{
        video.removeEventListener('ended',complete);
        video.removeEventListener('error',failed);
        args.signal?.removeEventListener('abort',aborted);
        if(timer)clearTimeout(timer);
      };
      const complete=()=>{cleanup();resolve()};
      const failed=()=>{cleanup();reject(new Error('Исходное видео перестало воспроизводиться.'))};
      const aborted=()=>{cleanup();reject(new Error('Экспорт отменён.'))};
      video.addEventListener('ended',complete,{once:true});
      video.addEventListener('error',failed,{once:true});
      args.signal?.addEventListener('abort',aborted,{once:true});
      timer=setTimeout(()=>{cleanup();reject(new Error('Истекло время записи. Не сворачивай вкладку.'))},dur*2000+30000);
    });
    await video.play();
    interval=setInterval(()=>{
      args.onProgress('Вшиваем текст в кадры: '+Math.min(99,Math.round(video.currentTime/dur*100))+'%. Не сворачивай вкладку.');
    },1000);
    await end;
    recorder.stop();
    await done;
    if(frames<4||!chunks.length)throw new Error('Готовый файл пуст. Попробуй короткое видео.');
    const blob=new Blob(chunks,{type:recorder.mimeType});
    if(blob.size<1024)throw new Error('Получился пустой видеофайл.');
    return {blob,extension:recorder.mimeType.startsWith('video/mp4')?'mp4':'webm',mime:recorder.mimeType};
  } finally {
    if(animation)cancelAnimationFrame(animation);
    if(interval)clearInterval(interval);
    if(timer)clearTimeout(timer);
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
    if(recorder?.state==='recording')recorder.stop();
    stream?.getTracks().forEach(t=>t.stop());
    if(audioContext&&audioContext.state!=='closed')await audioContext.close().catch(()=>{});
  }
}
