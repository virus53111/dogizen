"use strict";
(function(){
const orb=document.getElementById("orbCanvas"),priceCanvas=document.getElementById("priceChart");
function setup(canvas){
 const rect=canvas.getBoundingClientRect(),w=Math.max(10,rect.width),h=Math.max(10,rect.height),ratio=Math.min(2,devicePixelRatio||1);
 const rw=Math.round(w*ratio),rh=Math.round(h*ratio);
 if(canvas.width!==rw||canvas.height!==rh){canvas.width=rw;canvas.height=rh}
 const c=canvas.getContext("2d");c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,w,h);return{c,w,h};
}
let lastBars=[],hover=-1;
function pretty(p){if(p>1000)return p.toFixed(0);if(p>1)return p.toFixed(2);if(p>.01)return p.toFixed(4);return p.toPrecision(3)}
function drawPrice(data){
 if(!priceCanvas)return;
 if(Array.isArray(data))lastBars=data.filter(x=>x&&x.close>0);
 let {c,w,h}=setup(priceCanvas);
 if(!lastBars.length){c.fillStyle="#779589";c.font="11px JetBrains Mono";c.fillText("Нет исторических свечей",20,40);return}
 let bars=lastBars.slice(-Math.max(24,Math.min(75,Math.floor((w-70)/5))));
 let high=Math.max(...bars.map(x=>x.high)),low=Math.min(...bars.map(x=>x.low));if(!(high>low)){high*=1.04;low*=.96}
 let pad=(high-low)*.12;high+=pad;low-=pad;
 const left=12,right=w-56,top=15,plotH=h*.7,volTop=h*.75,volH=h*.17;
 const xStep=(right-left)/bars.length,candleW=Math.max(1.5,Math.min(10,xStep*.67));
 const y=p=>top+(high-p)/(high-low)*plotH;
 c.fillStyle="#162326";c.fillRect(0,0,w,h);
 c.strokeStyle="#2b3d3d";c.lineWidth=.7;c.font="9px JetBrains Mono";
 for(let i=0;i<=4;i++){
  const p=high-(high-low)*i/4,yy=y(p);
  c.beginPath();c.moveTo(left,yy);c.lineTo(right,yy);c.stroke();c.fillStyle="#8aab9a";c.textAlign="left";c.fillText(pretty(p),right+5,yy+3);
 }
 let maxVolume=Math.max(1,...bars.map(x=>x.quoteVol));
 bars.forEach((b,i)=>{
   const x=left+xStep*(i+.5),up=b.close>=b.open,color=up?"#adff5f":"#ff778d";
   c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1;c.beginPath();c.moveTo(x,y(b.high));c.lineTo(x,y(b.low));c.stroke();
   const t=Math.min(y(b.open),y(b.close)),bottom=Math.max(y(b.open),y(b.close));
   c.fillRect(x-candleW/2,t,candleW,Math.max(1,bottom-t));
   c.globalAlpha=.55;c.fillRect(x-candleW/2,volTop+volH*(1-b.quoteVol/maxVolume),candleW,volH*b.quoteVol/maxVolume);c.globalAlpha=1;
 });
 const last=bars.at(-1),lastY=y(last.close);
 c.strokeStyle="#b4ff558c";c.setLineDash([3,3]);c.beginPath();c.moveTo(left,lastY);c.lineTo(right,lastY);c.stroke();c.setLineDash([]);
 c.textAlign="left";c.fillStyle="#b4ff55";c.font="bold 9px JetBrains Mono";c.fillText(pretty(last.close),right+5,lastY-5);
 c.fillStyle="#849a91";c.font="9px JetBrains Mono";c.fillText("VOLUME",left,h-11);
 const points=[0,Math.floor(bars.length/2),bars.length-1];
 points.forEach(i=>{let t=bars[i].ts||0;c.fillText(new Date(t).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit"}),left+i*xStep,h-11)});
 if(hover>=0&&hover<bars.length){
  const b=bars[hover],x=left+xStep*(hover+.5);
  c.strokeStyle="#e9f5eb83";c.beginPath();c.moveTo(x,0);c.lineTo(x,h-16);c.stroke();
  c.fillStyle="#1f352e";c.fillRect(14,3,Math.min(w-22,210),22);
  c.fillStyle="#e8ffdd";c.fillText("O "+pretty(b.open)+"  H "+pretty(b.high)+"  L "+pretty(b.low)+"  C "+pretty(b.close),18,18);
 }
}
function initPrice(){
 if(!priceCanvas)return;
 priceCanvas.addEventListener("pointermove",e=>{
   if(!lastBars.length)return;
   const r=priceCanvas.getBoundingClientRect(),bars=lastBars.slice(-Math.max(24,Math.min(75,Math.floor((r.width-70)/5))));
   hover=Math.max(0,Math.min(bars.length-1,Math.floor((e.clientX-r.left-12)/(Math.max(1,(r.width-68)/bars.length)))));
   drawPrice();
 });
 priceCanvas.addEventListener("pointerleave",()=>{hover=-1;drawPrice()});
 if(typeof ResizeObserver!=="undefined")new ResizeObserver(()=>{if(lastBars.length)drawPrice()}).observe(priceCanvas);
}
let lastOrb=0;
const nodes=Array.from({length:27},(_,i)=>{
 const k=(i*137.508*Math.PI/180),r=.28+.55*Math.sqrt((i+1)/29);
 return{angle:k,r,speed:.02+(i%5)*.007,dot:1.4+(i%4)*.8,opacity:.26+(i%7)*.06};
});
function drawOrb(t){
 if(!orb)return;
 if(t-lastOrb<33){requestAnimationFrame(drawOrb);return}
 lastOrb=t;
 let {c,w,h}=setup(orb),cx=w*.55,cy=h*.52,rad=Math.min(w,h)*.34,theta=t*.00007;
 c.save();c.translate(cx,cy);
 c.strokeStyle="#b4ff551e";c.lineWidth=.8;
 for(let i=0;i<6;i++){
  c.beginPath();c.ellipse(0,0,rad*(.5+i*.10),rad*(.16+i*.055),-.45+Math.sin(theta)*.1,0,Math.PI*2);c.stroke();
 }
 for(let i=0;i<16;i++){let angle=i*Math.PI*2/16+theta*.4;c.beginPath();c.moveTo(Math.cos(angle)*rad*.3,Math.sin(angle)*rad*.3);c.lineTo(Math.cos(angle)*rad*.99,Math.sin(angle)*rad*.68);c.stroke()}
 nodes.forEach((node,i)=>{
  let a=node.angle+theta*(i%2?1:-1)*(1+node.speed*5),r=rad*node.r;
  let x=Math.cos(a)*r*1.16,y=Math.sin(a)*r*.60;
  let innerX=Math.cos(a-.18)*r*.85,innerY=Math.sin(a-.18)*r*.4;
  c.strokeStyle=i%4===0?"#b4ff5566":"#84dda944";c.lineWidth=.7;c.beginPath();c.moveTo(innerX,innerY);c.lineTo(x,y);c.stroke();
  c.fillStyle=i%5===0?"#e7ffcc":"#a5e8ac";c.globalAlpha=node.opacity+.12*Math.sin(t*.001+i);
  c.beginPath();c.arc(x,y,node.dot,0,Math.PI*2);c.fill();c.globalAlpha=1;
 });
 let glow=c.createRadialGradient(0,0,2,0,0,rad*.6);glow.addColorStop(0,"#a8ff57a0");glow.addColorStop(.15,"#a8ff5755");glow.addColorStop(1,"#a8ff5700");c.fillStyle=glow;c.beginPath();c.arc(0,0,rad*.6,0,Math.PI*2);c.fill();
 c.shadowBlur=24;c.shadowColor="#b4ff55";c.fillStyle="#b4ff55";c.beginPath();c.arc(0,0,5.2,0,Math.PI*2);c.fill();c.shadowBlur=0;
 c.restore();
 requestAnimationFrame(drawOrb);
}
window.MexcCharts={draw:drawPrice};
initPrice();
if(orb&&matchMedia("(prefers-reduced-motion: reduce)").matches===false)requestAnimationFrame(drawOrb);
else if(orb)drawOrb(100);
})();