'use strict';
// =====================================================================
//  KATMAN ZİNDANI — Oyun
// =====================================================================
const T = 16, CS = 14, CN = 5, MW = CS * CN, MH = CS * CN;
let cvs, ui, ctx, W = 1, H = 1, UD = 1, FSZ = 2, MINS = 100;
let map, blocked, roomAt, seen, flow;
let rooms = [], chunks = [], sLights = [], flames = [], decor = [];
let enemies = [], projs = [], parts = [], pickups = [], props = [], texts = [], inter = [], bars = [], hazards = [], ghosts = [], waves = [];
let P = null;
const G = { state: 'title', floor: 1, biome: 0, t: 0, run: 0, hitstop: 0, modal: null, banner: null, fade: 1, fadeTo: 0, fadeCb: null, kills: 0, gold: 0, boss: null, cur: null, deadT: 0, hurtV: 0, flash: 0, best: 0, slow: 1, msg: null, interact: null };
const CAM = { x: 0, y: 0, z: 0, yaw: Math.PI / 2, pitch: 0.96, dist: 200, shake: 0, sway: 0 };
const BUF = {};
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };

// ---------------------------------------------------------------------
//  Veri tabloları
// ---------------------------------------------------------------------
const WEAPONS = {
  sword: { n: 'Şövalye Kılıcı', d: 'Dengeli ve hızlı savruluş.', m: 'w_sword', type: 'melee', dmg: 14, cd: 0.34, range: 32, arc: 2.5, kb: 110 },
  axe: { n: 'Savaş Baltası', d: 'Yavaş ama yıkıcı, geniş yay.', m: 'w_axe', type: 'melee', dmg: 27, cd: 0.66, range: 36, arc: 3.8, kb: 200 },
  spear: { n: 'Ejder Mızrağı', d: 'Uzun menzilli delici saplama.', m: 'w_spear', type: 'thrust', dmg: 18, cd: 0.4, range: 54, arc: 0.6, kb: 130 },
  staff: { n: 'Ateş Asası', d: 'Patlayan ateş topları fırlatır.', m: 'w_staff', type: 'proj', dmg: 12, cd: 0.32, speed: 240, kind: 'fire', kb: 50 },
  xbow: { n: 'Buz Arbaleti', d: 'Düşmanları delip geçen oklar.', m: 'w_xbow', type: 'proj', dmg: 17, cd: 0.48, speed: 420, kind: 'bolt', pierce: 3, kb: 70 }
};
const UPG = [
  { id: 'dmg', n: 'Bilenmiş Çelik', d: '+%20 hasar', r: 0, f: p => p.st.dmg += 0.2 },
  { id: 'atk', n: 'Çevik Eller', d: '+%18 saldırı hızı', r: 0, f: p => p.st.atk += 0.18 },
  { id: 'hp', n: 'Demir Yürek', d: '+25 maks. can ve tam iyileşme', r: 0, f: p => { p.maxHp += 25; p.hp = p.maxHp; } },
  { id: 'move', n: 'Rüzgar Botları', d: '+%15 hareket hızı', r: 0, f: p => p.st.move += 0.15 },
  { id: 'gold', n: 'Altın Mıknatıs', d: '+%50 altın ve geniş toplama alanı', r: 0, f: p => p.st.gold += 0.5 },
  { id: 'nova', n: 'Nova Ustası', d: 'Özel güç %40 daha hızlı dolar', r: 0, f: p => p.st.nova += 0.4 },
  { id: 'crit', n: 'Kartal Gözü', d: '+%12 kritik vuruş (2x hasar)', r: 1, f: p => p.st.crit += 0.12 },
  { id: 'vamp', n: 'Vampir Dişi', d: 'Her öldürme 3 can verir', r: 1, f: p => p.st.vamp += 3 },
  { id: 'burn', n: 'Kor Ruhu', d: 'Vuruşlar düşmanları yakar', r: 1, f: p => p.st.burn += 1 },
  { id: 'thorn', n: 'Dikenli Zırh', d: 'Hasar alınca çevreye 30 hasar', r: 1, f: p => p.st.thorn += 30 },
  { id: 'shield', n: 'Kutsal Kalkan', d: 'Her odada 1 vuruşu engeller', r: 1, f: p => { p.st.shield++; p.shield = p.st.shield; } },
  { id: 'rage', n: 'Kan Öfkesi', d: 'Can %40 altındayken +%50 hasar', r: 1, f: p => p.st.rage += 0.5 },
  { id: 'area', n: 'Dev Silah', d: '+%25 menzil ve etki alanı', r: 1, f: p => p.st.area += 0.25 },
  { id: 'dash', n: 'Gölge Atılımı', d: 'Atılım 30 hasar verir, -%25 bekleme', r: 1, f: p => { p.st.dashDmg += 30; p.st.dashCd *= 0.75; } },
  { id: 'orbit', n: 'Dönen Ruh Kılıcı', d: 'Etrafında dönen bir kılıç kazan', r: 2, f: p => p.st.orbit++ },
  { id: 'chain', n: 'Fırtına Mührü', d: '%25 şansla zincir şimşek', r: 2, f: p => p.st.chain += 0.25 },
  { id: 'soul', n: 'Ruh Okları', d: 'Her 4. saldırıda 3 güdümlü ok', r: 2, f: p => p.st.soul++ },
  { id: 'boom', n: 'Patlayan Cesetler', d: 'Ölen düşmanlar patlar', r: 2, f: p => p.st.boom++ }
];
const RARC = [0xe8e8f0, 0x4aa8ff, 0xc060ff, 0xffc030], RARN = ['SIRADAN', 'NADİR', 'EPİK', 'SİLAH'];
const ET = {
  slime: { n: 'Balçık', hp: 30, r: 7, dmg: 10, spd: 0, mass: 1, gold: 2 },
  slimeS: { n: 'Küçük Balçık', hp: 12, r: 5, dmg: 6, spd: 0, mass: 0.6, gold: 1 },
  bat: { n: 'Yarasa', hp: 14, r: 5, dmg: 7, spd: 88, mass: 0.5, gold: 1, fly: true },
  skel: { n: 'İskelet', hp: 42, r: 6, dmg: 12, spd: 44, mass: 1, gold: 2 },
  archer: { n: 'Okçu', hp: 30, r: 6, dmg: 10, spd: 40, mass: 1, gold: 2 },
  mage: { n: 'Tarikatçı', hp: 36, r: 6, dmg: 10, spd: 30, mass: 1, gold: 3 },
  orc: { n: 'Ork Vahşi', hp: 120, r: 9, dmg: 20, spd: 34, mass: 3, gold: 5 },
  golem: { n: 'TAŞ DEV', hp: 1100, r: 20, dmg: 24, spd: 26, mass: 30, gold: 40, boss: true },
  lich: { n: 'LİÇ KRAL', hp: 1000, r: 12, dmg: 18, spd: 40, mass: 30, gold: 40, boss: true, fly: true }
};

// ---------------------------------------------------------------------
//  Başlatma / boyut
// ---------------------------------------------------------------------
function boot() {
  cvs = document.getElementById('gl'); ui = document.getElementById('ui'); ctx = ui.getContext('2d');
  try { initGL(cvs); } catch (e) { document.body.innerHTML = '<div style="color:#fff;font:20px monospace;padding:30px">WebGL başlatılamadı: ' + e.message + '</div>'; return; }
  BUF.op = new QuadBuf(16384); BUF.bl = new QuadBuf(4000); BUF.ad = new QuadBuf(6000);
  flow = new Int16Array(MW * MH);
  G.best = store.get('kz_best', 0);
  SFX.on = store.get('kz_sfx', true); SFX.musicOn = store.get('kz_mus', true);
  resize(); addEventListener('resize', resize);
  setupInput();
  newRun(true);
  G.state = 'title';
  window.onAndroidBack = () => { if (G.state === 'play' && !G.modal) G.state = 'pause'; else if (G.state === 'pause') G.state = 'play'; };
  window.onAndroidPause = () => { if (G.state === 'play') G.state = 'pause'; if (SFX.ctx) SFX.ctx.suspend(); };
  window.onAndroidResume = () => { if (SFX.ctx) SFX.ctx.resume(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) window.onAndroidPause(); else window.onAndroidResume(); });
  let last = performance.now();
  const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3), cw = innerWidth, ch = innerHeight;
  const pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
  const k = Math.max(1, ph / 500) / (G.q || 1);
  cvs.width = Math.round(pw / k); cvs.height = Math.round(ph / k); cvs.style.width = cw + 'px'; cvs.style.height = ch + 'px';
  UD = Math.min(dpr, 2); ui.width = Math.round(cw * UD); ui.height = Math.round(ch * UD); ui.style.width = cw + 'px'; ui.style.height = ch + 'px';
  W = ui.width; H = ui.height; MINS = Math.min(W, H); FSZ = Math.max(1, Math.round(MINS / 190));
  layoutButtons();
}
const BTN = {};
function layoutButtons() {
  const r = MINS * 0.115;
  BTN.atk = { x: W - r * 1.55, y: H - r * 1.55, r };
  BTN.dash = { x: BTN.atk.x - r * 2.15, y: BTN.atk.y + r * 0.45, r: r * 0.66 };
  BTN.spec = { x: BTN.atk.x - r * 0.25, y: BTN.atk.y - r * 2.1, r: r * 0.66 };
  BTN.pause = { x: W - MINS * 0.34, y: MINS * 0.07, r: MINS * 0.045 };
}

// ---------------------------------------------------------------------
//  Giriş (dokunmatik, fare, klavye)
// ---------------------------------------------------------------------
const IN = { jx: 0, jy: 0, joy: null, atk: null, atkK: false, dash: false, spec: false, keys: {}, mouseDown: false, taps: [] };
function setupInput() {
  const pos = (e) => [e.clientX * UD, e.clientY * UD];
  const start = (id, x, y) => {
    SFX.init();
    if (G.state !== 'play' || G.modal) { IN.taps.push([x, y]); return; }
    const hit = b => Math.hypot(x - b.x, y - b.y) < b.r * 1.25;
    if (hit(BTN.pause)) { G.state = 'pause'; SFX.play('click'); return; }
    if (hit(BTN.atk)) { IN.atk = id; return; }
    if (hit(BTN.dash)) { IN.dash = true; return; }
    if (hit(BTN.spec)) { IN.spec = true; return; }
    if (x < W * 0.55 && !IN.joy) { IN.joy = { id, bx: x, by: y, x, y }; return; }
    if (x >= W * 0.55 && IN.atk == null) IN.atk = id;
  };
  const move = (id, x, y) => { if (IN.joy && IN.joy.id === id) { IN.joy.x = x; IN.joy.y = y; } };
  const end = (id) => { if (IN.joy && IN.joy.id === id) IN.joy = null; if (IN.atk === id) IN.atk = null; };
  ui.addEventListener('touchstart', e => { e.preventDefault(); for (const t of e.changedTouches) { const [x, y] = pos(t); start(t.identifier, x, y); } }, { passive: false });
  ui.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) { const [x, y] = pos(t); move(t.identifier, x, y); } }, { passive: false });
  const te = e => { e.preventDefault(); for (const t of e.changedTouches) end(t.identifier); };
  ui.addEventListener('touchend', te, { passive: false }); ui.addEventListener('touchcancel', te, { passive: false });
  ui.addEventListener('mousedown', e => { const [x, y] = pos(e); start('m', x, y); });
  addEventListener('mousemove', e => { const [x, y] = pos(e); move('m', x, y); });
  addEventListener('mouseup', () => end('m'));
  addEventListener('keydown', e => {
    SFX.init(); const k = e.key.toLowerCase(); IN.keys[k] = true;
    if (k === 'k' || k === 'shift') IN.dash = true; if (k === 'l' || k === 'q') IN.spec = true;
    if (k === 'escape' || k === 'p') { if (G.state === 'play' && !G.modal) G.state = 'pause'; else if (G.state === 'pause') G.state = 'play'; }
    if ((k === 'enter' || k === ' ') && G.state !== 'play') IN.taps.push([-1, -1, 'enter']);
    if (G.modal && G.modal.type === 'choice' && ['1', '2', '3'].includes(k)) IN.taps.push([-1, -1, 'c' + k]);
  });
  addEventListener('keyup', e => { IN.keys[e.key.toLowerCase()] = false; });
  ui.addEventListener('contextmenu', e => e.preventDefault());
}
function readMove() {
  let x = 0, y = 0;
  if (IN.joy) { const j = IN.joy, R = MINS * 0.11; let dx = j.x - j.bx, dy = j.y - j.by; const d = Math.hypot(dx, dy); if (d > R) { j.bx = j.x - dx / d * R; j.by = j.y - dy / d * R; dx = j.x - j.bx; dy = j.y - j.by; } x = dx / R; y = dy / R; if (Math.hypot(x, y) < 0.15) x = y = 0; }
  const K = IN.keys; if (K.a || K.arrowleft) x -= 1; if (K.d || K.arrowright) x += 1; if (K.w || K.arrowup) y -= 1; if (K.s || K.arrowdown) y += 1;
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
  // ekran -> dünya (kamera sabit; ileri = +y)
  const fx = Math.cos(CAM.yaw), fy = Math.sin(CAM.yaw), rx = Math.sin(CAM.yaw), ry = -Math.cos(CAM.yaw);
  return [rx * x - fx * y, ry * x - fy * y, Math.min(1, m)];
}

