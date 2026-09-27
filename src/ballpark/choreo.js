// ── Choreography: one engine play -> a timeline the ballpark can draw ──
// Pure. buildPlay(play, mode) returns
//   { dur, contact, ball: [seg], actors: { id: [seg] }, jumbo, hype, fireworks }
// Ball segments: { t0, t1, from:[x,d,h], to:[x,d,h], apex, hops } — positions
// are lerped, `apex` adds a parabolic arc, `hops` makes a bouncing grounder.
// Actor segments: { t0, t1, from:[x,d], to:[x,d], anim } — before its first
// segment an actor stands at its home spot; after its last it holds there.
// Actor ids: fielder positions ("SS", "CF", ...), "batter", "r1".."r3".

import { BASES, MOUND, POSITIONS, polar, fenceAt } from "./geometry.js";

// Timing per speed mode. 1x ticks every 900 ms, 4x every 220 ms.
export const MODES = {
  1: { dur: 860, windup: 210, pitch: 120, full: true },
  4: { dur: 205, windup: 0, pitch: 0, full: false },
};

const JUMBO = {
  K: "STRIKEOUT", BB: "WALK", HR: "HOME RUN!", E: "ERROR", DP: "DOUBLE PLAY", WP: "WILD PITCH",
  1: "SINGLE", 2: "DOUBLE", 3: "TRIPLE!",
};

const lerp = (a, b, u) => a + (b - a) * u;
const toward = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

// Nearest fielder to a spot (never the pitcher or catcher for deep balls)
function nearest(pt, deep) {
  let best = "SS", bd = Infinity;
  for (const [pos, p] of Object.entries(POSITIONS)) {
    if (deep && (pos === "P" || pos === "C")) continue;
    const dd = Math.hypot(p[0] - pt[0], p[1] - pt[1]);
    if (dd < bd) { bd = dd; best = pos; }
  }
  return best;
}

// Where the ball ends up for a batted ball
function landing(play) {
  const spray = play.spray ?? 0;
  if (play.foulOut) return polar(Math.sign(spray || 1) * 52, spray === 0 ? 28 : 95);
  const dist = play.dist ?? 120;
  return polar(spray, play.type === "HR" ? Math.max(dist, fenceAt(spray) + 50) : dist);
}

// Runner path along the bases from base a to base b (inclusive corners)
function basePath(a, b) {
  const pts = [];
  for (let i = a; i <= b; i++) pts.push(BASES[i]);
  return pts;
}

// Split [t0,t1] across a polyline, proportional to leg length
function alongPath(pts, t0, t1, anim = "run") {
  if (pts.length < 2) return [];
  const legs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    legs.push(L);
    total += L;
  }
  const segs = [];
  let t = t0;
  legs.forEach((L, i) => {
    const dt = total ? ((t1 - t0) * L) / total : 0;
    segs.push({ t0: t, t1: t + dt, from: pts[i], to: pts[i + 1], anim });
    t += dt;
  });
  return segs;
}

