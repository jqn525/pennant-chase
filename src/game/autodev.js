// ── Auto-develop: training and gear buy themselves; builds and prints never do ──
// After each game a share of that game's operating result goes into an
// allowance. The allowance buys the best-payback training points and gear
// pieces across the roster, never dropping cash below the reserve. Every buy
// goes through the advisor's apply(), so it lands in the ledger and history
// exactly like a manual one.

import { options, apply } from "./advisor.js";
import { pushLog } from "./franchise.js";

export const AUTO_KINDS = ["Train", "Gear"];
export const SHARES = [0.2, 0.4, 0.6, 0.8, 1];
export const ALLOWANCE_GAMES = 30;
const OPERATING = ["gate", "winBonus", "merch", "tv", "postseason", "payroll"];
const fmt = (n) => Math.round(n).toLocaleString("en-US");

export const operatingResult = (led) => OPERATING.reduce((t, k) => t + (led?.[k] || 0), 0);

// Bank this game's share. Capped so a long stretch with auto-develop off can't snowball.
export function earnAllowance(s) {
  const a = s.autoDev;
  if (!a) return 0;
  const add = Math.max(0, operatingResult(s.ledger.game)) * a.share;
  a.avg = a.avg ? a.avg * 0.9 + add * 0.1 : add;
  a.allowance = Math.min(a.allowance + add, Math.max(add, a.avg) * ALLOWANCE_GAMES);
  return add;
}

// Spend the allowance: best payback first, training and gear only
export function runAutoDev(s, { log = true } = {}) {
  const a = s.autoDev;
  if (!a || !s.roster) return null;
  const out = { points: 0, gear: [], spent: 0 };
  const skip = new Set();
  for (let guard = 0; guard < 300; guard++) {
    const o = options(s).find((x) =>
      AUTO_KINDS.includes(x.kind) && !skip.has(x.id) && x.affordable && x.gainPerGame > 0 && Number.isFinite(x.payback) &&
      x.cost <= a.allowance && s.money - x.cost >= a.reserve);
    if (!o) break;
    const before = s.money, n = s.hist?.spend.length ?? 0;
    if (apply(s, o) === false || s.money >= before) { skip.add(o.id); continue; }
    const cost = before - s.money;
    a.allowance = Math.max(0, a.allowance - cost);
    out.spent += cost;
    const ev = s.hist?.spend[s.hist.spend.length - 1];
    if (ev && (s.hist.spend.length > n || ev.cat === "training")) ev.auto = true;
    if (o.kind === "Train") out.points++;
    else out.gear.push(o.title.replace(" → ", " for "));
  }
  if (log && out.spent > 0) {
    const parts = [];
    if (out.points) parts.push(`${out.points} training point${out.points === 1 ? "" : "s"}`);
    if (out.gear.length) parts.push(out.gear.join(", "));
    pushLog(s, `Auto-develop: ${parts.join("; ")} for $${fmt(out.spent)}.`, "rule");
  }
  return out;
}

// After each finished game
export function afterGame(s) {
  if (!s.autoDev) return null;
  earnAllowance(s);
  return s.autoDev.on ? runAutoDev(s) : null;
}

// Actions for act()
export function setAutoDev(s, patch) { s.autoDev = { ...s.autoDev, ...patch }; }
export function developNow(s) { return runAutoDev(s); }