// ---------------------------------------------------------------------
//  Kat üretimi
// ---------------------------------------------------------------------
const idx = (x, y) => y * MW + x;
function walk(tx, ty) { if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return false; const i = ty * MW + tx; return map[i] === 1 && !blocked[i]; }
function genFloor(n) {
  const boss = n % 3 === 0;
  map = new Uint8Array(MW * MH); blocked = new Uint8Array(MW * MH); roomAt = new Int16Array(MW * MH).fill(-1); seen = new Uint8Array(MW * MH);
  rooms = []; decor = []; sLights = []; flames = []; enemies = []; projs = []; parts = []; pickups = []; props = []; texts = []; inter = []; bars = []; hazards = []; ghosts = []; waves = [];
  G.boss = null; G.cur = null;
  const grid = Array.from({ length: CN }, () => new Array(CN).fill(-1));
  const add = (gx, gy, from) => { const r = { gx, gy, links: [], i: rooms.length, type: 'combat', state: 'cleared', doors: [], explored: false }; rooms.push(r); grid[gy][gx] = r.i; if (from) { from.links.push(r); r.links.push(from); } return r; };
  const free = (gx, gy) => gx >= 0 && gy >= 0 && gx < CN && gy < CN && grid[gy][gx] < 0;
  const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const start = add(irnd(1, 3), 0);
  if (boss) {
    let cur = start;
    for (let k = 0; k < 3; k++) { const opts = D4.filter(([dx, dy]) => free(cur.gx + dx, cur.gy + dy)).sort((a, b) => b[1] - a[1] + rnd(-0.6, 0.6)); if (!opts.length) break; cur = add(cur.gx + opts[0][0], cur.gy + opts[0][1], cur); }
    const opts = D4.filter(([dx, dy]) => free(cur.gx + dx, cur.gy + dy)).sort((a, b) => b[1] - a[1]);
    const br = opts.length ? add(cur.gx + opts[0][0], cur.gy + opts[0][1], cur) : cur; br.type = 'boss';
    // yan oda (hazine)
    for (const r of rooms.slice(1, -1)) { const o = D4.filter(([dx, dy]) => free(r.gx + dx, r.gy + dy)); if (o.length) { const [dx, dy] = pick(o); add(r.gx + dx, r.gy + dy, r).type = 'treasure'; break; } }
  } else {
    const target = Math.min(6 + n, 11); let guard = 0;
    while (rooms.length < target && guard++ < 500) { const r = rooms[Math.random() < 0.5 ? rooms.length - 1 : irnd(0, rooms.length - 1)]; const o = D4.filter(([dx, dy]) => free(r.gx + dx, r.gy + dy)); if (!o.length) continue; const [dx, dy] = pick(o); add(r.gx + dx, r.gy + dy, r); }
    for (const r of rooms) for (const [dx, dy] of D4) { const gx = r.gx + dx, gy = r.gy + dy; if (gx < 0 || gy < 0 || gx >= CN || gy >= CN) continue; const o = grid[gy][gx]; if (o >= 0 && o > r.i && !r.links.includes(rooms[o]) && Math.random() < 0.2) { r.links.push(rooms[o]); rooms[o].links.push(r); } }
    const dist = new Map([[start, 0]]); const q = [start]; while (q.length) { const r = q.shift(); for (const l of r.links) if (!dist.has(l)) { dist.set(l, dist.get(r) + 1); q.push(l); } }
    let far = start; for (const r of rooms) if (dist.get(r) > dist.get(far)) far = r; far.type = 'stairs';
    const leaves = rooms.filter(r => r !== start && r !== far && r.links.length === 1).sort(() => Math.random() - 0.5);
    if (leaves[0]) leaves[0].type = 'treasure';
    if (leaves[1] && (n % 3 === 2 || Math.random() < 0.35)) leaves[1].type = 'shop';
  }
  start.type = 'start';
  for (const r of rooms) {
    const big = r.type === 'boss'; const w = big ? 12 : r.type === 'start' ? 7 : irnd(7, 11), h = big ? 12 : r.type === 'start' ? 7 : irnd(7, 11);
    const x0 = r.gx * CS + 1, x1 = r.gx * CS + CS - 1 - w, y0 = r.gy * CS + 1, y1 = r.gy * CS + CS - 1 - h;
    r.w = w; r.h = h; r.x = clamp(Math.round((x0 + x1) / 2) + irnd(-1, 1), x0, Math.max(x0, x1)); r.y = clamp(Math.round((y0 + y1) / 2) + irnd(-1, 1), y0, Math.max(y0, y1));
    r.cx = (r.x + r.w / 2) * T; r.cy = (r.y + r.h / 2) * T;
    for (let y = r.y; y < r.y + h; y++) for (let x = r.x; x < r.x + w; x++) { map[idx(x, y)] = 1; roomAt[idx(x, y)] = r.i; }
  }
  for (const a of rooms) for (const b of a.links) {
    if (a.i > b.i) continue;
    if (a.gy === b.gy) { const L = a.gx < b.gx ? a : b, R = L === a ? b : a; const lo = Math.max(L.y, R.y) + 1, hi = Math.min(L.y + L.h, R.y + R.h) - 2; const row = Math.floor((lo + hi) / 2); for (let x = L.x + L.w; x < R.x; x++) for (let d = -1; d <= 1; d++) map[idx(x, row + d)] = 1; }
    else { const L = a.gy < b.gy ? a : b, R = L === a ? b : a; const lo = Math.max(L.x, R.x) + 1, hi = Math.min(L.x + L.w, R.x + R.w) - 2; const col = Math.floor((lo + hi) / 2); for (let y = L.y + L.h; y < R.y; y++) for (let d = -1; d <= 1; d++) map[idx(col + d, y)] = 1; }
  }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (map[idx(x, y)] !== 0) continue; let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < MW && yy < MH && (map[idx(xx, yy)] === 1)) { near = true; break; } }
    if (near) map[idx(x, y)] = 2;
  }
  for (const r of rooms) {
    for (let x = r.x - 1; x <= r.x + r.w; x++) for (const y of [r.y - 1, r.y + r.h]) if (map[idx(x, y)] === 1 && roomAt[idx(x, y)] < 0) r.doors.push({ x, y, v: false });
    for (let y = r.y; y < r.y + r.h; y++) for (const x of [r.x - 1, r.x + r.w]) if (map[idx(x, y)] === 1 && roomAt[idx(x, y)] < 0) r.doors.push({ x, y, v: true });
  }
  populate(n);
  return start;
}
function freeTile(r, margin = 1, avoidC = 0) {
  for (let k = 0; k < 60; k++) {
    const x = irnd(r.x + margin, r.x + r.w - 1 - margin), y = irnd(r.y + margin, r.y + r.h - 1 - margin);
    if (map[idx(x, y)] !== 1) continue; const px = x * T + 8, py = y * T + 8;
    if (avoidC && Math.hypot(px - r.cx, py - r.cy) < avoidC) continue;
    if (props.some(p => Math.hypot(p.x - px, p.y - py) < 14) || decor.some(d => d.solid && Math.hypot(d.x - px, d.y - py) < 14)) continue;
    return [px, py];
  }
  return null;
}
function populate(n) {
  const B = BIOMES[G.biome];
  for (const r of rooms) {
    const isFight = ['combat', 'stairs', 'boss'].includes(r.type);
    if (isFight) { r.state = 'idle'; r.wave = 0; r.waves = r.type === 'boss' ? 1 : (r.w * r.h > 70 ? 2 : 1) + (n >= 4 && Math.random() < 0.5 ? 1 : 0); r.reward = r.type === 'combat' ? (Math.random() < 0.5 ? 'chest' : Math.random() < 0.55 ? 'gold' : 'heal') : null; }
    // sütunlar
    if ((r.type === 'combat' || r.type === 'boss') && r.w >= 9 && r.h >= 9 && Math.random() < 0.65) {
      const o = r.type === 'boss' ? 2 : 2; for (const [x, y] of [[r.x + o, r.y + o], [r.x + r.w - 1 - o, r.y + o], [r.x + o, r.y + r.h - 1 - o], [r.x + r.w - 1 - o, r.y + r.h - 1 - o]]) map[idx(x, y)] = 3;
    }
    // duvar meşaleleri (kameraya bakan uzak duvar + yan duvarlar)
    const topY = r.y + r.h; const tx1 = [r.x + 1, r.x + r.w - 2, r.x + (r.w >> 1)];
    for (const tx of tx1) if (map[idx(tx, topY)] === 2 && Math.random() < 0.85) addTorch(tx * T + 8, topY * T + 1, 12);
    for (const sx of [r.x - 1, r.x + r.w]) { const ty = r.y + 1 + irnd(0, r.h - 3); if (map[idx(sx, ty)] === 2 && Math.random() < 0.5) addTorch(sx === r.x - 1 ? sx * T + 15 : sx * T + 1, ty * T + 8, 12); }
    // pankartlar
    if (Math.random() < 0.6) { const tx = r.x + irnd(2, r.w - 3); if (map[idx(tx, topY)] === 2) decor.push({ m: 'banner', x: tx * T + 8, y: topY * T + 0.5, z: 3, a: Math.PI / 2 }); }
    // dekor
    const nd = Math.floor(r.w * r.h / 9);
    for (let i = 0; i < nd; i++) {
      const p = freeTile(r, 0, r.type === 'start' ? 30 : 0); if (!p) continue;
      const k = Math.random(); const a = rnd(TAU), jx = rnd(-4, 4), jy = rnd(-4, 4);
      if (k < 0.25) decor.push({ m: 'bones', x: p[0] + jx, y: p[1] + jy, a });
      else if (k < 0.38) decor.push({ m: 'skull', x: p[0] + jx, y: p[1] + jy, a });
      else if (k < 0.55) decor.push({ m: 'rubble', x: p[0] + jx, y: p[1] + jy, a });
      else if (k < 0.72) decor.push({ m: 'grass', x: p[0] + jx, y: p[1] + jy, a });
      else if (k < 0.84) { decor.push({ m: 'mush', x: p[0] + jx, y: p[1] + jy, a }); sLights.push({ x: p[0], y: p[1], z: 6, r: 40, c: c3(B.mush).map(v => v * 0.6) }); }
      else if (k < 0.92) { decor.push({ m: 'crystal', x: p[0] + jx, y: p[1] + jy, a, solid: true }); sLights.push({ x: p[0], y: p[1], z: 10, r: 70, c: c3(B.crys).map(v => v * 0.9) }); }
    }
    // kırılabilir sandık / fıçı
    if (r.type !== 'start') {
      const np = irnd(1, 4); for (let i = 0; i < np; i++) {
        const cx = Math.random() < 0.5 ? r.x : r.x + r.w - 1, cy = Math.random() < 0.5 ? r.y : r.y + r.h - 1;
        for (let k = 0; k < irnd(1, 3); k++) { const x = (cx + (cx === r.x ? k % 2 : -(k % 2))) * T + 8 + rnd(-2, 2), y = (cy + (cy === r.y ? (k >> 1) : -(k >> 1))) * T + 8 + rnd(-2, 2); if (map[idx(Math.floor(x / T), Math.floor(y / T))] !== 1) continue; props.push({ kind: Math.random() < 0.5 ? 'barrel' : 'crate', x, y, a: rnd(TAU), hp: 20, r: 6, solid: true, flash: 0 }); }
      }
    }
    // mangal
    if (r.w * r.h >= 72 && r.type !== 'shop') for (const [x, y] of [[r.x + 1, r.y + r.h - 2], [r.x + r.w - 2, r.y + r.h - 2]]) if (map[idx(x, y)] === 1 && Math.random() < 0.6) { const px = x * T + 8, py = y * T + 8; decor.push({ m: 'brazier', x: px, y: py, a: 0, solid: true }); flames.push({ x: px, y: py, z: 9, s: 1.1 }); sLights.push({ x: px, y: py, z: 18, r: 120, c: B.torch, fl: 1 }); }
    // oda tipine göre
    if (r.type === 'treasure') { inter.push({ kind: 'chest', x: r.cx, y: r.cy, big: false, open: false, loot: Math.random() < 0.5 ? 'weapon' : 'relic', bob: 0 }); }
    if (r.type === 'shop') {
      inter.push({ kind: 'merchant', x: r.cx, y: r.cy + 26, a: -Math.PI / 2 });
      const items = [{ t: 'potion', price: 15 + n * 2 }, { t: 'relic', u: rollUpg(1), price: 35 + n * 5 }, Math.random() < 0.5 ? { t: 'weapon', w: rollWeapon(), price: 45 + n * 5 } : { t: 'relic', u: rollUpg(0), price: 25 + n * 4 }];
      items.forEach((it, i) => { inter.push({ kind: 'shop', x: r.cx + (i - 1) * 30, y: r.cy - 6, it, sold: false }); decor.push({ m: 'pedestal', x: r.cx + (i - 1) * 30, y: r.cy - 6, a: 0, solid: true }); });
    }
  }
}
function addTorch(x, y, z) { decor.push({ m: 'sconce', x, y, z: z - 5, a: 0 }); flames.push({ x, y, z, s: 0.8 }); sLights.push({ x, y, z: z + 6, r: 125, c: BIOMES[G.biome].torch, fl: 1 }); }

// statik geometri (zemin, duvar, dekor) -> parça VBO'ları
function buildStatic() {
  const gl = R3.gl; for (const c of chunks) gl.deleteBuffer(c.vbo); chunks = [];
  const tmp = { d: new Float32Array(16384 * 4 * FL), n: 0, max: 16384, _i: 0 }; const CH = 7;
  for (let cy = 0; cy < MH / CH; cy++) for (let cx = 0; cx < MW / CH; cx++) {
    tmp.n = 0;
    for (let ty = cy * CH; ty < cy * CH + CH; ty++) for (let tx = cx * CH; tx < cx * CH + CH; tx++) {
      const t = map[idx(tx, ty)], px = tx * T + 8, py = ty * T + 8, h = hash2(tx, ty, G.floor);
      if (t === 1 || t === 3) { const fv = h < 0.5 ? 0 : h < 0.62 ? 1 : h < 0.74 ? 2 : h < 0.84 ? 3 : h < 0.9 ? 4 : 5; pushModel(tmp, MD.floor[fv], px, py, -0.6, Math.floor(hash2(tx, ty, 5) * 4) * Math.PI / 2, 1, { vc: floorAO }); }
      if (t === 2) { const wv = h < 0.66 ? 0 : h < 0.8 ? 1 : h < 0.92 ? 2 : 3; pushModel(tmp, MD.wall[wv], px, py, 0, Math.floor(hash2(tx, ty, 9) * 4) * Math.PI / 2, 1, { o: 1 }); }
      if (t === 3) pushModel(tmp, MD.pillar, px, py, 0, hash2(tx, ty, 2) * 0.5, 1.2, { o: 1 });
    }
    for (const d of decor) { if (Math.floor(d.x / T / CH) !== cx || Math.floor(d.y / T / CH) !== cy) continue; pushModel(tmp, MD[d.m], d.x, d.y, d.z || 0, d.a, d.s || 1); }
    if (!tmp.n) continue;
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, tmp.d.subarray(0, tmp.n * 4 * FL), gl.STATIC_DRAW);
    chunks.push({ vbo, n: tmp.n, x: (cx + 0.5) * CH * T, y: (cy + 0.5) * CH * T });
  }
}
function solidT(tx, ty) { if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return 1; const t = map[idx(tx, ty)]; return t === 0 || t === 2 ? 1 : t === 3 ? 0.7 : 0; }
function floorAO(wx, wy) { // köşe AO: köşeye değen 4 karonun dolu olanları
  const cx = Math.round(wx / T), cy = Math.round(wy / T);
  const s = solidT(cx - 1, cy - 1) + solidT(cx, cy - 1) + solidT(cx - 1, cy) + solidT(cx, cy);
  return [1, 0.72, 0.5, 0.4, 0.35][Math.min(4, Math.ceil(s))];
}
function drawChunk(c) { const gl = R3.gl, a = R3.a, S = FL * 4; gl.bindBuffer(gl.ARRAY_BUFFER, c.vbo); gl.vertexAttribPointer(a.P, 3, gl.FLOAT, false, S, 0); gl.vertexAttribPointer(a.T, 2, gl.FLOAT, false, S, 12); gl.vertexAttribPointer(a.C, 4, gl.FLOAT, false, S, 20); gl.vertexAttribPointer(a.F, 3, gl.FLOAT, false, S, 36); gl.vertexAttribPointer(a.R, 1, gl.FLOAT, false, S, 48); gl.drawElements(gl.TRIANGLES, c.n * 6, gl.UNSIGNED_SHORT, 0); }

// ---------------------------------------------------------------------
//  Koşu / kat yönetimi
// ---------------------------------------------------------------------
function newPlayer() {
  return { x: 0, y: 0, z: 0, vx: 0, vy: 0, ang: Math.PI / 2, r: 5, hp: 100, maxHp: 100, inv: 0, dashT: 0, dashCd: 0, dx: 0, dy: 0, atkCd: 0, swing: null, special: 0, weapon: 'sword', anim: 0, moving: false, shield: 0, atkN: 0, flip: 1, hurtT: 0, dead: false, orbA: 0, relics: {},
    st: { dmg: 1, atk: 1, move: 1, crit: 0.05, vamp: 0, burn: 0, chain: 0, thorn: 0, gold: 1, shield: 0, rage: 0, nova: 1, boom: 0, area: 1, dashDmg: 0, dashCd: 0.85, orbit: 0, soul: 0 } };
}
function newRun(title) {
  P = newPlayer(); G.floor = 1; G.kills = 0; G.gold = 0; G.run = 0; G.modal = null; G.deadT = 0; G.hurtV = 0;
  enterFloor(1, title);
}
function enterFloor(n, quiet) {
  G.floor = n; G.biome = Math.floor((n - 1) / 3) % 3;
  buildAllModels(G.biome);
  const s = genFloor(n); buildStatic();
  P.x = s.cx; P.y = s.cy; P.vx = P.vy = 0; P.dashT = 0; P.swing = null; P.shield = P.st.shield;
  s.explored = true; reveal(s);
  CAM.x = P.x; CAM.y = P.y;
  if (!quiet) { G.banner = { t: 0, a: 'KAT ' + n, b: BIOMES[G.biome].name + (n % 3 === 0 ? ' — Boss katı!' : '') }; }
  if (n === 1 && !quiet) G.msg = { t: 0, s: 'Sol: hareket · Sağ: saldırı · Atılım ile kaç!' };
}
function nextFloor() { SFX.play('portal'); fadeOut(() => { enterFloor(G.floor + 1); if (G.floor > G.best) { G.best = G.floor; store.set('kz_best', G.best); } }); }
function fadeOut(cb) { G.fadeTo = 1; G.fadeCb = cb; }
function reveal(r) { for (let y = r.y - 1; y <= r.y + r.h; y++) for (let x = r.x - 1; x <= r.x + r.w; x++) if (x >= 0 && y >= 0 && x < MW && y < MH) seen[idx(x, y)] = 1; }

// ---------------------------------------------------------------------
//  Ana döngü
// ---------------------------------------------------------------------
function frame(dt) {
  G.t += dt; SFX.tick();
  // uyarlanabilir çözünürlük (düşük FPS'de piksel sayısını azalt)
  G.pf = (G.pf || 0) + dt; G.pn = (G.pn || 0) + 1;
  if (G.pf > 2) { const avg = G.pf / G.pn; G.pf = 0; G.pn = 0; const q = G.q || 1; let nq = q; if (avg > 0.024 && q > 0.5) nq = q * 0.85; else if (avg < 0.0172 && q < 1) nq = Math.min(1, q * 1.08); if (nq !== q) { G.q = nq; resize(); } }
  // solma
  if (G.fadeTo === 1) { G.fade = Math.min(1, G.fade + dt * 2.6); if (G.fade >= 1 && G.fadeCb) { const cb = G.fadeCb; G.fadeCb = null; cb(); G.fadeTo = 0; } }
  else G.fade = Math.max(0, G.fade - dt * 1.8);
  handleTaps();
  if (G.state === 'title') { P.ang += dt * 0.8; P.anim = 0; updateFX(dt); updateCamera(dt); }
  else if (G.state === 'play' && !G.modal) {
    if (G.hitstop > 0) { G.hitstop -= dt; }
    else { const gdt = dt * G.slow; G.run += dt; update(gdt); }
    updateCamera(dt);
  } else if (G.state === 'dead') { G.deadT += dt; G.slow = Math.max(0.15, G.slow - dt); update(dt * 0.25); updateCamera(dt); }
  else updateCamera(0);
  render();
  drawUI(dt);
  IN.dash = false; IN.spec = false;
}

