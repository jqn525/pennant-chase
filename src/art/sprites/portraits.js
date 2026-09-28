// ── Player portraits: 32×32 busts built from layered, seeded features ──
// Pure: portraitFrames(p) -> { base, blink, breathe } as string rows, plus
// the swap map (skin + hair) to paint them with. Same player, same face,
// and the skin tone matches his sprite on the field (skinFor).

import { grid, rng } from "../raster.js";
import { skinFor, hashStr, HAIR } from "../palette.js";

const S = 32;

function backdrop() {
  const g = grid(S, S, "g");
  for (let y = 0; y < 11; y++) for (let x = 0; x < S; x++) {
    if (y < 7 || (x + y) % 2 === 0) g.set(x, y, "G");
  }
  // out-of-focus light towers and a rail
  [[3, 2], [5, 2], [4, 3], [26, 3], [28, 3], [27, 2]].forEach(([x, y]) => g.set(x, y, "l"));
  g.hline(0, S - 1, 22, "L");
  return g;
}

export function features(p) {
  const r = rng(hashStr(`face:${p.id}:${p.name || ""}`));
  const role = p.pos === "C" ? "catcher" : p.role && p.role !== "bat" ? "pitcher" : "batter";
  return {
    role,
    wide: r.chance(0.5),
    square: r.chance(0.45),
    hair: r() < 0.08 ? HAIR[5] : r.pick(HAIR.slice(0, 5)),
    long: r.chance(0.18),
    brow: r.pick(["flat", "flat", "angry", "high"]),
    mouth: r.pick(["flat", "smile", "smile", "smirk"]),
    facial: r.pick(["none", "none", "none", "stache", "beard", "goatee"]),
    eyeBlack: role === "batter" && r.chance(0.35),
    logo: r.chance(0.5),
    look: r.chance(0.5) ? 1 : -1,
  };
}

// The figure alone on a transparent grid
function figure(f, { blink = false } = {}) {
  const g = grid(S, S + 2);
  const rx = f.wide ? 7 : 6.5;
  const skinAt = (x, y) => (x > 16 + rx * 0.45 || (y > 19 && x > 16) ? "S" : "s");

  // shoulders + jersey
  g.oval(16, 34, 14, 9.5, "w");
  g.map((c, x, y) => (c === "w" && x >= 23 ? "W" : null));
  if (f.role === "catcher") {
    g.oval(16, 32, 6.5, 6, "n");
    g.map((c, x, y) => (c === "n" && (x + y) % 4 === 0 ? "N" : null));
    g.line(10, 26, 13, 28, "N"); g.line(22, 26, 19, 28, "N");
  }
  if (f.role === "pitcher") { g.oval(5, 30, 3.5, 3, "b"); g.oval(5, 31, 1.5, 1, "B"); }

  // long hair falls behind the head
  if (f.long) { g.rect(8, 11, 3, 10, "h"); g.rect(22, 11, 3, 10, "H"); }

  // head
  g.oval(16, 14, rx, 7.5, "s");
  if (f.square) { g.rect(11, 17, 11, 4, "s"); }
  g.map((c, x, y) => (c === "s" ? skinAt(x, y) : null));
  // ears
  [[9, 14], [9, 15], [23, 14], [23, 15]].forEach(([x, y]) => g.set(f.wide ? (x < 16 ? x - 1 : x + 1) : x, y, x < 16 ? "s" : "S"));

  // facial hair
  if (f.facial === "beard") {
    g.map((c, x, y) => {
      if ((c !== "s" && c !== "S") || y < 16 || y > 20) return null;
      const edge = y >= 19 || x <= 11 || x >= 21;
      if (!edge) return null;
      return x > 17 ? "H" : "h";
    });
  }
  if (f.facial === "stache" || f.facial === "beard" || f.facial === "goatee") g.hline(14, 18, 18, "h");
  if (f.facial === "goatee") { g.hline(15, 17, 20, "h"); g.set(16, 21, "h"); }

  // neck + V collar, tucked behind the head and beard
  const under = (x, y, ch) => { if (g.get(x, y) === "." || g.get(x, y) === "w" || g.get(x, y) === "W" || g.get(x, y) === "n" || g.get(x, y) === "N") g.set(x, y, ch); };
  for (let y = 19; y < 27; y++) for (let x = 13; x <= 18; x++) under(x, y, x >= 17 ? "S" : "s");
  for (let i = 0; i < 4; i++) { g.set(13 + i, 24 + i, "c"); g.set(18 - i, 24 + i, "c"); }
  for (let y = 24; y < 28; y++) for (let x = 14 + (y - 24); x <= 17 - (y - 24); x++) g.set(x, y, y > 25 ? "W" : "S");

  // eyes, brows, nose, mouth
  if (blink) { g.hline(12, 13, 14, "S"); g.hline(18, 19, 14, "S"); }
  else {
    const [a, b] = f.look > 0 ? ["y", "e"] : ["e", "y"]; // both eyes glance the same way
    g.set(12, 14, a); g.set(13, 14, b); g.set(18, 14, a); g.set(19, 14, b);
  }
  const browY = f.brow === "high" ? 11 : 12;
  g.hline(11, 13, browY, "h"); g.hline(18, 20, browY, "h");
  if (f.brow === "angry") { g.set(13, browY + 1, "h"); g.set(18, browY + 1, "h"); g.set(11, browY, "s"); g.set(20, browY, "S"); }
  if (f.eyeBlack) { g.hline(11, 13, 15, "e"); g.hline(18, 20, 15, "e"); }
  g.set(16, 16, "S"); g.set(16, 17, "S"); g.set(15, 17, "S");
  if (f.mouth === "smile") { g.hline(14, 17, 19, "m"); g.set(13, 18, "m"); g.set(18, 18, f.facial === "stache" ? "h" : "m"); }
  else if (f.mouth === "smirk") { g.hline(15, 18, 19, "m"); g.set(19, 18, "m"); }
  else g.hline(14, 17, 19, "m");

  // cap
  const capW = f.wide ? 8.5 : 8;
  g.oval(16, 9, capW, 5.5, "c", (x, y) => y <= 9);
  g.map((c, x, y) => (c === "c" && y <= 9 && x >= 20 ? "C" : null));
  if (f.role === "catcher") {
    g.hline(9, 23, 9, "C"); // backwards: strap, no brim
  } else {
    g.hline(7, 25, 10, "C");
    g.hline(9, 23, 11, "K");
    g.map((c, x, y) => (y === 12 && c === "s" && x > 10 && x < 22 ? "S" : null));
    if (f.logo) { g.rect(15, 6, 2, 2, "w"); } else { g.set(15, 6, "w"); g.set(16, 7, "w"); g.set(15, 7, "w"); }
  }
  // sideburns under the cap
  g.set(10, 12, "h"); g.set(10, 13, "h"); g.set(22, 12, "H"); g.set(22, 13, "H");

  g.outline(".", "k");
  return g;
}

function compose(fig, dy) {
  const bg = backdrop();
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const c = fig.get(x, y + dy);
    if (c && c !== ".") bg.set(x, y, c);
  }
  return bg.toRows();
}

export function portraitFrames(p) {
  const f = features(p);
  const open = figure(f);
  return {
    base: compose(open, 0),
    blink: compose(figure(f, { blink: true }), 0),
    breathe: compose(open, 1),
    features: f,
  };
}

export function portraitSwap(p) {
  const f = features(p);
  const skin = skinFor(p.id);
  return { s: skin[0], S: skin[1], h: f.hair[0], H: f.hair[1] };
}
