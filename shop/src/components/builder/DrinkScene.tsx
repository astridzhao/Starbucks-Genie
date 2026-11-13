import SyrupBottle3D from './SyrupBottle3D';
import { syrupPulses, PUMP_SECONDS } from './syrup-pulses';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createIce } from './ice';
import { drinkAppearance } from './drink-appearance';
import type { DrinkAppearance } from './drink-appearance';
import type { DrinkBuild } from '../../data/nutrition';

type Props = { build: DrinkBuild; mixToken: number; replaySyrup: number; onActivity: (message: string) => void; onUnavailable: () => void };
const clamp = THREE.MathUtils.clamp;
const smooth = (t: number) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };
const vertex = `varying vec3 vP; varying vec3 vN;
void main(){ vP=position; vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const fragment = `
uniform vec3 uCoffee; uniform vec3 uSettled; uniform vec3 uMilk; uniform vec3 uFoamColor;
uniform float uMilkAmount; uniform float uMilkAge; uniform float uMix; uniform float uTime; uniform float uHeight; uniform float uLatte; uniform float uFoam;
varying vec3 vP; varying vec3 vN;
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return .58*noise(p)+.28*noise(p*2.03)+.14*noise(p*4.09);}
void main(){
 float y=(vP.y/uHeight+.5); vec3 p=vec3(vP.x*4.,y*2.8,vP.z*4.);
 float age=clamp(uMilkAge/4.8,0.,1.);
 float warp=fbm(p+vec3(0.,-age*1.4,0.));
 float tendrils=fbm(p*vec3(1.2,1.1,1.2)+vec3(warp*2.,-age*.8,warp));
 float plume=exp(-pow((vP.x-.12+sin(y*11.+warp*4.)*.12)/(.12+(1.-y)*.3+age*.2),2.));
 float descending=smoothstep(1.-age*1.6-.2,1.-age*1.6+.2,y);
 float marbled=smoothstep(.2,.75,tendrils)*plume*descending;
 float settled=(1.-smoothstep(.08,.65,y))*age*.42;
 float distribution=mix(clamp(marbled*.9+settled,0.,1.),1.,uLatte);
 float density=mix(mix(uMilkAmount*distribution*2.3,uMilkAmount,uLatte),uMilkAmount,uMix);
 density+=uFoam*uMix*.32;
 vec3 color=mix(uCoffee,uMilk,pow(clamp(density,0.,1.),.64));
 float feather=exp(-(1.-y)*28.)*(.35+.65*tendrils)*uFoam*(1.-uMix);
 color=mix(color,uFoamColor,feather*.6);
 float side=.82+.18*dot(normalize(vN),normalize(vec3(-.5,.7,1.)));
 float depth=mix(.68,1.1,smoothstep(0.,1.,y));
 float settleBlend = max(uMix, smoothstep(1.1,4.8,uMilkAge));
 color=mix(color,uSettled,settleBlend);
 color*=side*depth; color+=vec3(.014,.009,.003)*pow(max(0.,dot(vN,vec3(-.65,.25,.7))),18.);
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

function random(seed = 57) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function disposeGroup(group: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  group.traverse(object => { const mesh = object as THREE.Mesh; if (mesh.geometry) geometries.add(mesh.geometry); if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => materials.add(material)); });
  geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); group.clear();
}

