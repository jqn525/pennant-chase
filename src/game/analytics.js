// ── Analytics: everything the Stats tab computes from history ──
// Pure. Reads s and s.hist; never mutates.

import { LEAGUE } from "./constants.js";
import { ovr } from "./gear.js";
import { QS, teamRating, seedOrder } from "./season.js";
import { WIN_PER_BAT_POINT, WIN_PER_ARM_POINT, valueOfWin } from "./advisor.js";
import { allPlayers, trainCeil, ledgerNet } from "./franchise.js";
import { seasonRows, SPEND_CATS } from "./history.js";
import { BAT_STATS, PIT_STATS } from "./constants.js";

export const CAT_LABEL = { training: "Training", gear: "Gear", upgrades: "Ballpark", prints: "Star power", draft: "Draft", trades: "Trades", tax: "Luxury tax" };

const wpp = (r) => (r === "p" ? WIN_PER_ARM_POINT : WIN_PER_BAT_POINT);

// Estimated $/game an event added: the advisor's quote if bought through it, else rating points → wins → $
export function eventGain(s, ev, vWin = valueOfWin(s)) {
  if (ev.gain != null) return ev.gain;
  if (ev.d != null && ev.r) return Math.max(0, ev.d) * wpp(ev.r) * vWin;
  return 0;
}

// ── Spending & ROI ──
export function spendReport(s, { year = null } = {}) {
  const h = s.hist;
  const vWin = valueOfWin(s);
  const events = h.spend.filter((e) => year == null || e.y === year).map((e) => {
    const gain = eventGain(s, e, vWin);
    // a build earns from the day it opens; one still going (or cancelled) earns nothing yet
    const from = e.proj ? (e.doneN ?? null) : e.n;
    const games = from == null ? 0 : Math.max(0, h.n - from);
    const returned = gain * games;
    return { ...e, gainPerGame: gain, games, returned, progress: e.cost ? returned / e.cost : 0, paybackGames: gain > 0 ? e.cost / gain : Infinity };
  });
  const byCat = SPEND_CATS.map((cat) => {
    const list = events.filter((e) => e.cat === cat);
    return {
      cat, label: CAT_LABEL[cat], count: list.length,
      cost: list.reduce((t, e) => t + e.cost, 0),
      gainPerGame: list.reduce((t, e) => t + e.gainPerGame, 0),
      returned: list.reduce((t, e) => t + e.returned, 0),
      ovr: list.reduce((t, e) => t + (e.d > 0 && (cat === "training" || cat === "gear") ? e.d : 0), 0),
    };
  }).filter((c) => c.count);
  const ovrBought = events.filter((e) => (e.cat === "training" || e.cat === "gear") && e.d > 0).reduce((t, e) => t + e.d, 0);
  const winsPerSeason = events.filter((e) => (e.cat === "training" || e.cat === "gear") && e.d > 0)
    .reduce((t, e) => t + e.d * wpp(e.r) * LEAGUE.seasonGames, 0);
  return {
    events, byCat,
    total: events.reduce((t, e) => t + e.cost, 0),
    gainPerGame: events.reduce((t, e) => t + e.gainPerGame, 0),
    returned: events.reduce((t, e) => t + e.returned, 0),
    paidOff: events.filter((e) => e.progress >= 1).length,
    ovrBought, winsPerSeason,
  };
}

// ── Player development ──
export function development(s) {
  const h = s.hist;
  return allPlayers(s).map((p) => {
    const series = h.ovr[p.id] || [];
    const thisYear = h.games.length ? firstN(h, s.year) : null;
    const startPt = series.find((pt) => thisYear == null || pt[0] >= thisYear) || series[series.length - 1];
    const start = startPt ? startPt[1] / 10 : ovr(p);
    const first = series.length ? series[0][1] / 10 : ovr(p);
    const mine = h.spend.filter((e) => e.pid === p.id && (e.cat === "training" || e.cat === "gear" || e.cat === "prints"));
    const invested = mine.reduce((t, e) => t + e.cost, 0);
    const pts = mine.reduce((t, e) => t + (e.d > 0 ? e.d : 0), 0);
    const keys = p.role === "bat" ? BAT_STATS : PIT_STATS;
    const room = keys.reduce((t, k) => t + Math.max(0, (Number.isFinite(trainCeil(s, p, k)) ? trainCeil(s, p, k) : p[k]) - p[k]), 0);
    return { p, now: ovr(p), start, first, season: ovr(p) - start, career: ovr(p) - first, invested, pts, perPoint: pts > 0 ? invested / pts : null, room, series };
  });
}
// The absolute game number at which a season began
function firstN(h, y) {
  const r = h.games.find((g) => g[1] === y);
  return r ? r[0] - 1 : h.n;
}

