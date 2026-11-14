// Two original, illustrated calculators. No external libraries or image requests.
export const homeCalculators = [
 {
  id:'paint-calculator',icon:'▧',
  en:{
   name:'Paint Calculator',title:'Paint Calculator — Litres for Walls & Ceiling',
   description:'Estimate interior paint litres for walls and ceilings. Enter room dimensions, openings, number of coats and paint coverage. Get an editable estimate with a waste allowance.',
   lead:'How much paint will you actually need? Enter room dimensions, subtract doors and windows, choose coats and coverage, and see a transparent estimate.',
   sections:[
    ['How to calculate the area to paint','Wall area is the room perimeter (twice the length plus twice the width) multiplied by wall height. Subtract the combined area of windows and doors and add the ceiling only if you plan to paint it. The result is the net surface area. Measure irregular walls individually, and do not subtract openings that are already excluded from your wall measurements.'],
    ['How much paint for two coats?','Multiply the paintable area by the number of coats and divide by the coverage listed on your specific paint tin in square metres per litre, per coat. The calculator adds a selectable waste allowance for rollers, trays and touch-ups. Coverage varies with surface texture, absorption, colour changes and application technique, so it is a planning estimate rather than a product guarantee.'],
    ['Primer, repairs and extra paint','Fresh plaster, porous timber, patched surfaces and dramatic colour changes may require primer or an additional coat. Primer is a separate product with its own coverage. Keep a small amount of matching paint for touch-ups and check the exact batch, sheen and manufacturer recommendations before purchasing.'],
    ['Example: a small room','A 4 × 3 m room with 2.5 m walls has 35 m² of gross wall area. After subtracting 4 m² of openings, 31 m² remains. With two coats, coverage of 10 m² per litre and 10% allowance, the estimate is 6.82 litres for walls, before rounding to available tin sizes.']
   ],
   faq:[['Does the calculator include ceilings?','Only when the ceiling option is enabled.'],['Does it calculate primer?','No, primer should be estimated separately using its own product label.']]
  },
  ru:{
   name:'Калькулятор краски',title:'Калькулятор расхода краски для стен и потолка',
   description:'Рассчитайте, сколько литров краски нужно для комнаты: площадь стен и потолка, окна, двери, количество слоёв, расход и запас.',
   lead:'Сколько краски купить для ремонта? Укажите размеры комнаты, площадь окон и дверей, количество слоёв и укрывистость с банки.',
   sections:[
    ['Как рассчитать площадь стен','Периметр прямоугольной комнаты равен двум длинам плюс двум ширинам. Умножьте его на высоту стен, затем вычтите площадь дверей и окон. Если красите потолок, добавьте его площадь: длину умножьте на ширину. Для нестандартных помещений измерьте каждую стену отдельно.'],
    ['Сколько краски нужно на два слоя','Площадь для окраски умножается на число слоёв и делится на укрывистость краски в м²/л, указанную производителем для одного слоя. Сверху прибавляется запас на валик, лоток, подкраску и потери. На шероховатых, впитывающих основаниях и при смене тёмного цвета фактический расход бывает больше.'],
    ['Грунтовка и подготовка поверхности','Новая штукатурка, дерево, зашпаклёванные участки и старые отслаивающиеся покрытия требуют подготовки. Грунтовка считается отдельно — по инструкции на её упаковке. Перед закупкой проверьте влажность стен, рекомендации по слоям и совместимость материалов.'],
    ['Пример для небольшой комнаты','Для комнаты 4 × 3 м с высотой потолка 2,5 м площадь стен составляет 35 м². Вычтем 4 м² дверей и окон: остаётся 31 м². При двух слоях, укрывистости 10 м²/л и запасе 10% получаем 6,82 л для стен. Покупать стоит с учётом объёма доступных банок.']
   ],
   faq:[['Включается ли потолок?','Только если отметить опцию окраски потолка.'],['Учитывается ли грунтовка?','Нет. Её нужно рассчитать отдельно по нормам расхода выбранного материала.']]
  }
 },
 {
  id:'electricity-cost-calculator',icon:'ϟ',
  en:{
   name:'Electricity Cost Calculator',title:'Electricity Cost Calculator — Daily, Monthly & Yearly',
   description:'Estimate electricity use in kWh and cost per day, 30-day month and year. Enter appliance power, hours per day, quantity and your full per-kWh price.',
   lead:'Find out what an appliance may cost to run. Adjust watts, hours, quantity and your own electricity price to see daily, monthly and annual estimates.',
   sections:[
    ['Convert watts into energy use','Electricity is billed in kilowatt-hours (kWh). Multiply device power in watts by hours of operation and divide by 1,000. A 100 W appliance running for five hours uses about 0.5 kWh. Multiply by the number of identical devices when applicable.'],
    ['Estimate the full cost','Multiply kWh by the all-in variable price per kWh from your electricity bill. Taxes, network charges and tariff structure can vary. This calculator does not add standing charges, subscriptions or fixed grid fees, and is intended for comparing usage rather than predicting a whole bill.'],
    ['Real-world power is not always constant','A thermostat-controlled heater, refrigerator or variable-speed computer rarely uses its nameplate power continuously. Actual consumption depends on cycling, settings and use. For a more accurate estimate, measure energy with a suitable electricity meter.'],
    ['Example: a portable heater','A 1,000 W heater running for three hours a day uses 3 kWh/day. At €0.25 per kWh that equals €0.75 per day, €22.50 for 30 days and approximately €273.75 for 365 days, assuming uninterrupted daily usage at full power.']
   ],
   faq:[['Does it include fixed electricity fees?','No. It estimates usage-dependent cost only.'],['Can I use another currency?','The result uses the currency selected in the calculator; enter a matching price per kWh.']]
  },
  ru:{
   name:'Калькулятор стоимости электричества',title:'Калькулятор электроэнергии — расход и стоимость',
   description:'Рассчитайте расход электричества в кВт·ч и стоимость за день, 30 дней и год по мощности прибора, времени работы и своему тарифу.',
   lead:'Узнайте, сколько стоит работа обогревателя, компьютера или другого прибора. Введите мощность, время работы и тариф из счёта.',
   sections:[
    ['Как перевести ватты в киловатт-часы','Чтобы получить расход в кВт·ч, умножьте мощность прибора в ваттах на время работы в часах и разделите на 1000. Например, устройство мощностью 100 Вт за пять часов потребляет 0,5 кВт·ч. Для нескольких одинаковых приборов умножьте на их количество.'],
    ['Как посчитать расходы по тарифу','Умножьте полученные кВт·ч на переменную стоимость одного кВт·ч по вашему договору или счёту. При необходимости включите НДС и переменную сетевую плату в вводимую цену. Фиксированную абонентскую плату калькулятор не учитывает.'],
    ['Почему реальный расход может отличаться','Холодильник, кондиционер, обогреватель с термостатом и компьютер не обязательно используют паспортную мощность постоянно. Итог зависит от режима работы, температуры и настроек. Для точной оценки лучше измерить потребление розеточным ваттметром.'],
    ['Пример расчёта для обогревателя','Обогреватель мощностью 1000 Вт работает три часа в день. Это 3 кВт·ч. При тарифе 0,25 €/кВт·ч расходы составят 0,75 € в день, 22,50 € за 30 дней и примерно 273,75 € за 365 дней при одинаковой работе ежедневно.']
   ],
   faq:[['Учитывается ли абонентская плата?','Нет, калькулятор считает только переменную стоимость потреблённой энергии.'],['Можно ли выбрать другую валюту?','Да. Укажите тариф и выберите соответствующую валюту.']]
  }
 }
];

