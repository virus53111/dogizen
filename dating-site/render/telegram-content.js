// Scheduled, public editorial posts only. No account data or direct messages.
const channel='@SinfulLiness';
const timeZone='Europe/Riga';
const posts=[
 ['first-date','💫 Первое свидание не обязательно должно быть дорогим. Кофе, прогулка или выставка? Семь идей для комфортной встречи.','/guides/first-date/'],
 ['game','❤️ Как выглядит твоё идеальное свидание? Выбери три ответа и предложи друзьям их угадать. Бесплатная игра 18+.','/ru/date-game/'],
 ['conversation','💬 Сложно начать переписку? Посмотри примеры первых сообщений и вопросов, которые помогают познакомиться без давления.','/guides/first-message/'],
 ['cities','📍 Хочется познакомиться поближе к дому? Посмотри актуальный каталог городов MurdiliMax.','/cities/'],
 ['question','☕ Вопрос дня: кофе в уютном кафе или прогулка по вечернему городу? Сравни свои предпочтения с ответами друзей.','/ru/date-game/'],
 ['latvian','🇱🇻 Kāds būtu tavs ideālais randiņš? Septiņas idejas pirmajai tikšanās reizei bez lieliem izdevumiem.','/lv/guides/first-date/'],
 ['english','✨ What makes a good first message? Try these respectful conversation starters for your next introduction.','/en/guides/first-message/']
];
export function telegramConfig(env=process.env){
 const token=env.MM_TELEGRAM_CONTENT_BOT_TOKEN||'';
 const requested=env.MM_TELEGRAM_CONTENT_ENABLED==='1';
 return {enabled:requested&&/^\d+:[A-Za-z0-9_-]{20,}$/.test(token),requested,token,channel};
}
export function scheduledPost(now){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
 // One post per local day, 18:00–18:59, no catch-up storm after downtime.
 if(parts.hour!=='18')return null;
 const day=parts.year+'-'+parts.month+'-'+parts.day;
 const ordinal=Math.floor(Date.parse(day+'T00:00:00Z')/86400000);
 const [key,body,pathname]=posts[((ordinal%posts.length)+posts.length)%posts.length];
 const url=new URL(pathname,'https://murdilimax.com');
 url.searchParams.set('utm_source','telegram');
 return {day,key,text:body+'\n\n'+url.href+'\n\nMurdiliMax · 18+'};
}
export async function publishTelegram(db,config,now=new Date(),send=fetch){
 if(!config.enabled||config.channel!==channel)return 'disabled';
 const post=scheduledPost(now);if(!post)return 'outside_window';
 // Persist a claim before the network call. Never automatically resend an uncertain delivery.
 const claimed=await db.query("INSERT INTO mm_telegram_content_log(day,content_key,status) VALUES($1,$2,'claimed') ON CONFLICT(day) DO NOTHING RETURNING day",[post.day,post.key]);
 if(!claimed.rows.length)return 'already_claimed';
 let status='failed';
 try{
  const response=await send('https://api.telegram.org/bot'+config.token+'/sendMessage',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:channel,text:post.text,link_preview_options:{is_disabled:false}}),
   signal:AbortSignal.timeout(15000),redirect:'error'
  });
  const result=await response.json();
  if(response.ok&&result.ok===true)status='sent';
 }catch{status='uncertain'}
 await db.query("UPDATE mm_telegram_content_log SET status=$2,finished_at=NOW() WHERE day=$1",[post.day,status]);
 return status;
}
export function startTelegramContent(db){
 const config=telegramConfig();
 if(!config.enabled)return;
 const tick=()=>publishTelegram(db,config).catch(()=>console.warn('Telegram content worker unavailable.'));
 void tick();setInterval(tick,60000).unref();
}
export async function telegramContentStatus(db){
 const {enabled,requested,channel}=telegramConfig();
 const {rows}=await db.query("SELECT day::text,content_key,status,finished_at FROM mm_telegram_content_log ORDER BY day DESC LIMIT 7");
 return {enabled,requested,channel,schedule:'18:00 Europe/Riga',history:rows};
}
