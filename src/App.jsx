// ── PENNANT CHASE v3 ── infinite auto-playing baseball franchise sim
// Eight clubs, 154-game seasons, playoffs, the Pennant Cup — forever.
// The games play themselves; you are the GM. This component owns all state;
// the pure simulation lives in src/game/ and the screens in src/ui/.

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { C, LEAGUE, ECON, TRADE, BAT_STATS, PIT_STATS, STADIUM, stadiumFx, REVENUE, revenueFx, SALARY } from "./game/constants.js";
import { fmt } from "./game/utils.js";
import { genRoster, seedUid, genDraftClass, vetPot, rollPot, pickTrait, freshName, seedNames } from "./game/generators.js";
import { newGame, stepAtBat, playGameInstant, settleGame, ticketGate } from "./game/engine.js";
import { makeRivals, makeSchedule, teamRating, quickSim, simSeries, seedOrder, runOffseason, ageRoster, seriesInfo } from "./game/season.js";
import { eff, isStar, talentGrade, genShipment, genItem, playerValue, GEAR, dealerTier, shipmentWeights, TIER_INFO } from "./game/gear.js";
import { sfx, play } from "./game/sfx.js";
import { SAVE_KEY, parseSave, decodeBackup, encodeBackup } from "./game/save.js";
import { teamPayroll, luxuryTax } from "./game/salary.js";
import TabBar from "./ui/TabBar.jsx";
import TipModal from "./ui/TipModal.jsx";
import DraftBoard from "./ui/DraftBoard.jsx";
import PlayerCard from "./ui/PlayerCard.jsx";
import { globalCss } from "./ui/styles.js";
import Scoreboard from "./ui/Scoreboard.jsx";
import CitySelect from "./ui/CitySelect.jsx";
import Rulebook from "./ui/Rulebook.jsx";
import BallparkTab from "./ui/BallparkTab.jsx";
import RosterTab from "./ui/RosterTab.jsx";
import ShopTab from "./ui/ShopTab.jsx";
import FrontOfficeTab from "./ui/FrontOfficeTab.jsx";
import Settings from "./ui/Settings.jsx";

// Older saves start their all-time ledger with what history can reconstruct
const seedAllTime = () => {
  if (!SAVED?.city) return {};
  let w = SAVED.standings?.[0]?.w || 0, l = SAVED.standings?.[0]?.l || 0;
  for (const h of SAVED.history || []) {
    const [hw, hl] = (h.playerRecord || "0-0").split("-").map(Number);
    w += hw || 0; l += hl || 0;
  }
  return { w, l, g: w + l };
};

const EMPTY_STAT = { ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, k: 0, r: 0, rbi: 0, outsP: 0, kP: 0, bbP: 0, hP: 0, raP: 0 };

const FENCE = { corner: LEAGUE.fenceCorner, center: LEAGUE.fenceCenter };

// Jersey sales per second. Fans scale gently (^0.35) so big markets don't
// break the economy; store and media tiers multiply on top.
const merchRate = (fansN, stars, merchMult, tvMult, merchCity) =>
  0.03 * Math.pow(fansN, 0.35) * (1 + 0.3 * stars) * merchMult * tvMult * (merchCity ? 1.3 : 1);

// Away selling tapers: the first hour runs at full speed, the rest at 15%.
const awaySeconds = (ms) => {
  const s = ms / 1000;
  return Math.min(s, 3600) + Math.max(0, s - 3600) * 0.15;
};

// Older saves stored merch/tv as booleans; true = tier 1 (same effect then and now)
const lvlOf = (v) => (typeof v === "number" ? v : v ? 1 : 0);

// Home patterns for playoff series (1 = higher seed hosts)
const HOME_BO5 = [1, 1, 0, 0, 1];
const HOME_BO7 = [1, 1, 0, 0, 0, 1, 1];

// ── Save (v3) ──
const LOADED = (() => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { value: null, error: null };
    const parsed = parseSave(raw);
    return parsed.ok ? { value: parsed.value, error: null } : { value: null, error: parsed.error };
  } catch { return { value: null, error: "Saving is unavailable in this browser." }; }
})();
const SAVED = LOADED.value;
if (SAVED?.roster) {
  const everyone = [
    SAVED.roster.batters, [SAVED.roster.sp, SAVED.roster.rp],
    ...(SAVED.rivals || []).map((r) => [...r.batters, r.sp]),
  ].flat();
  seedUid(Math.max(...everyone.map((p) => p.id)) + 1);

  // Migrate older saves: backfill potentials + traits, convert tier gear to items
  const oldScale = SAVED.scale !== 100;
  const toNew = (v) => Math.min(LEAGUE.statCap, v * 4 + 41); // old 1-14 scale -> 0-100 (avg 6 -> 65), capped
  const upgrade = (p, withPot) => {
    const keys = p.role === "bat" ? BAT_STATS : PIT_STATS;
    if (oldScale) {
      for (const k of keys) p[k] = toNew(p[k]);
      if (p.pot) for (const k of keys) p.pot[k] = toNew(p.pot[k]);
      if (p.signCost) p.signCost = Math.round(p.signCost); // draft rookies keep price
    }
    if (withPot && !p.pot) p.pot = rollPot(p, keys);
    if (!p.trait) p.trait = pickTrait(p.role === "bat" ? "bat" : "pit");
    if (p.gear) for (const def of GEAR) {
      const item = p.gear[def.slot];
      if (typeof item === "number") {
        p.gear[def.slot] = { id: `legacy-${p.id}-${def.slot}`, slot: def.slot, rarity: item, name: `Old Faithful ${def.label}`, boosts: { [def.stat]: item * 5 }, cost: 0 };
      } else if (oldScale && item?.boosts) {
        // flat point boosts become percentages: +1/+2/+3 -> 5/10/15%, ±1 secondary -> ±4%
        for (const st in item.boosts) {
          const n = item.boosts[st];
          item.boosts[st] = Math.abs(n) >= 4 ? n : n > 0 ? n * 5 : n === -1 ? -4 : n * 5;
        }
      }
    }
  };
  [...SAVED.roster.batters, SAVED.roster.sp, SAVED.roster.rp].forEach((p) => upgrade(p, true));
  (SAVED.rivals || []).forEach((r) => [...r.batters, r.sp].forEach((p) => upgrade(p, false)));
  (SAVED.draftClass || []).forEach((p) => upgrade(p, true));

  // One-time league-wide rename with the expanded, duplicate-free name pool
  const allSaved = [
    ...SAVED.roster.batters, SAVED.roster.sp, SAVED.roster.rp,
    ...(SAVED.rivals || []).flatMap((r) => [...r.batters, r.sp]),
    ...(SAVED.draftClass || []),
  ];
  if (SAVED.names !== 2) {
    allSaved.forEach((p) => { p.name = freshName(); });
  } else {
    seedNames(allSaved.map((p) => p.name));
  }
  if (oldScale && SAVED.shopItems) {
    for (const item of SAVED.shopItems) {
      for (const st in item.boosts) {
        const n = item.boosts[st];
        item.boosts[st] = n > 0 && n <= 3 ? n * 5 : n === -1 ? -4 : n;
      }
    }
  }

  // One-time big-league rescale: fans ×50 and money ×5 onto the new economy,
  // with in-flight prices (rookies, shop shelves) bumped to match. Stadium and
  // revenue tier levels carry over as-is — the tables grew around them.
  if (SAVED.econ !== 2) {
    SAVED.fans = Math.round(SAVED.fans * 50);
    SAVED.money = Math.round(SAVED.money * 5);
    (SAVED.draftClass || []).forEach((p) => { if (p.signCost) p.signCost = Math.round(p.signCost * 1.75); });
    (SAVED.shopItems || []).forEach((i) => { i.cost = Math.round(i.cost * 5 / 3); });
    if (SAVED.allTime) for (const k of ["earned", "spent"]) {
      if (SAVED.allTime[k]) SAVED.allTime[k] = Math.round(SAVED.allTime[k] * 5);
    }
    if (SAVED.liveGame) SAVED.liveGame.gatePaid = 0;
  }
}

