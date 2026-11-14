(function(){
'use strict';
const root=document.querySelector('[data-renovation-budget]');
if(!root)return;
const ru=root.dataset.rbLang==='ru';
const tr=JSON.parse(root.dataset.rbTranslations);
const $=id=>root.querySelector('#rb-'+id);
const list=$('items'),error=$('error');
const fmt=n=>new Intl.NumberFormat(ru?'ru-RU':'en-GB',{style:'currency',currency:'EUR'}).format(n);
let serial=0;
const templates=[
 {name:tr.demo[0],unit:'m²',qty:60,materials:12,labor:15},
 {name:tr.demo[1],unit:'m²',qty:45,materials:4,labor:8},
 {name:tr.demo[2],unit:'m²',qty:30,materials:16,labor:14}
];
// All initial amounts are labelled examples, not Latvian reference prices.
function element(tag,attrs={},text=''){
 const el=document.createElement(tag);
 for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
 if(text)el.textContent=text;
 return el;
}
function field(label,value,name,type='text'){
 const wrap=element('label',{class:'rb-field'});
 wrap.append(element('span',{},label));
 const inp=element('input',{type,value,'data-part':name,'aria-label':label});
 if(type==='number'){
  inp.setAttribute('inputmode','decimal');
  inp.setAttribute('step','any');
  inp.setAttribute('min','0');
  inp.setAttribute('max','100000000');
 }
 if(name==='name')inp.setAttribute('maxlength','95');
 if(name==='unit')inp.setAttribute('maxlength','15');
 wrap.append(inp);return wrap;
}
function addRow(data={name:'',unit:'m²',qty:0,materials:0,labor:0}){
 if(list.children.length>=30){error.textContent=ru?'Максимум 30 строк.':'Up to 30 items.';return;}
 const row=element('div',{class:'rb-row','data-row':String(++serial)});
 row.append(
  field(tr.labels[0],data.name,'name'),
  field(tr.labels[1],data.qty,'qty','number'),
  field(tr.labels[2],data.unit,'unit'),
  field(tr.labels[3],data.materials,'materials','number'),
  field(tr.labels[4],data.labor,'labor','number'));
 const remove=element('button',{type:'button',class:'rb-remove','aria-label':tr.remove},'×');
 remove.addEventListener('click',()=>{row.remove();calculate();});
 row.append(remove);list.append(row);
 calculate();
}
function read(row,part){
 const input=row.querySelector('[data-part="'+part+'"]');
 const value=Number(input.value);
 if(input.value.trim()===''||!Number.isFinite(value)||value<0||value>1e8)return NaN;
 return value;
}
function calculate(){
 const rows=[...list.querySelectorAll('[data-row]')];
 let material=0,labor=0;
 for(const row of rows){
  const vals=['qty','materials','labor'].map(p=>read(row,p));
  if(vals.some(v=>!Number.isFinite(v))){invalidate();return;}
  material+=vals[0]*vals[1];
  labor+=vals[0]*vals[2];
 }
 const rates=['waste','contingency','vat'].map(name=>{const input=$(name);return input.value.trim()===''?NaN:Number(input.value);});
 if(rates.some(r=>!Number.isFinite(r)||r<0||r>100)||!Number.isFinite(material)||!Number.isFinite(labor)||material+labor>1e12){
  invalidate();return;
 }
 const [wasteRate,contingencyRate,vatRate]=rates;
 const materials=material*(1+wasteRate/100);
 const reserve=(materials+labor)*contingencyRate/100;
 const tax=(materials+labor+reserve)*vatRate/100;
 const total=materials+labor+reserve+tax;
 for(const [id,value] of Object.entries({materials,labor,reserve,tax,total}))$(id).textContent=fmt(value);
 error.textContent='';
}
function invalidate(){
 for(const id of ['materials','labor','reserve','tax','total'])$(id).textContent='—';
 error.textContent=ru?'Проверьте количество, цены и проценты (0–100).':'Check item quantities, prices and rates (0–100).';
}
list.addEventListener('input',calculate);
for(const name of ['waste','contingency','vat'])$(name).addEventListener('input',calculate);
$('add').addEventListener('click',()=>addRow());
templates.forEach(addRow);
calculate();
})();
