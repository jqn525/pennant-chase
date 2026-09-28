// ── Trading-card photos: full-body action poses by position ──
// 64×72 scene + figure. Each pose is a skeleton (joint positions); limbs
// are painted as thick strokes, far-side limbs in shadow, then outlined.
// Pure: poseFrame(p) -> string rows; poseFor(pos) names the pose.

import { grid, rng } from "../raster.js";
import { hashStr } from "../palette.js";
import { features } from "./portraits.js";

const W = 64, H = 72;

// Joints: head, neck, hip; arms from the shoulder (= neck + 3 down):
// eb/hb = back elbow/hand, ef/hf = front; legs kb/fb, kf/ff.
// glove: "f" | "b" (which hand), bat: [x, y] tip, ball: true (in back hand)
const POSES = {
  pitchCocked: {
    head: [36, 15], neck: [33, 22], hip: [31, 40],
    eb: [22, 22], hb: [17, 13], ef: [40, 25], hf: [47, 27],
    kb: [25, 51], fb: [19, 63], kf: [40, 50], ff: [47, 64],
    glove: "f", ball: true, scene: "mound",
  },
  pitchFollow: {
    head: [42, 21], neck: [38, 26], hip: [31, 41],
    eb: [40, 33], hb: [46, 42], ef: [31, 31], hf: [28, 36],
    kb: [23, 47], fb: [14, 42], kf: [40, 52], ff: [45, 64],
    glove: "f", scene: "mound",
  },
  catcher: {
    head: [36, 29], neck: [33, 35], hip: [26, 50],
    eb: [28, 43], hb: [26, 49], ef: [40, 39], hf: [47, 37],
    kb: [33, 53], fb: [29, 64], kf: [37, 51], ff: [35, 64],
    glove: "f", gear: true, scene: "plate",
  },
  stretch: {
    head: [43, 22], neck: [39, 28], hip: [30, 44],
    eb: [34, 37], hb: [33, 45], ef: [47, 28], hf: [55, 26],
    kb: [21, 53], fb: [13, 64], kf: [44, 53], ff: [53, 64],
    glove: "f", scene: "infield",
  },
  grounder: {
    head: [43, 25], neck: [39, 31], hip: [30, 43],
    eb: [37, 44], hb: [39, 56], ef: [42, 44], hf: [44, 58],
    kb: [22, 53], fb: [16, 64], kf: [39, 53], ff: [45, 64],
    glove: "f", scene: "infield",
  },
  throwAcross: {
    head: [35, 14], neck: [32, 21], hip: [31, 39],
    eb: [22, 20], hb: [18, 11], ef: [40, 24], hf: [46, 21],
    kb: [26, 51], fb: [21, 64], kf: [39, 51], ff: [45, 64],
    glove: "f", ball: true, scene: "infield",
  },
  ready: {
    head: [37, 21], neck: [34, 27], hip: [30, 43],
    eb: [33, 37], hb: [35, 46], ef: [38, 36], hf: [41, 45],
    kb: [24, 53], fb: [19, 64], kf: [37, 53], ff: [41, 64],
    glove: "f", scene: "infield",
  },
  flyCatch: {
    head: [32, 15], neck: [31, 22], hip: [30, 40],
    eb: [24, 16], hb: [23, 9], ef: [37, 12], hf: [39, 5],
    kb: [27, 52], fb: [23, 64], kf: [35, 52], ff: [39, 64],
    glove: "f", lookUp: true, scene: "outfield",
  },
  leap: {
    head: [33, 13], neck: [32, 20], hip: [30, 37],
    eb: [25, 22], hb: [22, 28], ef: [37, 11], hf: [40, 4],
    kb: [24, 46], fb: [19, 54], kf: [37, 45], ff: [35, 56],
    glove: "f", lookUp: true, air: true, scene: "wall",
  },
  stance: {
    head: [33, 17], neck: [31, 24], hip: [31, 42],
    eb: [22, 27], hb: [26, 21], ef: [32, 31], hf: [27, 22],
    kb: [25, 53], fb: [21, 64], kf: [38, 53], ff: [42, 64],
    bat: [19, 4], scene: "plate",
  },
};