export default function App() {
  // ── Franchise state (all autosaved) ──
  const [city, setCity] = useState(SAVED?.city ?? null);
  const [money, setMoney] = useState(SAVED?.money ?? ECON.startMoney);
  const [fans, setFans] = useState(SAVED?.fans ?? ECON.startFans);
  const [roster, setRoster] = useState(SAVED?.roster ?? null);
  const [merch, setMerch] = useState(lvlOf(SAVED?.merch));
  const [stadium, setStadium] = useState(SAVED?.stadium ?? { parking: 0, seats: 0, conc: 0, lights: 0 });
  const [tv, setTv] = useState(lvlOf(SAVED?.tv));
  const [seasonStats, setSeasonStats] = useState(SAVED?.seasonStats ?? {});
  const [shopItems, setShopItems] = useState(SAVED?.shopItems ?? genShipment()); // current shipment
  const [draftClass, setDraftClass] = useState(SAVED?.draftClass ?? null); // winter rookies awaiting signatures
  const [form, setForm] = useState(SAVED?.form ?? []);
  const [year, setYear] = useState(SAVED?.year ?? 1);
  const [phase, setPhase] = useState(SAVED?.phase ?? "regular");
  const [rivals, setRivals] = useState(SAVED?.rivals ?? null);
  const [schedule, setSchedule] = useState(SAVED?.schedule ?? null);
  const [rivalDays, setRivalDays] = useState(SAVED?.rivalDays ?? null);
  const [gameIndex, setGameIndex] = useState(SAVED?.gameIndex ?? 0);
  const [standings, setStandings] = useState(SAVED?.standings ?? Array.from({ length: 8 }, () => ({ w: 0, l: 0 })));
  const [playoffs, setPlayoffs] = useState(SAVED?.playoffs ?? null);
  const [history, setHistory] = useState(SAVED?.history ?? []);
  const [trophies, setTrophies] = useState(SAVED?.trophies ?? 0);
  const [allTime, setAllTime] = useState(SAVED?.allTime ?? seedAllTime());
  const [capYears, setCapYears] = useState(SAVED?.capYears ?? 0); // consecutive winters over the cap
  const addAT = useCallback((patch) => setAllTime((a) => {
    const next = { ...a };
    for (const k in patch) next[k] = (next[k] || 0) + patch[k];
    return next;
  }), []);
  // MAX speed is earned with the first Pennant Cup — clamp saves that predate the gate
  const [speed, setSpeed] = useState(SAVED?.speed === "max" && !(SAVED?.trophies > 0) ? 4 : SAVED?.speed ?? 1);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(SAVED?.sound ?? true);
  const [saveError, setSaveError] = useState(LOADED.error);
  sfx.enabled = sound;
  const [seenTips, setSeenTips] = useState(SAVED?.seenTips ?? (SAVED ? ["welcome"] : []));
  const [activeTip, setActiveTip] = useState(null);
  const showTip = (id) => setSeenTips((seen) => {
    if (!seen.includes(id)) setActiveTip(id);
    return seen;
  });
  const closeTip = () => {
    setSeenTips((seen) => (activeTip && !seen.includes(activeTip) ? [...seen, activeTip] : seen));
    setActiveTip(null);
  };

  // ── UI state ──
  const [cardId, setCardId] = useState(null); // player card pop-up
  const [log, setLog] = useState([]);
  const [tab, setTab] = useState("game");
  const [menu, setMenu] = useState(null); // null | "settings" | "rules"
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);

  const idRef = useRef(1);
  const gameRef = useRef(SAVED?.liveGame ?? null);
  const ctxRef = useRef(SAVED?.liveContext ?? null);
  const restRef = useRef(0);      // beat between games at watchable speeds

  // Fresh-state mirror so interval callbacks never read stale closures
  const S = useRef({});
  S.current = { city, money, fans, roster, merch, tv, stadium, seasonStats, shopItems, draftClass, form, year, phase, rivals, schedule, rivalDays, gameIndex, standings, playoffs, history, trophies, allTime, capYears, speed, sound, seenTips };

  const cityBonus = (k) => (city?.bonus === k);
  const tn = (c) => (c?.nickname ?? c?.name ?? ""); // team display name

  const pushLog = useCallback((text, kind = "play", side = null, team = null) => {
    setLog((l) => [{ id: idRef.current++, text, kind, side, team }, ...l].slice(0, 40));
  }, []);

  // ── Save: single writer, called by the autosave effect and a 20s heartbeat ──
  const saveData = useCallback(() => {
    const s = S.current;
    if (!s.city) return null;
    return {
      version: 3, scale: 100, names: 2, econ: 2, lastSeen: Date.now(),
      city: s.city, money: s.money, fans: s.fans, roster: s.roster, merch: s.merch, tv: s.tv, stadium: s.stadium,
      seasonStats: s.seasonStats, shopItems: s.shopItems, draftClass: s.draftClass, form: s.form,
      year: s.year, phase: s.phase, rivals: s.rivals, schedule: s.schedule, rivalDays: s.rivalDays,
      gameIndex: s.gameIndex, standings: s.standings, playoffs: s.playoffs,
      history: s.history, trophies: s.trophies, allTime: s.allTime, capYears: s.capYears, speed: s.speed, sound: s.sound, seenTips: s.seenTips,
      liveGame: gameRef.current, liveContext: ctxRef.current,
    };
  }, []);
  const saveNow = useCallback(() => {
    const data = saveData();
    if (!data) return false;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      setSaveError(null);
      return true;
    } catch {
      setSaveError("Your game is running, but this browser couldn't save it. Copy a backup code and check storage permissions.");
      return false;
    }
  }, [saveData]);
  useEffect(() => { saveNow(); }, [city, money, fans, roster, merch, tv, stadium, seasonStats, shopItems, draftClass, form, year, phase, rivals, schedule, rivalDays, gameIndex, standings, playoffs, history, trophies, allTime, capYears, speed, sound, seenTips, saveNow]);
  useEffect(() => {
    const iv = setInterval(() => { if (!document.hidden) saveNow(); }, 20000);
    return () => clearInterval(iv);
  }, [saveNow]);

  // ── While-you-were-away pay (merch only, capped) ──
  const welcomed = useRef(false);
  useEffect(() => {
    if (welcomed.current || !SAVED?.city) return;
    welcomed.current = true;
    const fx = revenueFx(lvlOf(SAVED.merch), lvlOf(SAVED.tv));
    const elapsed = Math.min(Math.max(0, Date.now() - (SAVED.lastSeen || Date.now())), fx.offlineHours * 3600e3);
    if (fx.merchMult && elapsed > 60e3) {
      const all = [...SAVED.roster.batters, SAVED.roster.sp, SAVED.roster.rp];
      const stars = all.filter(isStar).length;
      // No media money overnight — the store alone sells, tapering after the first hour
      const gain = merchRate(SAVED.fans, stars, fx.merchMult, 1, SAVED.city.bonus === "merch") * awaySeconds(elapsed) * ECON.offlineRate;
      setMoney((m) => m + gain);
      addAT({ earned: gain });
      const h = Math.floor(elapsed / 3600e3), min = Math.floor((elapsed % 3600e3) / 60e3);
      pushLog(`While you were away (${h}h ${min}m), the store sold $${fmt(gain)} in jerseys.${elapsed >= fx.offlineHours * 3600e3 - 1000 ? ` (${fx.offlineHours}h cap)` : ""}`, "win");
    } else {
      pushLog(`Welcome back. Your ${SAVED.city.name} club picks up right where it left off — Year ${SAVED.year}.`, "sys");
    }
  }, [pushLog]);

  // ── Founding ──
  const foundClub = (c) => {
    const r = genRoster(LEAGUE.statBase);
    const rv = makeRivals(LEAGUE.statBase, { tCity: c.name, name: c.nickname });
    const sch = makeSchedule();
    setCity(c); setRoster(r); setRivals(rv);
    setSchedule(sch.schedule); setRivalDays(sch.rivalDays);
    pushLog(`The ${c.name} ${c.nickname} join ${LEAGUE.name}. ${c.label}.`, "win");
    pushLog(`Eight clubs. ${LEAGUE.seasonGames} games. Top four make the playoffs. The Pennant Cup waits.`, "sys");
    showTip("welcome");
  };

  // ── Economy tick (merch / TV passive income while watching) ──
  useEffect(() => {
    if (!merch || !roster) return;
    const iv = setInterval(() => {
      if (document.hidden) return;
      const stars = [...roster.batters, roster.sp, roster.rp].filter(isStar).length;
      const fx = revenueFx(merch, tv);
      const gain = merchRate(fans, stars, fx.merchMult, fx.tvMult, cityBonus("merch"));
      setMoney((m) => m + gain);
      addAT({ earned: gain });
    }, 1000);
    return () => clearInterval(iv);
  }, [merch, tv, fans, roster, city]);

  // ── Season stat flush (batched deltas from the engine) ──
  const flushStats = (g) => {
    const accs = g.statAcc;
    if (!Object.keys(accs).length) return;
    g.statAcc = {};
    const sum = {};
    for (const pid in accs) for (const k in accs[pid]) sum[k] = (sum[k] || 0) + accs[pid][k];
    addAT(sum);
    setSeasonStats((s) => {
      const next = { ...s };
      for (const pid in accs) {
        const cur = { ...(next[pid] || EMPTY_STAT) };
        for (const k in accs[pid]) cur[k] += accs[pid][k];
        next[pid] = cur;
      }
      return next;
    });
  };

  const ratingsNow = () => {
    const s = S.current;
    return [teamRating({ batters: s.roster.batters, sp: s.roster.sp }), ...s.rivals.map(teamRating)];
  };

  // ── Start the next game (regular schedule or playoff series) ──
  const startNextGame = () => {
    const s = S.current;
    let oppIdx, home, label;
    if (s.phase === "playoffs") {
      const p = s.playoffs;
      const bestOf = p.round === "semi" ? HOME_BO5 : HOME_BO7;
      const higherSeedHome = bestOf[p.gameNo] === 1;
      home = p.weAreHigherSeed ? higherSeedHome : !higherSeedHome;
      oppIdx = p.opp;
      label = `${p.round === "semi" ? "SEMIFINAL" : "PENNANT CUP"} GAME ${p.gameNo + 1} — series ${p.wins.us}-${p.wins.them}`;
    } else {
      const d = s.schedule[s.gameIndex];
      oppIdx = d.opp; home = d.home;
      label = `GAME ${s.gameIndex + 1} of ${LEAGUE.seasonGames}`;
    }
    const opp = s.rivals[oppIdx - 1];
    gameRef.current = newGame(opp, home, oppIdx);
    ctxRef.current = {
      batters: s.roster.batters, sp: s.roster.sp, rp: s.roster.rp, opp,
      fence: FENCE, statBase: LEAGUE.statBase, innings: LEAGUE.innings, cityName: tn(s.city),
    };
    pushLog(`— ${label} — ${home ? `${opp.name} at ${tn(s.city)}` : `${tn(s.city)} at ${opp.name}`}.`, "sys");
  };

  // ── Settle a finished game into money/fans/standings/series ──
  const settle = (g) => {
    if (g.settled) return;
    g.settled = true;
    const s = S.current;
    const playoffLabel = s.phase === "playoffs" ? (s.playoffs.round === "semi" ? "SEMIS" : "CUP") : null;
    let streak = 0;
    for (let i = s.form.length - 1; i >= 0 && s.form[i] === "W"; i--) streak++;
    const res = settleGame(g, {
      fans: s.fans, gateBonus: cityBonus("gate"), floorBonus: cityBonus("floor"),
      fansBonus: cityBonus("fans"), cityName: tn(s.city), playoff: playoffLabel,
      formWins: s.form.filter((f) => f === "W").length, streak,
      ...stadiumFx(s.stadium),
    });
    // Payroll drips out one game at a time during the regular season.
    // Wages defer when the vault is empty — the bank never goes negative.
    const wage = s.phase === "regular" ? Math.round(teamPayroll(s.roster) / LEAGUE.seasonGames) : 0;
    setMoney((m) => Math.max(0, m + res.moneyDelta - wage));
    addAT({ g: 1, [res.won ? "w" : "l"]: 1, tickets: res.attendance, earned: res.moneyDelta, ...(wage ? { spent: wage } : {}) });
    if (res.fansDelta) setFans((f) => f + res.fansDelta);
    if (res.won && s.speed !== "max") play.cash();
    pushLog(res.text, res.kind);
    flushStats(g);
    setForm((f) => [...f, res.won ? "W" : "L"].slice(-10));

    if (s.phase === "regular") {
      const next = s.standings.map((t) => ({ ...t }));
      next[0][res.won ? "w" : "l"]++;
      next[g.oppIdx][res.won ? "l" : "w"]++;
      const ratings = ratingsNow();
      for (const [a, b] of s.rivalDays[s.gameIndex]) {
        const aWin = quickSim(ratings[a], ratings[b], true);
        next[aWin ? a : b].w++;
        next[aWin ? b : a].l++;
      }
      setStandings(next);
      setGameIndex(s.gameIndex + 1);
    } else {
      const p = { ...s.playoffs, wins: { ...s.playoffs.wins }, gameNo: s.playoffs.gameNo + 1 };
      res.won ? p.wins.us++ : p.wins.them++;
      setPlayoffs(p);
    }
  };

  // ── Phase transitions: the one function that moves the calendar ──
  const advance = () => {
    const s = S.current;
    if (!s.roster || !s.rivals || !s.schedule) return;

    if (s.phase === "draft") return; // the board is open — the league waits

    if (s.phase === "regular") {
      if (s.gameIndex >= LEAGUE.seasonGames) return enterPlayoffs();
      // fresh shipment at the shop whenever a new series begins
      if (s.gameIndex > 0) {
        const prev = s.schedule[s.gameIndex - 1], next = s.schedule[s.gameIndex];
        if (prev.opp !== next.opp || prev.home !== next.home) restock(false);
      }
      return startNextGame();
    }

    // playoffs
    const p = s.playoffs;
    if (!p) return; // transient state, next tick sorts it out
    const need = p.round === "semi" ? 3 : 4;
    if (p.wins.us < need && p.wins.them < need) return startNextGame();

    const ratings = ratingsNow();
    if (p.wins.us >= need && p.round === "semi") {
      setMoney((m) => m + ECON.semisSeriesPay);
      addAT({ earned: ECON.semisSeriesPay });
      const finalOppIdx = p.otherWinner;
      pushLog(`— SEMIFINAL WON ${p.wins.us}-${p.wins.them} — $${fmt(ECON.semisSeriesPay)} series bonus. The Pennant Cup final vs the ${s.rivals[finalOppIdx - 1].name} begins.`, "win");
      const order = seedOrder(s.standings, ratings);
      setPlayoffs({
        round: "final", opp: finalOppIdx, wins: { us: 0, them: 0 }, gameNo: 0,
        weAreHigherSeed: order.indexOf(0) < order.indexOf(finalOppIdx),
      });
      restock(false); // new round, new shelves
      return;
    }
    if (p.wins.us >= need && p.round === "final") {
      pushLog(`— PENNANT CUP CHAMPIONS — ${tn(s.city)} take the final ${p.wins.us}-${p.wins.them}. $${fmt(ECON.cupPay)} and the parade lasts three days.`, "win");
      if (s.trophies === 0) pushLog(`MAX SPEED UNLOCKED — champions set the pace.`, "win");
      play.fanfare();
      return offseason(0, true);
    }
    // we lost the series
    if (p.round === "semi") {
      pushLog(`— SEMIFINAL LOST ${p.wins.them}-${p.wins.us} — the season ends one round short.`, "out");
      const champIdx = simSeries(ratings[p.otherWinner], ratings[p.opp], 7) ? p.otherWinner : p.opp;
      return offseason(champIdx, false);
    }
    pushLog(`— PENNANT CUP LOST ${p.wins.them}-${p.wins.us} — so close. Next year.`, "out");
    return offseason(p.opp, false);
  };

  const enterPlayoffs = () => {
    const s = S.current;
    const ratings = ratingsNow();
    const order = seedOrder(s.standings, ratings);
    const mySeed = order.indexOf(0);
    const name = (i) => (i === 0 ? tn(s.city) : s.rivals[i - 1].name);
    pushLog(`— REGULAR SEASON COMPLETE — ${tn(s.city)} finish ${s.standings[0].w}-${s.standings[0].l}, ${["1st", "2nd", "3rd"][mySeed] || `${mySeed + 1}th`}.`, mySeed < LEAGUE.playoffTeams ? "win" : "out");

    if (mySeed < LEAGUE.playoffTeams) {
      const oppIdx = order[[3, 2, 1, 0][mySeed]];
      const others = order.slice(0, 4).filter((t) => t !== 0 && t !== oppIdx);
      const otherWinner = simSeries(ratings[others[0]], ratings[others[1]], 5) ? others[0] : others[1];
      pushLog(`Playoffs! Best-of-5 semifinal vs the ${name(oppIdx)}. In the other semi, the ${name(otherWinner)} advance.`, "sys");
      setPlayoffs({
        round: "semi", opp: oppIdx, wins: { us: 0, them: 0 }, gameNo: 0,
        otherWinner, weAreHigherSeed: mySeed < order.indexOf(oppIdx),
      });
      setPhase("playoffs");
      restock(false);
      showTip("playoffs");
    } else {
      const top = order.slice(0, 4);
      const w1 = simSeries(ratings[top[0]], ratings[top[3]], 5) ? top[0] : top[3];
      const w2 = simSeries(ratings[top[1]], ratings[top[2]], 5) ? top[1] : top[2];
      const champ = simSeries(ratings[w1], ratings[w2], 7) ? w1 : w2;
      pushLog(`No playoffs this year. The ${name(champ)} go on to take the Pennant Cup.`, "out");
      offseason(champ, false);
    }
  };

  // Which gear dealers take your calls? Prestige decides the rarity odds.
  const currentDealerTier = () => {
    const s = S.current;
    const playoffsEver = s.trophies > 0 || s.phase === "playoffs"
      || (s.history || []).some((h) => h.finish <= LEAGUE.playoffTeams);
    return dealerTier(s.trophies, playoffsEver);
  };

  // Fresh shelves at the shop. Mega = the winter catalog (rare & legendary only).
  const restock = (mega) => {
    const tier = currentDealerTier();
    const items = genShipment(6, shipmentWeights(tier, mega));
    // the very first winter catalog always dangles exactly one legendary --
    // a taste of what winning buys
    if (mega && S.current.year === 1 && !items.some((i) => i.rarity === 3)) {
      items[items.length - 1] = genItem(3);
    }
    setShopItems(items);
    const legendary = items.filter((i) => i.rarity === 3).map((i) => i.name);
    pushLog(`— NEW SHIPMENT at the Pro Shop${mega ? ": THE WINTER CATALOG" : ""} —${legendary.length ? ` including ${legendary.join(" and ")}!` : ""}`, "sys");
  };

  const offseason = (championIdx, playerCup) => {
    const s = S.current;
    const ratings = ratingsNow();
    const order = seedOrder(s.standings, ratings);
    const mySeed = order.indexOf(0);
    const off = runOffseason({
      year: s.year, rivals: s.rivals, standings: s.standings, ratings,
      championIdx, championName: championIdx === 0 ? tn(s.city) : s.rivals[championIdx - 1].name,
      playerSeed: mySeed, playerCup, seedOrder: order,
      record: { w: s.standings[0].w, l: s.standings[0].l },
      fans: s.fans, history: s.history, trophies: s.trophies,
    });
    if (playerCup) { setMoney((m) => m + ECON.cupPay); addAT({ earned: ECON.cupPay }); }

    // The luxury tax: the winter bill for a payroll above the cap,
    // escalating for every consecutive year the club stays over.
    const payroll = teamPayroll(s.roster);
    const { overage, tax } = luxuryTax(payroll, s.capYears + 1);
    if (overage > 0) {
      const nthYear = s.capYears + 1;
      const paid = Math.min(Math.round(s.money + (playerCup ? ECON.cupPay : 0)), tax);
      setCapYears(nthYear);
      setMoney((m) => Math.max(0, m - tax));
      addAT({ spent: paid });
      pushLog(`— LUXURY TAX — payroll $${fmt(payroll)} sits over the $${fmt(SALARY.cap)} cap. The league bills $${fmt(tax)}${nthYear > 1 ? ` (year ${nthYear} over — the rate climbs)` : ""}.${paid < tax ? " The vault couldn't cover it — the league seizes what's there." : ""}`, "out");
    } else if (s.capYears > 0) {
      setCapYears(0);
      pushLog(`Payroll back under the cap — the league's collectors move on.`, "sys");
    }
    if (payroll > SALARY.cap * 0.8) showTip("payroll");
    setFans((f) => Math.max(ECON.startFans, f + off.fansDelta));
    setRivals(off.rivals);
    setRoster((r) => ageRoster(r));
    setSchedule(off.schedule);
    setRivalDays(off.rivalDays);
    setGameIndex(0);
    setStandings(off.standings);
    setPlayoffs(null);
    setHistory(off.history);
    setTrophies(off.trophies);
    setSeasonStats({});
    setForm([]);
    setYear(off.year);
    gameRef.current = null;
    ctxRef.current = null;
    off.logs.forEach((l) => pushLog(l.text, l.kind));
    pushLog(`Winter takes its toll — every player loses a step. Train, shop, and reload.`, "sys");
    restock(true);
    // The draft board opens; the league waits for your signatures
    setDraftClass(genDraftClass(mySeed));
    setPhase("draft");
    pushLog(`— DRAFT DAY — this winter's rookie class is on the board at the Ballpark. The season waits for your signatures.`, "win");
    showTip("draft");
  };

  // ── One live at-bat (1x / 4x speeds) ──
  const liveStep = () => {
    const g = gameRef.current;
    const prevHalf = g.half, prevInning = g.inning;
    const ev = [];
    stepAtBat(g, ctxRef.current, ev);
    ev.forEach((e) => {
      pushLog(e.text, e.kind, e.side, e.team);
      if (e.kind === "hr") play.homer();
      else if (e.text.includes("boots it")) play.thud();
      else if (/laces|stand-up double|TRIPLE|drops in front/.test(e.text)) play.crack();
    });
    flushStats(g);
    // Turnstile money: each completed half-inning pays its slice of the ticket
    // gate as the game plays. settle() pays only what's left (gate − gatePaid),
    // so MAX speed (which never comes through here) can't double-pay.
    if (!g.over && (g.half !== prevHalf || g.inning !== prevInning)) {
      const s = S.current;
      const fx = stadiumFx(s.stadium);
      const { gate } = ticketGate({
        fans: s.fans, playoff: s.phase === "playoffs",
        formWins: s.form.filter((f) => f === "W").length,
        attCap: fx.attCap, rateBonus: fx.rateBonus,
        gateBonus: cityBonus("gate"), gateMult: fx.gateMult,
      });
      const drip = gate / (LEAGUE.innings * 2);
      g.gatePaid = (g.gatePaid || 0) + drip;
      setMoney((m) => m + drip);
      addAT({ earned: drip });
    }
    if (g.over) settle(g);
  };

  // ── Master loop: the game plays itself ──
  useEffect(() => {
    if (!city || paused) return;
    const period = speed === "max" ? 1000 : speed === 4 ? 220 : 900;
    const iv = setInterval(() => {
      if (document.hidden) return; // no progress while you're not watching
      const g = gameRef.current;
      if (speed === "max") {
        if (g && !g.over) { playGameInstant(g, ctxRef.current); settle(g); }
        else {
          advance();
          const g2 = gameRef.current;
          if (g2 && !g2.over) { playGameInstant(g2, ctxRef.current); settle(g2); }
        }
      } else {
        if (g && !g.over) liveStep();
        else if (restRef.current > 0) restRef.current--;
        else { advance(); restRef.current = 2; }
      }
      rerender();
    }, period);
    return () => clearInterval(iv);
  }, [city, paused, speed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── GM actions (all apply from the NEXT game — the live game uses a snapshot) ──
  const trainCost = (p, key) => {
    let c = ECON.trainBase * Math.pow(1.5, (p[key] - 41) / 4);
    if (cityBonus("train")) c *= 0.85;
    return Math.ceil(c);
  };
  const train = (pid, key) => {
    setRoster((r) => {
      const all = [...r.batters, r.sp, r.rp];
      const p = all.find((x) => x.id === pid);
      const cost = trainCost(p, key);
      if (money < cost) return r;
      if (p[key] >= (p.pot?.[key] ?? Infinity)) return r; // peaked — nothing left to teach
      setMoney((m) => m - cost);
      addAT({ spent: cost, train: 1 });
      play.click();
      const upd = (o) => (o.id === pid ? { ...o, [key]: o[key] + 1 } : o);
      return { batters: r.batters.map(upd), sp: upd(r.sp), rp: upd(r.rp) };
    });
  };

  // Bulk training: buy point after point, cheapest first, until ceilings or
  // the budget stop it. Returns {points: {key: n}, total, count} — pure.
  const planTraining = (p, keys, budget) => {
    const cur = {};
    keys.forEach((k) => { cur[k] = p[k]; });
    const points = {};
    let total = 0, count = 0;
    for (;;) {
      let best = null, bestCost = Infinity;
      for (const k of keys) {
        if (cur[k] >= (p.pot?.[k] ?? Infinity)) continue;
        const c = trainCost({ ...p, [k]: cur[k] }, k);
        if (c < bestCost) { best = k; bestCost = c; }
      }
      if (!best || total + bestCost > budget) break;
      cur[best]++;
      points[best] = (points[best] || 0) + 1;
      total += bestCost;
      count++;
    }
    return { points, total, count };
  };

  const applyTraining = (pid, plan, label) => {
    if (!plan.count) return;
    setMoney((m) => m - plan.total);
    addAT({ spent: plan.total, train: plan.count });
    const upd = (o) => {
      if (o.id !== pid) return o;
      const q = { ...o };
      for (const k in plan.points) q[k] += plan.points[k];
      return q;
    };
    setRoster((r) => ({ batters: r.batters.map(upd), sp: upd(r.sp), rp: upd(r.rp) }));
    if (label) pushLog(label, "win");
    play.cash();
  };

  const maxTrain = (pid, key) => {
    const p = [...roster.batters, roster.sp, roster.rp].find((x) => x.id === pid);
    if (!p) return;
    applyTraining(pid, planTraining(p, [key], money));
  };

  const trainAllFor = (pid) => {
    const p = [...roster.batters, roster.sp, roster.rp].find((x) => x.id === pid);
    if (!p) return;
    const keys = p.role === "bat" ? BAT_STATS : PIT_STATS;
    const plan = planTraining(p, keys, money);
    if (!plan.count) return;
    const gains = Object.entries(plan.points).map(([k, n]) => `${k} +${n}`).join(", ");
    applyTraining(pid, plan, `TRAINING CAMP: ${p.name} adds ${plan.count} point${plan.count > 1 ? "s" : ""} (${gains}) for $${fmt(plan.total)}.`);
  };

  const moveBatter = (id, dir) => {
    setRoster((r) => {
      const b = [...r.batters];
      const i = b.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= b.length) return r;
      [b[i], b[j]] = [b[j], b[i]];
      return { ...r, batters: b };
    });
  };
  const autoLineup = () => {
    const quality = (p) => { const q = eff(p); return q.contact + q.eye + q.power * 0.7 + q.speed * 0.3; };
    setRoster((r) => ({ ...r, batters: [...r.batters].sort((a, b) => quality(b) - quality(a)) }));
    pushLog("Skipper sets the lineup by the numbers — best bats up top. Applies from the next game.", "sys");
  };

  const boostText = (item) =>
    Object.entries(item.boosts).map(([s, n]) => `${n > 0 ? "+" : ""}${n} ${s}`).join(", ");

  const buyGear = (pid, itemId) => {
    const item = shopItems.find((i) => i.id === itemId);
    const def = item && GEAR.find((d) => d.slot === item.slot);
    const all = [...roster.batters, roster.sp, roster.rp];
    const p = all.find((x) => x.id === pid);
    if (!item || !p || money < item.cost) return;
    if ((def.role === "bat") !== (p.role === "bat")) return; // right kind of player
    setMoney((m) => m - item.cost);
    addAT({ spent: item.cost, gear: 1 });
    setShopItems((s) => s.filter((i) => i.id !== itemId));
    const upd = (o) => (o.id === pid ? { ...o, gear: { ...(o.gear || {}), [item.slot]: item } } : o);
    setRoster((r) => ({ ...r, batters: r.batters.map(upd), sp: upd(r.sp), rp: upd(r.rp) }));
    pushLog(`${p.name} equips ${item.name} (${boostText(item)}) — live from the next game.`, "win");
    play.cash();
  };

  // ── Trades: position-for-position swaps with a rival club ──
  const tradeCounterpart = (p, rivalIdx) => {
    const team = rivals?.[rivalIdx];
    if (!team) return null;
    if (p.role === "bat") return team.batters.find((b) => b.pos === p.pos) || null;
    return p.pos === "SP" ? team.sp : null; // rivals carry no reliever
  };
  const tradeQuote = (p, rivalIdx) => {
    const q = tradeCounterpart(p, rivalIdx);
    if (!q) return null;
    const diff = playerValue(q, TRADE.valuePerOvr) - playerValue(p, TRADE.valuePerOvr);
    const cash = Math.round((diff > 0 ? diff * TRADE.buyPremium : diff * TRADE.sellDiscount) + TRADE.fee);
    return { them: q, cash }; // cash > 0: you pay; cash < 0: they pay you
  };
  const makeTrade = (myPid, rivalIdx) => {
    const all = [...roster.batters, roster.sp, roster.rp];
    const p = all.find((x) => x.id === myPid);
    const quote = p && tradeQuote(p, rivalIdx);
    if (!p || !quote || money < quote.cash) return;
    const q = quote.them;
    // veterans arrive with little headroom left — you trade for now, draft for later
    const incoming = { ...q, pot: vetPot(q, p.role === "bat" ? BAT_STATS : PIT_STATS) };
    setMoney((m) => m - quote.cash);
    addAT({ trades: 1, ...(quote.cash > 0 ? { spent: quote.cash } : { earned: -quote.cash }) });
    setRoster((r) => (p.role === "bat"
      ? { ...r, batters: r.batters.map((b) => (b.id === myPid ? incoming : b)) }
      : { ...r, sp: incoming }));
    setRivals((rv) => rv.map((team, i) => (i !== rivalIdx ? team
      : p.role === "bat"
        ? { ...team, batters: team.batters.map((b) => (b.id === q.id ? p : b)) }
        : { ...team, sp: p })));
    const name = rivals[rivalIdx].name;
    pushLog(`TRADE: ${p.name} goes to the ${name} for ${q.name}${quote.cash > 0 ? ` plus $${fmt(quote.cash)} in considerations` : quote.cash < 0 ? ` — the ${name} throw in $${fmt(-quote.cash)}` : ""}. Gear travels with the players.`, "win");
    play.cash();
  };

  // ── Draft day ──
  const signRookie = (rid) => {
    const rook = draftClass?.find((p) => p.id === rid);
    if (!rook || money < rook.signCost) return;
    const isPit = rook.pos === "SP" || rook.pos === "RP";
    const released = isPit ? (rook.pos === "SP" ? roster.sp : roster.rp) : roster.batters.find((b) => b.pos === rook.pos);
    setMoney((m) => m - rook.signCost);
    addAT({ spent: rook.signCost, rookies: 1 });
    setDraftClass((dc) => dc.filter((p) => p.id !== rid));
    setRoster((r) => {
      const signed = { ...rook, gear: released?.gear }; // the kid inherits the locker
      if (rook.pos === "SP") return { ...r, sp: signed };
      if (rook.pos === "RP") return { ...r, rp: signed };
      return { ...r, batters: r.batters.map((b) => (b.pos === rook.pos ? signed : b)) };
    });
    pushLog(`SIGNED: ${rook.name} (${rook.pos}) for $${fmt(rook.signCost)}. ${released ? `${released.name} is released — his gear stays in the locker.` : ""}`, "win");
    play.cash();
  };
  const closeDraft = () => {
    setDraftClass(null);
    setPhase("regular");
    pushLog(`The draft board closes. Opening Day of Year ${year} — play ball.`, "sys");
    showTip("backup");
  };

  // ── Stadium upgrades: money + fan milestone, one tier at a time ──
  const buyUpgrade = (trackId) => {
    const track = STADIUM.find((t) => t.id === trackId);
    const lvl = stadium[trackId] || 0;
    const next = track.tiers[lvl];
    if (!next || money < next.cost || fans < next.fans) return;
    setMoney((m) => m - next.cost);
    setStadium((st) => ({ ...st, [trackId]: lvl + 1 }));
    addAT({ spent: next.cost, upgrades: 1 });
    pushLog(`STADIUM: the ${next.name} opens — ${next.label}.`, "win");
    play.cash();
  };

  // ── Revenue streams: merch and media, tiered like the stadium ──
  const buyRevenue = (trackId) => {
    const track = REVENUE.find((t) => t.id === trackId);
    const lvl = trackId === "merch" ? merch : tv;
    const next = track.tiers[lvl];
    if (!next || money < next.cost || fans < next.fans) return;
    if (trackId === "tv" && merch < 1) return; // nothing to broadcast without a store
    setMoney((m) => m - next.cost);
    (trackId === "merch" ? setMerch : setTv)(lvl + 1);
    addAT({ spent: next.cost, upgrades: 1 });
    pushLog(trackId === "merch"
      ? `The ${next.name} opens — jerseys sell every second, even while you're away (up to ${next.offline}h).`
      : `${next.name} deal signed — passive income ×${next.value}.`, "win");
    play.cash();
  };

  const newFranchise = () => {
    try {
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    } catch {
      setSaveError("This browser couldn't erase the saved franchise. Check storage permissions and try again.");
    }
  };

  // ── Backup codes: the whole franchise as a copyable string ──
  const getBackupCode = () => {
    const data = saveData();
    return data ? encodeBackup(data) : "";
  };
  const restoreBackup = (code) => {
    const parsed = decodeBackup(code);
    if (!parsed.ok) return parsed.error;
    try {
      localStorage.setItem(SAVE_KEY, parsed.json);
      window.location.reload();
      return null;
    } catch {
      return "The backup is valid, but this browser couldn't store it.";
    }
  };

  const stat = (id) => seasonStats[id] || EMPTY_STAT;

  const g = gameRef.current;
  // Resolve the card's player fresh each render (training/trades update live)
  const findPlayer = (id) => {
    const own = roster && [...roster.batters, roster.sp, roster.rp].find((p) => p.id === id);
    if (own) return { player: own, isOwn: true };
    const riv = rivals?.flatMap((r) => [...r.batters, r.sp]).find((p) => p.id === id);
    if (riv) return { player: riv, isOwn: false };
    const rook = draftClass?.find((p) => p.id === id);
    if (rook) return { player: rook, isOwn: false };
    return null;
  };
  const cardView = cardId != null ? findPlayer(cardId) : null;
  const openCard = (p) => { setCardId(p.id); showTip("card"); };

  // Current series position (regular season only) + shop restock note
  const series = phase === "regular" && schedule && gameIndex < LEAGUE.seasonGames
    ? seriesInfo(schedule, gameIndex, form) : null;
  const restockNote = phase === "draft"
    ? "WINTER CATALOG IN STOCK — new shipments resume with the season"
    : phase === "playoffs"
      ? "NEW SHIPMENT WHEN THE NEXT PLAYOFF ROUND BEGINS"
      : series
        ? (series.gamesLeft <= 1 ? "NEW SHIPMENT AFTER THIS GAME" : `NEW SHIPMENT IN ${series.gamesLeft} GAMES`)
        : "NEW SHIPMENT WITH THE NEXT SERIES";

  // ── City selection screen ──
  if (!city) return (
    <>
      {saveError && <div role="alert" style={{ padding: 10, color: C.cream, background: "#4A201C", fontSize: 11 }}>{saveError}</div>}
      <CitySelect onPick={foundClub} onRestore={restoreBackup} />
    </>
  );

  return (
    <div className="game-shell">
      <style>{globalCss}</style>
      {saveError && <div role="alert" className="save-alert">{saveError}</div>}

      {menu === "settings" && (
        <Settings
          allTime={allTime} trophies={trophies} history={history} phase={phase}
          sound={sound} onToggleSound={() => setSound((v) => !v)}
          onRules={() => setMenu("rules")} onClose={() => setMenu(null)}
          getBackupCode={getBackupCode} onRestore={restoreBackup} onNewFranchise={newFranchise}
        />
      )}
      {menu === "rules" && <Rulebook onClose={() => setMenu("settings")} />}

      <div className="game-content">
        {/* Header */}
        <Scoreboard
          city={city} year={year} record={standings[0]} money={money} fans={fans}
          talent={roster ? talentGrade(roster) : "—"} trophies={trophies} form={form}
          phase={phase} playoffs={playoffs} gameIndex={gameIndex} series={series}
          speed={speed} paused={paused} sound={sound}
          onSetSpeed={(sp) => { setSpeed(sp); setPaused(false); }}
          onTogglePause={() => setPaused((p) => !p)}
          onToggleSound={() => setSound((v) => !v)}
          onHelp={() => setMenu("settings")}
        />

        <AnimatePresence mode="wait" initial={false}>
        <motion.main key={tab} className="screen-stack"
          initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
        {activeTip && <TipModal tipId={activeTip} onClose={closeTip} />}

        {cardView && (
          <PlayerCard
            player={cardView.player} isOwn={cardView.isOwn} onClose={() => setCardId(null)}
            money={money} league={LEAGUE} stat={stat} isStar={isStar}
            trainCost={trainCost} onTrain={train} onMaxTrain={maxTrain} onTrainAll={trainAllFor}
            tradeQuote={tradeQuote} onTrade={makeTrade} rivals={rivals}
          />
        )}

        {tab === "game" && phase === "draft" && draftClass && (
          <DraftBoard draftClass={draftClass} roster={roster} money={money} year={year}
            onSign={signRookie} onClose={closeDraft} onView={openCard} />
        )}

        {tab === "game" && (
          <BallparkTab
            g={g} city={city} year={year} phase={phase} playoffs={playoffs}
            gameIndex={gameIndex} standings={standings} rivals={rivals}
            log={log} speed={speed} roster={roster}
            onOpenCard={openCard} series={series}
          />
        )}

        {tab === "shop" && roster && (
          <ShopTab roster={roster} money={money} shopItems={shopItems} onBuy={buyGear} restockNote={restockNote} tierInfo={TIER_INFO[currentDealerTier()]} />
        )}

        {tab === "roster" && roster && (
          <RosterTab
            roster={roster} stat={stat} isStar={isStar}
            onMoveBatter={moveBatter} onAutoLineup={autoLineup} onOpenCard={openCard}
          />
        )}

        {tab === "club" && roster && (
          <FrontOfficeTab
            roster={roster} city={city} fans={fans} money={money}
            merch={merch} tv={tv} isStar={isStar} history={history} trophies={trophies}
            stadium={stadium} onBuyUpgrade={buyUpgrade} onBuyRevenue={buyRevenue}
          />
        )}
        </motion.main>
        </AnimatePresence>
      </div>
      <TabBar tab={tab} speed={speed} paused={paused} maxUnlocked={trophies > 0}
        onSetSpeed={(sp) => { if (sp === "max" && !(trophies > 0)) return; setSpeed(sp); setPaused(false); }}
        onTogglePause={() => setPaused((p) => !p)}
        onTab={(id) => { setTab(id); play.click(); if (id === "shop") showTip("shop"); if (id === "club") showTip("stadium"); }} />
    </div>
  );
}
