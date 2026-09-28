// ── Trading-card photos: a posed, waist-up portrait for every position ──
// Classic card photography: each position holds its own pose and prop.
// Two treatments share the same drawing:
//   "photo"   — shaded, on a stadium sky (common and uncommon prints)
//   "vintage" — flat two-tone paint on a bold halftone backdrop (rare, 1/1)
// Pure: cardPhoto(p, opts) -> { w, h, px: ["#rrggbb", ...] }.

import { Canvas, capsule, ellipse, region, inEllipse, inCapsule, outline, material, mix, setLight } from "../shade.js";
import { features } from "../sprites/portraits.js";
import { skinFor, hashStr } from "../palette.js";
import { GLYPHS } from "../font.js";

export const PHOTO_W = 64;
export const PHOTO_H = 80;
const HX = 32, HY = 24;

function materials(team, skin, hair) {
  return {
    uni: material("#efe5cf", { light: 0.55, shadow: 0.24, deep: 0.45 }),
    team: material(team),
    skin: material(skin, { light: 0.3, shadow: 0.28, deep: 0.5 }),
    hair: material(hair, { light: 0.2 }),
    leather: { ramp: ["#4a2a14", "#6b3f1f", "#9a6230", "#c98a4c"], line: "#2a170b" },
    wood: material("#d9b27a", { light: 0.5 }),
    gear: material("#4a5751", { light: 0.3 }),
    ball: { ramp: ["#b9ae9a", "#d8cfbd", "#f7f2e6", "#ffffff"], line: "#6b6152" },
  };
}

// Letters from the 3×5 font; returns the set of lit "x,y" cells
function lettering(text, x0, y0) {
  const on = new Set();
  [...text].forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (!g) return;
    for (let b = 0; b < 15; b++) if (g[b] === "1") on.add(`${x0 + i * 4 + (b % 3)},${y0 + Math.floor(b / 3)}`);
  });
  return on;
}

// ── Body ──
function torso(cv, M, { gear, word }) {
  const inside = (x, y) => inEllipse(32, 66, 20.5, 25)(x, y) || inCapsule([13.5, 49], [50.5, 49], 6.8, 6.8)(x, y) || inEllipse(32, 45, 13, 6)(x, y);
  const id = region(cv, "body", M.uni, inside, [0, 36, 63, 79], { ny: (x, y) => (y < 47 ? -0.55 : 0) });
  const t = M.team.ramp;
  for (let i = 0; i < 6; i++) { cv.put(27 + i * 0.5, 40 + i, t[2], id, M.team); cv.put(37 - i * 0.5, 40 + i, t[2], id, M.team); }
  for (let y = 46; y < 80; y++) cv.put(33, y, M.uni.ramp[1], id, M.uni);
  for (let y = 49; y < 80; y += 6) cv.put(33, y, M.uni.ramp[0], id, M.uni);
  if (!gear && word) {
    // the club name across the chest, drop-shadowed, with a tail swash
    const w = word.length * 4 - 1, x0 = Math.round(32 - w / 2), y0 = 52;
    const on = lettering(word, x0, y0);
    for (const k of on) {
      const [x, y] = k.split(",").map(Number);
      cv.put(x, y, t[2], id, M.team);
      if (!on.has(`${x + 1},${y + 1}`)) cv.put(x + 1, y + 1, t[0], id, M.team);
    }
    for (let x = x0 - 2; x <= x0 + w + 3; x++) cv.put(x, y0 + 7, x % 2 ? t[1] : t[2], id, M.team);
  }
  return id;
}

function arm(cv, M, sh, el, hn, { lower, bias = 0, group, hand = true }) {
  const id = capsule(cv, group, M.uni, sh, el, 4.6, 3.8, { bias, bands: [[0.45, 1.01, lower]] });
  ellipse(cv, group, M.uni, sh, 5.4, 5.4, 0, { pid: id, bias });
  capsule(cv, group, lower, el, hn, 3.7, 3.0, { pid: id, bias });
  if (hand) ellipse(cv, group, M.skin, hn, 3, 3, 0, { pid: id, bias });
  return id;
}