export function homeCalculatorBody(lang,id,esc,url){
 const tool=homeCalculators.find(x=>x.id===id);if(!tool)return null;
 const ru=lang==='ru',d=tool[lang],paint=id==='paint-calculator';
 const t=ru?{
  home:'Главная',tools:'Инструменты',calculate:'Рассчитать',quick:'Расчёт в реальном времени',
  parameters:'Параметры комнаты',power:'Параметры прибора',results:'Ваш результат',note:'Оценка, не окончательная смета',clear:'Всё меняется прямо при вводе',more:'Другие инструменты',learn:'Как считать',faq:'Частые вопросы',
  length:'Длина комнаты (м)',width:'Ширина комнаты (м)',height:'Высота стен (м)',openings:'Площадь окон и дверей (м²)',coats:'Слоёв краски',coverage:'Укрывистость (м²/л за слой)',waste:'Запас (%)',ceiling:'Покрасить также потолок',
  walls:'Площадь для покраски',litres:'Краски с запасом',area:'Площадь стен',ceilingArea:'Потолок',
  watts:'Мощность одного прибора (Вт)',hours:'Часов в сутки',devices:'Количество приборов',tariff:'Цена за 1 кВт·ч',currency:'Валюта',day:'В день',month:'За 30 дней',year:'За 365 дней',kwh:'Энергия за день'
 }:{
  home:'Home',tools:'Tools',calculate:'Calculate',quick:'Instant calculation',
  parameters:'Room dimensions',power:'Appliance details',results:'Your estimate',note:'Planning estimate — not a final quote',clear:'Results update as you type',more:'More tools',learn:'How the estimate works',faq:'Frequently asked questions',
  length:'Room length (m)',width:'Room width (m)',height:'Wall height (m)',openings:'Doors and windows (m²)',coats:'Number of coats',coverage:'Coverage (m²/L per coat)',waste:'Extra allowance (%)',ceiling:'Paint ceiling too',
  walls:'Surface to paint',litres:'Paint including allowance',area:'Wall area',ceilingArea:'Ceiling',
  watts:'Power per device (W)',hours:'Hours per day',devices:'Number of devices',tariff:'Price per kWh',currency:'Currency',day:'Per day',month:'Per 30 days',year:'Per 365 days',kwh:'Daily consumption'
 };
 const input=(id,label,value,min,max,step='any')=>'<label class="hc-field"><span>'+esc(label)+'</span><input id="hc-'+id+'" type="number" inputmode="decimal" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"></label>';
 const fields=paint?
  input('length',t.length,4,.1,100)+input('width',t.width,3,.1,100)+input('height',t.height,2.5,.1,20)+input('openings',t.openings,4,0,1000)+input('coats',t.coats,2,1,10,1)+input('coverage',t.coverage,10,.1,50)+input('waste',t.waste,10,0,50)+
  '<label class="hc-check"><input type="checkbox" id="hc-ceiling"><span>'+esc(t.ceiling)+'</span></label>':
  input('watts',t.watts,1000,0,1000000)+input('hours',t.hours,3,0,24)+input('devices',t.devices,1,1,1000,1)+input('tariff',t.tariff,.25,0,1000)+
  '<label class="hc-field"><span>'+esc(t.currency)+'</span><select id="hc-currency"><option value="EUR">EUR €</option><option value="USD">USD $</option><option value="GBP">GBP £</option></select></label>';
 const output=(id,label)=>'<div class="hc-result"><span>'+esc(label)+'</span><strong id="hc-'+id+'">—</strong></div>';
 const values=paint?output('litres',t.litres)+output('net-area',t.walls)+output('wall-area',t.area)+output('ceiling-area',t.ceilingArea):
  output('day',t.day)+output('month',t.month)+output('year',t.year)+output('kwh',t.kwh);
 const wallSvg='<svg viewBox="0 0 640 420" role="img" aria-labelledby="hc-art-title" xmlns="http://www.w3.org/2000/svg"><title id="hc-art-title">'+esc(ru?'Иллюстрация окрашенной комнаты с валиком':'Illustrated painted room and roller')+'</title><defs><linearGradient id="paint-wall" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f4e0b7"/><stop offset="1" stop-color="#f2bd75"/></linearGradient></defs><rect width="640" height="420" rx="28" fill="#e8f2e5"/><path d="M80 88 378 49 562 134 280 178Z" fill="#f8f5e9"/><path d="M80 88 280 178 280 376 80 297Z" fill="#d3e7d0"/><path d="M280 178 562 134 562 335 280 376Z" fill="url(#paint-wall)"/><path d="M80 297 280 376 562 335 359 264Z" fill="#d5af82"/><rect x="352" y="177" width="111" height="118" rx="4" fill="#fff8e9"/><rect x="362" y="187" width="91" height="98" fill="#91bcaa"/><path d="M407 187v98M362 237h91" stroke="#fff8e9" stroke-width="7"/><path d="M168 153v140" stroke="#fff" stroke-width="11" stroke-linecap="round"/><path d="M159 185h60" stroke="#fff" stroke-width="11" stroke-linecap="round"/><g transform="rotate(-23 495 205)"><rect x="486" y="115" width="23" height="107" rx="9" fill="#224b41"/><rect x="458" y="85" width="83" height="39" rx="12" fill="#ffda8c" stroke="#224b41" stroke-width="8"/><path d="M498 222v70" stroke="#224b41" stroke-width="9" stroke-linecap="round"/></g><circle cx="112" cy="350" r="30" fill="#ffdb92"/><path d="M104 334 124 350 103 365" fill="none" stroke="#264e42" stroke-width="7" stroke-linecap="round"/></svg>';
 const energySvg='<svg viewBox="0 0 640 420" role="img" aria-labelledby="hc-art-title" xmlns="http://www.w3.org/2000/svg"><title id="hc-art-title">'+esc(ru?'Иллюстрация дома и электрической энергии':'Illustrated home and electricity energy')+'</title><defs><linearGradient id="energy-sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e1f5ef"/><stop offset="1" stop-color="#c9e1d2"/></linearGradient></defs><rect width="640" height="420" rx="28" fill="url(#energy-sky)"/><circle cx="506" cy="83" r="43" fill="#fee39a"/><path d="m79 206 232-153 237 153v168H79Z" fill="#fff9eb"/><path d="m68 212 243-166 245 166" stroke="#1c5147" stroke-width="23" fill="none" stroke-linejoin="round"/><path d="M93 214v146h436V214" stroke="#1c5147" stroke-width="9" fill="none"/><rect x="160" y="232" width="106" height="110" rx="9" fill="#cae5dc"/><path d="M213 232v110m-53-55h106" stroke="#f9f6e9" stroke-width="9"/><rect x="354" y="243" width="96" height="131" rx="12" fill="#eec387"/><circle cx="428" cy="312" r="5" fill="#1c5147"/><circle cx="324" cy="220" r="72" fill="#1c5147"/><path d="m338 154-48 74h34l-13 62 55-90h-38z" fill="#f9e591"/><path d="M0 370c119-54 231 41 340 0s203-34 300-5v55H0Z" fill="#75a38a"/></svg>';
 return '<section class="shell hc-page" data-home-calculator="'+esc(id)+'" data-hc-lang="'+lang+'"><nav class="breadcrumbs"><a href="'+url(lang)+'">'+esc(t.home)+'</a><span>/</span><a href="'+url(lang,'topics/tools')+'">'+esc(t.tools)+'</a><span>/</span><span>'+esc(d.name)+'</span></nav><header class="hc-hero"><div class="hc-intro"><span class="hc-eyebrow">MURDILIMAX / '+esc(t.quick)+'</span><h1>'+esc(d.name)+'</h1><p>'+esc(d.lead)+'</p><a class="hc-start" href="#hc-workspace">'+esc(t.calculate)+' ↗</a></div><div class="hc-art">'+(paint?wallSvg:energySvg)+'</div></header><section class="hc-workspace" id="hc-workspace"><div class="hc-panel"><div class="hc-panel-title"><span>01 / '+esc(paint?t.parameters:t.power)+'</span></div><div class="hc-fields">'+fields+'</div><p class="hc-hint">'+esc(t.clear)+'</p></div><div class="hc-panel hc-results"><div class="hc-panel-title"><span>02 / '+esc(t.results)+'</span></div><div class="hc-results-grid">'+values+'</div><p class="hc-hint">'+esc(t.note)+'</p><p class="hc-error" id="hc-error" role="status" aria-live="polite"></p></div></section><section class="hc-editorial"><h2>'+esc(t.learn)+'</h2>'+d.sections.map(([h,p])=>'<article><h3>'+esc(h)+'</h3><p>'+esc(p)+'</p></article>').join('')+'<h2>'+esc(t.faq)+'</h2>'+d.faq.map(([q,a])=>'<details><summary>'+esc(q)+'</summary><p>'+esc(a)+'</p></details>').join('')+'</section><div class="hc-related"><strong>'+esc(t.more)+'</strong><a href="'+url(lang,'tools/'+(paint?'electricity-cost-calculator':'paint-calculator'))+'">'+esc((paint?homeCalculators[1][lang].name:homeCalculators[0][lang].name))+' ↗</a><a href="'+url(lang,'topics/tools')+'">'+esc(t.tools)+' ↗</a></div></section>';
}
