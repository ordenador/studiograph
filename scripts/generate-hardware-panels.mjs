// Original vector reconstructions and a reusable physical socket catalogue.
// Coordinates describe each drawing, never drill/CAD dimensions. See docs/hardware-panels.md.
import { readFile, writeFile } from 'node:fs/promises';
const out = new URL('../public/hardware/', import.meta.url);
const models = {};
const face = (width, height, label, note = '', background) => ({ width, height, label, note, ...(background ? { background } : {}) });
const rear = (width = 1000, height = 190, note = '') => face(width, height, 'Trasera', note);
const port = (id, label, side, x, y, kind, signal, direction, detail = '') => ({ id, label, face: side, x, y, kind, signal, direction, detail });
const p = (...args) => port(...args);
const power = (side, x, y, detail, kind = 'dc') => p('power', detail, side, x, y, kind, 'power', 'input', detail);
const sw = (side, x, y) => p('switch', 'POWER', side, x, y, 'switch', 'mechanical', 'none');
const usb = (side, x, y, kind = 'usb-c', detail = 'USB MIDI · alimentación', usbRole = 'device') => ({ ...p('usb', 'USB', side, x, y, kind, 'usb', 'duplex', detail), usbRole });
const src = (title, url) => ({ title, url });
function model(id, name, fill, ink, defaultFace, faces, connectors, sources, note = '') {
  models[id] = { name, fill, ink, defaultFace, faces, connectors, sources, note };
}
const te = id => src('Manual · hardware overview', `https://teenage.engineering/guides/${id}/hardware-overview`);
model('op1-field', 'OP-1 field', '#bfc5be', '#29342e', 'right', {
  rear: rear(1000, 120, 'Los conectores están en el lateral derecho.'),
  right: face(750, 160, 'Lateral derecho', 'Mirando directamente el lateral: USB-C, entrada, salida y el interruptor en el extremo.'),
}, [usb('right', 225, 95, 'usb-c', 'USB audio/MIDI, host y device · carga', 'dual'),
  p('audio-in', 'AUDIO IN', 'right', 385, 95, 'jack-35', 'audio', 'input', '3,5 mm TRS · estéreo'),
  p('audio-out', 'AUDIO OUT', 'right', 545, 95, 'jack-35', 'audio', 'output', '3,5 mm TRS · estéreo / auriculares'), sw('right', 704, 110)],
  [src('Manual · hardware / right side / power on', 'https://teenage.engineering/guides/op-1#hardware')]);

model('fm1', 'M-VAVE FM-1', '#343638', '#e3e2da', 'rear', { rear: rear(650, 170) }, [
  p('audio-out', 'AUDIO OUT', 'rear', 85, 103, 'jack-35', 'audio', 'output', '3,5 mm TRS · estéreo / auriculares'),
  p('midi-in', 'MIDI IN', 'rear', 245, 103, 'jack-35', 'midi', 'input', 'MIDI TRS de 3,5 mm · el manual no especifica tipo A/B'),
  usb('rear', 405, 103), p('switch', 'POWER', 'rear', 555, 103, 'button', 'mechanical', 'none'),
], [src('Manual original · panel trasero, pág. 14 impresa', 'https://manualf.oss-cn-hongkong.aliyuncs.com/manual/MIDI-KEYBOARD/FM-1-manual.pdf')],
'Dibujo común para unidades A/B y referencia de ensayo; no implica firmware ni montaje físico cotejado.');

