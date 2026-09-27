// ── Ballplayer sprites: 9×13 (13×13 for the batter, whose bat sweeps wide) ──
// Keys: k outline, c/C team (cap, trim), s/S skin, w/W uniform, b/B glove,
// t bat, K dark. Team, uniform and skin keys are swapped per actor.

import { parseFrame, flipFrame } from "../sprite.js";

const pad = (rows, n = 2) => rows.map((r) => ".".repeat(n) + r + ".".repeat(n));
const f = (rows) => parseFrame(rows);

const HEAD = [
  "...kkk...",
  "..kccck..",
  ".kCCCCCk.",
  "..ksssk..",
  "..kSsSk..",
];
const LEGS = [
  ".kwwkwwk.",
  ".kwk.kwk.",
  ".kkk.kkk.",
];

const idleRows = [
  ...HEAD,
  "..kwcwk..",
  ".kwwcwwk.",
  "kwkwcwkwk",
  "kwkwwwkwk",
  "bbkWWWksk",
  ...LEGS,
];

const readyRows = [
  ".........",
  ...HEAD,
  "..kwcwk..",
  ".kwwcwwk.",
  "kwkwcwkwk",
  "bbkwwwksk",
  ".kWWWWWk.",
  "kwwk.kwwk",
  "kk.....kk",
];

const runA = [
  ...HEAD,
  "..kwcwk..",
  ".kwwcwwks",
  "kwkwcwkk.",
  "bbkwwwk..",
  ".kWWWWWk.",
  ".kwkkwk..",
  "kwk..kwk.",
  "kk....kk.",
];
const runB = flipFrame(runA).map((r) => r.replace("ks", "kb").replace("sk", "bk"));

const throwRows = [
  "...kkk.k.",
  "..kccckSk",
  ".kCCCCCwk",
  "..ksssKwk",
  "..kSsSkwk",
  ".kwwcwwwk",
  "kwwwcwwk.",
  "kwkwcwk..",
  "kwkwwwk..",
  "bbkWWWk..",
  ...LEGS,
];
// Glove up: the throw pose mirrored, bare hand swapped for the mitt
const catchRows = flipFrame(throwRows).map((r, i) =>
  i === 1 ? r.replace("S", "b") : i === 9 ? r.replace("bb", "sk") : r);

const cheerRows = [
  "s..kkk..s",
  "wkkccckkw",
  "wkCCCCCkw",
  "w.ksssk.w",
  "w.kSsSk.w",
  "wkkwcwkkw",
  ".kwwcwwk.",
  ".kwwcwwk.",
  ".kwwwwwk.",
  ".kWWWWWk.",
  ...LEGS,
];

const setRows = [
  ...HEAD,
  "..kwcwk..",
  ".kwwcwwk.",
  "kwwbbbwwk",
  "kwkbBbkwk",
  ".kWWWWWk.",
  ...LEGS,
];
const kickRows = [
  ...HEAD,
  "..kwcwk..",
  ".kwwcwwk.",
  "kwwbbbwwk",
  "kwkbBbkwk",
  ".kWWWWwwk",
  ".kwwkkkk.",
  ".kwk.....",
  ".kkk.....",
];

// Batter, seen from behind, right-handed (stands on the third-base side)
const stanceRows = pad([
  "t..kkk...",
  "tkkccck..",
  "tkCcccCk.",
  "t.kSSSk..",
  "tskwwwwk.",
  ".skwcwcwk",
  ".kwwcccwk",
  ".kwwwwwk.",
  ".kWWWWWk.",
  ".kwwkwwk.",
  "kwwk.kwwk",
  "kwk...kwk",
  "kkk...kkk",
]);
const swingRows = [
  ".....kkk.....",
  "....kccck....",
  "...kCcccCk...",
  "....kSSSk....",
  "...kwwwwwk...",
  "...kwcwcwsstt",
  "...kwwcccwk..",
  "...kwwwwwk...",
  "...kWWWWWk...",
  "...kwwkwwk...",
  "..kwwk.kwwk..",
  "..kwk...kwk..",
  "..kkk...kkk..",
];
const followRows = [
  ".....kkk....t",
  "....kccck..t.",
  "...kCcccCkt..",
  "....kSSSks...",
  "...kwwwwws...",
  "...kwcwcwk...",
  "...kwwcccwk..",
  "...kwwwwwk...",
  "...kWWWWWk...",
  "...kwwkwwk...",
  "..kwwk.kwwk..",
  "..kwk...kwk..",
  "..kkk...kkk..",
];

const catcherRows = [
  ".........",
  ".........",
  ".........",
  "...kkk...",
  "..kCCCk..",
  "..kKKKk..",
  ".kwwcwwk.",
  "kwwwcwwwk",
  "bbkwwwwk.",
  ".kWWWWWk.",
  "kwwwwwwwk",
  "kwwk.kwwk",
  "kkk...kkk",
];

const umpRows = [
  ".........",
  ".........",
  "...kkk...",
  "..kKKKk..",
  "..kSSSk..",
  ".kKKKKKk.",
  "kKKKKKKKk",
  "kKKKKKKKk",
  ".kKKKKKk.",
  ".kWWWWWk.",
  ".kWWkWWk.",
  ".kWk.kWk.",
  ".kkk.kkk.",
];

export const FR = {
  idle: f(idleRows), ready: f(readyRows), runA: f(runA), runB: f(runB),
  throw: f(throwRows), catch: f(catchRows), cheer: f(cheerRows),
  set: f(setRows), kick: f(kickRows),
  stance: f(stanceRows), swing: f(swingRows), follow: f(followRows),
  catcher: f(catcherRows), ump: f(umpRows),
};

// Named animations: frames + fps (+ loop:false to hold the last frame)
export const ANIM = {
  idle: { frames: [FR.idle, FR.idle, FR.ready], fps: 1.5 },
  ready: { frames: [FR.ready], fps: 1 },
  run: { frames: [FR.runA, FR.runB], fps: 10 },
  throw: { frames: [FR.throw], fps: 1 },
  catch: { frames: [FR.catch], fps: 1 },
  cheer: { frames: [FR.cheer, FR.idle], fps: 6 },
  set: { frames: [FR.set], fps: 1 },
  windup: { frames: [FR.set, FR.kick, FR.throw, FR.ready], fps: 14, loop: false },
  stance: { frames: [FR.stance], fps: 1 },
  swing: { frames: [FR.swing, FR.follow], fps: 16, loop: false },
  catcher: { frames: [FR.catcher], fps: 1 },
  ump: { frames: [FR.ump], fps: 1 },
};