// ── Team KPIs ──
export const pythag = (rf, ra, k = 1.83) => (rf + ra ? rf ** k / (rf ** k + ra ** k) : 0.5);

export function teamKpis(s, year = s.year) {
  const rows = seasonRows(s.hist, year).filter((r) => !r.po);
  const sum = (list, k) => list.reduce((t, r) => t + r[k], 0);
  const rec = (list) => ({ w: sum(list, "w"), l: list.length - sum(list, "w") });
  const rf = sum(rows, "rf"), ra = sum(rows, "ra");
  const { w, l } = rec(rows);
  const pyth = pythag(rf, ra);
  const vs = {};
  for (const r of rows) { const v = vs[r.opp] || (vs[r.opp] = { opp: r.opp, w: 0, l: 0, rf: 0, ra: 0 }); r.w ? v.w++ : v.l++; v.rf += r.rf; v.ra += r.ra; }
  let cum = 0;
  return {
    rows, games: rows.length, w, l, rf, ra, diff: rf - ra, pyth,
    expW: pyth * rows.length, luck: w - pyth * rows.length,
    home: rec(rows.filter((r) => r.home)), away: rec(rows.filter((r) => !r.home)),
    last10: rec(rows.slice(-10)), oneRun: rec(rows.filter((r) => Math.abs(r.rf - r.ra) === 1)),
    blowouts: rec(rows.filter((r) => Math.abs(r.rf - r.ra) >= 5)),
    vs: Object.values(vs).sort((a, b) => (b.w - b.l) - (a.w - a.l)),
    winPct: rows.map((r, i) => { cum += r.w; return [i + 1, cum / (i + 1)]; }),
    perGame: {
      gate: rows.length ? sum(rows, "gate") / rows.length : 0,
      att: rows.length ? sum(rows, "att") / rows.length : 0,
    },
  };
}

// Rating of every club (ours first) for the rival comparison
export function ratingsTable(s) {
  return [
    { name: s.city.nickname, me: true, r: teamRating(s.roster) },
    ...s.rivals.map((t) => ({ name: t.name, me: false, r: teamRating(t) })),
  ].sort((a, b) => b.r - a.r);
}

// ── Projections: Monte Carlo of the rest of the season and the bracket ──
const logistic = (rA, rB, homeA) => Math.min(0.95, Math.max(0.05, 1 / (1 + Math.exp(-(rA - rB) * QS.K)) + (homeA ? QS.H : -QS.H)));

// Our real win rate can differ from the quick model: blend in this season's record
function ourEdge(s) {
  const { w, l } = s.standings[0];
  const n = w + l;
  if (!n) return 0;
  const k = n / (n + 40);
  return k * ((w + 2) / (n + 4) - 0.5);
}

function series(p, bestOf, a0 = 0, b0 = 0, rnd) {
  const need = Math.ceil(bestOf / 2);
  let a = a0, b = b0;
  while (a < need && b < need) (rnd() < p ? a++ : b++);
  return a > b;
}

