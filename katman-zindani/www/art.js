'use strict';
// =====================================================================
//  El çizimi piksel ikonlar + logo
// =====================================================================
const PAL = { r: '#ff4a5e', R: '#a01830', w: '#ffffff', y: '#ffd040', Y: '#b07818', o: '#ff8a20', g: '#c8d0e0', G: '#50586a', b: '#4a90ff', B: '#1a3a8a', c: '#70f0ff', C: '#2a90b0', k: '#101018', S: '#6a4020', s: '#b07840', n: '#60d040', N: '#2a7a2a', p: '#c060ff', P: '#5a2a8a' };
const ICON_SRC = {
  heart: ['.RR...RR.', 'RrrR.RrrR', 'RrwrrrrrR', 'RrrrrrrrR', '.RrrrrrR.', '..RrrrR..', '...RrR...', '....R....'],
  heartp: ['.RR...RR.', 'RrrR.RrrR', 'RrrrwrrrR', 'RrrrwrrrR', '.RwwwwwR.', '..RrwrR..', '...RwR...', '....R....'],
  coin: ['..YYYYY..', '.YyyyyyY.', 'YyywwyyyY', 'YywyyyyyY', 'YyyyyyyyY', 'YyyyyyYyY', 'YyyyyYyyY', '.YyyyyyY.', '..YYYYY..'],
  sword: ['.......ww', '......wgw', '.....wgw.', '....wgw..', '.y.wgw...', '..yyw....', '..Sy.....', '.S..y....', 'S........'],
  swords: ['w.......w', 'gw.....wg', '.gw...wg.', '..gw.wg..', '...gwg...', '..ywgwy..', '.yy...yy.', 'Sy.....yS', 'S.......S'],
  star: ['....c....', '....c....', '.c..w..c.', '..cwwwc..', 'ccwwwwwcc', '..cwwwc..', '.c..w..c.', '....c....', '....c....'],
  dash: ['.........', 'c...c....', 'cc..cc...', '.cw..cw..', '..cw..cw.', '.cw..cw..', 'cc..cc...', 'c...c....', '.........'],
  shield: ['.YYYYYYY.', 'YyyyyyyyY', 'YybbbbbyY', 'YybwbbbyY', 'YybbbbbyY', '.YybbbyY.', '.YybbbyY.', '..YybyY..', '...YYY...'],
  flame: ['....o....', '...oo....', '...ooo.o.', '..ooyooo.', '.ooyyyoo.', '.oyywyyo.', '.oyywwyo.', '..oyyyo..', '...ooo...'],
  bolt: ['.....yyy.', '....yyy..', '...yyy...', '..yyyyyy.', '.....yy..', '....yy...', '...yy....', '..yy.....', '.y.......'],
  eye: ['.........', '..wwwww..', '.wwbbbww.', 'wwbBkBbww', 'wwbkwkbww', 'wwbBkBbww', '.wwbbbww.', '..wwwww..', '.........'],
  fang: ['.RRRRRRR.', 'RrrrrrrrR', '.ww.w.ww.', '.ww...ww.', '.ww...ww.', '..w...w..', '..w...w..', '..r...r..'],
  boot: ['...SSS...', '...SsS...', '...SsS...', '...SsS...', '...SsSS..', '..SssssS.', '.SssssssS', '.GGGGGGGG'],
  magnet: ['.........', '.ww...ww.', '.rr...rr.', '.rr...rr.', '.rr...rr.', '.rrr.rrr.', '..rrrrr..', '...rrr...'],
  area: ['yyy...yyy', 'yy.....yy', 'y.y...y.y', '...y.y...', '....w....', '...y.y...', 'y.y...y.y', 'yy.....yy', 'yyy...yyy'],
  bomb: ['......y..', '.....o.y.', '....G....', '..GGGGG..', '.GgGGGGG.', '.GgGGGGG.', '.GGGGGGG.', '..GGGGG..'],
  arrows: ['.......cc', '......ccc', '.....cc..', '....cc...', '.c.cc....', '..cc.....', '.cwc.....', 'cw.......'],
  orbit: ['...cwc...', '.c.....c.', 'c.......w', 'w...w...c', 'c..www..c', 'c...w...w', 'w.......c', '.c.....c.', '...cwc...'],
  drop: ['....R....', '...RrR...', '...RrR...', '..RrrrR..', '.RrrwrrR.', '.RrwrrrR.', '.RrrrrrR.', '..RrrrR..', '...RRR...'],
  thorn: ['....g....', '.g..G..g.', '..gGGGg..', '..GGGGG..', 'gGGGwGGGg', '..GGGGG..', '..gGGGg..', '.g..G..g.', '....g....'],
  skull: ['..wwwww..', '.wwwwwww.', 'wwkkwkkww', 'wwkkwkkww', 'wwwwkwwww', '.wwwwwww.', '..wkwkw..', '..wwwww..'],
  chest: ['.SSSSSSS.', 'SsssyssS.', 'SSSSySSSS', 'SsssysssS', 'SssyyysssS', 'SsssssssS', 'SSSSSSSSS'],
  portal: ['..ppppp..', '.pPPPPPp.', 'pPPwPPPPp', 'pPPPPPwPp', 'pPwPPPPPp', 'pPPPPwPPp', '.pPPPPPp.', '..ppppp..'],
  pause: ['.........', '.www.www.', '.www.www.', '.www.www.', '.www.www.', '.www.www.', '.www.www.', '.www.www.', '.........'],
  gem: ['...www...', '..wcccw..', '.wcccccw.', 'wccwccccw', '.cccccCC.', '..ccCCC..', '...cCC...', '....C....'],
  potion: ['...SS....', '...gg....', '..g..g...', '.grrrrg..', 'grrwrrrg.', 'grrrrrrg.', 'grrrrrrg.', '.gggggg..']
};
const RELIC_ICON = { dmg: 'sword', atk: 'swords', hp: 'heartp', move: 'boot', gold: 'magnet', nova: 'star', crit: 'eye', vamp: 'fang', burn: 'flame', thorn: 'thorn', shield: 'shield', rage: 'drop', area: 'area', dash: 'dash', orbit: 'orbit', chain: 'bolt', soul: 'arrows', boom: 'bomb' };
const ICC = new Map();
function iconCanvas(name, sc, tint) {
  const key = name + sc + (tint || ''); let c = ICC.get(key); if (c) return c;
  const src = ICON_SRC[name] || ICON_SRC.gem; const w = Math.max(...src.map(r => r.length)), h = src.length;
  c = document.createElement('canvas'); c.width = (w + 2) * sc; c.height = (h + 3) * sc; const x = c.getContext('2d');
  const on = (px, py) => src[py] && src[py][px] && src[py][px] !== '.';
  // dış çizgi + gölge
  x.fillStyle = 'rgba(0,0,0,0.45)';
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) if (on(px, py)) x.fillRect((px + 1) * sc, (py + 2) * sc, sc, sc);
  x.fillStyle = '#0c0a12';
  for (let py = -1; py <= h; py++) for (let px = -1; px <= w; px++) { if (on(px, py)) continue; if (on(px - 1, py) || on(px + 1, py) || on(px, py - 1) || on(px, py + 1)) x.fillRect((px + 1) * sc, (py + 1) * sc, sc, sc); }
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) { const ch = src[py][px]; if (!ch || ch === '.') continue; x.fillStyle = tint || PAL[ch] || '#fff'; x.fillRect((px + 1) * sc, (py + 1) * sc, sc, sc); }
  ICC.set(key, c); return c;
}
function icon(ctx, name, cx, cy, sc, tint) { const c = iconCanvas(name, Math.max(1, Math.round(sc)), tint); ctx.drawImage(c, Math.round(cx - c.width / 2), Math.round(cy - c.height / 2)); return c; }