const BY_POS = {
  SP: "pitchCocked", RP: "pitchFollow", C: "catcher", "1B": "stretch", "2B": "grounder",
  SS: "throwAcross", "3B": "ready", LF: "flyCatch", RF: "flyCatch", CF: "leap", DH: "stance",
};
export const poseFor = (pos) => BY_POS[pos] || "stance";
export const POSE_NAMES = Object.keys(POSES);

// ── Scenes ──
function scene(kind, seed) {
  const g = grid(W, H, "q");
  const r = rng(seed);
  for (let y = 10; y < 18; y++) for (let x = 0; x < W; x++) if ((x + y) % 2) g.set(x, y, "Q");
  const crowd = ["r", "a", "u", "i", "y", "z", "z"];
  const standTop = kind === "wall" ? 16 : 18, wallTop = kind === "wall" ? 34 : 26;
  for (let y = standTop; y < wallTop; y++) for (let x = 0; x < W; x++) {
    g.set(x, y, "z");
    if ((y - standTop) % 2 === 0 && r() < 0.55) g.set(x, y, crowd[Math.floor(r() * crowd.length)]);
  }
  g.hline(0, W - 1, wallTop, "a");
  g.rect(0, wallTop + 1, W, kind === "wall" ? 14 : 5, "o");
  const fieldTop = wallTop + (kind === "wall" ? 15 : 6);
  for (let y = fieldTop; y < H; y++) for (let x = 0; x < W; x++) {
    g.set(x, y, Math.floor((x + (y - fieldTop) * 2) / 10) % 2 ? "v" : "V");
  }
  if (kind === "wall") g.rect(0, fieldTop, W, 6, "d"); // warning track
  if (kind === "infield") g.rect(0, 50, W, H - 50, "d");
  if (kind === "plate") {
    g.rect(0, 46, W, H - 46, "d");
    g.hline(6, 58, 60, "u"); g.hline(6, 58, 70, "u");
    g.rect(24, 64, 10, 2, "u");
  }
  if (kind === "mound") {
    g.oval(32, 70, 34, 14, "d");
    g.rect(26, 63, 12, 1, "u");
  }
  // soft dirt speckle
  g.map((c, x, y) => (c === "d" && (x * 7 + y * 13) % 11 === 0 ? "D" : null));
  return g;
}

