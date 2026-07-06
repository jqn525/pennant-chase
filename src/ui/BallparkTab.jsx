// ── Ballpark tab: scoreboard, controls, play-by-play, live game stats, park info ──

import { C, LEAGUES } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { panel, btn, bulb, SLAB } from "./styles.js";
import { BallIcon } from "./Icons.jsx";
import StatTable from "./StatTable.jsx";

const abbrev = (name) => name.slice(0, 3).toUpperCase();

// One Apple-Sports-style comparison row: visitors on the left, our club on the right
function CompareRow({ label, a, b }) {
  const max = Math.max(a, b, 1);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ width: 34 }}>{a}</span>
        <span style={{ flex: 1, textAlign: "center", fontSize: 10, letterSpacing: 1.5, color: C.creamDim }}>{label}</span>
        <span style={{ width: 34, textAlign: "right" }}>{b}</span>
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: `${(a / max) * 100}%`, height: 3, background: C.creamDim, borderRadius: 2 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ width: `${(b / max) * 100}%`, height: 3, background: C.amber, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

const EMPTY_LINE = { ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, k: 0, r: 0, rbi: 0 };

export default function BallparkTab({ g, city, league, tier, record, fans, champ, log, auto, cityBonus, roster, onSimStep, onToggleAuto, onStartGame, onPromote }) {
  const box = g?.box;
  const total = (side, key) => Object.values(box[side]).reduce((n, line) => n + line[key], 0);
  const gameRows = (batters, side) => batters.map((p) => {
    const s = box[side][p.id] || EMPTY_LINE;
    return { p, cells: [s.ab, s.r, s.h, s.hr, s.rbi, s.bb, s.k], dim: !s.ab && !s.bb };
  });
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 2 }}>
      <div style={{ flex: "2 1 400px", minWidth: 300 }}>
        {/* Line score — fixed-size scoreboard, never reflows */}
        <div style={{ ...panel, padding: 12, height: 132, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
          {/* Row 1: status line (fixed height) */}
          <div style={{ fontSize: 12, height: 16, display: "flex", gap: 14, whiteSpace: "nowrap" }}>
            <span style={{ color: C.creamDim, width: 64 }}>{g && !g.over ? `${g.half === "top" ? "TOP" : "BOT"} ${g.inning}` : "PREGAME"}</span>
            <span style={{ width: 64 }}>{g && !g.over ? `${g.outs} OUT${g.outs === 1 ? "" : "S"}` : " "}</span>
            <span style={{ color: C.creamDim, marginLeft: "auto" }}>PENNANT {record.w}/{league.winsNeeded}</span>
          </div>

          {/* Row 2: two-line score grid + diamond (fixed columns) */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 52 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {[
                [g ? g.opp.name : "VISITORS", g ? g.them : "–", g && g.half === "top" && !g.over],
                [city.name, g ? g.us : "–", g && g.half === "bottom" && !g.over],
              ].map(([name, score, atBat], i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", height: 26 }}>
                  <span style={{ width: 10, color: C.amber, fontSize: 11 }}>{atBat ? "▸" : " "}</span>
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
                <button style={{ ...btn(true), width: 130, textAlign: "center" }} onClick={onSimStep}>Next at-bat</button>
                <button style={{ ...btn(true), width: 110, textAlign: "center" }} onClick={onToggleAuto}>{auto ? "Pause" : "Auto-sim"}</button>
              </>
            ) : (
              <>
                {record.w >= league.winsNeeded && !champ && (
                  <button style={{ ...btn(true), borderColor: C.dirt, color: C.dirt, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 220 }} onClick={onPromote}>
                    {tier >= LEAGUES.length - 1 ? "Win the World Series" : `Claim pennant → ${LEAGUES[tier + 1].name}`}
                  </button>
                )}
                <button style={{ ...btn(true), width: 150, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: SLAB, fontSize: 14 }} onClick={onStartGame}>
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
            }}>
              {l.team && (
                <span style={{
                  display: "inline-block", fontSize: 9, letterSpacing: 1, fontWeight: 700, fontStyle: "normal",
                  padding: "1px 5px", borderRadius: 3, marginRight: 7, verticalAlign: "1px",
                  background: l.side === "us" ? C.amber : "transparent",
                  color: l.side === "us" ? C.green : C.creamDim,
                  border: `1px solid ${l.side === "us" ? C.amber : C.creamDim}`,
                }}>{abbrev(l.team)}</span>
              )}
              {l.text}
            </div>
          ))}
        </div>

        {/* Live game stats — team comparison + both box scores */}
        {g && box && (
          <>
            <div style={{ ...panel, padding: 12, marginTop: 10 }}>
              <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>
                GAME STATS {g.over ? "· FINAL" : ""}
              </div>
              <div style={{ display: "flex", fontSize: 11, marginBottom: 10, letterSpacing: 1 }}>
                <span style={{ color: C.creamDim }}>{abbrev(g.opp.name)} {g.opp.name}</span>
                <span style={{ marginLeft: "auto", color: C.amber }}>{city.name} {abbrev(city.name)}</span>
              </div>
              <CompareRow label="HITS" a={total("them", "h")} b={total("us", "h")} />
              <CompareRow label="HOME RUNS" a={total("them", "hr")} b={total("us", "hr")} />
              <CompareRow label="EXTRA-BASE HITS" a={total("them", "d") + total("them", "t") + total("them", "hr")} b={total("us", "d") + total("us", "t") + total("us", "hr")} />
              <CompareRow label="STRIKEOUTS" a={total("them", "k")} b={total("us", "k")} />
              <CompareRow label="WALKS" a={total("them", "bb")} b={total("us", "bb")} />
              <CompareRow label="LEFT ON BASE" a={g.box.lobThem} b={g.box.lobUs} />
            </div>
            <StatTable style={{ marginTop: 10 }} title={`${city.name.toUpperCase()} HITTING · this game`}
              cols={["AB", "R", "H", "HR", "RBI", "BB", "K"]} rows={gameRows(roster.batters, "us")} />
            <StatTable style={{ marginTop: 10 }} title={`${g.opp.name.toUpperCase()} HITTING · this game`}
              cols={["AB", "R", "H", "HR", "RBI", "BB", "K"]} rows={gameRows(g.opp.batters, "them")} />
          </>
        )}
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
  );
}
