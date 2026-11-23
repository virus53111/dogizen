/* Secure owner-only manual listings. Real adult consent required. */
"use strict";
const $=sel=>document.querySelector(sel);
let current=[];
let editing=null;
/* 50 private prefill drafts; no profile is published until admin uploads a real consented photo. */
const GEO_PRESETS=[["LV","Рига"],["LV","Даугавпилс"],["LV","Лиепая"],["LV","Юрмала"],["LV","Вентспилс"],["EE","Таллин"],["EE","Тарту"],["EE","Нарва"],["LT","Вильнюс"],["LT","Каунас"],["LT","Клайпеда"],["DE","Берлин"],["DE","Гамбург"],["DE","Мюнхен"],["DE","Франкфурт"],["DE","Кёльн"],["PL","Варшава"],["PL","Краков"],["PL","Гданьск"],["PL","Вроцлав"],["FR","Париж"],["FR","Лион"],["FR","Марсель"],["ES","Мадрид"],["ES","Барселона"],["ES","Валенсия"],["IT","Рим"],["IT","Милан"],["IT","Турин"],["SE","Стокгольм"],["SE","Гётеборг"],["FI","Хельсинки"],["FI","Тампере"],["NO","Осло"],["NO","Берген"],["NL","Амстердам"],["NL","Роттердам"],["BE","Брюссель"],["BE","Антверпен"],["AT","Вена"],["AT","Грац"],["CH","Цюрих"],["CH","Женева"],["IE","Дублин"],["IE","Корк"],["CZ","Прага"],["CZ","Брно"],["DK","Копенгаген"],["DK","Орхус"],["PT","Лиссабон"]];
const PROFILE_DRAFTS=[["Алина",27,"Ищу приятное знакомство","Мне нравится, когда знакомство начинается с простого разговора и доброго отношения. Хочу познакомиться с мужчиной, с которым можно открыто обсуждать заботу и взаимную поддержку в отношениях, без покупки интимных встреч.","support"],["Алексей",34,"Открыт новым знакомствам","Ценю уважительный разговор и возможность спокойно узнать друг друга. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Марина",32,"Хочу встретить близкого по духу","В общении ценю тактичность, чувство юмора и умение уважать чужие границы. Буду рада знакомству с мужчиной для общения и свиданий без материальных условий.","noncommercial"],["Максим",29,"Ищу девушку для общения","Мне нравится общение, в котором легко шутить и говорить серьёзно. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Елена",41,"Важны уважение и внимание","Для меня привлекательны спокойствие, взрослый взгляд на жизнь и открытость. Хочу познакомиться с мужчиной для живого общения и встреч, если возникнет взаимная симпатия.","women-men"],["Артём",26,"Давай познакомимся","Для меня важны взаимная симпатия и искренние намерения. Ищу женщину, с которой можно честно говорить о взаимной поддержке и отношениях, без оплаты интимных встреч.","support"],["София",24,"Начнём с интересного разговора","Мне близки лёгкость в общении и возможность узнавать человека без спешки. Буду рада знакомству с мужчиной для общения и свиданий без материальных условий.","noncommercial"],["Андрей",43,"Ищу понимание и симпатию","Считаю, что уважение и доверие — основа хороших отношений. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Виктория",29,"Открыта новым встречам","Симпатия для меня начинается с честности и взаимного интереса. Хочу познакомиться с мужчиной, с которым можно открыто обсуждать заботу и взаимную поддержку в отношениях, без покупки интимных встреч.","support"],["Денис",31,"Для интересных встреч","Люблю содержательные разговоры и лёгкую атмосферу без лишних обещаний. Ищу женщину для общения и свиданий без материальных ожиданий.","noncommercial"],["Ольга",38,"Ищу взаимную симпатию","Нравится общаться с людьми, которые умеют слушать и не боятся искренности. Хочу познакомиться с мужчиной, с которым можно открыто обсуждать заботу и взаимную поддержку в отношениях, без покупки интимных встреч.","support"],["Сергей",46,"Открыт новым отношениям","Мне близки спокойное общение, надёжность и взаимное уважение. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Наталья",45,"Знакомство с перспективой","Мне важны доброта, надёжность и спокойное отношение друг к другу. Буду рада знакомству с мужчиной для общения и свиданий без материальных условий.","noncommercial"],["Михаил",37,"Буду рад знакомству","Хочу найти общие темы и понять, насколько нам комфортно вместе. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Диана",26,"Буду рада общению","Люблю, когда знакомство складывается естественно, без давления и лишних ожиданий. Хочу познакомиться с мужчиной для живого общения и встреч, если возникнет взаимная симпатия.","women-men"],["Павел",33,"Ищу приятное общение","В общении ценю доброту, тактичность и готовность слышать друг друга. Ищу женщину, с которой можно честно говорить о взаимной поддержке и отношениях, без оплаты интимных встреч.","support"],["Екатерина",34,"Хочу найти своего человека","Ценю уважительное общение, самостоятельность и желание узнавать друг друга. Буду рада знакомству с мужчиной для общения и свиданий без материальных условий.","noncommercial"],["Кирилл",25,"Начнём с разговора","Предпочитаю простое знакомство без давления и лишних формальностей. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Ирина",37,"Для тёплого знакомства","Мне нравится, когда есть общие темы и можно поговорить обо всём без напряжения. Хочу познакомиться с мужчиной, с которым можно открыто обсуждать заботу и взаимную поддержку в отношениях, без покупки интимных встреч.","support"],["Роман",39,"Для встреч и общения","Мне нравится честный разговор и люди с собственным взглядом на жизнь. Ищу женщину для общения и свиданий без материальных ожиданий.","noncommercial"],["Дарья",23,"Знакомимся без спешки","Хочу начать с переписки и понять, насколько нам приятно общаться. Хочу познакомиться с мужчиной, с которым можно открыто обсуждать заботу и взаимную поддержку в отношениях, без покупки интимных встреч.","support"],["Дмитрий",42,"Ищу близкого по духу человека","Для меня важны зрелость, тепло и уважение к личному пространству. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Анастасия",30,"Открыта для отношений","Для меня важны взаимное уважение, позитивный настрой и внимание к деталям. Буду рада знакомству с мужчиной для общения и свиданий без материальных условий.","noncommercial"],["Никита",24,"Буду рад общению","Хочу познакомиться без поспешных выводов, начиная с обычной переписки. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Полина",28,"Ищу интересного собеседника","Мне близки открытые люди, которые ценят личное пространство и настоящие разговоры. Хочу познакомиться с мужчиной для живого общения и встреч, если возникнет взаимная симпатия.","women-men"],["Константин",48,"Новые знакомства","Ценю прямоту, спокойствие и человеческое отношение в любом разговоре. Ищу женщину, с которой можно честно говорить о взаимной поддержке и отношениях, без оплаты интимных встреч.","support"],["Карина",33,"Новые знакомства — новые возможности","Уважаю ясность в намерениях и стараюсь относиться к другим так же. Буду рада знакомству с мужчиной для общения и свиданий без материальных условий.","noncommercial"],["Игорь",36,"В поисках симпатии","Считаю, что хорошие отношения начинаются с искреннего интереса. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Юлия",43,"Буду рада хорошему знакомству","Зрелое общение и умение договариваться значат для меня больше красивых обещаний. Хочу познакомиться с мужчиной, с которым можно открыто обсуждать заботу и взаимную поддержку в отношениях, без покупки интимных встреч.","support"],["Виктор",50,"Общение с перспективой","Мне важно, чтобы между людьми были уважение и взаимопонимание. Ищу женщину для общения и свиданий без материальных ожиданий.","noncommercial"],["Кристина",25,"Для встреч и общения","Я за искренность, хорошее настроение и знакомства без ненужной драмы. Хочу познакомиться с мужчиной, с которым можно открыто обсуждать заботу и взаимную поддержку в отношениях, без покупки интимных встреч.","support"],["Олег",44,"Хочу познакомиться","Предпочитаю взрослое общение, в котором можно обо всём договориться. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Татьяна",47,"Хочу найти взаимопонимание","Мне важно чувствовать уважение, доверие и интерес с обеих сторон. Буду рада знакомству с мужчиной для общения и свиданий без материальных условий.","noncommercial"],["Станислав",38,"Для приятного знакомства","Хороший юмор и взаимная открытость для меня многое значат. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Валерия",31,"Ищу знакомство по интересам","Люблю спокойный диалог и людей, с которыми интересно обсуждать разные темы. Хочу познакомиться с мужчиной для живого общения и встреч, если возникнет взаимная симпатия.","women-men"],["Иван",27,"Рад новым встречам","Не люблю играть роли, предпочитаю простое и честное общение. Ищу женщину, с которой можно честно говорить о взаимной поддержке и отношениях, без оплаты интимных встреч.","support"],["Анна",36,"Рада новым знакомствам","Ценю честные намерения и не люблю, когда общение превращают в игру. Буду рада знакомству с мужчиной для общения и свиданий без материальных условий.","noncommercial"],["Александр",40,"Ищу взаимную симпатию","Важно, чтобы общение приносило радость и было комфортным обоим. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Вероника",29,"Открыта взаимной симпатии","Мне нравится лёгкое общение и внимание к тому, что важно другому человеку. Хочу познакомиться с мужчиной, с которым можно открыто обсуждать заботу и взаимную поддержку в отношениях, без покупки интимных встреч.","support"],["Евгений",45,"Хочу найти хорошего человека","Нравятся искренние разговоры и внимательное отношение друг к другу. Ищу женщину для общения и свиданий без материальных ожиданий.","noncommercial"],["Ева",22,"Давай познакомимся","Считаю, что хороший разговор — лучшее начало для любого знакомства. Хочу познакомиться с мужчиной, с которым можно открыто обсуждать заботу и взаимную поддержку в отношениях, без покупки интимных встреч.","support"],["Тимур",32,"Открыт интересному общению","Считаю, что всё начинается с доверия и умения слушать. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Людмила",49,"Для приятных встреч","Хочу общаться с человеком, который ценит зрелость и хорошее отношение. Буду рада знакомству с мужчиной для общения и свиданий без материальных условий.","noncommercial"],["Владислав",28,"Знакомимся и общаемся","Люблю лёгкий разговор, уважение и позитивный настрой. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Лилия",35,"Ищу человека для общения","Мне близки искренность и простые радости от хорошей компании. Хочу познакомиться с мужчиной для живого общения и встреч, если возникнет взаимная симпатия.","women-men"],["Антон",35,"Рад знакомству","Ценю ясность намерений и уважение к времени другого человека. Ищу женщину, с которой можно честно говорить о взаимной поддержке и отношениях, без оплаты интимных встреч.","support"],["Мария",27,"Интересно узнать друг друга","Не люблю спешку и предпочитаю узнавать человека постепенно. Буду рада знакомству с мужчиной для общения и свиданий без материальных условий.","noncommercial"],["Георгий",41,"Найти общий язык","Мне важно, чтобы мы могли общаться открыто и без лишней напряжённости. Буду рад познакомиться с женщиной для общения и встреч, если нам интересно вместе.","men-women"],["Алиса",30,"Буду рада знакомству","Считаю важными уважение, добрый юмор и общие взгляды на общение. Хочу познакомиться с мужчиной, с которым можно открыто обсуждать заботу и взаимную поддержку в отношениях, без покупки интимных встреч.","support"],["Николай",47,"Для серьёзного знакомства","Ценю честность, доброту и желание узнавать друг друга. Ищу женщину для общения и свиданий без материальных ожиданий.","noncommercial"]];
const geoPreset=document.querySelector("#geoPreset");
if(geoPreset){
 PROFILE_DRAFTS.forEach(([name,age,headline,description,category],index)=>{
  const [country,city]=GEO_PRESETS[index];
  const option=document.createElement("option");option.value=String(index);
  option.textContent=String(index+1).padStart(2,"0")+" · "+name+", "+age+" · "+city+" ("+country+")";
  geoPreset.append(option);
 });
 geoPreset.addEventListener("change",()=>{
  if(geoPreset.value==="")return;
  if(editing){notice("Сначала завершите редактирование текущей анкеты.",true);geoPreset.value="";return}
  const index=Number(geoPreset.value),draft=PROFILE_DRAFTS[index],location=GEO_PRESETS[index];
  if(!draft||!location)return;
  const [name,age,headline,description,category]=draft;
  field("display_name").value=name;
  field("age").value=age;
  field("country").value=location[0];
  field("city").value=location[1];
  field("district").value="";
  field("category").value=category;
  field("headline").value=headline;
  field("description").value=description;
  field("languages").value="";
  field("adultConfirmed").checked=false;
  field("consentConfirmed").checked=false;
  photo.value="";$("#photoPreview").removeAttribute("src");
  $("#formTitle").textContent="Черновик №"+String(index+1).padStart(2,"0")+" — "+name+", "+location[1];
  notice("Текст заполнен. Проверьте имя, возраст и город реального человека, добавьте его фото и подтвердите согласие на публикацию.");
 });
}

