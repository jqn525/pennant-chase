// ── PENNANT CHASE v2 ── text-based baseball team sim / incremental
// Draft a club in your chosen city, climb from Little League to the Majors.
// This component owns all game state; the simulation math lives in src/game/
// and the screens live in src/ui/.

import { useState, useEffect, useRef, useCallback } from "react";
import { C, LEAGUES } from "./game/constants.js";
import { fmt } from "./game/utils.js";
import { genRoster, genOpponent, seedUid, developRoster } from "./game/generators.js";
import { resolveAtBat } from "./game/atBat.js";
import { eff, isStar, talentGrade, gearCost, freshStock, GEAR, TIER_NAMES } from "./game/gear.js";
import ShopTab from "./ui/ShopTab.jsx";
import { panel, bulb, tabBtn, globalCss, MONO, SLAB } from "./ui/styles.js";
import { RulebookIcon } from "./ui/Icons.jsx";
import CitySelect from "./ui/CitySelect.jsx";
import Rulebook from "./ui/Rulebook.jsx";
import BallparkTab from "./ui/BallparkTab.jsx";
import RosterTab from "./ui/RosterTab.jsx";
import FrontOfficeTab from "./ui/FrontOfficeTab.jsx";

const EMPTY_STAT = { ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, k: 0, r: 0, rbi: 0, outsP: 0, kP: 0, bbP: 0, hP: 0, raP: 0 };

// ── Auto-save: the whole franchise lives in one browser-storage key ──
const SAVE_KEY = "pennant-chase-save";
const SAVED = (() => {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; }
})();
if (SAVED?.roster) {
  // keep new player ids above the saved ones so they never collide
  seedUid(Math.max(...[...SAVED.roster.batters, SAVED.roster.sp, SAVED.roster.rp].map((p) => p.id)) + 1);
  // repair saves from before promotion developed the roster: no player
  // should sit below his current league's level
  SAVED.roster = developRoster(SAVED.roster, LEAGUES[SAVED.tier ?? 0].statBase);
}

