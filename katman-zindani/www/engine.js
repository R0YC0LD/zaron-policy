'use strict';
// =====================================================================
//  KATMAN ZİNDANI — Motor: matematik, WebGL sprite-stack renderer,
//  voxel -> katman pişirme, piksel font, ses sentezi
// =====================================================================
const TAU = Math.PI * 2;
function rnd(a = 1, b) { if (b === undefined) { b = a; a = 0; } return a + Math.random() * (b - a); }
function irnd(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function d2(ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

// ---------- renk ----------
function rgb(r, g, b) { return (clamp(r | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(b | 0, 0, 255); }
const cR = c => c >> 16 & 255, cG = c => c >> 8 & 255, cB = c => c & 255;
function cmul(c, f) { return rgb(cR(c) * f, cG(c) * f, cB(c) * f); }
function cmix(a, b, t) { return rgb(lerp(cR(a), cR(b), t), lerp(cG(a), cG(b), t), lerp(cB(a), cB(b), t)); }
function cjit(c, a) { return cmul(c, 1 + (Math.random() * 2 - 1) * a); }
function J(c, a) { return () => cjit(c, a); }
function css(c, a = 1) { return `rgba(${cR(c)},${cG(c)},${cB(c)},${a})`; }
function c3(c) { return [cR(c) / 255, cG(c) / 255, cB(c) / 255]; }

// ---------- matris ----------
const M4 = {
  persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2), o = new Float32Array(16); o[0] = t / a; o[5] = t; o[10] = (fa + n) / (n - fa); o[11] = -1; o[14] = 2 * fa * n / (n - fa); return o; },
  look(e, c, u) {
    let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2]; let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx; l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    const o = new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
    o.right = [xx, xy, xz]; o.up = [yx, yy, yz]; return o;
  },
  mul(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
};

// =====================================================================
//  WebGL
// =====================================================================
const FL = 13; // vertex başına float: pos3 uv2 col4 fx3 rot1
const VS = `
attribute vec3 aP; attribute vec2 aT; attribute vec4 aC; attribute vec3 aF; attribute float aR;
uniform mat4 uVP; varying vec2 vT; varying vec4 vC; varying vec3 vF; varying vec3 vW; varying vec2 vRS;
void main(){ vT=aT; vC=aC; vF=aF; vW=aP; vRS=vec2(cos(aR),sin(aR)); gl_Position=uVP*vec4(aP,1.0); }`;
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex; uniform sampler2D uNrm; uniform int uMode; uniform vec3 uKey; uniform vec3 uKeyC;
uniform vec4 uL[16]; uniform vec3 uLC[16]; uniform int uNL;
uniform vec3 uAmb; uniform vec3 uFog; uniform vec3 uTgt; uniform vec2 uFogR;
uniform vec3 uX; uniform float uXz;
varying vec2 vT; varying vec4 vC; varying vec3 vF; varying vec3 vW; varying vec2 vRS;
float b2(vec2 p){ return mod(p.x*2.0+p.y*3.0,4.0); }
float bayer(vec2 p){ p=floor(mod(p,4.0)); vec2 a=mod(p,2.0); vec2 c=floor(p/2.0); return (4.0*b2(a)+b2(c)+0.5)/16.0; }
void main(){
  vec4 t=texture2D(uTex,vT);
  if(uMode==0){
    if(t.a<0.4) discard;
    float th=bayer(gl_FragCoord.xy);
    if(vC.a<0.999 && vC.a<=th) discard;
    if(vF.z>0.5){
      float r=length(gl_FragCoord.xy-uX.xy)/uX.z;
      if(r<1.0 && gl_FragCoord.z<uXz){ if(th<0.82-r*r*0.7) discard; }
    }
    vec3 c=t.rgb*vC.rgb;
    float em=max(vF.x, t.a<0.9?1.0:0.0);
    vec3 n0=texture2D(uNrm,vT).xyz*2.0-1.0;
    vec3 n=normalize(vec3(n0.x*vRS.x-n0.y*vRS.y, n0.x*vRS.y+n0.y*vRS.x, n0.z));
    vec3 L=uAmb*(0.5+0.5*n.z)*(0.8+clamp(vW.z,0.0,40.0)*0.01);
    L+=uKeyC*max(dot(n,uKey),0.0);
    for(int i=0;i<16;i++){
      if(i>=uNL) break;
      vec3 d=uL[i].xyz-vW; float dl=length(d);
      float a=max(0.0,1.0-length(d*vec3(1.0,1.0,1.4))/uL[i].w);
      float nd=max(dot(n,d/max(dl,0.001)),0.0);
      L+=uLC[i]*a*a*(0.25+1.0*nd);
    }
    vec3 col=mix(c*L, c*1.25, em);
    col=mix(col, vec3(1.0,0.97,0.9), vF.y);
    float fd=length(vW.xy-uTgt.xy);
    float fg=smoothstep(uFogR.x,uFogR.y,fd);
    col=mix(col,uFog,fg*(1.0-em*0.6));
    float lu=dot(col,vec3(0.299,0.587,0.114));
    col=mix(vec3(lu),col,1.18);
    col=col*vec3(1.02,1.0,1.04)+vec3(0.006,0.004,0.012);
    gl_FragColor=vec4(col,1.0);
  } else if(uMode==1){
    gl_FragColor=vec4(vC.rgb, t.a*vC.a);
  } else {
    float fd=length(vW.xy-uTgt.xy);
    float fg=1.0-smoothstep(uFogR.x,uFogR.y,fd)*0.7;
    gl_FragColor=vec4(vC.rgb*t.a*vC.a*fg, 1.0);
  }
}`;

const R3 = {}; // renderer state
function initGL(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: true, powerPreference: 'high-performance', premultipliedAlpha: false });
  if (!gl) throw new Error('WebGL desteklenmiyor');
  R3.gl = gl;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  gl.useProgram(p); R3.prog = p;
  R3.a = { P: gl.getAttribLocation(p, 'aP'), T: gl.getAttribLocation(p, 'aT'), C: gl.getAttribLocation(p, 'aC'), F: gl.getAttribLocation(p, 'aF') };
  R3.u = {};
  R3.a.R = gl.getAttribLocation(p, 'aR');
  for (const n of ['uNrm', 'uKey', 'uKeyC', 'uVP', 'uTex', 'uMode', 'uL', 'uLC', 'uNL', 'uAmb', 'uFog', 'uTgt', 'uFogR', 'uX', 'uXz']) R3.u[n] = gl.getUniformLocation(p, n);
  for (const k in R3.a) gl.enableVertexAttribArray(R3.a[k]);
  // ortak index buffer
  const MAXQ = 16384; const idx = new Uint16Array(MAXQ * 6);
  for (let i = 0; i < MAXQ; i++) { const o = i * 6, v = i * 4; idx[o] = v; idx[o + 1] = v + 1; idx[o + 2] = v + 2; idx[o + 3] = v; idx[o + 4] = v + 2; idx[o + 5] = v + 3; }
  R3.ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, R3.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  R3.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, R3.tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(R3.u.uTex, 0);
  R3.ntex = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, R3.ntex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.activeTexture(gl.TEXTURE0); gl.uniform1i(R3.u.uNrm, 1);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);
  return gl;
}

class QuadBuf {
  constructor(maxQ, dynamic = true) {
    this.max = Math.min(maxQ, 16384); this.d = new Float32Array(this.max * 4 * FL); this.n = 0; this.dyn = dynamic;
    const gl = R3.gl; this.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.d.byteLength, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
  }
  reset() { this.n = 0; }
  upload() { const gl = R3.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo); if (this.n) gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.d.subarray(0, this.n * 4 * FL)); }
  draw() {
    if (!this.n) return; const gl = R3.gl, a = R3.a; gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    const S = FL * 4; gl.vertexAttribPointer(a.P, 3, gl.FLOAT, false, S, 0); gl.vertexAttribPointer(a.T, 2, gl.FLOAT, false, S, 12);
    gl.vertexAttribPointer(a.C, 4, gl.FLOAT, false, S, 20); gl.vertexAttribPointer(a.F, 3, gl.FLOAT, false, S, 36); gl.vertexAttribPointer(a.R, 1, gl.FLOAT, false, S, 48);
    gl.drawElements(gl.TRIANGLES, this.n * 6, gl.UNSIGNED_SHORT, 0);
  }
  free() { R3.gl.deleteBuffer(this.vbo); }
}

// ---------- atlas ----------
const ATS = 2048;
const Atlas = {
  data: null, ndata: null, x: 1, y: 1, rowH: 0,
  reset() { this.data = new Uint8Array(ATS * ATS * 4); this.ndata = new Uint8Array(ATS * ATS * 4); for (let i = 0; i < this.ndata.length; i += 4) { this.ndata[i] = 128; this.ndata[i + 1] = 128; this.ndata[i + 2] = 255; this.ndata[i + 3] = 255; } this.x = 1; this.y = 1; this.rowH = 0; },
  alloc(w, h) {
    if (this.x + w + 1 > ATS) { this.x = 1; this.y += this.rowH + 1; this.rowH = 0; }
    if (this.y + h + 1 > ATS) throw new Error('atlas dolu');
    const r = { x: this.x, y: this.y, w, h }; this.x += w + 1; this.rowH = Math.max(this.rowH, h); return r;
  },
  npx(x, y, nx, ny, nz) { const i = (y * ATS + x) * 4; const D = this.ndata; D[i] = (nx * 0.5 + 0.5) * 255; D[i + 1] = (ny * 0.5 + 0.5) * 255; D[i + 2] = (nz * 0.5 + 0.5) * 255; },
  px(x, y, r, g, b, a) { const i = (y * ATS + x) * 4; const D = this.data; D[i] = r; D[i + 1] = g; D[i + 2] = b; D[i + 3] = a; },
  uv(r) { const e = 0.02; return [(r.x + e) / ATS, (r.y + e) / ATS, (r.x + r.w - e) / ATS, (r.y + r.h - e) / ATS]; },
  upload() { const gl = R3.gl; gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, R3.ntex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ATS, ATS, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.ndata); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, R3.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ATS, ATS, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.data); }
};
const SPR = {}; // özel 2D bölgeler
function bakeSprites() {
  let r = Atlas.alloc(4, 4); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) Atlas.px(r.x + x, r.y + y, 255, 255, 255, 255);
  SPR.white = Atlas.uv({ x: r.x + 1, y: r.y + 1, w: 2, h: 2 });
  const S = 32;
  r = Atlas.alloc(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const d = Math.hypot(x + 0.5 - S / 2, y + 0.5 - S / 2) / (S / 2); const a = clamp(1 - d, 0, 1); Atlas.px(r.x + x, r.y + y, 255, 255, 255, Math.round(Math.pow(a, 1.6) * 255)); }
  SPR.soft = Atlas.uv(r);
  r = Atlas.alloc(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const d = Math.hypot(x + 0.5 - S / 2, y + 0.5 - S / 2) / (S / 2); const a = d > 1 ? 0 : clamp(1 - Math.abs(d - 0.86) / 0.14, 0, 1); Atlas.px(r.x + x, r.y + y, 255, 255, 255, Math.round(a * 255)); }
  SPR.ring = Atlas.uv(r);
  r = Atlas.alloc(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const d = Math.hypot(x + 0.5 - S / 2, y + 0.5 - S / 2) / (S / 2); const a = d > 1 ? 0 : (d > 0.82 ? 1 : 0.35); Atlas.px(r.x + x, r.y + y, 255, 255, 255, Math.round(a * 255)); }
  SPR.disc = Atlas.uv(r);
  // pixel shadow (dithered edge)
  r = Atlas.alloc(16, 16); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8) / 8; Atlas.px(r.x + x, r.y + y, 0, 0, 0, d > 1 ? 0 : d > 0.75 ? 120 : 190); }
  SPR.shadow = Atlas.uv(r);
}

// ---------- voxel ----------
class Vox {
  constructor(w, d, h) { this.w = w; this.d = d; this.h = h; this.c = new Int32Array(w * d * h).fill(-1); this.e = new Uint8Array(w * d * h); }
  in(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.d && z < this.h; }
  get(x, y, z) { return this.in(x, y, z) ? this.c[(z * this.d + y) * this.w + x] : -1; }
  set(x, y, z, c, em) {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z); if (!this.in(x, y, z)) return;
    const i = (z * this.d + y) * this.w + x; if (typeof c === 'function') c = c(x, y, z);
    if (c == null || c < 0) { this.c[i] = -1; return; } this.c[i] = c; this.e[i] = em ? 1 : 0;
  }
  box(x0, y0, z0, x1, y1, z1, c, em) { for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, z, c, em); }
  ell(cx, cy, cz, rx, ry, rz, c, em) {
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const a = (x + 0.5 - cx) / rx, b = (y + 0.5 - cy) / ry, d = (z + 0.5 - cz) / rz; if (a * a + b * b + d * d <= 1) this.set(x, y, z, c, em);
    }
  }
  cyl(cx, cy, r, z0, z1, c, em) { for (let z = z0; z <= z1; z++) { const rr = typeof r === 'function' ? r(z) : r; for (let y = Math.floor(cy - rr); y <= Math.ceil(cy + rr); y++) for (let x = Math.floor(cx - rr); x <= Math.ceil(cx + rr); x++) { if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= rr) this.set(x, y, z, c, em); } } }
}
// voxel modeli katmanlara pişir ve atlasa koy
function bake(v, o = {}) {
  const { w, d, h } = v; const m = { w, d, h, px: o.px || 0, py: o.py || 0, L: [], cols: [] };
  const ao = o.ao === undefined ? 0.4 : o.ao;
  for (let z = 0; z < h; z++) {
    let any = false; for (let i = z * w * d, e = i + w * d; i < e; i++) if (v.c[i] >= 0) { any = true; break; }
    if (!any) continue;
    const r = Atlas.alloc(w, d);
    for (let y = 0; y < d; y++) for (let x = 0; x < w; x++) {
      const i = (z * d + y) * w + x, c = v.c[i]; if (c < 0) continue; const em = v.e[i];
      let f = 1;
      if (!em) {
        f = h > 1 ? (1 - ao) + ao * Math.pow(z / (h - 1), 0.7) : 1;
        if (v.get(x, y, z + 1) < 0) f *= 1.06;
        if (!o.noEdge && (v.get(x - 1, y, z) < 0 || v.get(x + 1, y, z) < 0 || v.get(x, y - 1, z) < 0 || v.get(x, y + 1, z) < 0)) f *= 0.93;
      }
      // normal: boş komşulara doğru (26 komşu)
      let nx = 0, ny = 0, nz = 0;
      if (h > 1) for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy && !dz) continue; const zz = z + dz; if (zz < 0) continue;
        if (v.get(x + dx, y + dy, zz) < 0) { const l = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz); nx += dx * l; ny += dy * l; nz += dz * l; }
      }
      let nl = Math.hypot(nx, ny, nz); if (nl < 0.3) { nx = 0; ny = 0; nz = 1; nl = 1; }
      nz += 0.12 * nl; nl = Math.hypot(nx, ny, nz);
      Atlas.npx(r.x + x, r.y + (d - 1 - y), nx / nl, ny / nl, nz / nl);
      Atlas.px(r.x + x, r.y + (d - 1 - y), clamp(cR(c) * f, 0, 255) | 0, clamp(cG(c) * f, 0, 255) | 0, clamp(cB(c) * f, 0, 255) | 0, em ? 180 : 255);
      if (m.cols.length < 64 && Math.random() < 0.3) m.cols.push(c);
    }
    m.L.push({ z, uv: Atlas.uv(r) });
  }
  if (!m.cols.length) m.cols.push(0x888888);
  return m;
}

// ---------- geometri yazıcıları ----------
const DEF = { r: 1, g: 1, b: 1, a: 1, e: 0, f: 0, o: 0, sz: 1 };
function wv(B, x, y, z, u, v, r, g, b, a, e, f, o, rot) {
  const D = B.d, i = B._i; D[i] = x; D[i + 1] = y; D[i + 2] = z; D[i + 3] = u; D[i + 4] = v; D[i + 5] = r; D[i + 6] = g; D[i + 7] = b; D[i + 8] = a; D[i + 9] = e; D[i + 10] = f; D[i + 11] = o; D[i + 12] = rot || 0; B._i += FL;
}
function pushModel(B, m, x, y, z, ang, sc, o = DEF) {
  if (!m || B.n + m.L.length > B.max) return;
  const r = o.r ?? 1, g = o.g ?? 1, b = o.b ?? 1, a = o.a ?? 1, e = o.e || 0, f = o.f || 0, oc = o.o || 0, sz = o.sz || 1;
  const ca = Math.cos(ang) * sc, sa = Math.sin(ang) * sc;
  const x0 = -m.w / 2 - m.px, x1 = m.w / 2 - m.px, y0 = -m.d / 2 - m.py, y1 = m.d / 2 - m.py;
  const ax = x + x0 * ca - y0 * sa, ay = y + x0 * sa + y0 * ca;
  const bx = x + x1 * ca - y0 * sa, by = y + x1 * sa + y0 * ca;
  const cx = x + x1 * ca - y1 * sa, cy = y + x1 * sa + y1 * ca;
  const dx = x + x0 * ca - y1 * sa, dy = y + x0 * sa + y1 * ca;
  const zs = sc * sz, vc = o.vc;
  const ka = vc ? vc(ax, ay) : 1, kb = vc ? vc(bx, by) : 1, kc = vc ? vc(cx, cy) : 1, kd = vc ? vc(dx, dy) : 1;
  B._i = B.n * 4 * FL;
  for (let li = m.L.length - 1; li >= 0; li--) {
    const L = m.L[li], zz = z + L.z * zs, uv = L.uv;
    wv(B, ax, ay, zz, uv[0], uv[3], r * ka, g * ka, b * ka, a, e, f, oc, ang);
    wv(B, bx, by, zz, uv[2], uv[3], r * kb, g * kb, b * kb, a, e, f, oc, ang);
    wv(B, cx, cy, zz, uv[2], uv[1], r * kc, g * kc, b * kc, a, e, f, oc, ang);
    wv(B, dx, dy, zz, uv[0], uv[1], r * kd, g * kd, b * kd, a, e, f, oc, ang);
    B.n++;
  }
}
function pushBill(B, x, y, z, s, uv, r, g, b, a, e = 1) {
  if (B.n >= B.max) return; const R = R3.right, U = R3.up; B._i = B.n * 4 * FL;
  const rx = R[0] * s, ry = R[1] * s, rz = R[2] * s, ux = U[0] * s, uy = U[1] * s, uz = U[2] * s;
  wv(B, x - rx - ux, y - ry - uy, z - rz - uz, uv[0], uv[3], r, g, b, a, e, 0, 0);
  wv(B, x + rx - ux, y + ry - uy, z + rz - uz, uv[2], uv[3], r, g, b, a, e, 0, 0);
  wv(B, x + rx + ux, y + ry + uy, z + rz + uz, uv[2], uv[1], r, g, b, a, e, 0, 0);
  wv(B, x - rx + ux, y - ry + uy, z - rz + uz, uv[0], uv[1], r, g, b, a, e, 0, 0);
  B.n++;
}
function pushFlat(B, x, y, z, s, ang, uv, r, g, b, a, sy) {
  if (B.n >= B.max) return; B._i = B.n * 4 * FL; sy = sy || s;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const P = [[-s, -sy], [s, -sy], [s, sy], [-s, sy]], T = [[uv[0], uv[3]], [uv[2], uv[3]], [uv[2], uv[1]], [uv[0], uv[1]]];
  for (let k = 0; k < 4; k++) wv(B, x + P[k][0] * ca - P[k][1] * sa, y + P[k][0] * sa + P[k][1] * ca, z, T[k][0], T[k][1], r, g, b, a, 1, 0, 0);
  B.n++;
}
function pushQuad4(B, pts, z, uv, r, g, b, a) { // düz dörtgen (iz efektleri)
  if (B.n >= B.max) return; B._i = B.n * 4 * FL; const u = SPR.white;
  for (let k = 0; k < 4; k++) wv(B, pts[k][0], pts[k][1], pts[k][2] ?? z, (u[0] + u[2]) / 2, (u[1] + u[3]) / 2, r, g, b, a, 1, 0, 0);
  B.n++;
}

// =====================================================================
//  Piksel font (5x7, Türkçe karakter birleşimli)
// =====================================================================
const FONT_SRC = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110', C: '01110 10001 10000 10000 10000 10001 01110',
  D: '11110 10001 10001 10001 10001 10001 11110', E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001', I: '01110 00100 00100 00100 00100 00100 01110',
  J: '00111 00010 00010 00010 00010 10010 01100', K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001', O: '01110 10001 10001 10001 10001 10001 01110',
  P: '11110 10001 10001 11110 10000 10000 10000', Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100', U: '10001 10001 10001 10001 10001 10001 01110',
  V: '10001 10001 10001 10001 10001 01010 00100', W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  '0': '01110 10001 10011 10101 11001 10001 01110', '1': '00100 01100 00100 00100 00100 00100 01110', '2': '01110 10001 00001 00010 00100 01000 11111',
  '3': '11111 00010 00100 00010 00001 10001 01110', '4': '00010 00110 01010 10010 11111 00010 00010', '5': '11111 10000 11110 00001 00001 10001 01110',
  '6': '00110 01000 10000 11110 10001 10001 01110', '7': '11111 00001 00010 00100 01000 01000 01000', '8': '01110 10001 10001 01110 10001 10001 01110',
  '9': '01110 10001 10001 01111 00001 00010 01100', '.': '00000 00000 00000 00000 00000 01100 01100', ',': '00000 00000 00000 00000 01100 00100 01000',
  '!': '00100 00100 00100 00100 00100 00000 00100', '?': '01110 10001 00001 00010 00100 00000 00100', ':': '00000 01100 01100 00000 01100 01100 00000',
  '-': '00000 00000 00000 11111 00000 00000 00000', '+': '00000 00100 00100 11111 00100 00100 00000', '%': '11000 11001 00010 00100 01000 10011 00011',
  '/': '00000 00001 00010 00100 01000 10000 00000', "'": '00100 00100 01000 00000 00000 00000 00000', '(': '00010 00100 01000 01000 01000 00100 00010',
  ')': '01000 00100 00010 00010 00010 00100 01000', '>': '01000 00100 00010 00001 00010 00100 01000', '<': '00010 00100 01000 10000 01000 00100 00010',
  '=': '00000 00000 11111 00000 11111 00000 00000', '*': '00000 10101 01110 11111 01110 10101 00000', ' ': '00000 00000 00000 00000 00000 00000 00000',
  '#': '01010 11111 01010 01010 01010 11111 01010', '♥': '00000 01010 11111 11111 01110 00100 00000', '$': '00100 01111 10100 01110 00101 11110 00100', '·': '00000 00000 00000 01100 01100 00000 00000'
};
const ACC = { 'Ç': ['C', 'ced'], 'Ş': ['S', 'ced'], 'Ğ': ['G', 'brv'], 'İ': ['I', 'dot'], 'Ö': ['O', 'uml'], 'Ü': ['U', 'uml'], 'Â': ['A', 'dot'] };
const FONT = {};
for (const k in FONT_SRC) FONT[k] = FONT_SRC[k].split(' ').map(r => [...r].map(Number));
const TCache = new Map();
function textCanvas(str, col, sc, sh) {
  const key = str + '|' + col + '|' + sc + '|' + sh; let c = TCache.get(key); if (c) return c;
  if (TCache.size > 600) TCache.clear();
  const s = str.toLocaleUpperCase('tr-TR'); const chars = [...s];
  const W = Math.max(1, chars.length * 6 * sc + sc * 3), H = 11 * sc + sc * 4;
  c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const draw = (ox, oy, color) => {
    x.fillStyle = color; let cx = ox;
    for (const ch of chars) {
      let base = ch, acc = null; if (ACC[ch]) { base = ACC[ch][0]; acc = ACC[ch][1]; }
      const g = FONT[base] || FONT['?'];
      for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (g[r][q]) x.fillRect(cx + q * sc, oy + (r + 2) * sc, sc, sc);
      if (acc === 'dot') x.fillRect(cx + 2 * sc, oy, sc, sc);
      if (acc === 'uml') { x.fillRect(cx + 1 * sc, oy, sc, sc); x.fillRect(cx + 3 * sc, oy, sc, sc); }
      if (acc === 'brv') { x.fillRect(cx + 1 * sc, oy, sc, sc); x.fillRect(cx + 3 * sc, oy, sc, sc); x.fillRect(cx + 2 * sc, oy + sc, sc, sc); }
      if (acc === 'ced') { x.fillRect(cx + 2 * sc, oy + 9 * sc, sc, sc); x.fillRect(cx + 1 * sc, oy + 10 * sc, sc, sc); }
      cx += 6 * sc;
    }
  };
  if (sh) { draw(sc, sc * 2, sh); for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) draw(sc + ox * sc, sc + oy * sc, sh); }
  draw(sc, sc, col);
  TCache.set(key, c); return c;
}
function txt(ctx, str, x, y, sc, col = '#fff', align = 0, sh = 'rgba(0,0,0,0.75)') {
  const c = textCanvas(String(str), col, Math.max(1, Math.round(sc)), sh);
  const dx = align === 1 ? x - c.width / 2 : align === 2 ? x - c.width : x;
  ctx.drawImage(c, Math.round(dx - Math.round(sc)), Math.round(y - 3 * Math.round(sc)));
  return c.width;
}
function txtW(str, sc) { return [...String(str)].length * 6 * Math.round(sc); }
function wrapText(str, maxChars) { const w = str.split(' '); const out = []; let line = ''; for (const s of w) { if ((line + ' ' + s).trim().length > maxChars) { out.push(line.trim()); line = s; } else line += ' ' + s; } if (line.trim()) out.push(line.trim()); return out; }

// =====================================================================
//  Ses (WebAudio sentez)
// =====================================================================
const SFX = {
  ctx: null, master: null, music: null, on: true, musicOn: true, noiseBuf: null, mt: 0, step: 0, intensity: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.55; this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain(); this.music.gain.value = 0.22; this.music.connect(this.master);
      const dl = this.ctx.createDelay(); dl.delayTime.value = 0.33; const fb = this.ctx.createGain(); fb.gain.value = 0.35; const lp = this.ctx.createBiquadFilter(); lp.frequency.value = 1800;
      this.music.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(this.master);
      const n = this.ctx.sampleRate; this.noiseBuf = this.ctx.createBuffer(1, n, n); const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.mt = this.ctx.currentTime + 0.1;
    } catch (e) { this.ctx = null; }
  },
  tone(type, f0, f1, dur, vol, dst, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay; const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(dst || this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(f0, f1, dur, vol, q = 1, type = 'bandpass', delay = 0) {
    const c = this.ctx, t = c.currentTime + delay; const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.playbackRate.value = rnd(0.8, 1.2);
    const fl = c.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(this.master); s.start(t, rnd(0, 0.5)); s.stop(t + dur + 0.05);
  },
  play(n) {
    if (!this.ctx || !this.on) return; const r = rnd(0.92, 1.08);
    switch (n) {
      case 'swing': this.noise(900 * r, 3200, 0.14, 0.35, 1.2); break;
      case 'heavy': this.noise(500 * r, 1600, 0.25, 0.45, 1); this.tone('sine', 120, 60, 0.2, 0.25); break;
      case 'hit': this.tone('square', 220 * r, 90, 0.08, 0.16); this.noise(2000, 600, 0.08, 0.3, 0.8); break;
      case 'crit': this.tone('square', 520 * r, 160, 0.12, 0.18); this.noise(3000, 800, 0.1, 0.35, 0.8); break;
      case 'kill': this.noise(1200, 200, 0.3, 0.4, 0.7); this.tone('triangle', 300 * r, 60, 0.25, 0.2); break;
      case 'hurt': this.tone('sawtooth', 300, 80, 0.25, 0.22); this.noise(800, 200, 0.2, 0.3); break;
      case 'coin': this.tone('square', 1320 * r, 0, 0.07, 0.07); this.tone('square', 1760 * r, 0, 0.12, 0.07, null, 0.06); break;
      case 'dash': this.noise(400, 2600, 0.18, 0.3, 0.6); break;
      case 'shoot': this.tone('square', 700 * r, 200, 0.12, 0.1); break;
      case 'magic': this.tone('sine', 400 * r, 1200, 0.2, 0.12); this.tone('triangle', 800 * r, 300, 0.25, 0.06); break;
      case 'eshoot': this.tone('sine', 500 * r, 250, 0.18, 0.08); break;
      case 'boom': this.noise(600, 60, 0.6, 0.6, 0.5, 'lowpass'); this.tone('sine', 90, 30, 0.5, 0.4); break;
      case 'pick': [0, 4, 7, 12].forEach((s, i) => this.tone('square', 523 * Math.pow(2, s / 12), 0, 0.12, 0.06, null, i * 0.06)); break;
      case 'up': [0, 4, 7, 12, 16].forEach((s, i) => this.tone('triangle', 392 * Math.pow(2, s / 12), 0, 0.25, 0.12, null, i * 0.07)); break;
      case 'door': this.tone('sawtooth', 70, 50, 0.4, 0.15); this.noise(300, 100, 0.4, 0.25, 1, 'lowpass'); break;
      case 'clear': [0, 3, 7, 10, 12].forEach((s, i) => this.tone('triangle', 330 * Math.pow(2, s / 12), 0, 0.3, 0.1, null, i * 0.08)); break;
      case 'chest': this.tone('square', 200, 400, 0.2, 0.08); [0, 7, 12, 19].forEach((s, i) => this.tone('sine', 660 * Math.pow(2, s / 12), 0, 0.3, 0.09, null, 0.15 + i * 0.06)); break;
      case 'nova': this.noise(200, 4000, 0.5, 0.5, 0.5); this.tone('sawtooth', 100, 600, 0.4, 0.15); this.tone('sine', 60, 30, 0.6, 0.4); break;
      case 'spawn': this.tone('sine', 200 * r, 600, 0.3, 0.06); break;
      case 'roar': this.tone('sawtooth', 110, 45, 1.0, 0.25); this.noise(400, 80, 1.0, 0.4, 0.5, 'lowpass'); break;
      case 'portal': [0, 5, 10, 15, 20].forEach((s, i) => this.tone('sine', 300 * Math.pow(2, s / 12), 0, 0.5, 0.08, null, i * 0.05)); break;
      case 'break': this.noise(1500, 300, 0.2, 0.4, 0.7); this.tone('square', 150, 70, 0.1, 0.1); break;
      case 'zap': this.noise(5000, 1500, 0.15, 0.3, 2); this.tone('square', 1500, 300, 0.1, 0.06); break;
      case 'buy': this.tone('square', 880, 0, 0.08, 0.08); this.tone('square', 1320, 0, 0.15, 0.08, null, 0.08); break;
      case 'deny': this.tone('square', 160, 120, 0.2, 0.1); break;
      case 'click': this.tone('square', 900, 600, 0.04, 0.05); break;
    }
  },
  // prosedürel karanlık müzik
  scale: [0, 3, 5, 7, 10, 12, 15, 17],
  tick() {
    if (!this.ctx) return; const c = this.ctx; const bpm = 92 + this.intensity * 28, sp = 60 / bpm / 2;
    while (this.mt < c.currentTime + 0.25) {
      const t = this.mt, s = this.step++;
      if (this.musicOn && this.on) {
        const bar = Math.floor(s / 16) % 4, root = [0, -4, -2, -5][bar];
        if (s % 16 === 0) this.note('triangle', 55 * Math.pow(2, root / 12), sp * 15, 0.35, t);
        if (s % 8 === 4 && this.intensity > 0.3) this.note('square', 110 * Math.pow(2, root / 12), sp * 0.9, 0.08, t);
        if (s % 2 === 0 || this.intensity > 0.5) {
          const deg = this.scale[Math.floor(hash2(s, bar, 7) * this.scale.length)];
          if (hash2(s, 3) < 0.55 + this.intensity * 0.3) this.note(this.intensity > 0.5 ? 'square' : 'triangle', 220 * Math.pow(2, (root + deg) / 12), sp * 0.8, 0.05 + this.intensity * 0.02, t);
        }
        if (this.intensity > 0.4 && s % 4 === 0) this.kick(t);
        if (this.intensity > 0.4 && s % 4 === 2) this.hat(t);
      }
      this.mt += sp;
    }
  },
  note(type, f, dur, vol, t) { const c = this.ctx; const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(this.music); o.start(t); o.stop(t + dur + 0.05); },
  kick(t) { const c = this.ctx; const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2); o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.25); },
  hat(t) { const c = this.ctx; const s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000; const g = c.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); s.connect(f); f.connect(g); g.connect(this.music); s.start(t, rnd(0, 0.5)); s.stop(t + 0.06); }
};
