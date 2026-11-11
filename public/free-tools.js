(function freeToolsScript(){
'use strict';
const root=document.querySelector('[data-free-tool]');
if(!root)return;
const kind=root.dataset.freeTool,ru=root.dataset.ftLang==='ru';
const $=s=>root.querySelector(s);
const status=$('#ft-status'),results=$('#ft-results');
const note=(en,rus)=>ru?rus:en;
const setStatus=(message,error=false)=>{status.textContent=message;status.classList.toggle('ft-error',error);};
const selected=(input)=>Array.from(input.files||[]);
const safeName=(name)=>name.replace(/\.[^.]+$/,'').replace(/[^A-Za-z0-9_\-.\u0400-\u04FF]+/g,'-').slice(0,80)||'file';
const fmt=(bytes)=>bytes>=1048576?(bytes/1048576).toFixed(2)+' MB':(bytes/1024).toFixed(1)+' KB';
const blobUrls=[];
function download(blob,name){
 const url=URL.createObjectURL(blob);
 blobUrls.push(url);
 const a=document.createElement('a');
 a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();
}
function resultLink(blob,name,description){
 const url=URL.createObjectURL(blob);blobUrls.push(url);
 const wrap=document.createElement('div');wrap.className='ft-result-row';
 const span=document.createElement('span');span.textContent=description;
 const a=document.createElement('a');a.href=url;a.download=name;a.className='ft-download';a.textContent=note('Download','Скачать')+' ↓';
 wrap.append(span,a);results.append(wrap);
}
window.addEventListener('pagehide',()=>{blobUrls.forEach(u=>URL.revokeObjectURL(u));});
const loaded=new Map();
function requireScript(url,globalName){
 if(window[globalName])return Promise.resolve();
 if(loaded.has(url))return loaded.get(url);
 const task=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=url;script.async=true;script.crossOrigin='anonymous';
  script.onload=()=>window[globalName]?resolve():reject(new Error(note('Library could not start.','Не удалось запустить библиотеку.')));
  script.onerror=()=>reject(new Error(note('Cannot load required library. Check your connection or content blocker.','Не удалось загрузить библиотеку. Проверьте интернет и блокировщик.')));
  document.head.append(script);
 });
 loaded.set(url,task);
 return task;
}
const qrLibrary='https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
const pdfLibrary='https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const errorMessage=e=>e instanceof Error?e.message:String(e);
async function withBusy(button,callback){
 if(button.disabled)return;
 button.disabled=true;results.replaceChildren();
 try{await callback();}
 catch(e){setStatus(note('Could not complete: ','Ошибка: ')+errorMessage(e),true);}
 finally{button.disabled=false;}
}
function verifyFiles(files,maxCount,maxTotalMB,allowed){
 if(!files.length)throw Error(note('Choose at least one file.','Выберите хотя бы один файл.'));
 if(files.length>maxCount)throw Error(note('Too many files (maximum '+maxCount+').','Слишком много файлов (максимум '+maxCount+').'));
 const total=files.reduce((n,f)=>n+f.size,0);
 if(total>maxTotalMB*1048576)throw Error(note('Combined files exceed '+maxTotalMB+' MB.','Общий размер превышает '+maxTotalMB+' МБ.'));
 for(const f of files){
  if(f.size===0)throw Error(note('Empty file: ','Пустой файл: ')+f.name);
  if(!allowed(f))throw Error(note('Unsupported file: ','Неподдерживаемый файл: ')+f.name);
 }
}
async function openImage(file){
 if(typeof createImageBitmap==='function'){
  const bmp=await createImageBitmap(file,{imageOrientation:'from-image'});
  return {image:bmp,width:bmp.width,height:bmp.height,close:()=>bmp.close()};
 }
 const link=URL.createObjectURL(file);
 try{
  const image=new Image();
  image.src=link;await image.decode();
  return {image,width:image.naturalWidth,height:image.naturalHeight,close:()=>{}};
 }finally{URL.revokeObjectURL(link);}
}
async function renderImage(file,kind,maxPixels,quality){
 const decoded=await openImage(file);
 try{
  const w=decoded.width,h=decoded.height;
  if(!w||!h)throw Error(note('Image dimensions unavailable.','Не удалось определить размер изображения.'));
  const factor=Math.min(1,maxPixels/w,maxPixels/h,Math.sqrt(16000000/(w*h)));
  const width=Math.max(1,Math.round(w*factor)),height=Math.max(1,Math.round(h*factor));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:kind!=='image/jpeg'});
  if(!ctx)throw Error(note('Canvas is unavailable.','Canvas недоступен.'));
  if(kind==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);}
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(decoded.image,0,0,width,height);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(Error(note('Cannot export image.','Не удалось сохранить изображение.'))),kind,quality));
  if(blob.type!==kind)throw Error(note('This browser cannot export '+kind+'.','Этот браузер не поддерживает экспорт '+kind+'.'));
  return {blob,width,height};
 }finally{decoded.close();}
}
function wireOrder(fileInput){
 let files=[];
 const list=$('#ft-order');
 function render(){
  list.replaceChildren();
  files.forEach((file,i)=>{
   const row=document.createElement('div');row.className='ft-order-row';
   const title=document.createElement('span');title.textContent=(i+1)+'. '+file.name+' ('+fmt(file.size)+')';
   row.append(title);
   for(const [label,change] of [['↑',-1],['↓',1]]){
    const btn=document.createElement('button');btn.type='button';btn.className='ft-move';btn.textContent=label;
    btn.disabled=i+change<0||i+change>=files.length;
    btn.setAttribute('aria-label',note('Move file ','Переместить файл ')+file.name+(change<0?note(' up',' вверх'):note(' down',' вниз')));
    btn.addEventListener('click',()=>{const a=files[i];files[i]=files[i+change];files[i+change]=a;render();});
    row.append(btn);
   }
   list.append(row);
  });
 }
 fileInput.addEventListener('change',()=>{files=selected(fileInput);results.replaceChildren();setStatus('');render();});
 return ()=>files.slice();
}
if(kind==='qr-code-generator'){
 const mode=$('#ft-qr-mode'),textField=$('#ft-qr-text'),wifiField=$('#ft-qr-wifi'),contactField=$('#ft-qr-contact'),make=$('#ft-qr-generate'),png=$('#ft-qr-png'),svg=$('#ft-qr-svg');
 let pngBlob=null,svgBlob=null;
 mode.addEventListener('change',()=>{const isWifi=mode.value==='wifi',isContact=mode.value==='contact';textField.hidden=isWifi||isContact;wifiField.hidden=!isWifi;contactField.hidden=!isContact;});
 const wifiEscape=s=>s.replace(/([\\;,:"])/g,'\\$1');
 function getPayload(){
 if(mode.value==='contact'){
  const clean=value=>value.replace(/\r?\n/g,' ').trim().replace(/([\\,;])/g,'\\$1');
  const name=$('#ft-qr-name').value.trim(),phone=$('#ft-qr-phone').value.trim(),email=$('#ft-qr-email').value.trim(),org=$('#ft-qr-org').value.trim();
  if(!name)throw Error(note('Enter a contact name.','Введите имя контакта.'));
  if(email&&(!email.includes('@')||/\s/.test(email)))throw Error(note('Check the email address.','Проверьте адрес электронной почты.'));
  const nameParts=name.trim().split(/\s+/);const family=nameParts.length>1?nameParts.pop():'';const given=nameParts.join(' ')||name;
  const lines=['BEGIN:VCARD','VERSION:3.0','N:'+clean(family)+';'+clean(given)+';;;','FN:'+clean(name)];
  if(phone)lines.push('TEL;TYPE=CELL:'+clean(phone));
  if(email)lines.push('EMAIL:'+clean(email));
  if(org)lines.push('ORG:'+clean(org));
  lines.push('END:VCARD');
  return lines.join('\r\n');
 }
 if(mode.value!=='wifi')return $('#ft-qr-content').value.trim();
 const ssid=$('#ft-qr-ssid').value,pwd=$('#ft-qr-password').value,security=$('#ft-qr-security').value;
 if(!ssid.trim())throw Error(note('Enter Wi-Fi name.','Введите имя Wi-Fi.'));
 return 'WIFI:T:'+security+';S:'+wifiEscape(ssid)+';P:'+(security==='nopass'?'':wifiEscape(pwd))+';;';
}
 make.addEventListener('click',()=>withBusy(make,async()=>{
  png.disabled=true;svg.disabled=true;pngBlob=null;svgBlob=null;
  const payload=getPayload();
  if(!payload)throw Error(note('Enter a link or text.','Введите ссылку или текст.'));
  if(new TextEncoder().encode(payload).length>1500)throw Error(note('Input is too long for a readable QR code.','Текст слишком длинный для удобного QR-кода.'));
  setStatus(note('Generating QR code…','Создаю QR-код…'));
  await requireScript(qrLibrary,'qrcode');
  window.qrcode.stringToBytes=function(value){return Array.from(new TextEncoder().encode(value));};
  const qr=window.qrcode(0,'M');qr.addData(payload);qr.make();
  const modules=qr.getModuleCount(),margin=4,side=modules+margin*2;
  const size=Number($('#ft-qr-size').value)||384;
  const dark=$('#ft-qr-dark').value,light='#ffffff';
  const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
  ctx.fillStyle=light;ctx.fillRect(0,0,size,size);
  ctx.fillStyle=dark;
  const cell=size/side;
  const squares=[];
  for(let y=0;y<modules;y++){
   let begin=-1;
   for(let x=0;x<=modules;x++){
    const filled=x<modules&&qr.isDark(y,x);
    if(filled&&begin<0)begin=x;
    if(!filled&&begin>=0){
     const x1=Math.round((begin+margin)*cell),x2=Math.round((x+margin)*cell);
     const y1=Math.round((y+margin)*cell),y2=Math.round((y+margin+1)*cell);
     ctx.fillRect(x1,y1,Math.max(1,x2-x1),Math.max(1,y2-y1));
     squares.push('M'+(begin+margin)+' '+(y+margin)+'h'+(x-begin)+'v1H'+(begin+margin)+'z');
     begin=-1;
    }
   }
  }
  pngBlob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG export failed')),'image/png'));
  const code='<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 '+side+' '+side+'"><rect width="'+side+'" height="'+side+'" fill="'+light+'"/><path fill="'+dark+'" d="'+squares.join('')+'"/></svg>';
  svgBlob=new Blob([code],{type:'image/svg+xml'});
  const preview=$('#ft-qr-preview');preview.replaceChildren(canvas);
  png.disabled=false;svg.disabled=false;
  setStatus(note('Ready. Test the code with a phone before sharing.','Готово. Проверьте код телефоном перед публикацией.'));
 }));
 png.addEventListener('click',()=>{if(pngBlob)download(pngBlob,'murdilimax-qr.png');});
 svg.addEventListener('click',()=>{if(svgBlob)download(svgBlob,'murdilimax-qr.svg');});
}else if(kind==='compress-images'||kind==='image-converter'){
 const files=$('#ft-files'),format=$('#ft-output'),width=$('#ft-max-size'),quality=$('#ft-quality'),button=$('#ft-run');
 quality.addEventListener('input',()=>{$('#ft-quality-label').textContent=quality.value+'%';});
 button.addEventListener('click',()=>withBusy(button,async()=>{
  const input=selected(files);
  verifyFiles(input,6,80,f=>['image/jpeg','image/png','image/webp'].includes(f.type)&&f.size<=25*1048576);
  const mime=format.value,ext=mime==='image/png'?'png':mime==='image/jpeg'?'jpg':'webp';
  let done=0;
  for(const file of input){
   setStatus(note('Processing ','Обрабатываю ')+(done+1)+'/'+input.length+'…');
   const output=await renderImage(file,mime,Number(width.value),Number(quality.value)/100);
   const label=file.name+' · '+fmt(file.size)+' → '+fmt(output.blob.size)+' · '+output.width+'×'+output.height;
   resultLink(output.blob,safeName(file.name)+'.'+ext,label);done++;
  }
  setStatus(note(done+' image(s) ready. Keep your originals until you check the downloads.',done+' изображений готово. Сохраните оригиналы до проверки результата.'));
 }));
}else if(kind==='merge-pdf'){
 const getFiles=wireOrder($('#ft-files')),button=$('#ft-run');
 button.addEventListener('click',()=>withBusy(button,async()=>{
  const files=getFiles();verifyFiles(files,10,80,f=>f.name.toLowerCase().endsWith('.pdf')||f.type==='application/pdf');
  if(files.length<2)throw Error(note('Select at least two PDFs.','Выберите минимум два PDF.'));
  setStatus(note('Loading PDF engine…','Загружаю обработчик PDF…'));
  await requireScript(pdfLibrary,'PDFLib');
  const pdf=await window.PDFLib.PDFDocument.create();let count=0;
  for(let i=0;i<files.length;i++){
   setStatus(note('Reading PDF ','Читаю PDF ')+(i+1)+'/'+files.length+'…');
   let src;
   try{src=await window.PDFLib.PDFDocument.load(await files[i].arrayBuffer());}
   catch(e){throw Error(note('Cannot read (encrypted or damaged): ','Не удаётся открыть (пароль или повреждение): ')+files[i].name);}
   const copied=await pdf.copyPages(src,src.getPageIndices());
   copied.forEach(p=>pdf.addPage(p));count+=copied.length;
  }
  const bytes=await pdf.save();
  const blob=new Blob([bytes],{type:'application/pdf'});
  resultLink(blob,'murdilimax-merged.pdf',note('Merged '+count+' pages · '+fmt(blob.size),'Объединено '+count+' страниц · '+fmt(blob.size)));
  setStatus(note('Your merged PDF is ready. Check signatures and page order before use.','PDF готов. Проверьте страницы и электронные подписи перед использованием.'));
 }));
}else if(kind==='images-to-pdf'){
 const getFiles=wireOrder($('#ft-files')),button=$('#ft-run');
 button.addEventListener('click',()=>withBusy(button,async()=>{
  const files=getFiles();verifyFiles(files,20,80,f=>['image/jpeg','image/png','image/webp'].includes(f.type)&&f.size<=25*1048576);
  setStatus(note('Loading PDF engine…','Загружаю обработчик PDF…'));
  await requireScript(pdfLibrary,'PDFLib');
  const pdf=await window.PDFLib.PDFDocument.create();
  const paper=$('#ft-paper').value;
  const sheet=paper==='letter'?[612,792]:[595.28,841.89];
  for(let i=0;i<files.length;i++){
   setStatus(note('Adding image ','Добавляю фото ')+(i+1)+'/'+files.length+'…');
   const f=files[i];
   // Render through Canvas to apply EXIF orientation and constrain memory usage.
   const r=await renderImage(f,f.type==='image/png'?'image/png':'image/jpeg',2400,0.86);
   const raw=await r.blob.arrayBuffer();
   const embedded=r.blob.type==='image/png'?await pdf.embedPng(raw):await pdf.embedJpg(raw);
   const orientation=r.width>r.height?[sheet[1],sheet[0]]:sheet;
   const page=pdf.addPage(orientation);
   const margin=30,availableW=orientation[0]-margin*2,availableH=orientation[1]-margin*2;
   const scale=Math.min(availableW/embedded.width,availableH/embedded.height);
   const drawW=embedded.width*scale,drawH=embedded.height*scale;
   page.drawImage(embedded,{x:(orientation[0]-drawW)/2,y:(orientation[1]-drawH)/2,width:drawW,height:drawH});
  }
  const bytes=await pdf.save();const blob=new Blob([bytes],{type:'application/pdf'});
  resultLink(blob,'murdilimax-images.pdf',note('PDF with '+files.length+' page(s) · '+fmt(blob.size),'PDF на '+files.length+' страниц · '+fmt(blob.size)));
  setStatus(note('Your PDF is ready. Open it to verify clarity and page order.','PDF готов. Откройте его и проверьте читаемость и порядок страниц.'));
 }));
}
})();
