// Insulation planning calculator (bilingual). Packaging coverage is for the selected thickness.
export const insulationCalculator = {
 id:'insulation-calculator',icon:'▥',
 en:{name:'Home Insulation Calculator',title:'Insulation Calculator — Wall Area, Packs & Cost',
 description:'Estimate insulation wall area, number of packs and material cost using your own room or house dimensions, window area, thickness, pack coverage and price.',
 lead:'Measure exterior walls, subtract windows and doors, then estimate insulation panels or mineral wool packs and their cost. For early planning only.',
 sections:[
 ['Measure the exterior wall area','For a simple rectangular house, enter the exterior length, width and wall height. The calculator multiplies the perimeter by height; subtract the summed areas of windows and doors. Gables, recessed walls and irregular elevations must be measured and added separately. Do not confuse floor area with wall area.'],
 ['Account for cutting waste and pack size','Real insulation boards and batts are sold in packs with a specified coverage measured in m² at a particular thickness. Enter that coverage from the manufacturer’s label. Apply an allowance for cutting and offcuts; the number of packs rounds up to whole packs. Areas of corners, returns, reveals and door/window junctions may need additional detail or material.'],
 ['Choose a thickness based on the actual wall','Thickness alone is not a sufficient insulation specification. Check the product’s declared thermal conductivity, fire classification and suitability for the substrate. Existing wooden walls need an assessment of moisture, drainage, air leakage and drying potential. Exterior wall build-ups and vapor control should be designed for the house and climate before materials are bought.'],
 ['Example of a house estimate','An 8 × 6 m rectangular house with 2.6 m exterior walls has 72.8 m² gross wall area. Subtract 12 m² of openings and add a 10% cutting allowance: the buying area is 66.88 m². If one pack covers 5 m² at the chosen thickness, buy 14 packs. At €35 per pack the indicative material cost is €490, excluding fixings, membranes, render, installation and VAT differences.']
 ],
 faq:[['Does the estimate include a roof or attic?','No. The tool calculates rectangular exterior walls only. Measure the roof and attic separately.'],['Does the cost include labor?','No. Pack cost is for insulation material only. Compare labor scopes and request a written quote.']]
 },
 ru:{name:'Калькулятор утеплителя',title:'Калькулятор утепления дома — площадь стен и упаковки',
 description:'Рассчитайте площадь наружных стен, количество упаковок утеплителя, объём материала и ориентировочную стоимость. Учитываются окна, двери, толщина и запас.',
 lead:'Посчитайте, сколько минваты или плит утеплителя нужно для стен дома. Введите размеры, окна, толщину и площадь упаковки — получите количество пачек и сумму.',
 sections:[
 ['Как измерить наружные стены дома','Для прямоугольного дома сложите длину и ширину, умножьте на два и на высоту стен. Вычтите общую площадь окон и дверей. Фронтоны, эркеры, разные высоты и сложные фасады нужно измерить отдельно. Площадь пола дома не равна площади стен под утепление.'],
 ['Сколько упаковок купить с запасом','На каждой упаковке производитель указывает, сколько квадратных метров утеплитель покрывает при определённой толщине. Введите площадь именно для выбранной толщины. Добавьте запас на подрезку и отходы. Калькулятор округляет количество пачек вверх. Откосы, примыкания и сложные углы могут потребовать дополнительного материала.'],
 ['Как выбрать толщину и не испортить деревянный дом','Нельзя определять безопасный пирог стены одной толщиной минваты. Важны теплопроводность, противопожарные характеристики, влажность дерева, продувание, водоотвод, вентиляция и возможность высыхания конструкций. Для старого деревянного дома сначала устраните гниль и протечки, затем закажите расчёт узлов влагонакопления у профильного специалиста. Не закрывайте мокрую древесину непроницаемыми слоями.'],
 ['Пример расчёта для небольшого дома','Дом 8 × 6 м с высотой наружных стен 2,6 м: общая площадь 72,8 м². Вычитаем 12 м² окон и дверей, прибавляем запас 10% — нужно покрыть 66,88 м². Если пачка содержит материал на 5 м² при выбранной толщине, понадобится 14 пачек. При цене 35 € за пачку ориентир составит 490 € только за утеплитель, без крепежа, отделки, монтажа и возможных налогов.']
 ],
 faq:[['Учитывается ли крыша и чердак?','Нет, калькулятор предназначен для простых прямоугольных наружных стен. Крышу, чердак и фронтоны считайте отдельно.'],['Включена ли работа мастеров?','Нет. Сумма отражает только стоимость введённых упаковок; расценки и полный состав работ уточняйте отдельно.']]
 }
};
export function insulationCalculatorBody(lang,id,esc,url){
 const ru=lang==='ru',d=insulationCalculator[lang],t=ru?{
 home:'Главная',tools:'Инструменты',start:'Рассчитать утеплитель',intro:'Расчёт стен • Материалы • Бюджет',
 settings:'Параметры дома',results:'Предварительная смета',length:'Длина дома, м',width:'Ширина дома, м',
 height:'Высота стен, м',openings:'Окна и двери, м²',thickness:'Толщина утеплителя, мм',
 pack:'Площадь одной упаковки, м²',reserve:'Запас на подрезку, %',price:'Цена упаковки, €',
 area:'Чистая площадь стен',buy:'Площадь с запасом',packs:'Количество упаковок',
 volume:'Объём утеплителя',cost:'Стоимость материала',notice:'Стоимость не включает монтаж, крепёж, мембраны, отделку или доставку. Толщина — ввод пользователя, а не рекомендация для конструкции.',
 learn:'Как рассчитать утепление',faq:'Частые вопросы',links:'Полезные ссылки',reference:'Сравнить расценки работ на CenaRadar',related:'Статья: как утеплить старый дом',
 project:'CenaRadar — другой проект владельца MURDILIMAX; проверяйте актуальность цен и условия подрядчика.'
 }:{
 home:'Home',tools:'Tools',start:'Estimate insulation',intro:'Wall area • Materials • Budget',
 settings:'House dimensions',results:'Planning estimate',length:'House length, m',width:'House width, m',
 height:'Exterior wall height, m',openings:'Doors and windows, m²',thickness:'Insulation thickness, mm',
 pack:'Coverage per pack, m²',reserve:'Cutting allowance, %',price:'Price per pack, €',
 area:'Net wall area',buy:'Area including allowance',packs:'Packs to buy',
 volume:'Insulation volume',cost:'Insulation material cost',notice:'Excludes labor, fixings, membranes, cladding and delivery. Entered thickness is not a building-design recommendation.',
 learn:'How to estimate',faq:'Frequently asked questions',links:'Useful links',reference:'Compare labor rates on CenaRadar',related:'Guide: insulating an older home',
 project:'CenaRadar is another project by the owner of MURDILIMAX. Verify current rates and contractor terms.'
 };
 const input=(name,label,value,min,max,step='any')=>'<label class="hc-field"><span>'+esc(label)+'</span><input id="hc-'+name+'" type="number" inputmode="decimal" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"></label>';
 const fields=input('length',t.length,8,.1,200)+input('width',t.width,6,.1,200)+input('height',t.height,2.6,.1,30)+input('openings',t.openings,12,0,10000)+input('thickness',t.thickness,150,10,600)+input('pack',t.pack,5,.01,1000)+input('reserve',t.reserve,10,0,50)+input('price',t.price,35,0,100000);
 const output=(name,label)=>'<div class="hc-result"><span>'+esc(label)+'</span><strong id="hc-'+name+'">—</strong></div>';
 const values=output('packs',t.packs)+output('cost',t.cost)+output('area',t.area)+output('buy',t.buy)+output('volume',t.volume);
 const art='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" role="img" aria-labelledby="insulation-art-title"><title id="insulation-art-title">'+esc(ru?'Иллюстрация утеплённого дома с разрезом стены':'Illustrated insulated house with wall section')+'</title><rect x="0" y="0" width="640" height="420" rx="25" fill="#e1f0df"/><path d="M74 184 306 54 548 187 548 365 74 365Z" fill="#fff6df"/><path d="M61 191 306 47 560 191" fill="none" stroke="#255449" stroke-width="23" stroke-linejoin="round"/><path d="M91 196v153h432V196" stroke="#255449" stroke-width="9" fill="none"/><path d="M100 193h78v156h-78zm91 0h78v156h-78z" fill="#e5bd80" stroke="#c58e53" stroke-width="3"/><path d="M108 203h62v137h-62zm91 0h62v137h-62z" fill="#f4d69c"/><path d="m116 211 46 40-46 40 46 41m-36-121 39 29-39 50 39 41m34-120 47 41-47 39 47 41" fill="none" stroke="#e9ad55" stroke-width="7" stroke-linecap="round"/><rect x="302" y="220" width="107" height="110" rx="7" fill="#b6dcd4"/><path d="M355 220v110M302 275h107" stroke="#fff7e5" stroke-width="10"/><rect x="443" y="246" width="61" height="103" rx="6" fill="#d9ad75"/><circle cx="491" cy="305" r="5" fill="#255449"/><path d="M52 372c88-25 180 23 275 0 95-24 193-15 313 0v48H52Z" fill="#7db28a"/><g transform="translate(45 58)"><rect x="0" y="0" width="120" height="53" rx="17" fill="#265749"/><text x="60" y="35" text-anchor="middle" font-size="26" font-weight="800" fill="#f7e9aa">150 mm</text></g></svg>';
 return '<section class="shell hc-page" data-insulation-calculator data-hc-lang="'+lang+'"><nav class="breadcrumbs"><a href="'+url(lang)+'">'+esc(t.home)+'</a><span>/</span><a href="'+url(lang,'topics/tools')+'">'+esc(t.tools)+'</a><span>/</span><span>'+esc(d.name)+'</span></nav><header class="hc-hero"><div class="hc-intro"><span class="hc-eyebrow">MURDILIMAX / '+esc(t.intro)+'</span><h1>'+esc(d.name)+'</h1><p>'+esc(d.lead)+'</p><a href="#hc-workspace" class="hc-start">'+esc(t.start)+' ↗</a></div><div class="hc-art">'+art+'</div></header><section class="hc-workspace" id="hc-workspace"><div class="hc-panel"><div class="hc-panel-title">01 / '+esc(t.settings)+'</div><div class="hc-fields">'+fields+'</div></div><div class="hc-panel hc-results"><div class="hc-panel-title">02 / '+esc(t.results)+'</div><div class="hc-results-grid">'+values+'</div><p class="hc-hint">'+esc(t.notice)+'</p><p class="hc-error" id="hc-error" role="status" aria-live="polite"></p></div></section><div class="hc-related"><strong>'+esc(t.links)+'</strong><a href="'+url(lang,'guides/insulate-old-wooden-house')+'">'+esc(t.related)+' ↗</a><a href="https://cenaradar.online/" rel="noopener noreferrer" target="_blank">'+esc(t.reference)+' ↗</a><p class="hc-hint">'+esc(t.project)+'</p></div><section class="hc-editorial"><h2>'+esc(t.learn)+'</h2>'+d.sections.map(([h,p])=>'<article><h3>'+esc(h)+'</h3><p>'+esc(p)+'</p></article>').join('')+'<h2>'+esc(t.faq)+'</h2>'+d.faq.map(([q,a])=>'<details><summary>'+esc(q)+'</summary><p>'+esc(a)+'</p></details>').join('')+'</section></section>';
}