// Open glove, fingers up: palm, four fingers, thumb, laced web
function openGlove(cv, M, [cx, cy], s = 1) {
  const L = M.leather;
  const gid = ellipse(cv, "glove", L, [cx, cy], 8.6 * s, 6.4 * s, 0);
  [[-6.5, -5.5], [-3, -7.5], [0.8, -8], [4.4, -7]].forEach(([dx, dy]) => capsule(cv, "glove", L,
    [cx + dx * s, cy + (dy + 5) * s], [cx + dx * s, cy + dy * s], 2.1 * s, 1.9 * s, { pid: gid }));
  capsule(cv, "glove", L, [cx + 7.5 * s, cy - 1 * s], [cx + 10 * s, cy - 6 * s], 2.3 * s, 2 * s, { pid: gid });
  for (let y = Math.floor(cy - 8 * s); y <= cy - 1; y++) for (let x = Math.floor(cx + 6 * s); x <= cx + 9 * s; x++) {
    if ((x + y) % 2 === 0 && inEllipse(cx + 7.7 * s, cy - 4.5 * s, 2.2 * s, 3.4 * s)(x, y)) cv.put(x, y, L.ramp[0], gid, L);
  }
  ellipse(cv, "glove", L, [cx + s, cy + 1.6 * s], 4.2 * s, 3 * s, 0, { pid: gid, bias: -0.5 });
  for (const [dx, dy] of [[-5, -5], [-2, -7], [2, -7], [5, -6]]) cv.put(cx + dx * s, cy + dy * s, "#e8d9b8", gid, L);
  return gid;
}
const closedGlove = (cv, M, c, rx = 5, ry = 4.2, rot = 0) => {
  const g = ellipse(cv, "glove", M.leather, c, rx, ry, rot);
  ellipse(cv, "glove", M.leather, [c[0] + 1, c[1] + 0.5], rx * 0.45, ry * 0.45, rot, { pid: g, bias: -0.5 });
  return g;
};

