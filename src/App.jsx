// ── PENNANT CHASE v2 ── text-based baseball team sim / incremental
// Draft a club in your chosen city, climb from Little League to the Majors.
// This component owns all game state; the simulation math lives in src/game/
// and the screens live in src/ui/.

import { useState, useEffect, useRef, useCallback } from "react";
import { C, LEAGUES } from "./game/constants.js";
import { fmt } from "./game/utils.js";
import { genRoster, genOpponent } from "./game/generators.js";
import { resolveAtBat } from "./game/atBat.js";
import { panel, bulb, tabBtn, globalCss, MONO, SLAB } from "./ui/styles.js";
import { RulebookIcon } from "./ui/Icons.jsx";
import CitySelect from "./ui/CitySelect.jsx";
import Rulebook from "./ui/Rulebook.jsx";
import BallparkTab from "./ui/BallparkTab.jsx";
import RosterTab from "./ui/RosterTab.jsx";
import FrontOfficeTab from "./ui/FrontOfficeTab.jsx";

export default function App() {
  // ── Club state ──
  const [city, setCity] = useState(null);
  const [money, setMoney] = useState(60);
  const [fans, setFans] = useState(25);
  const [tier, setTier] = useState(0);
  const [record, setRecord] = useState({ w: 0, l: 0 });
  const [roster, setRoster] = useState(null);
  const [merch, setMerch] = useState(false);
  const [tv, setTv] = useState(false);
  const [champ, setChamp] = useState(false);
  const [seasonStats, setSeasonStats] = useState({}); // id -> {ab,h,k,hr,bb}
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

  const pushLog = useCallback((text, kind = "play") => {
    setLog((l) => [{ id: idRef.current++, text, kind }, ...l].slice(0, 40));
  }, []);

  const bumpStat = (pid, key, n = 1) => {
    setSeasonStats((s) => {
      const cur = s[pid] || { ab: 0, h: 0, k: 0, hr: 0, bb: 0 };
      return { ...s, [pid]: { ...cur, [key]: cur[key] + n } };
    });
  };

  // ── Setup ──
  const foundClub = (c) => {
    setCity(c);
    setRoster(genRoster(2));
    pushLog(`The ${c.name} franchise is founded. ${c.label}. First stop: ${LEAGUES[0].name}.`, "sys");
  };

  // ── Economy tick (merch / TV passive income) ──
  useEffect(() => {
    if (!merch || !roster) return;
    const iv = setInterval(() => {
      const stars = roster.batters.filter((b) => (b.contact + b.power + b.eye + b.speed) / 4 >= 8).length
        + ((roster.sp.stuff + roster.sp.control) / 2 >= 8 ? 1 : 0);
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
  };

  const simStep = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.over || !roster) return;

    const weBat = g.half === "bottom";
    const batters = weBat ? roster.batters : g.opp.batters;
    const idx = weBat ? g.usIdx : g.themIdx;
    const batter = batters[idx % 9];

    let pitcher;
    if (weBat) pitcher = g.opp.sp;
    else {
      const limit = 8 + roster.sp.stamina * 2;
      if (!g.usingRP && g.spFaced >= limit) {
        g.usingRP = true;
        pushLog(`${roster.sp.name} is gassed after ${g.spFaced} batters. ${roster.rp.name} jogs in from the pen.`, "sys");
      }
      pitcher = g.usingRP ? roster.rp : roster.sp;
      g.spFaced++;
    }
    const fielders = weBat
      ? [...g.opp.batters, { ...g.opp.sp }]
      : [...roster.batters, { ...(g.usingRP ? roster.rp : roster.sp) }];

    const out = resolveAtBat(batter, pitcher, fielders, { corner: league.fenceCorner, center: league.fenceCenter });
    const who = `${batter.name} (${batter.pos})`;
    const teamTag = weBat ? "" : `[${g.opp.name}] `;

    // Track real season stats for OUR players
    const track = weBat;
    if (out.type === "K") {
      if (track) { bumpStat(batter.id, "ab"); bumpStat(batter.id, "k"); }
      g.outs++;
      pushLog(`${teamTag}${who} ${out.text}`, weBat ? "out" : "play");
    } else if (out.type === "BB") {
      if (track) bumpStat(batter.id, "bb");
      // force runners
      if (g.bases[0] && g.bases[1] && g.bases[2]) { weBat ? g.us++ : g.them++; }
      if (g.bases[0] && g.bases[1]) g.bases[2] = g.bases[2] || g.bases[1];
      if (g.bases[0]) g.bases[1] = g.bases[1] || g.bases[0];
      g.bases[0] = batter;
      pushLog(`${teamTag}${who} ${out.text}`, "play");
    } else if (out.type === "OUT") {
      if (track) bumpStat(batter.id, "ab");
      g.outs++;
      pushLog(`${teamTag}${who} ${out.text}`, weBat ? "out" : "play");
    } else {
      // HR or HIT
      if (track) { bumpStat(batter.id, "ab"); bumpStat(batter.id, "h"); }
      let runs = 0;
      if (out.type === "HR") {
        if (track) bumpStat(batter.id, "hr");
        runs = 1 + g.bases.filter(Boolean).length;
        g.bases = [null, null, null];
        if (weBat) g.hrUs++;
      } else {
        const b = out.bases;
        const scored = [];
        for (let i = 2; i >= 0; i--) {
          if (!g.bases[i]) continue;
          if (i + b >= 3) { scored.push(g.bases[i]); g.bases[i] = null; }
          else { g.bases[i + b] = g.bases[i]; g.bases[i] = null; }
        }
        runs = scored.length;
        g.bases[b - 1] = batter;
      }
      if (runs) { weBat ? (g.us += runs) : (g.them += runs); }
      pushLog(`${teamTag}${who} ${out.text}${runs ? ` ${runs} run${runs > 1 ? "s" : ""} score${runs > 1 ? "" : "s"}!` : ""}`, out.type === "HR" ? "hr" : "play");
    }

    if (weBat) g.usIdx = (idx + 1) % 9; else g.themIdx = (idx + 1) % 9;

    // Walk-off check
    if (weBat && g.inning >= league.innings && g.us > g.them) { endGame(g); rerender(); return; }

    if (g.outs >= 3) {
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
    setTier((t) => t + 1);
    setRecord({ w: 0, l: 0 });
    gameRef.current = null;
  };
  const buyMerch = () => {
    if (money >= 150 && fans >= 200) { setMoney((m) => m - 150); setMerch(true); pushLog("Merch stand opens. Jersey sales tick in every second — stars sell more.", "win"); }
  };
  const buyTv = () => {
    if (money >= 2500 && tier >= 3 && merch) { setMoney((m) => m - 2500); setTv(true); pushLog("Regional TV deal signed. Merch and media income tripled.", "win"); }
  };

  const stat = (id) => seasonStats[id] || { ab: 0, h: 0, k: 0, hr: 0, bb: 0 };
  const isStar = (p) => p.role === "bat" ? (p.contact + p.power + p.eye + p.speed) / 4 >= 8 : (p.stuff + p.control) / 2 >= 8;

  const g = gameRef.current;
  const selected = roster ? [...roster.batters, roster.sp, roster.rp].find((p) => p.id === selectedId) : null;

  // ── City selection screen ──
  if (!city) return <CitySelect onPick={foundClub} />;

  return (
    <div style={{ minHeight: "100vh", background: C.green, color: C.cream, fontFamily: MONO, padding: 16 }}>
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
          ].map(([l, v, w]) => (
            <div key={l} style={{ width: w, flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2 }}>{l}</div>
              <div style={{ ...bulb, fontSize: 17, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontVariantNumeric: "tabular-nums" }}>{v}</div>
            </div>
          ))}
          <button onClick={() => setShowHelp(true)} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.greenLine}`, borderRadius: 4, color: C.cream, fontFamily: MONO, fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>
            <RulebookIcon /> RULEBOOK
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          {[["game", "BALLPARK"], ["roster", "ROSTER"], ["club", "FRONT OFFICE"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={tabBtn(tab === id)}>{label}</button>
          ))}
        </div>

        {tab === "game" && (
          <BallparkTab
            g={g} city={city} league={league} tier={tier} record={record} fans={fans}
            champ={champ} log={log} auto={auto} cityBonus={cityBonus}
            onSimStep={simStep} onToggleAuto={() => setAuto((a) => !a)}
            onStartGame={startGame} onPromote={promote}
          />
        )}

        {tab === "roster" && roster && (
          <RosterTab
            roster={roster} selected={selected} selectedId={selectedId} onSelect={setSelectedId}
            stat={stat} isStar={isStar} money={money} trainCost={trainCost} onTrain={train}
          />
        )}

        {tab === "club" && (
          <FrontOfficeTab
            roster={roster} city={city} league={league} tier={tier} fans={fans} money={money}
            merch={merch} tv={tv} champ={champ} isStar={isStar}
            onBuyMerch={buyMerch} onBuyTv={buyTv}
          />
        )}
      </div>
    </div>
  );
}
