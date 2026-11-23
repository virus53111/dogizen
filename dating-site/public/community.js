document.addEventListener("DOMContentLoaded",()=>{
 const dialog=document.getElementById("roomDialog"), log=document.getElementById("roomLog");
 const form=document.getElementById("roomForm"), visible=document.getElementById("roomVisible");
 const status=document.getElementById("roomStatus"), login=document.getElementById("roomLogin");
 const member=document.getElementById("roomMember");
 let fetching=false, currentIds="", active=false;
 async function api(path,body){
  const response=await fetch(path, body===undefined?{cache:"no-store"}:{
   method:"POST", headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
  });
  if(!response.ok)throw Error(response.status===429?t("roomRate"):t("error"));
  return response.json();
 }
 function row(message){
  const li=document.createElement("li"),name=document.createElement("strong"),time=document.createElement("time"),text=document.createElement("p");
  name.textContent=message.name;
  time.textContent=new Intl.DateTimeFormat(state.lang,{dateStyle:"short",timeStyle:"short"}).format(new Date(message.sent*1000));
  text.textContent=message.body;
  if(message.listing_id){
   const link=document.createElement("a");
   const profile=new URL(location.pathname,location.origin);profile.searchParams.set("listing",message.listing_id);
   link.href=profile.pathname+profile.search;link.append(name);li.append(link);
  }else{li.append(name)}
  li.append(time);
  if(message.last_seen){
   const slot=document.createElement("span");slot.innerHTML=presenceLabel(message.last_seen);li.append(slot);
  }
  li.append(text);
  if(!message.mine){
   const report=document.createElement("button");
   report.type="button";report.textContent=t("roomReport");
   report.onclick=async()=>{
    const reason=prompt(t("reportReason"))?.trim();if(!reason)return;
    try{await api("/api/room",{action:"report",message_id:message.id,reason});status.textContent=t("roomReported")}
    catch(e){status.textContent=e.message}
   };
   li.append(report);
  }
  return li;
 }
 async function update(){
  if(fetching||!active||!dialog.open||document.hidden)return;
  fetching=true;
  try{
   const {messages}=await api("/api/room");
   const signature=JSON.stringify(messages.map(m=>[m.id,m.name,m.listing_id,m.last_seen,!!m.last_seen&&Date.now()/1000-m.last_seen<=300]));
   if(currentIds===signature)return;
   const bottom=!currentIds||log.scrollHeight-log.scrollTop-log.clientHeight<30;
   currentIds=signature;
   log.replaceChildren(...messages.map(row));
   if(!messages.length){const empty=document.createElement("li");empty.textContent=t("roomEmpty");log.append(empty)}
   if(bottom)log.scrollTop=log.scrollHeight;
  }catch(e){status.textContent=e.message}finally{fetching=false}
 }
 async function openRoom(){
  if(!dialog.open)dialog.showModal();
  active=false;member.classList.add("hidden");login.classList.add("hidden");status.textContent=t("loading");
  currentIds="";log.replaceChildren();
  try{
   const {user}=await api("/api/session");
   active=!!user;visible.checked=!!user?.visible;
   member.classList.toggle("hidden",!user);login.classList.toggle("hidden",!!user);
   login.href=loginPath({panel:"room"});status.textContent="";
   await update();
  }catch(e){status.textContent=e.message}
 }
 visible.onchange=async()=>{
  visible.disabled=true;
  try{await api("/api/presence",{visible:visible.checked})}
  catch(e){visible.checked=!visible.checked;status.textContent=e.message}
  finally{visible.disabled=false}
 };
 form.onsubmit=async e=>{
  e.preventDefault();
  const field=form.querySelector("textarea"),button=form.querySelector("button");
  const body=field.value.trim();if(!body||button.disabled)return;
  status.textContent="";button.disabled=true;
  try{await api("/api/room",{body});field.value="";await update()}
  catch(err){status.textContent=err.message}finally{button.disabled=false}
 };
 function heartbeat(){if(!document.hidden&&state.user)api("/api/presence",{}).catch(()=>{})}
 document.getElementById("roomOpen").onclick=openRoom;
 document.addEventListener("visibilitychange",()=>{heartbeat();update()});
 setInterval(update,6000);setInterval(heartbeat,60000);
 if(new URLSearchParams(location.search).get("panel")==="room"){consumeReturnKey("panel");openRoom()}
});
