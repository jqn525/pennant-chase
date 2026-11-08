// ── Construction: ballpark upgrades take games to build and are paid as they go ──
// One project per area. Each game played pays one installment and moves the
// project a game closer; short on cash, the crew waits. Nothing is paid upfront.

import { BALLPARK, trackLevel, buildLock, completeBuild, credit, pushLog } from "./franchise.js";

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const nice = (track) => track.title.charAt(0) + track.title.slice(1).toLowerCase();

export const projects = (s) => Object.entries(s.builds || {}).map(([id, b]) => ({ id, ...b }));
export const installments = (s) => projects(s).reduce((t, b) => t + Math.min(b.perGame, b.cost - b.paid), 0);

// Why a project can't start (null when it can): fan gates and the merch-before-TV rule only
export function startLock(s, id) {
  if (s.phase === "draft") return "Winter: construction resumes on opening day";
  if (s.builds?.[id]) return "Already under construction";
  const lock = buildLock(s, id);
  return lock && !/^Needs \$/.test(lock) ? lock : null;
}

export function startBuild(s, id) {
  if (startLock(s, id)) return false;
  const track = BALLPARK.find((t) => t.id === id);
  const lvl = trackLevel(s, id);
  const tier = track.tiers[lvl];
  const games = Math.max(1, tier.games || 1);
  const perGame = Math.ceil(tier.cost / games);
  s.builds = { ...(s.builds || {}), [id]: { tier: lvl, name: tier.name, area: nice(track), cost: tier.cost, games, left: games, perGame, paid: 0, stalled: false, startN: s.hist?.n ?? 0, y: s.year } };
  if (s.hist) s.hist.spend.push({ n: s.hist.n, y: s.year, gi: s.gameIndex, cat: "upgrades", cost: 0, what: `${tier.name} (${nice(track)} ${lvl + 1})`, proj: id, building: true });
  pushLog(s, `Construction starts on the ${tier.name}: ${games} game${games === 1 ? "" : "s"} at $${fmt(perGame)} a game.`, "sys");
  return true;
}

const projectEvent = (s, id) => {
  const list = s.hist?.spend || [];
  for (let i = list.length - 1; i >= 0; i--) if (list[i].proj === id && list[i].building) return list[i];
  return null;
};

// After each game: pay installments, move projects along, open finished ones
export function progressBuilds(s) {
  for (const b of projects(s)) {
    const pay = Math.min(b.perGame, b.cost - b.paid);
    const cur = s.builds[b.id];
    if (s.money < pay) {
      if (!cur.stalled) pushLog(s, `Construction on the ${b.name} has stalled: not enough cash for this game's $${fmt(pay)}.`, "out");
      cur.stalled = true;
      continue;
    }
    credit(s, "upgrades", -pay);
    const ev = projectEvent(s, b.id);
    if (ev) ev.cost += pay;
    cur.paid += pay; cur.left -= 1; cur.stalled = false;
    if (cur.left <= 0) {
      const { [b.id]: done, ...rest } = s.builds;
      s.builds = rest;
      completeBuild(s, b.id);
      if (ev) { ev.building = false; ev.doneN = s.hist.n + 1; } // this game is about to be recorded
      pushLog(s, `The ${b.name} opens.`, "beat");
    }
  }
}

export function cancelBuild(s, id) {
  if (!s.builds?.[id]) return false;
  const { [id]: b, ...rest } = s.builds;
  s.builds = rest;
  const ev = projectEvent(s, id);
  if (ev) { ev.building = false; ev.cancelled = true; }
  pushLog(s, `Construction on the ${b.name} is cancelled after $${fmt(b.paid)}.`, "out");
  return true;
}
