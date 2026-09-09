const breeds = [
  ["🐶","Щенок"],["🐕","Терьер"],["🦮","Ретривер"],["🐕‍🦺","Овчарка"],
  ["🐩","Пудель"],["🐺","Хаски"],["🦊","Шпиц"],["🐾","Корги"],
  ["🦁","Лев-пёс"],["👑","Королевский пёс"],["✨","Звёздный пёс"],["💎","Алмазный пёс"]
];

const KEY = "dogizen_pages_v1";
const state = {
  id: "guest-" + Math.random().toString(36).slice(2,8),
  coins: 500, bones: 20,
  dogs: [0,0,1,1,null,null,null,null,null,null,null,null],
  drop: 0, level: 1, selected: [], auto:false, boostedUntil:0,
  quests:{merge:0,fish:0,spawn:0}, claimed:{merge:0,fish:0,spawn:0}, daily:false
};

const $ = id => document.getElementById(id);
const event = t => $("event").textContent=t;

function load(){
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||"null");
    if(saved) Object.assign(state,saved,{selected:[],auto:false});
  }catch{}
  render();
}

function save(){
  try{localStorage.setItem(KEY,JSON.stringify({...state,selected:[]}));}catch{}
}

function income(){
  let n=0;
  for(const d of state.dogs) if(d!==null) n += (d+1)*2;
  return Math.max(2,n) * (Date.now()<state.boostedUntil?5:1);
}

function render(){
  $("coins").textContent=Math.floor(state.coins);
  $("bones").textContent=Math.floor(state.bones);
  $("level").textContent=state.level;
  $("income").textContent=income();

  const b=$("board");
  b.innerHTML="";

  state.dogs.forEach((d,i)=>{
    const el=document.createElement("button");
    el.type="button";
    el.className="cell "+(d===null?"empty ":"")+(state.selected.includes(i)?"sel":"");
    el.draggable=d!==null;
    el.innerHTML=d===null?"＋":`${breeds[d][0]}<span class="lvl">Lv.${d+1}</span>`;

    el.addEventListener("click",()=>select(i));

    el.addEventListener("dragstart",e=>{
      e.dataTransfer.setData("text/plain",String(i));
    });

    el.addEventListener("dragover",e=>e.preventDefault());

    el.addEventListener("drop",e=>{
      e.preventDefault();
      merge(Number(e.dataTransfer.getData("text/plain")),i);
    });

    b.appendChild(el);
  });

  $("auto").textContent=`⚡ Auto Merge: ${state.auto?"ON":"OFF"}`;
  renderQuests();
}

function select(i){
  if(state.dogs[i]===null)return;

  if(state.selected.includes(i))
    state.selected=state.selected.filter(x=>x!==i);
  else if(state.selected.length<2)
    state.selected.push(i);
  else
    state.selected=[i];

  if(state.selected.length===2)
    merge(state.selected[0],state.selected[1]);

  render();
}

function merge(a,b){
  if(a===b || state.dogs[a]===null || state.dogs[b]===null)return;

  if(state.dogs[a]!==state.dogs[b]){
    event("Нужны две одинаковые собаки.");
    state.selected=[];
    render();
    return;
  }

  const next=state.dogs[a]+1;

  state.dogs[a]=next;
  state.dogs[b]=null;
  state.selected=[];

  state.level=Math.max(state.level,next+1);
  state.drop += 5*(next+1);
  state.coins += 10*(next+1);
  state.quests.merge++;

  event(`🧬 ${breeds[next][1]}! Получено +${5*(next+1)} дропа и монеты.`);

  render();
  save();
}

function spawn(cost=50){
  const i=state.dogs.findIndex(x=>x===null);

  if(i<0){
    event("Поле заполнено. Объедини собак.");
    return false;
  }

  if(state.coins<cost){
    event("Недостаточно монет.");
    return false;
  }

  state.coins-=cost;
  state.dogs[i]=Math.random()<.8?0:1;
  state.quests.spawn++;

  render();
  save();
  return true;
}

$("spawn").onclick=()=>spawn();

$("merge").onclick=()=>{
  if(state.selected.length===2)
    merge(...state.selected);
  else
    event("Выбери двух одинаковых собак.");
};

