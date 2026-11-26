'use strict';
// =====================================================================
//  Voxel modelleri (hepsi kodla, sıfırdan üretiliyor)
// =====================================================================
const BIOMES = [
  { name: 'Yosunlu Mahzen', floor: 0x51555f, floor2: 0x444852, grout: 0x25272e, wall: 0x646a7a, wallTop: 0x838a9c, mortar: 0x30333c, accent: 0x5a9a3c, accentEm: false, rune: 0x5fffc0, mush: 0x40ffd0, crys: 0xb070ff, amb: [0.34, 0.36, 0.48], fog: 0x06070b, torch: [1.0, 0.6, 0.28] },
  { name: 'Kor Derinlikleri', floor: 0x553b35, floor2: 0x46302b, grout: 0x1e1210, wall: 0x6e463a, wallTop: 0x8e5e4c, mortar: 0x2a1814, accent: 0xff6a1a, accentEm: true, rune: 0xffb030, mush: 0xff8a30, crys: 0xff4040, amb: [0.46, 0.25, 0.18], fog: 0x0c0403, torch: [1.0, 0.55, 0.2] },
  { name: 'Buz Katakombu', floor: 0x45596e, floor2: 0x3a4c60, grout: 0x1a2430, wall: 0x5f7f9c, wallTop: 0xc6e4f4, mortar: 0x26364a, accent: 0xdff6ff, accentEm: false, rune: 0x7ff0ff, mush: 0x70b0ff, crys: 0x7ff0ff, amb: [0.30, 0.40, 0.58], fog: 0x03070d, torch: [0.5, 0.8, 1.0] }
];
const MD = {}; // modeller

function buildAllModels(bi) {
  Atlas.reset(); bakeSprites();
  const B = BIOMES[bi];
  // ---------- çevre ----------
  MD.wall = [0, 1, 2, 3].map(v => bake(mkWall(B, v, bi), { ao: 0.45 }));
  MD.floor = [0, 1, 2, 3, 4, 5].map(v => bake(mkFloor(B, v, bi), { ao: 0, noEdge: true }));
  MD.pillar = bake(mkPillar(B), { ao: 0.45 });
  MD.barrel = bake(mkBarrel()); MD.crate = bake(mkCrate());
  MD.skull = bake(mkSkull()); MD.bones = bake(mkBones(), { ao: 0.1 });
  MD.mush = bake(mkMush(B)); MD.crystal = bake(mkCrystal(B.crys));
  MD.brazier = bake(mkBrazier()); MD.flame = [0, 1, 2].map(f => bake(mkFlame(f, bi === 2), { ao: 0 }));
  MD.sconce = bake(mkSconce());
  MD.grass = bake(mkGrass(bi)); MD.rubble = bake(mkRubble(B));
  MD.chest = bake(mkChest(false, false)); MD.chestOpen = bake(mkChest(true, false));
  MD.bigChest = bake(mkChest(false, true)); MD.bigChestOpen = bake(mkChest(true, true));
  MD.portal = bake(mkPortal(), { ao: 0 });
  MD.coin = bake(mkCoin(), { ao: 0 }); MD.heart = bake(mkHeart(), { ao: 0.1 }); MD.potion = bake(mkPotion());
  MD.gem = [0xe8e8f0, 0x4aa8ff, 0xc060ff, 0xffc030].map(c => bake(mkGem(c), { ao: 0.1 }));
  MD.bars = bake(mkBars(), { ao: 0.3 });
  MD.pedestal = bake(mkPedestal(B));
  MD.merchant = bake(mkMerchant());
  MD.arrow = bake(mkArrow(0x8a6a40, 0xd0d0d0), { px: 0 }); MD.bolt = bake(mkArrow(0x5a4a3a, 0x9ad0ff));
  MD.rock = bake(mkRock(B));
  MD.banner = bake(mkBanner(bi));
  // ---------- karakterler ----------
  MD.hero = [0, 1, 2].map(f => bake(mkHero(f)));
  MD.skel = [0, 1, 2].map(f => bake(mkSkeleton(f, false)));
  MD.archer = [0, 1, 2].map(f => bake(mkSkeleton(f, true)));
  MD.mage = [0, 1].map(f => bake(mkMage(f)));
  MD.orc = [0, 1, 2].map(f => bake(mkOrc(f)));
  MD.slime = bake(mkSlime(0x58d040, 0x2f8a2a)); MD.slimeB = bake(mkSlime(0x4aa0ff, 0x2a5aa8)); MD.slimeR = bake(mkSlime(0xff5050, 0x9a2020));
  MD.bat = [0, 1].map(f => bake(mkBat(f)));
  MD.golem = [0, 1, 2].map(f => bake(mkGolem(f, B), { ao: 0.45 }));
  MD.lich = [0, 1].map(f => bake(mkLich(f)));
  // ---------- silahlar (sap orijinde) ----------
  MD.w_sword = bake(mkSword(0xd8e0ec, 0xe8b84a), { px: 2.5 - 11 });
  MD.w_axe = bake(mkAxe(), { px: 1.5 - 9 });
  MD.w_spear = bake(mkSpear(), { px: 4.5 - 15 });
  MD.w_staff = bake(mkStaff(), { px: 2.5 - 10 });
  MD.w_xbow = bake(mkXbow(), { px: 1.5 - 7 });
  MD.e_sword = bake(mkSword(0x9a8a7a, 0x6a5040), { px: 2.5 - 11 });
  MD.e_bow = bake(mkBow(), { px: 1.5 - 3 });
  MD.blade = bake(mkSword(0x9af0ff, 0x60a0ff, true), { px: 0 });
  Atlas.upload();
}