export function project(s, runs = 1000, rnd = Math.random) {
  if (!s.roster || s.phase === "draft") return null;
  const ratings = [teamRating(s.roster), ...s.rivals.map(teamRating)];
  const edge = ourEdge(s);
  const pGame = (a, b, homeA) => {
    let p = logistic(ratings[a], ratings[b], homeA);
    if (a === 0) p += edge; else if (b === 0) p -= edge;
    return Math.min(0.95, Math.max(0.05, p));
  };
  const out = { runs, playoffs: 0, final: 0, cup: 0, wins: [], seed: Array(8).fill(0) };

  if (s.phase === "playoffs") {
    const pl = s.playoffs;
    for (let i = 0; i < runs; i++) {
      const p = pGame(0, pl.opp, true);
      let alive;
      if (pl.round === "semi") {
        alive = series(p, 5, pl.wins.us, pl.wins.them, rnd);
        if (alive) { out.final++; alive = series(pGame(0, pl.otherWinner, true), 7, 0, 0, rnd); }
      } else { out.final++; alive = series(p, 7, pl.wins.us, pl.wins.them, rnd); }
      if (alive) out.cup++;
    }
    out.playoffs = runs;
  } else {
    for (let i = 0; i < runs; i++) {
      const st = s.standings.map((t) => ({ w: t.w, l: t.l }));
      for (let gi = s.gameIndex; gi < LEAGUE.seasonGames; gi++) {
        const d = s.schedule[gi];
        const usWin = rnd() < pGame(0, d.opp, d.home);
        st[0][usWin ? "w" : "l"]++; st[d.opp][usWin ? "l" : "w"]++;
        for (const [a, b] of s.rivalDays[gi] || []) {
          const aw = rnd() < pGame(a, b, true);
          st[aw ? a : b].w++; st[aw ? b : a].l++;
        }
      }
      out.wins.push(st[0].w);
      const order = seedOrder(st, ratings.map((r) => r + rnd() * 1e-6));
      const seed = order.indexOf(0);
      out.seed[seed]++;
      if (seed >= LEAGUE.playoffTeams) continue;
      out.playoffs++;
      const opp = order[[3, 2, 1, 0][seed]];
      if (!series(pGame(0, opp, seed < order.indexOf(opp)), 5, 0, 0, rnd)) continue;
      out.final++;
      const others = order.slice(0, 4).filter((t) => t !== 0 && t !== opp);
      const other = rnd() < pGame(others[0], others[1], true) ? others[0] : others[1];
      if (series(pGame(0, other, true), 7, 0, 0, rnd)) out.cup++;
    }
    out.wins.sort((a, b) => a - b);
  }
  const q = (f) => out.wins[Math.min(out.wins.length - 1, Math.floor(f * out.wins.length))];
  return {
    playoffPct: out.playoffs / runs, finalPct: out.final / runs, cupPct: out.cup / runs,
    winsP10: out.wins.length ? q(0.1) : null, winsP50: out.wins.length ? q(0.5) : null, winsP90: out.wins.length ? q(0.9) : null,
    seedPct: out.seed.map((n) => n / runs),
  };
}

// Season-end money and fans at the current pace
export function paceProjection(s) {
  const rows = seasonRows(s.hist, s.year).filter((r) => !r.po);
  const left = s.phase === "regular" ? LEAGUE.seasonGames - s.gameIndex : 0;
  const recent = rows.slice(-20);
  // operating money per game (income minus payroll), before anything you buy
  const net = recent.length ? recent.reduce((n, r) => n + r.gate + r.win + r.merch + r.tv + r.post + r.pay, 0) / recent.length : 0;
  const fansPer = recent.length >= 2 ? (recent[recent.length - 1].fans - recent[0].fans) / (recent.length - 1) : 0;
  return { left, netPerGame: net, cash: s.money + net * left, fans: s.fans + fansPer * left, seasonNet: ledgerNet(s.ledger.season) };
}

// ── Records & milestones ──
const MILESTONES = { hr: [10, 25, 50, 100, 150, 200, 300, 500], h: [50, 100, 250, 500, 1000, 1500, 2000], rbi: [50, 100, 250, 500, 1000], kP: [50, 100, 250, 500, 1000, 2000] };
const MS_LABEL = { hr: "career home runs", h: "career hits", rbi: "career RBI", kP: "career strikeouts" };
export function milestones(s, careerOf) {
  const out = [];
  for (const p of allPlayers(s)) {
    const c = careerOf(s, p.id);
    for (const k in MILESTONES) {
      const v = c[k] || 0;
      if (!v) continue;
      const next = MILESTONES[k].find((m) => m > v);
      if (next && next - v <= Math.max(5, next * 0.15)) out.push({ p, key: k, label: MS_LABEL[k], v, next, left: next - v });
    }
  }
  return out.sort((a, b) => a.left / a.next - b.left / b.next).slice(0, 8);
}

export function careerLeaders(s, careerOf) {
  const people = allPlayers(s).map((p) => ({ p, c: careerOf(s, p.id) }));
  const top = (k, filter = () => true) => {
    const list = people.filter((x) => filter(x.c) && (x.c[k] || 0) > 0).sort((a, b) => b.c[k] - a.c[k]);
    return list[0] ? { p: list[0].p, v: list[0].c[k] } : null;
  };
  return [
    ["Hits", top("h")], ["Home runs", top("hr")], ["RBI", top("rbi")], ["Runs", top("r")],
    ["Walks", top("bb")], ["Strikeouts (P)", top("kP")],
  ];
}