function update(dt) {
  updatePlayer(dt);
  updateEnemies(dt);
  updateProjs(dt);
  updateHazards(dt);
  updatePickups(dt);
  updateRooms(dt);
  updateFX(dt);
  // akış alanı
  if ((G.flowT = (G.flowT || 0) - dt) <= 0) { G.flowT = 0.25; buildFlow(); }
  SFX.intensity = lerp(SFX.intensity, G.cur && G.cur.state === 'fight' ? (G.boss ? 1 : 0.7) : 0.1, dt * 0.8);
}
function updateFX(dt) {
  for (const p of parts) {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= (p.g ?? 260) * dt;
    if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; p.vz *= 1 - p.drag * dt; }
    if (p.z < 0 && (p.type === 'cube' || p.type === 'spark')) { p.z = 0; p.vz *= -0.35; p.vx *= 0.6; p.vy *= 0.6; }
  }
  parts = parts.filter(p => p.life > 0); if (parts.length > 900) parts.splice(0, parts.length - 900);
  for (const t of texts) { t.t += dt; t.z += dt * 30 * (1 - t.t); }
  texts = texts.filter(t => t.t < 0.9);
  for (const g of ghosts) g.t -= dt; ghosts = ghosts.filter(g => g.t > 0);
  for (const w of waves) w.t += dt; waves = waves.filter(w => w.t < w.dur);
  for (const b of bars) { b.z = lerp(b.z, b.up ? 0 : -22, Math.min(1, dt * 10)); }
  bars = bars.filter(b => b.up || b.z > -21);
  if (G.banner) { G.banner.t += dt; if (G.banner.t > 3) G.banner = null; }
  if (G.msg) { G.msg.t += dt; if (G.msg.t > 5) G.msg = null; }
  G.hurtV = Math.max(0, G.hurtV - dt * 1.5); G.flash = Math.max(0, G.flash - dt * 3);
  G.comboT = Math.max(0, (G.comboT || 0) - dt); G.comboPop = Math.max(0, (G.comboPop || 0) - dt); if (G.comboT <= 0) G.combo = 0;
  CAM.punch = Math.max(0, (CAM.punch || 0) - dt * 3);
  updateMotes(dt);
}

// ---------------------------------------------------------------------
//  Oyuncu
// ---------------------------------------------------------------------
function dmgMult() { let m = P.st.dmg; if (P.hp < P.maxHp * 0.4) m += P.st.rage; return m; }
function updatePlayer(dt) {
  if (P.dead) return;
  const [mx, my, mm] = readMove();
  const W0 = WEAPONS[P.weapon];
  P.inv = Math.max(0, P.inv - dt); P.dashCd = Math.max(0, P.dashCd - dt); P.atkCd = Math.max(0, P.atkCd - dt); P.hurtT = Math.max(0, P.hurtT - dt);
  // atılım
  if (IN.dash && P.dashCd <= 0 && P.dashT <= 0) {
    let dx = mx, dy = my; if (mm < 0.1) { dx = Math.cos(P.ang); dy = Math.sin(P.ang); } const l = Math.hypot(dx, dy) || 1;
    P.dx = dx / l; P.dy = dy / l; P.dashT = 0.2; P.dashCd = P.st.dashCd; P.inv = Math.max(P.inv, 0.28); P.dashHit = new Set(); SFX.play('dash');
    for (let i = 0; i < 10; i++) parts.push({ type: 'cube', x: P.x, y: P.y, z: 1, vx: rnd(-40, 40), vy: rnd(-40, 40), vz: rnd(20, 60), life: 0.5, s: 1.5, c: [0.6, 0.6, 0.65], g: 200 });
  }
  const spd = 74 * P.st.move;
  if (P.dashT > 0) {
    P.dashT -= dt; P.vx = P.dx * 290; P.vy = P.dy * 290; P.ang = Math.atan2(P.dy, P.dx);
    if (Math.random() < 0.9) ghosts.push({ x: P.x, y: P.y, ang: P.ang, f: 1, t: 0.25 });
    if (P.st.dashDmg) for (const e of enemies) if (!e.dead && !e.spawnT && !P.dashHit.has(e) && d2(e.x, e.y, P.x, P.y) < (e.r + 10) ** 2) { P.dashHit.add(e); hurtEnemy(e, P.st.dashDmg * dmgMult(), P.dx, P.dy, 80); }
  } else {
    const k = Math.min(1, dt * 14); P.vx = lerp(P.vx, mx * spd, k); P.vy = lerp(P.vy, my * spd, k);
  }
  const ox = P.x, oy = P.y; moveE(P, P.vx * dt, P.vy * dt);
  const moved = Math.hypot(P.x - ox, P.y - oy); P.moving = moved > 0.2 && P.dashT <= 0; P.anim += moved;
  if (P.moving && Math.random() < dt * 6) parts.push({ type: 'cube', x: P.x - P.vx * 0.05, y: P.y - P.vy * 0.05, z: 0.5, vx: rnd(-10, 10), vy: rnd(-10, 10), vz: rnd(10, 25), life: 0.4, s: 1, c: [0.55, 0.55, 0.6], g: 100 });
  // hedef
  let tgt = null, best = (W0.type === 'proj' ? 200 : 110) ** 2;
  for (const e of enemies) { if (e.dead || e.spawnT > 0) continue; const d = d2(e.x, e.y, P.x, P.y); if (d < best) { best = d; tgt = e; } }
  const wantAtk = IN.atk != null || IN.keys.j || IN.keys[' '];
  // etkileşim
  G.interact = null;
  for (const o of inter) { if ((o.kind === 'chest' && !o.open) || (o.kind === 'shop' && !o.sold)) { if (d2(o.x, o.y, P.x, P.y) < 22 * 22) G.interact = o; } }
  if (wantAtk && G.interact && !tgt && P.atkCd <= 0) { doInteract(G.interact); P.atkCd = 0.4; IN.atk = null; }
  else if (wantAtk && P.atkCd <= 0) attack(tgt);
  // yüz yönü
  let face = P.ang;
  if (P.swing || (tgt && wantAtk)) { if (tgt) face = Math.atan2(tgt.y - P.y, tgt.x - P.x); }
  else if (mm > 0.1) face = Math.atan2(my, mx);
  if (P.dashT <= 0) P.ang += angDiff(P.ang, face) * Math.min(1, dt * 16);
  if (P.swing) { P.swing.t += dt; if (P.swing.t >= P.swing.dur) P.swing = null; }
  // özel güç
  if (IN.spec && P.special >= 1) nova();
  // dönen kılıçlar
  if (P.st.orbit) {
    P.orbA += dt * 4.2;
    for (let i = 0; i < P.st.orbit; i++) {
      const a = P.orbA + i * TAU / P.st.orbit, ox2 = P.x + Math.cos(a) * 26, oy2 = P.y + Math.sin(a) * 26;
      for (const e of enemies) { if (e.dead || e.spawnT > 0) continue; if (d2(e.x, e.y, ox2, oy2) < (e.r + 7) ** 2 && (!e.orbT || e.orbT < G.t)) { e.orbT = G.t + 0.4; hurtEnemy(e, 9 * dmgMult(), Math.cos(a + 1.57), Math.sin(a + 1.57), 60); } }
    }
  }
}
function attack(tgt) {
  const W0 = WEAPONS[P.weapon]; P.atkCd = W0.cd / P.st.atk; P.atkN++;
  let a = tgt ? Math.atan2(tgt.y - P.y, tgt.x - P.x) : P.ang; P.ang = a;
  const dm = dmgMult();
  if (W0.type === 'melee' || W0.type === 'thrust') {
    const range = W0.range * P.st.area, arc = W0.arc * (W0.type === 'melee' ? Math.min(1.5, 1 + (P.st.area - 1) * 0.6) : 1);
    P.flip *= -1;
    P.swing = { t: 0, dur: W0.type === 'thrust' ? 0.16 : 0.2, a0: -arc / 2 * P.flip, a1: arc / 2 * P.flip, thrust: W0.type === 'thrust', range };
    SFX.play(P.weapon === 'axe' ? 'heavy' : 'swing');
    let any = false;
    for (const e of enemies) {
      if (e.dead || e.spawnT > 0) continue; const d = Math.hypot(e.x - P.x, e.y - P.y);
      if (d - e.r > range) continue; const da = Math.abs(angDiff(a, Math.atan2(e.y - P.y, e.x - P.x)));
      if (da > arc / 2 + Math.atan2(e.r, Math.max(d, 1)) && d > e.r + 4) continue;
      hurtEnemy(e, W0.dmg * dm, (e.x - P.x) / (d || 1), (e.y - P.y) / (d || 1), W0.kb); any = true;
    }
    for (const p of props) { const d = Math.hypot(p.x - P.x, p.y - P.y); if (d - p.r < range && Math.abs(angDiff(a, Math.atan2(p.y - P.y, p.x - P.x))) < arc / 2 + 0.4) hitProp(p, W0.dmg); }
    // lunge
    P.vx += Math.cos(a) * 60; P.vy += Math.sin(a) * 60;
    if (any) { CAM.shake = Math.max(CAM.shake, P.weapon === 'axe' ? 4 : 2); }
  } else {
    SFX.play(W0.kind === 'fire' ? 'magic' : 'shoot');
    const hx = P.x + Math.cos(a) * 10, hy = P.y + Math.sin(a) * 10;
    projs.push({ from: 'p', kind: W0.kind, x: hx, y: hy, z: 8, vx: Math.cos(a) * W0.speed, vy: Math.sin(a) * W0.speed, r: W0.kind === 'fire' ? 5 : 3, dmg: W0.dmg * dm, life: 1.4, pierce: W0.pierce || 0, hit: new Set(), kb: W0.kb });
    P.swing = { t: 0, dur: 0.12, a0: 0, a1: 0, recoil: true };
    P.vx -= Math.cos(a) * 20; P.vy -= Math.sin(a) * 20;
  }
  if (P.st.soul && P.atkN % 4 === 0) for (let i = 0; i < 2 + P.st.soul; i++) { const aa = a + (i - (1 + P.st.soul) / 2) * 0.5; projs.push({ from: 'p', kind: 'soul', x: P.x, y: P.y, z: 10, vx: Math.cos(aa) * 160, vy: Math.sin(aa) * 160, r: 3, dmg: 8 * dm, life: 2, pierce: 0, hit: new Set(), homing: true, kb: 30 }); }
}
function nova() {
  P.special = 0; SFX.play('nova'); CAM.shake = 10; G.flash = 0.6; G.hitstop = 0.06;
  waves.push({ x: P.x, y: P.y, t: 0, dur: 0.5, R: 110 * P.st.area, c: [0.6, 0.9, 1] });
  for (const e of enemies) { if (e.dead || e.spawnT > 0) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < 110 * P.st.area + e.r) hurtEnemy(e, 60 * dmgMult(), (e.x - P.x) / (d || 1), (e.y - P.y) / (d || 1), 300, true); }
  for (const p of projs) if (p.from === 'e' && d2(p.x, p.y, P.x, P.y) < 120 * 120) p.life = 0;
  for (let i = 0; i < 60; i++) { const a = rnd(TAU), s = rnd(120, 260); parts.push({ type: 'glow', x: P.x, y: P.y, z: 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rnd(0, 60), life: rnd(0.3, 0.6), s: rnd(3, 6), c: [0.5, 0.85, 1], g: 0, drag: 3 }); }
}
function hurtPlayer(d, sx, sy) {
  if (P.dead || P.inv > 0 || P.dashT > 0 || G.state !== 'play') return;
  if (P.shield > 0) { P.shield--; P.inv = 0.6; SFX.play('zap'); waves.push({ x: P.x, y: P.y, t: 0, dur: 0.35, R: 30, c: [1, 0.9, 0.4] }); addText(P.x, P.y, 'ENGEL', '#ffe080', 1); return; }
  d = Math.round(d * (1 + (G.floor - 1) * 0.08));
  P.hp -= d; P.inv = 0.8; P.hurtT = 0.2; G.hurtV = 1; CAM.shake = Math.max(CAM.shake, 7); G.hitstop = 0.05; SFX.play('hurt');
  addText(P.x, P.y, '-' + d, '#ff5050', 1.2);
  if (sx !== undefined) { const a = Math.atan2(P.y - sy, P.x - sx); P.vx += Math.cos(a) * 160; P.vy += Math.sin(a) * 160; }
  for (let i = 0; i < 10; i++) parts.push({ type: 'cube', x: P.x, y: P.y, z: 8, vx: rnd(-60, 60), vy: rnd(-60, 60), vz: rnd(40, 120), life: 0.8, s: 1.6, c: [0.8, 0.1, 0.12] });
  if (P.st.thorn) { waves.push({ x: P.x, y: P.y, t: 0, dur: 0.3, R: 50, c: [1, 0.5, 0.3] }); for (const e of enemies) if (!e.dead && !e.spawnT && d2(e.x, e.y, P.x, P.y) < 55 * 55) hurtEnemy(e, P.st.thorn, e.x - P.x, e.y - P.y, 100); }
  if (P.hp <= 0) { P.hp = 0; die(); }
}
function die() {
  P.dead = true; G.state = 'dead'; G.deadT = 0; G.slow = 1; SFX.play('boom'); CAM.shake = 14;
  explodeModel(MD.hero[0], P.x, P.y, 0, 1.2, 80);
  if (G.floor > G.best) { G.best = G.floor; store.set('kz_best', G.best); }
}
function healP(v) { const h = Math.min(v, P.maxHp - P.hp); if (h <= 0) return; P.hp += h; addText(P.x, P.y, '+' + Math.round(h), '#60ff80', 1); }

