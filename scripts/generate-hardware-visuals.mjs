// Original schematic drawings. Reference URLs and research decisions live in
// public/hardware/sources.json. Run with node scripts/generate-hardware-visuals.mjs.
import { mkdir, writeFile } from 'node:fs/promises';

const out = new URL('../public/hardware/', import.meta.url);
await mkdir(out, { recursive: true });
const join = a => a.join('');
const repeat = (n, f) => join(Array.from({ length: n }, (_, i) => f(i)));
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const rect = (x,y,w,h,fill='#252527',r=2,stroke='#737377') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const line = (x,y,x2,y2,color='#a1a1a6',w=1) => `<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
const circle = (x,y,r,fill='#151517',stroke='#88888c',w=1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
const text = (x,y,s,size=9,color='#dededb',anchor='middle') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
const knob = (x,y,r=14,label='',color='#202023',labelColor='#dededb') => `<g>${label ? `<title>${esc(label)}</title>` : ''}${circle(x,y+1.5,r+1,'#141416','#343437')}${circle(x,y,r,color,'#85858b',1.1)}${circle(x,y,r*.76,color,'#a5a5a8',.7)}${r>=13?`<path d="M${x-r*.87} ${y+r*.45}A${r} ${r} 0 1 1 ${x+r*.87} ${y+r*.45}" fill="none" stroke="${labelColor}" stroke-opacity=".4" stroke-width=".8"/>`:''}${line(x,y-r*.82,x,y-r*.42,'#e4e4e1',2)}${label?text(x,y-r-7,label,7,labelColor):''}</g>`;
const jack = (x,y,label='',r=7) => `<g>${label?`<title>${esc(label)}</title>`:''}${circle(x,y,r,'#c1c0ba','#66666a')}${circle(x,y,r*.68,'#101011','#444448')}${label?text(x,y-r-5,label,6):''}</g>`;
const combo = (x,y,r=28) => jack(x,y,'',r)+join([[-.35,-.08],[.35,-.08],[0,.4]].map(([a,b])=>circle(x+a*r,y+b*r,r*.11,'#09090a','#69696b')))+rect(x-r*.15,y-r*.45,r*.3,r*.9,'#242426',1,'#444448');
const button = (x,y,w,h,label='',fill='#272729',color='#e6e6e3') => `<g>${rect(x,y+1.5,w,h,'#131315',2,'#29292c')}${rect(x,y,w,h,fill,2,'#66666a')}${line(x+2,y+1,x+w-2,y+1,'#b7b7ba',.5)}${text(x+w/2,y+h/2+2.5,label,Math.min(8,w/4),color)}</g>`;
const arrow = (points,color='#b6b78b') => `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.3" stroke-linejoin="round"/>`;
const segmentDisplay = (x,y,w,h) => rect(x,y,w,h,'#181919',2,'#434546')+
  repeat(3,r=>repeat(12,c=>rect(x+8+c*(w-16)/12,y+8+r*(h-16)/3,(w-16)/12-4,(h-16)/3-4,'none',1,'#373a37')));
const screw = (x,y) => circle(x,y,2.8,'#111112','#66666a')+line(x-1.7,y,x+1.7,y,'#99999c');
const frame = (w,h,fill='#303033') => rect(2,2,w-4,h-4,fill,6,'#919194');
const keys = (x,y,w,h,count,start=0) => {
  const notes = Array.from({length:count},(_,i)=>(i+start)%12);
  const isBlack = n => [1,3,6,8,10].includes(n);
  const whiteCount = notes.filter(n=>!isBlack(n)).length, unit=w/whiteCount;
  let pos=0; const whites=[],blacks=[];
  for(const n of notes) { if(isBlack(n)) blacks.push(rect(x+pos*unit-unit*.31,y,unit*.62,h*.61,'#242426',1,'#111113'));
    else { whites.push(rect(x+pos*unit,y,unit-.7,h,'#e8e7df',1,'#77777a'));pos++; } }
  return join(whites)+join(blacks);
};
const dark='#222225', light='#d4d3cc', orange='#f06428';
async function save(id,title,w,h,body,description) {
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc" font-family="system-ui, sans-serif"><title id="title">${esc(title)} · vista superior</title><desc id="desc">${esc(description)} Ilustración vectorial esquemática original; controles estáticos, sin actividad en vivo. Proporciones aproximadas.</desc>${body}</svg>\n`;
  await writeFile(new URL(`${id}.svg`,out),svg);
}