export default function App() {
  // ── Club state ──
  const [city, setCity] = useState(SAVED?.city ?? null);
  const [money, setMoney] = useState(SAVED?.money ?? 60);
  const [fans, setFans] = useState(SAVED?.fans ?? 25);
  const [tier, setTier] = useState(SAVED?.tier ?? 0);
  const [record, setRecord] = useState(SAVED?.record ?? { w: 0, l: 0 });
  const [roster, setRoster] = useState(SAVED?.roster ?? null);
  const [merch, setMerch] = useState(SAVED?.merch ?? false);
  const [tv, setTv] = useState(SAVED?.tv ?? false);
  const [champ, setChamp] = useState(SAVED?.champ ?? false);
  const [seasonStats, setSeasonStats] = useState(SAVED?.seasonStats ?? {}); // id -> batting {ab,h,d,t,hr,bb,k,r,rbi} + pitching {outsP,kP,bbP,hP,raP}
  const [shopStock, setShopStock] = useState(SAVED?.shopStock ?? freshStock()); // slot -> {tier: count}
  const [form, setForm] = useState(SAVED?.form ?? []); // last 10 results, "W"/"L"
  const [selectedId, setSelectedId] = useState(null);
  const [log, setLog] = useState([]);
  const [tab, setTab] = useState("game");
  const [showHelp, setShowHelp] = useState(false);
  const [auto, setAuto] = useState(false);
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);

  const idRef = useRef(1);
  const gameRef = useRef(null); // live game state

  const cityBonus = (k) => (city?.bonus === k);
  const league = LEAGUES[tier];

  const pushLog = useCallback((text, kind = "play", side = null, team = null) => {
    setLog((l) => [{ id: idRef.current++, text, kind, side, team }, ...l].slice(0, 40));
  }, []);

  const bumpStat = (pid, key, n = 1) => {
    setSeasonStats((s) => {
      const cur = s[pid] || { ...EMPTY_STAT };
      return { ...s, [pid]: { ...cur, [key]: cur[key] + n } };
    });
  };

  // ── Setup ──
  const foundClub = (c) => {
    setCity(c);
    setRoster(genRoster(2));
    pushLog(`The ${c.name} franchise is founded. ${c.label}. First stop: ${LEAGUES[0].name}.`, "sys");
  };

  // ── Auto-save after any change to club state ──
  useEffect(() => {
    if (!city) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ city, money, fans, tier, record, roster, merch, tv, champ, seasonStats, shopStock, form }));
  }, [city, money, fans, tier, record, roster, merch, tv, champ, seasonStats, shopStock, form]);

  const welcomed = useRef(false);
  useEffect(() => {
    if (welcomed.current || !SAVED?.city) return;
    welcomed.current = true;
    pushLog(`Welcome back. Your ${SAVED.city.name} club picks up right where it left off.`, "sys");
  }, [pushLog]);

  const newFranchise = () => {
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  };

  // ── Economy tick (merch / TV passive income) ──
  useEffect(() => {
    if (!merch || !roster) return;
    const iv = setInterval(() => {
      const stars = roster.batters.filter(isStar).length + (isStar(roster.sp) ? 1 : 0);
      let inc = 0.06 * Math.sqrt(fans) * (1 + 0.6 * stars);
      if (cityBonus("merch")) inc *= 1.3;
      if (tv) inc *= 3;
      setMoney((m) => m + inc);
    }, 1000);
    return () => clearInterval(iv);
  }, [merch, tv, fans, roster, city]);

  // ── Game flow ──
  const startGame = () => {
    if (gameRef.current && !gameRef.current.over) return;
    const opp = genOpponent(tier);
    gameRef.current = {
      opp, inning: 1, half: "top", outs: 0, bases: [null, null, null],
      us: 0, them: 0, usIdx: 0, themIdx: 0, spFaced: 0, usingRP: false, over: false, hrUs: 0,
      box: { us: {}, them: {}, lobUs: 0, lobThem: 0 }, // this game's live box score
    };
    pushLog(`— PLAY BALL — ${city.name} vs the ${opp.name} (${opp.trait.label}: ${opp.trait.desc}). ${league.innings} innings.`, "win");
    rerender();
  };

  const endGame = (g) => {
    g.over = true;
    setAuto(false);
    const won = g.us > g.them;
    if (won) {
      let pay = league.payWin * (1 + fans / 1000);
      if (cityBonus("gate")) pay *= 1.25;
      let fGain = league.fansPerWin + g.hrUs * 3;
      if (cityBonus("fans")) fGain = Math.round(fGain * 1.25);
      setMoney((m) => m + pay);
      setFans((f) => f + fGain);
      setRecord((r) => ({ ...r, w: r.w + 1 }));
      pushLog(`FINAL: ${city.name} ${g.us}, ${g.opp.name} ${g.them}. Gate receipts $${fmt(pay)}, +${fGain} fans.`, "win");
    } else {
      let floor = league.payFloor * (cityBonus("floor") ? 2 : 1) + fans * 0.02;
      setMoney((m) => m + floor);
      setRecord((r) => ({ ...r, l: r.l + 1 }));
      pushLog(`FINAL: ${g.opp.name} ${g.them}, ${city.name} ${g.us}. The faithful still show up — $${fmt(floor)} at the gate.`, "out");
    }
    setForm((f) => [...f, won ? "W" : "L"].slice(-10));
  };

  const simStep = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.over || !roster) return;

    const weBat = g.half === "bottom";
    const batters = weBat ? roster.batters : g.opp.batters;
    const idx = weBat ? g.usIdx : g.themIdx;
    // eff() applies equipment bonuses; id/name survive so stat tracking is unaffected
    const batter = eff(batters[idx % 9]);

    let pitcher;
    if (weBat) pitcher = eff(g.opp.sp);
    else {
      const limit = 8 + roster.sp.stamina * 2; // stamina has no gear item
      if (!g.usingRP && g.spFaced >= limit) {
        g.usingRP = true;
        pushLog(`${roster.sp.name} is gassed after ${g.spFaced} batters. ${roster.rp.name} jogs in from the pen.`, "sys");
      }
      pitcher = eff(g.usingRP ? roster.rp : roster.sp);
      g.spFaced++;
    }
    const fielders = (weBat
      ? [...g.opp.batters, { ...g.opp.sp }]
      : [...roster.batters, { ...(g.usingRP ? roster.rp : roster.sp) }]).map(eff);

    const out = resolveAtBat(batter, pitcher, fielders, { corner: league.fenceCorner, center: league.fenceCenter }, league.statBase);
    const who = `${batter.name} (${batter.pos})`;
    const side = weBat ? "us" : "them";
    const teamName = weBat ? city.name : g.opp.name;

    // Live box score for THIS game — both teams (shown on the Ballpark tab)
    if (!g.box) g.box = { us: {}, them: {}, lobUs: 0, lobThem: 0 };
    const gb = (pid, key, n = 1) => {
      const line = g.box[side][pid] || (g.box[side][pid] = { ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, k: 0, r: 0, rbi: 0 });
      line[key] += n;
    };

    // Season stats for OUR players only:
    // batters in the bottom half, our pitcher in the top half.
    const track = weBat;
    const trackP = !weBat;
    if (out.type === "K") {
      if (track) { bumpStat(batter.id, "ab"); bumpStat(batter.id, "k"); }
      if (trackP) { bumpStat(pitcher.id, "kP"); bumpStat(pitcher.id, "outsP"); }
      gb(batter.id, "ab"); gb(batter.id, "k");
      g.outs++;
      pushLog(`${who} ${out.text}`, weBat ? "out" : "play", side, teamName);
    } else if (out.type === "BB") {
      if (track) bumpStat(batter.id, "bb");
      if (trackP) bumpStat(pitcher.id, "bbP");
      gb(batter.id, "bb");
      // force runners; bases loaded walks in the runner from third
      if (g.bases[0] && g.bases[1] && g.bases[2]) {
        weBat ? g.us++ : g.them++;
        if (track) { bumpStat(g.bases[2].id, "r"); bumpStat(batter.id, "rbi"); }
        if (trackP) bumpStat(pitcher.id, "raP");
        gb(g.bases[2].id, "r"); gb(batter.id, "rbi");
        g.bases[2] = null;
      }
      if (g.bases[0] && g.bases[1]) g.bases[2] = g.bases[2] || g.bases[1];
      if (g.bases[0]) g.bases[1] = g.bases[1] || g.bases[0];
      g.bases[0] = batter;
      pushLog(`${who} ${out.text}`, "play", side, teamName);
    } else if (out.type === "OUT") {
      if (track) bumpStat(batter.id, "ab");
      if (trackP) bumpStat(pitcher.id, "outsP");
      gb(batter.id, "ab");
      g.outs++;
      pushLog(`${who} ${out.text}`, weBat ? "out" : "play", side, teamName);
    } else {
      // HR or HIT
      if (track) { bumpStat(batter.id, "ab"); bumpStat(batter.id, "h"); }
      if (trackP) bumpStat(pitcher.id, "hP");
      gb(batter.id, "ab"); gb(batter.id, "h");
      let runs = 0;
      if (out.type === "HR") {
        const runners = g.bases.filter(Boolean);
        runs = 1 + runners.length;
        if (track) {
          bumpStat(batter.id, "hr");
          bumpStat(batter.id, "r");
          bumpStat(batter.id, "rbi", runs);
          runners.forEach((p) => bumpStat(p.id, "r"));
        }
        gb(batter.id, "hr"); gb(batter.id, "r"); gb(batter.id, "rbi", runs);
        runners.forEach((p) => gb(p.id, "r"));
        g.bases = [null, null, null];
        if (weBat) g.hrUs++;
      } else {
        const b = out.bases;
        if (track && b === 2) bumpStat(batter.id, "d");
        if (track && b === 3) bumpStat(batter.id, "t");
        if (b === 2) gb(batter.id, "d");
        if (b === 3) gb(batter.id, "t");
        const scored = [];
        for (let i = 2; i >= 0; i--) {
          if (!g.bases[i]) continue;
          if (i + b >= 3) { scored.push(g.bases[i]); g.bases[i] = null; }
          else { g.bases[i + b] = g.bases[i]; g.bases[i] = null; }
        }
        runs = scored.length;
        if (track && runs) {
          scored.forEach((p) => bumpStat(p.id, "r"));
          bumpStat(batter.id, "rbi", runs);
        }
        if (runs) {
          scored.forEach((p) => gb(p.id, "r"));
          gb(batter.id, "rbi", runs);
        }
        g.bases[b - 1] = batter;
      }
      if (runs) {
        weBat ? (g.us += runs) : (g.them += runs);
        if (trackP) bumpStat(pitcher.id, "raP", runs);
      }
      pushLog(`${who} ${out.text}${runs ? ` ${runs} run${runs > 1 ? "s" : ""} score${runs > 1 ? "" : "s"}!` : ""}`, out.type === "HR" ? "hr" : "play", side, teamName);
    }

    if (weBat) g.usIdx = (idx + 1) % 9; else g.themIdx = (idx + 1) % 9;

    // Walk-off check
    if (weBat && g.inning >= league.innings && g.us > g.them) { endGame(g); rerender(); return; }

    if (g.outs >= 3) {
      const stranded = g.bases.filter(Boolean).length;
      if (weBat) g.box.lobUs += stranded; else g.box.lobThem += stranded;
      g.outs = 0; g.bases = [null, null, null];
      if (g.half === "top") {
        // Home team (us) skips the bottom if already ahead in the final inning? Standard: play bottom unless ahead after top of last.
        if (g.inning >= league.innings && g.us > g.them) { endGame(g); rerender(); return; }
        g.half = "bottom";
        pushLog(`Middle ${g.inning}. ${g.opp.name} ${g.them}, ${city.name} ${g.us}.`, "sys");
      } else {
        if (g.inning >= league.innings && g.us !== g.them) { endGame(g); rerender(); return; }
        g.inning++;
        g.half = "top";
        pushLog(g.inning > league.innings ? `Tied after regulation — extra innings!` : `End ${g.inning - 1}. Heading to the ${g.inning}${["st", "nd", "rd"][g.inning - 1] || "th"}.`, "sys");
      }
    }
    rerender();
  }, [roster, league, city, pushLog]);

  // Auto-sim loop
  useEffect(() => {
    if (!auto) return;
    const iv = setInterval(() => {
      const g = gameRef.current;
      if (!g || g.over) { setAuto(false); return; }
      simStep();
    }, 600);
    return () => clearInterval(iv);
  }, [auto, simStep]);

  // ── Training ──
  const trainCost = (p, key) => {
    let c = 15 * Math.pow(1.5, p[key]);
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

  // ── Promotion & unlocks ──
  const promote = () => {
    if (record.w < league.winsNeeded) return;
    if (tier >= LEAGUES.length - 1) {
      setChamp(true);
      pushLog(`— WORLD SERIES CHAMPIONS — The ${city.name} club takes it all. The parade lasts three days.`, "win");
      return;
    }
    pushLog(`— PENNANT WON — ${city.name} is promoted to ${LEAGUES[tier + 1].name}. Deeper fences, better arms, bigger gates.`, "win");
    pushLog(`A recruiting class arrives: the whole squad develops to ${LEAGUES[tier + 1].name} level. Trained stars keep their edge.`, "sys");
    const bonus = LEAGUES[tier + 1].payWin * 5;
    setMoney((m) => m + bonus);
    setShopStock(freshStock());
    pushLog(`League signing bonus: $${fmt(bonus)}. Time to hit the Pro Shop — fresh stock just arrived.`, "win");
    setRoster((r) => developRoster(r, LEAGUES[tier + 1].statBase));
    setTier((t) => t + 1);
    setRecord({ w: 0, l: 0 });
    gameRef.current = null;
  };
  // ── Pro Shop ──
  const buyGear = (pid, slot, gearTier) => {
    if (tier < 1) return; // shop opens in High School
    const item = GEAR.find((i) => i.slot === slot);
    const all = [...roster.batters, roster.sp, roster.rp];
    const p = all.find((x) => x.id === pid);
    const cost = gearCost(gearTier, tier);
    const owned = p?.gear?.[slot] ?? 0;
    if (!item || !p || money < cost || gearTier <= owned || (shopStock[slot]?.[gearTier] ?? 0) < 1) return;
    setMoney((m) => m - cost);
    setShopStock((s) => ({ ...s, [slot]: { ...s[slot], [gearTier]: s[slot][gearTier] - 1 } }));
    const upd = (o) => (o.id === pid ? { ...o, gear: { ...(o.gear || {}), [slot]: gearTier } } : o);
    setRoster((r) => ({ ...r, batters: r.batters.map(upd), sp: upd(r.sp), rp: upd(r.rp) }));
    pushLog(`${p.name} breaks in ${TIER_NAMES[gearTier]} ${item.label}. +${gearTier} ${item.stat}.`, "win");
  };

  const buyMerch = () => {
    if (money >= 150 && fans >= 200) { setMoney((m) => m - 150); setMerch(true); pushLog("Merch stand opens. Jersey sales tick in every second — stars sell more.", "win"); }
  };
  const buyTv = () => {
    if (money >= 2500 && tier >= 3 && merch) { setMoney((m) => m - 2500); setTv(true); pushLog("Regional TV deal signed. Merch and media income tripled.", "win"); }
  };

  const stat = (id) => seasonStats[id] || EMPTY_STAT;

  // ── Batting order (roster.batters array order = batting order) ──
  const lineupLocked = !!(gameRef.current && !gameRef.current.over);
  const moveBatter = (id, dir) => {
    if (gameRef.current && !gameRef.current.over) return; // no mid-game shuffles
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
    if (gameRef.current && !gameRef.current.over) return;
    // On-base skills up top, weighted power behind them — the order that scored
    // best in simulation: best all-around bats get the most plate appearances.
    const quality = (p) => { const q = eff(p); return q.contact + q.eye + q.power * 0.7 + q.speed * 0.3; };
    setRoster((r) => ({ ...r, batters: [...r.batters].sort((a, b) => quality(b) - quality(a)) }));
    pushLog("Skipper sets the lineup by the numbers — best bats up top.", "sys");
  };

  const g = gameRef.current;
  const selected = roster ? [...roster.batters, roster.sp, roster.rp].find((p) => p.id === selectedId) : null;

  // ── City selection screen ──
  if (!city) return <CitySelect onPick={foundClub} />;

  return (
    <div style={{ minHeight: "100dvh", background: C.green, color: C.cream, fontFamily: MONO, padding: "calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))", boxSizing: "border-box" }}>
      <style>{globalCss}</style>

      {showHelp && <Rulebook onClose={() => setShowHelp(false)} />}

      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ ...panel, padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "baseline", borderBottom: `3px solid ${C.amber}` }}>
          <h1 style={{ fontFamily: SLAB, fontSize: 20, margin: 0 }}>
            {city.name.toUpperCase()}<span style={{ color: C.amber }}> BASEBALL</span>
          </h1>
          {[
            ["LEAGUE", league.name + (champ ? " · CHAMPS" : ""), 150],
            ["RECORD", `${record.w}-${record.l}`, 64],
            ["MONEY", "$" + fmt(money), 92],
            ["FANS", fmt(fans), 76],
            ["TALENT", roster ? talentGrade(roster, league.statBase) : "—", 58],
          ].map(([l, v, w]) => (
            <div key={l} style={{ width: w, flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2 }}>{l}</div>
              <div style={{ ...bulb, fontSize: 17, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontVariantNumeric: "tabular-nums" }}>{v}</div>
            </div>
          ))}
          <div style={{ width: 96, flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2 }}>FORM · LAST 10</div>
            <div style={{ display: "flex", gap: 3, alignItems: "center", height: 22 }}>
              {form.length === 0 && <span style={{ fontSize: 11, color: C.creamDim }}>—</span>}
              {form.map((r, i) => (
                <span key={i} title={r} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: r === "W" ? C.amber : "transparent",
                  border: `1px solid ${r === "W" ? C.amber : C.creamDim}`,
                }} />
              ))}
            </div>
          </div>
          <button onClick={() => setShowHelp(true)} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.greenLine}`, borderRadius: 4, color: C.cream, fontFamily: MONO, fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>
            <RulebookIcon /> RULEBOOK
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          {[["game", "BALLPARK"], ["roster", "ROSTER"], ["shop", "SHOP"], ["club", "FRONT OFFICE"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={tabBtn(tab === id)}>{label}</button>
          ))}
        </div>

        {tab === "game" && (
          <BallparkTab
            g={g} city={city} league={league} tier={tier} record={record} fans={fans}
            champ={champ} log={log} auto={auto} cityBonus={cityBonus} roster={roster}
            onSimStep={simStep} onToggleAuto={() => setAuto((a) => !a)}
            onStartGame={startGame} onPromote={promote}
          />
        )}

        {tab === "shop" && roster && (
          <ShopTab roster={roster} money={money} tier={tier} shopStock={shopStock} onBuy={buyGear} />
        )}

        {tab === "roster" && roster && (
          <RosterTab
            roster={roster} league={league} selected={selected} selectedId={selectedId} onSelect={setSelectedId}
            stat={stat} isStar={isStar} money={money} trainCost={trainCost} onTrain={train}
            lineupLocked={lineupLocked} onMoveBatter={moveBatter} onAutoLineup={autoLineup}
          />
        )}

        {tab === "club" && (
          <FrontOfficeTab
            roster={roster} city={city} league={league} tier={tier} fans={fans} money={money}
            merch={merch} tv={tv} champ={champ} isStar={isStar}
            onBuyMerch={buyMerch} onBuyTv={buyTv} onNewFranchise={newFranchise}
          />
        )}
      </div>
    </div>
  );
}