// ---------------------------------------------------------------------
//  Düşmanlar
// ---------------------------------------------------------------------
function spawnEnemy(type, x, y, room, elite, delay = 0.9) {
  const d = ET[type], sc = 1 + (G.floor - 1) * 0.2;
  const e = { type, x, y, z: 0, vx: 0, vy: 0, kx: 0, ky: 0, ang: Math.atan2(P.y - y, P.x - x), hp: d.hp * sc * (elite ? 2.2 : 1), r: d.r * (elite ? 1.2 : 1), room, elite, t: rnd(0, 1), st: 'idle', sT: rnd(0.5, 1.5), flash: 0, spawnT: delay, anim: rnd(10), burn: 0, burnT: 0, dead: false, hitT: 0, sc: elite ? 1.25 : 1, phase: 1 };
  e.maxHp = e.hp; if (d.boss) { G.boss = e; e.spawnT = 1.6; SFX.play('roar'); CAM.shake = 8; }
  enemies.push(e); return e;
}
function hurtEnemy(e, dmg, kx, ky, kb, big) {
  if (e.dead) return;
  const crit = Math.random() < P.st.crit; if (crit) dmg *= 2;
  dmg = Math.max(1, Math.round(dmg * rnd(0.9, 1.1)));
  e.hp -= dmg; e.flash = 0.12; e.hitT = 2.5;
  const l = Math.hypot(kx, ky) || 1; const m = ET[e.type].mass * (e.elite ? 1.6 : 1);
  e.kx += kx / l * kb / m; e.ky += ky / l * kb / m;
  addText(e.x, e.y, dmg, crit ? '#ffd040' : '#ffffff', crit ? 1.5 : 1);
  SFX.play(crit ? 'crit' : 'hit'); G.hitstop = Math.max(G.hitstop, crit || big ? 0.05 : 0.025);
  P.special = Math.min(1, P.special + dmg * 0.0035 * P.st.nova);
  const cols = (MD[e.type] && (MD[e.type].cols || (MD[e.type][0] && MD[e.type][0].cols))) || [0xffffff];
  for (let i = 0; i < 5; i++) { const c = c3(pick(cols)); parts.push({ type: 'cube', x: e.x, y: e.y, z: 8, vx: kx / l * rnd(30, 90) + rnd(-30, 30), vy: ky / l * rnd(30, 90) + rnd(-30, 30), vz: rnd(40, 110), life: rnd(0.4, 0.8), s: rnd(1, 2), c }); }
  for (let i = 0; i < 3; i++) parts.push({ type: 'glow', x: e.x, y: e.y, z: 8, vx: rnd(-60, 60), vy: rnd(-60, 60), vz: rnd(0, 60), life: 0.18, s: 4, c: [1, 0.9, 0.6], g: 0 });
  for (let i = 0; i < (crit ? 8 : 5); i++) { const a = Math.atan2(ky, kx) + rnd(-1.1, 1.1), sp = rnd(140, 280); parts.push({ type: 'spark', x: e.x, y: e.y, z: 8 + rnd(-3, 3), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rnd(-20, 80), life: rnd(0.12, 0.25), s: 1, c: crit ? [1, 0.85, 0.3] : [1, 1, 0.9], g: 200, drag: 6 }); }
  waves.push({ x: e.x, y: e.y, t: 0, dur: 0.16, R: crit ? 22 : 14, c: crit ? [1, 0.8, 0.3] : [1, 1, 1] });
  if (crit) CAM.punch = Math.max(CAM.punch || 0, 0.4);
  if (P.st.burn && !big) { e.burn = 3; e.burnD = 3 * P.st.burn * (1 + (G.floor - 1) * 0.1); }
  if (P.st.chain && Math.random() < P.st.chain && !e.chained) chain(e, dmg * 0.6);
  if (e.hp <= 0) killEnemy(e);
}
function chain(from, dmg) {
  let cur = from; const hit = new Set([from]); SFX.play('zap');
  for (let k = 0; k < 3; k++) {
    let best = null, bd = 90 * 90; for (const e of enemies) { if (e.dead || hit.has(e) || e.spawnT > 0) continue; const d = d2(e.x, e.y, cur.x, cur.y); if (d < bd) { bd = d; best = e; } }
    if (!best) break; hit.add(best);
    const n = 8; for (let i = 0; i <= n; i++) { const t = i / n; parts.push({ type: 'glow', x: lerp(cur.x, best.x, t) + rnd(-3, 3), y: lerp(cur.y, best.y, t) + rnd(-3, 3), z: 10 + rnd(-3, 3), vx: 0, vy: 0, vz: 0, life: 0.2, s: 3, c: [0.6, 0.8, 1], g: 0 }); }
    best.chained = true; hurtEnemy(best, dmg, best.x - cur.x, best.y - cur.y, 40); best.chained = false; cur = best;
  }
}
function killEnemy(e) {
  e.dead = true; G.kills++; const d = ET[e.type];
  G.combo = (G.comboT > 0 ? G.combo : 0) + 1; G.comboT = 2.5; G.comboPop = 0.25; CAM.punch = Math.max(CAM.punch || 0, d.boss ? 1 : 0.35);
  if (G.combo % 10 === 0) { for (let i = 0; i < 5 + G.combo / 2; i++) dropPickup('coin', e.x, e.y); addText(P.x, P.y, G.combo + ' KOMBO!', '#ffb040', 1.4); SFX.play('pick'); }
  for (let i = 0; i < 3; i++) parts.push({ type: 'glow', x: e.x + rnd(-4, 4), y: e.y + rnd(-4, 4), z: 6, vx: 0, vy: 0, vz: rnd(25, 45), life: rnd(0.9, 1.4), s: rnd(2.5, 4), c: [0.7, 0.9, 1], g: -10 });
  SFX.play('kill'); CAM.shake = Math.max(CAM.shake, d.boss ? 16 : 3); G.hitstop = Math.max(G.hitstop, d.boss ? 0.3 : 0.04);
  const m = enemyModel(e); explodeModel(m, e.x, e.y, e.z, e.sc * (d.boss ? 1.4 : 1), d.boss ? 200 : 40);
  const g = Math.round(d.gold * (e.elite ? 3 : 1) * P.st.gold * rnd(0.8, 1.3));
  for (let i = 0; i < g; i++) dropPickup('coin', e.x, e.y);
  if (Math.random() < (e.elite ? 0.4 : 0.05)) dropPickup('heart', e.x, e.y);
  if (P.st.vamp) healP(P.st.vamp);
  P.special = Math.min(1, P.special + 0.04 * P.st.nova);
  if (P.st.boom) { waves.push({ x: e.x, y: e.y, t: 0, dur: 0.3, R: 40, c: [1, 0.6, 0.2] }); SFX.play('boom'); for (const o of enemies) if (!o.dead && o !== e && !o.spawnT && d2(o.x, o.y, e.x, e.y) < 45 * 45) hurtEnemy(o, 15 * P.st.boom * dmgMult(), o.x - e.x, o.y - e.y, 120, true); }
  if (e.type === 'slime' && G.floor >= 2) for (let i = 0; i < 2; i++) { const s = spawnEnemy('slimeS', e.x + rnd(-6, 6), e.y + rnd(-6, 6), e.room, false, 0); s.kx = rnd(-80, 80); s.ky = rnd(-80, 80); }
  if (d.boss) { G.boss = null; for (const o of enemies) if (!o.dead && o !== e) { o.dead = true; explodeModel(enemyModel(o), o.x, o.y, 0, 1, 20); } projs = projs.filter(p => p.from === 'p'); G.slow = 0.3; setTimeout(() => G.slow = 1, 900); }
}
function explodeModel(m, x, y, z, sc, n) {
  const cols = m.cols; for (let i = 0; i < n; i++) { const c = c3(pick(cols)); const a = rnd(TAU), s = rnd(20, 110); parts.push({ type: 'cube', x: x + rnd(-6, 6) * sc, y: y + rnd(-6, 6) * sc, z: z + rnd(2, m.h) * sc, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rnd(30, 160), life: rnd(0.8, 1.6), s: rnd(1.2, 2.4) * Math.min(sc, 1.6), c }); }
  for (let i = 0; i < 8; i++) parts.push({ type: 'glow', x, y, z: z + 8, vx: rnd(-40, 40), vy: rnd(-40, 40), vz: rnd(10, 40), life: 0.35, s: rnd(5, 9), c: [1, 0.85, 0.6], g: 0 });
}
function enemyModel(e) {
  const f = e.anim | 0;
  switch (e.type) {
    case 'slime': return e.elite ? MD.slimeR : MD.slime; case 'slimeS': return MD.slimeB;
    case 'bat': return MD.bat[Math.floor(e.anim * 2) % 2];
    case 'skel': return MD.skel[e.moving ? 1 + (Math.floor(e.anim / 7) % 2) : 0];
    case 'archer': return MD.archer[e.moving ? 1 + (Math.floor(e.anim / 7) % 2) : 0];
    case 'mage': return MD.mage[Math.floor(G.t * 3) % 2];
    case 'orc': return MD.orc[e.moving ? 1 + (Math.floor(e.anim / 9) % 2) : 0];
    case 'golem': return MD.golem[e.moving ? 1 + (Math.floor(e.anim / 12) % 2) : 0];
    case 'lich': return MD.lich[Math.floor(G.t * 3) % 2];
  }
  return MD.slime;
}
function buildFlow() {
  flow.fill(-1); const sx = Math.floor(P.x / T), sy = Math.floor(P.y / T); if (!walk(sx, sy)) return;
  const q = new Int32Array(MW * MH); let h = 0, t = 0; q[t++] = idx(sx, sy); flow[idx(sx, sy)] = 0;
  while (h < t) { const i = q[h++], x = i % MW, y = (i / MW) | 0, d = flow[i]; if (d > 40) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!walk(nx, ny)) continue; const j = idx(nx, ny); if (flow[j] < 0) { flow[j] = d + 1; q[t++] = j; } } }
}
function chaseDir(e) {
  const dx = P.x - e.x, dy = P.y - e.y, dd = Math.hypot(dx, dy) || 1;
  const tx = Math.floor(e.x / T), ty = Math.floor(e.y / T), d = flow[idx(tx, ty)];
  if (d <= 1 || ET[e.type].fly) return [dx / dd, dy / dd, dd];
  let best = d, bx = 0, by = 0;
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { if (!ox && !oy) continue; if (ox && oy && (!walk(tx + ox, ty) || !walk(tx, ty + oy))) continue; const n = flow[idx(tx + ox, ty + oy)]; if (n >= 0 && n < best) { best = n; bx = ox; by = oy; } }
  if (best === d) return [dx / dd, dy / dd, dd];
  const gx = (tx + bx) * T + 8 - e.x, gy = (ty + by) * T + 8 - e.y, gl = Math.hypot(gx, gy) || 1; return [gx / gl, gy / gl, dd];
}
function eShoot(e, a, spd, kind = 'orb', col = [0.85, 0.4, 1], r = 4) { projs.push({ from: 'e', kind, x: e.x + Math.cos(a) * 8, y: e.y + Math.sin(a) * 8, z: 10, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r, dmg: ET[e.type].dmg, life: 4, col }); }
function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.spawnT > 0) { e.spawnT -= dt; if (e.spawnT <= 0) { SFX.play('spawn'); for (let i = 0; i < 12; i++) parts.push({ type: 'glow', x: e.x, y: e.y, z: 2, vx: rnd(-50, 50), vy: rnd(-50, 50), vz: rnd(30, 90), life: 0.4, s: 4, c: [1, 0.3, 0.3], g: 0 }); } continue; }
    const D = ET[e.type]; e.t += dt; e.flash = Math.max(0, e.flash - dt); e.hitT = Math.max(0, e.hitT - dt); e.sT -= dt;
    if (e.burn > 0) { e.burn -= dt; e.burnT -= dt; if (Math.random() < dt * 10) parts.push({ type: 'glow', x: e.x + rnd(-4, 4), y: e.y + rnd(-4, 4), z: rnd(4, 14), vx: 0, vy: 0, vz: 30, life: 0.4, s: 3, c: [1, 0.5, 0.1], g: 0 }); if (e.burnT <= 0) { e.burnT = 0.5; e.hp -= e.burnD; addText(e.x, e.y, Math.round(e.burnD), '#ff9030', 0.8); e.flash = 0.05; if (e.hp <= 0) { killEnemy(e); continue; } } }
    const [cx, cy, dist] = chaseDir(e); let vx = 0, vy = 0; e.moving = false;
    const face = (a, k = 10) => e.ang += angDiff(e.ang, a) * Math.min(1, dt * k);
    const toP = Math.atan2(P.y - e.y, P.x - e.x);
    const sp = D.spd * (e.elite ? 1.1 : 1) * (1 + (G.floor - 1) * 0.03);
    switch (e.type) {
      case 'slime': case 'slimeS': {
        if (e.st === 'idle') { e.z = 0; if (e.sT <= 0) { e.st = 'hop'; e.sT = 0.55; e.hx = cx; e.hy = cy; e.ang = Math.atan2(cy, cx); } }
        else { const k = 1 - e.sT / 0.55; e.z = Math.sin(k * Math.PI) * 12; vx = e.hx * 95; vy = e.hy * 95; if (e.sT <= 0) { e.st = 'idle'; e.sT = rnd(0.5, 1.1); for (let i = 0; i < 4; i++) parts.push({ type: 'cube', x: e.x, y: e.y, z: 0.5, vx: rnd(-30, 30), vy: rnd(-30, 30), vz: rnd(10, 30), life: 0.4, s: 1.4, c: e.type === 'slime' ? [0.35, 0.8, 0.25] : [0.3, 0.6, 1] }); } }
        break;
      }
      case 'bat': {
        e.z = 12 + Math.sin(e.t * 6) * 3; e.anim += dt * 6;
        const wob = Math.sin(e.t * 3 + e.anim) * 0.9; const a = Math.atan2(cy, cx) + wob; vx = Math.cos(a) * sp; vy = Math.sin(a) * sp; face(a);
        if (e.st === 'dive') { vx = e.hx * 200; vy = e.hy * 200; if (e.sT <= 0) { e.st = 'idle'; e.sT = rnd(1.5, 3); } }
        else if (e.sT <= 0 && dist < 80) { e.st = 'dive'; e.sT = 0.35; e.hx = cx; e.hy = cy; }
        break;
      }
      case 'skel': case 'orc': {
        const range = e.type === 'orc' ? 28 : 20;
        if (e.st === 'idle') { vx = cx * sp; vy = cy * sp; e.moving = true; face(Math.atan2(cy, cx)); if (dist < range + e.r && e.sT <= 0) { e.st = 'wind'; e.sT = e.type === 'orc' ? 0.6 : 0.42; } if (e.type === 'orc' && dist > 70 && dist < 160 && e.sT <= -2) { e.st = 'cwind'; e.sT = 0.8; } }
        else if (e.st === 'wind') { face(toP, 6); if (e.sT <= 0) { e.st = 'strike'; e.sT = 0.25; e.kx += Math.cos(e.ang) * 120; e.ky += Math.sin(e.ang) * 120; SFX.play('swing'); e.swing = 0; } }
        else if (e.st === 'strike') { e.swing = 1 - e.sT / 0.25; if (dist < range + 12 + P.r && Math.abs(angDiff(e.ang, toP)) < 1.2 && !e.didHit) { hurtPlayer(D.dmg, e.x, e.y); e.didHit = true; } if (e.sT <= 0) { e.st = 'idle'; e.sT = rnd(0.6, 1.2); e.didHit = false; e.swing = null; } }
        else if (e.st === 'cwind') { face(toP, 8); if (Math.random() < 0.5) parts.push({ type: 'cube', x: e.x, y: e.y, z: 1, vx: rnd(-30, 30), vy: rnd(-30, 30), vz: rnd(20, 50), life: 0.5, s: 1.5, c: [0.8, 0.3, 0.2] }); if (e.sT <= 0) { e.st = 'charge'; e.sT = 0.9; e.hx = Math.cos(e.ang); e.hy = Math.sin(e.ang); SFX.play('heavy'); } }
        else if (e.st === 'charge') { vx = e.hx * 230; vy = e.hy * 230; e.moving = true; e.anim += dt * 40; if (dist < e.r + P.r + 4) hurtPlayer(D.dmg, e.x, e.y); if (e.hitWall || e.sT <= 0) { if (e.hitWall) { CAM.shake = 6; SFX.play('boom'); e.sT = 1.6; e.st = 'stun'; } else { e.st = 'idle'; e.sT = 0.8; } } }
        else if (e.st === 'stun') { if (Math.random() < dt * 8) parts.push({ type: 'glow', x: e.x + rnd(-5, 5), y: e.y + rnd(-5, 5), z: 22, vx: 0, vy: 0, vz: 0, life: 0.3, s: 2, c: [1, 1, 0.4], g: 0 }); if (e.sT <= 0) { e.st = 'idle'; e.sT = 0.3; } }
        break;
      }
      case 'archer': {
        face(toP, 8);
        if (e.st === 'idle') { const want = dist > 140 ? 1 : dist < 80 ? -1 : 0; const s = Math.sin(e.t * 0.9 + e.anim); vx = (cx * want - cy * s * 0.6) * sp; vy = (cy * want + cx * s * 0.6) * sp; e.moving = true; if (e.sT <= 0 && dist < 220) { e.st = 'aim'; e.sT = 0.6; } }
        else if (e.st === 'aim') { if (e.sT <= 0) { eShoot(e, toP + rnd(-0.05, 0.05), 210, 'arrow'); SFX.play('shoot'); e.st = 'idle'; e.sT = rnd(1.2, 2.0); } }
        break;
      }
      case 'mage': {
        face(toP, 6); e.z = 2 + Math.sin(e.t * 2) * 1.5;
        if (e.st === 'idle') { const s = Math.sin(e.t * 0.7 + e.anim); vx = -cy * s * sp; vy = cx * s * sp; e.moving = true; if (e.sT <= 0) { e.st = 'cast'; e.sT = 0.8; e.mode = Math.random() < 0.5 ? 0 : 1; } }
        else if (e.st === 'cast') { if (Math.random() < 0.6) parts.push({ type: 'glow', x: e.x + rnd(-8, 8), y: e.y + rnd(-8, 8), z: rnd(4, 20), vx: 0, vy: 0, vz: 20, life: 0.4, s: 3, c: [0.8, 0.4, 1], g: 0 });
          if (e.sT <= 0) { SFX.play('eshoot'); if (e.mode === 0) for (let i = 0; i < 8; i++) eShoot(e, i * TAU / 8 + e.t, 75); else for (let i = -1; i <= 1; i++) eShoot(e, toP + i * 0.25, 120); e.st = 'idle'; e.sT = rnd(1.5, 2.5); if (Math.random() < 0.4) { const p = freeTile(e.room, 1); if (p) { explodeFx(e.x, e.y, [0.7, 0.3, 1]); e.x = p[0]; e.y = p[1]; explodeFx(e.x, e.y, [0.7, 0.3, 1]); } } } }
        break;
      }
      case 'golem': bossGolem(e, dt, cx, cy, dist, toP, sp, face); vx = e.vx2 || 0; vy = e.vy2 || 0; break;
      case 'lich': bossLich(e, dt, cx, cy, dist, toP, sp, face); vx = e.vx2 || 0; vy = e.vy2 || 0; break;
    }
    if (e.moving && e.type !== 'bat') e.anim += Math.hypot(vx, vy) * dt;
    // ayrışma
    for (const o of enemies) { if (o === e || o.dead || o.spawnT > 0) continue; const dx = e.x - o.x, dy = e.y - o.y, dd = dx * dx + dy * dy, rr = e.r + o.r; if (dd < rr * rr && dd > 0.01) { const d = Math.sqrt(dd), push = (rr - d) * 0.5 / d; vx += dx * push * 8; vy += dy * push * 8; } }
    e.kx *= Math.pow(0.002, dt); e.ky *= Math.pow(0.002, dt);
    e.hitWall = false; moveE(e, (vx + e.kx) * dt, (vy + e.ky) * dt);
    // temas hasarı
    if (['slime', 'slimeS', 'bat', 'golem'].includes(e.type) && d2(e.x, e.y, P.x, P.y) < (e.r + P.r) ** 2 && e.z < 10 + (e.type === 'bat' ? 10 : 0)) hurtPlayer(D.dmg * (e.elite ? 1.3 : 1), e.x, e.y);
  }
  enemies = enemies.filter(e => !e.dead);
}
function explodeFx(x, y, c) { for (let i = 0; i < 14; i++) parts.push({ type: 'glow', x, y, z: rnd(2, 18), vx: rnd(-50, 50), vy: rnd(-50, 50), vz: rnd(-20, 40), life: 0.45, s: rnd(3, 6), c, g: 0, drag: 2 }); }
function bossGolem(e, dt, cx, cy, dist, toP, sp, face) {
  e.vx2 = 0; e.vy2 = 0; const enr = e.hp < e.maxHp * 0.5; if (enr && e.phase === 1) { e.phase = 2; SFX.play('roar'); CAM.shake = 10; G.banner = { t: 0, a: 'TAŞ DEV ÖFKELENDİ!', b: '' }; }
  const sp2 = sp * (enr ? 1.4 : 1);
  if (e.st === 'idle') { e.vx2 = cx * sp2; e.vy2 = cy * sp2; e.moving = true; face(Math.atan2(cy, cx), 3); if (e.sT <= 0) { const r = Math.random(); e.st = r < 0.4 ? 'slamW' : r < 0.75 ? 'rocks' : 'summon'; e.sT = e.st === 'slamW' ? 0.9 : 0.6; e.cnt = 0; } }
  else if (e.st === 'slamW') { e.z = Math.sin((1 - e.sT / 0.9) * Math.PI * 0.5) * 14; face(toP, 4); if (e.sT <= 0) { e.z = 0; SFX.play('boom'); CAM.shake = 12; waves.push({ x: e.x, y: e.y, t: 0, dur: 1.1, R: 170, c: [1, 0.6, 0.3], hurt: 22, hitP: false }); if (enr) waves.push({ x: e.x, y: e.y, t: -0.35, dur: 1.45, R: 170, c: [1, 0.4, 0.2], hurt: 22, hitP: false }); explodeFx(e.x, e.y, [0.8, 0.7, 0.6]); e.st = 'rest'; e.sT = 1.0; } }
  else if (e.st === 'rocks') { if (e.sT <= 0 && e.cnt < (enr ? 9 : 6)) { e.cnt++; e.sT = 0.18; const a = rnd(TAU), d = e.cnt === 1 ? 0 : rnd(10, 70); hazards.push({ kind: 'rock', x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, t: 1.1, max: 1.1, R: 18, dmg: 18 }); } if (e.cnt >= (enr ? 9 : 6) && e.sT <= 0) { e.st = 'idle'; e.sT = rnd(1.2, 2); } }
  else if (e.st === 'summon') { if (e.sT <= 0) { for (let i = 0; i < (enr ? 3 : 2); i++) { const p = freeTile(e.room, 1); if (p) spawnEnemy(Math.random() < 0.5 ? 'slime' : 'bat', p[0], p[1], e.room, false, 0.8); } e.st = 'idle'; e.sT = 2.5; } }
  else if (e.st === 'rest') { if (e.sT <= 0) { e.st = 'idle'; e.sT = rnd(1, 2); } }
}
function bossLich(e, dt, cx, cy, dist, toP, sp, face) {
  e.vx2 = 0; e.vy2 = 0; e.z = 6 + Math.sin(e.t * 2) * 3; face(toP, 4); const enr = e.hp < e.maxHp * 0.5;
  if (enr && e.phase === 1) { e.phase = 2; SFX.play('roar'); G.banner = { t: 0, a: 'LİÇ KRAL UYANDI!', b: '' }; }
  if (e.st === 'idle') { const s = Math.sin(e.t * 0.6); e.vx2 = -cy * s * sp + (dist > 120 ? cx * sp : 0); e.vy2 = cx * s * sp + (dist > 120 ? cy * sp : 0); if (e.sT <= 0) { const r = Math.random(); e.st = r < 0.4 ? 'spiral' : r < 0.75 ? 'volley' : r < 0.9 ? 'summon' : 'tele'; e.sT = e.st === 'spiral' ? 3 : 0.5; e.cnt = 0; e.sh = 0; } }
  else if (e.st === 'spiral') { e.sh -= dt; if (e.sh <= 0) { e.sh = enr ? 0.09 : 0.12; const arms = enr ? 4 : 3; for (let k = 0; k < arms; k++) eShoot(e, e.t * 2.2 + k * TAU / arms, 85, 'orb', [0.4, 1, 0.5]); if (enr) eShoot(e, -e.t * 1.7, 70, 'orb', [1, 0.4, 0.6]); } if (e.sT <= 0) { e.st = 'idle'; e.sT = 1.2; } }
  else if (e.st === 'volley') { if (e.sT <= 0) { e.cnt++; e.sT = 0.45; SFX.play('eshoot'); for (let i = -2; i <= 2; i++) eShoot(e, toP + i * 0.18, 150, 'orb', [0.4, 1, 0.5]); if (e.cnt >= (enr ? 4 : 3)) { e.st = 'idle'; e.sT = 1.5; } } }
  else if (e.st === 'summon') { if (e.sT <= 0) { for (let i = 0; i < (enr ? 3 : 2); i++) { const p = freeTile(e.room, 1); if (p) spawnEnemy(Math.random() < 0.6 ? 'skel' : 'archer', p[0], p[1], e.room, false, 0.9); } e.st = 'idle'; e.sT = 2; } }
  else if (e.st === 'tele') { if (e.sT <= 0) { const p = freeTile(e.room, 2); if (p) { explodeFx(e.x, e.y, [0.4, 1, 0.5]); e.x = p[0]; e.y = p[1]; explodeFx(e.x, e.y, [0.4, 1, 0.5]); SFX.play('magic'); } e.st = 'volley'; e.sT = 0.4; e.cnt = 0; } }
}