// ---------------- çevre modelleri ----------------
function mkWall(B, variant, bi) {
  const H = 20, v = new Vox(16, 16, H);
  for (let z = 0; z < H; z++) for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const edge = x === 0 || x === 15 || y === 0 || y === 15;
    let c;
    if (z === H - 1) {
      c = cjit(B.wallTop, 0.05);
      if (edge) c = cmul(c, 0.9);
      if (variant === 2 && hash2(x, y, 3) < 0.08) c = cmul(B.wallTop, 0.6);
      if (bi === 2 && hash2(x, y, 9) < 0.7) c = cjit(0xf0faff, 0.03);
    } else {
      const course = Math.floor(z / 5), mrow = z % 5 === 4;
      const side = x === 0 ? 0 : x === 15 ? 1 : y === 0 ? 2 : 3;
      const p = (side < 2 ? y : x), off = (course % 2) * 4, joint = (p + off) % 8 === 0;
      const bid = hash2(Math.floor((p + off) / 8), course, side);
      c = cjit(cmul(B.wall, 0.86 + bid * 0.26), 0.04);
      if (edge && (mrow || joint)) c = B.mortar;
      if (!edge) c = cmul(B.wall, 0.8);
      if (edge && variant === 1) {
        if (bi === 0 && z < 4 + hash2(x, y, 1) * 9 && hash2(x, y, z) < 0.55) c = cjit(B.accent, 0.12);
        if (bi === 1 && (mrow || joint) && z < 12) { v.set(x, y, z, cjit(B.accent, 0.1), 1); continue; }
        if (bi === 2 && z > H - 5 && hash2(x, y, z) < 0.6) c = cjit(0xe6f6ff, 0.04);
      }
      if (edge && variant === 2) { const t = (p * 0.7 + z) % 11; if (Math.abs(t - 5) < 0.6 && z > 3 && z < 15) c = cmul(B.mortar, 0.8); }
      if (edge && variant === 3 && z >= 7 && z <= 12 && p >= 5 && p <= 10) {
        const gx = p - 5, gz = z - 7; const RUNE = ['011110', '100001', '101101', '101101', '100001', '011110'];
        if (RUNE[gz][gx] === '1') { v.set(x, y, z, B.rune, 1); continue; }
      }
    }
    v.set(x, y, z, c);
  }
  return v;
}
function mkFloor(B, variant, bi) {
  const v = new Vox(16, 16, 1);
  const sc = [0, 1, 2, 3].map(i => cjit(i % 2 ? B.floor : B.floor2, 0.06));
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const sx = x >> 3, sy = y >> 3; let c = cjit(sc[sx + sy * 2], 0.05);
    if (x % 8 === 0 || y % 8 === 0) c = B.grout;
    if (variant === 5 && x % 8 && y % 8) { c = cjit(B.floor2, 0.05); if ((x + y) % 4 === 0) c = cmul(B.floor2, 0.85); }
    v.set(x, y, 0, c);
  }
  if (variant === 1 || variant === 4) { // çatlak
    let x = irnd(2, 13), y = irnd(2, 13); for (let i = 0; i < 12; i++) { v.set(x, y, 0, cmul(B.grout, 0.9)); x += irnd(-1, 1); y += irnd(0, 1) ? 1 : 0; x = clamp(x, 0, 15); y = clamp(y, 0, 15); }
  }
  if (variant === 2 || variant === 4) { // biyom süsü
    for (let i = 0; i < 14; i++) { const x = irnd(0, 15), y = irnd(0, 15); v.set(x, y, 0, cjit(B.accent, 0.15), B.accentEm); if (bi !== 1 && rnd() < 0.6) v.set(x + 1, y, 0, cjit(B.accent, 0.15), B.accentEm); }
  }
  if (variant === 3) { for (let i = 0; i < 6; i++) { const x = irnd(1, 14), y = irnd(1, 14); v.set(x, y, 0, cmul(B.floor, 1.25)); } }
  return v;
}
function mkPillar(B) {
  const v = new Vox(10, 10, 24);
  v.box(0, 0, 0, 9, 9, 2, J(B.wallTop, 0.05)); v.box(1, 1, 3, 8, 8, 3, J(B.wall, 0.05));
  v.cyl(5, 5, 3.6, 4, 19, (x, y, z) => { const a = Math.atan2(y + 0.5 - 5, x + 0.5 - 5); return cmul(B.wall, (Math.floor((a + 4) * 2) % 2 ? 0.9 : 1.05) * rnd(0.96, 1.04)); });
  v.box(1, 1, 20, 8, 8, 20, J(B.wall, 0.05)); v.box(0, 0, 21, 9, 9, 23, J(B.wallTop, 0.05));
  return v;
}
function mkBarrel() {
  const v = new Vox(10, 10, 12); const wood = 0x8a5a32;
  v.cyl(5, 5, z => 4.2 + Math.sin(z / 11 * Math.PI) * 0.7, 0, 11, (x, y, z) => {
    if (z === 2 || z === 9) return 0x50555e; if (z === 11) return cjit(0xa0703f, 0.05);
    const a = Math.atan2(y + 0.5 - 5, x + 0.5 - 5); return cmul(wood, Math.floor((a + 4) * 2.5) % 2 ? 0.88 : 1.04);
  });
  return v;
}
function mkCrate() {
  const v = new Vox(10, 10, 10);
  v.box(0, 0, 0, 9, 9, 9, (x, y, z) => { const fr = (x === 0 || x === 9) + (y === 0 || y === 9) + (z === 0 || z === 9); if (fr >= 2) return 0x5a3a20; if (z === 9 && (x + y) % 9 === 0) return 0x6a4428; return cjit(z % 3 === 0 ? 0x9a6a3a : 0xae7c46, 0.05); });
  return v;
}
function mkSkull() { const v = new Vox(6, 6, 5); v.ell(3, 3, 2.6, 2.6, 2.4, 2.4, J(0xe8e0cc, 0.04)); v.set(5, 2, 2, 0x1a1410); v.set(5, 3, 2, 0x1a1410); v.box(4, 2, 0, 5, 3, 0, 0xd8d0bc); return v; }
function mkBones() {
  const v = new Vox(12, 12, 3);
  for (let i = 0; i < 5; i++) { const a = rnd(TAU), l = irnd(3, 5), cx = rnd(3, 9), cy = rnd(3, 9); for (let t = -l; t <= l; t++) v.set(cx + Math.cos(a) * t * 0.5, cy + Math.sin(a) * t * 0.5, 0, 0xe0d8c4); v.set(cx + Math.cos(a) * l * 0.5, cy + Math.sin(a) * l * 0.5, 1, 0xf0e8d8); }
  v.ell(8, 4, 1.6, 1.8, 1.6, 1.6, J(0xe8e0cc, 0.04)); v.set(9, 3, 1, 0x1a1410); v.set(9, 4, 1, 0x1a1410);
  return v;
}
function mkMush(B) {
  const v = new Vox(10, 10, 7);
  for (const [cx, cy, h, r] of [[3, 3, 4, 2.2], [7, 5, 6, 2.6], [4, 7, 3, 1.7]]) { v.box(cx - 0, cy - 0, 0, cx, cy, h - 1, 0xe0e0d0); v.ell(cx + 0.5, cy + 0.5, h, r, r, 1.3, (x, y, z) => (hash2(x, y, z) < 0.2 ? 0xffffff : B.mush), 1); }
  return v;
}
function mkCrystal(col) {
  const v = new Vox(12, 12, 16);
  for (const [cx, cy, h, r, a] of [[6, 6, 15, 2.2, 0], [3, 4, 9, 1.5, -0.25], [9, 7, 11, 1.7, 0.25], [5, 9, 7, 1.3, 0.3]]) {
    for (let z = 0; z < h; z++) { const rr = z > h - 4 ? r * (h - z) / 4 : r; v.cyl(cx + a * z, cy + a * 0.5 * z, Math.max(0.6, rr), z, z, (x, y) => cmix(col, 0xffffff, hash2(x, y, z) * 0.35), 1); }
  }
  v.box(1, 1, 0, 10, 10, 0, (x, y) => hash2(x, y) < 0.5 ? 0x404850 : -1);
  return v;
}
function mkBrazier() { const v = new Vox(8, 8, 10); v.box(1, 1, 0, 1, 1, 5, 0x3a3a44); v.box(6, 6, 0, 6, 6, 5, 0x3a3a44); v.box(1, 6, 0, 1, 6, 5, 0x3a3a44); v.box(6, 1, 0, 6, 1, 5, 0x3a3a44); v.cyl(4, 4, z => 2.4 + (z - 6) * 0.7, 6, 9, (x, y, z) => z === 9 && Math.hypot(x + 0.5 - 4, y + 0.5 - 4) < 2.8 ? 0x301810 : J(0x5a5a68, 0.06)()); return v; }
function mkFlame(f, blue) {
  const v = new Vox(6, 6, 9); const c1 = blue ? 0xa0f0ff : 0xfff2a0, c2 = blue ? 0x40a0ff : 0xff9a20, c3 = blue ? 0x2050e0 : 0xe04010;
  const sh = [[2.6, 2.2, 1.7, 1.2, 0.8, 0.5], [2.4, 2.4, 1.9, 1.3, 1.0, 0.5, 0.3], [2.7, 2.0, 1.6, 1.4, 0.7, 0.5]][f];
  sh.forEach((r, z) => v.cyl(3 + (f === 1 ? (z * 0.15) : f === 2 ? -z * 0.12 : 0), 3, r, z, z, (x, y) => { const d = Math.hypot(x + 0.5 - 3, y + 0.5 - 3) / r; return d < 0.5 ? c1 : d < 0.85 ? c2 : c3; }, 1));
  return v;
}
function mkSconce() { const v = new Vox(4, 4, 5); v.box(1, 1, 0, 2, 2, 3, 0x4a4040); v.box(0, 0, 4, 3, 3, 4, 0x5a5050); return v; }
function mkGrass(bi) { const v = new Vox(8, 8, 5); const c = [0x5aa040, 0x8a5a2a, 0xa0c8e0][bi]; for (let i = 0; i < 12; i++) { const x = irnd(1, 6), y = irnd(1, 6), h = irnd(1, 4); v.box(x, y, 0, x, y, h, cjit(c, 0.15)); } return v; }
function mkRubble(B) { const v = new Vox(12, 12, 4); for (let i = 0; i < 6; i++) v.ell(rnd(2, 10), rnd(2, 10), 0.5, rnd(1, 2.3), rnd(1, 2.3), rnd(1, 2.5), J(B.wall, 0.08)); return v; }
function mkChest(open, big) {
  const W = big ? 18 : 14, D = big ? 12 : 10, v = new Vox(W, D, open ? 16 : 11);
  const wood = big ? 0x7a3a8a : 0x8a5a2e, band = 0xe8b84a;
  v.box(0, 0, 0, W - 1, D - 1, 6, (x, y, z) => (x === 0 || x === W - 1 || z === 0 || z === 6 || x === 3 || x === W - 4) ? band : cjit(wood, 0.05));
  if (open) { v.box(1, 1, 6, W - 2, D - 2, 6, 0xfff0a0, 1); v.box(2, 2, 7, W - 3, D - 3, 7, (x, y) => hash2(x, y) < 0.5 ? 0xffd040 : -1, 1); v.box(0, D - 2, 7, W - 1, D - 1, 14, (x, y, z) => (x === 0 || x === W - 1 || z === 14 || x === 3 || x === W - 4) ? band : cjit(wood, 0.05)); }
  else { v.box(0, 0, 7, W - 1, D - 1, 9, (x, y, z) => (x === 0 || x === W - 1 || z === 9 || x === 3 || x === W - 4) ? band : cjit(wood, 0.05)); v.box(W >> 1, 0, 5, (W >> 1), 0, 7, 0xffe080, 1); }
  return v;
}
function mkPortal() {
  const v = new Vox(30, 30, 2);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 30; x++) {
    const d = Math.hypot(x + 0.5 - 15, y + 0.5 - 15), a = Math.atan2(y + 0.5 - 15, x + 0.5 - 15);
    if (d < 14.5 && d > 12) v.set(x, y, 1, cmix(0xa050ff, 0xffffff, hash2(x, y) * 0.4), 1);
    else if (d <= 12) { const s = Math.sin(a * 3 + d * 0.6); v.set(x, y, 0, s > 0.3 ? 0x8040e0 : s > -0.3 ? 0x5020a0 : 0x301060, 1); }
    if (d < 15 && d > 13.5 && Math.floor((a + 4) * 4) % 3 === 0) v.set(x, y, 1, 0xffd0ff, 1);
  }
  return v;
}
function mkCoin() { const v = new Vox(6, 6, 2); v.cyl(3, 3, 2.9, 0, 1, (x, y, z) => { const d = Math.hypot(x + 0.5 - 3, y + 0.5 - 3); return d > 2.2 ? 0xc88a20 : z ? 0xffe060 : 0xf0c040; }); return v; }
function mkHeart() {
  const v = new Vox(9, 3, 8); const H = ['011011', '111111', '111111', '011110', '001100'].map(r => '0' + r + '0'); // x-z düzlemi
  const rows = ['00000000', '00110110', '01111111', '01111111', '01111111', '00111110', '00011100', '00001000'];
  for (let z = 0; z < 8; z++) for (let x = 0; x < 8; x++) if (rows[7 - z][x] === '1') for (let y = 0; y < 3; y++) v.set(x, y, z, (y === 1 ? 0xff3a4a : 0xd02030), y === 1 && z > 4 && x < 4 ? 1 : 0);
  v.set(2, 0, 5, 0xffc0c0, 1); v.set(2, 2, 5, 0xffc0c0, 1);
  return v;
}
function mkPotion() { const v = new Vox(6, 6, 9); v.cyl(3, 3, 2.6, 0, 4, (x, y, z) => z < 4 ? 0xff3050 : 0xc0e0ff, 1); v.cyl(3, 3, 1.2, 5, 6, 0xc0e0ff); v.box(2, 2, 7, 3, 3, 8, 0x8a5a2e); return v; }
function mkGem(c) {
  const v = new Vox(8, 8, 10);
  for (let z = 0; z < 10; z++) { const r = z < 5 ? (z + 1) * 0.75 : (10 - z) * 0.75; v.cyl(4, 4, r, z, z, (x, y) => cmix(c, 0xffffff, (x + y + z) % 5 === 0 ? 0.5 : hash2(x, y, z) * 0.2), 1); }
  return v;
}
function mkBars() { const v = new Vox(16, 4, 20); for (let x = 1; x < 16; x += 3) v.box(x, 1, 0, x + 1, 2, 19, (xx, yy, z) => z === 19 ? 0x8a8a9a : 0x50505e); v.box(0, 1, 4, 15, 2, 5, 0x3a3a46); v.box(0, 1, 14, 15, 2, 15, 0x3a3a46); return v; }
function mkPedestal(B) { const v = new Vox(10, 10, 7); v.box(0, 0, 0, 9, 9, 1, J(B.wallTop, 0.05)); v.box(2, 2, 2, 7, 7, 4, J(B.wall, 0.05)); v.box(1, 1, 5, 8, 8, 6, J(B.wallTop, 0.05)); return v; }
function mkArrow(shaft, head) { const v = new Vox(12, 3, 3); v.box(1, 1, 1, 9, 1, 1, shaft); v.box(10, 0, 1, 10, 2, 1, head); v.set(11, 1, 1, head); v.set(10, 1, 0, head); v.set(10, 1, 2, head); v.box(0, 0, 1, 1, 0, 1, 0xe0e0e0); v.box(0, 2, 1, 1, 2, 1, 0xe0e0e0); return v; }
function mkRock(B) { const v = new Vox(10, 10, 10); v.ell(5, 5, 5, 4.6, 4.2, 4.4, (x, y, z) => cjit(hash2(x, y, z) < 0.15 ? 0x3a3a3a : B.wall, 0.1)); return v; }
function mkBanner(bi) { const v = new Vox(2, 10, 14); const c = [0x8a1f2a, 0x2a2a6a, 0x1f5a6a][bi]; v.box(0, 0, 13, 1, 9, 13, 0x6a4a2a); v.box(0, 1, 2, 0, 8, 12, (x, y, z) => (z < 4 && (y + z) % 2) ? -1 : (y === 4 || y === 5) && z > 6 && z < 11 ? 0xe8b84a : c); return v; }
function mkMerchant() {
  const v = new Vox(12, 12, 18); const robe = 0x3a6a4a, trim = 0xe8b84a;
  v.cyl(6, 6, z => 4.6 - z * 0.12, 0, 11, (x, y, z) => z === 0 || z === 6 ? trim : cjit(robe, 0.05));
  v.ell(6, 6, 14, 3.4, 3.4, 3.4, J(robe, 0.05)); v.box(8, 5, 12, 9, 6, 14, 0x0a0a0a); v.set(9, 5, 13, 0xffd040, 1); v.set(9, 6, 13, 0xffd040, 1);
  v.box(1, 3, 4, 2, 8, 11, 0x7a5030); v.box(0, 4, 6, 0, 7, 9, 0x5a3a20); // sırt çantası
  v.box(7, 2, 7, 9, 2, 8, 0xd0a080); v.box(7, 9, 7, 9, 9, 8, 0xd0a080);
  return v;
}

