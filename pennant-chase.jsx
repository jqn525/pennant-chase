import { useState, useEffect, useRef, useCallback } from "react";

// ── PENNANT CHASE v2 ── text-based baseball team sim / incremental
// Draft a club in your chosen city, climb from Little League to the Majors.
// Every batted ball is a physics dice roll: spray angle, launch, distance,
// field geometry, defender reaction. SVG only, no emojis.

const C = {
  green: "#152E22",
  greenPanel: "#1D3C2C",
  greenLine: "#2C5540",
  cream: "#F2EDDC",
  creamDim: "#B9B49F",
  amber: "#FFB627",
  red: "#D9584A",
  dirt: "#C89B6C",
};

const fmt = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e4) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toLocaleString();
};

// ── SVG icons ──
const BallIcon = ({ size = 18, color = C.green }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M6 5.5 C 9 9, 9 15, 6 18.5" stroke={color} strokeWidth="1.6" strokeDasharray="2 2" />
    <path d="M18 5.5 C 15 9, 15 15, 18 18.5" stroke={color} strokeWidth="1.6" strokeDasharray="2 2" />
  </svg>
);
const StarIcon = ({ size = 12, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
  </svg>
);
const CoinIcon = ({ size = 12, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 7v10M9.5 9c0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7-1 1.5-2.5 1.9-2.5.9-2.5 1.9 1 1.7 2.5 1.7 2.5-.7 2.5-1.7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const FansIcon = ({ size = 12, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.8" />
    <circle cx="16.5" cy="9.5" r="2.4" stroke={color} strokeWidth="1.8" />
    <path d="M3 20c0-3 2.2-5 5-5s5 2 5 5M13.5 20c.2-2.4 1.6-4 3.5-4s3 1.6 3.2 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const RulebookIcon = ({ size = 16, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 4a2 2 0 0 1 2-2h12v18H7a2 2 0 0 0-2 2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M5 20a2 2 0 0 1 2-2h12" stroke={color} strokeWidth="1.8" />
    <path d="M10 7h6M10 10h6M10 13h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// ── Content tables ──
const FIRST = ["Ace", "Dutch", "Lefty", "Mo", "Ry", "Cal", "Boog", "Vida", "Sal", "Iz", "Tuck", "Roxie", "Gus", "Pep", "Bo", "Nix", "Sky", "Duke", "Wren", "Marta"];
const LAST = ["Delgado", "Okafor", "Marsh", "Ishida", "Kowalski", "Bell", "Fontaine", "Rojas", "Whitlock", "Nakamura", "Pryor", "Vance", "Otero", "Grimm", "Holloway", "Sato", "Reyes", "Byrd", "Castellan", "Mbeki"];

const CITIES = [
  { name: "Sacramento", bonus: "fans", label: "Hungry market: +25% fan growth" },
  { name: "Nashville", bonus: "merch", label: "Merch city: merchandise pays +30%" },
  { name: "Portland", bonus: "train", label: "Player development hub: training costs -15%" },
  { name: "San Antonio", bonus: "gate", label: "Big gates: +25% game payouts" },
  { name: "Buffalo", bonus: "floor", label: "Loyal diehards: money floor doubled on losses" },
  { name: "Montreal", bonus: "fans", label: "Baseball-starved: +25% fan growth" },
];

const TRAITS = [
  { id: "sluggers", label: "HR Sluggers", desc: "big power, thin averages", mod: { power: 3, contact: -2 } },
  { id: "gloves", label: "Defensive Wizards", desc: "weak bats, elite gloves", mod: { defense: 3, power: -2 } },
  { id: "smallball", label: "Small Ball", desc: "speed and contact, no pop", mod: { speed: 3, contact: 1, power: -3 } },
  { id: "aces", label: "Pitching Factory", desc: "nasty stuff on the mound", mod: { stuff: 3 } },
  { id: "patient", label: "Grinders", desc: "they work every count", mod: { eye: 3, power: -1 } },
  { id: "balanced", label: "Well Drilled", desc: "no weaknesses, no stars", mod: { contact: 1, defense: 1 } },
];

const OPP_NAMES = ["River Cats", "Mudhens", "Growlers", "Sock Puppets", "Steel", "Bisons", "Comets", "Sandgnats", "Thunderheads", "Ospreys", "Copperheads", "Night Owls"];

const LEAGUES = [
  { name: "Little League", statBase: 2, winsNeeded: 3, payWin: 25, payFloor: 8, fansPerWin: 12, innings: 3, fenceCorner: 130, fenceCenter: 175 },
  { name: "High School Ball", statBase: 4, winsNeeded: 4, payWin: 60, payFloor: 20, fansPerWin: 30, innings: 3, fenceCorner: 190, fenceCenter: 250 },
  { name: "Single-A", statBase: 7, winsNeeded: 5, payWin: 160, payFloor: 55, fansPerWin: 70, innings: 5, fenceCorner: 270, fenceCenter: 340 },
  { name: "Triple-A", statBase: 10, winsNeeded: 6, payWin: 420, payFloor: 140, fansPerWin: 160, innings: 5, fenceCorner: 315, fenceCenter: 390 },
  { name: "Major League", statBase: 14, winsNeeded: 8, payWin: 1100, payFloor: 350, fansPerWin: 420, innings: 7, fenceCorner: 330, fenceCenter: 410 },
];

const POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"];
const BAT_STATS = ["contact", "power", "eye", "speed", "defense"];
const PIT_STATS = ["stuff", "control", "stamina", "defense"];
const STAT_INFO = {
  contact: "Hit chance on any swing",
  power: "Exit distance; drives extra-base hits and homers",
  eye: "Walk chance; avoids strikeouts a little",
  speed: "Stretching hits, taking extra bases",
  defense: "Chance to convert balls in their zone into outs",
  stuff: "Strikeout chance against enemy batters",
  control: "Suppresses walks",
  stamina: "Batters faced before tiring (reliever enters)",
};

let uid = 1;
const rname = () => FIRST[(Math.random() * FIRST.length) | 0] + " " + LAST[(Math.random() * LAST.length) | 0];
const jitter = (base, spread = 1.5) => Math.max(1, Math.round(base + (Math.random() * 2 - 1) * spread));

const genBatter = (pos, base) => ({
  id: uid++, name: rname(), pos, role: "bat",
  contact: jitter(base), power: jitter(base), eye: jitter(base), speed: jitter(base), defense: jitter(base),
  pull: (Math.random() * 1.2 - 0.6), // negative = pulls left, positive = slices right
});
const genPitcher = (pos, base) => ({
  id: uid++, name: rname(), pos, role: pos,
  stuff: jitter(base), control: jitter(base), stamina: jitter(base), defense: jitter(base),
});
const genRoster = (base) => ({
  batters: POSITIONS.map((p) => genBatter(p, base)),
  sp: genPitcher("SP", base),
  rp: genPitcher("RP", Math.max(1, base - 1)),
});
const genOpponent = (tier) => {
  const trait = TRAITS[(Math.random() * TRAITS.length) | 0];
  const base = LEAGUES[tier].statBase;
  const m = trait.mod;
  const b = (k) => Math.max(1, jitter(base) + (m[k] || 0));
  return {
    name: OPP_NAMES[(Math.random() * OPP_NAMES.length) | 0],
    trait,
    batters: POSITIONS.map((p) => ({
      id: uid++, name: rname(), pos: p, role: "bat",
      contact: b("contact"), power: b("power"), eye: b("eye"), speed: b("speed"), defense: b("defense"),
      pull: (Math.random() * 1.2 - 0.6),
    })),
    sp: { id: uid++, name: rname(), pos: "SP", role: "SP", stuff: b("stuff"), control: b("control"), stamina: jitter(base), defense: b("defense") },
  };
};

// ── The batted-ball engine ──
// Returns a rich outcome object; caller applies it to game state.
const gauss = () => (Math.random() + Math.random() + Math.random()) / 3; // 0..1 centered

function resolveAtBat(batter, pitcher, fielders, fence) {
  const kChance = Math.min(0.55, Math.max(0.05, 0.10 + pitcher.stuff * 0.018 - batter.contact * 0.011 - batter.eye * 0.003));
  const bbChance = Math.min(0.3, Math.max(0.02, 0.05 + batter.eye * 0.014 - pitcher.control * 0.010));
  const r = Math.random();
  if (r < kChance) return { type: "K", text: `strikes out swinging.` };
  if (r < kChance + bbChance) return { type: "BB", text: `works a walk.` };

  // Ball in play — up to 3 foul re-rolls
  for (let attempt = 0; attempt < 3; attempt++) {
    // Spray angle: 0 = dead center, -45/+45 = foul lines. Pull skews it.
    const spray = (gauss() * 2 - 1) * 55 + batter.pull * 18;
    // Launch profile
    const lr = Math.random();
    const launch = lr < 0.38 ? "ground" : lr < 0.7 ? "liner" : "fly";
    // Distance from power
    const pow = batter.power;
    const dist = launch === "ground"
      ? 40 + gauss() * 110
      : launch === "liner"
        ? 70 + pow * 11 + gauss() * 90
        : 90 + pow * 13 + gauss() * 110;

    const side = spray < 0 ? "left" : "right";
    const deg = Math.abs(spray).toFixed(0);

    if (Math.abs(spray) > 45) {
      // Foul territory
      if (launch !== "ground" && Math.random() < 0.22) {
        const f = Math.abs(spray) > 50 ? "into the seats — but the corner man tracks it down" : "popped up in foul ground";
        return { type: "OUT", text: `lifts one ${deg}° ${side} — ${f}. Out.`, foulOut: true };
      }
      continue; // foul ball, swing again
    }

    // Fair ball. Fence distance at this angle (shallow at corners, deep in center)
    const fenceHere = fence.center - (fence.center - fence.corner) * (Math.abs(spray) / 45);
    if (launch !== "ground" && dist > fenceHere) {
      return { type: "HR", text: `CRUSHES it ${deg}° ${side}-${Math.abs(spray) < 12 ? "center" : "field"}, ${dist.toFixed(0)} ft — over the ${fenceHere.toFixed(0)}-ft fence, GONE!`, dist };
    }

    // Pick the responsible fielder by zone
    const infield = dist < fenceHere * 0.45;
    let fielderPos;
    if (infield) {
      fielderPos = spray < -22 ? "3B" : spray < -4 ? "SS" : spray < 14 ? "2B" : "1B";
      if (dist < 55) fielderPos = Math.random() < 0.5 ? "C" : fielderPos;
    } else {
      fielderPos = spray < -15 ? "LF" : spray < 15 ? "CF" : "RF";
    }
    const fielder = fielders.find((f) => f.pos === fielderPos) || fielders[0];

    const catchBase = launch === "ground" ? (infield ? 0.58 : 0.1) : launch === "fly" ? (infield ? 0.75 : 0.5) : 0.24;
    const catchChance = Math.min(0.95, catchBase + fielder.defense * 0.03);
    const desc = launch === "ground" ? "grounder" : launch === "liner" ? "sharp liner" : "fly ball";

    if (Math.random() < catchChance) {
      return { type: "OUT", text: `hits a ${desc} ${deg}° ${side}, ${dist.toFixed(0)} ft — ${fielder.name} (${fielderPos}) makes the play.` };
    }

    // It's a hit. Bases from depth + speed.
    const deep = dist > fenceHere * 0.72;
    const gapper = dist > fenceHere * 0.58 && launch !== "ground";
    let bases = 1;
    if (deep && Math.random() < 0.35 + batter.speed * 0.03) bases = 3;
    else if (gapper || Math.random() < batter.speed * 0.02) bases = 2;
    const call = bases === 3 ? "it rolls to the wall — TRIPLE!" : bases === 2 ? `past ${fielder.name} — stand-up double.` : `drops in front of ${fielder.name} (${fielderPos}) for a single.`;
    return { type: "HIT", bases, text: `laces a ${desc} ${deg}° ${side}, ${dist.toFixed(0)} ft — ${call}`, dist };
  }
  return { type: "OUT", text: `fouls off a third straight pitch, then pops out to the catcher.` };
}

export default function PennantChase() {
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
  const ba = (s) => (s.ab ? (s.h / s.ab).toFixed(3).replace(/^0/, "") : "—");
  const kpct = (s) => (s.ab ? ((s.k / s.ab) * 100).toFixed(0) + "%" : "—");
  const isStar = (p) => p.role === "bat" ? (p.contact + p.power + p.eye + p.speed) / 4 >= 8 : (p.stuff + p.control) / 2 >= 8;

  const g = gameRef.current;
  const selected = roster ? [...roster.batters, roster.sp, roster.rp].find((p) => p.id === selectedId) : null;

  // ── styles ──
  const bulb = { fontFamily: "'IBM Plex Mono', monospace", color: C.amber, textShadow: `0 0 12px ${C.amber}55` };
  const panel = { background: C.greenPanel, border: `1px solid ${C.greenLine}`, borderRadius: 6 };
  const btn = (enabled) => ({
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "8px 10px", borderRadius: 4,
    border: `1px solid ${enabled ? C.amber : C.greenLine}`,
    background: enabled ? "#3A2E10" : "transparent",
    color: enabled ? C.amber : C.creamDim,
    cursor: enabled ? "pointer" : "default", opacity: enabled ? 1 : 0.55, textAlign: "left",
  });
  const tabBtn = (active) => ({
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 1, padding: "8px 14px",
    background: active ? C.greenPanel : "transparent", color: active ? C.amber : C.creamDim,
    border: `1px solid ${active ? C.amber : C.greenLine}`, borderBottom: active ? `1px solid ${C.greenPanel}` : `1px solid ${C.greenLine}`,
    borderRadius: "6px 6px 0 0", cursor: "pointer",
  });
  const overlay = { position: "fixed", inset: 0, background: "#0A1810E6", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, zIndex: 50, overflowY: "auto" };

  // ── City selection screen ──
  if (!city) {
    return (
      <div style={{ minHeight: "100vh", background: C.green, color: C.cream, fontFamily: "'IBM Plex Mono', monospace", padding: 16 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=IBM+Plex+Mono:wght@400;600&display=swap');
          button:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }`}</style>
        <div style={{ maxWidth: 720, margin: "40px auto", textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Alfa Slab One', serif", fontSize: 30, letterSpacing: 1 }}>
            PENNANT<span style={{ color: C.amber }}> CHASE</span>
          </h1>
          <p style={{ color: C.creamDim, fontSize: 13 }}>
            Found a club. Start in Little League. Claw your way to the Majors.
            Pick your city — each comes with a permanent edge.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 20 }}>
            {CITIES.map((c) => (
              <button key={c.name} onClick={() => foundClub(c)}
                style={{ ...panel, borderColor: C.amber, padding: 16, width: 210, cursor: "pointer", color: C.cream, fontFamily: "'IBM Plex Mono', monospace", textAlign: "left" }}>
                <div style={{ fontFamily: "'Alfa Slab One', serif", fontSize: 16, color: C.amber, marginBottom: 6 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: C.creamDim, lineHeight: 1.5 }}>{c.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.green, color: C.cream, fontFamily: "'IBM Plex Mono', monospace", padding: 16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=IBM+Plex+Mono:wght@400;600&display=swap');
        button:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }`}</style>

      {/* Rulebook overlay */}
      {showHelp && (
        <div style={overlay} onClick={() => setShowHelp(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...panel, maxWidth: 700, width: "100%", padding: 20, margin: "10px 0", borderColor: C.amber }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "'Alfa Slab One', serif", color: C.amber, fontSize: 20, margin: 0 }}>THE RULEBOOK</h2>
              <button onClick={() => setShowHelp(false)} style={{ ...btn(true) }}>Close</button>
            </div>
            {[
              ["THE CLIMB", ["Play games against generated opponents. Win enough in each league to claim the pennant and get promoted: Little League, High School, Single-A, Triple-A, and finally the Majors. Fences get deeper and arms get nastier every level."]],
              ["HOW EVERY PITCH RESOLVES", [
                "1. Strikeout roll — pitcher Stuff vs batter Contact (Eye helps a little).",
                "2. Walk roll — batter Eye vs pitcher Control.",
                "3. Ball in play: the engine rolls a spray angle (0° = dead center, ±45° = the foul lines; each batter has a hidden pull tendency that skews it), a launch type (grounder / liner / fly), and a distance driven by Power.",
                "4. Past ±45° is foul territory — usually just a do-over, sometimes caught for an out.",
                "5. Clear the fence at that angle and it's gone. The wall is shallow at the corners, deep in center.",
                "6. Otherwise the fielder in that zone rolls their Defense to make the play. Grounders die in the infield, flies get run down, liners are hardest to catch.",
                "7. On a hit, depth plus batter Speed decides single, double, or triple. Runners advance station to station.",
              ]],
              ["YOUR ROSTER", ["Nine position players, one starter, one reliever. Everyone has individual attributes — tap a player in the Roster tab to train them with money. Your starter tires after facing enough batters (Stamina); the reliever takes over automatically.", "BA and K% shown are real season stats, accumulated from actual at-bats."]],
              ["MONEY AND FANS", ["Wins pay gate receipts scaled by your fan base; losses still pay a floor (the diehards show up). Fans grow with wins and home runs.", "At 200 fans you can open the merch stand — passive income every second, boosted by star players (any player averaging 8+ in their attributes sells jerseys). In Triple-A, a TV deal triples it."]],
              ["OPPONENTS", ["Every opponent team is generated with a trait — HR Sluggers, Defensive Wizards, Small Ball, Pitching Factory, Grinders — that shapes their stats. Their batted balls run through the same physics engine as yours."]],
            ].map(([t, ps]) => (
              <div key={t} style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, color: C.dirt, letterSpacing: 2, marginBottom: 6 }}>{t}</div>
                {ps.map((p, i) => <p key={i} style={{ fontSize: 12, lineHeight: 1.6, margin: "0 0 6px" }}>{p}</p>)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ ...panel, padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "baseline", borderBottom: `3px solid ${C.amber}` }}>
          <h1 style={{ fontFamily: "'Alfa Slab One', serif", fontSize: 20, margin: 0 }}>
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
          <button onClick={() => setShowHelp(true)} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.greenLine}`, borderRadius: 4, color: C.cream, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>
            <RulebookIcon /> RULEBOOK
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          {[["game", "BALLPARK"], ["roster", "ROSTER"], ["club", "FRONT OFFICE"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={tabBtn(tab === id)}>{label}</button>
          ))}
        </div>

        {/* ── BALLPARK TAB ── */}
        {tab === "game" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 2 }}>
            <div style={{ flex: "2 1 400px", minWidth: 300 }}>
              {/* Line score — fixed-size scoreboard, never reflows */}
              <div style={{ ...panel, padding: 12, height: 132, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
                {/* Row 1: status line (fixed height) */}
                <div style={{ fontSize: 12, height: 16, display: "flex", gap: 14, whiteSpace: "nowrap" }}>
                  <span style={{ color: C.creamDim, width: 64 }}>{g && !g.over ? `${g.half === "top" ? "TOP" : "BOT"} ${g.inning}` : "PREGAME"}</span>
                  <span style={{ width: 64 }}>{g && !g.over ? `${g.outs} OUT${g.outs === 1 ? "" : "S"}` : "\u00A0"}</span>
                  <span style={{ color: C.creamDim, marginLeft: "auto" }}>PENNANT {record.w}/{league.winsNeeded}</span>
                </div>

                {/* Row 2: two-line score grid + diamond (fixed columns) */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, height: 52 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {[
                      [g ? g.opp.name : "VISITORS", g ? g.them : "\u2013", g && g.half === "top" && !g.over],
                      [city.name, g ? g.us : "\u2013", g && g.half === "bottom" && !g.over],
                    ].map(([name, score, atBat], i) => (
                      <div key={i} style={{ display: "flex", alignItems: "baseline", height: 26 }}>
                        <span style={{ width: 10, color: C.amber, fontSize: 11 }}>{atBat ? "\u25B8" : "\u00A0"}</span>
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14, color: i === 1 ? C.cream : C.creamDim }}>{name}</span>
                        <span style={{ ...bulb, fontSize: 19, fontWeight: 600, width: 56, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{score}</span>
                      </div>
                    ))}
                  </div>
                  <svg width="46" height="46" viewBox="0 0 46 46" aria-label="bases" style={{ flexShrink: 0 }}>
                    {[[23, 6, g && !g.over && g.bases[1]], [40, 23, g && !g.over && g.bases[0]], [6, 23, g && !g.over && g.bases[2]]].map(([x, y, occ], i) => (
                      <rect key={i} x={x - 5} y={y - 5} width="10" height="10" transform={`rotate(45 ${x} ${y})`}
                        fill={occ ? C.amber : "none"} stroke={C.creamDim} strokeWidth="1.5" />
                    ))}
                    <rect x={18} y={35} width="10" height="10" transform="rotate(45 23 40)" fill="none" stroke={C.creamDim} strokeWidth="1.5" />
                  </svg>
                </div>

                {/* Row 3: controls (fixed height, buttons swap in place) */}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", height: 34 }}>
                  {g && !g.over ? (
                    <>
                      <button style={{ ...btn(true), width: 130, textAlign: "center" }} onClick={simStep}>Next at-bat</button>
                      <button style={{ ...btn(true), width: 110, textAlign: "center" }} onClick={() => setAuto((a) => !a)}>{auto ? "Pause" : "Auto-sim"}</button>
                    </>
                  ) : (
                    <>
                      {record.w >= league.winsNeeded && !champ && (
                        <button style={{ ...btn(true), borderColor: C.dirt, color: C.dirt, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 220 }} onClick={promote}>
                          {tier >= LEAGUES.length - 1 ? "Win the World Series" : `Claim pennant → ${LEAGUES[tier + 1].name}`}
                        </button>
                      )}
                      <button style={{ ...btn(true), width: 150, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Alfa Slab One', serif", fontSize: 14 }} onClick={startGame}>
                        <BallIcon color={C.amber} size={16} /> PLAY BALL
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Play-by-play */}
              <div style={{ ...panel, padding: 12, marginTop: 10, height: 360, overflowY: "auto" }}>
                <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>RADIO CALL · PLAY-BY-PLAY</div>
                {log.map((l) => (
                  <div key={l.id} style={{
                    fontSize: 12, lineHeight: 1.5, padding: "4px 0", borderBottom: `1px solid ${C.greenLine}44`,
                    color: l.kind === "out" ? C.creamDim : l.kind === "hr" ? C.amber : l.kind === "win" ? C.dirt : l.kind === "sys" ? C.creamDim : C.cream,
                    fontStyle: l.kind === "sys" ? "italic" : "normal",
                  }}>{l.text}</div>
                ))}
              </div>
            </div>

            {/* Park info */}
            <div style={{ flex: "1 1 260px", minWidth: 240 }}>
              <div style={{ ...panel, padding: 12 }}>
                <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>THIS LEAGUE</div>
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  {league.name}<br />
                  Fences: {league.fenceCorner} ft corners, {league.fenceCenter} ft center<br />
                  {league.innings} innings per game<br />
                  Win: ~${fmt(league.payWin * (1 + fans / 1000))} · Loss floor: ${fmt(league.payFloor * (cityBonus("floor") ? 2 : 1))}<br />
                  Pennant at {league.winsNeeded} wins
                </div>
              </div>
              {g && !g.over && (
                <div style={{ ...panel, padding: 12, marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>OPPONENT SCOUT</div>
                  <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                    {g.opp.name} — <span style={{ color: C.amber }}>{g.opp.trait.label}</span><br />
                    <span style={{ color: C.creamDim }}>{g.opp.trait.desc}</span><br />
                    Their ace: {g.opp.sp.name} (Stuff {g.opp.sp.stuff}, Control {g.opp.sp.control})
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ROSTER TAB ── */}
        {tab === "roster" && roster && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 2 }}>
            <div style={{ flex: "1 1 380px", minWidth: 300 }}>
              <div style={{ ...panel, padding: 12 }}>
                <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>
                  LINEUP · tap to train · BA / K% are live season stats
                </div>
                {[...roster.batters, roster.sp, roster.rp].map((p) => {
                  const s = stat(p.id);
                  const sel = selectedId === p.id;
                  return (
                    <button key={p.id} onClick={() => setSelectedId(p.id)}
                      style={{ ...btn(true), width: "100%", marginBottom: 4, borderColor: sel ? C.amber : C.greenLine, background: sel ? "#3A2E10" : "transparent", color: C.cream, display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ width: 26, color: C.creamDim }}>{p.pos}</span>
                      <span style={{ fontWeight: 600, flex: 1, display: "flex", alignItems: "center", gap: 5 }}>
                        {p.name}{isStar(p) && <StarIcon />}
                      </span>
                      {p.role === "bat"
                        ? <span style={{ fontSize: 11, color: C.creamDim }}>BA {ba(s)} · K {kpct(s)} · HR {s.hr}</span>
                        : <span style={{ fontSize: 11, color: C.creamDim }}>Stuff {p.stuff} · Ctl {p.control} · Sta {p.stamina}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ flex: "1 1 300px", minWidth: 260 }}>
              {selected ? (
                <div style={{ ...panel, padding: 12 }}>
                  <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>
                    TRAINING · {selected.name} ({selected.pos})
                  </div>
                  {selected.role === "bat" && (
                    <div style={{ fontSize: 11, color: C.creamDim, marginBottom: 8 }}>
                      Spray tendency: {Math.abs(selected.pull) < 0.15 ? "sprays it everywhere" : selected.pull < 0 ? `pulls left (${(Math.abs(selected.pull) * 100).toFixed(0)}%)` : `slices right (${(selected.pull * 100).toFixed(0)}%)`}
                    </div>
                  )}
                  {(selected.role === "bat" ? BAT_STATS : PIT_STATS).map((k) => {
                    const cost = trainCost(selected, k);
                    const ok = money >= cost;
                    return (
                      <button key={k} onClick={() => train(selected.id, k)} style={{ ...btn(ok), width: "100%", marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{k} {selected[k]}</span> → ${fmt(cost)}
                        <div style={{ fontSize: 10, color: C.creamDim }}>{STAT_INFO[k]}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ ...panel, padding: 12, fontSize: 12, color: C.creamDim }}>
                  Select a player to see attributes and train them with money.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FRONT OFFICE TAB ── */}
        {tab === "club" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 2 }}>
            <div style={{ flex: "1 1 300px", minWidth: 280 }}>
              <div style={{ ...panel, padding: 12 }}>
                <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>REVENUE STREAMS</div>
                <button onClick={buyMerch} style={{ ...btn(!merch && money >= 150 && fans >= 200), width: "100%", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><CoinIcon /> Merch stand {merch ? "· OPEN" : ""}</span>
                  {!merch && <div style={{ fontSize: 10, color: C.creamDim }}>$150 + 200 fans. Passive income every second; each star player boosts it 60%.</div>}
                  {merch && <div style={{ fontSize: 10, color: C.creamDim }}>Selling jerseys. Stars on the roster: {[...roster.batters, roster.sp, roster.rp].filter(isStar).length}</div>}
                </button>
                <button onClick={buyTv} style={{ ...btn(!tv && merch && tier >= 3 && money >= 2500), width: "100%" }}>
                  <span style={{ fontWeight: 600 }}>Regional TV deal {tv ? "· SIGNED" : ""}</span>
                  {!tv && <div style={{ fontSize: 10, color: C.creamDim }}>$2,500 · requires Triple-A and a merch stand. Triples passive income.</div>}
                </button>
              </div>
            </div>
            <div style={{ flex: "1 1 300px", minWidth: 280 }}>
              <div style={{ ...panel, padding: 12, fontSize: 12, lineHeight: 1.8 }}>
                <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>THE CLUB</div>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FansIcon /> {fmt(fans)} fans in {city.name}</span>
                City edge: {city.label}<br />
                League: {league.name} ({tier + 1}/{LEAGUES.length})<br />
                {champ ? "World Series Champions." : `Path: ${LEAGUES.slice(tier).map((l) => l.name).join(" → ")}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