// ---------------------------------------------------------------------
//  Çarpışma
// ---------------------------------------------------------------------
function collide(e) {
  const r = e.r; const x0 = Math.floor((e.x - r) / T), x1 = Math.floor((e.x + r) / T), y0 = Math.floor((e.y - r) / T), y1 = Math.floor((e.y + r) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (walk(tx, ty)) continue;
    const nx = clamp(e.x, tx * T, tx * T + T), ny = clamp(e.y, ty * T, ty * T + T); let dx = e.x - nx, dy = e.y - ny; const d = Math.hypot(dx, dy);
    if (d < r) { if (d < 0.001) { dx = e.x - (tx * T + 8); dy = e.y - (ty * T + 8); const l = Math.hypot(dx, dy) || 1; e.x = tx * T + 8 + dx / l * (8 + r); e.y = ty * T + 8 + dy / l * (8 + r); } else { e.x = nx + dx / d * r; e.y = ny + dy / d * r; } e.hitWall = true; }
  }
  for (const p of props) { if (!p.solid) continue; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy), rr = r + p.r; if (d < rr && d > 0.01) { e.x = p.x + dx / d * rr; e.y = p.y + dy / d * rr; } }
  for (const p of decor) { if (!p.solid) continue; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy), rr = r + 5; if (d < rr && d > 0.01) { e.x = p.x + dx / d * rr; e.y = p.y + dy / d * rr; } }
}
function moveE(e, dx, dy) { const n = Math.ceil(Math.hypot(dx, dy) / 4) || 1; for (let i = 0; i < n; i++) { e.x += dx / n; e.y += dy / n; collide(e); } }

// ---------------------------------------------------------------------
//  Mermiler, tehlikeler, eşyalar
// ---------------------------------------------------------------------
function updateProjs(dt) {
  for (const p of projs) {
    p.life -= dt;
    if (p.homing) { let best = null, bd = 160 * 160; for (const e of enemies) { if (e.dead || e.spawnT > 0) continue; const d = d2(e.x, e.y, p.x, p.y); if (d < bd) { bd = d; best = e; } } if (best) { const a = Math.atan2(best.y - p.y, best.x - p.x), ca = Math.atan2(p.vy, p.vx), na = ca + angDiff(ca, a) * Math.min(1, dt * 6), s = Math.hypot(p.vx, p.vy) + dt * 100; p.vx = Math.cos(na) * s; p.vy = Math.sin(na) * s; } }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (!walk(Math.floor(p.x / T), Math.floor(p.y / T))) { p.life = 0; projHit(p); continue; }
    if (p.from === 'p') {
      for (const e of enemies) { if (e.dead || e.spawnT > 0 || p.hit.has(e)) continue; if (d2(e.x, e.y, p.x, p.y) < (e.r + p.r) ** 2) { p.hit.add(e); hurtEnemy(e, p.dmg, p.vx, p.vy, p.kb); if (p.pierce-- <= 0) { p.life = 0; projHit(p); break; } } }
      for (const pr of props) if (d2(pr.x, pr.y, p.x, p.y) < (pr.r + p.r) ** 2) { hitProp(pr, p.dmg); p.life = 0; projHit(p); break; }
    } else if (d2(P.x, P.y, p.x, p.y) < (P.r + p.r) ** 2 && P.inv <= 0 && P.dashT <= 0) { hurtPlayer(p.dmg, p.x - p.vx, p.y - p.vy); p.life = 0; }
    if (Math.random() < 0.5) { const c = p.kind === 'fire' ? [1, 0.5, 0.1] : p.kind === 'bolt' ? [0.6, 0.85, 1] : p.kind === 'soul' ? [0.5, 0.9, 1] : p.col || [1, 1, 1]; if (p.kind !== 'arrow') parts.push({ type: 'glow', x: p.x, y: p.y, z: p.z, vx: rnd(-10, 10), vy: rnd(-10, 10), vz: rnd(-5, 10), life: 0.25, s: p.kind === 'fire' ? 4 : 2.5, c, g: 0 }); }
  }
  projs = projs.filter(p => p.life > 0);
}
function projHit(p) {
  if (p.kind === 'fire') { SFX.play('boom'); waves.push({ x: p.x, y: p.y, t: 0, dur: 0.25, R: 26, c: [1, 0.5, 0.1] }); explodeFx(p.x, p.y, [1, 0.55, 0.15]); for (const e of enemies) if (!e.dead && !e.spawnT && d2(e.x, e.y, p.x, p.y) < 30 * 30 && !p.hit.has(e)) hurtEnemy(e, p.dmg * 0.6, e.x - p.x, e.y - p.y, 60, true); }
  else for (let i = 0; i < 4; i++) parts.push({ type: 'glow', x: p.x, y: p.y, z: p.z, vx: rnd(-40, 40), vy: rnd(-40, 40), vz: rnd(0, 40), life: 0.25, s: 2.5, c: p.col || [1, 1, 1], g: 0 });
}
function hitProp(p, dmg) {
  p.hp -= dmg; p.flash = 0.1; if (p.hp > 0) return;
  SFX.play('break'); explodeModel(MD[p.kind], p.x, p.y, 0, 1, 24); props.splice(props.indexOf(p), 1);
  const r = Math.random(); if (r < 0.5) for (let i = 0; i < irnd(1, 3); i++) dropPickup('coin', p.x, p.y); else if (r < 0.6) dropPickup('heart', p.x, p.y);
}
function updateHazards(dt) {
  for (const h of hazards) { h.t -= dt; if (h.t <= 0) { SFX.play('boom'); CAM.shake = Math.max(CAM.shake, 5); explodeModel(MD.rock, h.x, h.y, 0, 1, 16); if (d2(h.x, h.y, P.x, P.y) < (h.R + P.r) ** 2) hurtPlayer(h.dmg, h.x, h.y); } }
  hazards = hazards.filter(h => h.t > 0);
  for (const w of waves) if (w.hurt && !w.hitP && w.t > 0) { const R = w.R * (w.t / w.dur), d = Math.hypot(P.x - w.x, P.y - w.y); if (Math.abs(d - R) < 8) { w.hitP = true; hurtPlayer(w.hurt, w.x, w.y); } }
}
function dropPickup(type, x, y) { const a = rnd(TAU), s = rnd(20, 70); pickups.push({ type, x, y, z: 4, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rnd(60, 120), t: 0, a: rnd(TAU) }); }
function updatePickups(dt) {
  const mag = P.st.gold > 1 ? 70 : 34;
  for (const p of pickups) {
    p.t += dt; p.vz -= 300 * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.4; p.vx *= 0.7; p.vy *= 0.7; }
    p.vx *= Math.pow(0.1, dt); p.vy *= Math.pow(0.1, dt); p.x += p.vx * dt; p.y += p.vy * dt; collide({ get x() { return p.x; }, set x(v) { p.x = v; }, get y() { return p.y; }, set y(v) { p.y = v; }, r: 3 });
    const d = Math.hypot(P.x - p.x, P.y - p.y);
    if (p.t > 0.4 && d < mag && !(p.type === 'heart' && P.hp >= P.maxHp)) { p.x += (P.x - p.x) / d * 200 * dt; p.y += (P.y - p.y) / d * 200 * dt; }
    if (p.t > 0.4 && d < 9 && !P.dead) {
      if (p.type === 'coin') { G.gold++; SFX.play('coin'); p.dead = true; }
      else if (p.type === 'heart' && P.hp < P.maxHp) { healP(20); SFX.play('pick'); p.dead = true; }
      else if (p.type === 'potion') { healP(50); SFX.play('pick'); p.dead = true; }
    }
  }
  pickups = pickups.filter(p => !p.dead);
}
function doInteract(o) {
  if (o.kind === 'chest') {
    o.open = true; SFX.play('chest'); explodeFx(o.x, o.y, [1, 0.85, 0.3]); CAM.shake = 3;
    if (o.loot === 'weapon') openChoice('BİR SİLAH SEÇ', [weaponCard(), weaponCard(), relicCard(o.big ? 2 : 1)]);
    else openChoice('BİR GÜÇ SEÇ', [relicCard(o.big ? 1 : 0), relicCard(o.big ? 2 : 0), relicCard(o.big ? 2 : 1)]);
  } else if (o.kind === 'shop' && !o.sold) {
    if (G.gold < o.it.price) { SFX.play('deny'); addText(o.x, o.y, 'YETERSİZ ALTIN', '#ff6060', 1); return; }
    G.gold -= o.it.price; o.sold = true; SFX.play('buy');
    if (o.it.t === 'potion') { healP(60); }
    else if (o.it.t === 'relic') applyCard({ u: o.it.u });
    else applyCard({ w: o.it.w });
    explodeFx(o.x, o.y, [1, 0.85, 0.3]);
  }
}
function rollUpg(minR = 0) { const w = [60, 30, 10]; let pool = UPG.filter(u => u.r >= minR); const tot = pool.reduce((s, u) => s + w[u.r], 0); let k = rnd(tot); for (const u of pool) { k -= w[u.r]; if (k <= 0) return u; } return pool[0]; }
function rollWeapon() { const ks = Object.keys(WEAPONS).filter(k => k !== P.weapon); return pick(ks); }
function relicCard(minR) { return { u: rollUpg(minR) }; }
function weaponCard() { return { w: rollWeapon() }; }
function openChoice(title, cards) {
  // aynı kartı engelle
  const seenK = new Set(); cards = cards.map(c => { let k = c.u ? c.u.id : c.w; let g = 0; while (seenK.has(k) && g++ < 20) { c = c.u ? relicCard(c.u.r) : weaponCard(); k = c.u ? c.u.id : c.w; } seenK.add(k); return c; });
  G.modal = { type: 'choice', title, cards, t: 0 }; IN.atk = null; IN.joy = null;
}
function applyCard(c) {
  if (c.u) { c.u.f(P); P.relics[c.u.id] = (P.relics[c.u.id] || 0) + 1; addText(P.x, P.y, c.u.n, '#' + RARC[c.u.r].toString(16).padStart(6, '0'), 1.1); }
  if (c.w) { P.weapon = c.w; addText(P.x, P.y, WEAPONS[c.w].n, '#ffd040', 1.1); }
  SFX.play('up'); waves.push({ x: P.x, y: P.y, t: 0, dur: 0.5, R: 40, c: [1, 0.9, 0.5] });
}

// ---------------------------------------------------------------------
//  Odalar
// ---------------------------------------------------------------------
function updateRooms(dt) {
  const tx = Math.floor(P.x / T), ty = Math.floor(P.y / T);
  for (let y = ty - 2; y <= ty + 2; y++) for (let x = tx - 2; x <= tx + 2; x++) if (x >= 0 && y >= 0 && x < MW && y < MH) seen[idx(x, y)] = 1;
  const ri = roomAt[idx(clamp(tx, 0, MW - 1), clamp(ty, 0, MH - 1))];
  if (ri >= 0) {
    const r = rooms[ri]; if (!r.explored) { r.explored = true; reveal(r); }
    const inside = P.x > r.x * T + 6 && P.x < (r.x + r.w) * T - 6 && P.y > r.y * T + 6 && P.y < (r.y + r.h) * T - 6;
    if (r.state === 'idle' && inside) startRoom(r);
  }
  const r = G.cur;
  if (r && r.state === 'fight') {
    const alive = enemies.some(e => e.room === r && !e.dead);
    if (!alive) { if (r.wave < r.waves) spawnWave(r); else clearRoom(r); }
  }
  // portal
  for (const o of inter) if (o.kind === 'portal' && d2(o.x, o.y, P.x, P.y) < 12 * 12 && !G.fadeCb && !P.dead) nextFloor();
}
function startRoom(r) {
  r.state = 'fight'; G.cur = r; r.wave = 0; SFX.play('door'); CAM.shake = 3; P.shield = P.st.shield;
  for (const d of r.doors) { blocked[idx(d.x, d.y)] = 1; bars.push({ x: d.x * T + 8, y: d.y * T + 8, a: d.v ? Math.PI / 2 : 0, z: -22, up: true, room: r }); }
  // kapıda kalan oyuncuyu içeri it
  collide(P);
  spawnWave(r);
}
function spawnWave(r) {
  r.wave++; const n = G.floor;
  if (r.type === 'boss') { const bt = (Math.floor(n / 3) % 2 === 1) ? 'golem' : 'lich'; spawnEnemy(bt, r.cx, r.cy + 30, r, false); return; }
  const pool = [['slime', 3], ['bat', 2], ['skel', 3]]; if (n >= 2) pool.push(['archer', 2]); if (n >= 3) pool.push(['mage', 1.5]); if (n >= 4) pool.push(['orc', 1]); if (n >= 6) pool.push(['orc', 1], ['mage', 1]);
  const tot = pool.reduce((s, p) => s + p[1], 0);
  const cnt = Math.min(8, 2 + Math.floor(r.w * r.h / 36) + Math.floor(n / 3) + r.wave - 1);
  for (let i = 0; i < cnt; i++) {
    let k = rnd(tot), t = pool[0][0]; for (const [tt, w] of pool) { k -= w; if (k <= 0) { t = tt; break; } }
    let p = null; for (let g = 0; g < 20; g++) { const q = freeTile(r, 1); if (q && Math.hypot(q[0] - P.x, q[1] - P.y) > 50) { p = q; break; } }
    if (!p) continue;
    spawnEnemy(t, p[0], p[1], r, Math.random() < 0.06 + n * 0.025, 0.9 + i * 0.08);
  }
}
function clearRoom(r) {
  r.state = 'cleared'; G.cur = null; SFX.play('clear'); SFX.play('door');
  for (const b of bars) if (b.room === r) b.up = false;
  for (const d of r.doors) blocked[idx(d.x, d.y)] = 0;
  if (r.type !== 'boss') G.banner = { t: 0, a: 'ODA TEMİZLENDİ', b: '', small: true };
  const cx = r.cx, cy = r.cy;
  if (r.type === 'combat') {
    if (r.reward === 'chest') inter.push({ kind: 'chest', x: cx, y: cy, big: false, open: false, loot: Math.random() < 0.2 ? 'weapon' : 'relic' });
    else if (r.reward === 'gold') for (let i = 0; i < 8 + G.floor * 2; i++) dropPickup('coin', cx, cy);
    else { dropPickup('heart', cx, cy); dropPickup('heart', cx, cy); for (let i = 0; i < 4; i++) dropPickup('coin', cx, cy); }
  }
  if (r.type === 'stairs' || r.type === 'boss') {
    inter.push({ kind: 'portal', x: cx, y: cy, t: 0 }); sLights.push({ x: cx, y: cy, z: 10, r: 120, c: [0.7, 0.4, 1.0], fl: 0 });
    G.banner = { t: 0, a: r.type === 'boss' ? 'BOSS YENİLDİ!' : 'PORTAL AÇILDI', b: 'Bir sonraki kata in' };
  }
  if (r.type === 'boss') { inter.push({ kind: 'chest', x: cx - 30, y: cy, big: true, open: false, loot: 'relic' }); inter.push({ kind: 'chest', x: cx + 30, y: cy, big: true, open: false, loot: 'weapon' }); for (let i = 0; i < 3; i++) dropPickup('heart', cx, cy - 20); P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.3); }
}
let motes = [];
function updateMotes(dt) {
  for (const m of motes) { m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt; }
  motes = motes.filter(m => m.t < m.life);
  const tc = BIOMES[G.biome].torch;
  while (motes.length < 70) motes.push({ x: CAM.x + rnd(-200, 200), y: CAM.y + rnd(-120, 220), z: rnd(2, 40), vx: rnd(-4, 4), vy: rnd(-4, 4), vz: rnd(-2, 4), t: 0, life: rnd(3, 7), ph: rnd(TAU), c: Math.random() < 0.6 ? [tc[0], tc[1], tc[2]] : [0.7, 0.8, 1] });
}
function addText(x, y, s, c, sc = 1) { texts.push({ x: x + rnd(-4, 4), y: y + rnd(-4, 4), z: 24, s: String(s), c, sc, t: 0 }); }