// ── Head ──
function head(cv, M, f, { helmet, lookUp, initials, logoInk }) {
  const sk = M.skin.ramp, hr = M.hair.ramp;
  ellipse(cv, "hair", M.hair, [HX - 1, HY + 3], f.long ? 11.5 : 10, f.long ? 10 : 8, 0);
  capsule(cv, "neck", M.skin, [HX, HY + 8], [HX + 0.5, HY + 17], 5.6, 6.2, { bias: -0.35 });
  const crx = f.wide ? 9.9 : 9.3, jrx = f.square ? 8.5 : 7.8;
  const inside = (x, y) => inEllipse(HX, HY - 1, crx, 10)(x, y) || inEllipse(HX + 0.6, HY + 4, jrx, f.square ? 7.2 : 6.8)(x, y);
  const hid = region(cv, "head", M.skin, inside, [HX - 12, HY - 12, HX + 12, HY + 12], { ny: (x, y) => (y - HY) / 16 });
  ellipse(cv, "head", M.skin, [HX - crx - 0.1, HY + 1.5], 1.8, 2.8, 0, { pid: hid, bias: -0.1 });
  ellipse(cv, "head", M.skin, [HX + crx + 0.3, HY + 1.8], 1.4, 2.6, 0, { pid: hid, bias: -0.3 });
  const put = (x, y, c) => cv.put(x, y, c, hid, M.skin);

  // brows
  const by = f.brow === "high" ? HY - 4 : HY - 3;
  for (const x of [25, 26, 27, 35, 36, 37]) put(x, by, hr[1]);
  if (f.brow === "angry") { put(27, by + 1, hr[1]); put(35, by + 1, hr[1]); put(25, by, sk[2]); put(37, by, sk[2]); }
  // eyes: 2×2 each — a white and a pupil column, glancing to one side;
  // looking up leaves only the top of the pupil
  const white = "#f4efe6", pupil = "#241611";
  const [l, r] = f.look > 0 ? [white, pupil] : [pupil, white];
  for (const [a, b] of [[26, 27], [35, 36]]) {
    put(a, HY - 1, l); put(b, HY - 1, r);
    put(a, HY, lookUp ? white : l); put(b, HY, lookUp ? white : r);
    put(a - 1, HY, sk[1]); put(b + 1, HY - 1, sk[0]); // lid corners
  }
  if (f.eyeBlack) for (const x of [25, 26, 27, 28, 34, 35, 36, 37]) put(x, HY + 2, "#1b1512");
  // nose
  for (const y of [HY + 1, HY + 2, HY + 3]) put(31, y, sk[1]);
  put(32, HY + 4, sk[1]); put(33, HY + 4, sk[0]);
  // mouth
  const lip = mix(sk[0], "#8e2f2a", 0.45);
  if (f.mouth === "smirk") { for (const x of [30, 31, 32, 33, 34]) put(x, HY + 7, lip); put(35, HY + 6, lip); }
  else { for (const x of [29, 30, 31, 32, 33]) put(x, HY + 7, lip); if (f.mouth === "smile") { put(28, HY + 6, lip); put(34, HY + 6, lip); } }
  // facial hair
  if (f.facial === "beard") {
    for (let y = HY + 5; y <= HY + 12; y++) for (let x = HX - 10; x <= HX + 11; x++) {
      if (!inside(x, y)) continue;
      if (y >= HY + 8 || x <= HX - 6 || x >= HX + 7) put(x, y, (x + y) % 3 ? hr[1] : hr[0]);
    }
    for (const x of [29, 30, 31, 32, 33]) put(x, HY + 7, lip);
  }
  if (f.facial === "stache" || f.facial === "beard" || f.facial === "goatee") for (const x of [28, 29, 30, 31, 32, 33, 34]) put(x, HY + 6, hr[1]);
  if (f.facial === "goatee") for (const [x, y] of [[30, HY + 9], [31, HY + 9], [32, HY + 9], [31, HY + 10], [32, HY + 10]]) put(x, y, hr[1]);
  // sideburns, long hair falling past the ears
  for (let y = HY - 3; y <= HY + 1; y++) { put(HX - 8, y, hr[1]); put(HX + 8.6, y, hr[0]); }
  if (f.long) for (let y = HY - 3; y <= HY + 7; y++) { put(HX - crx + 0.5, y, hr[1]); put(HX + crx - 0.2, y, hr[0]); }

  // cap (or a catcher's helmet)
  ellipse(cv, "cap", M.team, [HX, HY - 8.5], 10.6, 8.6, 0, { clip: (x, y) => y + 0.5 <= HY - 5.6 });
  const cid = cv.parts.length - 1;
  const tr = M.team.ramp;
  cv.put(HX, HY - 17, tr[0], cid, M.team);
  if (helmet) {
    for (let x = HX - 10; x <= HX + 10; x++) cv.put(x, HY - 6, tr[0], cid, M.team);
  } else {
    for (let y = HY - 16; y <= HY - 14; y++) if (cv.pidAt(HX, y) === cid) cv.put(HX, y, tr[1], cid, M.team);
    const text = (initials || "").slice(0, 3);
    if (text) {
      const w = text.length * 4 - 1;
      for (const k of lettering(text, Math.round(HX - w / 2), HY - 13)) {
        const [x, y] = k.split(",").map(Number);
        cv.put(x, y, logoInk, cid, M.team);
      }
    }
    ellipse(cv, "cap", M.team, [HX + 1.4, HY - 5], 12, 2.6, 0, { pid: cid, bias: -0.5 });
    // brim shadow across the brow
    for (let x = HX - 10; x <= HX + 10; x++) for (const y of [HY - 3, HY - 2]) {
      const i = y * cv.w + x;
      if (cv.pid[i] === hid && cv.col[i] !== hr[1]) cv.put(x, y, y === HY - 3 ? sk[0] : sk[1], hid, M.skin);
    }
  }
}

