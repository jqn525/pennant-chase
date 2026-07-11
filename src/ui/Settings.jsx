// ── Settings overlay: sound, the all-time franchise ledger, and the rulebook ──

import { C, LEAGUE } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { panel, btn, overlay, SLAB, MONO, PIXEL } from "./styles.js";
import { SoundOnIcon, SoundOffIcon, RulebookIcon } from "./Icons.jsx";

const num = (n) => Math.round(n || 0).toLocaleString();
const avg = (h, ab) => (ab ? (h / ab).toFixed(3).replace(/^0/, "") : ".000");
const ip = (outs) => `${Math.floor((outs || 0) / 3)}.${(outs || 0) % 3}`;

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 2px", borderBottom: `1px solid ${C.greenLine}33` }}>
      <span style={{ fontSize: 10, color: C.creamDim, letterSpacing: 1.5 }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.amber, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function Section({ title, rows }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: PIXEL, fontSize: 9, color: C.dirt, letterSpacing: 1, marginBottom: 4 }}>{title}</div>
      {rows.map(([label, value]) => <Row key={label} label={label} value={value} />)}
    </div>
  );
}

export default function Settings({ allTime: at, year, trophies, history, phase, sound, onToggleSound, onRules, onClose }) {
  const games = at.g || 0;
  const pct = games ? ((at.w || 0) / games).toFixed(3).replace(/^0/, "") : ".000";
  const playoffRuns = (history || []).filter((h) => h.finish <= LEAGUE.playoffTeams).length + (phase === "playoffs" ? 1 : 0);

  return (
    <div style={overlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...panel, maxWidth: 460, width: "100%", padding: 20, margin: "10px 0", borderColor: C.amber }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: SLAB, color: C.amber, fontSize: 20, margin: 0 }}>SETTINGS</h2>
          <button onClick={onClose} style={{ ...btn(true) }}>Close</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={onToggleSound}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", background: sound ? "#3A2E10" : "transparent", border: `1px solid ${sound ? C.amber : C.greenLine}`, borderRadius: 4, color: sound ? C.amber : C.creamDim, fontFamily: MONO, fontSize: 11, cursor: "pointer" }}>
            {sound ? <SoundOnIcon size={13} color={C.amber} /> : <SoundOffIcon size={13} />} SOUND {sound ? "ON" : "OFF"}
          </button>
          <button onClick={onRules}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", background: "transparent", border: `1px solid ${C.greenLine}`, borderRadius: 4, color: C.cream, fontFamily: MONO, fontSize: 11, cursor: "pointer" }}>
            <RulebookIcon size={13} /> RULEBOOK
          </button>
        </div>

        <Section title="ALL-TIME FRANCHISE" rows={[
          ["SEASONS", (history || []).length],
          ["GAMES", num(games)],
          ["RECORD", `${num(at.w)}-${num(at.l)}`],
          ["WIN PCT", pct],
          ["PENNANT CUPS", trophies],
          ["PLAYOFF RUNS", playoffRuns],
          ["TICKETS SOLD", num(at.tickets)],
        ]} />

        <Section title="ALL-TIME BATTING" rows={[
          ["AT BATS", num(at.ab)],
          ["HITS", num(at.h)],
          ["AVG", avg(at.h, at.ab)],
          ["DOUBLES", num(at.d)],
          ["TRIPLES", num(at.t)],
          ["HOME RUNS", num(at.hr)],
          ["RUNS", num(at.r)],
          ["RBI", num(at.rbi)],
          ["WALKS", num(at.bb)],
          ["STRIKEOUTS", num(at.k)],
        ]} />

        <Section title="ALL-TIME PITCHING" rows={[
          ["INNINGS", ip(at.outsP)],
          ["STRIKEOUTS", num(at.kP)],
          ["WALKS", num(at.bbP)],
          ["HITS ALLOWED", num(at.hP)],
          ["RUNS ALLOWED", num(at.raP)],
        ]} />

        <Section title="ALL-TIME FRONT OFFICE" rows={[
          ["MONEY EARNED", "$" + fmt(at.earned || 0)],
          ["MONEY SPENT", "$" + fmt(at.spent || 0)],
          ["CLUB UPGRADES", num(at.upgrades)],
          ["GEAR BOUGHT", num(at.gear)],
          ["TRADES MADE", num(at.trades)],
          ["ROOKIES SIGNED", num(at.rookies)],
          ["TRAINING SESSIONS", num(at.train)],
        ]} />
      </div>
    </div>
  );
}