// ---------------------------------------------------------------------
//  Kamera ve çizim
// ---------------------------------------------------------------------
let VP = null;
function updateCamera(dt) {
  const k = Math.min(1, dt * 7);
  const lead = G.state === 'play' ? 0.18 : 0;
  CAM.x = lerp(CAM.x, P.x + P.vx * lead, k); CAM.y = lerp(CAM.y, P.y + P.vy * lead + (G.state === 'title' ? 22 : 0), k);
  // hafif derinlik salınımı (kamera dönmez, sadece paralaks hissi)
  CAM.sway = lerp(CAM.sway, clamp(P.vx / 74, -1, 1) * 0.05, Math.min(1, dt * 2));
  CAM.yaw = Math.PI / 2 + CAM.sway;
  CAM.shake = Math.max(0, CAM.shake - dt * 30);
  CAM.dist = lerp(CAM.dist, (G.state === 'title' ? 110 : 172) - (CAM.punch || 0) * 14, Math.min(1, dt * 6));
}
function project(x, y, z) {
  const m = VP, cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cz = m[2] * x + m[6] * y + m[10] * z + m[14], cw = m[3] * x + m[7] * y + m[11] * z + m[15];
  if (cw <= 0) return null; return [(cx / cw * 0.5 + 0.5) * W, (1 - (cy / cw * 0.5 + 0.5)) * H, cz / cw];
}
function render() {
  const gl = R3.gl; gl.viewport(0, 0, cvs.width, cvs.height);
  const B = BIOMES[G.biome]; const fog = c3(B.fog);
  gl.clearColor(fog[0], fog[1], fog[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const sh = CAM.shake; const sx = rnd(-sh, sh) * 0.6, sy = rnd(-sh, sh) * 0.6;
  const tx = CAM.x + sx, ty = CAM.y + sy, tz = 8;
  const cp = Math.cos(CAM.pitch), spp = Math.sin(CAM.pitch);
  const eye = [tx - Math.cos(CAM.yaw) * cp * CAM.dist, ty - Math.sin(CAM.yaw) * cp * CAM.dist, tz + spp * CAM.dist];
  const view = M4.look(eye, [tx, ty, tz], [0, 0, 1]); R3.right = view.right; R3.up = view.up;
  const aspect = cvs.width / cvs.height; const fov = aspect < 1 ? 0.95 : 0.62;
  const proj = M4.persp(fov, aspect, 30, 1400); VP = M4.mul(proj, view);
  gl.uniformMatrix4fv(R3.u.uVP, false, VP);
  // ışıklar
  const L = [];
  if (!P.dead) L.push({ x: P.x, y: P.y, z: 22, r: 150, c: [0.85, 0.75, 0.6] });
  for (const l of sLights) { const f = l.fl ? 0.85 + Math.sin(G.t * 13 + l.x) * 0.08 + Math.sin(G.t * 7.3 + l.y) * 0.07 : 1; L.push({ x: l.x, y: l.y, z: l.z, r: l.r * f, c: l.c, d: d2(l.x, l.y, CAM.x, CAM.y) }); }
  for (const p of projs) L.push({ x: p.x, y: p.y, z: p.z, r: 55, c: p.kind === 'fire' ? [1, 0.5, 0.15] : p.from === 'e' ? (p.col || [0.8, 0.4, 1]) : [0.5, 0.8, 1], d: d2(p.x, p.y, CAM.x, CAM.y) + 2000 });
  for (const o of inter) if (o.kind === 'portal') L.push({ x: o.x, y: o.y, z: 12, r: 130, c: [0.7, 0.35, 1], d: 0 });
  for (const e of enemies) if (e.type === 'lich' || e.type === 'golem') L.push({ x: e.x, y: e.y, z: 30, r: 120, c: e.type === 'lich' ? [0.3, 0.9, 0.5] : [0.4, 0.8, 1], d: 0 });
  L.sort((a, b) => (a.d || 0) - (b.d || 0));
  const LP = new Float32Array(64), LC = new Float32Array(48); const nl = Math.min(16, L.length);
  for (let i = 0; i < nl; i++) { const l = L[i]; LP.set([l.x, l.y, l.z, l.r], i * 4); LC.set(l.c, i * 3); }
  gl.uniform4fv(R3.u.uL, LP); gl.uniform3fv(R3.u.uLC, LC); gl.uniform1i(R3.u.uNL, nl);
  gl.uniform3fv(R3.u.uAmb, B.amb.map(v => v * 0.6)); gl.uniform3fv(R3.u.uFog, fog); gl.uniform3f(R3.u.uTgt, CAM.x, CAM.y, 0); gl.uniform2f(R3.u.uFogR, 170, 300);
  { const k = [-0.45, -0.55, 0.7], l = Math.hypot(...k); gl.uniform3f(R3.u.uKey, k[0] / l, k[1] / l, k[2] / l); const kc = B.amb; gl.uniform3f(R3.u.uKeyC, kc[0] * 0.55, kc[1] * 0.55, kc[2] * 0.6); }
  // x-ışını (duvar arkasında oyuncu)
  const ps = project(P.x, P.y, 10);
  if (ps && !P.dead) { const k = cvs.width / W; gl.uniform3f(R3.u.uX, ps[0] * k, cvs.height - ps[1] * k, cvs.height * 0.14); gl.uniform1f(R3.u.uXz, ps[2] * 0.5 + 0.5 - 0.0004); } else gl.uniform3f(R3.u.uX, -999, -999, 1);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, R3.ibo); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, R3.ntex); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, R3.tex);
  // --- opak ---
  gl.disable(gl.BLEND); gl.depthMask(true); gl.uniform1i(R3.u.uMode, 0);
  const vr2 = 380 * 380; for (const c of chunks) if (d2(c.x, c.y, CAM.x, CAM.y + 60) < vr2) drawChunk(c);
  const O = BUF.op, BL = BUF.bl, AD = BUF.ad; O.reset(); BL.reset(); AD.reset();
  buildDynamic(O, BL, AD);
  O.upload(); O.draw();
  // --- gölgeler / işaretler ---
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.uniform1i(R3.u.uMode, 1);
  BL.upload(); BL.draw();
  // --- parıltılar ---
  gl.blendFunc(gl.ONE, gl.ONE); gl.uniform1i(R3.u.uMode, 2);
  AD.upload(); AD.draw();
  gl.depthMask(true); gl.disable(gl.BLEND);
}
function shadow(BL, x, y, r, a = 0.5) { pushFlat(BL, x, y, 0.15, r, 0, SPR.shadow, 0, 0, 0, a); }
function buildDynamic(O, BL, AD) {
  const t = G.t;
  // alevler
  for (const f of flames) {
    if (d2(f.x, f.y, CAM.x, CAM.y) > 360 * 360) continue;
    const fr = Math.floor(t * 9 + f.x) % 3; pushModel(O, MD.flame[fr], f.x, f.y, f.z, t * 2 + f.y, f.s * (0.95 + Math.sin(t * 20 + f.x) * 0.06));
    const tc = BIOMES[G.biome].torch; pushBill(AD, f.x, f.y, f.z + 4, 14 * f.s, SPR.soft, tc[0], tc[1] * 0.9, tc[2] * 0.8, 0.28 + Math.sin(t * 11 + f.x) * 0.05);
  }
  // kapı parmaklıkları
  for (const b of bars) pushModel(O, MD.bars, b.x, b.y, b.z, b.a, 1, { o: 1 });
  // sandıklar, dükkan, portal
  for (const o of inter) {
    if (o.kind === 'chest') { const m = o.big ? (o.open ? MD.bigChestOpen : MD.bigChest) : (o.open ? MD.chestOpen : MD.chest); pushModel(O, m, o.x, o.y, 0, -Math.PI / 2 + 0.0, 1); shadow(BL, o.x, o.y, o.big ? 13 : 10); if (!o.open) pushBill(AD, o.x, o.y, 8, 22 + Math.sin(t * 4) * 3, SPR.soft, 1, 0.8, 0.3, 0.18); }
    else if (o.kind === 'merchant') { pushModel(O, MD.merchant, o.x, o.y, 0, Math.atan2(P.y - o.y, P.x - o.x), 1); shadow(BL, o.x, o.y, 8); }
    else if (o.kind === 'shop' && !o.sold) { const it = o.it; const m = it.t === 'potion' ? MD.potion : it.t === 'weapon' ? MD[WEAPONS[it.w].m] : MD.gem[it.u.r]; pushModel(O, m, o.x, o.y, 9 + Math.sin(t * 2 + o.x) * 1.5, t * 1.5, 1); pushBill(AD, o.x, o.y, 13, 14, SPR.soft, 1, 0.85, 0.5, 0.2); }
    else if (o.kind === 'portal') { o.t = (o.t || 0); pushModel(O, MD.portal, o.x, o.y, 0.2, t * 1.2, 1, { e: 1 }); pushBill(AD, o.x, o.y, 14, 30 + Math.sin(t * 3) * 4, SPR.soft, 0.6, 0.3, 1, 0.35); if (Math.random() < 0.5) parts.push({ type: 'glow', x: o.x + rnd(-12, 12), y: o.y + rnd(-12, 12), z: 1, vx: 0, vy: 0, vz: rnd(20, 50), life: 0.8, s: 2.5, c: [0.75, 0.45, 1], g: 0 }); }
  }
  // kırılabilir objeler
  for (const p of props) { p.flash = Math.max(0, (p.flash || 0) - 1 / 60); pushModel(O, MD[p.kind], p.x, p.y, 0, p.a, 1, { f: p.flash > 0 ? 0.8 : 0 }); shadow(BL, p.x, p.y, 7, 0.4); }
  // eşyalar
  for (const p of pickups) { const m = p.type === 'coin' ? MD.coin : p.type === 'heart' ? MD.heart : MD.potion; const bob = p.z < 0.5 ? 2 + Math.sin(t * 4 + p.a) * 1.5 : 0; pushModel(O, m, p.x, p.y, p.z + bob, t * 4 + p.a, p.type === 'coin' ? 0.9 : 0.85, { e: p.type === 'coin' ? 0.3 : 0 }); shadow(BL, p.x, p.y, 3, 0.35); if (p.type === 'coin') pushBill(AD, p.x, p.y, p.z + bob + 2, 5, SPR.soft, 1, 0.8, 0.3, 0.25); }
  // hayaletler (atılım izi)
  for (const g of ghosts) pushModel(O, MD.hero[0], g.x, g.y, 0, g.ang, 1, { r: 0.4, g: 0.8, b: 1.4, a: g.t / 0.25 * 0.6, e: 0.6 });
  // oyuncu
  if (!P.dead) {
    const fr = P.moving ? 1 + (Math.floor(P.anim / 7) % 2) : 0, bob = P.moving ? Math.abs(Math.sin(P.anim * 0.45)) * 1.2 : Math.sin(G.t * 2.5) * 0.3;
    const blink = P.inv > 0 && P.dashT <= 0 && Math.floor(G.t * 20) % 2 === 0;
    const sc = G.state === 'title' ? 1.0 : 1;
    pushModel(O, MD.hero[fr], P.x, P.y, Math.max(0, bob), P.ang, sc, { f: P.hurtT > 0 ? 0.8 : 0, a: blink ? 0.45 : 1 });
    shadow(BL, P.x, P.y, 8);
    drawWeapon(O, AD);
    if (P.shield > 0) pushBill(AD, P.x, P.y, 10, 18, SPR.ring, 1, 0.85, 0.4, 0.35 + Math.sin(t * 5) * 0.1);
    for (let i = 0; i < P.st.orbit; i++) { const a = P.orbA + i * TAU / P.st.orbit, ox = P.x + Math.cos(a) * 26, oy = P.y + Math.sin(a) * 26; pushModel(O, MD.blade, ox, oy, 8, a + Math.PI / 2, 0.8, { e: 0.5 }); pushBill(AD, ox, oy, 9, 9, SPR.soft, 0.4, 0.8, 1, 0.3); }
    if (G.interact && G.state === 'play') pushBill(AD, G.interact.x, G.interact.y, 22 + Math.sin(t * 6) * 2, 8, SPR.ring, 1, 0.9, 0.4, 0.8);
  }
  // düşmanlar
  for (const e of enemies) {
    const D = ET[e.type], m = enemyModel(e);
    if (e.spawnT > 0) { const k = 1 - e.spawnT / (D.boss ? 1.6 : 0.9); pushFlat(BL, e.x, e.y, 0.3, e.r * 2.2 * (D.boss ? 1.3 : 1), t * 3, SPR.ring, 1, 0.2, 0.25, 0.5 + k * 0.5); pushFlat(BL, e.x, e.y, 0.25, e.r * 2 * k, -t * 2, SPR.disc, 1, 0.2, 0.25, 0.4); if (k > 0.6) pushModel(O, m, e.x, e.y, -(1 - k) * 30, e.ang, e.sc * (D.boss ? 1.4 : 1) * k, { e: 0.5, r: 1.5, g: 0.5, b: 0.5 }); continue; }
    let sz = 1, sc = e.sc * (D.boss ? 1.4 : 1);
    if (e.type === 'slime' || e.type === 'slimeS') { sz = e.st === 'hop' ? 1.2 : 0.85 + Math.sin(G.t * 6 + e.anim) * 0.06; }
    const tint = e.elite ? { r: 1.25, g: 1.05, b: 0.6 } : { r: 1, g: 1, b: 1 };
    const wind = (e.st === 'wind' || e.st === 'cwind' || e.st === 'aim' || e.st === 'cast' || e.st === 'slamW') && Math.floor(G.t * 16) % 2 === 0;
    pushModel(O, m, e.x, e.y, e.z, e.ang, sc, { ...tint, sz, f: e.flash > 0 ? 0.9 : wind ? 0.35 : 0, e: e.elite ? 0.15 : 0 });
    shadow(BL, e.x, e.y, e.r * 1.2 * (D.boss ? 1.2 : 1), e.z > 2 ? 0.3 : 0.5);
    if (e.elite) pushFlat(BL, e.x, e.y, 0.35, e.r * 1.7, t * 2, SPR.ring, 1, 0.8, 0.2, 0.6);
    if (e.type === 'skel') { const sw = e.swing != null ? lerp(-1.4, 1.2, e.swing) : -0.3; const a = e.ang + sw, hx = e.x + Math.cos(e.ang - 1.2) * 5 * sc, hy = e.y + Math.sin(e.ang - 1.2) * 5 * sc; pushModel(O, MD.e_sword, hx, hy, 6 * sc, a, 0.75 * sc, { f: e.flash > 0 ? 0.9 : 0 }); }
    if (e.type === 'archer') { const hx = e.x + Math.cos(e.ang) * 6, hy = e.y + Math.sin(e.ang) * 6; pushModel(O, MD.e_bow, hx, hy, 7, e.ang, 1); if (e.st === 'aim') { const k = 1 - e.sT / 0.6; pushQuad4(BL, aimLine(e.x, e.y, e.ang, 200, 0.6), 1, null, 1, 0.2, 0.2, 0.15 + k * 0.4); } }
    if (e.st === 'cwind') pushQuad4(BL, aimLine(e.x, e.y, e.ang, 160, 5), 0.4, null, 1, 0.3, 0.2, 0.35);
    if (e.type === 'mage' || e.type === 'lich') pushBill(AD, e.x + Math.cos(e.ang - 1) * 6, e.y + Math.sin(e.ang - 1) * 6, (e.type === 'lich' ? 45 : 18) + e.z, e.type === 'lich' ? 12 : 7, SPR.soft, e.type === 'lich' ? 0.3 : 0.8, e.type === 'lich' ? 1 : 0.3, e.type === 'lich' ? 0.5 : 1, 0.5);
    if (e.burn > 0) pushBill(AD, e.x, e.y, 10, 10, SPR.soft, 1, 0.45, 0.1, 0.25);
  }
  // mermiler
  for (const p of projs) {
    if (p.kind === 'arrow' || p.kind === 'bolt') { pushModel(O, p.kind === 'arrow' ? MD.arrow : MD.bolt, p.x, p.y, p.z, Math.atan2(p.vy, p.vx), 1, { e: p.kind === 'bolt' ? 0.6 : 0 }); if (p.kind === 'bolt') pushBill(AD, p.x, p.y, p.z, 7, SPR.soft, 0.5, 0.8, 1, 0.5); }
    else { const c = p.kind === 'fire' ? [1, 0.5, 0.12] : p.kind === 'soul' ? [0.4, 0.85, 1] : (p.col || [0.85, 0.4, 1]); const s = p.kind === 'fire' ? 9 : p.from === 'e' ? 8 : 6; pushBill(AD, p.x, p.y, p.z, s, SPR.soft, c[0], c[1], c[2], 0.9); pushBill(O, p.x, p.y, p.z, p.r * 0.6, SPR.white, Math.min(1, c[0] + 0.5), Math.min(1, c[1] + 0.5), Math.min(1, c[2] + 0.5), 1, 1); }
    shadow(BL, p.x, p.y, 3, 0.3);
  }
  // tehlikeler
  for (const h of hazards) { const k = 1 - h.t / h.max; pushFlat(BL, h.x, h.y, 0.3, h.R, 0, SPR.disc, 1, 0.2, 0.15, 0.35 + k * 0.4); pushFlat(BL, h.x, h.y, 0.32, h.R * k, 0, SPR.shadow, 0, 0, 0, 0.6); pushModel(O, MD.rock, h.x, h.y, h.t * 260, h.t * 5, 1.3); }
  // şok dalgaları
  for (const w of waves) { if (w.t < 0) continue; const k = w.t / w.dur, R = w.R * k; pushFlat(AD, w.x, w.y, 1, Math.max(1, R), 0, SPR.ring, w.c[0], w.c[1], w.c[2], (1 - k) * (w.hurt ? 1 : 0.8)); if (w.hurt) pushFlat(BL, w.x, w.y, 0.4, Math.max(1, R), 0, SPR.ring, 1, 0.3, 0.2, (1 - k) * 0.6); }
  for (const m of motes) { const a = Math.min(1, m.t * 2, (m.life - m.t) * 2) * (0.5 + Math.sin(G.t * 3 + m.ph) * 0.5); pushBill(AD, m.x, m.y, m.z, 0.9, SPR.soft, m.c[0], m.c[1], m.c[2], a * 0.8); }
  // parçacıklar
  for (const p of parts) {
    const k = Math.max(0, p.life);
    if (p.type === 'cube') { const s = p.s * Math.min(1, k * 3); pushBill(O, p.x, p.y, p.z + s, s, SPR.white, p.c[0], p.c[1], p.c[2], 1, 0); }
    else if (p.type === 'spark') { const L = 0.035, U = R3.up, w = 0.7; const x1 = p.x - p.vx * L, y1 = p.y - p.vy * L, z1 = p.z - p.vz * L; const a = Math.min(1, k * 8); pushQuad4(AD, [[p.x - U[0] * w, p.y - U[1] * w, p.z - U[2] * w], [p.x + U[0] * w, p.y + U[1] * w, p.z + U[2] * w], [x1 + U[0] * w * 0.3, y1 + U[1] * w * 0.3, z1 + U[2] * w * 0.3], [x1 - U[0] * w * 0.3, y1 - U[1] * w * 0.3, z1 - U[2] * w * 0.3]], 0, null, p.c[0] * a, p.c[1] * a, p.c[2] * a, 1); }
    else pushBill(AD, p.x, p.y, p.z, p.s * Math.min(1, k * 4), SPR.soft, p.c[0], p.c[1], p.c[2], Math.min(1, k * 4));
  }
}
function aimLine(x, y, a, len, w) { const c = Math.cos(a), s = Math.sin(a), nx = -s * w, ny = c * w; return [[x + nx, y + ny], [x - nx, y - ny], [x + c * len - nx, y + s * len - ny], [x + c * len + nx, y + s * len + ny]].map(p => [p[0], p[1], 0.5]); }
function drawWeapon(O, AD) {
  const W0 = WEAPONS[P.weapon], m = MD[W0.m]; const a = P.ang;
  let wa = a - 0.35, push = 0, hx, hy, z = 7;
  const sw = P.swing;
  if (sw && !sw.recoil) {
    const k = sw.t / sw.dur, e = 1 - Math.pow(1 - k, 3);
    if (sw.thrust) { wa = a; push = Math.sin(k * Math.PI) * 18; }
    else wa = a + lerp(sw.a0, sw.a1, e);
    // savuruş izi
    if (!sw.thrust) {
      const n = 10, R0 = 8, R1 = sw.range * 0.95; const from = a + sw.a0, to = a + lerp(sw.a0, sw.a1, e);
      for (let i = 0; i < n; i++) {
        const t0 = from + (to - from) * i / n, t1 = from + (to - from) * (i + 1) / n, al = (i + 1) / n * (1 - k) * 0.9;
        const pts = [[P.x + Math.cos(t0) * R0, P.y + Math.sin(t0) * R0, 7], [P.x + Math.cos(t0) * R1, P.y + Math.sin(t0) * R1, 7], [P.x + Math.cos(t1) * R1, P.y + Math.sin(t1) * R1, 7], [P.x + Math.cos(t1) * R0, P.y + Math.sin(t1) * R0, 7]];
        pushQuad4(AD, pts, 7, null, 0.35 * al, 0.55 * al, 0.9 * al, 1);
        const R2 = R1 * 0.86, e1 = [[P.x + Math.cos(t0) * R2, P.y + Math.sin(t0) * R2, 7.2], [P.x + Math.cos(t0) * R1, P.y + Math.sin(t0) * R1, 7.2], [P.x + Math.cos(t1) * R1, P.y + Math.sin(t1) * R1, 7.2], [P.x + Math.cos(t1) * R2, P.y + Math.sin(t1) * R2, 7.2]];
        pushQuad4(AD, e1, 7, null, al * 1.2, al * 1.15, al, 1);
      }
    } else {
      const al = Math.sin(k * Math.PI);
      pushQuad4(AD, aimLine(P.x, P.y, a, sw.range, 3).map(p => [p[0], p[1], 7]), 7, null, 0.7 * al, 0.9 * al, al, 0.6);
    }
  }
  const rx = Math.cos(a - Math.PI / 2), ry = Math.sin(a - Math.PI / 2);
  hx = P.x + rx * 5 + Math.cos(a) * (2 + push); hy = P.y + ry * 5 + Math.sin(a) * (2 + push);
  if (sw && sw.recoil) { const k = 1 - sw.t / sw.dur; hx -= Math.cos(a) * k * 3; hy -= Math.sin(a) * k * 3; wa = a; }
  if (W0.type === 'proj') wa = a;
  pushModel(O, m, hx, hy, z, wa, P.weapon === 'spear' ? 0.85 : 0.8);
}