for (const count of [32, 37]) {
  const w = count === 32 ? 960 : 1130;
  // Same socket set on both mk2s; spacing follows their separate rear photographs.
  const xs = count === 32 ? [395,423,451,480,522,576,604,666,722,802,875] : [390,427,464,501,555,627,664,745,819,923,1020];
  const jacks = ['MOD 2','MOD 1','GATE','PITCH'].map((l,i) => p(['mod-2','mod-1','gate','pitch'][i], l, 'rear', xs[i], 108, 'jack-35', 'cv', 'output', '3,5 mm · CV/Gate'));
  model(`keystep-${count}`, `KeyStep ${count} mk2`, '#dadbd4', '#242a27', 'rear', { rear: rear(w, 185) }, [
    ...jacks, p('sustain', 'SUSTAIN', 'rear', xs[4], 108, 'jack-635', 'control', 'input', 'Pedal sustain / expresión · 6,35 mm TRS'),
    p('sync-in', 'SYNC IN', 'rear', xs[5], 108, 'jack-35', 'cv', 'input', 'Reloj analógico de 3,5 mm'),
    p('sync-out', 'SYNC OUT', 'rear', xs[6], 108, 'jack-35', 'cv', 'output', 'Reloj analógico de 3,5 mm'),
    p('midi-in', 'MIDI IN', 'rear', xs[7], 108, 'din-5', 'midi', 'input', 'DIN de 5 pines'),
    p('midi-out', 'MIDI OUT', 'rear', xs[8], 108, 'din-5', 'midi', 'output', 'DIN de 5 pines'),
    usb('rear', xs[9], 108), sw('rear', xs[10], 108),
  ], [src('Fotografía trasera del fabricante', count === 32 ? 'https://medias.arturia.net/images/products/keystep-mk2/ow-keystep-back.jpg' : 'https://medias.arturia.net/images/products/keystep-37-mk2/keystep-37-mk2-back.jpg'),
    src('Catálogo del fabricante · mk2', `https://www.arturia.com/products/hybrid-synths/keystep-mk2/keystep-${count}-mk2`)],
  'Modelo mk2: cuatro salidas CV, USB-C y sin entrada de alimentación DC separada.');
}

model('ep-133', 'EP-133 K.O. II', '#c5c6bf', '#242a27', 'rear', {
  rear: rear(1000, 170, 'Borde superior del equipo al tocarlo; el fabricante lo llama “top side”. Mirando los conectores, izquierda/derecha se invierten respecto del teclado.'),
}, [sw('rear', 85, 108), usb('rear', 225, 108, 'usb-c', 'USB MIDI · alimentación · audio USB según versión de OS'),
  p('midi-out','MIDI OUT','rear',455,108,'jack-35','midi','output','MIDI TRS de 3,5 mm'),
  p('midi-in','MIDI IN','rear',500,108,'jack-35','midi','input','MIDI TRS de 3,5 mm'),
  p('sync-out','SYNC OUT','rear',545,108,'jack-35','cv','output','Reloj analógico · 3,5 mm'),
  p('sync-in','SYNC IN','rear',590,108,'jack-35','cv','input','Reloj analógico · 3,5 mm'),
  p('audio-in','INPUT','rear',735,108,'jack-35','audio','input','3,5 mm TRS · estéreo · aro naranja'),
  p('audio-out','OUTPUT','rear',915,108,'jack-35','audio','output','3,5 mm TRS · estéreo · aro blanco'),
], [te('ep-133'), src('Diagrama de conectores del fabricante', 'https://assets.teenage.engineering/_img/655cd58ae77e331eee90491a_opt.svg')]);
model('ep-136', 'EP-136 K.O.-sidekick', '#bec3ba', '#242a27', 'rear', {
  rear: rear(850, 170, 'Borde superior al tocarlo · mirada directa a los conectores.'),
  front: face(850, 140, 'Frontal · auriculares', 'Borde próximo al usuario al tocarlo.'),
}, [sw('rear',80,108), usb('rear',220,108,'usb-c','USB MIDI, audio 8 entradas / 4 salidas · alimentación'),
  ...['CH 2','CH 1','AUX'].map((l,i)=>p(['ch-2','ch-1','aux'][i],l,'rear',400+i*70,108,'jack-35','audio','input','3,5 mm TRS · estéreo · aro naranja')),
  p('audio-out','OUTPUT','rear',745,108,'jack-35','audio','output','3,5 mm TRS · estéreo'),
  p('phones','PHONES','front',695,83,'jack-35','audio','output','3,5 mm TRS · auriculares estéreo'),
], [te('ep-136'), src('Borde superior del fabricante', 'https://assets.teenage.engineering/_img/69fc4870c956bd24033c329d_opt.svg'), src('Borde de auriculares', 'https://assets.teenage.engineering/_img/69dde4edfb4f0d7572eddd40_opt.svg')]);