// FM-1: 8 rotary controls, 12 function keys, 27 silicone keys (16 + 11).
await save('fm1','M-VAVE FM-1',650,390,
  frame(650,390,'#363638')+
  join([[52,57,'MASTER'],[120,57,'SELECT'],[52,126,'PRESETS'],[120,126,'ALGORITHM']].map(([x,y,l])=>knob(x,y,15,l)))+
  rect(166,27,153,150,'#111113',12)+rect(186,43,113,118,'#2c3337',1,'#51565b')+text(242,99,'FM-1',17)+text(242,121,'M-VAVE',8)+
  repeat(4,i=>knob(364+i*73,57,15,`KNOB${i+1}`))+
  rect(344,99,285,96,'#1e1e20',10)+repeat(12,i=>button(355+(i%6)*44,109+Math.floor(i/6)*40,36,30,['FX','SEL','ENV','LFO','EDIT','GLO','HOME','SAVE','ARP','SEQ','PLAY','REC'][i]))+
  button(36,165,47,23,'OCT−')+button(92,165,47,23,'OCT+')+
  rect(22,218,606,151,'#202023',16)+repeat(16,i=>rect(34+i*36,297,29,58,'#303034',13,'#0b0b0c')+line(48+i*36,309,48+i*36,342,'#d4d4d0',3))+
  join([0.5,1.5,2.5,4.5,5.5,7.5,8.5,9.5,11.5,12.5,14.5].map((p,i)=>rect(34+p*36,229,29,57,'#303034',13,'#0b0b0c')+line(48+p*36,240,48+p*36,259,'#d4d4d0',3)+text(48+p*36,276,['OP1','OP2','OP3','OP4','OP5','OP6','PIT','GLO','MONO','POLY',''][i],6))),
  'Ocho mandos, pantalla, doce teclas de función y veintisiete teclas de silicona. El dibujo es común a las dos unidades; no identifica su firmware.');

for(const count of [32,37]) {
  const w=count===32?960:1130, is37=count===37;
  await save(`keystep-${count}`,`Arturia KeyStep ${count} mk2`,w,300,
    frame(w,300,'#e1e0d9')+rect(18,17,is37?625:600,58,'#d1d0c9',1,'#56565a')+
    ['Seq','Arp','Mutate','Chord','♩','●','■','▶'].map((l,i)=>button(27+i*49,30,39,23,l,'#e8e7df','#222225')).join('')+
    rect(433,27,64,33,'#1a1a1d',1)+knob(523,44,10,'','#d1d0c9')+knob(585,44,15,'','#d1d0c9')+
    (is37?button(663,30,35,24,'CC','#e5e4dc',dark)+button(705,30,35,24,'CTRL','#e5e4dc',dark)+repeat(4,i=>knob(772+i*56,43,13,'','#d1d0c9')):'')+
    text(w-24,60,`KEYSTEP${is37?' 37':''}`,20,dark,'end')+
    ['Shift','Hold','Oct−','Oct+'].map((l,i)=>button(25+i%2*47,89+Math.floor(i/2)*33,38,22,l,light,dark)).join('')+
    rect(25,163,36,111,'#aaa9a2',2)+rect(72,163,36,111,'#aaa9a2',2)+text(43,289,'BEND',7,dark)+text(90,289,'MOD',7,dark)+
    keys(133,109,w-154,174,count,is37?0:5)+text(135,97,'SEQ / ARP / SCALE',7,dark,'start')+
    (is37?repeat(37,i=>circle(142+i*(w-172)/36,99,1.5,'#636365','#636365')):''),
    `Teclado de ${count} notas, dos bandas táctiles, transporte, pantalla y encoder.${is37?' Cuatro encoders adicionales de control.':''} Modelo mk2 del catálogo declarado.`);
}

