import { describe, it, expect } from "vitest";
import { buildPlay, ballAt, actorAt, MODES } from "./choreo.js";
import { playMoves } from "../game/engine.js";
import { BASES, fenceAt, polar, project, unproject } from "./geometry.js";

const base = { weBat: true, runs: 0, on: [null, null, null] };
const plays = [
  { ...base, type: "K", moves: [] },
  { ...base, type: "BB", moves: [{ from: 0, to: 1 }] },
  { ...base, type: "WP", moves: [{ from: 1, to: 2 }] },
  { ...base, type: "OUT", launch: "fly", spray: 10, dist: 300, fielderPos: "CF", moves: [] },
  { ...base, type: "OUT", launch: "ground", spray: -10, dist: 90, fielderPos: "SS", moves: [{ from: 0, to: 1, out: true }] },
  { ...base, type: "OUT", foulOut: true, spray: 50, launch: "fly", moves: [] },
  { ...base, type: "DP", launch: "ground", spray: 5, dist: 80, fielderPos: "2B", moves: [{ from: 0, to: 1, out: true }, { from: 1, to: 2, out: true }] },
  { ...base, type: "E", launch: "ground", spray: 30, dist: 70, fielderPos: "1B", moves: [{ from: 0, to: 1 }] },
  { ...base, type: "HIT", bases: 2, launch: "liner", spray: -30, dist: 280, fielderPos: "LF", moves: [{ from: 0, to: 2 }, { from: 1, to: 3 }], runs: 0 },
  { ...base, type: "HR", launch: "fly", spray: 0, dist: 430, moves: [{ from: 0, to: 4 }, { from: 2, to: 4 }], runs: 2 },
];

describe("choreography", () => {
  for (const mode of [1, 4]) {
    for (const p of plays) {
      it(`${p.type}${p.foulOut ? "(foul)" : ""} fits the ${mode}x tick`, () => {
        const tl = buildPlay(p, mode);
        expect(tl.dur).toBe(MODES[mode].dur);
        for (const s of tl.ball) expect(s.t1).toBeLessThanOrEqual(tl.dur + 1);
        for (const segs of Object.values(tl.actors)) for (const s of segs) {
          expect(s.t1).toBeLessThanOrEqual(tl.dur + 1);
          expect(s.t0).toBeLessThanOrEqual(s.t1);
        }
      });
    }
  }

  it("runners finish on the base the engine put them on", () => {
    const p = plays.find((x) => x.type === "HIT");
    const tl = buildPlay(p, 1);
    expect(actorAt(tl.actors.batter, tl.dur).pos).toEqual(BASES[2]);
    expect(actorAt(tl.actors.r1, tl.dur).pos).toEqual(BASES[3]);
  });

  it("a home run leaves the yard", () => {
    const tl = buildPlay(plays.find((x) => x.type === "HR"), 1);
    const flight = tl.ball.find((s) => s.apex >= 50);
    const [x, d] = flight.to;
    expect(Math.hypot(x, d)).toBeGreaterThan(fenceAt(0));
    expect(tl.fireworks).toBeGreaterThan(0);
    expect(tl.jumbo).toBe("HOME RUN!");
  });

  it("a fly out ends in the fielder's glove", () => {
    const p = plays[3];
    const tl = buildPlay(p, 1);
    const land = polar(p.spray, p.dist);
    const cf = actorAt(tl.actors.CF, tl.dur);
    expect(cf.anim).toBe("catch");
    expect(cf.pos[0]).toBeCloseTo(land[0]);
    expect(ballAt(tl.ball, tl.ball[1].t1)[2]).toBeLessThan(6);
  });

  it("projection round-trips through the ground plane", () => {
    const [sx, sy] = project(40, 200);
    const [x, d] = unproject(sx, sy);
    expect(x).toBeCloseTo(40);
    expect(d).toBeCloseTo(200);
  });
});

describe("playMoves", () => {
  it("forces runners on a walk", () => {
    expect(playMoves({ type: "BB" }, [true, false, true])).toEqual([{ from: 0, to: 1 }, { from: 1, to: 2 }]);
    expect(playMoves({ type: "BB" }, [true, true, true]).at(-1)).toEqual({ from: 3, to: 4 });
  });
  it("advances everyone on hits and homers", () => {
    expect(playMoves({ type: "HIT", bases: 2 }, [true, false, true])).toEqual([{ from: 0, to: 2 }, { from: 1, to: 3 }, { from: 3, to: 4 }]);
    expect(playMoves({ type: "HR" }, [false, true, false])).toEqual([{ from: 0, to: 4 }, { from: 2, to: 4 }]);
  });
});
