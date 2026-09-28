// ── Gear icons: 16×16, one drawing per slot, recolored per item ──
// Pure: gearRows(slot, legendary) -> string rows; gearSwap(item) -> colors.
// 'c'/'C' carry the item's color; legendary gear is gold with sparkles.

import { grid } from "../raster.js";
import { hashStr } from "../palette.js";

const DRAW = {
  bat(g) {
    g.line(3, 13, 7, 9, "w", 0.5);   // taped handle
    g.line(7, 9, 12, 4, "c", 1.2);   // barrel
    g.line(8, 9, 13, 4, "C", 0.5);
    g.line(6, 8, 11, 3, "y");
    g.oval(2.5, 13.5, 1.2, 1.2, "C"); // knob
  },
  batGloves(g) {
    g.rect(4, 6, 8, 6, "c");
    [4, 6, 8, 10].forEach((x, i) => g.rect(x, 2 + (i === 0 || i === 3 ? 1 : 0), 2, 5, "c"));
    [5, 7, 9].forEach((x) => g.line(x + 0.5, 3, x + 0.5, 6, "C"));
    g.rect(1, 7, 3, 3, "c");
    g.rect(4, 12, 8, 3, "w");
    g.rect(9, 12, 3, 3, "C");
    g.set(11, 7, "C"); g.set(11, 8, "C"); g.set(11, 9, "C");
  },
  cleats(g) {
    g.oval(8, 8.5, 6.5, 3.5, "c", (x, y) => y <= 11);
    g.rect(2, 11, 13, 1, "c");
    g.oval(4, 7, 2.5, 3, "c");
    g.line(4, 9, 12, 8, "w");      // stripe
    [[5, 6], [6, 5], [7, 6]].forEach(([x, y]) => g.set(x, y, "y"));
    g.rect(1, 12, 15, 1, "K");      // sole
    [2, 5, 8, 11, 14].forEach((x) => g.set(x, 13, "x"));
  },
  glove(g) {
    g.oval(7, 9.5, 5, 5, "c");                       // palm
    [[3.2, 5.5], [5.2, 3.5], [7.6, 2.8], [10, 3.5]].forEach(([x, y]) => g.oval(x, y, 1.3, 2.4, "c")); // fingers
    g.oval(12, 6.5, 1.8, 2.8, "C");                   // web
    g.map((c, x, y) => (c === "C" && (x + y) % 2 === 0 ? "B" : null));
    g.oval(13, 10, 1.6, 3, "c");                      // thumb
    [[4.2, 5], [6.4, 3.5], [8.8, 3.2]].forEach(([x, y]) => g.line(x, y + 1, x, y + 3, "C")); // finger seams
    g.oval(7.5, 10.5, 2.4, 2.2, "C");                 // pocket
    g.set(3, 4, "y"); g.set(5, 2, "y"); g.set(7, 2, "y");
    g.rect(4, 14, 6, 1, "B");                         // wrist strap
  },
  shades(g) {
    g.oval(4.5, 8, 3.2, 2.4, "c");
    g.oval(11.5, 8, 3.2, 2.4, "c");
    g.hline(1, 14, 6, "K");
    g.hline(7, 8, 7, "K");
    g.set(3, 7, "y"); g.set(10, 7, "y"); g.set(4, 7, "y");
    g.set(0, 6, "K"); g.set(15, 6, "K");
  },
  sleeve(g) {
    for (let y = 1; y <= 14; y++) {
      const half = 3 - Math.floor((y - 1) / 7);
      g.hline(8 - half, 7 + half, y, "c");
      g.set(7 + half, y, "C");
    }
    g.hline(5, 10, 2, "w"); g.hline(6, 9, 13, "w");
    g.rect(7, 6, 2, 2, "a");
    g.line(6, 4, 6, 11, "y");
  },
  rosin(g) {
    g.oval(8, 10.5, 5.5, 4, "w");
    g.map((c, x) => (c === "w" && x >= 11 ? "W" : null));
    g.rect(6, 4, 4, 3, "w");
    g.hline(5, 10, 6, "C");
    g.set(11, 5, "C"); g.set(12, 4, "C");
    g.hline(5, 10, 11, "c");
    [[2, 3], [13, 2], [1, 6], [14, 7]].forEach(([x, y]) => g.set(x, y, "x"));
  },
};

export const GEAR_SLOTS = Object.keys(DRAW);

const COLORS = {
  bat: [["#e0bd84", "#a57c46"], ["#3a302a", "#1a1512"], ["#9a4a2a", "#6b3016"]],
  default: [["#c6503f", "#86302a"], ["#4f78a8", "#2d4c72"], ["#3a3f4a", "#1f232b"], ["#2f9a8a", "#1d6258"], ["#b07a4a", "#7a4f2a"]],
  glove: [["#b07a4a", "#7a4f2a"], ["#8a5a2b", "#5e3a1a"], ["#3a302a", "#1a1512"], ["#c6503f", "#86302a"]],
};
const GOLD = ["#ffd75a", "#c99a1a"];

export function gearRows(slot, legendary = false) {
  const g = grid(16, 16);
  (DRAW[slot] || DRAW.bat)(g);
  g.outline(".", "k");
  if (legendary) {
    [[1, 1], [14, 2], [13, 14]].forEach(([x, y]) => {
      if (g.get(x, y) === ".") g.set(x, y, "y");
    });
  }
  return g.toRows();
}

// Colors for an item (or a bare slot name for an empty socket)
export function gearSwap(itemOrSlot) {
  const item = typeof itemOrSlot === "string" ? { slot: itemOrSlot } : itemOrSlot;
  if (item.rarity === 3) return { c: GOLD[0], C: GOLD[1] };
  const set = COLORS[item.slot] || COLORS.default;
  const [c, C] = set[item.id ? hashStr(String(item.id)) % set.length : 0];
  return { c, C };
}
