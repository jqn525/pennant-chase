// ── Automation: spend optimally, and standing orders that run after each game ──
// Pure. Built on advisor.options() and the franchise actions, so every automated
// purchase goes through the same rules and the same ledger as a manual one.
//
// Rule shapes (stored on s.rules, run top to bottom):
//   { id, type: "auto",    payback }            buy anything that pays back within N games
//   { id, type: "build",   track, when, n }     build the next tier of a track once fans|cash ≥ n
//   { id, type: "train",   pid, ovr }           train a player until his overall reaches N
//   { id, type: "reserve", n }                  never let automation drop cash below $n
// One-shot rules (build, train) are marked done when they finish.

import { options, apply } from "./advisor.js";
import { ovr } from "./gear.js";
import { allPlayers, trainCost, trainCeil, train, build, buildLock, trackLevel, BALLPARK, pushLog } from "./franchise.js";

const fmt = (n) => Math.round(n).toLocaleString("en-US");
export const RULE_TYPES = ["auto", "build", "train", "reserve"];

// The cash floor every automated spend respects
export const reserveOf = (s) => Math.max(0, ...(s.rules || []).filter((r) => r.type === "reserve" && !r.off).map((r) => r.n || 0));

// Greedy by payback: keep buying the best-paying affordable option until the
// budget, the reserve or the list runs out. Returns a receipt.
export function spendOptimally(s, { budget = Infinity, reserve = reserveOf(s), maxPayback = Infinity, log = true } = {}) {
  const receipt = { items: [], spent: 0, gainPerGame: 0 };
  const skip = new Set();
  for (let guard = 0; guard < 400; guard++) {
    const o = options(s).find((x) =>
      !skip.has(x.id) && x.affordable && x.gainPerGame > 0 && Number.isFinite(x.payback) && x.payback <= maxPayback &&
      receipt.spent + x.cost <= budget && s.money - x.cost >= reserve);
    if (!o) break;
    const before = s.money;
    if (apply(s, o) === false || s.money >= before) { skip.add(o.id); continue; }
    const cost = before - s.money;
    receipt.spent += cost;
    receipt.gainPerGame += o.gainPerGame;
    const last = receipt.items.find((i) => i.id === o.id);
    if (last && o.kind === "Train") { last.count++; last.cost += cost; last.gainPerGame += o.gainPerGame; }
    else receipt.items.push({ id: o.id, kind: o.kind, title: o.title, cost, gainPerGame: o.gainPerGame, count: 1 });
  }
  if (log && receipt.items.length) {
    pushLog(s, `Spent $${fmt(receipt.spent)} on ${receipt.items.length} buy${receipt.items.length === 1 ? "" : "s"}, +$${fmt(receipt.gainPerGame)}/game.`, "rule");
  }
  return receipt;
}

// Train the cheapest overall-counting point, one at a time, until he reaches the target
const OVR_KEYS = { bat: ["contact", "power", "eye", "speed", "defense"], pit: ["stuff", "control", "stamina"] };
function trainTo(s, r, reserve) {
  const find = () => allPlayers(s).find((x) => x.id === r.pid);
  let p = find(), points = 0, spent = 0;
  if (!p) return { done: true, points, spent };
  for (let guard = 0; guard < 200 && ovr(p) < r.ovr; guard++) {
    let best = null;
    for (const k of OVR_KEYS[p.role === "bat" ? "bat" : "pit"]) {
      if (p[k] >= trainCeil(s, p, k)) continue;
      const c = trainCost(s, p, k);
      if (!best || c < best.c) best = { k, c };
    }
    if (!best) return { done: true, points, spent, maxed: true };
    if (s.money - best.c < reserve) break;
    const before = s.money;
    if (!train(s, p.id, best.k, 1)) break;
    points++; spent += before - s.money;
    p = find();
  }
  return { done: ovr(p) >= r.ovr, points, spent, name: p.name };
}

// Run every active rule once, in order. Returns what fired.
export function runRules(s) {
  if (!s.roster || !s.rules?.length) return [];
  const reserve = reserveOf(s);
  const fired = [];
  for (const r of s.rules) {
    if (r.off || r.done) continue;
    if (r.type === "auto") {
      const rc = spendOptimally(s, { reserve, maxPayback: r.payback, log: false });
      if (rc.items.length) {
        fired.push({ id: r.id, text: `Auto-buy: $${fmt(rc.spent)} on ${rc.items.map((i) => i.title).join("; ")}` });
      }
    } else if (r.type === "build") {
      const met = r.when === "cash" ? s.money >= r.n : s.fans >= r.n;
      const track = BALLPARK.find((t) => t.id === r.track);
      const next = track?.tiers[trackLevel(s, r.track)];
      if (!next) { r.done = true; continue; }
      if (!met || buildLock(s, r.track) || s.money - next.cost < reserve) continue;
      if (build(s, r.track)) { r.done = true; fired.push({ id: r.id, text: `Rule built ${next.name}.` }); }
    } else if (r.type === "train") {
      const out = trainTo(s, r, reserve);
      if (out.points) fired.push({ id: r.id, text: `Rule trained ${out.name} ${out.points} pt${out.points === 1 ? "" : "s"} for $${fmt(out.spent)}.` });
      if (out.done) r.done = true;
    }
  }
  for (const f of fired) pushLog(s, f.text, "rule");
  return fired;
}

// ── Editing the rule list (actions for act()) ──
export function addRule(s, rule) {
  if (!RULE_TYPES.includes(rule?.type)) return false;
  s.rules = [...(s.rules || []), { ...rule, id: `r${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}` }];
  return true;
}
export function removeRule(s, id) { s.rules = s.rules.filter((r) => r.id !== id); }
export function toggleRule(s, id) { s.rules = s.rules.map((r) => (r.id === id ? { ...r, off: !r.off } : r)); }
export function moveRule(s, id, dir) {
  const a = [...s.rules], i = a.findIndex((r) => r.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]];
  s.rules = a;
}

// Plain-English description of a rule
export function describeRule(s, r) {
  if (r.type === "auto") return `Buy anything that pays back within ${r.payback} games`;
  if (r.type === "reserve") return `Keep at least $${fmt(r.n)} in the bank`;
  if (r.type === "build") {
    const t = BALLPARK.find((x) => x.id === r.track);
    return `Build the next ${t ? t.title.toLowerCase() : r.track} tier when ${r.when === "cash" ? `cash ≥ $${fmt(r.n)}` : `fans ≥ ${fmt(r.n)}`}`;
  }
  if (r.type === "train") {
    const p = allPlayers(s).find((x) => x.id === r.pid);
    return `Train ${p ? p.name : "a departed player"} to ${r.ovr} overall`;
  }
  return r.type;
}
