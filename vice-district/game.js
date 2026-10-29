import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { CityAudio } from './audio.js';

export function mountGame() {
  const $ = id => document.getElementById(id);
  const stage = $('viewport');
  const keys = new Set();
  const joystick = { x: 0, y: 0 };
  const audio = new CityAudio();
  const rnd = (() => { let s=7419; return () => { s=(s*1664525+1013904223)>>>0; return s/4294967296; }; })();
  const player = {x:2,z:21,heading:0};
  const car = {x:-1.7,z:20,heading:0,speed:0,boost:0};
  const goals = [{x:0,z:-30},{x:40,z:-40},{x:80,z:40}];
  const game = {started:false,driving:false,completed:false,time:0,step:0,toast:0,orbit:0,walk:0,walkSound:0,shake:0};
  const walls = [], traffic = [], lamps = [];
  let scene, camera, renderer, clock, man, vehicle, marker, markerRing, orangeLight;
  const bodyMat = new THREE.MeshStandardMaterial({color:0xe5a568,metalness:.55,roughness:.29});
  const blackMat = new THREE.MeshStandardMaterial({color:0x18212a,roughness:.7});
  const lightMat = new THREE.MeshBasicMaterial({color:0xffd7aa,toneMapped:false});
  const redMat = new THREE.MeshBasicMaterial({color:0xff4054,toneMapped:false});
  const cache = new Map();

  function material(color,metalness=.05,roughness=.85) {
    const key=color+'/'+metalness+'/'+roughness;
    if(!cache.has(key))cache.set(key,new THREE.MeshStandardMaterial({color,metalness,roughness}));
    return cache.get(key);
  }
  function box(w,h,d,mat,x,y,z,parent=scene) {
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.position.set(x,y,z);
    m.receiveShadow=true;
    parent.add(m);
    return m;
  }
  function cylinder(r1,r2,h,mat,x,y,z,parent=scene) {
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,10),mat);
    m.position.set(x,y,z);parent.add(m);return m;
  }
  function sign(text,atX,atY,atZ) {
    const c=document.createElement('canvas');c.width=512;c.height=128;
    const g=c.getContext('2d');g.fillStyle='#263d53';g.fillRect(0,0,512,128);
    g.strokeStyle='#ffcb93';g.lineWidth=5;g.strokeRect(7,7,498,114);
    g.font='bold 65px Arial';g.textAlign='center';g.fillStyle='#ffe8bf';g.fillText(text,256,86,480);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.08),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
    m.position.set(atX,atY,atZ);scene.add(m);
  }
  function makePerson(){
    const g=new THREE.Group(), jacket=material('#26394d'),pants=material('#253141'),skin=material('#b78364'),white=material('#ebeee9');
    box(.7,.95,.37,jacket,0,1.42,0,g);
    box(.47,.5,.05,white,0,1.43,-.21,g);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.24,12,9),skin);
    head.position.y=2.16;g.add(head);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.245,12,6,0,Math.PI*2,0,Math.PI*.43),blackMat);
    cap.position.y=2.2;g.add(cap);
    const legs=[], arms=[];
    for(const side of [-1,1]){
      const leg=new THREE.Group();leg.position.set(side*.19,.96,0);
      box(.27,.75,.30,pants,0,-.38,0,leg);
      box(.32,.17,.48,white,0,-.79,-.1,leg);
      g.add(leg);legs.push(leg);
      const arm=new THREE.Group();arm.position.set(side*.47,1.78,0);
      box(.23,.7,.25,jacket,0,-.37,0,arm);
      box(.17,.17,.19,skin,0,-.77,0,arm);
      g.add(arm);arms.push(arm);
    }
    g.userData={legs,arms};
    return g;
  }
  function makeCar(paint){
    const g=new THREE.Group();
    const color=new THREE.MeshStandardMaterial({color:paint,metalness:.65,roughness:.27});
    const trim=material('#151d28',.33,.55),glass=material('#42657b',.45,.27),tires=material('#151719',.1,.95),rims=material('#c5c9c9',.85,.15);
    box(2.37,.5,4.85,color,0,.73,0,g);
    box(2.34,.14,1.4,color,0,.93,-1.57,g);
    box(1.93,.75,2.24,trim,0,1.34,.2,g);
    box(1.79,.55,2.04,glass,0,1.43,.25,g);
    box(1.86,.1,1.88,color,0,1.80,.29,g);
    box(2.38,.15,.24,trim,0,.50,-2.37,g);
    box(2.25,.12,.25,trim,0,.49,2.34,g);
    for(const side of [-1,1]){
      for(const z of [-1.51,1.47]){
        const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.3,14),tires);
        wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.14,.46,z);g.add(wheel);
        const hub=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.32,12),rims);
        hub.rotation.z=Math.PI/2;hub.position.set(side*1.31,.46,z);g.add(hub);
      }
      box(.51,.12,.08,lightMat,side*.78,.85,-2.45,g);
      box(.47,.13,.08,redMat,side*.80,.89,2.45,g);
      box(.09,.15,.44,trim,side*1.17,1.32,-.75,g);
    }
    box(1.4,.13,.17,trim,0,1.45,2.25,g);
    return g;
  }
  function palm(x,z) {
    const h=4.7+rnd()*2;
    cylinder(.13,.24,h,material('#856548'),x,h/2,z);
    for(let n=0;n<7;n++){
      const leaf=new THREE.Mesh(new THREE.ConeGeometry(.23,2.6,5),material('#326954'));
      const angle=n*Math.PI*2/7;
      leaf.position.set(x+Math.cos(angle)*1.05,h-.3,z+Math.sin(angle)*1.05);
      leaf.rotation.z=Math.PI*.39;
      leaf.rotation.y=angle;scene.add(leaf);
    }
  }
  function building(x,z,h,index) {
    const colors=['#d9b599','#aebdc0','#d4c9b9','#ad9d9b','#a7b8af','#9f9cae'];
    const facade=material(colors[index%colors.length]);
    const dark=material('#49545c',.1,.8);
    const windowOff=material('#334759',.18,.31);
    const windowOn=new THREE.MeshStandardMaterial({color:'#d8d0ac',emissive:'#d1aa70',emissiveIntensity:.48,metalness:.15,roughness:.37});
    box(11.4,h,11.4,facade,x,h/2+.37,z);
    walls.push({x,z,w:11.4,d:11.4});
    box(11.9,.28,11.9,dark,x,h+.46,z);
    box(11.7,.18,.42,dark,x,4,z+5.92);
    for(let floor=0;floor<Math.min(9,Math.floor((h-3)/3));floor++){
      const y=5.15+floor*2.9;
      if(y>h-.6)break;
      for(const offset of [-3.3,-1.1,1.1,3.3]){
        const wm=rnd()>.5?windowOn:windowOff;
        box(1.03,1.38,.06,wm,x+offset,y,z+5.74);
        box(1.03,1.38,.06,wm,x+offset,y,z-5.74);
      }
    }
    box(2.35,2.5,.1,windowOff,x,1.65,z+5.78);
    if(index%3===0)sign(['SUNSET','NOVA','MARINA','CITY','METRO','HOTEL'][index%6],x,3.3,z+5.89);
  }
  function buildWorld(){
    scene=new THREE.Scene();scene.background=new THREE.Color('#74839b');
    scene.fog=new THREE.FogExp2('#6b7185',.0074);
    camera=new THREE.PerspectiveCamera(innerWidth<760?73:62,innerWidth/innerHeight,.1,360);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(330,24,14),new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,
      vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec3 v;void main(){float h=normalize(v).y;vec3 lo=vec3(.96,.64,.47);vec3 mid=vec3(.54,.44,.57);vec3 hi=vec3(.11,.21,.37);vec3 c=mix(lo,mid,smoothstep(.0,.29,h));c=mix(c,hi,smoothstep(.16,.89,h));gl_FragColor=vec4(c,1.);}'
    }));scene.add(sky);
    scene.add(new THREE.AmbientLight(0xa1aec8,1.2));
    scene.add(new THREE.HemisphereLight(0xc2dcf8,0x714e43,1.15));
    const sun=new THREE.DirectionalLight(0xffc89e,2.8);sun.position.set(-50,45,-85);scene.add(sun);
    const street=material('#293238',.08,.97),pave=material('#aea9a2'),stripe=material('#f4d7a0'),white=material('#d7ddd7');
    box(233,.25,233,material('#394447'),0,-.2,0);
    const roads=[-80,-40,0,40,80];
    for(const n of roads){
      box(12,.13,223,street,n,.03,0);
      box(223,.13,12,street,0,.03,n);
      for(let j=-105;j<106;j+=8){
        box(.15,.02,3.3,stripe,n,.11,j);
        box(3.3,.02,.15,stripe,j,.11,n);
      }
      for(const side of [-1,1]){
        box(.15,.19,221,white,n+side*6.7,.13,0);
        box(221,.19,.15,white,0,.13,n+side*6.7);
      }
    }
    let index=0;
    for(const bx of [-60,-20,20,60])for(const bz of [-60,-20,20,60]){
      box(29.7,.26,29.7,pave,bx,.13,bz);
      if(index%5===2){
        for(let k=0;k<5;k++)palm(bx-10+(k%3)*9,bz-10+Math.floor(k/3)*20);
        box(8,.5,1,material('#c1a490'),bx,.48,bz);
      }else{
        for(const sx of [-7,7])for(const sz of [-7,7]) building(bx+sx,bz+sz,10+rnd()*28,index++);
      }
      index++;
    }
    for(const x of roads)for(const z of roads){
      for(const dir of [-1,1]){
        for(let t=-3;t<=3;t++){
          box(.75,.025,2.8,white,x+t*1.24,.13,z+dir*9);
        }
        const px=x+dir*8,pz=z-8;
        cylinder(.09,.12,5,material('#394852',.4,.65),px,2.5,pz);
        box(.6,1.2,.4,material('#283039'),px,4.7,pz);
        for(let i=0;i<3;i++){
          const lamp=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),
            new THREE.MeshBasicMaterial({color:[0xf34a4a,0xd9a454,0x58c488][i]}));
          lamp.position.set(px,5.03-i*.33,pz+.23);scene.add(lamp);
        }
      }
    }
    for(let j=-90;j<=91;j+=18)for(const dir of [-1,1]){
      const x=dir*8.5;
      cylinder(.1,.15,6.7,material('#34434a',.5,.5),x,3.35,j);
      box(.7,.18,.68,new THREE.MeshBasicMaterial({color:0xffddb0}),x,6.8,j);
      if(j%36<8){
        const light=new THREE.PointLight(0xffc18b,2.6,13);
        light.position.set(x,6.7,j);scene.add(light);lamps.push(light);
      }
    }
    for(let n=0;n<45;n++){
      const x=(rnd()-.5)*180,z=(rnd()-.5)*180;
      if(Math.abs(x)<7||Math.abs(z)<7)continue;
      if(n%4===0)palm(x,z);
    }
    for(let i=0;i<8;i++){
      const model=makeCar(['#aec8c8','#d6b2a0','#7c9ead','#dae2c7','#c8b1d3'][i%5]);
      const vertical=i%2===0;
      const lane=[-80,-40,0,40,80][i%5]+(i%4<2?-2.8:2.8);
      const pos=-95+rnd()*190,dir=i%4<2?1:-1;
      model.position.set(vertical?lane:pos,.07,vertical?pos:lane);
      model.rotation.y=vertical?(dir>0?Math.PI:0):(dir>0?Math.PI/2:-Math.PI/2);
      scene.add(model);traffic.push({mesh:model,vertical,lane,pos,dir,speed:6+rnd()*5});
    }
    man=makePerson();man.position.set(player.x,.24,player.z);scene.add(man);
    vehicle=makeCar('#f6a44a');vehicle.position.set(car.x,.06,car.z);scene.add(vehicle);
    orangeLight=new THREE.PointLight(0xffa45f,3.0,11);orangeLight.position.set(car.x,4,car.z);scene.add(orangeLight);

    marker=new THREE.Group();
    markerRing=new THREE.Mesh(new THREE.TorusGeometry(2.6,.17,10,64),
      new THREE.MeshBasicMaterial({color:0xffd396,toneMapped:false}));
    markerRing.rotation.x=Math.PI/2;markerRing.position.y=.10;marker.add(markerRing);
    const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,8,12),
      new THREE.MeshBasicMaterial({color:0xffbe73,transparent:true,opacity:.25,depthWrite:false}));
    pillar.position.y=4;marker.add(pillar);
    const arrow=new THREE.Mesh(new THREE.ConeGeometry(.55,1,6),
      new THREE.MeshBasicMaterial({color:0xffe3ab,toneMapped:false}));
    arrow.rotation.x=Math.PI;arrow.position.y=3.6;marker.add(arrow);
    scene.add(marker);updateGoal();
    renderer=new THREE.WebGLRenderer({antialias:innerWidth>=800,alpha:false,powerPreference:'high-performance'});
    renderer.setSize(innerWidth,innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<750?1.1:1.55));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    stage.appendChild(renderer.domElement);
    clock=new THREE.Clock();
    window.addEventListener('resize',()=>{
      camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<760?73:62;camera.updateProjectionMatrix();
      renderer.setSize(innerWidth,innerHeight);
      renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<750?1.1:1.55));
    });
  }
  function toast(s,duration=2.2){
    $('toast').textContent=s;$('toast').classList.add('visible');game.toast=duration;
  }
  function updateGoal(){
    const target=goals[Math.min(game.step,2)];
    if(marker){marker.position.set(target.x,.27,target.z);marker.visible=game.step<3;}
    $('mission-title').textContent=game.step>=3?'ГОРОД ТВОЙ':'НОЧНАЯ ПОЕЗДКА · '+(game.step+1)+'/3';
    $('mission-description').textContent=game.step>=3?'Исследуй город или начни ещё раз.':'Доедь до светящегося маркера';
    $('mission-bar').style.width=(game.step/3*100)+'%';
  }
  function nearCar(){return Math.hypot(player.x-car.x,player.z-car.z);}
  function interact(){
    if(!game.started)return;
    if(game.driving){
      player.x=car.x+Math.cos(car.heading)*2.6;player.z=car.z+Math.sin(car.heading)*2.6;
      man.position.set(player.x,.24,player.z);man.visible=true;game.driving=false;car.speed=0;
      audio.door();toast('ТЫ ВЫШЕЛ ИЗ МАШИНЫ');
    }else{
      if(nearCar()>5.0){toast('ПОДОЙДИ БЛИЖЕ К МАШИНЕ');return;}
      game.driving=true;man.visible=false;audio.door();toast('ДВИГАТЕЛЬ ЗАПУЩЕН');
    }
    hud();
  }
  function boost(){
    if(!game.started)return;
    if(!game.driving){toast('СЯДЬ В МАШИНУ');return;}
    if(car.boost>0)return;
    car.boost=1.7;audio.boost();toast('НИТРО АКТИВИРОВАНО',1);
  }
  function horn(){if(game.started&&game.driving){audio.horn();toast('БИ-БИ!',.6);}}
  function collision(x,z,r){
    if(Math.abs(x)>106||Math.abs(z)>106)return true;
    return walls.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);
  }
  function update(dt){
    if(!game.started)return;
    game.time+=dt;
    let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joystick.x;
    let z=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+joystick.y;
    const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}
    if(game.driving){
      const th=-z;
      car.speed+=th*(th>=0?(car.boost>0?23:14):22)*dt;
      if(Math.abs(th)<.05)car.speed=THREE.MathUtils.damp(car.speed,0,1.1,dt);
      else car.speed=THREE.MathUtils.damp(car.speed,car.speed,0,dt);
      car.speed=THREE.MathUtils.clamp(car.speed,-9,car.boost>0?39:25);
      car.heading+=x*dt*.82*Math.sign(car.speed)*Math.min(1,Math.abs(car.speed)/7);
      const nx=car.x+Math.sin(car.heading)*car.speed*dt;
      const nz=car.z-Math.cos(car.heading)*car.speed*dt;
      if(!collision(nx,nz,1.3)){car.x=nx;car.z=nz;}
      else if(Math.abs(car.speed)>3){car.speed*=-.2;audio.hiss(.15,.08,650);toast('СТОЛКНОВЕНИЕ',.8);}
      car.boost=Math.max(0,car.boost-dt);
      vehicle.position.set(car.x,.06,car.z);vehicle.rotation.y=car.heading;
      vehicle.rotation.z=THREE.MathUtils.lerp(vehicle.rotation.z,-x*.065,Math.min(1,dt*4));
      audio.setEngine(car.speed,true,car.boost>0);
      orangeLight.position.set(car.x,4,car.z);
      const goal=goals[game.step];
      if(goal&&Math.hypot(car.x-goal.x,car.z-goal.z)<4.5){
        game.step++;audio.checkpoint();updateGoal();toast('ТОЧКА '+game.step+'/3',2.5);
        if(game.step===3){
          game.completed=true;audio.complete();
          $('final-time').textContent=Math.floor(game.time/60)+':'+String(Math.floor(game.time%60)).padStart(2,'0');
          $('complete').classList.add('show');
        }
      }
    }else{
      audio.setEngine(0,false,false);
      const ca=Math.cos(game.orbit),sa=Math.sin(game.orbit);
      const dx=x*ca+z*sa,dz=z*ca-x*sa;
      const speed=keys.has('ShiftLeft')?7:4.6;
      const nx=player.x+dx*speed*dt,nz=player.z+dz*speed*dt;
      if(!collision(nx,nz,.34)){player.x=nx;player.z=nz;}
      if(len>.1){
        player.heading=Math.atan2(dx,-dz);
        game.walk+=dt*9;game.walkSound+=dt;
        if(game.walkSound>.42){game.walkSound=0;audio.footsteps();}
      }else game.walk=0;
      man.position.set(player.x,.24+Math.abs(Math.sin(game.walk))*.05,player.z);
      man.rotation.y=THREE.MathUtils.lerp(man.rotation.y,player.heading,Math.min(1,dt*12));
      man.userData.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(game.walk+i*Math.PI)*Math.min(.58,len*.7));
      man.userData.arms.forEach((arm,i)=>arm.rotation.x=Math.sin(game.walk+i*Math.PI+Math.PI)*Math.min(.32,len*.45));
    }
    for(const t of traffic){
      t.pos+=t.dir*t.speed*dt;
      if(t.pos>110)t.pos=-110;if(t.pos< -110)t.pos=110;
      t.mesh.position.set(t.vertical?t.lane:t.pos,.07,t.vertical?t.pos:t.lane);
    }
    hud();
  }
  function hud(){
    $('drive-mode').textContent=game.driving?'В МАШИНЕ':'ПЕШКОМ';
    $('speed').textContent=String(Math.round(Math.abs(car.speed)*4.2)).padStart(2,'0');
    $('gear').textContent=game.driving?(car.boost>0?'⚡ NITRO':car.speed<-.2?'REVERSE':'DRIVE'):'STREET MODE';
    const close=nearCar()<5;
    $('interaction').style.display=game.driving||close?'flex':'none';
    $('interact-button').textContent=game.driving?'E · ВЫЙТИ ИЗ МАШИНЫ':'E · СЕСТЬ В МАШИНУ';
    $('distance-label').textContent=game.driving?'':nearCar().toFixed(1)+' м';
    $('mobile-enter').textContent=game.driving?'E · ВЫЙТИ':'E · МАШИНА';
    $('tip').textContent=game.driving?(game.completed?'СВОБОДНАЯ ЕЗДА':'МАРКЕР '+(game.step+1)+'/3'):
      (close?'НАЖМИ E · СЕСТЬ В МАШИНУ':'НАЙДИ ОРАНЖЕВЫЙ СПОРТКАР');
    $('hint').textContent=game.driving?'WASD — ездить · Space — нитро · H — сигнал':'WASD — идти · E — сесть в машину';
  }
  function drawMap(){
    const c=$('minimap'),g=c.getContext('2d');
    if(!g)return;
    g.fillStyle='#1d303d';g.fillRect(0,0,180,180);
    const p=game.driving?car:player;
    g.save();g.translate(90,90);
    for(const n of [-80,-40,0,40,80]){
      g.fillStyle='#4c6370';
      g.fillRect((n-p.x)*1.15-7,-160,14,320);
      g.fillRect(-160,(n-p.z)*1.15-7,320,14);
    }
    for(const w of walls){
      const x=(w.x-p.x)*1.15,z=(w.z-p.z)*1.15;
      if(Math.abs(x)>105||Math.abs(z)>105)continue;
      g.fillStyle='#87918b';
      g.fillRect(x-w.w*.575,z-w.d*.575,w.w*1.15,w.d*1.15);
    }
    const goal=goals[game.step];
    if(goal){
      g.strokeStyle='#ffd492';g.lineWidth=4;
      g.beginPath();g.arc((goal.x-p.x)*1.15,(goal.z-p.z)*1.15,8,0,Math.PI*2);g.stroke();
    }
    if(!game.driving){
      g.fillStyle='#ffb675';g.fillRect((car.x-p.x)*1.15-4,(car.z-p.z)*1.15-6,8,12);
    }
    g.rotate(game.driving?car.heading:player.heading);
    g.fillStyle='#fff';g.beginPath();g.moveTo(0,-12);g.lineTo(-6,7);g.lineTo(0,3);g.lineTo(6,7);g.fill();
    g.restore();
  }
  function cameraUpdate(dt,t){
    if(marker){marker.rotation.y+=dt*.6;marker.scale.setScalar(1+Math.sin(t*2)*.07);}
    const p=game.driving?car:player;
    const heading=game.driving?car.heading:game.orbit;
    const dist=game.driving?13.5:8.3;
    const desired=new THREE.Vector3(p.x-Math.sin(heading)*dist,game.driving?6.7:4.9,p.z+Math.cos(heading)*dist);
    camera.position.lerp(desired,Math.min(1,dt*3.5));
    camera.lookAt(p.x+Math.sin(heading)*(game.driving?3.6:2.4),1.6,p.z-Math.cos(heading)*(game.driving?5:2.6));
    camera.fov=THREE.MathUtils.lerp(camera.fov,car.boost>0?78:(innerWidth<760?73:62),Math.min(1,dt*4));
    camera.updateProjectionMatrix();
  }
  function input(){
    window.addEventListener('keydown',e=>{
      if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
      keys.add(e.code);
      if(e.repeat)return;
      if(e.code==='KeyE'||e.code==='KeyF')interact();
      if(e.code==='Space')boost();
      if(e.code==='KeyH')horn();
    });
    window.addEventListener('keyup',e=>keys.delete(e.code));
    window.addEventListener('blur',()=>{keys.clear();joystick.x=joystick.y=0;});
    $('start').addEventListener('click',async()=>{
      $('intro').classList.add('hidden');
      game.started=true;
      try{await audio.unlock();}catch(e){console.info('Browser audio unavailable',e);}
      toast('ДОБРО ПОЖАЛОВАТЬ В VICE DISTRICT',2.7);hud();
    });
    $('audio-button').addEventListener('click',async()=>{
      try{
        if(!audio.ctx)await audio.unlock();
        const enabled=audio.toggle();
        $('audio-button').textContent=enabled?'♫ ЗВУК':'♪ ВЫКЛ';
        $('audio-button').classList.toggle('off',!enabled);
      }catch(e){toast('ЗВУК НЕДОСТУПЕН');}
    });
    $('interact-button').addEventListener('click',interact);
    $('mobile-enter').addEventListener('click',interact);
    $('mobile-boost').addEventListener('click',boost);
    $('mobile-horn').addEventListener('click',horn);
    $('continue').addEventListener('click',()=>{$('complete').classList.remove('show');});
    $('again').addEventListener('click',()=>{
      $('complete').classList.remove('show');
      game.step=0;game.time=0;game.completed=false;game.driving=false;
      player.x=2;player.z=21;player.heading=0;car.x=-1.7;car.z=20;car.heading=0;car.speed=0;car.boost=0;
      man.visible=true;man.position.set(player.x,.24,player.z);
      vehicle.position.set(car.x,.06,car.z);updateGoal();hud();toast('НОВАЯ ПОЕЗДКА');
    });
    const area=$('joystick'),handle=$('stick');
    let pointer=-1;
    const update=e=>{
      const b=area.getBoundingClientRect(),dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2);
      const f=Math.min(1,42/Math.max(1,Math.hypot(dx,dy)));
      const x=dx*f,y=dy*f;
      joystick.x=x/42;joystick.y=y/42;
      handle.style.transform='translate(calc(-50% + '+x+'px),calc(-50% + '+y+'px))';
    };
    area.addEventListener('pointerdown',e=>{if(pointer!==-1)return;pointer=e.pointerId;area.setPointerCapture(pointer);update(e);e.preventDefault();});
    area.addEventListener('pointermove',e=>{if(pointer===e.pointerId){update(e);e.preventDefault();}});
    for(const name of ['pointerup','pointercancel'])area.addEventListener(name,e=>{
      if(pointer!==e.pointerId)return;pointer=-1;joystick.x=joystick.y=0;handle.style.transform='translate(-50%,-50%)';
    });
    let dragging=false,startX=0;
    renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){dragging=true;startX=e.clientX;}});
    window.addEventListener('pointerup',()=>dragging=false);
    window.addEventListener('pointermove',e=>{if(dragging&&!game.driving){game.orbit+=(e.clientX-startX)*.005;startX=e.clientX;}});
  }
  function loop(){
    requestAnimationFrame(loop);
    const dt=Math.min(.045,clock.getDelta()),now=clock.elapsedTime;
    if(game.toast>0){game.toast-=dt;if(game.toast<=0)$('toast').classList.remove('visible');}
    update(dt);cameraUpdate(dt,now);
    if((Math.floor(now*9)!==Math.floor((now-dt)*9)))drawMap();
    renderer.render(scene,camera);
  }
  try{
    buildWorld();
    input();hud();drawMap();loop();
  }catch(err){
    console.error('City demo WebGL failure',err);
    $('webgl-error').classList.remove('hidden');
  }
}