export function buildPlay(play, mode = 1) {
  const M = MODES[mode] || MODES[1];
  const dur = M.dur;
  const out = { dur, contact: 0, ball: [], actors: {}, jumbo: null, hype: false, fireworks: null, batterAnim: null, pitchAt: 0 };
  const act = (id, seg) => (out.actors[id] ||= []).push(seg);

  // Pitch: windup, then the ball travels to the plate
  const release = M.windup;
  const contact = release + M.pitch;
  out.contact = contact;
  out.pitchAt = 0;
  const plate = [0, 1, 3];
  if (M.full) out.ball.push({ t0: release, t1: contact, from: [MOUND[0], MOUND[1] - 3, 7], to: plate, apex: 1 });

  const type = play.type;
  const inPlay = ["OUT", "DP", "E", "HIT", "HR"].includes(type);
  out.jumbo = type === "HIT" ? JUMBO[play.bases] : type === "OUT" ? "OUT" : JUMBO[type] || null;
  out.hype = type === "HR" || (play.runs || 0) > 0;

  // Batter animation
  if (type === "K") out.batterAnim = { at: contact - 40, anim: "swing" };
  else if (inPlay) out.batterAnim = { at: contact - 50, anim: "swing" };

  // Remaining time after contact
  const rest = dur - contact;
  const at = (u) => contact + rest * u;

  if (type === "K" || type === "BB" || type === "WP") {
    // Catcher gloves it (or it skips by on a wild pitch)
    if (M.full && type === "WP") out.ball.push({ t0: contact, t1: at(0.45), from: plate, to: [8, -30, 0], hops: 2, apex: 3 });
  }

  if (inPlay) {
    const land = landing(play);
    const launch = play.launch || "ground";
    const deep = Math.hypot(land[0], land[1]) > 150;
    const fielder = play.fielderPos && !(type === "HIT" || type === "HR") ? play.fielderPos : nearest(land, deep);
    const home = POSITIONS[fielder];

    if (type === "HR") {
      out.ball.push({ t0: contact, t1: at(0.62), from: plate, to: [land[0], land[1], 40], apex: 70 });
      out.fireworks = at(0.62);
      // outfielder drifts back to the wall and watches it go
      const wall = polar(play.spray ?? 0, fenceAt(play.spray ?? 0) - 6);
      act(fielder, { t0: contact, t1: at(0.55), from: home, to: toward(home, wall, 0.8), anim: "run" });
    } else if (type === "OUT" && launch !== "ground") {
      // Caught on the fly: the fielder runs under it
      const t1 = at(launch === "fly" ? 0.7 : 0.4);
      const apex = launch === "fly" ? Math.max(35, (play.dist ?? 150) * 0.28) : 10;
      out.ball.push({ t0: contact, t1, from: plate, to: [land[0], land[1], 5], apex });
      const fromSpot = POSITIONS[fielder];
      act(fielder, { t0: contact, t1: t1 - 20, from: fromSpot, to: land, anim: "run" });
      act(fielder, { t0: t1 - 20, t1: dur, from: land, to: land, anim: "catch" });
      // throw it back in
      if (M.full) out.ball.push({ t0: at(0.8), t1: dur, from: [land[0], land[1], 6], to: [...toward(land, MOUND, 0.6), 4], apex: 8 });
    } else if (type === "OUT" || type === "DP") {
      // Grounder: fielder charges the spot on the ball's line, throws to first
      const spray = play.spray ?? 0;
      const reach = Math.hypot(home[0], home[1]) * 0.9;
      const pick = polar(spray, Math.min(reach, Math.max(40, play.dist ?? reach)));
      const tPick = at(0.4);
      out.ball.push({ t0: contact, t1: tPick, from: plate, to: [pick[0], pick[1], 1], hops: 3, apex: 5 });
      act(fielder, { t0: contact, t1: tPick, from: home, to: pick, anim: "run" });
      act(fielder, { t0: tPick, t1: dur, from: pick, to: pick, anim: "throw" });
      if (type === "DP") {
        const tMid = at(0.66);
        out.ball.push({ t0: tPick + 10, t1: tMid, from: [pick[0], pick[1], 4], to: [BASES[2][0], BASES[2][1], 4], apex: 3 });
        out.ball.push({ t0: tMid + 10, t1: at(0.95), from: [BASES[2][0], BASES[2][1], 4], to: [BASES[1][0], BASES[1][1], 4], apex: 4 });
        const cover = fielder === "2B" ? "SS" : "2B";
        act(cover, { t0: contact, t1: tMid, from: POSITIONS[cover], to: BASES[2], anim: "run" });
        act(cover, { t0: tMid, t1: dur, from: BASES[2], to: BASES[2], anim: "throw" });
      } else {
        out.ball.push({ t0: tPick + 10, t1: at(0.9), from: [pick[0], pick[1], 4], to: [BASES[1][0], BASES[1][1], 4], apex: 4 });
      }
      if (fielder !== "1B") {
        act("1B", { t0: contact, t1: at(0.35), from: POSITIONS["1B"], to: [BASES[1][0] - 3, BASES[1][1] + 2], anim: "run" });
        act("1B", { t0: at(0.35), t1: dur, from: [BASES[1][0] - 3, BASES[1][1] + 2], to: [BASES[1][0] - 3, BASES[1][1] + 2], anim: "catch" });
      }
    } else {
      // Hit or error: ball gets through / drops in, nearest fielder chases it
      const ground = launch === "ground";
      const tLand = at(ground ? 0.45 : 0.4);
      const roll = type === "HIT" ? polar(play.spray ?? 0, Math.min((play.dist ?? 150) + (play.bases >= 2 ? 50 : 20), fenceAt(play.spray ?? 0) - 4)) : land;
      out.ball.push({ t0: contact, t1: tLand, from: plate, to: [land[0], land[1], 0], apex: ground ? 5 : launch === "liner" ? 12 : 40, hops: ground ? 3 : 0 });
      out.ball.push({ t0: tLand, t1: at(0.7), from: [land[0], land[1], 0], to: [roll[0], roll[1], 0], hops: 2, apex: 3 });
      const tGet = at(0.72);
      act(fielder, { t0: contact, t1: tGet, from: home, to: roll, anim: "run" });
      if (type === "E") {
        // boots it: ball squirts away
        out.ball.push({ t0: tGet, t1: at(0.85), from: [roll[0], roll[1], 0], to: [roll[0] + 12, roll[1] - 8, 0], hops: 2, apex: 2 });
      } else if (M.full) {
        act(fielder, { t0: tGet, t1: dur, from: roll, to: roll, anim: "throw" });
        out.ball.push({ t0: tGet + 20, t1: dur, from: [roll[0], roll[1], 5], to: [...toward(roll, BASES[2], 0.7), 5], apex: 12 });
      }
    }
  }

  // Runners: every move plays out between contact and the end of the play
  const runStart = type === "BB" || type === "WP" ? contact + 40 : contact + 20;
  const runEnd = dur - 15;
  for (const mv of play.moves || []) {
    const id = mv.from === 0 ? "batter" : `r${mv.from}`;
    const legs = Math.max(1, mv.to - mv.from);
    const span = (runEnd - runStart) * Math.min(1, 0.45 + legs * 0.2);
    const path = basePath(mv.from, mv.to);
    if (mv.out) {
      // thrown out: stop just short of the bag
      const last = path[path.length - 1], prev = path[path.length - 2];
      path[path.length - 1] = toward(prev, last, 0.85);
    }
    alongPath(path, runStart, runStart + span).forEach((s) => act(id, s));
    const end = path[path.length - 1];
    act(id, { t0: runStart + span, t1: dur, from: end, to: end, anim: mv.to === 4 ? "cheer" : "idle" });
  }

  return out;
}