model('quad-cortex','Quad Cortex · original','#44484a','#ecece5','rear', { rear: rear(1200,235) }, [
  p('input-1','INPUT 1','rear',72,142,'combo','audio','input','XLR / 6,35 mm combo · mic/line/instrument'),
  p('input-2','INPUT 2','rear',182,142,'combo','audio','input','XLR / 6,35 mm combo · mic/line/instrument'),
  ...[['send-1','SEND 1',270,100,'output'],['send-2','SEND 2',270,174,'output'],['return-1','RETURN 1',345,100,'input'],['return-2','RETURN 2',345,174,'input'],['out-3','OUT 3/L',420,100,'output'],['out-4','OUT 4/R',420,174,'output'],['capture','CAPTURE',495,100,'output'],['phones','PHONES',495,174,'output']].map(([id,l,x,y,d])=>p(id,l,'rear',x,y,'jack-635','audio',d,id==='phones'?'Auriculares estéreo · 6,35 mm TRS':id==='capture'?'Salida dedicada a Neural Capture · 6,35 mm':'Audio · 6,35 mm')),
  p('out-1','OUT 1/L','rear',590,142,'xlr-m','audio','output','XLR balanceado'),
  p('out-2','OUT 2/R','rear',700,142,'xlr-m','audio','output','XLR balanceado'),
  p('midi-in','MIDI IN','rear',805,142,'din-5','midi','input','DIN de 5 pines'),
  p('midi-out','THRU/OUT','rear',905,142,'din-5','midi','output','DIN de 5 pines · función según configuración'),
  p('exp-1','EXP 1','rear',995,100,'jack-635','control','input','Pedal de expresión · 6,35 mm TRS'),
  p('exp-2','EXP 2','rear',995,174,'jack-635','control','input','Pedal de expresión · 6,35 mm TRS'),
  usb('rear',1080,174,'usb-b','USB tipo B del Quad Cortex original · audio/MIDI device'),
  power('rear',1150,174,'12V DC · 3A · centro negativo'),
], [src('Manual · diagrama del Quad Cortex original', 'https://neuraldsp.com/manual/quad-cortex'),src('Diagrama oficial de las tres caras','https://images.ctfassets.net/8puu65w27ud0/3CBFXZiqvuUgrRBfFpoxup/1c8e59e5c8c9fb1ede0f4b7d3143de9e/qc-overview-001.svg')],
'Corresponde al Quad Cortex original, con USB-B. No al Quad Cortex mini.');

const coast = [
  ['midi-in','MIDI IN',48,218,'midi','input'], ['tempo','TEMPO',144,117,'cv','input'],
  ['clock','CLOCK',144,164,'cv','output'],['random','RANDOM',144,204,'cv','output'],
  ['math-in-1','MATH IN 1',114,237,'cv','input'],['math-in-2','MATH IN 2',154,237,'cv','input'],
  ['ext-cv','EXT CV',35,374,'cv','output'],['ext-gate','EXT GATE',74,374,'cv','output'],
  ['math-out-1','MATH OUT 1',124,374,'cv','output'],['math-out-2','MATH OUT 2',164,374,'cv','output'],
  ['triangle','TRIANGLE',222,58,'audio','output'],['square','SQUARE',269,58,'audio','output'],
  ['pitch','1V/OCT',219,374,'cv','input'],['lin-fm','LIN FM',263,374,'cv','input'],
  ['overtone','OVERTONE',312,374,'cv','input'],['multiply','MULTIPLY',356,374,'cv','input'],
  ['slope-time','SLOPE TIME',411,326,'cv','input'],['slope-eoc','SLOPE EOC',450,326,'cv','output'],
  ['slope-trigger','SLOPE TRIG',411,374,'cv','input'],['slope-out','SLOPE OUT',450,374,'cv','output'],
  ['contour-decay','DECAY CV',500,326,'cv','input'],['contour-gate','CONTOUR GATE',500,374,'cv','input'],
  ['contour-eon','CONTOUR EON',541,374,'cv','output'],['contour-out','CONTOUR OUT',581,374,'cv','output'],
  ['balance-in','EXT AUDIO',609,58,'audio','input'],['balance-cv','BALANCE CV',673,58,'cv','input'],
  ['line-out','LINE/PHONES',674,326,'audio','output'],['dynamics-cv','DYNAMICS CV',624,374,'cv','input'],
  ['dynamics-out','DYNAMICS OUT',668,374,'audio','output'],
].map(([id,l,x,y,s,d])=>p(id,l,'top',x,y,'jack-35',s,d,id==='midi-in'?'MIDI TRS 3,5 mm · usar adaptador indicado por Make Noise':id==='line-out'?'3,5 mm TRS · línea / auriculares · 3 Vpp':s==='audio'?'Audio modular · 3,5 mm · hasta 10 Vpp':'Patch analógico · 3,5 mm'));
// Normalized from the manufacturer's top photograph and numbered manual diagram.
const coastCoordinates = {
  'midi-in':[68,261], tempo:[215,161], clock:[215,224], random:[215,286],
  'math-in-1':[161,350], 'math-in-2':[220,350], 'ext-cv':[49,529], 'ext-gate':[106,529],
  'math-out-1':[188,529], 'math-out-2':[248,529], triangle:[328,93], square:[389,93],
  pitch:[320,529], 'lin-fm':[382,529], overtone:[451,529], multiply:[519,529],
  'slope-time':[597,470], 'slope-eoc':[654,470], 'slope-trigger':[596,529], 'slope-out':[654,529],
  'contour-decay':[726,470], 'contour-gate':[726,529], 'contour-eon':[785,529], 'contour-out':[843,529],
  'balance-in':[872,93], 'balance-cv':[977,93], 'line-out':[977,470], 'dynamics-cv':[908,529], 'dynamics-out':[970,529],
};
for(const c of coast) { const [x,y]=coastCoordinates[c.id]; c.x=+(x*700/1024).toFixed(2); c.y=+(y*420/625).toFixed(2); }
model('0-coast','Make Noise 0-Coast','#242628','#e1e3d8','top',{
  top: face(700,420,'Superior · patch', '', '0-coast'), rear: rear(700,130,'Sin conectores traseros documentados. Patch arriba; alimentación a la izquierda.'),
  left: face(420,150,'Lateral izquierdo'),
},[...coast,power('left',205,92,'15V DC · centro positivo · 2,1 mm')],
[src('Manual original · panel, funciones y alimentación','https://www.makenoisemusic.com/wp-content/uploads/2024/03/0-coast_manual.pdf')]);

