/* Visual enhancements only. All actions delegate to the existing application. */
document.addEventListener("DOMContentLoaded",()=>{
 for(const button of document.querySelectorAll("[data-lux-create]")){
  button.addEventListener("click",()=>document.getElementById("postBtn")?.click());
 }
});
