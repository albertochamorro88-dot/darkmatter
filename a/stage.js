/* Dark Matter™ · The stage
   Escenario 3D de la pestaña "The stage": pantalla central y torres LED con los looks de la casa,
   público instanciado con celulares, cabezas móviles, láseres, pirotecnia, CO2, confeti y la reliquia.
   Three r128 global + EffectComposer/UnrealBloom de examples/js (si no cargan, dibuja sin bloom).
   El sitio lo crea con DMStage({...}) y lo mueve desde su bucle: frame(t, dt), setProgress(p). */
(function(){
'use strict';

var BPM = 118, OFF = 0.2415;   /* tempo de a/score.mp3 (medido) */
/* energía de la canción por segundo, 0–9 */
var EN_CURVE = '5777777777777777777777777776644468999999999999999999999999999986542211111222111124566666666666666666666666667655554444434433333223799999999999999999999999999999767999999999999999999999998764432221000';
var CUES = ['doors', 'ignition', 'muses', 'runway', 'turn', 'finale'];
var VID = {muses: 'st/muses.mp4', runway: 'st/runway.mp4', turn: 'st/turn.mp4', finale: 'st/finale.mp4'};
var COPY = {
  en: {wall: [['THE', 'HOUSE', 'IS', 'OPEN'], ['NOBODY', 'HERE', 'IS', 'ENTIRELY', 'HUMAN']], tonight: 'TONIGHT', live: 'SEASON 01 · LIVE',
       night: 'GOODNIGHT', next: 'SEE YOU NEXT SEASON', tick: 'DARK MATTER™ · SEASON 01 · LIVE · HAUTE COUTURE FROM BELOW · '},
  es: {wall: [['LA', 'CASA', 'ESTÁ', 'ABIERTA'], ['NADIE', 'AQUÍ', 'ES', 'DEL TODO', 'HUMANO']], tonight: 'ESTA NOCHE', live: 'TEMPORADA 01 · EN VIVO',
       night: 'BUENAS NOCHES', next: 'NOS VEMOS LA PRÓXIMA TEMPORADA', tick: 'DARK MATTER™ · TEMPORADA 01 · EN VIVO · ALTA COSTURA DESDE ABAJO · '}
};
var FONT = '"Geist","Helvetica Neue",Arial,sans-serif', MONO = '"Geist Mono",ui-monospace,Menlo,monospace';

function DMStage(o){
  var T = window.THREE; if (!T) return null;
  var small = !!o.small, reduce = !!o.reduce, base = o.base || 'a/', lang = o.lang === 'es' ? 'es' : 'en';
  var R;
  try{ R = new T.WebGLRenderer({canvas: o.canvas, antialias: false, powerPreference: 'high-performance', stencil: false}); }catch(e){ return null; }
  var DPR = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
  R.setPixelRatio(DPR); R.setClearColor(0x040504, 1);

  var scene = new T.Scene();
  var FOGC = new T.Color(0x060806), FOGD = 0.0065;
  scene.fog = new T.FogExp2(FOGC.getHex(), FOGD);
  var cam = new T.PerspectiveCamera(36, 1, 0.3, 700);
  var G = {uTime: {value: 0}, uBeat: {value: 0}, uFogC: {value: FOGC}, uFogD: {value: FOGD}, uPx: {value: 600}};
  var rnd = (function(s){ return function(){ s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(20261005);
  function rr(a, b){ return a + (b - a) * rnd(); }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function sstep(a, b, x){ var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function col(r, g, b){ return new T.Color(r, g, b); }

  var C = {
    hueso: col(0.79, 0.77, 0.73), cromo: col(0.62, 0.74, 0.92), white: col(1, 0.96, 0.9), rojo: col(1, 0.09, 0.07),
    laca: col(0.29, 0.1, 0.07), dark: col(0.018, 0.02, 0.018)
  };

  /* ——— texto en lienzo ——— */
  function canvasTex(w, h, repeat){
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var t = new T.CanvasTexture(c); t.minFilter = T.LinearFilter; t.generateMipmaps = false;
    if (repeat){ t.wrapS = t.wrapT = T.RepeatWrapping; }
    return {c: c, x: c.getContext('2d'), t: t};
  }
  var WW = small ? 512 : 1024, WH = Math.round(WW * 23 / 13);
  var wallTx = [canvasTex(WW, WH), canvasTex(WW, WH)], wallCut = [[], []];
  var doorsTx = canvasTex(WW, WH), nightTx = canvasTex(WW, WH);
  var gridTx = canvasTex(512, 1024, true), headTx = canvasTex(512, 128), vertTx = canvasTex(128, 1024, true), tickTx = canvasTex(2048, 64, true);
  var logo = new Image(), logoOk = false;
  logo.onload = function(){ logoOk = true; drawDoors(); }; logo.src = base + 'logo.png';

  function drawWall(k){
    var L = COPY[lang].wall[k], tx = wallTx[k], x = tx.x, W = tx.c.width, H = tx.c.height;
    x.clearRect(0, 0, W, H);
    var fs = 200; x.font = '700 ' + fs + 'px ' + FONT;
    var mw = 0; L.forEach(function(s){ mw = Math.max(mw, x.measureText(s).width); });
    fs = Math.min(fs * W * 0.9 / mw, H * 0.74 / (L.length * 0.9));
    x.font = '700 ' + fs + 'px ' + FONT; x.fillStyle = '#060605'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    var lh = fs * 0.9, top = H * 0.5 - lh * L.length / 2, cut = [];
    L.forEach(function(s, i){
      var y0 = top + i * lh; x.fillText(s, W / 2, y0 + lh * 0.86);
      cut.push(1 - (y0 + lh) / H);
    });
    wallCut[k] = cut; tx.t.needsUpdate = true;
  }
  function drawLogoBlock(tx, big, small2, y){
    var x = tx.x, W = tx.c.width, H = tx.c.height;
    x.clearRect(0, 0, W, H);
    var lw = W * 0.72, lh = logoOk ? lw * logo.height / logo.width : 0;
    if (logoOk) x.drawImage(logo, (W - lw) / 2, H * y - lh / 2, lw, lh);
    x.textAlign = 'center'; x.fillStyle = '#C9C5BA';
    x.font = '600 ' + Math.round(W * 0.105) + 'px ' + FONT;
    x.fillText(big, W / 2, H * y + lh / 2 + W * 0.2);
    x.font = '400 ' + Math.round(W * 0.03) + 'px ' + MONO; x.fillStyle = '#ABB8C5';
    x.fillText(small2.split('').join(String.fromCharCode(8202)), W / 2, H * y + lh / 2 + W * 0.3);
    x.fillStyle = '#E12423'; x.beginPath(); x.arc(W / 2, H * 0.9, W * 0.012, 0, 6.2832); x.fill();
    x.font = '400 ' + Math.round(W * 0.024) + 'px ' + MONO; x.fillStyle = 'rgba(201,197,186,.6)';
    x.fillText('DARKMATTERS.SITE', W / 2, H * 0.94);
    tx.t.needsUpdate = true;
  }
  function drawDoors(){ drawLogoBlock(doorsTx, COPY[lang].tonight, COPY[lang].live, 0.4); drawLogoBlock(nightTx, COPY[lang].night, COPY[lang].next, 0.4); }
  function drawGrid(){
    var x = gridTx.x, W = 512, H = 1024, rows = 14, rh = H / rows;
    x.clearRect(0, 0, W, H); x.font = '700 ' + Math.round(rh * 0.78) + 'px ' + FONT; x.fillStyle = '#D9D4C8'; x.textBaseline = 'middle';
    for (var i = 0; i < rows; i++) x.fillText('DARK MATTER DARK MATTER', i % 2 ? -150 : -18, (i + 0.5) * rh + 2);
    gridTx.t.needsUpdate = true;
    x = headTx.x; x.clearRect(0, 0, 512, 128); x.font = '700 78px ' + FONT; x.font = '700 ' + Math.floor(78 * Math.min(1, 470 / x.measureText('DARK MATTER™').width)) + 'px ' + FONT; x.fillStyle = '#060605'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('DARK MATTER™', 256, 68); headTx.t.needsUpdate = true;
    x = vertTx.x; x.clearRect(0, 0, 128, 1024); x.save(); x.translate(64, 1024); x.rotate(-Math.PI / 2);
    x.font = '700 96px ' + FONT; x.fillStyle = '#E12423'; x.textBaseline = 'middle'; x.fillText('DARK MATTER™ ', 0, 4);
    x.fillText('DARK MATTER™ ', x.measureText('DARK MATTER™ ').width, 4); x.restore(); vertTx.t.needsUpdate = true;
    x = tickTx.x; x.clearRect(0, 0, 2048, 64); x.font = '500 34px ' + MONO; x.fillStyle = '#C9C5BA'; x.textBaseline = 'middle';
    var s = COPY[lang].tick, w = x.measureText(s).width, px = 0; while (px < 2048){ x.fillText(s, px, 34); px += w; }
    tickTx.t.needsUpdate = true;
  }
  function drawAll(){ drawWall(0); drawWall(1); drawDoors(); drawGrid(); }
  drawAll();
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('700 100px Geist'), document.fonts.load('600 100px Geist'), document.fonts.load('500 30px "Geist Mono"')]).then(drawAll, function(){});

  /* ——— videos (un atlas por cue: torre izq · centro · torre der) ——— */
  var vids = {}, blocked = false, curVid = null;
  function getVid(k){
    if (vids[k]) return vids[k];
    var v = (o.videos && o.videos[k]) || document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    if (!v.src) { v.preload = 'auto'; v.src = base + VID[k]; }
    var t = new T.VideoTexture(v); t.minFilter = T.LinearFilter; t.magFilter = T.LinearFilter; t.generateMipmaps = false;
    vids[k] = {v: v, t: t}; return vids[k];
  }
  function playVid(k){
    var e = getVid(k), p; try{ p = e.v.play(); }catch(er){}
    if (p && p.catch) p.catch(function(){ blocked = true; });
  }
  function retry(){ if (!blocked) return; blocked = false; if (curVid) playVid(curVid); }
  document.addEventListener('pointerdown', retry, true); document.addEventListener('touchend', retry, true);
  function vidReady(k){ var e = vids[k]; return !!(e && e.v.readyState >= 2 && !e.v.paused); }

  /* ——— pantallas LED ——— */
  var SCR_V = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  var SCR_F = [
    'uniform sampler2D uVid, uTxt; uniform float uMix, uBright, uGlitch, uTime, uCut, uPulse; uniform vec4 uRect; uniform vec2 uCrop, uRep, uScroll, uCells; uniform vec3 uBgA, uBgB;',
    'varying vec2 vUv;',
    'float hs(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }',
    'void main(){',
    '  vec2 uv = vUv; float g = uGlitch;',
    '  if (g > 0.001){ float r = hs(vec2(floor(uv.y * 26.0), floor(uTime * 24.0))); uv.x += g * (r - 0.5) * 0.3 * step(0.55, r); }',
    '  vec2 vu = clamp((uv - 0.5) * uCrop + 0.5, 0.0, 1.0); vec2 au = uRect.xy + vu * uRect.zw;',
    '  vec3 vc = texture2D(uVid, au).rgb;',
    '  if (g > 0.001){ vc.r = texture2D(uVid, au + vec2(0.012 * g, 0.0)).r; vc.b = texture2D(uVid, au - vec2(0.012 * g, 0.0)).b; }',
    '  vec4 tc = texture2D(uTxt, uv * uRep + uScroll);',
    '  vec3 bg = mix(uBgB, uBgA, smoothstep(0.0, 1.0, vUv.y)) * (1.0 + uPulse * (1.0 - vUv.y) * 0.6);',
    '  vec3 c = mix(bg, tc.rgb, tc.a * step(uCut, vUv.y));',
    '  c = mix(c, vc * 1.12, uMix);',
    '  vec2 cl = fract(vUv * uCells), fw = fwidth(vUv * uCells);',
    '  float m = smoothstep(0.0, 0.22, cl.x) * smoothstep(1.0, 0.78, cl.x) * smoothstep(0.0, 0.22, cl.y) * smoothstep(1.0, 0.78, cl.y);',
    '  float vis = 1.0 - smoothstep(0.12, 0.45, max(fw.x, fw.y));',
    '  c *= mix(1.0, 0.5 + 0.7 * m, vis);',
    '  c *= 1.0 - g * 0.55 * step(0.5, fract(vUv.y * 150.0 + uTime * 40.0));',
    '  gl_FragColor = vec4(c * uBright, 1.0);',
    '}'].join('\n');
  var screens = [];
  var blackTex = new T.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, T.RGBAFormat); blackTex.needsUpdate = true;
  function screen(w, h, opt){
    var pa = 464 / 832, sa = w / h;
    var U = {
      uVid: {value: blackTex}, uTxt: {value: opt.txt.t}, uMix: {value: 0}, uBright: {value: 1}, uGlitch: {value: 0}, uTime: G.uTime, uCut: {value: -1}, uPulse: {value: 0},
      uRect: {value: new T.Vector4(opt.panel / 3, 0, 1 / 3, 1)}, uCrop: {value: new T.Vector2(sa < pa ? sa / pa : 1, sa < pa ? 1 : pa / sa)},
      uRep: {value: new T.Vector2(opt.rep ? opt.rep[0] : 1, opt.rep ? opt.rep[1] : 1)}, uScroll: {value: new T.Vector2(0, 0)},
      uCells: {value: new T.Vector2(Math.round(w * (opt.dens || 9)), Math.round(h * (opt.dens || 9)))},
      uBgA: {value: (opt.bg || C.dark).clone()}, uBgB: {value: (opt.bg || C.dark).clone()}
    };
    var mt = new T.ShaderMaterial({uniforms: U, vertexShader: SCR_V, fragmentShader: SCR_F, extensions: {derivatives: true}});
    var m = new T.Mesh(new T.PlaneGeometry(w, h), mt); m.userData = opt; m.userData.U = U;
    screens.push(m); return m;
  }

  /* ——— materiales de la estructura ——— */
  var metal = new T.MeshStandardMaterial({color: 0x15181a, roughness: 0.38, metalness: 0.85});
  var matte = new T.MeshStandardMaterial({color: 0x0b0d0c, roughness: 0.8, metalness: 0.2});
  var black = new T.MeshStandardMaterial({color: 0x050605, roughness: 0.6, metalness: 0.1});
  function box(w, h, d, m, x, y, z, parent){ var b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); (parent || scene).add(b); return b; }

  var DECK = 1.8, mirrorSrc = [];
  /* suelo y escenario */
  var ground = new T.Mesh(new T.PlaneGeometry(900, 900), new T.MeshStandardMaterial({color: 0x070907, roughness: 0.95, metalness: 0}));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  box(46, DECK, 0.3, black, 0, DECK / 2, -16);
  box(0.3, DECK, 16, black, -23, DECK / 2, -8); box(0.3, DECK, 16, black, 23, DECK / 2, -8);
  var deckTop = new T.Mesh(new T.PlaneGeometry(46, 16), new T.MeshStandardMaterial({color: 0x000000, roughness: 0.14, metalness: 0.1, transparent: true, opacity: 0.86}));
  deckTop.rotation.x = -Math.PI / 2; deckTop.position.set(0, DECK, -8); deckTop.renderOrder = 2; scene.add(deckTop);
  /* el frente del escenario es una cinta LED */
  var tick = screen(46, DECK, {txt: tickTx, panel: 1, rep: [46 / DECK / 32, 1], dens: 6});
  tick.position.set(0, DECK / 2, 0.01); scene.add(tick);
  /* tarima y escalera */
  box(16, 1.2, 6, black, 0, DECK + 0.6, -13);
  var nosing = [];
  for (var s = 0; s < 4; s++){
    box(11, 0.3 * (s + 1), 1.05, black, 0, DECK + 0.15 * (s + 1), -7.5 - s);
    var ns = box(11, 0.035, 0.035, new T.MeshBasicMaterial({color: 0xffffff}), 0, DECK + 0.3 * (s + 1) + 0.02, -7.0 - s);
    nosing.push(ns);
  }
  /* pantalla central */
  box(13.8, 23.8, 0.8, matte, 0, 14.9, -15.75);
  var center = screen(13, 23, {txt: doorsTx, panel: 1, dens: 7}); center.position.set(0, 14.9, -15.33); scene.add(center); mirrorSrc.push(center);
  /* torres */
  var towers = [];
  [-1, 1].forEach(function(sd){
    var g = new T.Group(); g.position.set(sd * 15.6, DECK + 11, -9.5); g.rotation.y = -sd * 0.32; scene.add(g);
    box(6.6, 22, 4, matte, 0, 0, 0, g);
    var f = screen(6.4, 18.6, {txt: gridTx, panel: sd < 0 ? 0 : 2, rep: [1, 18.6 / 6.4 / 2], dens: 8}); f.position.set(0, -1.5, 2.02); g.add(f);
    var hd = screen(6.4, 2.6, {txt: headTx, panel: 1, bg: C.rojo, dens: 8}); hd.position.set(0, 9.5, 2.02); g.add(hd);
    var sf = screen(3.8, 21.6, {txt: vertTx, panel: 1, rep: [1, 21.6 / 3.8 / 8], dens: 8}); sf.position.set(-sd * 3.32, 0, 0); sf.rotation.y = -sd * Math.PI / 2; g.add(sf);
    towers.push({g: g, front: f, head: hd, side: sf, sd: sd});
    mirrorSrc.push(f, hd, sf);
  });
  /* aspas exteriores */
  var blades = [];
  [-1, 1].forEach(function(sd){
    var b = screen(2.4, 16, {txt: vertTx, panel: 1, rep: [1, 16 / 2.4 / 8], dens: 8}); b.position.set(sd * 25.8, DECK + 8.6, -5); b.rotation.y = -sd * 0.55; scene.add(b);
    box(2.7, 16.3, 0.4, matte, 0, 0, -0.25, b);
    blades.push(b); mirrorSrc.push(b);
  });
  /* anillo (el horizonte de la materia oscura) */
  var RING_F = 'uniform vec3 uCol; uniform float uI, uSeg, uSpin, uDash; varying vec3 vP; void main(){ float a = atan(vP.y, vP.x) / 6.2831853 + 0.5; float s = fract(a * uSeg - uSpin); float d = smoothstep(0.0, 0.06, s) * smoothstep(0.62, 0.52, s); gl_FragColor = vec4(uCol * uI * mix(1.0, d, uDash), 1.0); }';
  var ringU = {uCol: {value: C.hueso.clone()}, uI: {value: 1}, uSeg: {value: 64}, uSpin: {value: 0}, uDash: {value: 1}};
  var ring = new T.Mesh(new T.TorusGeometry(15.5, 0.3, 8, 240), new T.ShaderMaterial({uniforms: ringU, vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: RING_F}));
  ring.position.set(0, 16.5, -18.5); scene.add(ring); mirrorSrc.push(ring);
  var orbit = new T.Mesh(new T.TorusGeometry(18.2, 0.07, 6, 240), new T.MeshBasicMaterial({color: 0x56606a}));
  orbit.position.set(0, 16.5, -19); orbit.rotation.x = 0.06; scene.add(orbit);
  /* columnas de focos a los lados de la pantalla */
  var BULBS = [];
  for (var bi = 0; bi < 13; bi++){ BULBS.push([-7.7, 4 + bi * 1.85, -15.2]); BULBS.push([7.7, 4 + bi * 1.85, -15.2]); }
  for (bi = 0; bi < 9; bi++) BULBS.push([-6 + bi * 1.5, 27.4, -15.2]);
  var bulbs = new T.InstancedMesh(new T.SphereGeometry(0.2, 10, 8), new T.MeshBasicMaterial({color: 0xffffff}), BULBS.length);
  var M4 = new T.Matrix4(), V3 = new T.Vector3(), Q = new T.Quaternion(), S3 = new T.Vector3(1, 1, 1), TC = new T.Color();
  BULBS.forEach(function(p, i){ M4.makeTranslation(p[0], p[1], p[2]); bulbs.setMatrixAt(i, M4); bulbs.setColorAt(i, TC.setRGB(1, 1, 1)); });
  scene.add(bulbs);
  /* truss, patas y line arrays */
  box(54, 0.8, 0.8, metal, 0, 28.8, -3); box(50, 0.8, 0.8, metal, 0, 30.2, -9.5); box(0.8, 0.8, 7.3, metal, -26, 29.5, -6.2); box(0.8, 0.8, 7.3, metal, 26, 29.5, -6.2);
  [-1, 1].forEach(function(sd){ box(0.8, 30.6, 0.8, metal, sd * 27, 15.3, -3); box(0.8, 31.6, 0.8, metal, sd * 25.5, 15.8, -9.5); });
  var arr = new T.InstancedMesh(new T.BoxGeometry(2.1, 0.75, 1.3), matte, 16);
  for (var ai = 0; ai < 16; ai++){ var sd2 = ai < 8 ? -1 : 1, k2 = ai % 8; M4.compose(V3.set(sd2 * 30, 26 - k2 * 0.78, -1.5 + k2 * 0.06), Q.setFromEuler(new T.Euler(k2 * 0.05, sd2 * -0.2, 0)), S3); arr.setMatrixAt(ai, M4); }
  scene.add(arr);
  /* valla */
  box(50, 1.15, 0.2, metal, 0, 0.58, 2.6);
  /* cintas LED alrededor de la tribuna */
  var ribbons = [];
  [[80, 3.2], [96, 15.5]].forEach(function(rb){
    var sc = screen(1, 1, {txt: tickTx, panel: 1, rep: [-rb[0] * 2.7 / 0.9 / 32, 1], dens: 4});
    sc.geometry.dispose(); sc.geometry = new T.CylinderGeometry(rb[0], rb[0], 0.9, 160, 1, true, -1.35, 2.7);
    sc.material.side = T.BackSide; sc.position.set(0, rb[1], 8); scene.add(sc); ribbons.push(sc);
  });

  /* reflejo del piso: copias espejadas de lo que brilla, vistas a través del piso de vidrio negro */
  var mirror = new T.Group(); mirror.position.y = DECK * 2; mirror.scale.y = -1; scene.add(mirror);
  scene.updateMatrixWorld(true);
  mirrorSrc.forEach(function(src){ var m = new T.Mesh(src.geometry, src.material); m.matrixAutoUpdate = false; m.matrix.copy(src.matrixWorld); mirror.add(m); });

  /* ——— luces de escena ——— */
  scene.add(new T.AmbientLight(0x5e686c, 0.28));
  var keyL = new T.PointLight(0xffffff, 2, 70, 1.4); keyL.position.set(0, 13, -6); scene.add(keyL);
  var frontL = new T.DirectionalLight(0xabb8c5, 0.35); frontL.position.set(0, 25, 50); scene.add(frontL);
  var flashL = new T.PointLight(0xff7a3a, 0, 60, 1.5); flashL.position.set(0, 6, 2); scene.add(flashL);

  /* ——— cabezas móviles ——— */
  var BEAM_V = 'varying float vD; varying vec3 vN, vW; void main(){ vD = 1.0 - uv.y; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }';
  var BEAM_F = [
    'uniform vec3 uCol; uniform float uI, uTime, uFogD; varying float vD; varying vec3 vN, vW;',
    'void main(){',
    '  vec3 V = normalize(cameraPosition - vW); float e = pow(abs(dot(normalize(vN), V)), 1.7);',
    '  float f = pow(1.0 - vD, 2.2); float hot = 0.3 + 0.7 * exp(-vD * 9.0);',
    '  float n = 0.72 + 0.28 * sin(vW.y * 0.55 + uTime * 0.7 + sin(vW.x * 0.35 - uTime * 0.31) * 2.4);',
    '  float d = length(vW - cameraPosition); float fog = exp(-d * uFogD * 0.6);',
    '  gl_FragColor = vec4(uCol * uI * e * f * n * hot * fog * 1.5, 1.0);',
    '}'].join('\n');
  var beamGeo = new T.CylinderGeometry(0.1, 2.4, 62, 22, 1, true); beamGeo.translate(0, -31, 0); beamGeo.rotateX(-Math.PI / 2);
  var lensGeo = new T.CircleGeometry(0.24, 16);
  var beams = [];
  function fixture(x, y, z, hang, grp){
    var U = {uCol: {value: new T.Color(1, 1, 1)}, uI: {value: 0}, uTime: G.uTime, uFogD: G.uFogD};
    var m = new T.Mesh(beamGeo, new T.ShaderMaterial({uniforms: U, vertexShader: BEAM_V, fragmentShader: BEAM_F, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide}));
    m.position.set(x, y, z); m.frustumCulled = false; scene.add(m);
    var body = box(0.55, 0.6, 0.55, metal, x, y + (hang ? 0.35 : -0.3), z);
    var lens = new T.Mesh(lensGeo, new T.MeshBasicMaterial({color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false})); scene.add(lens);
    var b = {m: m, U: U, lens: lens, hang: hang, grp: grp, x: x, sd: x / 24, i: beams.length, dir: new T.Vector3(0, hang ? -1 : 1, 0), tgt: new T.Vector3(), I: 0};
    beams.push(b); return b;
  }
  var NF = small ? 7 : 12, NM = small ? 6 : 10, NFL = small ? 6 : 8;
  for (var f1 = 0; f1 < NF; f1++) fixture(-23 + 46 * f1 / (NF - 1), 28.2, -3, true, 0);
  for (var f2 = 0; f2 < NM; f2++) fixture(-21 + 42 * f2 / (NM - 1), 29.6, -9.5, true, 1);
  for (var f3 = 0; f3 < NFL; f3++){ var fx = -20 + 40 * f3 / (NFL - 1); if (Math.abs(fx) < 6) fx += fx < 0 ? -1.5 : 1.5; fixture(fx, DECK + 0.35, -1.0, false, 2); }
  towers.forEach(function(tw){ var p = new T.Vector3(tw.sd < 0 ? 1.8 : -1.8, 11.4, 0); tw.g.localToWorld(p); fixture(p.x, p.y, p.z, false, 3); p = new T.Vector3(tw.sd < 0 ? -1.8 : 1.8, 11.4, 0); tw.g.localToWorld(p); fixture(p.x, p.y, p.z, false, 3); });

  /* ——— láseres ——— */
  var lasers = [];
  function laser(x, y, z, n){
    var pos = new Float32Array(n * 6), g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    var m = new T.LineBasicMaterial({color: 0xff0000, transparent: true, blending: T.AdditiveBlending, depthWrite: false});
    var l = new T.LineSegments(g, m); l.frustumCulled = false; scene.add(l);
    var L = {o: new T.Vector3(x, y, z), n: n, pos: pos, g: g, m: m, l: l}; lasers.push(L); return L;
  }
  laser(-21.5, DECK + 0.5, -0.6, small ? 8 : 12); laser(21.5, DECK + 0.5, -0.6, small ? 8 : 12); laser(0, 27.9, -14.6, small ? 10 : 16);

  /* ——— público ——— */
  function merge(list){
    var P = [], N = [], n = 0, i;
    list.forEach(function(g){ g = g.index ? g.toNonIndexed() : g; P.push(g.attributes.position.array); N.push(g.attributes.normal.array); n += g.attributes.position.array.length; });
    var pos = new Float32Array(n), nor = new Float32Array(n), off = 0;
    for (i = 0; i < P.length; i++){ pos.set(P[i], off); nor.set(N[i], off); off += P[i].length; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); return g;
  }
  function inst(baseG, count){
    var g = new T.InstancedBufferGeometry(); g.setAttribute('position', baseG.attributes.position); g.setAttribute('normal', baseG.attributes.normal);
    if (baseG.attributes.uv) g.setAttribute('uv', baseG.attributes.uv); if (baseG.index) g.setIndex(baseG.index);
    g.instanceCount = count; return g;
  }
  var NP = small ? 3600 : 9000, people = [];
  var body = new T.CylinderGeometry(0.22, 0.13, 1.42, 6, 1); body.translate(0, 0.71, 0);
  var head = new T.SphereGeometry(0.115, 6, 4); head.translate(0, 1.58, 0);
  var pG = inst(merge([body, head]), NP), aP = new Float32Array(NP * 4), aR = new Float32Array(NP * 4);
  for (var pi = 0; pi < NP; pi++){
    var px, pz, ok = false;
    while (!ok){ pz = 3.4 + 70 * Math.pow(rnd(), 1.25); var hw = 21 + pz * 0.55; px = (rnd() * 2 - 1) * hw; ok = true; }
    aP.set([px, pz, Math.atan2(-px, 18 + pz) * 0.8 + rr(-0.35, 0.35), rr(0.9, 1.1)], pi * 4);
    aR.set([rnd(), rr(0.35, 1), rnd(), rnd()], pi * 4);
    people.push(pi);
  }
  pG.setAttribute('aP', new T.InstancedBufferAttribute(aP, 4)); pG.setAttribute('aR', new T.InstancedBufferAttribute(aR, 4));
  var CROWD_CHUNK = [
    'uniform float uBeat, uJump, uTime, uSway;',
    'vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }',
    'float hop(vec4 r){ return uJump * r.y * pow(max(0.0, sin((uBeat + r.x * 0.18) * 6.2831853)), 2.0) * 0.3; }'
  ].join('\n');
  var CROWD_F = [
    'uniform vec3 uKey, uFill, uSweepC, uFogC; uniform float uFlash, uSweepX, uFogD; varying vec3 vN, vW; varying float vTone, vY;',
    'void main(){',
    '  float d = length(vW - cameraPosition); if (d < 1.1) discard;',
    '  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW); vec3 L = normalize(vec3(0.0, 15.0, -15.0) - vW);',
    '  float facing = max(0.0, dot(N, L)); float rim = pow(1.0 - max(0.0, dot(N, V)), 2.5); float top = max(0.0, N.y);',
    '  float att = 28.0 / (28.0 + length(vW.xz - vec2(0.0, -10.0)));',
    '  vec3 c = vec3(0.011, 0.012, 0.011) * (0.6 + vTone);',
    '  c += uKey * att * (0.05 + facing * 0.32 + rim * facing * 3.2);',
    '  c += uFill * (0.25 + 0.75 * top) * (0.4 + 0.6 * vY / 1.7);',
    '  c += uSweepC * exp(-pow((vW.x - uSweepX) / 4.0, 2.0)) * (0.25 + top) * att;',
    '  c += vec3(1.0, 0.92, 0.8) * uFlash * (0.2 + top) * att;',
    '  gl_FragColor = vec4(mix(uFogC, c, exp(-d * uFogD)), 1.0);',
    '}'].join('\n');
  var crowdU = {uBeat: G.uBeat, uTime: G.uTime, uJump: {value: 0}, uSway: {value: 1}, uKey: {value: new T.Color()}, uFill: {value: new T.Color()}, uSweepC: {value: new T.Color()}, uSweepX: {value: 0}, uFlash: {value: 0}, uFogC: G.uFogC, uFogD: G.uFogD, uArms: {value: 0.3}};
  var crowd = new T.Mesh(pG, new T.ShaderMaterial({uniforms: crowdU, fragmentShader: CROWD_F, vertexShader: [
    'attribute vec4 aP, aR; varying vec3 vN, vW; varying float vTone, vY;', CROWD_CHUNK,
    'void main(){',
    '  vec3 p = position * aP.w; p.x += sin(uTime * (1.1 + aR.w) + aR.x * 40.0) * uSway * 0.05 * p.y;',
    '  vec3 q = rotY(p, aP.z); q.y += hop(aR);',
    '  vW = vec3(aP.x, 0.0, aP.y) + q; vN = rotY(normal, aP.z); vTone = aR.w; vY = position.y;',
    '  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);',
    '}'].join('\n')}));
  crowd.frustumCulled = false; scene.add(crowd);
  /* brazos arriba */
  var NA = Math.round(NP * 0.5), armB = new T.BoxGeometry(0.075, 0.62, 0.075); armB.translate(0, 0.31, 0);
  var aG = inst(armB, NA), aAP = new Float32Array(NA * 4), aAR = new Float32Array(NA * 4), aAA = new Float32Array(NA * 2);
  for (var ai2 = 0; ai2 < NA; ai2++){ var src = Math.floor(rnd() * NP); aAP.set(aP.subarray(src * 4, src * 4 + 4), ai2 * 4); aAR.set(aR.subarray(src * 4, src * 4 + 4), ai2 * 4); aAA.set([rnd() < 0.5 ? -1 : 1, rnd()], ai2 * 2); }
  aG.setAttribute('aP', new T.InstancedBufferAttribute(aAP, 4)); aG.setAttribute('aR', new T.InstancedBufferAttribute(aAR, 4)); aG.setAttribute('aA', new T.InstancedBufferAttribute(aAA, 2));
  var arms = new T.Mesh(aG, new T.ShaderMaterial({uniforms: crowdU, fragmentShader: CROWD_F, vertexShader: [
    'attribute vec4 aP, aR; attribute vec2 aA; uniform float uArms; varying vec3 vN, vW; varying float vTone, vY;', CROWD_CHUNK,
    'void main(){',
    '  float th = -aA.x * (0.12 + 0.28 * (0.5 + 0.5 * sin(uBeat * 3.14159 + aR.x * 6.28)));',
    '  float cz = cos(th), sz = sin(th); vec3 p = vec3(position.x * cz - position.y * sz, position.x * sz + position.y * cz, position.z);',
    '  vec3 n = vec3(normal.x * cz - normal.y * sz, normal.x * sz + normal.y * cz, normal.z);',
    '  p = (p + vec3(aA.x * 0.19, 1.36, 0.0)) * aP.w * step(aA.y, uArms);',
    '  vec3 q = rotY(p, aP.z); q.y += hop(aR);',
    '  vW = vec3(aP.x, 0.0, aP.y) + q; vN = rotY(n, aP.z); vTone = aR.w; vY = 1.7;',
    '  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);',
    '}'].join('\n')}));
  arms.frustumCulled = false; scene.add(arms);
  /* celulares (pantallas hacia atrás, linternas hacia el escenario) y la tribuna */
  var PH_V = [
    'attribute vec4 aR; uniform float uBeat, uJump, uOn, uPx, uTime, uTorch, uSize; varying float vI;',
    'void main(){',
    '  vec3 p = position; p.y += uJump * aR.y * pow(max(0.0, sin((uBeat + aR.x * 0.18) * 6.2831853)), 2.0) * 0.3;',
    '  float on = step(aR.z, uOn); vec3 V = normalize(cameraPosition - p);',
    '  float face = mix(smoothstep(-0.25, 0.35, V.z), 1.0, uTorch);',
    '  vI = on * face * (0.65 + 0.35 * sin(uTime * (0.8 + aR.w * 2.5) + aR.x * 40.0));',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; vI *= smoothstep(2.0, 6.0, -mv.z);',
    '  gl_PointSize = on * min(uSize * mix(1.0, 2.2, uTorch) * uPx / -mv.z + 1.2, 14.0);',
    '}'].join('\n');
  var PH_F = 'uniform float uTorch, uGain, uFogD; uniform vec3 uFogC; varying float vI; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5 || vI < 0.01) discard; float a = smoothstep(0.5, 0.0, d); vec3 c = mix(vec3(0.62, 0.74, 1.0), vec3(1.0, 0.97, 0.9), uTorch) * vI * a * a * uGain; gl_FragColor = vec4(c, 1.0); }';
  function phones(pos, ar, size, gain){
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aR', new T.BufferAttribute(ar, 4));
    var U = {uBeat: G.uBeat, uTime: G.uTime, uPx: G.uPx, uJump: crowdU.uJump, uOn: {value: 0.3}, uTorch: {value: 0}, uSize: {value: size}, uGain: {value: gain}, uFogD: G.uFogD, uFogC: G.uFogC};
    var pts = new T.Points(g, new T.ShaderMaterial({uniforms: U, vertexShader: PH_V, fragmentShader: PH_F, transparent: true, depthWrite: false, blending: T.AdditiveBlending}));
    pts.frustumCulled = false; scene.add(pts); return U;
  }
  var NPH = Math.round(NP * 0.6), phP = new Float32Array(NPH * 3), phR = new Float32Array(NPH * 4);
  for (var k3 = 0; k3 < NPH; k3++){ var s3 = Math.floor(rnd() * NP), sc3 = aP[s3 * 4 + 3]; phP.set([aP[s3 * 4] + rr(-0.25, 0.25), rr(1.85, 2.15) * sc3, aP[s3 * 4 + 1] - 0.15], k3 * 3); phR.set([aR[s3 * 4], aR[s3 * 4 + 1], rnd(), rnd()], k3 * 4); }
  var phU = phones(phP, phR, 0.11, 2.6);
  var NST = small ? 5000 : 12000, stP = new Float32Array(NST * 3), stR = new Float32Array(NST * 4);
  for (var k4 = 0; k4 < NST; k4++){ var th2 = rr(-1.35, 1.35), r2 = rr(82, 118); stP.set([Math.sin(th2) * r2, 3.8 + (r2 - 82) * 0.62 + rr(0, 0.8), 8 + Math.cos(th2) * r2], k4 * 3); stR.set([rnd(), 0, rnd(), rnd()], k4 * 4); }
  var stU = phones(stP, stR, 0.3, 1.6); stU.uJump = {value: 0};

  /* ——— pirotecnia, CO2 y lluvia de chispas ——— */
  var PN = small ? 2000 : 5000, pp = new Float32Array(PN * 3), pa = new Float32Array(PN * 2), ps = new Float32Array(PN), pv = new Float32Array(PN * 3), plife = new Float32Array(PN), page = new Float32Array(PN), psz = new Float32Array(PN), pHead = 0;
  for (var q0 = 0; q0 < PN; q0++) pa[q0 * 2] = -1;
  var pyG = new T.BufferGeometry(); pyG.setAttribute('position', new T.BufferAttribute(pp, 3)); pyG.setAttribute('aA', new T.BufferAttribute(pa, 2)); pyG.setAttribute('aS', new T.BufferAttribute(ps, 1));
  var pyro = new T.Points(pyG, new T.ShaderMaterial({uniforms: {uPx: G.uPx}, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: 'attribute vec2 aA; attribute float aS; uniform float uPx; varying vec2 vA; void main(){ vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aA.x < 0.0 ? 0.0 : min(aS * uPx / -mv.z + 1.0, 160.0); }',
    fragmentShader: 'varying vec2 vA; void main(){ if (vA.x < 0.0) discard; float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; float a = smoothstep(0.5, 0.0, d); float k = vA.x; vec3 c;'
      + ' if (vA.y < 0.5){ c = mix(vec3(3.2, 2.7, 2.0), vec3(2.4, 0.9, 0.3), k) * (1.0 - k) * a * a; }'
      + ' else if (vA.y < 1.5){ c = mix(vec3(3.4, 2.3, 0.9), vec3(1.5, 0.22, 0.05), smoothstep(0.0, 0.7, k)) * pow(1.0 - k, 1.6) * pow(a, 1.4); }'
      + ' else { c = vec3(0.85, 0.88, 0.92) * 0.32 * (1.0 - k) * a; }'
      + ' gl_FragColor = vec4(c, 1.0); }'}));
  pyro.frustumCulled = false; scene.add(pyro);
  function spawn(ty, x, y, z, vx, vy, vz, life, size){
    var i = pHead; pHead = (pHead + 1) % PN;
    pp[i * 3] = x; pp[i * 3 + 1] = y; pp[i * 3 + 2] = z; pv[i * 3] = vx; pv[i * 3 + 1] = vy; pv[i * 3 + 2] = vz;
    plife[i] = life; page[i] = 0; psz[i] = size; pa[i * 2] = 0; pa[i * 2 + 1] = ty;
  }
  var emit = [], GERB_X = [-21, -16.5, -12, -8, 8, 12, 16.5, 21], FLAME = [[-20, DECK, -0.8], [-10, DECK, -0.8], [10, DECK, -0.8], [20, DECK, -0.8]];
  towers.forEach(function(tw){ var p = new T.Vector3(0, 11.2, 0); tw.g.localToWorld(p); FLAME.push([p.x, p.y, p.z]); });
  var flashV = 0;
  function gerbs(dur, now){ GERB_X.forEach(function(x){ emit.push({ty: 'gerb', x: x, until: now + dur}); }); }
  function waterfall(dur, now){ emit.push({ty: 'fall', until: now + dur}); }
  function flame(i){ var f = FLAME[i]; for (var n = 0; n < (small ? 22 : 46); n++) spawn(1, f[0] + rr(-0.3, 0.3), f[1] + 0.2, f[2] + rr(-0.3, 0.3), rr(-1.2, 1.2), rr(11, 19), rr(-1.2, 1.2), rr(0.6, 1.0), rr(1.4, 2.4)); flashV = Math.max(flashV, 1); }
  function co2(){ [-18, -9, 9, 18].forEach(function(x){ for (var n = 0; n < (small ? 14 : 30); n++) spawn(2, x + rr(-0.2, 0.2), DECK + 0.2, -1 + rr(-0.2, 0.2), rr(-0.8, 0.8), rr(9, 14), rr(-0.4, 1.2), rr(1.1, 1.6), rr(1.0, 1.6)); }); }
  function stepPyro(dt, now){
    var rate = small ? 0.45 : 1;
    for (var e = emit.length - 1; e >= 0; e--){
      var E = emit[e]; if (now > E.until){ emit.splice(e, 1); continue; }
      if (E.ty === 'gerb'){ var n = Math.round(240 * rate * dt + rnd()); while (n-- > 0){ var a = rr(0, 6.283), sp = rr(0, 0.16); spawn(0, E.x + rr(-0.15, 0.15), DECK + 0.1, -0.7, Math.cos(a) * sp * 11, rr(9, 13), Math.sin(a) * sp * 11, rr(1.1, 1.7), rr(0.1, 0.18)); } }
      else { var n2 = Math.round(520 * rate * dt + rnd()); while (n2-- > 0) spawn(0, rr(-25, 25), 28.3, -3 + rr(-0.2, 0.2), rr(-0.15, 0.15), rr(-1.5, 0), rr(-0.15, 0.25), rr(2.4, 3.2), rr(0.08, 0.14)); }
    }
    for (var i = 0; i < PN; i++){
      if (pa[i * 2] < 0) continue;
      page[i] += dt; var k = page[i] / plife[i]; if (k >= 1){ pa[i * 2] = -1; continue; }
      var ty = pa[i * 2 + 1], j = i * 3;
      if (ty < 0.5){ pv[j + 1] -= 9.8 * dt; pv[j] *= 0.995; pv[j + 2] *= 0.995; }
      else if (ty < 1.5){ var dr = 1 - 1.9 * dt; pv[j] *= dr; pv[j + 1] = pv[j + 1] * dr + 2.5 * dt; pv[j + 2] *= dr; }
      else { var d2 = 1 - 2.2 * dt; pv[j] *= d2; pv[j + 1] = pv[j + 1] * d2 + 0.6 * dt; pv[j + 2] *= d2; }
      pp[j] += pv[j] * dt; pp[j + 1] += pv[j + 1] * dt; pp[j + 2] += pv[j + 2] * dt;
      if (pp[j + 1] < 0.05){ pp[j + 1] = 0.05; pv[j + 1] *= -0.25; }
      pa[i * 2] = k; ps[i] = ty < 0.5 ? psz[i] : ty < 1.5 ? psz[i] * (0.55 + k * 1.3) : psz[i] * (0.6 + k * 2.6);
    }
    pyG.attributes.position.needsUpdate = true; pyG.attributes.aA.needsUpdate = true; pyG.attributes.aS.needsUpdate = true;
  }

  /* ——— confeti ——— */
  var NC = small ? 700 : 1800, cfB = new T.PlaneGeometry(0.17, 0.11), cfG = inst(cfB, NC), cfO = new Float32Array(NC * 4);
  for (var ci = 0; ci < NC; ci++) cfO.set([rr(-34, 34), rr(-2, 52), rr(2.2, 3.6), rnd()], ci * 4);
  cfG.setAttribute('aO', new T.InstancedBufferAttribute(cfO, 4));
  var cfU = {uT: {value: -1}, uKey: crowdU.uKey, uFogC: G.uFogC, uFogD: G.uFogD};
  var confetti = new T.Mesh(cfG, new T.ShaderMaterial({uniforms: cfU, side: T.DoubleSide, vertexShader: [
    'attribute vec4 aO; uniform float uT; varying float vS; varying vec3 vC; varying float vD;',
    'void main(){',
    '  float t = uT - aO.w * 2.2; float y = 36.0 + aO.w * 6.0 - t * aO.z;',
    '  if (t < 0.0 || y < 0.3){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }',
    '  float ax = t * 4.0 + aO.w * 30.0, ay = t * 2.6 + aO.w * 11.0; vec3 p = position;',
    '  p = vec3(p.x, p.y * cos(ax), p.y * sin(ax)); p = vec3(p.x * cos(ay) + p.z * sin(ay), p.y, -p.x * sin(ay) + p.z * cos(ay));',
    '  vec3 w = vec3(aO.x + sin(t * 1.7 + aO.w * 9.0) * 0.9, y, aO.y + cos(t * 1.3 + aO.w * 5.0) * 0.9) + p;',
    '  vS = 0.35 + 0.65 * abs(cos(ax)); float k = fract(aO.w * 7.31);',
    '  vC = k < 0.5 ? vec3(0.86, 0.83, 0.76) : k < 0.8 ? vec3(0.95, 0.1, 0.08) : vec3(0.7, 0.76, 0.84);',
    '  vec4 mv = viewMatrix * vec4(w, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv;',
    '}'].join('\n'),
    fragmentShader: 'uniform vec3 uKey, uFogC; uniform float uFogD; varying float vS; varying vec3 vC; varying float vD; void main(){ vec3 c = vC * vS * (0.35 + 0.9 * dot(uKey, vec3(0.33))); gl_FragColor = vec4(mix(uFogC, c, exp(-vD * uFogD)), 1.0); }'}));
  confetti.frustumCulled = false; scene.add(confetti);
  var cfT0 = -100;

  /* ——— humo bajo sobre el escenario ——— */
  var SMOKE_F = [
    'uniform float uTime, uI; uniform vec3 uCol; varying vec2 vUv;',
    'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }',
    'void main(){ vec2 p = vUv * vec2(9.0, 3.5); float v = n(p + vec2(uTime * 0.12, uTime * 0.05)) * 0.6 + n(p * 2.1 - vec2(uTime * 0.2, 0.0)) * 0.4;',
    '  float e = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.6, vUv.y);',
    '  gl_FragColor = vec4(uCol * pow(v, 2.2) * e * uI, 1.0); }'].join('\n');
  var smokeU = {uTime: G.uTime, uI: {value: 0.6}, uCol: {value: new T.Color(0.3, 0.32, 0.33)}};
  [[DECK + 0.35, -7.5, 1], [DECK + 1.1, -9.5, 0.7]].forEach(function(s){
    var m = new T.Mesh(new T.PlaneGeometry(50, 19), new T.ShaderMaterial({uniforms: smokeU, vertexShader: SCR_V, fragmentShader: SMOKE_F, transparent: true, depthWrite: false, blending: T.AdditiveBlending}));
    m.rotation.x = -Math.PI / 2; m.position.set(0, s[0], s[1]); m.renderOrder = 3; scene.add(m);
  });

  /* ——— la reliquia y el entorno cromado ——— */
  var relic = new T.Group(); relic.position.set(0, 30.2, -14.6); scene.add(relic);
  var relicL = new T.PointLight(0xdce6f0, 2.2, 18, 1.5); relicL.position.set(0, 31, -8.5); scene.add(relicL);
  setTimeout(function(){
    try{
      var pm = new T.PMREMGenerator(R), img = new Image();
      img.onload = function(){ var c = document.createElement('canvas'); c.width = img.width; c.height = img.height; var x = c.getContext('2d'); x.filter = 'grayscale(1) brightness(.75)'; x.drawImage(img, 0, 0);
        var t = new T.CanvasTexture(c); t.mapping = T.EquirectangularReflectionMapping; scene.environment = pm.fromEquirectangular(t).texture; t.dispose(); };
      img.src = base + 'env.jpg';
      if (T.GLTFLoader) new T.GLTFLoader().load(base + 'relic.json', function(gl){
        var m = gl.scene, bx = new T.Box3().setFromObject(m), c = bx.getCenter(new T.Vector3()), sz = bx.getSize(new T.Vector3());
        var kk = 6.6 / Math.max(sz.x, sz.y); m.scale.setScalar(kk); m.position.copy(c).multiplyScalar(-kk);
        m.traverse(function(ob){ if (!ob.isMesh) return; var mt = ob.material; mt.envMapIntensity = 1.6;
          if (/chrome/i.test(mt.name)){ mt.metalness = 1; mt.roughness = 0.16; }
          if (/gunmetal/i.test(mt.name)){ mt.metalness = 1; mt.roughness = 0.3; }
          if (/signal/i.test(mt.name)){ mt.emissive = new T.Color(0xe12423); mt.emissiveIntensity = 3; }
          if (/^halo$/i.test(ob.name)) ob.visible = false; });
        relic.add(m);
      });
    }catch(e){}
  }, 900);

  /* ——— postproceso ——— */
  var comp = null, bloom = null, fin = null;
  var FIN = {
    uniforms: {tDiffuse: {value: null}, uTime: {value: 0}, uStrobe: {value: 0}, uStrobeC: {value: new T.Color(1, 1, 1)}, uVig: {value: 0.85}, uGrain: {value: 0.045}, uExpo: {value: 1}, uRes: {value: new T.Vector2(1, 1)}},
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse; uniform float uTime, uStrobe, uVig, uGrain, uExpo; uniform vec3 uStrobeC; uniform vec2 uRes; varying vec2 vUv;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
      'vec3 tm(vec3 c){ c *= uExpo; float l = max(max(c.r, c.g), c.b); c = mix(c, vec3(l), smoothstep(1.3, 5.0, l) * 0.55);',
      '  return mix(c, 0.82 + 0.18 * (1.0 - exp(-(c - 0.82) / 0.18)), step(0.82, c)); }',
      'void main(){ vec2 d = vUv - 0.5; float ca = dot(d, d) * 0.012;',
      '  vec3 c = vec3(texture2D(tDiffuse, vUv + d * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * ca).b);',
      '  c = tm(c) + uStrobeC * uStrobe;',
      '  c *= mix(1.0, smoothstep(0.98, 0.22, length(d * vec2(1.0, 0.86))), uVig);',
      '  c += (h(vUv * uRes + fract(uTime) * 91.7) - 0.5) * uGrain;',
      '  gl_FragColor = vec4(max(c, 0.0), 1.0); }'].join('\n')
  };
  function setupComposer(){
    if (comp || !T.EffectComposer || !T.UnrealBloomPass || !T.ShaderPass || !T.RenderPass) return;
    try{
      var ext = R.extensions, hf = R.capabilities.isWebGL2 ? (ext.get('EXT_color_buffer_float') || ext.get('EXT_color_buffer_half_float')) : (ext.get('OES_texture_half_float') && ext.get('EXT_color_buffer_half_float'));
      var rt = new T.WebGLRenderTarget(4, 4, {minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat, type: hf ? T.HalfFloatType : T.UnsignedByteType});
      comp = new T.EffectComposer(R, rt);
      comp.addPass(new T.RenderPass(scene, cam));
      bloom = new T.UnrealBloomPass(new T.Vector2(256, 256), small ? 0.85 : 1.05, 0.62, hf ? 0.9 : 0.62); comp.addPass(bloom);
      fin = new T.ShaderPass(FIN); comp.addPass(fin);
      size(VW, VH);
    }catch(e){ comp = null; }
  }

  /* ——— cámara: tomas por cue ——— */
  function K(p, pos, tgt, fov, lin){ return {p: p, pos: new T.Vector3(pos[0], pos[1], pos[2]), tgt: new T.Vector3(tgt[0], tgt[1], tgt[2]), fov: fov, lin: !!lin}; }
  var KEYS = [], SH = [
    [[-28, 15, 92], [-10, 11.5, 74], [0, 10, -8], [0, 11, -10], 36, 32],
    [[0, 7.2, 66], [0, 7.6, 54], [0, 14.6, -14], [0, 14.9, -14], 30, 29],
    [[-8, 3.7, 34], [5, 4, 24], [0, 11.5, -14], [0, 12, -14], 46, 42],
    [[46, 15, 34], [37, 11, 22], [1, 8.5, -6], [-4, 7.5, 2], 46, 50],
    [[3, 2.45, 9], [0.4, 2.6, 5.4], [0, 15, -15], [0, 16.6, -15], 58, 61]
  ];
  SH.forEach(function(s, i){ KEYS.push(K((i + 0.12) / 6, s[0], s[2], s[4], false)); KEYS.push(K((i + 0.86) / 6, s[1], s[3], s[5], true)); });
  for (var oi = 0; oi <= 6; oi++){ var u = oi / 6, an = lerp(0.8, -0.4, u), rad = lerp(50, 80, u); KEYS.push(K((5 + 0.12 + 0.76 * u) / 6, [Math.sin(an) * rad, lerp(20, 40, u), -6 + Math.cos(an) * rad], [0, lerp(11, 9, u), -6], lerp(46, 42, u), oi > 0)); }
  var camP = new T.Vector3(), camT = new T.Vector3(), camF = 36;
  function shot(p){
    if (p <= KEYS[0].p){ camP.copy(KEYS[0].pos); camT.copy(KEYS[0].tgt); camF = KEYS[0].fov; return; }
    for (var i = 1; i < KEYS.length; i++){
      if (p <= KEYS[i].p){ var a = KEYS[i - 1], b = KEYS[i], t = (p - a.p) / (b.p - a.p); t = b.lin ? t : sstep(0, 1, t);
        camP.copy(a.pos).lerp(b.pos, t); camT.copy(a.tgt).lerp(b.tgt, t); camF = lerp(a.fov, b.fov, t); return; }
    }
    var L = KEYS[KEYS.length - 1]; camP.copy(L.pos); camT.copy(L.tgt); camF = L.fov;
  }

  /* ——— estado del show ——— */
  var VW = 2, VH = 2, prog = 0, progS = 0, cue = -1, cueT0 = 0, cueBeat0 = 0, now = 0, glitch = 0, strobe = 0, alive = true;
  var yaw = 0, pitch = 0, yawT = 0, pitchT = 0, dragging = false, mx = 0, my = 0, music = false, energy = 0.7, beat = 0;
  var keyCol = new T.Color(0.3, 0.3, 0.3), keyTgt = new T.Color(), sampC = document.createElement('canvas'); sampC.width = 12; sampC.height = 6;
  var sampX = sampC.getContext('2d', {willReadFrequently: true}), sampT = 0, wallK = 0;
  var tmp = new T.Vector3(), tmp2 = new T.Vector3(), UP = new T.Vector3(0, 1, 0);

  function setCue(i){
    if (i === cue) return; var prev = cue; cue = i; cueT0 = now; cueBeat0 = Math.ceil(beat); glitch = prev >= 0 ? 1 : 0;
    var vk = VID[CUES[i]] ? CUES[i] : null;
    Object.keys(vids).forEach(function(k){ if (k !== vk) try{ vids[k].v.pause(); }catch(e){} });
    curVid = vk; if (vk && alive) playVid(vk);
    var nx = CUES[i + 1]; if (nx && VID[nx]) getVid(nx);
    if (i === 2) co2();
    if (i === 5){ cfT0 = now + 0.4; waterfall(9, now); gerbs(3, now); }
    if (o.onCue) o.onCue(i);
  }
  function beams_(mode, cA, cB, I, pat, bfr, bi){
    for (var i = 0; i < beams.length; i++){
      var b = beams[i], k = b.i / beams.length, s = b.sd, a = 0, e = 0.4, t = now;
      if (mode === 'pillars'){ a = 0; e = 0.03 + 0.03 * Math.sin(t + k * 9); }
      else if (mode === 'fan'){ a = s * 1.05 + Math.sin(t * 0.6) * 0.18; e = 0.42 + 0.22 * Math.sin(t * 0.9 + k * 3.1); }
      else if (mode === 'sweep'){ a = s * 0.5 + 0.7 * Math.sin(t * 1.05 + k * 2.2); e = 0.5 + 0.36 * Math.sin(t * 1.4 + k * 3.7); }
      else if (mode === 'crowd'){ a = s * 0.8 + 0.3 * Math.sin(t * 0.7 + (b.grp % 2) * 3); e = 0.98 + 0.14 * Math.sin(t * 1.2 + k * 5); }
      else if (mode === 'cross'){ a = (b.i % 2 ? 1 : -1) * (0.35 + 0.35 * Math.sin(t * 1.3)); e = 0.55 + 0.2 * Math.sin(t * 0.8 + k * 2); }
      else if (mode === 'focus'){ tmp.set(Math.sin(t * 0.8 + k * 6) * 2, DECK + 0.5, -6 + Math.cos(t * 0.6 + k * 5) * 2).sub(b.m.position).normalize(); }
      if (mode !== 'focus'){ var se = Math.sin(e); tmp.set(se * Math.sin(a), b.hang ? -Math.cos(e) : Math.cos(e), se * Math.cos(a)); if (b.grp === 3) tmp.set(se * Math.sin(a) + b.sd * 0.2, Math.cos(e) + 0.2, se * Math.cos(a) + 0.15).normalize(); }
      b.dir.lerp(tmp, Math.min(1, (reduce ? 1.5 : 4.5) * dtLast)).normalize();
      var on = 1;
      if (pat === 'chase') on = ((b.i + bi) % 4 === 0) ? 1 : 0.18;
      else if (pat === 'alt') on = ((b.i + bi) % 2) ? 1 : 0.1;
      else if (pat === 'strobe') on = (Math.floor(bfr * 4) % 2 === 0 && ((b.i * 7 + bi) % 3 !== 0)) ? 1 : 0.05;
      else if (pat === 'pulse') on = 0.45 + 0.55 * Math.exp(-bfr * 5);
      var target = I * on * (b.grp === 3 ? 0.8 : 1);
      b.I += (target - b.I) * Math.min(1, dtLast * 14);
      b.U.uCol.value.copy(b.i % 2 ? cB : cA); b.U.uI.value = b.I;
      tmp2.copy(b.m.position).add(b.dir); b.m.lookAt(tmp2);
      b.lens.position.copy(b.m.position).addScaledVector(b.dir, 0.32); b.lens.lookAt(tmp2.copy(b.lens.position).add(b.dir));
      b.lens.material.color.copy(b.U.uCol.value).multiplyScalar(0.4 + b.I * 3.2);
    }
  }
  function lasers_(mode, c, I){
    for (var li = 0; li < lasers.length; li++){
      var L = lasers[li], n = L.n, P = L.pos, t = now;
      L.l.visible = I > 0.01 && mode !== 'off'; if (!L.l.visible) continue;
      L.m.color.copy(c).multiplyScalar(I * 2.6);
      for (var i = 0; i < n; i++){
        var k = n > 1 ? i / (n - 1) : 0.5, a, e;
        if (mode === 'sheet'){ a = (k - 0.5) * 1.6 + Math.sin(t * 0.7 + li) * 0.35 + (li === 0 ? 0.35 : li === 1 ? -0.35 : 0); e = 0.02 + 0.05 * Math.sin(t * 1.3 + li * 2); }
        else if (mode === 'cone'){ var r = 0.32 + 0.1 * Math.sin(t * 2); a = Math.sin(k * 6.283 + t * 1.6) * r; e = Math.cos(k * 6.283 + t * 1.6) * r * 0.7 - 0.08; }
        else { a = (k - 0.5) * 1.2 * Math.sin(t * 1.1); e = -0.1 + (k - 0.5) * 0.3; }
        if (li === 2) e -= 0.16;
        var ce = Math.cos(e); tmp.set(Math.sin(a) * ce, Math.sin(e), Math.cos(a) * ce);
        P[i * 6] = L.o.x; P[i * 6 + 1] = L.o.y; P[i * 6 + 2] = L.o.z;
        P[i * 6 + 3] = L.o.x + tmp.x * 160; P[i * 6 + 4] = L.o.y + tmp.y * 160; P[i * 6 + 5] = L.o.z + tmp.z * 160;
      }
      L.g.attributes.position.needsUpdate = true;
    }
  }
  function scr(m, txt, mix, bright, bgA, bgB, cut){ var U = m.userData.U; if (txt) U.uTxt.value = txt.t; U.uMix.value = mix; U.uBright.value = bright; if (bgA) U.uBgA.value.copy(bgA); if (bgB) U.uBgB.value.copy(bgB || bgA); U.uCut.value = cut == null ? -1 : cut; if (m === center){ U.uRep.value.set(1, U.uTxt.value === gridTx.t ? 23 / 13 / 2 : 1); if (U.uTxt.value !== gridTx.t) U.uScroll.value.set(0, 0); } }
  var dtLast = 0.016, wallTop = col(0.9, 0.12, 0.1), wallBot = col(1.25, 0.5, 0.24), dim = col(0.012, 0.014, 0.012);

  function direct(dt){
    var te = now - cueT0, bi = Math.floor(beat), bf = beat - bi, sb = beat - cueBeat0, kick = Math.exp(-bf * 6), c = CUES[cue];
    var vk = VID[c] ? c : null, vOk = vk && vidReady(vk), vt = vOk ? vids[vk].t : blackTex;
    screens.forEach(function(m){ m.userData.U.uVid.value = vt; m.userData.U.uGlitch.value = glitch; m.userData.U.uPulse.value = 0; });
    var E = music ? energy : 0.85;
    var fill = col(0, 0, 0), sweep = col(0, 0, 0), sweepX = Math.sin(now * 0.9) * 30, jump = 0, armsF = 0.12, phOn = 0.25, stOn = 0.3, torch = 0, flash = 0;
    var ringC = C.hueso, ringI = 1, ringDash = 1, ringSpin = now * 0.05, bulbMode = 'breath', tickSpd = 0.02, gridSpd = 0.02, relicSpin = 0.25;
    strobe *= Math.exp(-dt * 10);
    if (c === 'doors'){
      scr(center, doorsTx, 0, 1, dim); towers.forEach(function(tw){ scr(tw.front, gridTx, 0, 0.32, dim); scr(tw.head, headTx, 0, 0.45, C.rojo); scr(tw.side, vertTx, 0, 0.5, dim); });
      blades.forEach(function(b){ scr(b, vertTx, 0, 0.4, dim); });
      beams_('pillars', C.cromo, C.hueso, 0.22, 'all', bf, bi); lasers_('off', C.white, 0);
      fill.setRGB(0.11, 0.1, 0.09); jump = 0.05; phOn = 0.18; stOn = 0.35; ringI = 0.45; ringSpin = now * 0.02; relicSpin = 0.15;
    } else if (c === 'ignition'){
      var boom = te > 0.5, sbi = sb - 1, ph = Math.max(0, Math.floor(sbi / 12)) % 2, inPh = sbi - Math.floor(sbi / 12) * 12, nL = COPY[lang].wall[ph].length;
      if (ph !== wallK){ wallK = ph; glitch = Math.max(glitch, 0.6); }
      var cut = !boom ? 2 : sbi < 0 ? 2 : inPh >= nL ? -1 : wallCut[ph][Math.min(nL - 1, Math.floor(inPh))];
      scr(center, wallTx[ph], 0, boom ? 1 : 0, wallTop, wallBot, cut); center.userData.U.uPulse.value = boom ? kick * 0.6 * E : 0;
      towers.forEach(function(tw){ scr(tw.front, gridTx, 0, boom ? 0.95 : 0, dim); scr(tw.head, headTx, 0, boom ? 1.1 : 0, C.rojo); scr(tw.side, vertTx, 0, boom ? 1 : 0, dim); });
      blades.forEach(function(b){ scr(b, vertTx, 0, boom ? 0.9 : 0, dim); });
      if (boom && !direct.ig){ direct.ig = 1; strobe = reduce ? 0 : 0.5; FLAME.forEach(function(f, i){ flame(i); }); gerbs(2.6, now); }
      if (!boom) direct.ig = 0;
      if (boom && bi % 16 === 0 && direct.gb !== bi){ direct.gb = bi; gerbs(1.6, now); }
      beams_(boom ? (Math.floor(bi / 8) % 2 ? 'sweep' : 'fan') : 'pillars', C.white, C.rojo, boom ? 0.95 * E : 0, 'pulse', bf, bi);
      lasers_('off', C.white, 0);
      fill.setRGB(0.012, 0.004, 0.003); jump = boom ? 0.75 * E : 0; armsF = 0.32; phOn = 0.38; stOn = 0.42; ringC = C.rojo; ringI = boom ? 0.9 + kick * 0.8 : 0; ringDash = 0; bulbMode = 'chase'; gridSpd = 0.06; tickSpd = 0.05; relicSpin = 0.5;
    } else if (c === 'muses' || c === 'runway' || c === 'finale'){
      var fin2 = c === 'finale' && prog > (5 + 0.84) / 6, mixV = vOk && !fin2 ? 1 : 0;
      scr(center, fin2 ? nightTx : gridTx, mixV, 1, dim);
      towers.forEach(function(tw){ scr(tw.front, gridTx, mixV, 1, dim); scr(tw.head, headTx, 0, 1.1, C.rojo); scr(tw.side, vertTx, 0, 1, dim); });
      blades.forEach(function(b){ scr(b, vertTx, mixV, 0.9, dim); b.userData.U.uRect.value.set(1 / 3, 0, 1 / 3, 1); });
      if (c === 'muses'){
        beams_(Math.floor(bi / 8) % 2 ? 'sweep' : 'fan', C.hueso, C.cromo, 0.85 * E, 'chase', bf, bi); lasers_('off', C.white, 0);
        if (bi % 16 === 0 && direct.cb !== bi && sb > 2){ direct.cb = bi; co2(); }
        fill.setRGB(0.01, 0.012, 0.016); jump = 0.55 * E; armsF = 0.3; phOn = 0.45; stOn = 0.5; ringC = C.hueso; ringI = 0.9; ringSpin = now * 0.12; bulbMode = 'chase'; relicSpin = 0.4;
      } else if (c === 'runway'){
        var md = ['cross', 'crowd', 'fan', 'pillars'][Math.floor(bi / 8) % 4];
        beams_(md, C.white, C.rojo, 0.9 * E, md === 'pillars' ? 'alt' : 'pulse', bf, bi); lasers_(Math.floor(bi / 16) % 2 ? 'cone' : 'sheet', Math.floor(bi / 32) % 2 ? C.rojo : C.white, 0.85 * E);
        if (bi % 8 === 0 && direct.fb !== bi && sb > 1){ direct.fb = bi; var side = (bi / 8) % 2 ? 0 : 1; flame(side ? 0 : 3); flame(side ? 1 : 2); }
        fill.setRGB(0.01, 0.008, 0.008); sweep.setRGB(0.25, 0.06, 0.05); jump = 0.85 * E; armsF = 0.42; phOn = 0.32; stOn = 0.45; ringC = C.white; ringI = 0.7 + kick * 0.5; ringSpin = beat * 0.125; bulbMode = 'alt'; tickSpd = 0.08; relicSpin = 0.6;
      } else {
        beams_(Math.floor(bi / 4) % 2 ? 'sweep' : 'pillars', C.white, C.hueso, 1.0 * E, Math.floor(bi / 4) % 2 ? 'pulse' : 'alt', bf, bi); lasers_('sheet', Math.floor(bi / 8) % 2 ? C.rojo : C.white, 0.9 * E);
        if (bi % 4 === 0 && direct.gf !== bi){ direct.gf = bi; gerbs(1.2, now); }
        if (bi % 8 === 0 && direct.ff !== bi){ direct.ff = bi; FLAME.forEach(function(f, i){ if (i < 4 || bi % 16 === 0) flame(i); }); }
        if (bi % 32 === 0 && direct.cf !== bi && te > 8){ direct.cf = bi; cfT0 = now; }
        if (!emit.some(function(e){ return e.ty === 'fall'; })) waterfall(8, now);
        fill.setRGB(0.02, 0.019, 0.017); jump = 1.0 * E; armsF = 0.55; phOn = 0.55; stOn = 0.7; ringC = C.white; ringI = 1.1 + kick * 0.6; ringDash = 0.5; ringSpin = now * 0.3; bulbMode = 'all'; tickSpd = 0.1; relicSpin = 1.2;
        if (fin2){ torch = 1; phOn = 0.7; stOn = 0.85; jump = 0.2; }
      }
    } else if (c === 'turn'){
      var lit = te > 1.25;
      if (lit && !direct.tn){ direct.tn = 1; strobe = reduce ? 0 : 0.7; FLAME.forEach(function(f, i){ flame(i); }); }
      if (!lit) direct.tn = 0;
      var flick = lit && te < 2.6 ? (Math.random() < 0.5 ? 0.25 : 1.15) : 1;
      towers.forEach(function(tw){ scr(tw.front, gridTx, lit && vOk ? 1 : 0, lit ? 0.95 * flick : 0, dim); scr(tw.head, headTx, 0, lit ? 1 : 0, C.rojo); scr(tw.side, vertTx, 0, lit ? 1 : 0.0, dim); });
      scr(center, gridTx, lit && vOk ? 1 : 0, lit ? 1.05 * flick : 0, dim);
      blades.forEach(function(b){ scr(b, vertTx, 0, lit ? 0.9 : 0, dim); });
      beams_(lit ? 'crowd' : 'pillars', C.rojo, C.rojo, lit ? 1.05 * E : 0, 'strobe', bf, bi); lasers_(lit ? 'cone' : 'off', C.rojo, lit ? 0.9 * E : 0);
      if (lit && !reduce && bf < 0.05 && bi % 2 === 0) strobe = Math.max(strobe, 0.16);
      fill.setRGB(0.02, 0.0, 0.0); sweep.setRGB(0.5, 0.03, 0.02); jump = lit ? 0.35 * E : 0; armsF = 0.18; phOn = 0.12; stOn = 0.2; ringC = C.rojo; ringI = lit ? 0.4 + kick * 1.2 : kick * 0.5; ringDash = 0; bulbMode = 'off'; relicSpin = 0.1;
    }
    /* luz del escenario sobre el público: color de las pantallas */
    sampT -= dt;
    if (sampT <= 0){ sampT = 0.2;
      if (vOk && center.userData.U.uMix.value > 0.5){ try{ sampX.drawImage(vids[vk].v, 0, 0, 12, 6); var d = sampX.getImageData(0, 0, 12, 6).data, r = 0, g = 0, b = 0; for (var i = 0; i < d.length; i += 4){ r += d[i]; g += d[i + 1]; b += d[i + 2]; } var n = d.length / 4 * 255; keyTgt.setRGB(r / n, g / n, b / n).multiplyScalar(1.6); }catch(e){ keyTgt.setRGB(0.4, 0.4, 0.4); } }
      else if (c === 'ignition') keyTgt.setRGB(0.95, 0.2, 0.12); else if (c === 'doors') keyTgt.setRGB(0.25, 0.26, 0.27); else keyTgt.setRGB(0.3, 0.3, 0.32);
    }
    var bright = center.userData.U.uBright.value;
    keyCol.lerp(keyTgt, Math.min(1, dt * 3));
    crowdU.uKey.value.copy(keyCol).multiplyScalar(bright);
    crowdU.uFill.value.copy(fill); crowdU.uSweepC.value.copy(sweep).multiplyScalar(0.6 + kick); crowdU.uSweepX.value = sweepX;
    crowdU.uJump.value = lerp(crowdU.uJump.value, jump, Math.min(1, dt * 3)); crowdU.uArms.value = lerp(crowdU.uArms.value, armsF, Math.min(1, dt * 2));
    flashV *= Math.exp(-dt * 4); crowdU.uFlash.value = flashV * 0.5 + strobe * 0.6;
    phU.uOn.value = lerp(phU.uOn.value, phOn, Math.min(1, dt * 2)); phU.uTorch.value = lerp(phU.uTorch.value, torch, Math.min(1, dt * 1.5));
    stU.uOn.value = lerp(stU.uOn.value, stOn, Math.min(1, dt * 2)); stU.uTorch.value = phU.uTorch.value;
    keyL.color.copy(keyCol); keyL.intensity = 1.2 + bright * 2.2; flashL.intensity = flashV * 4;
    smokeU.uCol.value.copy(keyCol).multiplyScalar(0.35).add(fill); smokeU.uI.value = 0.55 + 0.3 * kick * E;
    ringU.uCol.value.copy(ringC); ringU.uI.value = ringI * 1.5; ringU.uDash.value = ringDash; ringU.uSpin.value = ringSpin;
    /* focos */
    for (var bj = 0; bj < BULBS.length; bj++){
      var v = 0, row = bj < 26 ? Math.floor(bj / 2) : 13 + (bj - 26);
      if (bulbMode === 'breath') v = 0.35 + 0.25 * Math.sin(now * 1.4 + row * 0.4);
      else if (bulbMode === 'chase') v = ((row + bi) % 4 === 0) ? 2.8 : 0.2;
      else if (bulbMode === 'alt') v = ((row + bi) % 2) ? 2.4 * kick + 0.2 : 0.15;
      else if (bulbMode === 'all') v = 0.6 + 2.6 * kick;
      bulbs.setColorAt(bj, TC.setRGB(v * 1.0, v * 0.86, v * 0.66));
    }
    bulbs.instanceColor.needsUpdate = true;
    nosing.forEach(function(ns, i){ ns.material.color.setRGB(1, 1, 1).multiplyScalar(c === 'turn' ? 0.3 : 0.4 + 1.8 * (((i + bi) % 4 === 0) ? kick : 0)); if (c === 'turn') ns.material.color.setRGB(0.9 * kick, 0.05, 0.03); });
    /* texto que corre */
    towers.forEach(function(tw){ tw.front.userData.U.uScroll.value.y -= dt * gridSpd; tw.side.userData.U.uScroll.value.y += dt * gridSpd * 1.4; });
    blades.forEach(function(b){ b.userData.U.uScroll.value.y -= dt * gridSpd * 1.2; });
    if (center.userData.U.uTxt.value === gridTx.t) center.userData.U.uScroll.value.y -= dt * gridSpd;
    tick.userData.U.uScroll.value.x += dt * tickSpd; ribbons.forEach(function(rb, i){ rb.userData.U.uScroll.value.x += dt * tickSpd * (i ? -0.6 : 0.8); rb.userData.U.uBright.value = c === 'turn' ? 0.25 : 0.75; rb.userData.U.uBgA.value.copy(dim); rb.userData.U.uBgB.value.copy(dim); });
    tick.userData.U.uBright.value = c === 'turn' ? 0.35 : 0.9;
    relic.rotation.y += dt * relicSpin; relic.position.y = 30.2 + Math.sin(now * 0.8) * 0.2;
    glitch *= Math.exp(-dt * 5.5);
    FIN.uniforms.uStrobe.value = strobe; FIN.uniforms.uStrobeC.value.copy(c === 'turn' ? C.rojo : C.white);
  }

  function size(w, h){
    VW = Math.max(2, w | 0); VH = Math.max(2, h | 0);
    R.setSize(VW, VH, false); cam.aspect = VW / VH; cam.updateProjectionMatrix();
    if (comp){ comp.setPixelRatio(DPR); comp.setSize(VW, VH); }
    FIN.uniforms.uRes.value.set(VW * DPR, VH * DPR);
  }

  function frame(t, dt){
    if (!alive) return;
    dt = Math.min(0.05, dt || 0.016); dtLast = dt; now += dt; G.uTime.value = now;
    var ck = o.clock ? o.clock() : null; music = !!(ck && ck.on);
    var mt = music ? ck.t : now;
    beat = (mt - OFF) * BPM / 60; G.uBeat.value = beat;
    if (music){ var si = Math.floor(mt); energy = 0.35 + 0.65 * (+(EN_CURVE.charAt(Math.min(EN_CURVE.length - 1, Math.max(0, si)))) / 9); }
    progS += (prog - progS) * Math.min(1, dt * 3.5);
    var ci = Math.min(5, Math.floor(prog * 6 + 1e-4)); setCue(ci);
    direct(dt);
    stepPyro(dt, now);
    cfU.uT.value = now - cfT0; if (cfU.uT.value > 22) cfU.uT.value = -1;
    /* cámara */
    shot(progS);
    var portrait = cam.aspect < 1, pull = portrait ? 1 + (1 - cam.aspect) * 0.95 : 1;
    if (!dragging){ yawT *= Math.pow(0.25, dt); pitchT *= Math.pow(0.25, dt); }
    yaw += (yawT + mx * 0.05 - yaw) * Math.min(1, dt * 5); pitch += (pitchT + my * 0.03 - pitch) * Math.min(1, dt * 5);
    tmp.copy(camT).sub(camP); var dist = tmp.length() * pull; tmp.normalize();
    tmp.applyAxisAngle(UP, -yaw); tmp2.crossVectors(tmp, UP).normalize(); tmp.applyAxisAngle(tmp2, -pitch);
    var hh = reduce ? 0 : 1;
    cam.position.copy(camT).addScaledVector(tmp, -dist);
    if (pull > 1) cam.position.y = lerp(camP.y, cam.position.y, 0.5);
    cam.position.x += Math.sin(now * 0.7) * 0.12 * hh; cam.position.y += Math.sin(now * 0.93 + 1) * 0.08 * hh;
    cam.lookAt(tmp2.copy(cam.position).addScaledVector(tmp, dist));
    var fov = camF * (portrait ? 1 + (1 - cam.aspect) * 0.25 : 1);
    if (Math.abs(cam.fov - fov) > 0.01){ cam.fov = fov; cam.updateProjectionMatrix(); }
    G.uPx.value = VH * DPR / (2 * Math.tan(cam.fov * Math.PI / 360));
    FIN.uniforms.uTime.value = now;
    if (!comp && T.EffectComposer) setupComposer();
    if (comp) comp.render(); else R.render(scene, cam);
  }

  /* cuando la pestaña no se ve, los videos descansan */
  function sleep(){ alive = false; Object.keys(vids).forEach(function(k){ try{ vids[k].v.pause(); }catch(e){} }); }
  function wake(){ if (alive) return; alive = true; if (curVid) playVid(curVid); }
  o.canvas.addEventListener('webglcontextlost', function(e){ e.preventDefault(); alive = false; });

  return {
    frame: frame, size: size, sleep: sleep, wake: wake,
    setProgress: function(p){ prog = clamp(p, 0, 1); },
    look: function(dx, dy){ dragging = true; yawT = clamp(yawT + dx * 1.6, -0.9, 0.9); pitchT = clamp(pitchT + dy * 0.9, -0.35, 0.35); },
    release: function(){ dragging = false; },
    pointer: function(x, y){ mx = x; my = y; },
    setLang: function(l){ lang = l === 'es' ? 'es' : 'en'; drawAll(); },
    info: function(){ return {cue: cue, bar: Math.max(0, Math.floor(beat / 4)) + 1, beat: beat, bpm: BPM, music: music}; },
    prime: function(k){ if (VID[k]) getVid(k); }
  };
}
window.DMStage = DMStage;
})();