// ---------------------------------------------------------------------
//  Arayüz
// ---------------------------------------------------------------------
const LayerCache = new WeakMap();
function layerImgs(m) {
  let a = LayerCache.get(m); if (a) return a;
  a = m.L.map(L => { const c = document.createElement('canvas'); c.width = m.w; c.height = m.d; const x = c.getContext('2d'); const id = x.createImageData(m.w, m.d); const ux = Math.round(L.uv[0] * ATS), uy = Math.round(L.uv[1] * ATS); for (let yy = 0; yy < m.d; yy++) for (let xx = 0; xx < m.w; xx++) { const s = ((uy + yy) * ATS + ux + xx) * 4, d = (yy * m.w + xx) * 4; const al = Atlas.data[s + 3]; id.data[d] = Atlas.data[s]; id.data[d + 1] = Atlas.data[s + 1]; id.data[d + 2] = Atlas.data[s + 2]; id.data[d + 3] = al > 100 ? 255 : 0; } x.putImageData(id, 0, 0); return c; });
  LayerCache.set(m, a); return a;
}
// 2D sprite-stack (kartlar ve menü için)
function drawStack2D(c, m, x, y, ang, s) {
  const imgs = layerImgs(m); c.imageSmoothingEnabled = false; const sq = 0.62;
  for (let i = 0; i < m.L.length; i++) { const L = m.L[i]; for (let k = 0; k < 2; k++) { c.save(); c.translate(x, y - (L.z + k * 0.5) * s * sq + m.h * s * sq * 0.5); c.scale(s, s * sq); c.rotate(-ang); c.drawImage(imgs[i], -m.w / 2, -m.d / 2); c.restore(); } }
}
function btn(c, b, label, active, fill) {
  c.save(); const r = b.r * (active ? 0.94 : 1);
  const g = c.createRadialGradient(b.x - r * 0.3, b.y - r * 0.4, r * 0.1, b.x, b.y, r); g.addColorStop(0, active ? 'rgba(120,110,160,0.75)' : 'rgba(70,64,100,0.55)'); g.addColorStop(1, active ? 'rgba(30,24,50,0.85)' : 'rgba(14,12,24,0.6)');
  c.beginPath(); c.arc(b.x, b.y, r, 0, TAU); c.fillStyle = g; c.fill();
  c.lineWidth = Math.max(2, r * 0.07); c.strokeStyle = 'rgba(0,0,0,0.55)'; c.stroke();
  c.beginPath(); c.arc(b.x, b.y, r * 0.9, 0, TAU); c.lineWidth = Math.max(1, r * 0.035); c.strokeStyle = active ? 'rgba(255,220,140,0.9)' : 'rgba(255,255,255,0.28)'; c.stroke();
  if (fill !== undefined && fill < 1) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * fill); c.closePath(); c.fillStyle = 'rgba(0,0,0,0.45)'; c.fill(); }
  c.restore();
}
function drawIconSword(c, x, y, s, col = '#fff') { c.save(); c.translate(x, y); c.rotate(-Math.PI / 4); c.fillStyle = col; c.fillRect(-s * 0.08, -s * 0.55, s * 0.16, s * 0.75); c.fillRect(-s * 0.28, s * 0.2, s * 0.56, s * 0.1); c.fillRect(-s * 0.06, s * 0.3, s * 0.12, s * 0.22); c.restore(); }
function drawUI(dt) {
  const c = ctx; c.clearRect(0, 0, W, H); c.imageSmoothingEnabled = false;
  const S = FSZ;
  // vinyet
  const g = c.createRadialGradient(W / 2, H / 2, MINS * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (G.hurtV > 0) { const g2 = c.createRadialGradient(W / 2, H / 2, MINS * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7); g2.addColorStop(0, 'rgba(255,0,0,0)'); g2.addColorStop(1, `rgba(200,0,0,${G.hurtV * 0.5})`); c.fillStyle = g2; c.fillRect(0, 0, W, H); }
  if (P.hp < P.maxHp * 0.25 && !P.dead && G.state === 'play') { const p = 0.15 + Math.sin(G.t * 6) * 0.1; const g3 = c.createRadialGradient(W / 2, H / 2, MINS * 0.4, W / 2, H / 2, Math.max(W, H) * 0.7); g3.addColorStop(0, 'rgba(255,0,0,0)'); g3.addColorStop(1, `rgba(160,0,0,${p})`); c.fillStyle = g3; c.fillRect(0, 0, W, H); }
  if (G.flash > 0) { c.fillStyle = `rgba(200,240,255,${G.flash * 0.5})`; c.fillRect(0, 0, W, H); }
  if (G.state === 'title') drawTitle(c, S);
  else {
    // hasar yazıları
    for (const t of texts) { const p = project(t.x, t.y, t.z); if (!p) continue; const a = 1 - Math.max(0, t.t - 0.6) / 0.3; c.globalAlpha = clamp(a, 0, 1); const sc = S * t.sc * (t.t < 0.1 ? 1 + (0.1 - t.t) * 5 : 1); txt(c, t.s, p[0], p[1], sc, t.c, 1); c.globalAlpha = 1; }
    // düşman can çubukları
    for (const e of enemies) { if (e.hitT <= 0 || ET[e.type].boss || e.spawnT > 0) continue; const p = project(e.x, e.y, 26 * e.sc + e.z); if (!p) continue; const w = MINS * 0.05, h = Math.max(3, S * 1.5); c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(p[0] - w / 2 - 1, p[1] - 1, w + 2, h + 2); c.fillStyle = e.elite ? '#ffc030' : '#e83030'; c.fillRect(p[0] - w / 2, p[1], w * clamp(e.hp / e.maxHp, 0, 1), h); }
    // dükkan fiyatları
    for (const o of inter) if (o.kind === 'shop' && !o.sold) { const p = project(o.x, o.y, 26); if (!p) continue; txt(c, o.it.price + ' $', p[0], p[1], S, G.gold >= o.it.price ? '#ffd040' : '#ff6060', 1); if (G.interact === o) { const nm = o.it.t === 'potion' ? 'Can İksiri (+60)' : o.it.t === 'weapon' ? WEAPONS[o.it.w].n : o.it.u.n; const ds = o.it.t === 'potion' ? '' : o.it.t === 'weapon' ? WEAPONS[o.it.w].d : o.it.u.d; txt(c, nm, p[0], p[1] - S * 24, S, '#fff', 1); if (ds) txt(c, ds, p[0], p[1] - S * 13, S * 0.8 < 1 ? 1 : Math.max(1, S - 1), '#c8c8d8', 1); } }
    if (G.state === 'play' || G.state === 'pause') drawHUD(c, S);
    if (G.banner) { const b = G.banner, a = b.t < 0.3 ? b.t / 0.3 : b.t > 2.4 ? (3 - b.t) / 0.6 : 1; c.globalAlpha = clamp(a, 0, 1); const y = H * 0.3; if (!b.small) { c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, y - S * 8, W, S * (b.b ? 34 : 22)); } txt(c, b.a, W / 2, y, S * (b.small ? 2 : 3), b.small ? '#a0ffa0' : '#ffe8a0', 1); if (b.b) txt(c, b.b, W / 2, y + S * 20, S * 1.4, '#d0d0e0', 1); c.globalAlpha = 1; }
    if (G.msg && G.state === 'play') { const a = Math.min(1, (5 - G.msg.t)); c.globalAlpha = clamp(a, 0, 1); txt(c, G.msg.s, W / 2, H * 0.82, S * 1.2, '#e0e0f0', 1); c.globalAlpha = 1; }
    if (G.modal) drawModal(c, S);
    if (G.state === 'pause') drawPause(c, S);
    if (G.state === 'dead' && G.deadT > 1.2) drawDead(c, S);
  }
  if (G.fade > 0) {
    const ps = VP && !P.dead ? project(P.x, P.y, 10) : null; const cx = ps ? ps[0] : W / 2, cy = ps ? ps[1] : H / 2;
    const R = Math.hypot(W, H) * Math.pow(1 - G.fade, 1.5);
    c.save(); c.beginPath(); c.rect(0, 0, W, H); if (R > 1) c.arc(cx, cy, R, 0, TAU, true); c.fillStyle = '#000'; c.fill('evenodd');
    if (R > 1) { c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.lineWidth = S * 2; c.strokeStyle = 'rgba(180,120,255,0.6)'; c.stroke(); }
    c.restore();
  }
}
function bar(c, x, y, w, h, v, col, bg = 'rgba(0,0,0,0.6)') { c.fillStyle = bg; c.fillRect(x - 2, y - 2, w + 4, h + 4); c.fillStyle = '#2a1a22'; c.fillRect(x, y, w, h); c.fillStyle = col; c.fillRect(x, y, w * clamp(v, 0, 1), h); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x, y, w * clamp(v, 0, 1), Math.max(1, h * 0.3)); }
function drawHUD(c, S) {
  const m = MINS * 0.04;
  // can
  const bw = MINS * 0.42, bh = S * 7;
  icon(c, 'heart', m + S * 6, m + bh / 2 + S, S * 1.3 * (P.hp < P.maxHp * 0.3 ? 1 + Math.abs(Math.sin(G.t * 6)) * 0.25 : 1));
  G.hpLag = G.hpLag == null ? P.hp : Math.max(P.hp, G.hpLag - P.maxHp * 0.6 / 60);
  bar(c, m + S * 14, m, bw, bh, G.hpLag / P.maxHp, '#fff0c0');
  c.fillStyle = P.hp < P.maxHp * 0.3 ? '#ff3040' : '#e83850'; c.fillRect(m + S * 14, m, bw * clamp(P.hp / P.maxHp, 0, 1), bh); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(m + S * 14, m, bw * clamp(P.hp / P.maxHp, 0, 1), Math.max(1, bh * 0.3));
  for (let i = 1; i < P.maxHp / 25; i++) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(m + S * 14 + bw * i * 25 / P.maxHp, m, Math.max(1, S / 2), bh); }
  txt(c, Math.ceil(P.hp) + '/' + P.maxHp, m + S * 14 + bw / 2, m + S * 0.5, S, '#fff', 1);
  for (let i = 0; i < P.shield; i++) icon(c, 'shield', m + S * 14 + bw + S * 9 + i * S * 12, m + bh / 2 + S, S);
  // altın + kat
  icon(c, 'coin', m + S * 6, m + bh + S * 13, S * 1.1); txt(c, G.gold, m + S * 14, m + bh + S * 8, S * 1.4, '#ffd040');
  icon(c, 'portal', m + S * 50, m + bh + S * 13, S * 1.1); txt(c, 'KAT ' + G.floor, m + S * 58, m + bh + S * 8, S * 1.4, '#d8c8ff');
  icon(c, 'skull', m + S * 112, m + bh + S * 13, S); txt(c, G.kills, m + S * 120, m + bh + S * 8, S * 1.4, '#e0e0e0');
  if (G.combo >= 3 && G.comboT > 0) { const k = clamp(G.comboT / 2.5, 0, 1), pop = 1 + Math.max(0, G.comboPop) * 0.6; c.globalAlpha = Math.min(1, k * 3); txt(c, G.combo + 'x', W - MINS * 0.18, H * 0.42, S * 3 * pop, G.combo >= 15 ? '#ff6040' : G.combo >= 8 ? '#ffb040' : '#ffe080', 1); txt(c, 'KOMBO', W - MINS * 0.18, H * 0.42 + S * 30 * pop, S * 1.1, '#e0d0b0', 1); c.fillStyle = 'rgba(255,220,120,0.8)'; c.fillRect(W - MINS * 0.18 - S * 20, H * 0.42 + S * 44 * pop, S * 40 * k, S * 1.5); c.globalAlpha = 1; }
  // relikler
  let rx = m, ry = m + bh + S * 22;
  ry += S * 4;
  for (const id in P.relics) { const u = UPG.find(q => q.id === id); c.fillStyle = 'rgba(10,8,16,0.7)'; c.fillRect(rx, ry, S * 14, S * 14); c.fillStyle = css(RARC[u.r]); c.fillRect(rx, ry + S * 13, S * 14, S); icon(c, RELIC_ICON[id], rx + S * 7, ry + S * 7, Math.max(1, S * 0.9)); if (P.relics[id] > 1) txt(c, P.relics[id], rx + S * 10, ry + S * 8, Math.max(1, S - 1), '#fff'); rx += S * 16; if (rx > m + bw) { rx = m; ry += S * 16; } }
  // minimap
  drawMinimap(c, S);
  // boss
  if (G.boss && !G.boss.spawnT) { const b = G.boss, w = W * 0.5; txt(c, ET[b.type].n, W / 2, H - S * 30, S * 1.6, '#ffb0a0', 1); bar(c, W / 2 - w / 2, H - S * 16, w, S * 6, b.hp / b.maxHp, '#c02838'); }
  // butonlar
  if (G.state === 'play') {
    const ia = !!(G.interact && !enemies.some(e => !e.dead && d2(e.x, e.y, P.x, P.y) < 110 * 110));
    btn(c, BTN.atk, '', IN.atk != null); if (ia) icon(c, G.interact.kind === 'shop' ? 'coin' : 'chest', BTN.atk.x, BTN.atk.y, BTN.atk.r / 7); else icon(c, P.weapon === 'staff' ? 'flame' : P.weapon === 'xbow' ? 'arrows' : 'sword', BTN.atk.x, BTN.atk.y, BTN.atk.r / 7);
    btn(c, BTN.dash, '', false, P.dashCd > 0 ? 1 - P.dashCd / P.st.dashCd : 1); icon(c, 'dash', BTN.dash.x, BTN.dash.y, BTN.dash.r / 6.5, P.dashCd > 0 ? '#506070' : null);
    const full = P.special >= 1; btn(c, BTN.spec, '', full, P.special);
    if (full) { c.save(); c.beginPath(); c.arc(BTN.spec.x, BTN.spec.y, BTN.spec.r * (1.1 + Math.sin(G.t * 6) * 0.06), 0, TAU); c.strokeStyle = 'rgba(120,220,255,0.9)'; c.lineWidth = S * 1.5; c.stroke(); c.restore(); }
    icon(c, 'star', BTN.spec.x, BTN.spec.y, BTN.spec.r / 6.5, full ? null : '#4a6070');
    btn(c, BTN.pause, ''); icon(c, 'pause', BTN.pause.x, BTN.pause.y, BTN.pause.r / 6);
    if (IN.joy) { const j = IN.joy, R = MINS * 0.11; c.save(); c.globalAlpha = 0.5; c.beginPath(); c.arc(j.bx, j.by, R, 0, TAU); c.strokeStyle = '#fff'; c.lineWidth = S * 1.5; c.stroke(); c.beginPath(); c.arc(j.x, j.y, R * 0.42, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.restore(); }
    else if (G.run < 12) { c.save(); c.globalAlpha = 0.25 + Math.sin(G.t * 3) * 0.1; c.beginPath(); c.arc(W * 0.16, H * 0.72, MINS * 0.11, 0, TAU); c.strokeStyle = '#fff'; c.lineWidth = S * 1.5; c.stroke(); c.restore(); }
  }
}
function drawMinimap(c, S) {
  const sz = MINS * 0.26, x0 = W - sz - MINS * 0.04, y0 = MINS * 0.04, cs = sz / 34;
  c.save(); c.fillStyle = 'rgba(8,8,14,0.6)'; c.fillRect(x0 - 3, y0 - 3, sz + 6, sz + 6); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.strokeRect(x0 - 3, y0 - 3, sz + 6, sz + 6);
  c.beginPath(); c.rect(x0, y0, sz, sz); c.clip();
  const ptx = P.x / T, pty = P.y / T;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (!seen[idx(x, y)]) continue; const t = map[idx(x, y)]; if (t === 0) continue;
    const sx = x0 + sz / 2 + (x - ptx) * cs, sy = y0 + sz / 2 - (y - pty) * cs - cs; if (sx < x0 - cs || sy < y0 - cs || sx > x0 + sz || sy > y0 + sz) continue;
    const r = roomAt[idx(x, y)];
    c.fillStyle = t === 2 ? 'rgba(150,150,170,0.7)' : r >= 0 && rooms[r].state === 'cleared' ? 'rgba(70,80,100,0.85)' : r >= 0 && rooms[r].state === 'fight' ? 'rgba(130,50,50,0.85)' : 'rgba(55,60,75,0.85)';
    c.fillRect(sx, sy, cs + 0.5, cs + 0.5);
  }
  const dot = (wx, wy, col, s = 1.6) => { const sx = x0 + sz / 2 + (wx / T - ptx) * cs, sy = y0 + sz / 2 - (wy / T - pty) * cs; c.fillStyle = col; c.fillRect(sx - cs * s / 2, sy - cs * s / 2, cs * s, cs * s); };
  for (const r of rooms) if (r.explored || r.type === 'stairs' || r.type === 'boss') { if (r.type === 'shop' && r.explored) dot(r.cx, r.cy, '#40ff80', 2); if (r.type === 'treasure' && r.explored) dot(r.cx, r.cy, '#ffd040', 2); }
  for (const o of inter) if (o.kind === 'portal') dot(o.x, o.y, '#c070ff', 2.4);
  for (const e of enemies) if (!e.dead) dot(e.x, e.y, '#ff4040', 1.2);
  dot(P.x, P.y, '#ffffff', 1.8);
  c.restore();
}
function cardRects() {
  const n = G.modal.cards.length, cw = Math.min(W * 0.27, MINS * 0.62), ch = Math.min(H * 0.62, cw * 1.45), gap = cw * 0.08, x0 = W / 2 - (n * cw + (n - 1) * gap) / 2, y0 = H / 2 - ch / 2 + MINS * 0.04;
  return G.modal.cards.map((cd, i) => ({ x: x0 + i * (cw + gap), y: y0, w: cw, h: ch, cd }));
}
function drawModal(c, S) {
  const M = G.modal; M.t0 = M.t0 ?? G.t; M.t = G.t - M.t0;
  c.fillStyle = 'rgba(4,4,10,0.78)'; c.fillRect(0, 0, W, H);
  txt(c, M.title, W / 2, H * 0.08, S * 2.4, '#ffe8a0', 1);
  for (const r of cardRects()) {
    const cd = r.cd, rar = cd.w ? 3 : cd.u.r, col = RARC[rar];
    const a = clamp(M.t * 3 - (r.x / W), 0, 1); c.globalAlpha = a;
    const glow = c.createRadialGradient(r.x + r.w / 2, r.y + r.h * 0.25, 0, r.x + r.w / 2, r.y + r.h * 0.25, r.w * 0.8); glow.addColorStop(0, css(col, 0.35)); glow.addColorStop(1, css(col, 0));
    c.fillStyle = glow; c.fillRect(r.x - r.w * 0.2, r.y - r.h * 0.1, r.w * 1.4, r.h * 0.8);
    panel(c, r.x, r.y, r.w, r.h, css(col), Math.max(1, Math.round(S * 0.8)));
    const bg = c.createLinearGradient(0, r.y, 0, r.y + r.h * 0.45); bg.addColorStop(0, css(col, 0.22)); bg.addColorStop(1, css(col, 0)); c.fillStyle = bg; c.fillRect(r.x + S, r.y + S, r.w - 2 * S, r.h * 0.45);

    if (cd.w) { const m = MD[WEAPONS[cd.w].m]; drawStack2D(c, m, r.x + r.w / 2, r.y + r.h * 0.25, M.t * 1.4, (r.w * 0.5) / Math.max(m.w, m.d) * 1.2); }
    else { const bob = Math.sin(M.t * 3 + r.x) * S * 2; const gg = c.createRadialGradient(r.x + r.w / 2, r.y + r.h * 0.25, 0, r.x + r.w / 2, r.y + r.h * 0.25, r.w * 0.3); gg.addColorStop(0, css(col, 0.5)); gg.addColorStop(1, css(col, 0)); c.fillStyle = gg; c.fillRect(r.x, r.y, r.w, r.h * 0.5); icon(c, RELIC_ICON[cd.u.id], r.x + r.w / 2, r.y + r.h * 0.25 + bob, Math.round(r.w / 26)); }
    txt(c, RARN[rar], r.x + r.w / 2, r.y + r.h * 0.47, Math.max(1, S - 1), css(col), 1);
    const name = cd.w ? WEAPONS[cd.w].n : cd.u.n, desc = cd.w ? WEAPONS[cd.w].d : cd.u.d;
    const nsc = txtW(name, S * 1.2) > r.w * 0.92 ? S : S * 1.2;
    txt(c, name, r.x + r.w / 2, r.y + r.h * 0.55, nsc, '#fff', 1);
    const maxc = Math.floor(r.w * 0.9 / (6 * S));
    wrapText(desc, maxc).forEach((l, i) => txt(c, l, r.x + r.w / 2, r.y + r.h * 0.67 + i * S * 12, S, '#c8c8dc', 1));
    if (cd.u && P.relics[cd.u.id]) txt(c, 'SAHİP: ' + P.relics[cd.u.id], r.x + r.w / 2, r.y + r.h * 0.92, Math.max(1, S - 1), '#8090a0', 1);
    if (cd.w) txt(c, 'Şu an: ' + WEAPONS[P.weapon].n, r.x + r.w / 2, r.y + r.h * 0.92, Math.max(1, S - 1), '#8090a0', 1);
    c.globalAlpha = 1;
  }
}
function menuButtons(list) { const bw = Math.min(W * 0.5, MINS * 0.9), bh = MINS * 0.11, gap = bh * 0.3, y0 = H * 0.42; return list.map((l, i) => ({ x: W / 2 - bw / 2, y: y0 + i * (bh + gap), w: bw, h: bh, ...l })); }
function drawMenuBtns(c, S, btns) { for (const b of btns) { panel(c, b.x, b.y, b.w, b.h, b.hi ? '#d8a040' : '#5a5870', Math.max(1, Math.round(S * 0.7))); txt(c, b.label, b.x + b.w / 2, b.y + b.h / 2 - S * 5, S * 1.5, b.hi ? '#ffe8a0' : '#fff', 1); } }
function pauseBtns() { return menuButtons([{ label: 'DEVAM ET', id: 'resume', hi: true }, { label: 'SES: ' + (SFX.on ? 'AÇIK' : 'KAPALI'), id: 'sfx' }, { label: 'MÜZİK: ' + (SFX.musicOn ? 'AÇIK' : 'KAPALI'), id: 'mus' }, { label: 'ANA MENÜ', id: 'menu' }]); }
function deadBtns() { return menuButtons([{ label: 'TEKRAR DENE', id: 'retry', hi: true }, { label: 'ANA MENÜ', id: 'menu' }]).map(b => ({ ...b, y: b.y + H * 0.14 })); }
function drawPause(c, S) { c.fillStyle = 'rgba(4,4,10,0.72)'; c.fillRect(0, 0, W, H); txt(c, 'DURAKLATILDI', W / 2, H * 0.16, S * 3, '#ffe8a0', 1); txt(c, 'Kat ' + G.floor + ' · ' + G.kills + ' öldürme · ' + fmtTime(G.run), W / 2, H * 0.29, S * 1.2, '#c0c0d0', 1); drawMenuBtns(c, S, pauseBtns()); }
function drawDead(c, S) {
  const a = clamp((G.deadT - 1.2) * 2, 0, 1); c.globalAlpha = a; c.fillStyle = 'rgba(20,0,0,0.75)'; c.fillRect(0, 0, W, H);
  txt(c, 'ÖLDÜN', W / 2, H * 0.1, S * 4, '#ff5060', 1);
  const lines = [['Ulaşılan kat', G.floor], ['Öldürülen düşman', G.kills], ['Toplanan altın', G.gold], ['Süre', fmtTime(G.run)], ['En iyi kat', G.best]];
  lines.forEach((l, i) => { txt(c, l[0], W / 2 - S * 4, H * 0.27 + i * S * 13, S * 1.3, '#c8c0c0', 2); txt(c, String(l[1]), W / 2 + S * 4, H * 0.27 + i * S * 13, S * 1.3, '#fff'); });
  drawMenuBtns(c, S, deadBtns()); c.globalAlpha = 1;
}
function fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function drawTitle(c, S) {
  const t = G.t;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 0, W, H);
  const ts = Math.max(2, Math.round(MINS / 85));
  const y = H * 0.05 + Math.sin(t * 1.5) * S * 1.5;
  const lh = drawLogo(c, W / 2, y, ts, t);
  const sy = y + lh + S * 2; c.fillStyle = 'rgba(255,200,120,0.5)'; c.fillRect(W / 2 - S * 90, sy + S * 4, S * 40, S); c.fillRect(W / 2 + S * 50, sy + S * 4, S * 40, S);
  txt(c, 'KATMAN KATMAN BİR ROGUELİKE', W / 2, sy, S * 1.1, '#e8d8c0', 1);
  const pa = 0.55 + Math.sin(t * 4) * 0.45; c.globalAlpha = pa; txt(c, 'BAŞLAMAK İÇİN DOKUN', W / 2, H * 0.86, S * 1.6, '#ffffff', 1); c.globalAlpha = 1;
  if (G.best) { icon(c, 'portal', W / 2 - txtW('EN İYİ KAT ' + G.best, S) / 2 - S * 8, H * 0.93 + S * 4, S); txt(c, 'EN İYİ KAT ' + G.best, W / 2, H * 0.93, S, '#ffd040', 1); }
  // yan tarafta dönen 2D yığın önizlemeleri
}
function handleTaps() {
  const taps = IN.taps; IN.taps = []; if (!taps.length) return;
  for (const [x, y, key] of taps) {
    if (G.state === 'title') { SFX.play('click'); G.state = 'play'; newRun(false); G.fade = 1; return; }
    if (G.modal && G.modal.type === 'choice') {
      if (G.modal.t < 0.35) continue;
      const rs = cardRects(); let pickI = -1;
      if (key && key[0] === 'c') pickI = +key[1] - 1; else rs.forEach((r, i) => { if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) pickI = i; });
      if (pickI >= 0 && rs[pickI]) { applyCard(rs[pickI].cd); G.modal = null; }
      continue;
    }
    if (G.state === 'pause') { for (const b of pauseBtns()) if ((key === 'enter' && b.id === 'resume') || (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)) { SFX.play('click'); if (b.id === 'resume') G.state = 'play'; if (b.id === 'sfx') { SFX.on = !SFX.on; store.set('kz_sfx', SFX.on); } if (b.id === 'mus') { SFX.musicOn = !SFX.musicOn; store.set('kz_mus', SFX.musicOn); } if (b.id === 'menu') { newRun(true); G.state = 'title'; } } continue; }
    if (G.state === 'dead' && G.deadT > 1.5) { for (const b of deadBtns()) if ((key === 'enter' && b.id === 'retry') || (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)) { SFX.play('click'); if (b.id === 'retry') { G.state = 'play'; newRun(false); G.fade = 1; } else { newRun(true); G.state = 'title'; } } }
  }
}
window.addEventListener('load', boot);