// ── Poses: [left shoulder (14,50), right shoulder (50,50)] are the viewer's ──
const POSES = {
  // SP — peeking over the glove
  peek(cv, M, f, o) {
    torso(cv, M, o);
    arm(cv, M, [50, 50], [48, 62], [37, 41], { lower: o.lower, group: "armR", bias: -0.2 });
    head(cv, M, f, o);
    arm(cv, M, [14, 50], [17, 63], [27, 42], { lower: o.lower, group: "armL" });
    openGlove(cv, M, [33, 39]);
  },
  // RP — the ball up by the cheek, showing the grip
  grip(cv, M, f, o) {
    torso(cv, M, o);
    arm(cv, M, [14, 50], [15, 66], [29, 72], { lower: o.lower, group: "armL", hand: false });
    closedGlove(cv, M, [33, 72], 6, 5);
    head(cv, M, f, o);
    arm(cv, M, [50, 50], [54, 61], [46, 37], { lower: o.lower, group: "armR" });
    const b = ellipse(cv, "ball", M.ball, [46, 31], 2.9, 2.9);
    cv.put(44, 30, "#c6503f", b, M.ball); cv.put(48, 32, "#c6503f", b, M.ball);
    capsule(cv, "fingers", M.skin, [43.5, 31.5], [48.8, 30.2], 1.2, 1.1);
  },
  // C — helmet, chest protector, mitt, mask in hand
  gear(cv, M, f, o) {
    torso(cv, M, { ...o, gear: true });
    const inside = (x, y) => inEllipse(32, 68, 15, 25)(x, y) && y >= 43;
    const pid = region(cv, "gear", M.gear, inside, [14, 43, 50, 79]);
    for (let y = 50; y < 80; y += 7) for (let x = 17; x < 48; x++) if (inside(x, y)) cv.put(x, y, M.gear.ramp[0], pid, M.gear);
    arm(cv, M, [50, 50], [53, 63], [50, 72], { lower: o.lower, group: "armR" });
    arm(cv, M, [14, 50], [11, 62], [20, 64], { lower: o.lower, group: "armL", hand: false });
    const mid = ellipse(cv, "mask", M.gear, [51, 67], 6, 7.6, 0.15);
    for (let y = 60; y <= 74; y++) for (let x = 45; x <= 57; x++) {
      if (inEllipse(51, 67, 5, 6.6)(x, y) && (x % 3 === 0 || y % 4 === 0)) cv.put(x, y, M.gear.ramp[1], mid, M.gear);
    }
    closedGlove(cv, M, [20, 65], 9, 8, -0.3);
    head(cv, M, f, { ...o, helmet: true });
  },
  // 1B — the long first-base mitt held up
  mitt(cv, M, f, o) {
    torso(cv, M, o);
    arm(cv, M, [50, 50], [53, 63], [49, 76], { lower: o.lower, group: "armR" });
    head(cv, M, f, o);
    arm(cv, M, [14, 50], [9, 44], [15, 36], { lower: o.lower, group: "armL", hand: false });
    const L = M.leather;
    const g = ellipse(cv, "glove", L, [15.5, 27.5], 6.2, 10, -0.12);
    ellipse(cv, "glove", L, [16.2, 29], 3, 5.6, -0.12, { pid: g, bias: -0.5 });
    for (let y = 17; y <= 22; y++) for (let x = 12; x <= 20; x++) if ((x + y) % 2 === 0 && inEllipse(16, 19.5, 3.4, 2.4)(x, y)) cv.put(x, y, L.ramp[0], g, L);
    for (const [x, y] of [[10, 24], [10, 29], [11, 34], [21, 24], [21, 30]]) cv.put(x, y, "#e8d9b8", g, L);
  },
  // 2B — glove at the chest, ball in hand
  ready(cv, M, f, o) {
    torso(cv, M, o);
    head(cv, M, f, o);
    arm(cv, M, [14, 50], [12, 62], [24, 62], { lower: o.lower, group: "armL", hand: false });
    openGlove(cv, M, [25, 58], 0.78);
    arm(cv, M, [50, 50], [52, 62], [38, 59], { lower: o.lower, group: "armR" });
    ellipse(cv, "ball", M.ball, [35.5, 55.5], 2.4, 2.4);
  },
  // SS — glove up for a pop-up, eyes to the sky
  popup(cv, M, f, o) {
    torso(cv, M, o);
    arm(cv, M, [14, 50], [12, 64], [17, 76], { lower: o.lower, group: "armL" });
    head(cv, M, f, { ...o, lookUp: true });
    arm(cv, M, [50, 50], [57, 36], [51, 18], { lower: o.lower, group: "armR", hand: false });
    openGlove(cv, M, [49, 12], 0.7);
  },
  // 3B — arms crossed
  crossed(cv, M, f, o) {
    torso(cv, M, o);
    head(cv, M, f, o);
    arm(cv, M, [14, 50], [16, 65], [39, 63], { lower: o.lower, group: "armL", hand: false });
    closedGlove(cv, M, [42, 61], 4.8, 4.2, 0.3);
    arm(cv, M, [50, 50], [48, 66], [24, 64], { lower: o.lower, group: "armR" });
  },
  // LF — shading the eyes
  shadeR(cv, M, f, o) {
    torso(cv, M, o);
    arm(cv, M, [14, 50], [12, 64], [15, 76], { lower: o.lower, group: "armL", hand: false });
    closedGlove(cv, M, [16, 76], 5.4, 4.4);
    head(cv, M, f, o);
    arm(cv, M, [50, 50], [55, 40], [43, 22], { lower: o.lower, group: "armR", hand: false });
    ellipse(cv, "hand", M.skin, [38, 20.8], 6, 2, -0.08);
  },
  // RF — shading the eyes, other hand
  shadeL(cv, M, f, o) {
    torso(cv, M, o);
    arm(cv, M, [50, 50], [52, 64], [49, 76], { lower: o.lower, group: "armR", hand: false });
    closedGlove(cv, M, [48, 76], 5.4, 4.4);
    head(cv, M, f, o);
    arm(cv, M, [14, 50], [9, 40], [21, 22], { lower: o.lower, group: "armL", hand: false });
    ellipse(cv, "hand", M.skin, [26, 20.8], 6, 2, 0.08);
  },
  // CF — glove overhead for the catch
  overhead(cv, M, f, o) {
    torso(cv, M, o);
    head(cv, M, f, { ...o, lookUp: true });
    arm(cv, M, [14, 50], [11, 31], [28, 13], { lower: o.lower, group: "armL" });
    arm(cv, M, [50, 50], [53, 30], [42, 12], { lower: o.lower, group: "armR", hand: false });
    openGlove(cv, M, [40, 9], 0.72);
  },
  // DH — the bat on the shoulder
  bat(cv, M, f, o) {
    torso(cv, M, o);
    capsule(cv, "bat", M.wood, [29, 71], [55, 17], 1.2, 2.6);
    arm(cv, M, [14, 50], [11, 64], [28, 69], { lower: o.lower, group: "armL", hand: false });
    arm(cv, M, [50, 50], [51, 63], [35, 68], { lower: o.lower, group: "armR", hand: false });
    const h = ellipse(cv, "hands", M.team, [30, 68], 3.4, 3, -0.6);
    ellipse(cv, "hands", M.team, [34, 66.5], 3.2, 2.8, -0.6, { pid: h });
    head(cv, M, f, o);
  },
};

