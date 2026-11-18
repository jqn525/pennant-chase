// ── Staff on auto: coaches fill idle lanes, the equipment manager buys gear ──
// After each game a share of that game's operating result goes into an
// allowance for gear. Coaches with auto on start a random program in their
// area whenever a lane is free; the equipment manager (autoDev.on) now and then
// buys a random piece. Cash never drops below the reserve.

import { gearGain } from "./advisor.js";
import { pushLog, allPlayers, trainCost, buyGear } from "./franchise.js";
import { GEAR } from "./gear.js";
import { isOpen } from "./unlocks.js";
import { installments } from "./construction.js";
import { programInstallments, AREA_IDS, areaKeys, freeLane, startLock, gamesFor, startProgram } from "./training.js";

export const AUTO_KINDS = ["Train", "Gear"];
export const SHARES = [0.2, 0.4, 0.6, 0.8, 1];
export const ALLOWANCE_GAMES = 30;
const OPERATING = ["gate", "winBonus", "merch", "tv", "postseason", "payroll", "coaching"];
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

// Staff on auto don't shop for value: a coach takes whoever is free in his area,
// the equipment manager grabs whatever catches his eye. Good deals and bad ones
// happen; the smart buys are yours to make.
const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];
export const GEAR_CHANCE = 0.35; // the equipment manager shops after about one game in three
export function runAutoDev(s, { log = true, rnd = Math.random, force = false } = {}) {
  const a = s.autoDev;
  if (!a || !s.roster || s.phase === "draft") return null;
  const out = { points: 0, gear: [], spent: 0 };
  const floor = () => a.reserve + installments(s) + programInstallments(s);
  // coaches: each free lane gets a random player and a random stat with room
  for (const area of AREA_IDS) {
    if (!s.training?.auto?.[area]) continue;
    for (let guard = 0; guard < 6 && freeLane(s, area) >= 0; guard++) {
      const pool = allPlayers(s).flatMap((p) => areaKeys(p, area).filter((k) => !startLock(s, p.id, k)).map((k) => [p, k]));
      if (!pool.length) break;
      const [p, k] = pick(pool, rnd);
      const perGame = Math.ceil(trainCost(s, p, k) / gamesFor(s, p, k));
      if (s.money - perGame < floor()) break;
      if (!startProgram(s, p.id, k, { auto: true })) break;
      out.spent += trainCost(s, p, k);
      out.points++;
    }
  }
  // equipment manager: now and then, a random piece for a random player who can wear it
  if (a.on && isOpen(s, "gear") && (force || rnd() < GEAR_CHANCE)) {
    const items = (s.shopItems || []).filter((i) => i.cost <= a.allowance && s.money - i.cost >= floor());
    const item = items.length ? pick(items, rnd) : null;
    const def = item && GEAR.find((d) => d.slot === item.slot);
    // he won't swap a better piece for a worse one, but he doesn't look for the best fit either
    const fits = def ? allPlayers(s).filter((p) => (p.role === "bat") === (def.role === "bat") && gearGain(p, item) > 0) : [];
    if (fits.length) {
      const p = pick(fits, rnd);
      const before = s.money, n = s.hist?.spend.length ?? 0;
      if (buyGear(s, p.id, item.id)) {
        const cost = before - s.money;
        a.allowance = Math.max(0, a.allowance - cost);
        out.spent += cost;
        const ev = s.hist?.spend[s.hist.spend.length - 1];
        if (ev && s.hist.spend.length > n) ev.auto = true;
        out.gear.push(`${item.name} for ${p.name}`);
      }
    }
  }
  if (log && out.spent > 0) {
    const parts = [];
    if (out.points) parts.push(`${out.points} training program${out.points === 1 ? "" : "s"} started`);
    if (out.gear.length) parts.push(out.gear.join(", "));
    pushLog(s, `Staff on auto: ${parts.join("; ")}.`, "rule");
  }
  return out;
}

// After each finished game
export function afterGame(s) {
  if (!s.autoDev || !isOpen(s, "autodev")) return null;
  earnAllowance(s);
  const coaching = Object.values(s.training?.auto || {}).some(Boolean);
  return s.autoDev.on || coaching ? runAutoDev(s) : null;
}

// Actions for act()
export function setAutoDev(s, patch) { s.autoDev = { ...s.autoDev, ...patch }; }
export function developNow(s) { return runAutoDev(s, { force: true }); }