const spec = [p('program-combo','PROGRAM INPUT','top',74,78,'combo','audio','input','Combo XLR / 6,35 mm · programa mic/line')];
const specRows = [
  [['program-in','PROGRAM','audio','input'],['vca-out','VCA','audio','output']],
  [['carrier','CARRIER','audio','input'],['vca-cv','VCA CV','cv','input']],
  [['pitch','1V/OCT','cv','input'],['vco','VCO','audio','output']],
  [['pwm','VCO PWM','cv','input'],['noise','NOISE','audio','output']],
  [['lfo-rate','LFO RATE','cv','input'],['lfo','LFO','cv','output']],
  [['trigger','TRIGGER','cv','input'],['eg','EG','cv','output']],
  [['shift','SHIFT','cv','input'],['hold','HOLD GATE','cv','input']],
  [['program-out','PROGRAM','audio','output'],['program-env','PROG ENV F','cv','output']],
];
specRows.forEach((row,r)=>row.forEach(([id,l,s,d],c)=>spec.push(p(id,l,'top',873+c*43,57+r*42,'jack-35',s,d,'Patch 3,5 mm · niveles según manual'))));
for(let i=1;i<=10;i++) {
  spec.push(p(`band-${i}-cv`,`${i} VCA CV`,'top',159+(i-1)*62,308,'jack-35','cv','input','Control de amplitud de la banda'));
  spec.push(p(`band-${i}-env`,`${i} ENV F`,'top',159+(i-1)*62,354,'jack-35','cv','output','Seguidor de envolvente de la banda'));
}
model('spectravox','Moog Spectravox','#19191b','#e3e2da','top',{
  top:face(960,410,'Superior · patch','','spectravox'), rear:rear(960,180),
},[...spec,p('audio-out','AUDIO OUT','rear',755,111,'jack-635','audio','output','6,35 mm TRS · línea mono / auriculares'),power('rear',846,111,'12V DC · centro positivo'),p('lock','LOCK','rear',917,111,'slot','mechanical','none','Anclaje Kensington')],
[src('Descargas del fabricante · Spectravox','https://www.moogmusic.com/downloads/?product=Spectravox'),src('Manual RevB · patchbay y rear panel (URL histórica, texto indexado)','https://api.moogmusic.com/sites/default/files/2024-05/Spectravox_Manual_RevB.pdf'),src('Página del fabricante','https://www.moogmusic.com/synthesizers/spectravox/')]);