const form=$("#manualForm"),stat=$("#formStatus"),gate=$("#accessGate"),workspace=$("#workspace"),photo=$("#photo");
function notice(message,error=false,location=stat){
 location.textContent=message||"";
 location.style.color=error?"#ff9cae":"#f3cc81";
}
async function api(url,options){
 const response=await fetch(url,{cache:"no-store",...options});
 let result={};
 try{result=await response.json()}catch{}
 if(!response.ok)throw Object.assign(new Error(result.error||"Ошибка "+response.status),{status:response.status});
 return result;
}
function field(name){return form.elements.namedItem(name)}
function reset(){
 editing=null;
 form.reset();
 field("action").value="create";field("id").value="";
 photo.required=true;photo.value="";
 $("#photoPreview").removeAttribute("src");
 $("#formTitle").textContent="Новая анкета";
 $("#submitBtn").textContent="Опубликовать анкету";
 $("#cancelEdit").hidden=true;
 notice("");
}
function startEdit(entry){
 editing=entry.id;
 const names=["display_name","age","country","city","district","category","headline","description","languages"];
 for(const name of names)field(name).value=entry[name]??"";
 field("action").value="edit";field("id").value=entry.id;
 field("adultConfirmed").checked=false;field("consentConfirmed").checked=false;
 photo.required=false;photo.value="";
 const preview=$("#photoPreview");if(entry.avatar_url)preview.src=entry.avatar_url;else preview.removeAttribute("src");
 $("#formTitle").textContent="Редактирование: "+entry.display_name;
 $("#submitBtn").textContent="Сохранить изменения";
 $("#cancelEdit").hidden=false;
 $("#formPanel").scrollIntoView({behavior:"smooth",block:"start"});
 notice("Проверь данные и повторно подтверди согласие на публикацию.");
}
function actionButton(label,fn,cls=""){
 const b=document.createElement("button");
 b.type="button";b.className="mm-btn "+cls;b.textContent=label;
 b.onclick=async()=>{b.disabled=true;try{await fn()}catch(error){notice(error.message,true,$("#listStatus"))}finally{b.disabled=false}};
 return b;
}
function text(el,content){const node=document.createElement(el);node.textContent=String(content||"");return node}
function render(){
 const parent=$("#manualList");parent.replaceChildren();
 if(!current.length){parent.append(text("p","Анкет пока нет. Добавь первую через форму выше."));return}
 for(const item of current){
  const article=document.createElement("article");article.className="mm-card";
  const head=document.createElement("div");head.className="mm-card-head";
  const img=document.createElement("img");img.className="mm-card-photo";img.alt="Фото: "+item.display_name;
  if(item.avatar_url?.startsWith("/media/"))img.src=item.avatar_url;
  head.append(img);
  const info=document.createElement("div");
  const title=text("h3",item.display_name+", "+item.age);title.className="mm-card-name";info.append(title);
  const tag=text("span",item.status==="approved"?"Опубликовано":"Скрыто");tag.className="mm-card-tag";info.append(tag);
  const meta=text("p",item.country+" · "+item.city+(item.district?" · "+item.district:""));meta.className="mm-card-meta";info.append(meta);
  const description=text("p",item.description);description.className="mm-card-desc";info.append(description);head.append(info);article.append(head);
  const actions=document.createElement("div");actions.className="mm-card-action";
  actions.append(actionButton("Редактировать",()=>startEdit(item)));
  if(item.status==="approved")
   actions.append(actionButton("Скрыть",async()=>{await api("/api/admin/manual",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"hide",id:item.id})});await load()}));
  else
   actions.append(actionButton("Опубликовать",async()=>{await api("/api/admin/manual",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"publish",id:item.id})});await load()},"primary"));
  actions.append(actionButton("Удалить",async()=>{
   if(!confirm("Навсегда удалить анкету «"+item.display_name+"» и её фотографию?"))return;
   await api("/api/admin/manual",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"delete",id:item.id})});
   if(editing===item.id)reset();
   await load();
  },"warning"));
  article.append(actions);parent.append(article);
 }
}
async function load(){
 const data=await api("/api/admin/manual");
 current=data.listings||[];
 render();
 notice("Опубликовано: "+current.filter(x=>x.status==="approved").length+" · скрыто: "+current.filter(x=>x.status!=="approved").length,false,$("#listStatus"));
 return data;
}
$("#cancelEdit").onclick=reset;
photo.addEventListener("change",()=>{
 const chosen=photo.files?.[0],preview=$("#photoPreview");
 if(!chosen){if(!editing)preview.removeAttribute("src");return}
 if(chosen.size>4*1024*1024){photo.value="";notice("Размер фото не должен превышать 4 МБ.",true);return}
 const reader=new FileReader();
 reader.onload=()=>{preview.src=reader.result};
 reader.readAsDataURL(chosen);
});
form.addEventListener("submit",async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const button=$("#submitBtn");button.disabled=true;notice("Сохраняем анкету...");
 try{
  const data=new FormData(form);
  const response=await api("/api/admin/manual",{method:"POST",body:data});
  reset();
  notice((response.listing?.status==="approved"?"Анкета опубликована!":"Анкета сохранена.")+" Открой каталог, чтобы увидеть её.");
  await load();
 }catch(error){notice(error.message,true)}finally{button.disabled=false}
});
(async()=>{
 try{
  if(window.MM_authReady)await window.MM_authReady;
  await load();
  gate.hidden=true;workspace.hidden=false;
 }catch(error){
  gate.hidden=false;workspace.hidden=true;
  gate.replaceChildren();
  const heading=text("h2",error.status===403?"Нет доступа":"Войдите в админку");
  const info=text("p",error.status===403?"Доступ есть только у подтверждённого владельца сайта.":"Для добавления анкет нужен вход в аккаунт владельца.");
  info.className="mm-muted";
  const link=document.createElement("a");link.href="/login?next=%2Fadmin-create.html";link.className="mm-btn primary";link.textContent="Войти";
  gate.append(heading,info,link);
 }
})();
