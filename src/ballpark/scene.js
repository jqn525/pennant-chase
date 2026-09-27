// ── Static park layers, rendered once per page load ──
// The field is ray-cast pixel by pixel through the broadcast camera, so every
// stripe, arc and base path lands on the pixel grid with no anti-aliasing.

import { PARK, CROWD, SKINS } from "../art/palette.js";
import { VIEW_W, VIEW_H, project, unproject, fenceAt, polar, BASES, MOUND, WALL_H } from "./geometry.js";

const mk = (w = VIEW_W, h = VIEW_H) => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  return cv;
};

// Small deterministic RNG so the park looks the same every visit
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const px = (ctx, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };

function line(ctx, a, b, c) {
  let [x0, y0] = a.map(Math.round), [x1, y1] = b.map(Math.round);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  ctx.fillStyle = c;
  for (let guard = 0; guard < 800; guard++) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// Ground color at a field point, or null if it's behind the wall
function groundColor(x, d) {
  const r = Math.hypot(x, d);
  const deg = (Math.atan2(x, d) * 180) / Math.PI;
  const fair = Math.abs(deg) <= 45;
  const wallR = fenceAt(deg);
  if (r > wallR) return null;
  if (r > wallR - 14) return PARK.track;
  // infield skin: arc around the mound, cut by the infield grass square
  const dm = Math.hypot(x - MOUND[0], d - MOUND[1]);
  if (Math.hypot(x, d) < 14) return PARK.dirt;
  if (dm < 9) return PARK.dirt;
  const inSquare = Math.abs(x) + Math.abs(d - 63.6) < 57 && d > 8;
  if (dm < 95 && !inSquare && d > Math.abs(x) - 22) return (Math.floor(x / 5) + Math.floor(d / 5)) % 7 === 0 ? PARK.dirtDark : PARK.dirt;
  if (!fair) return PARK.foul;
  // mowing pattern: diagonal checkerboard
  const a = Math.floor((x + d) / 34), b = Math.floor((d - x) / 34);
  return (a + b) & 1 ? PARK.grassA : PARK.grassB;
}

export function buildPark() {
  const bg = mk();
  const ctx = bg.getContext("2d");
  const R = rng(1910);

  // Sky: three dithered bands
  for (let y = 0; y < VIEW_H; y++) {
    for (let x = 0; x < VIEW_W; x++) {
      const band = y < 10 ? PARK.sky0 : y < 22 ? ((x + y) % 2 ? PARK.sky0 : PARK.sky1) : y < 30 ? PARK.sky1 : PARK.sky2;
      px(ctx, x, y, band);
    }
  }
  const stars = [];
  for (let i = 0; i < 38; i++) stars.push([Math.floor(R() * VIEW_W), Math.floor(R() * 26), R()]);

  // Stands: a bowl behind the wall, tiered, drawn column by column
  const wallTop = new Array(VIEW_W).fill(VIEW_H);
  const wallBase = new Array(VIEW_W).fill(VIEW_H);
  const standTop = new Array(VIEW_W).fill(VIEW_H);
  for (let deg = -70; deg <= 70; deg += 0.05) {
    const r = fenceAt(deg);
    const [x0, yb] = project(...polar(deg, r), 0);
    const [, yt] = project(...polar(deg, r), WALL_H);
    const [, ys] = project(...polar(deg, r + 90), 70);
    const c = Math.round(x0);
    if (c < 0 || c >= VIEW_W) continue;
    wallBase[c] = Math.min(wallBase[c], Math.round(yb));
    wallTop[c] = Math.min(wallTop[c], Math.round(yt));
    standTop[c] = Math.min(standTop[c], Math.round(ys));
  }
  for (let c = 0; c < VIEW_W; c++) {
    for (let y = standTop[c]; y < wallTop[c]; y++) {
      const tier = Math.floor((wallTop[c] - y) / 3);
      px(ctx, c, y, (wallTop[c] - y) % 3 === 0 ? PARK.standRail : tier % 2 ? PARK.stand0 : PARK.stand1);
    }
  }

  // Field: ray-cast every pixel below the wall line
  for (let y = 0; y < VIEW_H; y++) {
    for (let x = 0; x < VIEW_W; x++) {
      if (y < wallTop[x]) continue;
      const g = unproject(x + 0.5, y + 0.5);
      const col = g && groundColor(g[0], g[1]);
      if (col) px(ctx, x, y, col);
    }
  }

  // Wall with padding and the amber rail
  for (let c = 0; c < VIEW_W; c++) {
    for (let y = wallTop[c]; y <= wallBase[c]; y++) {
      if (y === wallTop[c]) px(ctx, c, y, PARK.wallTop);
      else if (y === wallBase[c]) px(ctx, c, y, PARK.wallDark);
      else px(ctx, c, y, (c % 12 === 0) ? PARK.wallDark : PARK.wall);
    }
  }

  // Chalk: foul lines, batter's boxes, bases
  const P = (x, d, h = 0) => project(x, d, h);
  line(ctx, P(0, 0), P(...polar(-45, fenceAt(45) - 1)), PARK.chalk);
  line(ctx, P(0, 0), P(...polar(45, fenceAt(45) - 1)), PARK.chalk);
  for (const [x, d] of BASES.slice(1, 4)) {
    const [sx, sy] = P(x, d);
    ctx.fillStyle = PARK.base;
    ctx.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 2, 2);
  }
  const [hx, hy] = P(0, 0);
  ctx.fillStyle = PARK.base;
  ctx.fillRect(Math.round(hx) - 1, Math.round(hy), 3, 1);
  const [mx, my] = P(...MOUND);
  ctx.fillStyle = PARK.chalk;
  ctx.fillRect(Math.round(mx) - 1, Math.round(my), 2, 1); // rubber
  for (const side of [-1, 1]) {
    const a = P(side * 3, -4), b = P(side * 7, 5);
    ctx.strokeStyle = PARK.chalk;
    for (let x = Math.round(Math.min(a[0], b[0])); x <= Math.round(Math.max(a[0], b[0])); x++) {
      px(ctx, x, Math.round(a[1]), PARK.chalk);
      px(ctx, x, Math.round(b[1]), PARK.chalk);
    }
  }

  // Light towers at the corners
  const towers = [-54, 54].map((deg) => {
    const base = P(...polar(deg, fenceAt(45) + 60), 0);
    const top = P(...polar(deg, fenceAt(45) + 60), 120);
    return { x: Math.round(top[0]), y: Math.round(top[1]), by: Math.round(Math.min(base[1], standTop[Math.max(0, Math.min(VIEW_W - 1, Math.round(top[0])))] + 6)) };
  });
  towers.forEach((t) => {
    for (let y = t.y + 2; y < t.by; y++) px(ctx, t.x, y, PARK.pole);
  });

  // Crowd: one fan = shirt pixel + head pixel on each tier
  const fans = [];
  for (let c = 0; c < VIEW_W; c++) {
    for (let y = wallTop[c] - 2; y > standTop[c] + 1; y -= 3) {
      if (R() < 0.28) continue;
      fans.push({ x: c, y, shirt: CROWD[Math.floor(R() * CROWD.length)], skin: SKINS[Math.floor(R() * SKINS.length)][0], p: R() });
    }
  }
  const crowd = [0, 1, 2].map((variant) => {
    const cv = mk();
    const cx = cv.getContext("2d");
    for (const f of fans) {
      const up = variant === 2 ? (f.x + Math.floor(f.y / 3)) % 2 : variant === 1 ? (f.p < 0.12 ? 1 : 0) : 0;
      px(cx, f.x, f.y - up, f.shirt);
      px(cx, f.x, f.y - 1 - up, f.skin);
      if (variant === 2 && up && f.p < 0.4) px(cx, f.x + (f.p < 0.2 ? -1 : 1), f.y - 2 - up, f.skin); // arms up
    }
    return cv;
  });

  return { bg, crowd, stars, towers, wallTop };
}

// Per-frame sky details: twinkling stars and flickering tower lamps
export function drawAmbient(ctx, park, now) {
  for (const [x, y, p] of park.stars) {
    const on = Math.sin(now / 700 + p * 40) > -0.6;
    if (on) px(ctx, x, y, p > 0.8 ? PARK.lamp : PARK.star);
  }
  for (const t of park.towers) {
    const flick = Math.sin(now / 90 + t.x) > 0.97;
    ctx.fillStyle = PARK.pole;
    ctx.fillRect(t.x - 4, t.y - 1, 9, 5);
    ctx.fillStyle = flick ? PARK.glow : PARK.lamp;
    for (let i = -3; i <= 3; i += 2) ctx.fillRect(t.x + i, t.y, 1, 1), ctx.fillRect(t.x + i, t.y + 2, 1, 1);
    // halo dither
    ctx.fillStyle = PARK.glow;
    for (let i = -6; i <= 6; i += 2) px(ctx, t.x + i, t.y - 3, PARK.glow);
    px(ctx, t.x - 6, t.y + 1, PARK.glow);
    px(ctx, t.x + 6, t.y + 1, PARK.glow);
  }
}

export { px, line };
