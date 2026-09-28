// ── Shaded "hi-bit" painter for the trading-card photos ──
// Tapered capsules, ellipses and free regions, each lit per pixel (as a
// cylinder/sphere) into a 4-tone hue-shifted ramp; painted in order, then
// selective outlines: a dark line where a part overlaps a different part,
// and a dark exterior silhouette. Pure — outputs arrays of "#rrggbb".

export const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const rgb2hex = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
export const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(...A.map((v, i) => v + (B[i] - v) * t)); };

// Shadows lean cool/purple, lights lean warm
export function ramp(base, { light = 0.38, shadow = 0.3, deep = 0.55 } = {}) {
  return [mix(base, "#1e1630", deep), mix(base, "#2b2440", shadow), base, mix(base, "#fff6dc", light)];
}
export const material = (base, opts) => { const r = ramp(base, opts); return { ramp: r, line: mix(r[0], "#0d0a12", 0.45) }; };

let L = [0, 0, 1];
export function setLight(x, y, z) { const m = Math.hypot(x, y, z); L = [x / m, y / m, z / m]; }
setLight(-0.45, -0.62, 0.64);

export function tone(mat, nx, ny, bias = 0) {
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  const i = nx * L[0] + ny * L[1] + nz * L[2] + bias;
  const r = mat.ramp;
  return i > 0.8 ? r[3] : i > 0.42 ? r[2] : i > 0.05 ? r[1] : r[0];
}

export class Canvas {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.col = new Array(w * h).fill(null);
    this.pid = new Int32Array(w * h).fill(-1);
    this.mat = new Array(w * h).fill(null);
    this.parts = [];
  }
  part(group) { this.parts.push({ group }); return this.parts.length - 1; }
  put(x, y, c, pid, mat) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    this.col[i] = c;
    if (pid != null) this.pid[i] = pid;
    if (mat) this.mat[i] = mat;
  }
  pidAt(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? -1 : this.pid[y * this.w + x]; }
}

export const inEllipse = (cx, cy, rx, ry) => (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
export const inCapsule = (a, b, ra, rb) => (x, y) => {
  const px = x + 0.5, py = y + 0.5, abx = b[0] - a[0], aby = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * abx + (py - a[1]) * aby) / (abx * abx + aby * aby || 1)));
  const r = ra + (rb - ra) * t;
  return (px - a[0] - abx * t) ** 2 + (py - a[1] - aby * t) ** 2 <= r * r;
};

// Tapered capsule a→b; bands: [[t0, t1, mat]] recolor along the axis
export function capsule(cv, group, mat, a, b, ra, rb, { bands, bias = 0, pid } = {}) {
  const id = pid ?? cv.part(group);
  const x0 = Math.floor(Math.min(a[0] - ra, b[0] - rb)) - 1, x1 = Math.ceil(Math.max(a[0] + ra, b[0] + rb)) + 1;
  const y0 = Math.floor(Math.min(a[1] - ra, b[1] - rb)) - 1, y1 = Math.ceil(Math.max(a[1] + ra, b[1] + rb)) + 1;
  const abx = b[0] - a[0], aby = b[1] - a[1], ab2 = abx * abx + aby * aby || 1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5;
    const t = Math.max(0, Math.min(1, ((px - a[0]) * abx + (py - a[1]) * aby) / ab2));
    const r = ra + (rb - ra) * t;
    const dx = px - (a[0] + abx * t), dy = py - (a[1] + aby * t);
    if (dx * dx + dy * dy > r * r) continue;
    const m = bands?.find(([t0, t1]) => t >= t0 && t < t1)?.[2] || mat;
    cv.put(x, y, tone(m, dx / r, dy / r, bias), id, m);
  }
  return id;
}

export function ellipse(cv, group, mat, c, rx, ry, rot = 0, { bias = 0, clip, pid } = {}) {
  const id = pid ?? cv.part(group);
  const R = Math.max(rx, ry) + 1, cs = Math.cos(rot), sn = Math.sin(rot);
  for (let y = Math.floor(c[1] - R); y <= Math.ceil(c[1] + R); y++) for (let x = Math.floor(c[0] - R); x <= Math.ceil(c[0] + R); x++) {
    const dx = x + 0.5 - c[0], dy = y + 0.5 - c[1];
    const u = (dx * cs + dy * sn) / rx, v = (-dx * sn + dy * cs) / ry;
    if (u * u + v * v > 1) continue;
    if (clip && !clip(x, y)) continue;
    cv.put(x, y, tone(mat, u * cs - v * sn, u * sn + v * cs, bias), id, mat);
  }
  return id;
}

// Any shape, shaded as one vertical cylinder from each row's extent
export function region(cv, group, mat, inside, [x0, y0, x1, y1], { ny = () => 0, bias = 0, pid } = {}) {
  const id = pid ?? cv.part(group);
  for (let y = y0; y <= y1; y++) {
    let lo = null, hi = null;
    for (let x = x0; x <= x1; x++) if (inside(x, y)) { if (lo == null) lo = x; hi = x; }
    if (lo == null) continue;
    const mid = (lo + hi + 1) / 2, half = Math.max(1, (hi - lo + 1) / 2);
    for (let x = lo; x <= hi; x++) {
      if (!inside(x, y)) continue;
      const nx = Math.max(-0.98, Math.min(0.98, (x + 0.5 - mid) / half));
      cv.put(x, y, tone(mat, nx * 0.95, ny(x, y), bias), id, mat);
    }
  }
  return id;
}

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export function outline(cv, { exterior = "#17110d" } = {}) {
  const { w, h } = cv;
  const col = cv.col.slice();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const A = cv.pid[y * w + x];
    if (A < 0) continue;
    for (const [dx, dy] of N4) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
      const j = Y * w + X, B = cv.pid[j];
      if (B < 0 || B >= A || cv.parts[A].group === cv.parts[B].group) continue;
      if (cv.mat[j]) col[j] = cv.mat[j].line;
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (cv.pid[i] >= 0 || cv.col[i]) continue;
    if (N4.some(([dx, dy]) => cv.pidAt(x + dx, y + dy) >= 0)) col[i] = exterior;
  }
  cv.col = col;
}
