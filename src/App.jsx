// ── PENNANT CHASE v3 ── infinite auto-playing baseball franchise sim
// Eight clubs, 154-game seasons, playoffs, the Pennant Cup — forever.
// The games play themselves; you are the GM. This component owns all state;
// the pure simulation lives in src/game/ and the screens in src/ui/.

import { useState, useEffect, useRef, useCallback } from "react";
import { C, LEAGUE, ECON } from "./game/constants.js";
import { fmt } from "./game/utils.js";
import { genRoster, seedUid } from "./game/generators.js";
import { newGame, stepAtBat, playGameInstant, settleGame } from "./game/engine.js";
import { makeRivals, makeSchedule, teamRating, quickSim, simSeries, seedOrder, runOffseason, ageRoster } from "./game/season.js";
import { eff, isStar, talentGrade, gearCost, freshStock, GEAR, TIER_NAMES } from "./game/gear.js";
import { tabBtn, globalCss, MONO } from "./ui/styles.js";
import Scoreboard from "./ui/Scoreboard.jsx";
import CitySelect from "./ui/CitySelect.jsx";
import Rulebook from "./ui/Rulebook.jsx";
import BallparkTab from "./ui/BallparkTab.jsx";
import RosterTab from "./ui/RosterTab.jsx";
import ShopTab from "./ui/ShopTab.jsx";
import FrontOfficeTab from "./ui/FrontOfficeTab.jsx";

const EMPTY_STAT = { ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, k: 0, r: 0, rbi: 0, outsP: 0, kP: 0, bbP: 0, hP: 0, raP: 0 };

const FENCE = { corner: LEAGUE.fenceCorner, center: LEAGUE.fenceCenter };

// Jersey sales per second. Also used to pay capped income for time away.
const merchRate = (fansN, stars, hasTv, merchCity) =>
  0.01 * Math.sqrt(fansN) * (1 + 0.3 * stars) * (hasTv ? 2 : 1) * (merchCity ? 1.3 : 1);

// Home patterns for playoff series (1 = higher seed hosts)
const HOME_BO5 = [1, 1, 0, 0, 1];
const HOME_BO7 = [1, 1, 0, 0, 0, 1, 1];

// ── Save (v3) ──
const SAVE_KEY = "pennant-chase-save-v3";
const SAVED = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    return s?.version === 3 ? s : null;
  } catch { return null; }
})();
if (SAVED?.roster) {
  const everyone = [
    SAVED.roster.batters, [SAVED.roster.sp, SAVED.roster.rp],
    ...(SAVED.rivals || []).map((r) => [...r.batters, r.sp]),
  ].flat();
  seedUid(Math.max(...everyone.map((p) => p.id)) + 1);
}