// ---------------- karakterler (ön yüz +x) ----------------
function mkHero(f) {
  const v = new Vox(12, 12, 19); const steel = 0xb4bed0, steelD = 0x707c94, cape = 0xc02a34, boot = 0x4a3222, pants = 0x2e3448, gold = 0xffc848;
  const lo = f === 1 ? 1 : f === 2 ? -1 : 0;
  const leg = (x, y) => v.box(x, y, 0, x + 1, y + 1, 4, (xx, yy, z) => z <= 1 ? boot : pants);
  leg(5 + lo, 6); leg(5 - lo, 4);
  v.box(4, 3, 5, 7, 8, 10, (x, y, z) => z === 5 ? 0x5a3a22 : x === 7 ? cjit(steel, 0.03) : cjit(steelD, 0.04));
  v.set(7, 5, 5, gold); v.set(7, 6, 5, gold);
  v.box(7, 4, 8, 7, 7, 9, 0xd8e2f0); v.set(7, 5, 9, cape); v.set(7, 6, 9, cape); // göğüs arması
  v.box(5 - lo, 9, 6, 6 - lo, 9, 10, steelD); v.box(5 + lo, 2, 6, 6 + lo, 2, 10, steelD); // kollar
  v.box(5 + lo, 2, 5, 6 + lo, 2, 5, 0x5a3a22); v.box(5 - lo, 9, 5, 6 - lo, 9, 5, 0x5a3a22);
  v.box(4, 2, 10, 6, 3, 11, steel); v.box(4, 8, 10, 6, 9, 11, steel); // omuzluk
  v.box(3, 3, 2, 3, 8, 10, J(cape, 0.05)); v.box(2, 3, 2, 2, 8, 5, J(cape, 0.05)); // pelerin
  v.box(3, 3, 11, 8, 8, 16, (x, y, z) => ((x === 3 || x === 8) && (y === 3 || y === 8)) || (z === 16 && (x === 3 || x === 8 || y === 3 || y === 8)) ? -1 : cjit(steel, 0.03));
  v.box(8, 4, 13, 8, 7, 13, 0x14161e); v.set(8, 5, 13, 0x7fe8ff, 1); v.set(8, 6, 13, 0x7fe8ff, 1);
  v.box(8, 5, 11, 8, 6, 12, steelD);
  v.box(4, 5, 17, 6, 6, 17, cape); v.box(3, 5, 16, 3, 6, 17, cape); v.box(2, 5, 15, 2, 6, 16, cape);
  return v;
}
function mkSkeleton(f, archer) {
  const v = new Vox(12, 12, 18); const bone = 0xe6dfcc, boneD = 0xb4ac98, hood = 0x2f4a32;
  const lo = f === 1 ? 1 : f === 2 ? -1 : 0;
  v.box(5 + lo, 6, 0, 5 + lo, 7, 5, (x, y, z) => z === 0 ? boneD : bone); v.box(5 - lo, 4, 0, 5 - lo, 5, 5, (x, y, z) => z === 0 ? boneD : bone);
  v.box(5, 4, 5, 6, 7, 6, boneD); // pelvis
  v.box(5, 5, 6, 5, 6, 11, bone); // omurga
  for (let z = 7; z <= 11; z += 2) v.box(5, 3, z, 7, 8, z, (x, y) => (x === 7 && (y === 5 || y === 6)) ? -1 : bone); // kaburgalar
  v.box(6 + lo, 2, 6, 6 + lo, 2, 11, bone); v.box(6 - lo, 9, 6, 6 - lo, 9, 11, bone);
  v.ell(6, 6, 14.2, 2.9, 2.9, 2.6, J(bone, 0.03)); v.box(8, 5, 12, 8, 6, 12, boneD);
  v.set(8, 4, 14, 0xff3020, 1); v.set(8, 7, 14, 0xff3020, 1); v.set(8, 5, 13, 0x201810); v.set(8, 6, 13, 0x201810);
  if (archer) { v.ell(5.5, 6, 15, 3.4, 3.4, 3.2, (x, y, z) => x >= 7 && z < 16 ? null : cjit(hood, 0.05)); v.box(3, 3, 6, 4, 8, 11, J(hood, 0.05)); v.box(4, 3, 3, 4, 8, 6, J(hood, 0.05)); }
  return v;
}
function mkMage(f) {
  const v = new Vox(14, 14, 20); const robe = 0x5a2a8a, robeD = 0x3a1a5a, trim = 0xd8b040;
  const b = f ? 0.4 : 0;
  v.cyl(7, 7, z => 4.6 - z * 0.15 + (z < 2 ? b : 0), 0, 12, (x, y, z) => z === 0 ? trim : (x >= 9 && Math.abs(y + 0.5 - 7) < 1) ? trim : cjit(z < 6 ? robeD : robe, 0.05));
  v.ell(7, 7, 15, 3.4, 3.4, 3.6, (x, y, z) => cjit(robe, 0.05)); v.box(9, 6, 13, 10, 7, 15, 0x0a0610);
  v.set(10, 6, 14, 0xffe040, 1); v.set(10, 7, 14, 0xffe040, 1);
  v.box(6, 6, 18, 7, 7, 19, robe); // sivri kapşon
  v.box(9, 2, 0, 9, 2, 15, 0x5a3a20); v.ell(9.5, 2.5, 17, 1.6, 1.6, 1.6, f ? 0xff80ff : 0xd040ff, 1); // asa
  v.box(8, 2, 8 + f, 9, 3, 9 + f, 0xc0a0d0); v.box(8, 11, 8, 9, 11, 9, 0xc0a0d0);
  return v;
}
function mkOrc(f) {
  const v = new Vox(18, 18, 22); const skin = 0x6a9a3a, skinD = 0x4a7a2a, leather = 0x6a4428, metal = 0x8a8a96;
  const lo = f === 1 ? 1.5 : f === 2 ? -1.5 : 0;
  v.box(7 + lo, 10, 0, 9 + lo, 12, 6, (x, y, z) => z < 2 ? 0x3a2a1a : skinD); v.box(7 - lo, 5, 0, 9 - lo, 7, 6, (x, y, z) => z < 2 ? 0x3a2a1a : skinD);
  v.ell(8.5, 9, 11, 4.6, 6, 5.2, (x, y, z) => z < 9 ? cjit(leather, 0.05) : cjit(skin, 0.05));
  v.box(5, 4, 8, 12, 13, 8, 0x4a3018); v.box(12, 8, 8, 12, 9, 8, metal);
  v.ell(8.5, 3, 12, 2, 2, 2.6, J(metal, 0.05)); v.ell(8.5, 15, 12, 2, 2, 2.6, J(metal, 0.05)); // omuz
  v.box(9, 2, 5, 10, 3, 10, skin); v.box(9, 15, 5, 10, 16, 10, skin);
  v.ell(10, 9, 17, 3.6, 3.6, 3.4, J(skin, 0.04)); v.box(13, 7, 15, 13, 7, 16, 0xf0f0e0); v.box(13, 11, 15, 13, 11, 16, 0xf0f0e0);
  v.set(13, 8, 18, 0xffd020, 1); v.set(13, 10, 18, 0xffd020, 1); v.box(12, 7, 19, 13, 11, 19, skinD);
  // sopa
  v.box(10, 1, 4, 16, 2, 5, leather); v.box(14, 0, 3, 17, 3, 6, (x, y, z) => hash2(x, y, z) < 0.3 ? 0xc0c0c0 : 0x5a3a20);
  return v;
}
function mkSlime(c, cd) {
  const v = new Vox(14, 14, 11);
  v.ell(7, 7, 4.2, 6.4, 6.4, 5.2, (x, y, z) => { const d = Math.hypot(x + 0.5 - 7, y + 0.5 - 7); if (z < 1 && d > 5.5) return null; return z > 6 && x > 7 && y < 6 ? cmix(c, 0xffffff, 0.5) : hash2(x, y, z) < 0.08 ? cd : c; });
  v.ell(7, 7, 3, 2.4, 2.4, 2, cd);
  v.box(12, 4, 5, 12, 5, 7, 0xffffff); v.box(12, 9, 5, 12, 10, 7, 0xffffff); v.set(13, 5, 6, 0x101010); v.set(13, 9, 6, 0x101010);
  v.box(13, 6, 3, 13, 8, 3, cd);
  return v;
}
function mkBat(f) {
  const v = new Vox(10, 22, 8); const body = 0x4a3060, wing = 0x30203e;
  v.ell(5, 11, 4, 2.6, 2.6, 2.8, J(body, 0.05)); v.set(7, 10, 5, 0xff3030, 1); v.set(7, 12, 5, 0xff3030, 1);
  v.set(6, 9, 7, body); v.set(6, 13, 7, body); v.set(7, 10, 3, 0xffffff); v.set(7, 12, 3, 0xffffff);
  for (let s = -1; s <= 1; s += 2) for (let i = 1; i <= 9; i++) {
    const y = 11 + s * (2 + i), zz = f ? 4 + Math.round(i * 0.35) : 4 - Math.round(i * 0.25);
    for (let x = 2 + Math.floor(i / 3); x <= 7 - Math.floor(i / 4); x++) v.set(x, y, zz, i % 3 === 0 && x === 7 - Math.floor(i / 4) ? 0x1a1022 : wing);
  }
  return v;
}
function mkGolem(f, B) {
  const v = new Vox(28, 28, 34); const rock = B.wall, rockD = cmul(B.wall, 0.75), glow = B === BIOMES[1] ? 0xffa020 : 0x40f0ff;
  const lo = f === 1 ? 2 : f === 2 ? -2 : 0;
  const rk = (x, y, z) => hash2(x, y, z) < 0.04 ? glow : cjit(hash2(x >> 2, y >> 2, z >> 2) < 0.5 ? rock : rockD, 0.05);
  v.box(10 + lo, 16, 0, 15 + lo, 21, 9, rk); v.box(10 - lo, 6, 0, 15 - lo, 11, 9, rk);
  v.ell(13, 14, 18, 8, 11, 9, (x, y, z) => { const c = rk(x, y, z); return (Math.abs(x - 20) < 1 && Math.abs(y - 14) < 4 && z > 14 && z < 22) ? glow : c; });
  for (const k of [-1, 1]) { const sy = 14 + k * 11, so = k * lo; v.ell(13 + so, sy, 22, 4.6, 4.4, 4.6, rk); v.box(13 + so, sy - 3, 6, 18 + so, sy + 3, 18, rk); v.ell(17 + so, sy, 7, 4, 3.8, 3.6, rk); }
  v.ell(16, 14, 29, 4.6, 4.6, 4, rk); v.box(20, 12, 29, 20, 12, 30, glow, 1); v.box(20, 16, 29, 20, 16, 30, glow, 1);
  for (let i = 0; i < 40; i++) { const x = irnd(4, 23), y = irnd(4, 23), z = irnd(10, 30); if (v.get(x, y, z) >= 0 && hash2(x, y, z) < 0.5) v.set(x, y, z, glow, 1); }
  if (B === BIOMES[0]) for (let i = 0; i < 80; i++) { const x = irnd(4, 23), y = irnd(2, 26), z = irnd(24, 33); if (v.get(x, y, z) >= 0 && v.get(x, y, z + 1) < 0) v.set(x, y, z, cjit(0x5a9a3c, 0.1)); }
  return v;
}
function mkLich(f) {
  const v = new Vox(20, 20, 32); const robe = 0x1e1a2a, robeL = 0x3a2f52, bone = 0xe0d8c0, gold = 0xffc848, glow = 0x60ff90;
  v.cyl(10, 10, z => 2 + z * 0.3, 0, 8, (x, y, z) => (z + x + y + f) % 3 === 0 ? null : cjit(robe, 0.06));
  v.cyl(10, 10, z => 5 - (z - 9) * 0.12, 9, 21, (x, y, z) => (x >= 14 && Math.abs(y + 0.5 - 10) < 1) ? gold : cjit(z % 4 === 0 ? robeL : robe, 0.06));
  v.ell(10, 4, 20, 2.4, 2.4, 2.8, J(robeL, 0.05)); v.ell(10, 16, 20, 2.4, 2.4, 2.8, J(robeL, 0.05));
  v.ell(11, 10, 25, 3.4, 3.2, 3.2, J(bone, 0.03)); v.set(14, 9, 25, glow, 1); v.set(14, 11, 25, glow, 1); v.box(14, 9, 23, 14, 11, 23, 0x1a1410);
  for (let a = 0; a < 8; a++) { const x = 11 + Math.cos(a / 8 * TAU) * 3, y = 10 + Math.sin(a / 8 * TAU) * 3; v.box(x, y, 28, x, y, 29 + (a % 2), gold); v.set(x, y, 30, a % 2 ? 0xff3050 : gold, a % 2); }
  v.box(13, 2, 4, 13, 2, 30, 0x4a3a2a); v.ell(13.5, 2.5, 31, 1.8, 1.8, 1.4, glow, 1); v.box(12, 3, 18, 14, 4, 19, bone); v.box(12, 16, 18 + f, 14, 17, 19 + f, bone);
  return v;
}
// ---------------- silahlar (+x yönünde) ----------------
function mkSword(blade, guard, ghost) {
  const v = new Vox(22, 5, 3);
  if (!ghost) { v.box(0, 2, 1, 3, 2, 1, 0x5a3a22); v.set(0, 2, 1, guard); v.box(4, 0, 0, 4, 4, 2, guard); }
  v.box(5, 1, 1, 19, 3, 1, (x, y) => y === 2 ? cmul(blade, 0.85) : blade, ghost ? 1 : 0); v.box(20, 2, 1, 21, 2, 1, blade, ghost ? 1 : 0);
  v.box(6, 2, 2, 17, 2, 2, cmix(blade, 0xffffff, 0.5), ghost ? 1 : 0);
  return v;
}
function mkAxe() { const v = new Vox(18, 12, 3); v.box(0, 5, 1, 15, 6, 1, 0x6a4428); v.box(11, 0, 0, 16, 11, 2, (x, y) => (Math.abs(y - 5.5) > 1 + (x - 11) * 1.1) ? null : (x === 16 || Math.abs(y - 5.5) > 4.5) ? 0xf0f4ff : 0xa0a8b8); v.box(16, 5, 1, 17, 6, 1, 0xa0a8b8); return v; }
function mkSpear() { const v = new Vox(30, 5, 3); v.box(0, 2, 1, 23, 2, 1, 0x7a5430); v.box(22, 1, 0, 22, 3, 2, 0xe8b84a); v.box(23, 1, 1, 27, 3, 1, 0xd0d8e8); v.box(28, 2, 1, 29, 2, 1, 0xf0f4ff); v.set(25, 2, 2, 0xf0f4ff); return v; }
function mkStaff() { const v = new Vox(20, 6, 6); v.box(0, 2, 2, 15, 3, 3, 0x6a4428); v.box(15, 1, 1, 15, 4, 4, 0xe8b84a); v.ell(17.5, 3, 3, 2.4, 2.4, 2.4, 0xff7020, 1); v.ell(17.5, 3, 3, 1.2, 1.2, 1.2, 0xfff080, 1); return v; }
function mkXbow() { const v = new Vox(14, 14, 3); v.box(0, 6, 1, 11, 7, 1, 0x6a4428); v.box(9, 0, 1, 10, 13, 1, (x, y) => Math.abs(y - 6.5) > 5 ? 0x8a8a96 : 0x5a3a22); v.box(3, 1, 1, 3, 12, 1, (x, y) => Math.abs(y - 6.5) < 1 ? null : 0xe0e0d0); v.box(4, 6, 2, 12, 7, 2, 0xa0d0ff); return v; }
function mkBow() { const v = new Vox(6, 16, 3); for (let y = 0; y < 16; y++) { const x = Math.round(3 + Math.sin((y + 0.5) / 16 * Math.PI) * 2.5); v.set(x, y, 1, 0x6a4428); } v.box(0, 1, 1, 0, 14, 1, 0xd0d0c0); return v; }