class DrinkRenderer {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, .1, 40);
  root = new THREE.Group();
  cup = new THREE.Group();
  ice = new THREE.Group();
  foam = new THREE.Group();
  pour = new THREE.Group();
  bottle = new SyrupBottle3D();
  syrupSequence: string[] = [];
  pendingMilk = false; pendingSyrup = false; pendingFoam = false;
  stream!: THREE.Mesh;
  ripple!: THREE.Mesh;
  liquid!: THREE.Mesh<THREE.CylinderGeometry, THREE.ShaderMaterial>;
  surface!: THREE.Mesh<THREE.CircleGeometry, THREE.MeshPhysicalMaterial>;
  recipe: DrinkAppearance | null = null;
  clock = 1; lastWall = 0;
  frame = 0; end = 0; start = 0; foamStart = -100; milkStart = -100; mixStart = -100; syrupStart = -100;
  mixToken = 0; replay = 0; syrupCount = 0; visible = true; destroyed = false; active = '';
  yaw = 0; targetYaw = 0; lastFrame = 0; renderedFrames = 0; reduced: boolean; inViewport = true;
  media = matchMedia('(prefers-reduced-motion: reduce)');
  reducedChanged = () => { this.reduced=this.media.matches;if(this.reduced)this.end=this.clock;this.wake(.1); };
  contextLost = () => { if(!this.destroyed)this.unavailable(); };
  visibility = () => { this.visible = this.inViewport && !document.hidden; if (this.visible) this.wake(.1); else { cancelAnimationFrame(this.frame); this.frame = 0; } };
  logo: THREE.Texture; shadowTexture: THREE.CanvasTexture; foamTexture: THREE.CanvasTexture; environment: THREE.WebGLRenderTarget;
  observer: ResizeObserver; intersection: IntersectionObserver;
  height = 2.4; fill = 2.1; foamHeight = 0;
  constructor(public canvas: HTMLCanvasElement, public activity: (message: string) => void, public unavailable: () => void) {
    this.reduced = this.media.matches;this.media.addEventListener('change',this.reducedChanged);canvas.addEventListener('webglcontextlost',this.contextLost);
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const room = new RoomEnvironment(); const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, .035); this.scene.environment = this.environment.texture;
    pmrem.dispose(); room.dispose();
    this.camera.position.set(.18, 2.9, 5.85); this.camera.lookAt(0, 1.45, 0);
    this.scene.add(this.root); this.root.add(this.cup, this.ice, this.foam);this.scene.add(this.pour,this.bottle.group);
    this.scene.add(new THREE.HemisphereLight(0xfff5e8, 0x758372, .8));
    const key = new THREE.DirectionalLight(0xfff6e9, 1.7); key.position.set(-3, 6, 4); key.castShadow = false;
    key.shadow.mapSize.set(512, 512); key.shadow.camera.left = -2; key.shadow.camera.right = 2; key.shadow.camera.top = 4; key.shadow.camera.bottom = -2; key.shadow.bias = -.0005; key.shadow.normalBias = .02; this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, .9); rim.position.set(3, 4, -3); this.scene.add(rim);
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const shadowContext=shadowCanvas.getContext('2d')!;const gradient=shadowContext.createRadialGradient(64,64,12,64,64,64);gradient.addColorStop(0,'rgba(38,41,33,.2)');gradient.addColorStop(1,'rgba(38,41,33,0)');shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,128,128);this.shadowTexture=new THREE.CanvasTexture(shadowCanvas);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.1),new THREE.MeshBasicMaterial({map:this.shadowTexture,transparent:true,depthWrite:false,toneMapped:false}));ground.rotation.x=-Math.PI/2;ground.position.y=.001;this.scene.add(ground);
    this.logo = new THREE.TextureLoader().load('/logo.png', () => this.wake(.1)); this.logo.colorSpace = THREE.SRGBColorSpace; this.logo.anisotropy = 2;
    const texture = document.createElement('canvas'); texture.width = texture.height = 256;
    const context = texture.getContext('2d')!; context.fillStyle = '#e5dfd0'; context.fillRect(0, 0, 256, 256); const rand = random();
    for (let i = 0; i < 3600; i++) { const shade = Math.floor(180 + rand() * 75); context.fillStyle = `rgb(${shade},${shade},${shade})`; context.beginPath(); context.arc(rand() * 256, rand() * 256, .2 + rand() * 1.4, 0, Math.PI * 2); context.fill(); }
    this.foamTexture = new THREE.CanvasTexture(texture); this.foamTexture.wrapS = this.foamTexture.wrapT = THREE.RepeatWrapping;
    this.observer = new ResizeObserver(() => { const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return; this.renderer.setSize(rect.width, rect.height, false); this.camera.aspect = rect.width / rect.height; this.camera.updateProjectionMatrix(); this.wake(.1); }); this.observer.observe(canvas);
    this.intersection = new IntersectionObserver(entries => { this.inViewport = entries[0].isIntersecting; this.visibility(); }, { rootMargin: '80px' }); this.intersection.observe(canvas); document.addEventListener('visibilitychange',this.visibility);
    canvas.dataset.renderer = 'webgl';
  }
  makeMesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent = this.cup) { const mesh = new THREE.Mesh(geometry, material); parent.add(mesh); return mesh; }
  build(recipe: DrinkAppearance) {
    [this.cup, this.ice, this.foam, this.pour].forEach(disposeGroup);
    const { cup, hot } = recipe; this.height = 2.5 * cup.height; const h = this.height, r = .78 * cup.width, b = .54 * cup.width;
    this.foamHeight = recipe.foam * h; this.fill = h * (hot ? .94 : .84) - this.foamHeight * .75;
    const glass = new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
      vertexShader:'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalMatrix*normal;v=-p.xyz;gl_Position=projectionMatrix*p;}',
      fragmentShader:'varying vec3 n; varying vec3 v; void main(){float edge=pow(1.-abs(dot(normalize(n),normalize(v))),2.5);gl_FragColor=vec4(.93,.98,.96,.012+edge*.3);}'
    });
    const paper = new THREE.MeshStandardMaterial({ color: 0xf4f0e7, roughness: .82 });
    const points = hot ? [new THREE.Vector2(0, .04),new THREE.Vector2(b, .04),new THREE.Vector2(r, h),new THREE.Vector2(r-.025,h),new THREE.Vector2(b-.025,.1),new THREE.Vector2(0,.1)] : [new THREE.Vector2(0,.045),new THREE.Vector2(b,.045),new THREE.Vector2(b+.015,.08),new THREE.Vector2(r,h-.02),new THREE.Vector2(r-.02,h),new THREE.Vector2(r-.04,h-.025),new THREE.Vector2(b-.02,.11),new THREE.Vector2(0,.11)];
    const shell = this.makeMesh(new THREE.LatheGeometry(points, 96), hot ? paper : glass); shell.castShadow = true;
    const rim = this.makeMesh(new THREE.TorusGeometry(r-.012, hot ? .025 : .018, 12, 96), hot ? paper : glass); rim.rotation.x = Math.PI / 2; rim.position.y = h-.01;
    const baseRing = this.makeMesh(new THREE.TorusGeometry(b-.005,.017,8,64),hot ? paper:glass);baseRing.rotation.x=Math.PI/2;baseRing.position.y=.06;
    let sleeve: THREE.Mesh | undefined;
    if (hot) {
      sleeve = this.makeMesh(new THREE.CylinderGeometry(b+(r-b)*.59+.015,b+(r-b)*.27+.015,h*.32,96,1,true),new THREE.MeshStandardMaterial({color:0xaf8b5e,roughness:.94,bumpMap:this.foamTexture,bumpScale:.025}));sleeve.position.y=h*.43;sleeve.castShadow=true;
    }
    // Keep the print in cup-local coordinates. World-space decals were clipped
    // when the cup moved sideways to make room for a syrup bottle.
    const logoHeight=h*(hot?.43:.49), logoSize=r*(hot?.74:.9), offset=hot?.018:.007;
    const logoRadius=b+(r-b)*(logoHeight/h)+offset, angle=logoSize/logoRadius;
    const logoGeometry=new THREE.CylinderGeometry(b+(r-b)*((logoHeight+logoSize/2)/h)+offset,b+(r-b)*((logoHeight-logoSize/2)/h)+offset,logoSize,48,1,true,-angle/2,angle);
    const print=this.makeMesh(logoGeometry,new THREE.MeshBasicMaterial({map:this.logo,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,toneMapped:false}));print.position.y=logoHeight;
    const fluidH=this.fill-.12, topRadius=b+(r-b)*(this.fill/h)-.033;
    const uniforms = {uCoffee:{value:new THREE.Color(recipe.coffeeColor)},uSettled:{value:new THREE.Color(recipe.settledColor)},uMilk:{value:new THREE.Color(recipe.milkColor)},uFoamColor:{value:new THREE.Color(recipe.foamColor)},uMilkAmount:{value:recipe.milkFraction},uMilkAge:{value:5},uMix:{value:0},uTime:{value:0},uHeight:{value:fluidH},uLatte:{value:recipe.milkDrink?1:0},uFoam:{value:recipe.foam}};
    this.liquid = new THREE.Mesh(new THREE.CylinderGeometry(topRadius,b-.025,fluidH,96,24),new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms})); this.liquid.position.y=.12+fluidH/2; this.cup.add(this.liquid);
    this.surface = new THREE.Mesh(new THREE.CircleGeometry(topRadius,96),new THREE.MeshPhysicalMaterial({color:recipe.coffeeColor,roughness:.3,metalness:0,clearcoat:.3,clearcoatRoughness:.14,envMapIntensity:.12}));this.surface.rotation.x=-Math.PI/2;this.surface.position.y=this.fill+.003;this.cup.add(this.surface);
    // The drink is the backdrop for tinted submerged ice. Its opaque depth
    // previously cut every cube off at the waterline, leaving only white caps.
    this.liquid.material.depthWrite = !recipe.ice;
    this.surface.material.depthWrite = !recipe.ice;
    const rand=random(122);
    if (recipe.ice) {
      this.ice.add(...createIce(cup.width, topRadius, this.fill, recipe.settledColor));
    }
    const cream=new THREE.MeshStandardMaterial({color:recipe.foamColor,roughness:.83,bumpMap:this.foamTexture,bumpScale:.009});
    if(recipe.foam) {
      const body=this.makeMesh(new THREE.CylinderGeometry(topRadius+.003,topRadius-.01,this.foamHeight,96),cream,this.foam);body.position.y=this.fill+this.foamHeight/2;
      const edge=this.makeMesh(new THREE.TorusGeometry(topRadius-.022,.026,12,96),cream,this.foam);edge.rotation.x=Math.PI/2;edge.position.y=this.fill+this.foamHeight-.016;
      for(let i=0;i<42;i++){const angle=rand()*Math.PI*2, radius=Math.sqrt(rand())*(topRadius-.025), bubble=this.makeMesh(new THREE.SphereGeometry(.005+rand()*.009,6,4),cream,this.foam);bubble.scale.y=.3;bubble.position.set(Math.cos(angle)*radius,this.fill+this.foamHeight,Math.sin(angle)*radius);}
    }
    let top=this.fill+this.foamHeight+.012;
    if(recipe.whipped){const path=[];for(let i=0;i<=160;i++){const t=i/160,a=t*Math.PI*8.4,rad=(1-t)*topRadius*.77;path.push(new THREE.Vector3(Math.cos(a)*rad,top+t*.48,Math.sin(a)*rad));}const whip=this.makeMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),160,.075,10,false),cream,this.foam);whip.castShadow=true;top+=.32;}
    if(recipe.drizzle || recipe.lining){const color=/Mocha|Chocolate/.test(recipe.drizzle+recipe.lining)?0x3c1d10:0x9b5a16;const caramel=new THREE.MeshPhysicalMaterial({color,roughness:.26,clearcoat:1});
      if(recipe.drizzle){const pts=[];for(let i=0;i<=100;i++){const x=(i/100*2-1)*topRadius*.83,z=Math.sin(i/100*Math.PI*7)*Math.sqrt(Math.max(0,topRadius*topRadius-x*x))*.73;pts.push(new THREE.Vector3(x,top+.018,z));}this.makeMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),120,.013,6,false),caramel,this.foam);}
      if(recipe.lining){for(let j=0;j<6;j++){const pts=[];for(let i=0;i<=30;i++){const y=h*(.2+i/30*.58),a=j/6*Math.PI*2+Math.sin(i/30*8)*.1,rad=b+(r-b)*(y/h)-.038;pts.push(new THREE.Vector3(Math.sin(a)*rad,y,Math.cos(a)*rad));}this.makeMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),32,.017,6,false),caramel);}}
    }
    if(recipe.toppingCount){const crumbs=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.018,0),new THREE.MeshStandardMaterial({color:0x57341c,roughness:.95}),recipe.toppingCount);const dummy=new THREE.Object3D();for(let i=0;i<recipe.toppingCount;i++){const a=rand()*Math.PI*2,rad=Math.sqrt(rand())*topRadius*.9;dummy.position.set(Math.cos(a)*rad,top+.02+rand()*.015,Math.sin(a)*rad);dummy.rotation.set(rand()*3,rand()*3,rand()*3);dummy.scale.setScalar(.45+rand()*1.2);dummy.updateMatrix();crumbs.setMatrixAt(i,dummy.matrix);}this.foam.add(crumbs);}
    if(recipe.fruitCount){const material=new THREE.MeshPhysicalMaterial({color:recipe.pearls?0x8b2543:0xbd375c,roughness:.35,clearcoat:1});for(let i=0;i<recipe.fruitCount;i++){const piece=this.makeMesh(recipe.pearls?new THREE.SphereGeometry(.045,12,8):new THREE.DodecahedronGeometry(.055,0),material);const a=rand()*Math.PI*2;piece.position.set(Math.cos(a)*topRadius*.85,.18+(recipe.pearls?rand()*.15:rand()*this.fill*.85),Math.sin(a)*topRadius*.85);}}
    this.foam.children.forEach(child => { child.position.y -= this.fill; }); this.foam.position.y = this.fill;
    if(!hot)for(let i=0;i<26;i++){const a=(rand()-.5)*Math.PI, y=h*(.16+rand()*.66), radius=b+(r-b)*(y/h)+.007;const drop=this.makeMesh(new THREE.SphereGeometry(.006+rand()*.011,7,5),glass);drop.position.set(Math.sin(a)*radius,y,Math.cos(a)*radius);drop.scale.set(1,1.35,.55);}
    if(hot)glass.dispose();else paper.dispose();
    if(!recipe.foam&&!recipe.whipped)cream.dispose();
    this.stream=this.makeMesh(new THREE.CylinderGeometry(.017,.022,1,10),new THREE.MeshPhysicalMaterial({color:recipe.milkColor,roughness:.2,clearcoat:1}),this.pour);this.stream.visible=false;
    this.ripple=this.makeMesh(new THREE.TorusGeometry(.085,.006,6,48),new THREE.MeshBasicMaterial({color:0xead4ab,transparent:true,opacity:.4}),this.pour);this.ripple.rotation.x=Math.PI/2;this.ripple.visible=false;
    this.canvas.dataset.iceCount=String(this.ice.children.length);this.canvas.dataset.toppings=String(recipe.toppingCount);this.canvas.dataset.fruit=String(recipe.fruitCount);this.canvas.dataset.cupSize=Object.entries(recipe.cup).map(([k,v])=>`${k}:${v}`).join(',');
  }
  update(recipe: DrinkAppearance,mixToken:number,replay:number) {
    const old=this.recipe,now=this.clock;
    const changed=!old||old.key!==recipe.key;
    if(changed){this.build(recipe);this.foamStart=old&&old.base===recipe.base&&old.foam===recipe.foam&&old.whipped===recipe.whipped?-100:now;this.mixStart=-100;this.milkStart=old&&old.base===recipe.base&&recipe.milkFraction>0&&(old.milk!==recipe.milk||old.milkFraction!==recipe.milkFraction)?now:-100;this.recipe=recipe;this.start=now;this.pendingMilk=this.milkStart===now;this.pendingFoam=this.foamStart===now;}
    if(mixToken!==this.mixToken){this.mixToken=mixToken;this.mixStart=now;}
    const sequence=syrupPulses(old?.syrupDoses||{},recipe.syrupDoses,replay!==this.replay,!old||old.base!==recipe.base);
    const doses=sequence.length;
    const reduced=old&&Object.entries(old.syrupDoses).some(([id,count])=>(recipe.syrupDoses[id]||0)<count);
    const pending=this.syrupStart>0&&now<this.syrupStart+this.syrupCount*PUMP_SECONDS;
    if(doses){
      if(pending&&!reduced&&old?.base===recipe.base&&replay===this.replay)this.syrupSequence.push(...sequence);
      else {this.syrupStart=now;this.syrupSequence=sequence;this.pendingSyrup=true;this.canvas.dataset.maxPumpTravel='0';}
      this.syrupCount=this.syrupSequence.length;
    }else if(reduced||old?.base!==recipe.base){this.syrupStart=-100;this.syrupSequence=[];this.syrupCount=0;this.pendingSyrup=false;}
    const bottleFlavor=sequence[0]||((!old||old.base!==recipe.base||old.primarySyrup!==recipe.primarySyrup)?(recipe.primarySyrup||Object.keys(recipe.syrupDoses)[0]):recipe.syrupDoses[this.bottle.flavor]>0?this.bottle.flavor:recipe.primarySyrup||Object.keys(recipe.syrupDoses)[0])||'';
    this.bottle.setFlavor(bottleFlavor);this.canvas.dataset.syrupFlavor=bottleFlavor;this.canvas.dataset.pumpCount=String(this.syrupCount);this.canvas.dataset.bottleVisible=String(!!bottleFlavor);
    this.replay=replay;
    this.wake(Math.max(this.milkStart===now?5.3:.9,mixToken!==0&&this.mixStart===now?3.3:0,this.syrupStart>0?Math.max(0,this.syrupStart+this.syrupCount*PUMP_SECONDS-now)+.3:0));
  }
  wake(seconds:number) {if(this.destroyed)return;this.end=Math.max(this.end,this.clock+(this.reduced?.03:seconds));if(!this.frame&&this.visible){this.lastWall=performance.now()/1000;this.frame=requestAnimationFrame(this.tick);}}
  tick=(timestamp:number)=>{
    this.frame=0;if(this.destroyed||!this.visible||!this.recipe)return;
    const wall=timestamp/1000;if(wall-this.lastFrame<1/(innerWidth<700?30:45)){this.frame=requestAnimationFrame(this.tick);return;}this.lastFrame=wall;this.clock+=Math.min(.12,Math.max(0,wall-this.lastWall));this.lastWall=wall;const now=this.clock;
    const recipe=this.recipe, mix=this.reduced?(this.mixStart>0?1:0):smooth((now-this.mixStart)/3), mixActive=this.mixStart>0;
    const amount=mixActive?mix:0;
    const milkAge=this.reduced?6:now-this.milkStart;
    const uniforms=this.liquid.material.uniforms;uniforms.uMilkAge.value=milkAge;uniforms.uMix.value=amount;
    uniforms.uLatte.value=recipe.milkDrink?1:0;uniforms.uSettled.value.set(recipe.settledColor);if(amount)uniforms.uSettled.value.lerp(new THREE.Color(recipe.foamColor),recipe.foam*amount*.32);
    const base=new THREE.Color(recipe.coffeeColor),milk=new THREE.Color(recipe.milkColor);
    this.surface.material.color.set(recipe.settledColor);
    if(amount)this.surface.material.color.lerp(new THREE.Color(recipe.foamColor),recipe.foam*amount*.32);
    this.foam.position.y=this.fill-.03*amount;this.foam.scale.y=(1-amount*.92)*(this.reduced?1:smooth((now-this.foamStart)/.8));
    const energy=mixActive?Math.sin(mix*Math.PI)*(1-mix):0;
    this.ice.children.forEach((cube,i)=>{const home=cube.userData.home as THREE.Vector3;const euler=cube.userData.rotation as THREE.Euler;cube.position.copy(home);cube.position.x+=Math.sin(now*4+i)*energy*.06;cube.position.y+=Math.sin(now*3+i)*energy*.035;cube.rotation.set(euler.x,euler.y+energy*Math.sin(now*3+i)*.2,euler.z);});
    const milkPour=this.milkStart>0&&milkAge<1.8&&!this.reduced;
    const syrupAge=now-this.syrupStart, syrupPour=this.syrupStart>0&&syrupAge<this.syrupCount*PUMP_SECONDS&&!this.reduced;
    if(syrupPour){const index=Math.min(this.syrupSequence.length-1,Math.floor(syrupAge/PUMP_SECONDS));this.bottle.setFlavor(this.syrupSequence[index]);this.canvas.dataset.syrupFlavor=this.bottle.flavor;this.canvas.dataset.pumpIndex=String(index+1);this.bottle.press((syrupAge%PUMP_SECONDS)/PUMP_SECONDS);}else{this.bottle.press(null);this.canvas.dataset.pumpIndex='0';}
    this.canvas.dataset.maxPumpTravel=String(Math.min(Number(this.canvas.dataset.maxPumpTravel||0),this.bottle.handle.position.y));
    this.stream.visible=milkPour||syrupPour;this.ripple.visible=this.stream.visible||energy>.02;
    if(this.stream.visible){const milk=milkPour, phase=(syrupAge%PUMP_SECONDS)/PUMP_SECONDS;const from=milk?this.height+1.4:2.83+this.bottle.handle.position.y,to=this.fill+this.foamHeight;const head=milk?1:clamp(phase/.35,0,1),tail=milk?0:clamp((phase-.45)/.45,0,1);const upper=from-(from-to)*tail,lower=from-(from-to)*head;this.stream.position.set(this.bottle.group.visible?.43:.18,(upper+lower)/2,.03);this.stream.scale.set(milk?1.6:.8,Math.max(.001,upper-lower),milk?1.6:.8);(this.stream.material as THREE.MeshPhysicalMaterial).color.set(milk?recipe.milkColor:'#c99b49');this.ripple.position.set(this.bottle.group.visible?.43:.18,to+.012,.03);const wave=(now*3)%1;this.ripple.scale.setScalar(.4+wave*2);(this.ripple.material as THREE.MeshBasicMaterial).opacity=(1-wave)*.32;}
    const status=milkPour?'Pouring milk':syrupPour?`Adding syrup · pump ${Math.min(this.syrupCount,Math.floor(syrupAge/PUMP_SECONDS)+1)} of ${this.syrupCount}`:energy>.01?'Mixing your drink':'';
    if(status!==this.active){this.active=status;this.activity(status);}

    this.canvas.dataset.pumpTravel=String(this.bottle.handle.position.y);
    this.root.position.x+=((this.bottle.group.visible?.25:0)-this.root.position.x)*.12;
    this.yaw=this.reduced?this.targetYaw:this.yaw+(this.targetYaw-this.yaw)*.12;this.root.rotation.y=this.yaw;
    this.renderer.render(this.scene,this.camera);
    // Start action clocks after the first draw has compiled the new materials.
    // Otherwise a cold GPU shader compile can consume an entire one-pump action.
    if(this.pendingMilk||this.pendingSyrup||this.pendingFoam){const ready=this.clock;if(this.pendingMilk)this.milkStart=ready;if(this.pendingSyrup)this.syrupStart=ready;if(this.pendingFoam)this.foamStart=ready;this.end=Math.max(this.end,ready+(this.reduced?.03:Math.max(this.pendingMilk?5.3:0,this.pendingSyrup?this.syrupCount*PUMP_SECONDS+.3:0,.9)));this.pendingMilk=this.pendingSyrup=this.pendingFoam=false;}
    this.canvas.dataset.frameCount=String(++this.renderedFrames);this.canvas.dataset.settled='false';
    const box=new THREE.Box3().setFromObject(this.cup);const a=box.min.clone().project(this.camera),b=box.max.clone().project(this.camera);this.canvas.dataset.projectedWidth=String(Math.abs(b.x-a.x));this.canvas.dataset.projectedHeight=String(Math.abs(b.y-a.y));
    if(now<this.end||Math.abs(this.targetYaw-this.yaw)>.001)this.frame=requestAnimationFrame(this.tick);
    else this.canvas.dataset.settled='true';
  };
  dispose(){this.destroyed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();this.intersection.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.media.removeEventListener('change',this.reducedChanged);this.canvas.removeEventListener('webglcontextlost',this.contextLost);[this.cup,this.ice,this.foam,this.pour].forEach(disposeGroup);this.scene.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();if(object.material instanceof THREE.Material)object.material.dispose();}});this.bottle.dispose();this.logo.dispose();this.shadowTexture.dispose();this.foamTexture.dispose();this.environment.dispose();this.renderer.dispose();this.renderer.forceContextLoss();}
}