// ── Figure ──
function figure(pose, f) {
  const g = grid(W, H);
  const P = POSES[pose];
  const off = (pt) => [pt[0] + 0, pt[1] + (P.air ? -2 : 0)];
  const J = Object.fromEntries(Object.entries(P).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, off(v)]));
  const sh = [J.neck[0], J.neck[1] + 3];
  const facing = J.head[0] >= J.neck[0] ? 1 : -1;

  const leg = (hip, knee, foot, far) => {
    const pant = far ? "W" : "w";
    g.line(...hip, ...knee, pant, 2.6);
    const sock = [knee[0] + (foot[0] - knee[0]) * 0.55, knee[1] + (foot[1] - knee[1]) * 0.55];
    g.line(...knee, ...sock, P.gear ? "n" : pant, P.gear ? 2.3 : 2.1);
    g.line(...sock, ...foot, P.gear ? "n" : far ? "C" : "c", 1.8);
    g.oval(foot[0] + facing * 1.5, foot[1] - 0.5, 3, 1.6, "K");
  };
  const arm = (elbow, hand, far, gloved) => {
    const sleeve = [sh[0] + (elbow[0] - sh[0]) * 0.55, sh[1] + (elbow[1] - sh[1]) * 0.55];
    g.line(...sh, ...sleeve, far ? "W" : "w", 2.2);
    g.line(...sleeve, ...elbow, far ? "S" : "s", 1.7);
    g.line(...elbow, ...hand, far ? "S" : "s", 1.5);
    if (gloved) { g.oval(hand[0], hand[1], 3.4, 3.4, "b"); g.oval(hand[0] + facing, hand[1], 1.4, 1.4, "B"); }
    else g.oval(hand[0], hand[1], 1.6, 1.6, far ? "S" : "s");
  };

  // far limbs first
  leg(J.hip, J.kb, J.fb, true);
  arm(J.eb, J.hb, true, P.glove === "b");
  if (P.bat) { g.line(...J.hb, ...P.bat, "t", 1.1); g.set(P.bat[0], P.bat[1], "t"); }

  // torso
  g.line(...J.neck, ...J.hip, "w", 5.2);
  g.map((c, x, y) => (c === "w" && (x - J.neck[0]) * facing < -2.5 && y < J.hip[1] ? "W" : null));
  if (P.gear) g.line(J.neck[0] + facing * 2, J.neck[1] + 2, J.hip[0] + facing * 2, J.hip[1] - 3, "n", 3.4);
  else g.line(J.neck[0] + facing * 2, J.neck[1] + 2, J.hip[0] + facing * 2, J.hip[1] - 2, "c", 0.4);
  g.oval(J.hip[0], J.hip[1], 5.5, 1.2, "K"); // belt

  // near limbs
  leg(J.hip, J.kf, J.ff, false);

  // head
  const [hx, hy] = J.head;
  if (f.long) g.oval(hx - facing * 4, hy + 3, 2.5, 4, "h");
  g.oval(hx, hy, 5, 5.2, "s");
  g.map((c, x, y) => (c === "s" && (x - hx) * facing < -2 && Math.hypot(x - hx, y - hy) < 6 ? "S" : null));
  g.set(hx - facing * 3, hy + 1, "S");                  // ear
  g.set(hx - facing * 4, hy - 1, "h"); g.set(hx - facing * 4, hy, "h");
  const eyeY = P.lookUp ? hy - 2 : hy;
  g.set(hx + facing * 3, eyeY, "e");
  if (f.eyeBlack && !P.gear) g.set(hx + facing * 3, eyeY + 1, "e");
  if (f.facial === "beard" || f.facial === "goatee") { g.set(hx + facing * 2, hy + 4, "h"); g.set(hx + facing * 3, hy + 3, "h"); }
  if (f.facial === "stache" || f.facial === "beard") g.set(hx + facing * 4, hy + 2, "h");
  g.set(hx + facing * 4, hy + 3, "m");
  // cap (catchers wear it backwards under the mask)
  g.oval(hx, hy - 2, 5.6, 4.2, "c", (x, y) => y <= hy - 2);
  g.map((c, x, y) => (c === "c" && y <= hy - 2 && (x - hx) * facing < -2 ? "C" : null));
  const brimDir = P.gear ? -facing : facing;
  g.hline(hx, hx + brimDir * 8, hy - 2, "C");
  if (P.gear) { for (let y = hy - 3; y <= hy + 4; y++) { g.set(hx + facing * 5, y, "N"); if (y % 2 === 0) g.set(hx + facing * 4, y, "N"); } }

  // near arm last so the glove/throwing hand sits on top
  arm(J.ef, J.hf, false, P.glove === "f");
  if (P.ball) g.oval(J.hb[0], J.hb[1] - 1, 1.2, 1.2, "u");
  if (P.bat) { g.line(...J.hf, ...J.hb, "s", 1.3); }

  g.outline(".", "k");
  if (P.air) g.oval(31, 66, 7, 1.2, "."); // placeholder for shadow (drawn on scene)
  return g;
}

export function poseFrame(p) {
  const pose = poseFor(p.pos);
  const f = features(p);
  const sc = scene(POSES[pose].scene, hashStr(`scene:${p.id}`));
  const fig = figure(pose, f);
  if (POSES[pose].air) sc.oval(31, 66, 7, 1.3, "V");
  // ground shadow under planted feet
  else sc.oval(32, 65, 12, 1.2, POSES[pose].scene === "outfield" ? "V" : "D");
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = fig.get(x, y);
    if (c && c !== ".") sc.set(x, y, c);
  }
  return sc.toRows();
}