// Sample a ball timeline at time t -> [x, d, h] or null when no ball is live
export function ballAt(segs, t) {
  for (const s of segs) {
    if (t < s.t0 || t > s.t1) continue;
    const u = s.t1 > s.t0 ? (t - s.t0) / (s.t1 - s.t0) : 1;
    const x = lerp(s.from[0], s.to[0], u);
    const d = lerp(s.from[1], s.to[1], u);
    let h = lerp(s.from[2], s.to[2], u);
    if (s.hops) h += Math.abs(Math.sin(Math.PI * u * s.hops)) * (s.apex || 3) * (1 - u);
    else if (s.apex) h += Math.sin(Math.PI * u) * s.apex;
    return [x, d, Math.max(0, h)];
  }
  return null;
}

// Sample an actor at time t -> { pos, anim, moving, since } or null (no script)
export function actorAt(segs, t) {
  if (!segs || !segs.length) return null;
  if (t < segs[0].t0) return { pos: segs[0].from, anim: null, moving: false, since: 0 };
  let s = segs[0];
  for (const seg of segs) if (t >= seg.t0) s = seg;
  const u = s.t1 > s.t0 ? Math.min(1, (t - s.t0) / (s.t1 - s.t0)) : 1;
  const pos = toward(s.from, s.to, u);
  const moving = u < 1 && (s.from[0] !== s.to[0] || s.from[1] !== s.to[1]);
  return { pos, anim: moving ? s.anim : s.anim === "run" ? "idle" : s.anim, moving, since: s.t0, dir: Math.sign(s.to[0] - s.from[0]) };
}