export default function App() {
  // ── Franchise state (all autosaved) ──
  const [city, setCity] = useState(SAVED?.city ?? null);
  const [money, setMoney] = useState(SAVED?.money ?? ECON.startMoney);
  const [fans, setFans] = useState(SAVED?.fans ?? ECON.startFans);
  const [roster, setRoster] = useState(SAVED?.roster ?? null);
  const [merch, setMerch] = useState(SAVED?.merch ?? false);
  const [tv, setTv] = useState(SAVED?.tv ?? false);
  const [seasonStats, setSeasonStats] = useState(SAVED?.seasonStats ?? {});
  const [shopStock, setShopStock] = useState(SAVED?.shopStock ?? freshStock());
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
  const [speed, setSpeed] = useState(SAVED?.speed ?? 1);
  const [paused, setPaused] = useState(false);

  // ── UI state ──
  const [selectedId, setSelectedId] = useState(null);
  const [log, setLog] = useState([]);
  const [tab, setTab] = useState("game");
  const [showHelp, setShowHelp] = useState(false);
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);

  const idRef = useRef(1);
  const gameRef = useRef(null);   // live game (never saved)
  const ctxRef = useRef(null);    // per-game roster snapshot for the engine
  const restRef = useRef(0);      // beat between games at watchable speeds

  // Fresh-state mirror so interval callbacks never read stale closures
  const S = useRef({});
  S.current = { city, money, fans, roster, merch, tv, seasonStats, shopStock, form, year, phase, rivals, schedule, rivalDays, gameIndex, standings, playoffs, history, trophies, speed };

  const cityBonus = (k) => (city?.bonus === k);

  const pushLog = useCallback((text, kind = "play", side = null, team = null) => {
    setLog((l) => [{ id: idRef.current++, text, kind, side, team }, ...l].slice(0, 40));
  }, []);

  // ── Save: single writer, called by the autosave effect and a 20s heartbeat ──
  const saveNow = useCallback(() => {
    const s = S.current;
    if (!s.city) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 3, lastSeen: Date.now(),
      city: s.city, money: s.money, fans: s.fans, roster: s.roster, merch: s.merch, tv: s.tv,
      seasonStats: s.seasonStats, shopStock: s.shopStock, form: s.form,
      year: s.year, phase: s.phase, rivals: s.rivals, schedule: s.schedule, rivalDays: s.rivalDays,
      gameIndex: s.gameIndex, standings: s.standings, playoffs: s.playoffs,
      history: s.history, trophies: s.trophies, speed: s.speed,
    }));
  }, []);
  useEffect(() => { saveNow(); }, [city, money, fans, roster, merch, tv, seasonStats, shopStock, form, year, phase, rivals, schedule, rivalDays, gameIndex, standings, playoffs, history, trophies, speed, saveNow]);
  useEffect(() => {
    const iv = setInterval(() => { if (!document.hidden) saveNow(); }, 20000);
    return () => clearInterval(iv);
  }, [saveNow]);

  // ── While-you-were-away pay (merch only, capped) ──
  const welcomed = useRef(false);
  useEffect(() => {
    if (welcomed.current || !SAVED?.city) return;
    welcomed.current = true;
    const elapsed = Math.min(Math.max(0, Date.now() - (SAVED.lastSeen || Date.now())), ECON.offlineCapHours * 3600e3);
    if (SAVED.merch && elapsed > 60e3) {
      const all = [...SAVED.roster.batters, SAVED.roster.sp, SAVED.roster.rp];
      const stars = all.filter(isStar).length;
      const gain = merchRate(SAVED.fans, stars, SAVED.tv, SAVED.city.bonus === "merch") * (elapsed / 1000) * ECON.offlineRate;
      setMoney((m) => m + gain);
      const h = Math.floor(elapsed / 3600e3), min = Math.floor((elapsed % 3600e3) / 60e3);
      pushLog(`While you were away (${h}h ${min}m), the merch stand sold $${fmt(gain)} in jerseys.${elapsed >= ECON.offlineCapHours * 3600e3 - 1000 ? ` (${ECON.offlineCapHours}h cap)` : ""}`, "win");
    } else {
      pushLog(`Welcome back. Your ${SAVED.city.name} club picks up right where it left off — Year ${SAVED.year}.`, "sys");
    }
  }, [pushLog]);

  // ── Founding ──
  const foundClub = (c) => {
    const r = genRoster(LEAGUE.statBase);
    const rv = makeRivals();
    const sch = makeSchedule();
    setCity(c); setRoster(r); setRivals(rv);
    setSchedule(sch.schedule); setRivalDays(sch.rivalDays);
    pushLog(`The ${c.name} franchise joins ${LEAGUE.name}. ${c.label}.`, "win");
    pushLog(`Eight clubs. ${LEAGUE.seasonGames} games. Top four make the playoffs. The Pennant Cup waits.`, "sys");
  };

  // ── Economy tick (merch / TV passive income while watching) ──
  useEffect(() => {
    if (!merch || !roster) return;
    const iv = setInterval(() => {
      if (document.hidden) return;
      const stars = [...roster.batters, roster.sp, roster.rp].filter(isStar).length;
      setMoney((m) => m + merchRate(fans, stars, tv, cityBonus("merch")));
    }, 1000);
    return () => clearInterval(iv);
  }, [merch, tv, fans, roster, city]);

  // ── Season stat flush (batched deltas from the engine) ──
  const flushStats = (g) => {
    const accs = g.statAcc;
    if (!Object.keys(accs).length) return;
    g.statAcc = {};
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
      fence: FENCE, statBase: LEAGUE.statBase, innings: LEAGUE.innings, cityName: s.city.name,
    };
    pushLog(`— ${label} — ${home ? `${opp.name} at ${s.city.name}` : `${s.city.name} at ${opp.name}`}.`, "sys");
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
      fansBonus: cityBonus("fans"), cityName: s.city.name, playoff: playoffLabel,
      formWins: s.form.filter((f) => f === "W").length, streak,
    });
    setMoney((m) => m + res.moneyDelta);
    if (res.fansDelta) setFans((f) => f + res.fansDelta);
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

    if (s.phase === "regular") {
      if (s.gameIndex >= LEAGUE.seasonGames) return enterPlayoffs();
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
      const finalOppIdx = p.otherWinner;
      pushLog(`— SEMIFINAL WON ${p.wins.us}-${p.wins.them} — $${fmt(ECON.semisSeriesPay)} series bonus. The Pennant Cup final vs the ${s.rivals[finalOppIdx - 1].name} begins.`, "win");
      const order = seedOrder(s.standings, ratings);
      setPlayoffs({
        round: "final", opp: finalOppIdx, wins: { us: 0, them: 0 }, gameNo: 0,
        weAreHigherSeed: order.indexOf(0) < order.indexOf(finalOppIdx),
      });
      return;
    }
    if (p.wins.us >= need && p.round === "final") {
      pushLog(`— PENNANT CUP CHAMPIONS — ${s.city.name} take the final ${p.wins.us}-${p.wins.them}. $${fmt(ECON.cupPay)} and the parade lasts three days.`, "win");
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
    const name = (i) => (i === 0 ? s.city.name : s.rivals[i - 1].name);
    pushLog(`— REGULAR SEASON COMPLETE — ${s.city.name} finish ${s.standings[0].w}-${s.standings[0].l}, ${["1st", "2nd", "3rd"][mySeed] || `${mySeed + 1}th`}.`, mySeed < LEAGUE.playoffTeams ? "win" : "out");

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
    } else {
      const top = order.slice(0, 4);
      const w1 = simSeries(ratings[top[0]], ratings[top[3]], 5) ? top[0] : top[3];
      const w2 = simSeries(ratings[top[1]], ratings[top[2]], 5) ? top[1] : top[2];
      const champ = simSeries(ratings[w1], ratings[w2], 7) ? w1 : w2;
      pushLog(`No playoffs this year. The ${name(champ)} go on to take the Pennant Cup.`, "out");
      offseason(champ, false);
    }
  };

  const offseason = (championIdx, playerCup) => {
    const s = S.current;
    const ratings = ratingsNow();
    const order = seedOrder(s.standings, ratings);
    const off = runOffseason({
      year: s.year, rivals: s.rivals, standings: s.standings, ratings,
      championIdx, championName: championIdx === 0 ? s.city.name : s.rivals[championIdx - 1].name,
      playerSeed: order.indexOf(0), playerCup,
      record: { w: s.standings[0].w, l: s.standings[0].l },
      fans: s.fans, history: s.history, trophies: s.trophies,
    });
    if (playerCup) setMoney((m) => m + ECON.cupPay);
    setFans((f) => Math.max(25, f + off.fansDelta));
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
    setShopStock(freshStock());
    setYear(off.year);
    setPhase("regular");
    gameRef.current = null;
    off.logs.forEach((l) => pushLog(l.text, l.kind));
    pushLog(`Winter takes its toll — every player loses a step. Train, shop, and reload.`, "sys");
  };

  // ── One live at-bat (1x / 4x speeds) ──
  const liveStep = () => {
    const g = gameRef.current;
    const ev = [];
    stepAtBat(g, ctxRef.current, ev);
    ev.forEach((e) => pushLog(e.text, e.kind, e.side, e.team));
    flushStats(g);
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
    let c = ECON.trainBase * Math.pow(1.5, p[key]);
    if (cityBonus("train")) c *= 0.85;
    return Math.ceil(c);
  };
  const train = (pid, key) => {
    setRoster((r) => {
      const all = [...r.batters, r.sp, r.rp];
      const p = all.find((x) => x.id === pid);
      const cost = trainCost(p, key);
      if (money < cost) return r;
      setMoney((m) => m - cost);
      const upd = (o) => (o.id === pid ? { ...o, [key]: o[key] + 1 } : o);
      return { batters: r.batters.map(upd), sp: upd(r.sp), rp: upd(r.rp) };
    });
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

  const buyGear = (pid, slot, gearTier) => {
    const item = GEAR.find((i) => i.slot === slot);
    const all = [...roster.batters, roster.sp, roster.rp];
    const p = all.find((x) => x.id === pid);
    const cost = gearCost(gearTier);
    const owned = p?.gear?.[slot] ?? 0;
    if (!item || !p || money < cost || gearTier <= owned || (shopStock[slot]?.[gearTier] ?? 0) < 1) return;
    setMoney((m) => m - cost);
    setShopStock((s) => ({ ...s, [slot]: { ...s[slot], [gearTier]: s[slot][gearTier] - 1 } }));
    const upd = (o) => (o.id === pid ? { ...o, gear: { ...(o.gear || {}), [slot]: gearTier } } : o);
    setRoster((r) => ({ ...r, batters: r.batters.map(upd), sp: upd(r.sp), rp: upd(r.rp) }));
    pushLog(`${p.name} breaks in ${TIER_NAMES[gearTier]} ${item.label}. +${gearTier} ${item.stat} from the next game.`, "win");
  };

  const buyMerch = () => {
    if (money >= ECON.merchCost && fans >= ECON.merchFans) {
      setMoney((m) => m - ECON.merchCost); setMerch(true);
      pushLog("Merch stand opens. Jersey sales tick in every second — stars sell more. It even sells while you're away (up to 8 hours).", "win");
    }
  };
  const buyTv = () => {
    if (money >= ECON.tvCost && fans >= ECON.tvFans && merch) {
      setMoney((m) => m - ECON.tvCost); setTv(true);
      pushLog("Regional TV deal signed. Merch and media income doubled.", "win");
    }
  };

  const newFranchise = () => {
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  };

  // ── Backup codes: the whole franchise as a copyable string ──
  const getBackupCode = () => {
    saveNow();
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? btoa(unescape(encodeURIComponent(raw))) : "";
  };
  const restoreBackup = (code) => {
    try {
      const json = decodeURIComponent(escape(atob(code.replace(/\s/g, ""))));
      const s = JSON.parse(json);
      if (s?.version !== 3 || !s.city || !s.roster) return "That code doesn't look like a Pennant Chase backup.";
      localStorage.setItem(SAVE_KEY, json);
      window.location.reload();
      return null;
    } catch {
      return "Couldn't read that code. Make sure you copied the whole thing, then try again.";
    }
  };

  const stat = (id) => seasonStats[id] || EMPTY_STAT;

  const g = gameRef.current;
  const selected = roster ? [...roster.batters, roster.sp, roster.rp].find((p) => p.id === selectedId) : null;

  // ── City selection screen ──
  if (!city) return <CitySelect onPick={foundClub} onRestore={restoreBackup} />;

  return (
    <div style={{ minHeight: "100dvh", background: C.green, color: C.cream, fontFamily: MONO, padding: "calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))", boxSizing: "border-box" }}>
      <style>{globalCss}</style>

      {showHelp && <Rulebook onClose={() => setShowHelp(false)} />}

      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        {/* Header */}
        <Scoreboard
          city={city} year={year} record={standings[0]} money={money} fans={fans}
          talent={roster ? talentGrade(roster) : "—"} trophies={trophies} form={form}
          phase={phase} playoffs={playoffs} gameIndex={gameIndex}
          onHelp={() => setShowHelp(true)}
        />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          {[["game", "BALLPARK"], ["roster", "ROSTER"], ["shop", "SHOP"], ["club", "FRONT OFFICE"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={tabBtn(tab === id)}>{label}</button>
          ))}
        </div>

        {tab === "game" && (
          <BallparkTab
            g={g} city={city} year={year} phase={phase} playoffs={playoffs}
            gameIndex={gameIndex} standings={standings} rivals={rivals}
            log={log} speed={speed} paused={paused} roster={roster}
            onSetSpeed={(sp) => { setSpeed(sp); setPaused(false); }}
            onTogglePause={() => setPaused((p) => !p)}
          />
        )}

        {tab === "shop" && roster && (
          <ShopTab roster={roster} money={money} shopStock={shopStock} onBuy={buyGear} />
        )}

        {tab === "roster" && roster && (
          <RosterTab
            roster={roster} league={LEAGUE} selected={selected} selectedId={selectedId} onSelect={setSelectedId}
            stat={stat} isStar={isStar} money={money} trainCost={trainCost} onTrain={train}
            onMoveBatter={moveBatter} onAutoLineup={autoLineup}
          />
        )}

        {tab === "club" && roster && (
          <FrontOfficeTab
            roster={roster} city={city} fans={fans} money={money}
            merch={merch} tv={tv} isStar={isStar} history={history} trophies={trophies}
            onBuyMerch={buyMerch} onBuyTv={buyTv} onNewFranchise={newFranchise}
            getBackupCode={getBackupCode} onRestore={restoreBackup}
          />
        )}
      </div>
    </div>
  );
}