const l6 = [
  ...[[48,62],[192,62],[120,135],[264,135]].map(([x,y],i)=>p(`input-${[1,3,2,4][i]}`,`INPUT ${[1,3,2,4][i]}`,'top',x,y,'combo','audio','input','Combo XLR / 6,35 mm · mic/line')),
];
for(let c=0;c<4;c++) for(let r=0;r<2;r++) l6.push(p(`input-${c+5}-${r?'r':'l'}`,`${c+5} ${r?'R':c<2?'L':'L/MONO'}`,'top',346+c*66,48+r*60,'jack-635','audio','input',`Canal estéreo ${c+5} · 6,35 mm TS${c<2?' · pareja estéreo':''}`));
l6.push(p('midi-in','MIDI IN','top',675,35,'jack-35','midi','input','MIDI TRS 3,5 mm tipo A'),p('midi-out','MIDI OUT','top',675,76,'jack-35','midi','output','MIDI TRS 3,5 mm tipo A'),usb('top',675,111,'usb-c','USB audio/MIDI device · bus power'));
for(const [id,l,x,y] of [['aux-1','AUX SEND 1',737,48],['aux-2','AUX SEND 2',737,108],['master-l','MASTER L',807,48],['master-r','MASTER R',807,108],['monitor','MONITOR',877,48],['sub','SUB OUT',947,48]]) l6.push(p(id,l,'top',x,y,'jack-635','audio','output',id==='monitor'||id==='sub'?'6,35 mm TRS · auriculares estéreo':'6,35 mm TRS · salida balanceada'));
model('livetrak','Zoom LiveTrak L6max','#404043','#e3e2da','top',{
  top:face(1000,380,'Superior · conexiones','','livetrak'),rear:rear(1000,140,'Sin conexiones de señal traseras: audio/MIDI/USB arriba; microSD y alimentación en el lateral derecho.'),right:face(620,180,'Lateral derecho'),
},[...l6,p('microsd','microSD','right',220,108,'slot','storage','none','Ranura microSDXC'),power('right',350,108,'DC 5V · solo alimentación','usb-c')],
[src('Manual L6max · partes y conexiones','https://zoomcorp.com/manuals/l6max-en/')]);

model('bogen-gdu150','Bogen GDU150','#353639','#e3e2da','rear',{
  rear:face(420,240,'Base · XLR','Vista directa de los tres pines de salida, en el extremo del cuello flexible.'),
},[p('audio-out','XLR OUTPUT','rear',210,138,'xlr-m','audio','output','XLR macho de 3 pines · micrófono dinámico balanceado')],
[src('Ficha técnica oficial · GDU150','https://www.bogen.com/sites/default/files/2021-01/microphones_specsheet.pdf')]);

// Hapax remains rendered by the established component; its coordinates also live here
// so consumers of the JSON have the complete inventory, including non-signal sockets.
const hapax=[];
hapax.push(usb('rear',129,141,'usb-a','USB MIDI host','host'),{...usb('rear',171,138,'usb-b','USB MIDI device'),id:'usb-device'});
hapax[0].id='usb-host';
for(let i=0;i<4;i++) {
  hapax.push(p(`gate-${4-i}`,`GATE ${4-i}`,'rear',346+i*29,140,'jack-35','cv','output'));
  hapax.push(p(`cv-${4-i}`,`CV ${4-i}`,'rear',470+i*29,140,'jack-35','cv','output'));
}
hapax.push(p('cv-in-2','CV IN 2','rear',594,140,'jack-35','cv','input'),p('cv-in-1','CV IN 1','rear',624,140,'jack-35','cv','input'));
for(const [id,l,x,kind,d] of [['midi-d','MIDI D',664,'jack-35','output'],['midi-c','MIDI C',706,'din-5','output'],['midi-b','MIDI B',758,'din-5','output'],['midi-a','MIDI A',811,'din-5','output'],['midi-in-2','MIDI IN B',868,'jack-35','input'],['midi-in-1','MIDI IN A',910,'din-5','input']]) hapax.push(p(id,l,'rear',x,kind==='din-5'?128:136,kind,'midi',d,kind==='jack-35'?'TRS tipo A':'DIN 5'));
hapax.push(sw('rear',56,130),power('rear',89,141,'15V DC'),p('sd','SD','rear',233,141,'slot','storage','none'),p('pedal','PEDAL','rear',306,140,'jack-635','control','input','Pedal de sustain'));
model('hapax','Squarp Hapax','#25272a','#e3e2da','rear',{rear:rear(1000,190)},hapax,[src('Manual y conectividad oficial','https://squarp.net/hapax/'),src('Fotografía trasera oficial','https://squarp.net/static/1785237772252.306630038613/06%20CONNECTIVITY.jpg')]);

