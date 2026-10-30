import {mkdirSync,cpSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
mkdirSync('dist',{recursive:true});cpSync('public','dist',{recursive:true});
const host='https://cenaradar.online';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tokens=[
 {s:'RAVE',full:'RaveDAO',note:'резкое движение цены и длинные верхние тени',tip:'Для RAVE важна проверка размера доступных заявок по обе стороны стакана. Кратковременный максимум свечи нельзя принимать за цену, по которой удастся продать значительную позицию.',risk:'Сравни текущую цену с максимумом суток и смоделируй продажу суммы своей позиции, а не только покупку.'},
 {s:'BTC',full:'Bitcoin',note:'глубину и исполнение ордеров',tip:'Биткоин обычно служит ликвидным эталоном для сравнения исполнения на MEXC, но и здесь видимая глубина стакана может резко меняться во время новостей.',risk:'Сравни spread, объём в пределах одного процента цены и потери при продаже.'},
 {s:'ETH',full:'Ethereum',note:'разницу между спредом и проскальзыванием',tip:'При работе с ETH/USDT важно различать разницу между лучшими bid и ask и среднюю цену исполнения крупного ордера по нескольким уровням.',risk:'Оцени глубину ближайших уровней стакана, прежде чем рассчитывать доходность.'},
 {s:'SOL',full:'Solana',note:'ускорение объёма и риск волатильности',tip:'У SOL/USDT пятиминутные всплески оборота могут происходить на фоне общего движения рынка: один всплеск не доказывает начало тренда.',risk:'Проверь движение за 5, 15 и 60 минут и доступный объём для выхода.'},
 {s:'XRP',full:'XRP',note:'короткие импульсы и ликвидность',tip:'Для XRP/USDT сравнение объёма свечи с обычным уровнем помогает отличать необычную активность от спокойного периода рынка.',risk:'Смотри не только проценты роста, но и цену исполнения после комиссии.'},
 {s:'DOGE',full:'Dogecoin',note:'импульсы и спекулятивные всплески',tip:'DOGE/USDT может реагировать на краткосрочные новости и изменения настроений. Всплеск объёма не гарантирует продолжения движения.',risk:'Сопоставь размер позиции с глубиной стакана и используй историю закрытых свечей.'},
 {s:'PEPE',full:'Pepe',note:'волатильность и выход из мемкоина',tip:'В PEPE/USDT маленькие абсолютные изменения цены могут означать большие проценты. Для расчёта исполнения важен долларовый объём ордера, а не число токенов.',risk:'Перед входом оцени, что произойдёт при продаже позиции и резком расширении спреда.'},
 {s:'BONK',full:'Bonk',note:'торговлю на быстрых свечах',tip:'В BONK/USDT полезно проверять верхние тени свечей и глубину стакана на покупку: сильное движение может быстро развернуться.',risk:'Проверяй доступный объём по bid и не путай пиковую цену с исполнимой.'},
 {s:'SUI',full:'Sui',note:'изменение объёмов и краткосрочные развороты',tip:'Для SUI/USDT относительное ускорение объёма имеет смысл лишь вместе с проверкой фактической ликвидности и поведения свечей.',risk:'Используй Risk X-Ray, чтобы увидеть модельную стоимость выхода на разных размерах.'},
 {s:'TRUMP',full:'Official Trump',note:'риски пампов и быстро меняющейся ликвидности',tip:'Сильно спекулятивная торговля может создавать длинные свечи. На TRUMP/USDT важно проверять, насколько быстро может сократиться покупательская сторона стакана.',risk:'Не считай экстремальный максимум свечи гарантированной ценой продажи.'},
 {s:'PUMP',full:'Pump.fun',note:'признаки краткосрочного разгона',tip:'PUMP/USDT следует оценивать по подтверждённым свечам: ускорение цены без устойчивого объёма может оказаться кратковременным.',risk:'Для крупных объёмов оцени модельные потери исполнения и доступность bid-уровней.'},
 {s:'HYPE',full:'Hyperliquid',note:'торговый объём и ликвидность стакана',tip:'HYPE/USDT можно сравнивать с другими активами по текущему спреду и сумме заявок в пределах одного процента от цены.',risk:'Прошлые свечи не позволяют узнать будущую цену, но помогают увидеть недавнюю волатильность.'}
];
const guideData=[
 {slug:'mexc-volume-spike',title:'Как найти взрыв объёма на MEXC: сканер 5-минутных свечей',intro:'Всплеск объёма — это факт увеличения торговой активности, но не гарантия пампа.',sections:[
 ['Почему важна собственная норма токена','Большой оборот BTC не равен большому обороту малоизвестного актива. Для сравнения берут объём уже закрытой свечи, делят его на медиану предыдущих торговых свечей и фиксируют кратность. Так можно увидеть, что активность действительно необычна для этой пары.'],
 ['Почему свеча должна закрыться','Текущая пятиминутная свеча ещё формируется. Если сравнивать неполный объём или пиковую цену с завершёнными свечами, получатся вводящие в заблуждение сигналы. CenaRadar использует завершённые свечи и отдельно указывает время наблюдения.'],
 ['Что проверить после сигнала','Первым делом посмотри, насколько далеко уже ушла цена, есть ли реальный объём по обе стороны стакана, сколько составит спред и модельное проскальзывание для твоей суммы. Сам по себе взрыв объёма ничего не говорит о направлении следующей свечи.'],
 ['Как использовать без обещаний прибыли','Сравни несколько периодов, запиши время обнаружения, затем проверь, что происходило через час и четыре часа. Учитывай комиссию и ошибки исполнения. Даже удачные исторические примеры не доказывают, что стратегия будет прибыльной.']
 ]},
 {slug:'mexc-orderbook-slippage',title:'Проскальзывание на MEXC: как проверить выход из токена',intro:'Короткий пик цены не означает, что крупную позицию удастся закрыть по этой цене.',sections:[
 ['Что такое bid и ask','Bid — лучшие доступные заявки покупателей, ask — предложения продавцов. Для продажи своей позиции ты фактически используешь заявки покупателей, а не последнюю показанную цену сделки.'],
 ['Почему важна глубина стакана','Если на первом уровне bid есть только небольшая сумма, большой рыночный ордер потребляет следующие уровни по всё более низким ценам. Цена среднего исполнения оказывается хуже лучшего bid. Чем тоньше книга, тем выше риск.'],
 ['Что рассчитывает Risk X-Ray','CenaRadar берёт снимок 100 доступных уровней стакана и имитирует исполнение ордера выбранного размера. Показывает, хватает ли видимого объёма, среднюю цену и условные расходы с указанной комиссией. Для другого размера расчёт может дать совершенно иной результат.'],
 ['Границы модели','Книга может измениться до отправки ордера, заявки могут исчезнуть, а скрытая ликвидность может появиться. Поэтому X-Ray — предварительная оценка риска, а не гарантированная цена исполнения. Пересчитывай данные непосредственно перед торговлей.']
 ]}
];
const head=(title,description,url,extra='')=>`<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-snippet:-1"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="CenaRadar"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary"><meta name="theme-color" content="#090e13"><link rel="stylesheet" href="/seo.css">${extra}</head><body><header><a class="logo" href="/">◉ CENA<span>RADAR</span></a><nav><a href="/#hunter">RAVE HUNTER</a><a href="/#xray">RISK X-RAY</a><a href="/#markets">ВСЕ ПАРЫ</a></nav></header><main>`;
const footer=`</main><footer><a href="/">CenaRadar — скринер MEXC</a> · Независимый аналитический сайт, не официальный продукт биржи. Не инвестиционная рекомендация. <a href="https://s.mexc.com/referral/MJ5URa4FkX" rel="sponsored noopener noreferrer" target="_blank">Партнёрская регистрация MEXC</a></footer></body></html>`;
const links=[];
const structured=(title,url)=>'<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:title,url,isPartOf:{'@type':'WebSite',name:'CenaRadar',url:host},inLanguage:'ru'}).replace(/</g,'\\u003c')+'</script>';
for(const token of tokens){
 const symbol=token.s+'USDT',slug=symbol.toLowerCase(),url=host+'/pairs/'+slug+'/';
 const title=token.s+'/USDT на MEXC — анализ стакана, риска и объёма | CenaRadar';
 const description=token.full+' ('+token.s+'/USDT) на MEXC: стакан, спред, доступная ликвидность и риск выхода из позиции. Бесплатный Risk X-Ray и живой анализ пары.';
 const body=head(title,description,url,structured(title,url))+
 `<div class="bread"><a href="/">CenaRadar</a> / <a href="/#markets">Все пары MEXC</a> / ${token.s}/USDT</div>
 <span class="eyebrow">MEXC SPOT / ${token.s}USDT / НЕЗАВИСИМЫЙ АНАЛИЗ</span>
 <h1>${token.s}/USDT на MEXC: стакан, ликвидность и риск</h1>
 <p class="lead">${esc(token.full)} — торговая пара ${token.s}/USDT. Здесь можно проверить ${esc(token.note)}, определить, как текущие заявки влияют на цену исполнения, и открыть реальные сделки в скринере CenaRadar.</p>
 <div class="cta-row"><a class="primary" href="/?pair=${symbol}">ОТКРЫТЬ ЖИВОЙ АНАЛИЗ ${token.s}/USDT ↗</a><a href="/#xray">СРАВНИТЬ ЛИКВИДНОСТЬ В RISK X-RAY ↗</a></div>
 <section class="live-panel"><h2>Текущий рынок ${token.s}/USDT</h2><div id="live-data" data-symbol="${symbol}"><p>Цена и спред загружаются из официального MEXC API при открытии страницы. При недоступности данных цифры не подменяются.</p></div><p class="hint">Информация обновляется при загрузке страницы и может устареть. Предыдущие цены не гарантируют будущих результатов.</p></section>
 <section><h2>Что важно проверить именно в ${token.s}/USDT</h2><p>${esc(token.tip)}</p><p>${esc(token.risk)}</p></section>
 <section><h2>Как читать скринер</h2><p><b>Спред</b> — разница лучшей цены покупки и продажи на рынке. <b>Глубина</b> показывает доступные заявки на нескольких ценовых уровнях. <b>Проскальзывание</b> — отличие ожидаемой цены исполнения от базового ориентира при покупке или продаже на определённую сумму.</p><p>При просмотре необычных свечей в первую очередь смотри на реальные исполненные сделки и объёмы. В отличие от вершины свечи, глубина стакана помогает оценить, какую часть позиции можно было бы реально продать по доступным ценам.</p></section>
 <section><h2>Другие инструменты CenaRadar</h2><p><a href="/guides/mexc-volume-spike/">Что значит взрыв объёма на MEXC</a> · <a href="/guides/mexc-orderbook-slippage/">Как рассчитать проскальзывание</a></p></section>
 <script defer src="/seo-pair.js"></script>`+footer;
 const folder=join('dist','pairs',slug);mkdirSync(folder,{recursive:true});writeFileSync(join(folder,'index.html'),body);
 links.push(url);
}
for(const guide of guideData){
 const url=host+'/guides/'+guide.slug+'/';
 const description=guide.intro+' Разбор по данным MEXC, критерии наблюдения и ограничения.';
 const title=guide.title+' | CenaRadar';
 const body=head(title,description,url,structured(title,url))+
 `<div class="bread"><a href="/">CenaRadar</a> / Руководства / ${esc(guide.title)}</div><span class="eyebrow">РУКОВОДСТВО CENARADAR</span><h1>${esc(guide.title)}</h1><p class="lead">${esc(guide.intro)}</p><div class="cta-row"><a class="primary" href="/#xray">ПРОВЕРИТЬ РЕАЛЬНЫЙ СТАКАН ↗</a><a href="/#hunter">ОТКРЫТЬ RAVE HUNTER ↗</a></div>`+
 guide.sections.map(([heading,body])=>`<section><h2>${esc(heading)}</h2><p>${esc(body)}</p></section>`).join('')+
 `<section><h2>Дальше по теме</h2><p><a href="/pairs/raveusdt/">RAVE/USDT</a> · <a href="/pairs/btcusdt/">BTC/USDT</a> · <a href="/pairs/solusdt/">SOL/USDT</a> · <a href="/">Все пары MEXC</a></p></section>`+footer;
 const folder=join('dist','guides',guide.slug);mkdirSync(folder,{recursive:true});writeFileSync(join(folder,'index.html'),body);links.push(url);
}
writeFileSync('dist/robots.txt','User-agent: *\nAllow: /\nSitemap: '+host+'/sitemap.xml\n');
writeFileSync('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+[host+'/',...links].map(url=>'<url><loc>'+url+'</loc></url>').join('\n')+'\n</urlset>');
console.log('CenaRadar SEO: '+tokens.length+' token pages, '+guideData.length+' guides, sitemap generated');