export default function DrinkScene({build,mixToken,replaySyrup,onActivity,onUnavailable}:Props){
  const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<DrinkRenderer|null>(null),callbacks=useRef({onActivity,onUnavailable});callbacks.current={onActivity,onUnavailable};
  const latest=useRef({build,mixToken,replaySyrup});latest.current={build,mixToken,replaySyrup};
  useEffect(()=>{
    // Defer GPU allocation so React Strict Mode's setup/cleanup probe can cancel
    // before creating (and immediately losing) a WebGL context on this canvas.
    const frame=requestAnimationFrame(()=>{try{engine.current=new DrinkRenderer(canvas.current!,message=>callbacks.current.onActivity(message),()=>callbacks.current.onUnavailable());const input=latest.current;engine.current.update(drinkAppearance(input.build),input.mixToken,input.replaySyrup);}catch{callbacks.current.onUnavailable();}});
    return()=>{cancelAnimationFrame(frame);engine.current?.dispose();engine.current=null;};
  },[]);
  useEffect(()=>{engine.current?.update(drinkAppearance(build),mixToken,replaySyrup);},[build,mixToken,replaySyrup]);
  const pointer=useRef<number|null>(null);
  return <canvas ref={canvas} className="drink-canvas cup-size-geometry" aria-hidden="true"
    onContextMenu={event=>event.preventDefault()}
    onPointerDown={event=>{pointer.current=event.clientX;event.currentTarget.setPointerCapture(event.pointerId);}}
    onPointerMove={event=>{if(pointer.current===null||!engine.current)return;engine.current.targetYaw=clamp((event.clientX-pointer.current)*.006,-.65,.65);engine.current.wake(.6);}}
    onPointerUp={()=>{pointer.current=null;if(engine.current){engine.current.targetYaw=0;engine.current.wake(.8);}}}
    onPointerCancel={()=>{pointer.current=null;if(engine.current){engine.current.targetYaw=0;engine.current.wake(.8);}}}
  />;
}
