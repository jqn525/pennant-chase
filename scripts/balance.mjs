// Balance check: scoring at different league levels, and win % by rating edge.
// Run: node scripts/balance.mjs [games]
import { newGame, playGameInstant } from "../src/game/engine.js";
import { genRoster } from "../src/game/generators.js";
import { FENCE } from "../src/game/franchise.js";
import { LEAGUE } from "../src/game/constants.js";

const N = Number(process.argv[2] || 2000);
const set = (p, keys, v) => { for (const k of keys) p[k] = v; delete p.gear; delete p.trait; return p; };
const club = (bat, arm) => {
  const r = genRoster(65);
  r.batters.forEach((p) => set(p, ["contact", "power", "eye", "speed", "defense"], bat));
  [...r.rotation, ...r.pen].forEach((p) => set(p, ["stuff", "control", "stamina", "defense"], arm));
  return r;
};
function play(a, b, n = N) {
  const us = club(a, a), them = club(b, b);
  const opp = { name: "T", batters: them.batters, rotation: them.rotation, pen: them.pen };
  let w = 0, runs = 0, hr = 0, h = 0, ab = 0;
  for (let i = 0; i < n; i++) {
    const g = newGame(opp, i % 2 === 0, 1);
    playGameInstant(g, { batters: us.batters, opp, staff: { sp: us.rotation[i % 5], setup: us.pen[0], closer: us.pen[1] },
      oppStaff: { sp: them.rotation[i % 5], setup: them.pen[0], closer: them.pen[1] }, fence: FENCE, statBase: LEAGUE.statBase, innings: 9, cityName: "U" });
    if (g.us > g.them) w++;
    runs += g.us + g.them;
    for (const side of ["us", "them"]) for (const id in g.box[side]) { const l = g.box[side][id]; hr += l.hr; h += l.h; ab += l.ab; }
  }
  return { w: w / n, rpg: runs / n / 2, avg: h / ab, hr: hr / n / 2 };
}
const scoring = [55, 65, 75, 85, 95].map((L) => { const r = play(L, L); return { level: L, "R/team/g": r.rpg.toFixed(2), AVG: r.avg.toFixed(3), "HR/team/g": r.hr.toFixed(2) }; });
console.table(scoring);
const curve = [0, 2, 4, 6, 10, 15].map((d) => ({ edge: d, "win% at 65": play(65 + d, 65).w.toFixed(3), "win% at 80": play(80 + d, 80).w.toFixed(3) }));
console.table(curve);