$("claim").onclick=()=>{
  if(!state.drop){
    event("Дропа пока нет.");
    return;
  }

  state.coins+=state.drop;
  event(`🎁 Забрано ${state.drop} монет.`);
  state.drop=0;

  render();
  save();
};

$("auto").onclick=()=>{
  state.auto=!state.auto;
  render();
  save();
};

document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));

  btn.classList.add("active");
  $(btn.dataset.tab).classList.add("active");
});

let fishRunning=false;

$("cast").onclick=()=>{
  if(fishRunning)return;

  if(state.bones<3){
    $("fishResult").textContent="Нужно 3 🦴.";
    return;
  }

  state.bones-=3;
  fishRunning=true;

  const needle=$("needle");
  let x=0,dir=1;

  const timer=setInterval(()=>{
    x+=dir*3;

    if(x>=96||x<=0)
      dir*=-1;

    needle.style.left=x+"%";
  },25);

  setTimeout(()=>{
    clearInterval(timer);
    fishRunning=false;

    const good=x>=38&&x<=62;
    const reward=good
      ?(10+Math.floor(Math.random()*21))
      :(3+Math.floor(Math.random()*7));

    state.bones+=reward;
    state.quests.fish++;

    $("fishResult").textContent=good
      ?`🦴 Отличный улов! +${reward} костей.`
      :`🦴 Неплохой улов: +${reward} костей.`;

    render();
    save();
  },1600);
};

function renderQuests(){
  const q=$("questsList");

  const rows=[
    ["merge","🧬 Объедини 3 пары",state.quests.merge,3,30],
    ["fish","🎣 Лови кости 3 раза",state.quests.fish,3,20],
    ["spawn","🐕 Получи 5 щенков",state.quests.spawn,5,25]
  ];

  q.innerHTML=rows.map(([k,t,v,max,reward])=>{
    const done=v>=max;

    return `<div class="quest">
      <div>
        <b>${t}</b>
        <small>${Math.min(v,max)}/${max} · награда ${reward} 🦴</small>
      </div>
      <button class="secondary" ${done?"":"disabled"} data-q="${k}">
        ${done?"Забрать":"В процессе"}
      </button>
    </div>`;
  }).join("");

  q.querySelectorAll("[data-q]").forEach(btn=>btn.onclick=()=>{
    const k=btn.dataset.q;
    const target={merge:3,fish:3,spawn:5}[k];

    if(state.quests[k]>=target){
      state.quests[k]-=target;
      state.bones+={merge:30,fish:20,spawn:25}[k];

      render();
      save();
    }
  });
}

$("daily").onclick=()=>{
  if(state.daily){
    event("Ежедневный бонус уже забран.");
    return;
  }

  state.daily=true;
  state.bones+=25;
  state.coins+=100;

  event("🎁 Ежедневный бонус: +25 🦴 и +100 🪙.");

  render();
  save();
};

document.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>{
  const type=b.dataset.buy;

  if(type==="boost"){
    if(state.bones<25)
      return event("Нужно 25 🦴.");

    state.bones-=25;
    state.boostedUntil=Date.now()+60000;

    event("🚀 Доход x5 на 60 секунд!");
  }

  if(type==="pack"){
    if(state.bones<30)
      return event("Нужно 30 🦴.");

    state.bones-=30;

    for(let i=0;i<4;i++)
      spawn(0);

    event("📦 Получено 4 щенка.");
  }

  if(type==="space"){
    if(state.coins<2000)
      return event("Нужно 2000 🪙.");

    state.coins-=2000;
    state.dogs.push(null,null,null,null);

    event("🏡 Открыто 4 новых места!");
  }

  render();
  save();
});

load();

setInterval(()=>{
  state.coins+=income()/60;
  render();
  save();
},1000);

setInterval(()=>{
  if(Math.random()<0.65)
    spawn(0);

  if(state.auto){
    outer:
    for(let i=0;i<state.dogs.length;i++){
      for(let j=i+1;j<state.dogs.length;j++){

        if(
          state.dogs[i]!==null &&
          state.dogs[i]===state.dogs[j]
        ){
          merge(i,j);
          break outer;
        }

      }
    }
  }
},7000);

window.addEventListener("beforeunload",save);