// Reuse existing top SVGs without relocating rear/side sockets to the surface.
const existingTops = { 'op1-field':[1000,360],fm1:[650,390],'keystep-32':[960,300],'keystep-37':[1130,300],'ep-133':[360,500],'ep-136':[290,590],'quad-cortex':[700,470],'bogen-gdu150':[700,150] };
for(const [id,[width,height]] of Object.entries(existingTops)) models[id].faces.top={...face(width,height,'Superior'),asset:id};

const esc = s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const circle=(x,y,r,fill,stroke='#8a8d87',w=1.5)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
const rect=(x,y,w,h,fill,rx=2,stroke='#858981')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`;
const text=(x,y,s,size,color,anchor='middle')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${esc(s)}</text>`;
function socket(c,scale=1) {
  const {x,y,kind}=c;
  let drawing='';
  if(kind==='usb-c') drawing=rect(x-17,y-6,34,12,'#101313',6)+rect(x-11,y-1.5,22,3,'#727e76',1);
  else if(kind==='usb-a') drawing=rect(x-17,y-10,34,20,'#131615')+rect(x-12,y-6,24,5,'#999b93',0);
  else if(kind==='usb-b') drawing=`<path d="M${x-13} ${y+13}v-19l7-7h12l7 7v19Z" fill="#101313" stroke="#aaa" stroke-width="2"/>`+rect(x-6,y-5,12,9,'#a7aaa0');
  else if(kind==='switch') drawing=rect(x-16,y-7,32,14,'#111512',4)+rect(x-12,y-5,10,10,'#d66c3d',2);
  else if(kind==='button') drawing=circle(x,y,12,'#141714')+text(x,y+4,'⏻',13,'#e0e1d7');
  else if(kind==='slot') drawing=rect(x-20,y-3,40,6,'#101313',1);
  else if(kind==='dc') drawing=circle(x,y,11,'#070b08')+circle(x,y,3,'#c3c6ba');
  else if(kind==='din-5') drawing=circle(x,y,23,'#171b18')+[-2,-1,0,1,2].map(i=>{const a=(i*36+90)*Math.PI/180;return circle(x+14*Math.cos(a),y+14*Math.sin(a),2.2,'#858981','#202820',.5);}).join('')+rect(x-3,y-24,6,4,'#b3b7aa',0);
  else if(kind==='combo'||kind==='xlr-m') {
    drawing=circle(x,y,kind==='combo'?26:24,'#151a16')+[[0,-9],[-9,6],[9,6]].map(([a,b])=>circle(x+a,y+b,2.8,kind==='xlr-m'?'#d7d9cd':'#080a08')).join('');
    if(kind==='combo') drawing+=rect(x-3,y-13,6,26,'#030503',2,'#777f74');
  } else {const r=kind==='jack-635'?13:8;drawing=circle(x,y,r,'#a4a89b')+circle(x,y,r*.63,'#080c09','#444e42');}
  return `<g data-connector-id="${esc(c.id)}"><title>${esc(`${c.label} · ${c.detail}`)}</title>${scale===1?drawing:`<g transform="translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})">${drawing}</g>`}</g>`;
}
for(const [id,m] of Object.entries(models)) for(const [side,f] of Object.entries(m.faces)) {
  if(f.asset) continue; // Existing standalone top SVG; no second copy.
  const connectors=m.connectors.filter(c=>c.face===side);
  let body;
  if(id==='0-coast'&&side==='top') {
    body=rect(3,3,694,414,m.fill,3);
    const line=(x,y,x2,y2,color='#aeb4a1')=>`<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="1"/>`;
    for(const x of [198,290,386,577]) body+=line(x,25,x,388);
    body+=text(85,49,'MAKE NOISE',12,m.ink)+text(83,73,'0-COAST',22,m.ink);
    for(const [x,y,l,r] of [[246,136,'PITCH',29],[246,293,'LIN FM',14],[330,145,'OVERTONE',23],[330,204,'',15],[365,269,'MULTIPLY',23],[364,314,'',12],[426,112,'RISE',22],[426,197,'FALL',22],[426,274,'CURVE',22],[515,76,'ONSET',21],[515,145,'SUSTAIN',16],[515,218,'DECAY',23],[515,285,'',17],[623,137,'BALANCE',23],[623,267,'DYNAMICS',23]]) {
      body+=circle(x,y,r,'#b8bdb2','#e0e4d7')+circle(x,y,r*.77,'#989f92','#676f60')+line(x,y-r*.8,x,y-r*.37,'#283025');
      if(l)body+=text(x,y-r-7,l,7,m.ink);
    }
    body+=rect(315,92,49,139,'none',1)+rect(345,232,48,108,'none',1);
    body+=text(112,225,'VOLTAGE MATH',8,m.ink)+circle(135,293,13,'#a5b09e');
    body+=rect(20,113,27,21,'#d2d8c8',1)+text(33,107,'PGM A',6,m.ink)+rect(131,64,27,21,'#d2d8c8',1)+text(144,58,'PGM B',6,m.ink);
    body+=rect(394,39,27,18,'#d2d8c8',1)+text(408,33,'CYCLE',6,m.ink);
    body+=line(255,43,312,43)+line(358,43,620,43)+line(455,387,667,387);
    for(const c of connectors) body+=socket(c,.85)+text(c.x,c.y-11,c.label,5.7,m.ink);
  } else if(f.background) {
    const original=await readFile(new URL(`${f.background}.svg`,out),'utf8');
    body=original.slice(original.indexOf('</desc>')+7,original.lastIndexOf('</svg>'));
    // Socket positions are shared with the cable handles; retain the control drawing.
    body+=connectors.map(c=>socket(c,c.kind==='combo'?1:.7)).join('');
  } else {
    body=rect(3,21,f.width-6,f.height-29,m.fill,5)+rect(5,f.height-16,f.width-10,5,'#202620',1);
    if(id==='spectravox') body+=rect(3,21,16,f.height-29,'#795339',0)+rect(f.width-19,21,16,f.height-29,'#795339',0);
    body+=text(22,43,m.name,Math.min(15,f.height/10),m.ink,'start');
    if(!connectors.length) body+=text(f.width/2,f.height*.66,'Sin conectores en esta cara',14,m.ink);
    if(id==='bogen-gdu150') body+=circle(210,138,65,'#333934','#9ba394',3)+circle(210,138,55,'#171e18','#64735f',2);
    for(const [i,c] of connectors.entries()) {
      if((id==='ep-133'&&['audio-in','audio-out'].includes(c.id))||(id==='ep-136'&&c.signal==='audio')) body+=circle(c.x,c.y,15,c.direction==='input'?'#db6c37':'#e2e5d9','#777d71');
      body+=socket(c);
      // Dense connector groups have staggered short labels, maintaining socket spacing.
      const crowded=connectors.some(o=>o!==c&&Math.abs(o.x-c.x)<60&&Math.abs(o.y-c.y)<15);
      const y=c.y-(c.kind==='din-5'||c.kind==='combo'||c.kind==='xlr-m'?32:22)-(crowded&&i%2?14:0);
      body+=text(c.x,y,c.kind==='dc'?c.label.split(' · ')[0]:c.label,crowded?8:10,m.ink);
    }
    body+=circle(14,f.height-29,2,'#a0a696')+circle(f.width-14,f.height-29,2,'#a0a696');
  }
  f.asset=`${id}-${side}-panel`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f.width} ${f.height}" role="img" aria-labelledby="title desc" font-family="system-ui,sans-serif"><title id="title">${esc(m.name+' · '+f.label)}</title><desc id="desc">${esc(f.note||m.note||'Mirada directa al panel. Posiciones esquemáticas, no dimensiones CAD.')} Dibujo original basado en documentación del fabricante.</desc>${body}</svg>\n`;
  await writeFile(new URL(`${f.asset}.svg`,out),svg);
}
const catalogue={version:1,orientation:'Vista directa de cada cara. Rear = borde alejado del intérprete; front = borde próximo. Coordenadas SVG, no dimensiones físicas.',aliases:{'fm1-a':'fm1','fm1-b':'fm1','fm1-nrpn-test':'fm1'},models};
await writeFile(new URL('panels.json',out),JSON.stringify(catalogue,null,2)+'\n');
console.log(`Generated ${Object.keys(models).length} models / ${Object.values(models).reduce((n,m)=>n+Object.keys(m.faces).length,0)} panels.`);