// OP-1 field has a tiled panel and circular black key caps, not piano keys.
// Geometry follows TE's top packshot 627cab620e44b900044f3c11 (sources.json).
const opTile = (x,y,w,h) => rect(x,y,w,h,'#d2d2cc',3,'#777974')+
  line(x+3,y+2,x+w-3,y+2,'#f2f1eb');
const opCap = (x,y,r,color='#deded8') => circle(x,y+2,r,'#aaaDa7','#a5a8a2')+
  circle(x,y,r,color,'#f4f3ec',1.2)+circle(x,y,r-2.5,color,'#c1c3bc',.8);
const opSymbol = (x,y,type,color='#626661') => {
  const path = d => `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  switch(type) {
    case 'synth': return path(`M${x-10} ${y+4}q3-15 6 0t6 0t6 0`);
    case 'drum': return circle(x,y,7,'none',color,1.4)+path(`M${x} ${y-11}v22`);
    case 'tape': return circle(x-5,y,5,'none',color,1.4)+circle(x+5,y,5,'none',color,1.4)+path(`M${x-10} ${y+6}h20`);
    case 'mixer': return join([-8,-3,3,8].map((dx,i)=>line(x+dx,y-3-i%2*4,x+dx,y+7,color,1.4)));
    case 'lift': return path(`M${x-7} ${y}l7-7 7 7M${x} ${y-7}v15M${x-7} ${y+10}h14`);
    case 'drop': return path(`M${x-7} ${y}l7 7 7-7M${x} ${y+7}v-15M${x-7} ${y+10}h14`);
    case 'cut': return circle(x-5,y+7,3,'none',color,1.4)+circle(x+5,y+7,3,'none',color,1.4)+path(`M${x-4} ${y+4}l11-13M${x+4} ${y+4}l-11-13`);
    case 'play': return `<path d="M${x-5} ${y-7}l12 7-12 7Z" fill="${color}"/>`;
    case 'stop': return rect(x-5,y-5,10,10,color,0,color);
    case 'rec': return circle(x,y,5,'#e46638','#e46638');
    case 'left': return path(`M${x+4} ${y-6}l-6 6 6 6M${x-2} ${y}h12`);
    case 'right': return path(`M${x-4} ${y-6}l6 6-6 6M${x+2} ${y}h-12`);
    case 'tempo': return path(`M${x-8} ${y+8}l8-17 8 17ZM${x-3} ${y+3}l8-10`);
    case 'mic': return path(`M${x-4} ${y+5}l7-7M${x+2} ${y-4}l3 3`)+circle(x+5,y-5,3,'none','#d05a35',1.6);
    default: return text(x,y+4,type,9,color);
  }
};
const opSmallKey = (x,y,type) => opTile(x,y,52,52)+opCap(x+26,y+25,18)+opSymbol(x+26,y+25,type);
const opEncoders = ['#303c53','#ac8c5c','#737b7c','#dd542e'];
// Two octaves F–E: fourteen white keys and ten circular black caps.
const opBlackBoundaries = [1,2,3,5,6,8,9,10,12,13];
await save('op1-field','Teenage Engineering OP-1 field',1000,360,
  `<defs><linearGradient id="op-metal" x2="0" y2="1"><stop stop-color="#d1d3cd"/><stop offset=".45" stop-color="#bfc3bd"/><stop offset="1" stop-color="#aeb3ae"/></linearGradient></defs>`+
  rect(2,2,996,356,'#8c938f',13,'#777d78')+rect(5,4,990,349,'url(#op-metal)',11,'#e0e3db')+
  rect(20,18,918,324,'#303431',4,'#646b64')+
  opTile(20,18,108,108)+repeat(13,r=>repeat(13,c=>{
    const dx=c-6,dy=r-6;return dx*dx+dy*dy<47?circle(74+dx*6.7,72+dy*6.7,1.8,'#303833','#303833',.4):'';
  }))+
  opTile(128,18,108,54)+opCap(154,44,16)+circle(154,44,3,'#d8dad3','#c5c8bf')+rect(188,29,39,32,'#e0e1d9',6,'#aeb3a8')+
  opSmallKey(128,74,'drum')+opSmallKey(182,74,'tempo')+
  rect(236,18,216,108,'#161d1c',2,'#090d0c')+
  // Neutral vector screen: only model identification; no invented project data.
  text(251,38,'OP–1 field',10,'#a8b8af','start')+line(251,46,437,46,'#43544c')+
  circle(293,80,20,'none','#93a39a',1.5)+circle(293,80,8,'#bac8bf','#bac8bf')+
  circle(396,80,20,'none','#93a39a',1.5)+circle(396,80,8,'#bac8bf','#bac8bf')+
  line(293,100,396,100,'#93a39a',1.2)+line(260,114,425,114,'#686c5b',1.4)+
  repeat(4,i=>opTile(452+i*108,18,108,108)+circle(506+i*108,72,29,'#c1c6bd','#8e978c',1.2)+
    circle(506+i*108,73,23,'#aeb5a9','#dce0d5',1.2)+circle(506+i*108,72,16,opEncoders[i],'#eeeeE5',2)+
    circle(506+i*108,72,13,opEncoders[i],'#555f54',.8))+
  opSmallKey(884,18,'mic')+opSmallKey(884,74,'COM')+
  ['synth','drum','tape','mixer','1','2','3','4','1 IN','2 OUT','3','4','5','6','7 M1','8 M2','···'].map((l,i)=>opSmallKey(20+i*54,126,l)).join('')+
  ['lift','drop','cut','rec','play','stop','left','right','shift'].map((l,i)=>opSmallKey(20+i%3*54,180+Math.floor(i/3)*54,l)).join('')+
  repeat(14,i=>opTile(182+i*54,234,54,108)+rect(190+i*54,244,38,88,'#afb6aa',19,'#939d8f')+
    rect(189+i*54,241,38,88,'#e2e5db',19,'#f6f6ef')+line(200+i*54,249,216+i*54,249,'#fafaf4',.8))+
  repeat(14,i=>opTile(182+i*54,180,54,54))+
  opBlackBoundaries.map(boundary=>circle(182+boundary*54,207,19,'#bfc8ba','#edf0e4',1.2)+
    circle(182+boundary*54,207,16,'#202b27','#636e61',1.2)).join('')+
  circle(967,44,1.6,'#37463b','#37463b')+line(966,126,966,187,'#646f64',.8)+line(951,141,980,141,'#646f64',.8)+
  `<g transform="translate(966 300) rotate(-90)">${text(0,0,'OP–1',22,'#424c43')}${rect(-17,7,34,12,'none',2,'#7e877b')}${text(0,16,'field',8,'#465244')}</g>`+
  line(18,349,978,349,'#8d978b',1),
  'Panel modular de teclas cuadradas y tapas redondeadas. Altavoz circular a la izquierda, volumen, pantalla, cuatro encoders con tapas azul oscuro, ocre, gris y naranja, transporte de tres por tres y teclado de 24 notas F–E con 14 teclas blancas redondeadas y 10 tapas negras circulares. Pantalla vectorial estática de referencia.');

await save('ep-133','Teenage Engineering EP-133 K.O. II',360,500,
  frame(360,500,'#c6c6c0')+rect(9,9,235,99,'#deded8',1)+text(25,48,'K.O. II',25,dark,'start')+text(25,91,'128 MB SAMPLER COMPOSER',9,dark,'start')+
  rect(248,9,102,99,'#8c8e8c',1)+repeat(8,r=>repeat(8,c=>circle(256+c*12,17+r*12,3,'#343437','#b1b1b1')))+
  segmentDisplay(9,113,342,92)+text(27,134,'SOUND',6,'#747066','start')+text(27,189,'K.O. II',8,'#747066','start')+
  knob(34,235,14,'VOLUME','#e4e4dc',dark)+knob(276,235,15,'X',orange,dark)+knob(326,235,15,'Y','#252527',dark)+
  ['SOUND','MAIN','TEMPO'].map((l,i)=>button(67+i*49,220,37,24,l,'#343436')).join('')+
  button(16,270,38,21,'KEYS')+button(16,303,38,21,'FADER')+line(35,346,35,436,'#19191b',5)+circle(35,382,8,'#8e8f8b')+
  repeat(16,i=>button(67+(i%4)*49,270+Math.floor(i/4)*51,37,36,['A','7','8','9','B','4','5','6','C','1','2','3','D','.','0','ENTER'][i],i%4===0?'#b1b2ae':'#232325',i%4===0?dark:light))+
  ['SAMPLE','TIMING','FX','ERASE','−','+','RECORD','PLAY'].map((l,i)=>button(263+i%2*49,270+Math.floor(i/2)*51,37,36,l,[0,6].includes(i)?orange:'#ccccC5',dark)).join('')+button(16,461,38,20,'SHIFT','#a5a6a1',dark),
  'Rejilla de pads numéricos, fader lateral, tres mandos, pantalla y altavoz superior derecho.');

await save('ep-136','Teenage Engineering EP-136 K.O.-sidekick',290,590,
  frame(290,590,'#bfc0b9')+rect(9,10,272,116,'#deded7',1)+text(24,46,'K.O.–SIDEKICK',19,dark,'start')+text(24,109,'2 CH STEREO MIXER',12,dark,'start')+
  ['OUT','AUX','CH1','CH2','USB'].map((l,i)=>rect(10+i*54,6,52,14,i>0&&i<4?orange:'#a9aaa5',1,'#bfc0b9')+text(36+i*54,16,l,6,dark)).join('')+
  rect(206,145,64,118,'#1a1919',1)+text(238,157,'CUE   CUE',6,'#aa7950')+
  repeat(2,c=>repeat(9,r=>rect(216+c*23,168+r*7,18,4,'#3f3026',.5,'#62442e')))+text(238,246,'FX',10,'#aa7950')+
  repeat(2,c=>['GAIN','HIGH','MID','LOW'].map((l,r)=>knob(53+c*85,167+r*64,17,l,r===0?orange:r===1?'#d7d7cf':'#303034',dark)).join(''))+
  repeat(2,c=>button(25+c*85,411,56,22,'CUE')+line(53+c*85,448,53+c*85,532,'#252527',5)+
    repeat(5,i=>line(38+c*85,450+i*20,43+c*85,450+i*20,'#535654'))+rect(39+c*85,477,28,15,'#414442',7,'#1f2220')+
    rect(40+c*85,474,26,15,'#d4d6d0',7,'#f0f0e7')+button(25+c*85,548,56,24,'FX'))+
  knob(238,310,20,'VOLUME','#b3b3af',dark)+knob(238,381,16,'MOD','#d1d1ca',dark)+line(238,421,238,471,'#252527',4)+rect(224,441,28,13,orange,3)+knob(238,517,13,'PHONES','#303034',dark)+button(208,551,60,24,'SELECT'),
  'Mezclador estéreo de dos canales: dos columnas de EQ, dos faders, medidor, volumen, modulación y escucha. Es distinto del EP-133.');

const cortexFoot = (x,y) => `<polygon points="${repeat(6,i=>{const a=(i*60+30)*Math.PI/180;return `${x+19*Math.cos(a)},${y+19*Math.sin(a)} `;})}" fill="#7e8385" stroke="#d1d4d2" stroke-width="1"/>`+
  circle(x,y,15,'#282c2e','#151719',1.6)+repeat(10,i=>{const a=i*Math.PI/5;return line(x+11*Math.cos(a),y+11*Math.sin(a),x+14*Math.cos(a),y+14*Math.sin(a),'#929a9b',1);})+
  circle(x,y,9,'#3e4446','#8e9696',.7);
await save('quad-cortex','Neural DSP Quad Cortex',700,470,
  frame(700,470,'#424245')+rect(164,33,374,214,'#0f1012',2)+text(180,57,'Quad Cortex',16,'#d4d7d4','start')+text(521,57,'STOMP',7,'#8d9894','end')+
  // Unconfigured reference grid: no invented preset, chain or active signal.
  repeat(4,r=>text(178,91+r*43,r?'＋':'IN',7,'#727e78')+text(523,91+r*43,r?'＋':'OUT',7,'#727e78')+
    line(192,88+r*43,509,88+r*43,'#333e39')+
    repeat(6,c=>rect(199+c*51,74+r*43,27,27,'#151d19',4,'#414e46')+
      line(208+c*51,87+r*43,217+c*51,87+r*43,'#68766b')+line(212.5+c*51,82.5+r*43,212.5+c*51,91.5+r*43,'#68766b')))+
  knob(73,124,38,'')+text(73,180,'VOLUME',9)+button(62,35,23,24,'⏻')+text(624,50,'QUAD CORTEX',10)+
  repeat(2,r=>repeat(5,c=>cortexFoot(43+c*151,330+r*106)+circle(43+c*151,299+r*106,4,'#8c9290','#c6ccc7',.6)+(c<4?text(74+c*151,335+r*106,'ABCDEFGH'[r*4+c],21):text(647,363+r*106,r?'TEMPO':'MODE',8))))+
  text(647,282,'⌄',15)+text(647,96,'⌃',15),
  'Pantalla táctil con rejilla neutra vacía de referencia, sin preset ni cadena configurada. Volumen a la izquierda y diez footswitches rotatorios con base hexagonal; ocho A–H y dos a la derecha. Los indicadores son estáticos.');

await save('livetrak','Zoom LiveTrak L6max',1000,380,
  frame(1000,380,'#404043')+rect(13,285,562,76,'#33334d',1,'#656587')+repeat(8,i=>line(74+i*68,287,74+i*68,359,'#979795',.6))+
  repeat(4,i=>combo(48+(i%2)*144+Math.floor(i/2)*72,62+Math.floor(i/2)*73))+
  repeat(4,c=>repeat(2,r=>jack(346+c*66,48+r*60,'',19)))+
  text(300,185,'ZOOM LiveTrak L6max',22)+circle(25,24,10,'#8c908e','#c5c8c2')+text(25,28,'⏻',12,dark)+
  text(434,19,'LINE INPUTS',7)+repeat(4,i=>text(346+i*66,81,'L / R',6))+
  repeat(8,i=>circle(39+i*68,219,2,'#79797d')+button(23+i*68,245,32,17,'MUTE','#aaa9a5',dark)+
    (i<4?button(21+i*68,199,35,13,i%2?'48V':'Hi-Z','#a5a9a4',dark):button(21+i*68,199,35,13,i<6?'MONO':'USB','#a5a9a4',dark))+
    circle(39+i*68,325,27,'#8a7459','#bda68a',1.2)+knob(39+i*68,325,23,'','#555559')+
    text(39+i*68,376,String(i+1),7))+
  rect(584,13,57,347,'#34305a',1)+['HIGH','FREQ','MID','LOW','AUX1','AUX2','EFX','SUB MIX','PAN','LEVEL'].map((l,i)=>button(591,25+i*33,43,22,l,l==='LEVEL'?orange:'#c7c7c4',dark)).join('')+
  jack(675,35,'MIDI IN')+jack(675,76,'OUT')+repeat(4,i=>button(659,140+i*33,34,23,String(i+1),'#d5a0a1',dark))+knob(676,325,23,'PAD','#8a8a88')+
  repeat(4,c=>jack(737+c*70,48,['AUX','MASTER','MONITOR','SUB'][c],18)+(c<2?jack(737+c*70,108,'',18):''))+
  ['A','B','C','D'].map((l,i)=>button(848+i%2*30,88+Math.floor(i/2)*23,23,17,l,'#bfc2ba',dark)).join('')+text(874,81,'SCENE',7)+
  button(722,155,35,17,'TAP','#bfc2ba',dark)+text(739,189,'EFX',7)+['Hall','Room','Spring','Delay'].map((l,i)=>text(739,204+i*13,l,6,'#a7ada6')).join('')+button(722,260,35,17,'SEL','#bfc2ba',dark)+
  repeat(2,c=>repeat(10,r=>rect(784+c*10,161+r*10,6,7,'#252e27',.5,'#5a665a')))+text(793,152,'L  R',6)+
  rect(832,160,150,122,'#242426',2)+rect(846,173,122,52,'#111214',1)+text(855,185,'RECORDER',6,'#7e8e82','start')+line(853,194,961,194,'#3d4e41')+
  repeat(6,i=>rect(853+i*18,201,12,13,'none',1,'#5a675c'))+['▶/■','●','BOUNCE'].map((l,i)=>button(841+i*44,247,38,21,l)).join('')+
  repeat(4,c=>knob(737+c*70,325,23,['EFX RTN','MASTER','MONITOR','SUB OUT'][c],c===1?'#c24e4f':c===0?'#4d4779':'#555559')),
  'Cuatro entradas combo, ocho entradas de línea, ocho controles de canal, tira EQ, pads y sección grabadora a la derecha.');

await save('spectravox','Moog Spectravox',960,410,
  frame(960,410,'#19191b')+rect(3,3,14,404,'#7d5239',0)+rect(943,3,14,404,'#7d5239',0)+
  combo(74,78,29)+text(74,36,'PROGRAM INPUT',8)+
  join([[285,75,'PULSE WIDTH'],[443,75,'SPECTRAL SHIFT'],[569,75,'SHIFT LFO RATE'],[698,75,'DECAY'],[801,75,'VOLUME'],[223,156,'VCO FREQ'],[348,156,'CARRIER MIX'],[505,156,'RESONANCE'],[635,156,'SHIFT LFO AMT']].map(([x,y,l])=>knob(x,y,22,l,'#b9bab8')))+
  text(475,209,'FILTER BANDS',9)+repeat(10,i=>knob(159+i*62,255,10,String(i+1))+jack(159+i*62,308,`${i+1} VCA CV`)+jack(159+i*62,354,`${i+1} ENV F`))+
  repeat(2,c=>repeat(8,r=>jack(873+c*43,57+r*42,['PROGRAM','VCA','CARRIER','VCA CV','1V/OCT','VCO','VCO PWM','NOISE','LFO RATE','LFO','TRIGGER','EG','SHIFT','HOLD GATE','PROGRAM','ENV F'][r*2+c])) )+
  ['VCO WAVE','GAIN','HOLD','TRIG→EG'].map((l,i)=>knob(51+i%2*64,166+Math.floor(i/2)*83,5,l,'#b7b6ad')).join('')+
  circle(74,339,14,'#a2a2a0')+text(74,315,'TRIGGER',7)+text(190,392,'SPECTRAVOX',17)+text(590,392,'moog',22)+
  ['VCA MODE','BANDS 9&10','MODE'].map((l,i)=>knob(801,181+i*84,5,l,'#b7b6ad')).join(''),
  'Diez niveles de bandas y veinte jacks inferiores; nueve mandos principales, entrada combo y patchbay de dieciséis jacks a la derecha.');

await save('0-coast','Make Noise 0-Coast',700,420,
  frame(700,420,'#242628')+
  [194,297,398,570].map(x=>line(x,28,x,342,'#c8cbc0')).join('')+
  rect(302,31,86,158,'none',1,'#b0b484')+rect(302,190,86,135,'none',1,'#b0b484')+rect(582,180,101,94,'none',1,'#b0b484')+
  arrow('221,58 221,21 352,21 352,45')+arrow('347,38 352,45 357,38')+
  arrow('269,58 269,17 631,17 631,58')+arrow('626,51 631,58 636,51')+
  arrow('352,176 352,195 317,195 317,206')+arrow('312,199 317,206 322,199')+
  arrow('373,240 388,240 388,348 611,348 611,251')+arrow('606,258 611,251 616,258')+
  arrow('466,37 467,24 548,24 548,37')+arrow('543,30 548,37 553,30')+
  text(70,58,'MAKE NOISE',13)+text(70,84,'0-COAST',23)+
  join([[247,134,'PITCH',28],[247,294,'LIN FM',13],[356,95,'OVERTONE',20],[356,158,'',15],[356,230,'MULTIPLY',20],[356,296,'',12],[447,116,'RISE',20],[447,192,'FALL',20],[447,266,'CURVE',20],[541,80,'ONSET',21],[541,153,'SUSTAIN',15],[541,221,'DECAY',20],[541,296,'',20],[635,116,'BALANCE',20],[635,228,'DYNAMICS',20]].map(([x,y,l,r])=>knob(x,y,r,l,'#b7bbb7')))+
  join([[48,171,'PGM A'],[144,65,'PGM B'],[144,117,'TEMPO'],[144,164,'CLK'],[48,218,'MIDI IN'],[222,58,'SAW'],[269,58,'PULSE'],[609,58,''],[673,58,'BALN'],[447,326,'TIME'],[486,326,'SLOPE'],[635,300,''],[674,326,'LINE OUT']].map(([x,y,l])=>jack(x,y,l)))+
  repeat(2,i=>rect(103+i*40,226,22,22,'#a6ada4',0)+jack(114+i*40,237,''))+knob(144,293,11,'','#b7bbb7')+
  knob(247,228,8,'FINE','#202725')+
  button(123,320,38,21,'SYNC','#ac613a')+
  [35,74,124,164,219,263,312,356,411,450,500,541,581,624,668].map((x,i)=>jack(x,374,['CV','GATE','−','+','1V/OCT','LIN FM','OVRTN','MULT','SLOPE','EOC','GATE','ENV','CNTR','DYN','DYN'][i],9)).join('')+
  join([[35,25],[665,25],[35,398],[665,398]].map(([x,y])=>screw(x,y)))+
  [263,312,356,411,500,624].map(x=>rect(x-12,360,24,27,'none',0,'#b4baae')).join('')+
  line(276,395,671,395,'#b6b78b',1.2),
  'Sintetizador sin teclado: oscilador, overtone, multiply, slope, contour, balance y dynamics; conectores de patch distribuidos por el panel.');

await save('bogen-gdu150','Bogen GDU150',700,150,
  `<path d="M100 77H290C354 77 364 106 430 106H560" fill="none" stroke="#858589" stroke-width="16"/>`+
  `<path d="M100 77H290C354 77 364 106 430 106H560" fill="none" stroke="#252528" stroke-width="12"/>`+
  repeat(24,i=>line(288+i*10,71+Math.min(i,14)*2,288+i*10,84+Math.min(i,14)*2,'#69696d'))+
  rect(31,49,92,56,'#303034',15)+repeat(12,i=>line(38+i*6,55,38+i*6,100,'#77777a'))+
  rect(546,85,112,42,'#37373a',3)+rect(638,85,25,42,'#9a9a9c',2)+
  text(177,67,'BOGEN',10)+text(385,141,'GDU150 · cuello flexible',11),
  'Micrófono de cuello flexible, cápsula cilíndrica y conector XLR integrado. Vista superior esquemática con curva ilustrativa, sin base añadida.');