// --------- logo: katmanlı ekstrüzyon yazı ---------
let LOGO = null;
function buildLogo(sc) {
  const lines = ['KATMAN', 'ZİNDANI']; const depth = 4;
  const tw = Math.max(...lines.map(l => txtW(l, sc))); const lh = sc * 13;
  const c = document.createElement('canvas'); c.width = tw + sc * 8; c.height = lh * 2 + sc * (depth + 10); const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  lines.forEach((l, li) => {
    const ox = (c.width - txtW(l, sc)) / 2, oy = sc * 2 + li * lh;
    // katmanlar (alttan üste)
    // koyu dış hat
    const ol = textCanvas(l, '#120808', sc, null);
    for (let d = depth + 1; d >= 0; d--) for (const [ax, ay] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) x.drawImage(ol, ox - sc + ax * sc + d * sc * 0.5, oy + ay * sc + d * sc * 0.5);
    // katman katman ekstrüzyon (çapraz aşağı)
    for (let d = depth; d >= 1; d--) { const t = d / depth; const col = li === 0 ? `rgb(${150 - t * 90 | 0},${70 - t * 45 | 0},${30 - t * 18 | 0})` : `rgb(${140 - t * 85 | 0},${50 - t * 32 | 0},${28 - t * 16 | 0})`; x.drawImage(textCanvas(l, col, sc, null), ox - sc + d * sc * 0.5, oy + d * sc * 0.5); }
    // ana yüz: altın gradyan
    const face = textCanvas(l, '#fff', sc, null);
    const tmp = document.createElement('canvas'); tmp.width = face.width; tmp.height = face.height; const tx = tmp.getContext('2d');
    tx.drawImage(face, 0, 0); tx.globalCompositeOperation = 'source-atop';
    const g = tx.createLinearGradient(0, sc * 2, 0, sc * 9); if (li === 0) { g.addColorStop(0, '#fff4c0'); g.addColorStop(0.45, '#ffd060'); g.addColorStop(1, '#e07820'); } else { g.addColorStop(0, '#ffe0a0'); g.addColorStop(0.5, '#ff9a40'); g.addColorStop(1, '#c03a20'); }
    tx.fillStyle = g; tx.fillRect(0, 0, tmp.width, tmp.height);
    // pikselli parlama çizgisi
    tx.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < tmp.width; i += sc) if ((i / sc) % 6 < 2) tx.fillRect(i, sc * 2, sc, sc);
    x.drawImage(tmp, ox - sc, oy);
  });
  return c;
}
function drawLogo(ctx, cx, cy, sc, t) {
  if (!LOGO || LOGO.sc !== sc) { LOGO = buildLogo(sc); LOGO.sc = sc; }
  const L = LOGO; const x = Math.round(cx - L.width / 2), y = Math.round(cy);
  // arka parıltı
  const g = ctx.createRadialGradient(cx, cy + L.height / 2, 0, cx, cy + L.height / 2, L.width * 0.6); g.addColorStop(0, 'rgba(255,140,40,0.28)'); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = g; ctx.fillRect(cx - L.width, cy - L.height * 0.3, L.width * 2, L.height * 1.6);
  ctx.drawImage(L, x, y);
  // ışık süpürmesi
  const sw = ((t * 0.35) % 1.6) - 0.3;
  if (sw > 0 && sw < 1) {
    if (!L.tmp) { L.tmp = document.createElement('canvas'); L.tmp.width = L.width; L.tmp.height = L.height; }
    const tx = L.tmp.getContext('2d'); tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, L.width, L.height); tx.drawImage(L, 0, 0); tx.globalCompositeOperation = 'source-in';
    const sx = sw * L.width; const gg = tx.createLinearGradient(sx - sc * 10, 0, sx + sc * 10, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,230,0.75)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); tx.fillStyle = gg; tx.fillRect(0, 0, L.width, L.height);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(L.tmp, x, y); ctx.restore();
  }
  return L.height;
}
// süslü panel
function panel(ctx, x, y, w, h, col, s) {
  ctx.fillStyle = 'rgba(14,12,22,0.92)'; ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w, s); ctx.fillRect(x, y + h - s, w, s); ctx.fillRect(x, y, s, h); ctx.fillRect(x + w - s, y, s, h);
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x + s, y + s, w - 2 * s, s);
  // köşe perçinleri
  for (const [px, py] of [[x, y], [x + w - 3 * s, y], [x, y + h - 3 * s], [x + w - 3 * s, y + h - 3 * s]]) { ctx.fillStyle = col; ctx.fillRect(px, py, 3 * s, 3 * s); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(px + s, py + s, s, s); }
}
