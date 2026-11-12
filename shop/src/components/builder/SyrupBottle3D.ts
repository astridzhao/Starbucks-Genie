import * as THREE from 'three';
import snapshot from '../../data/starbucks-us.json';

export default class SyrupBottle3D {
  group = new THREE.Group();
  handle = new THREE.Group();
  labelMaterial: THREE.MeshBasicMaterial;
  liquidMaterial: THREE.MeshPhysicalMaterial;
  texture: THREE.CanvasTexture | null = null;
  flavor = '';
  constructor() {
    this.group.position.x = -1.02;
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, parent = this.group) => { const mesh = new THREE.Mesh(geometry, material); parent.add(mesh); return mesh; };
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xfff6dd, transparent: true, opacity: .17, depthWrite: false, roughness: .08, clearcoat: .8, envMapIntensity: .3, side: THREE.DoubleSide });
    const points = [[0,.06],[.255,.06],[.272,.12],[.272,1.78],[.25,1.9],[.13,2.08],[.105,2.16],[.105,2.31],[.09,2.31],[.09,2.14],[.23,1.85],[.24,.12],[0,.12]].map(([x,y])=>new THREE.Vector2(x,y));
    add(new THREE.LatheGeometry(points,64),glass);
    this.liquidMaterial = new THREE.MeshPhysicalMaterial({color:0xbb8438,roughness:.22,clearcoat:.7,envMapIntensity:.2});
    const liquid=add(new THREE.CylinderGeometry(.241,.241,1.47,64),this.liquidMaterial);liquid.position.y=.86;
    const meniscus=add(new THREE.TorusGeometry(.236,.008,8,64),new THREE.MeshStandardMaterial({color:0xe2ba75,roughness:.25}));meniscus.rotation.x=Math.PI/2;meniscus.position.y=1.6;
    const dark=new THREE.MeshStandardMaterial({color:0x153b2d,roughness:.35,metalness:.12});
    const cap=add(new THREE.CylinderGeometry(.13,.13,.14,48),dark);cap.position.y=2.32;
    const stem=add(new THREE.CylinderGeometry(.026,.026,.65,16),new THREE.MeshStandardMaterial({color:0xc8cfbd,metalness:.65,roughness:.3}),this.handle);stem.position.y=2.62;
    this.group.add(this.handle);
    const button=add(new THREE.BoxGeometry(.39,.065,.2),dark,this.handle);button.position.set(0,2.96,0);
    const spoutCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.02,2.94,0),new THREE.Vector3(.21,2.94,0),new THREE.Vector3(1.3,2.93,.02),new THREE.Vector3(1.43,2.89,.03),new THREE.Vector3(1.45,2.83,.03)]);
    add(new THREE.TubeGeometry(spoutCurve,40,.025,10,false),dark,this.handle);
    this.labelMaterial = new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
    const label=add(new THREE.CylinderGeometry(.275,.275,.81,64,1,true,-1.3,2.6),this.labelMaterial);label.position.y=1.08;
    this.group.visible=false;
  }
  setFlavor(id: string) {
    this.group.visible=!!id;
    if(!id || id===this.flavor)return;
    this.flavor=id;
    const name=snapshot.options.find(option=>option.id===id)?.name || 'Syrup';
    const sugarFree=/Sugar-Free/i.test(name), short=name.replace(/Sugar-Free\s*/i,'').replace(/ Syrup$/i,'').toUpperCase();
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const context=canvas.getContext('2d')!;
    context.fillStyle='#f6f0e2';context.fillRect(0,0,512,512);
    context.fillStyle='#234936';context.fillRect(0,26,512,6);context.fillRect(0,474,512,6);
    context.textAlign='center';context.fillStyle='#234936';context.font='bold 36px Georgia';context.fillText('STARBUCKS',256,113);
    context.font='20px sans-serif';context.letterSpacing='4px';context.fillText('COFFEE SYRUP',256,157);
    context.fillStyle='#b5a783';context.fillRect(56,192,400,2);
    const words=short.split(' ');context.fillStyle='#244834';context.font=`bold ${short.length>13?38:49}px Georgia`;context.letterSpacing='0px';
    if(short.length>17 && words.length>1){const middle=Math.ceil(words.length/2);context.fillText(words.slice(0,middle).join(' '),256,267,430);context.fillText(words.slice(middle).join(' '),256,323,430);}else context.fillText(short,256,295,440);
    context.font='25px sans-serif';context.fillStyle='#7b623e';context.fillText(sugarFree?'SUGAR FREE':'SYRUP',256,401);
    this.texture?.dispose();this.texture=new THREE.CanvasTexture(canvas);this.texture.colorSpace=THREE.SRGBColorSpace;this.texture.anisotropy=2;this.labelMaterial.map=this.texture;this.labelMaterial.needsUpdate=true;
    this.liquidMaterial.color.set(/Caramel|Brown Sugar|Hazelnut|Toffee/i.test(name)?'#b77b30':'#d6aa60');
  }
  press(phase: number | null) {this.handle.position.y=phase===null?0:-Math.sin(Math.min(1,phase/.5)*Math.PI)*.075;}
  dispose(){const geometry=new Set<THREE.BufferGeometry>(),material=new Set<THREE.Material>();this.group.traverse(object=>{if(object instanceof THREE.Mesh){geometry.add(object.geometry);(Array.isArray(object.material)?object.material:[object.material]).forEach(item=>material.add(item));}});geometry.forEach(item=>item.dispose());material.forEach(item=>item.dispose());this.texture?.dispose();}
}