const BY_POS = { SP: "peek", RP: "grip", C: "gear", "1B": "mitt", "2B": "ready", SS: "popup", "3B": "crossed", LF: "shadeR", RF: "shadeL", CF: "overhead", DH: "bat" };
export const poseFor = (pos) => BY_POS[pos] || "bat";
export const POSE_NAMES = Object.keys(POSES);

// ── Backdrops ──
function stadiumSky() {
  const px = new Array(PHOTO_W * PHOTO_H);
  const sky = ["#6fa7cf", "#83b6d9", "#9bc5e2", "#b5d5e8", "#cde2ea"];
  for (let y = 0; y < PHOTO_H; y++) for (let x = 0; x < PHOTO_W; x++) {
    const b = Math.min(4, Math.floor(y / 11));
    px[y * PHOTO_W + x] = sky[y % 11 === 0 && b > 0 && (x + y) % 2 === 0 ? b - 1 : b];
  }
  for (let y = 52; y < PHOTO_H; y++) for (let x = 0; x < PHOTO_W; x++) px[y * PHOTO_W + x] = y < 54 ? "#7d9aa4" : y % 3 === 0 ? "#5b7680" : "#6a8791";
  for (const tx of [6, 57]) {
    for (let y = 18; y < 52; y++) px[y * PHOTO_W + tx] = "#7890a0";
    for (let x = tx - 4; x <= tx + 4; x++) for (let y = 14; y <= 17; y++) px[y * PHOTO_W + x] = (x + y) % 2 ? "#fbf4dc" : "#dfe6e2";
  }
  return px;
}
export const VINTAGE_BACKDROPS = ["#e2b64c", "#d9644f", "#5fa8a0", "#7fa7d9", "#b58ad0", "#e58f5a"];
function halftone(color) {
  const px = new Array(PHOTO_W * PHOTO_H).fill(color);
  const dot = mix(color, "#000000", 0.14);
  for (let y = 1; y < PHOTO_H; y += 4) for (let x = (y >> 2) % 2 ? 2 : 0; x < PHOTO_W; x += 4) {
    px[y * PHOTO_W + x] = dot;
    if (y > PHOTO_H * 0.55 && x + 1 < PHOTO_W) px[y * PHOTO_W + x + 1] = dot;
  }
  return px;
}

