// ── Tiny pixel-grid painter for procedurally drawn sprites ──
// Draws palette keys into a char grid; toRows() yields the same string-row
// format hand-authored sprites use, so both go through sprite.js alike.

export function grid(w, h, fill = ".") {
  const px = Array.from({ length: h }, () => Array(w).fill(fill));
  const g = {
    w, h, px,
    get: (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? px[y][x] : null),
    set: (x, y, ch) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) px[y][x] = ch; },
    rect: (x, y, rw, rh, ch) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) g.set(x + i, y + j, ch); },
    hline: (x0, x1, y, ch) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g.set(x, y, ch); },
    // filled ellipse; `when(x, y)` can restrict which pixels are painted
    oval: (cx, cy, rx, ry, ch, when) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x - cx) / rx, dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1 && (!when || when(x, y))) g.set(x, y, ch);
        }
      }
    },
    // thick line (round brush)
    line: (x0, y0, x1, y1, ch, r = 0) => {
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
        if (r <= 0) g.set(x, y, ch);
        else g.oval(x, y, r, r, ch);
      }
    },
    // recolor pixels matching `from` (a key or a predicate)
    map: (fn) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = fn(px[y][x], x, y); if (v) px[y][x] = v; } },
    // 1px outline around every non-background pixel
    outline: (bg = ".", ch = "k", only = null) => {
      const hits = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (px[y][x] !== bg && px[y][x] !== ch) continue;
        if (px[y][x] === ch) continue;
        const nb = [g.get(x - 1, y), g.get(x + 1, y), g.get(x, y - 1), g.get(x, y + 1)];
        if (nb.some((n) => n && n !== bg && n !== ch && (!only || only.includes(n)))) hits.push([x, y]);
      }
      hits.forEach(([x, y]) => { px[y][x] = ch; });
    },
    toRows: () => px.map((r) => r.join("")),
  };
  return g;
}

// Deterministic PRNG (mulberry32) for seeded features
export function rng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.chance = (p) => next() < p;
  return next;
}