// team: uniform color · word: chest lettering · initials: cap logo
// style: "photo" | "vintage" · backdrop: vintage color (default seeded)
export function cardPhoto(p, { team = "#e9a431", word = "", initials = "", logoInk = "#f5edda", style = "photo", backdrop } = {}) {
  const f = features(p);
  const seed = hashStr(`card:${p.id}:${p.name || ""}`);
  const M = materials(team, skinFor(p.id)[0], f.hair[0]);
  if (style === "vintage") for (const m of Object.values(M)) m.ramp = [m.ramp[1], m.ramp[1], m.ramp[2], m.ramp[2]];
  setLight(-0.45, -0.62, 0.64);
  const cv = new Canvas(PHOTO_W, PHOTO_H);
  const clean = (s) => String(s || "").toUpperCase().replace(/[^A-Z]/g, "");
  POSES[poseFor(p.pos)](cv, M, f, {
    lower: seed % 2 ? M.team : M.skin,
    word: clean(word).slice(0, 8),
    initials: String(initials || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3),
    logoInk,
  });
  outline(cv, { exterior: style === "vintage" ? "#231a14" : "#17110d" });
  const bg = style === "vintage" ? halftone(backdrop || VINTAGE_BACKDROPS[seed % VINTAGE_BACKDROPS.length]) : stadiumSky();
  return { w: PHOTO_W, h: PHOTO_H, px: bg.map((c, i) => cv.col[i] || c) };
}
