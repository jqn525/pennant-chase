// ── Ballpark tab: live scoreboard, speed controls, play-by-play, game stats, standings ──

import { C, LEAGUE } from "../game/constants.js";
import { panel, btn, bulb } from "./styles.js";
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

export default function BallparkTab({ g, city, year, phase, playoffs, gameIndex, standings, rivals, log, speed, paused, roster, onSetSpeed, onTogglePause }) {
  const box = g?.box;
  const total = (side, key) => Object.values(box[side]).reduce((n, line) => n + line[key], 0);
  const gameRows = (batters, side) => batters.map((p) => {
    const s = box[side][p.id] || EMPTY_LINE;
    return { p, cells: [s.ab, s.r, s.h, s.hr, s.rbi, s.bb, s.k], dim: !s.ab && !s.bb };
  });

  // Status line: where are we in the season?
  let statusLeft;
  if (phase === "playoffs" && playoffs) {
    statusLeft = `${playoffs.round === "semi" ? "SEMIFINAL" : "PENNANT CUP"} · SERIES ${playoffs.wins.us}-${playoffs.wins.them}`;
  } else {
    statusLeft = `GAME ${Math.min(gameIndex + (g && !g.over ? 1 : 0), LEAGUE.seasonGames) || 1}/${LEAGUE.seasonGames}`;
  }

  // Line score rows: away team always on top
  const teamRows = g ? (g.home
    ? [[g.opp.name, g.them, g.half === "top" && !g.over, false], [city.name, g.us, g.half === "bottom" && !g.over, true]]
    : [[city.name, g.us, g.half === "top" && !g.over, true], [g.opp.name, g.them, g.half === "bottom" && !g.over, false]])
    : [["VISITORS", "–", false, false], [city.name, "–", false, true]];

  // Standings, sorted
  const names = [city.name, ...(rivals || []).map((r) => r.name)];
  const table = standings
    .map((t, i) => ({ i, name: names[i] || "—", w: t.w, l: t.l, pct: t.w + t.l ? t.w / (t.w + t.l) : 0 }))
    .sort((a, b) => b.w - a.w || a.l - b.l);
  const leader = table[0];

  const speedBtn = (val, label) => (
    <button key={label} onClick={() => onSetSpeed(val)}
      style={{ ...btn(true), width: 52, textAlign: "center", padding: "8px 0", border: `1px solid ${!paused && speed === val ? C.amber : C.greenLine}`, background: !paused && speed === val ? "#3A2E10" : "transparent", color: !paused && speed === val ? C.amber : C.creamDim }}>
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 2 }}>
      <div style={{ flex: "2 1 400px", minWidth: 300 }}>
        {/* Line score — fixed-size scoreboard, never reflows */}
        <div style={{ ...panel, padding: 12, height: 132, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
          <div style={{ fontSize: 12, height: 16, display: "flex", gap: 14, whiteSpace: "nowrap" }}>
            <span style={{ color: C.creamDim }}>{statusLeft}</span>
            <span>{g && !g.over ? `${g.half === "top" ? "TOP" : "BOT"} ${g.inning} · ${g.outs} OUT${g.outs === 1 ? "" : "S"}` : paused ? "PAUSED" : " "}</span>
            <span style={{ color: C.creamDim, marginLeft: "auto" }}>YEAR {year}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 52 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {teamRows.map(([name, score, atBat, isUs], i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", height: 26 }}>
                  <span style={{ width: 10, color: C.amber, fontSize: 11 }}>{atBat ? "▸" : " "}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14, color: isUs ? C.cream : C.creamDim }}>{name}</span>
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

          {/* Speed controls — the game plays itself; you set the tempo */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", height: 34 }}>
            <button onClick={onTogglePause}
              style={{ ...btn(true), width: 52, textAlign: "center", padding: "8px 0", border: `1px solid ${paused ? C.amber : C.greenLine}`, background: paused ? "#3A2E10" : "transparent", color: paused ? C.amber : C.creamDim }}>
              {paused ? "▶" : "❚❚"}
            </button>
            {speedBtn(1, "1×")}
            {speedBtn(4, "4×")}
            {speedBtn("max", "MAX")}
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
        {g && box && roster && (
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

      {/* Standings + scout */}
      <div style={{ flex: "1 1 260px", minWidth: 240 }}>
        <div style={{ ...panel, padding: 12 }}>
          <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>
            STANDINGS · TOP {LEAGUE.playoffTeams} MAKE THE PLAYOFFS
          </div>
          <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.greenLine}` }}>
                <th style={{ textAlign: "left", padding: "3px 4px", color: C.creamDim, fontWeight: 400 }}>CLUB</th>
                {["W", "L", "PCT", "GB"].map((h) => <th key={h} style={{ textAlign: "right", padding: "3px 4px", color: C.creamDim, fontWeight: 400 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {table.map((row, pos) => (
                <tr key={row.i} style={{
                  color: row.i === 0 ? C.amber : C.cream,
                  fontWeight: row.i === 0 ? 600 : 400,
                  borderBottom: pos === LEAGUE.playoffTeams - 1 ? `1px dashed ${C.dirt}` : `1px solid ${C.greenLine}33`,
                }}>
                  <td style={{ padding: "4px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>{row.name}</td>
                  <td style={{ textAlign: "right", padding: "4px 4px", fontVariantNumeric: "tabular-nums" }}>{row.w}</td>
                  <td style={{ textAlign: "right", padding: "4px 4px", fontVariantNumeric: "tabular-nums" }}>{row.l}</td>
                  <td style={{ textAlign: "right", padding: "4px 4px", fontVariantNumeric: "tabular-nums" }}>{row.pct.toFixed(3).replace(/^0/, "")}</td>
                  <td style={{ textAlign: "right", padding: "4px 4px", fontVariantNumeric: "tabular-nums" }}>{pos === 0 ? "—" : (((leader.w - row.w) + (row.l - leader.l)) / 2).toFixed(1).replace(/\.0$/, "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {g && !g.over && (
          <div style={{ ...panel, padding: 12, marginTop: 10 }}>
            <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>OPPONENT SCOUT</div>
            <div style={{ fontSize: 12, lineHeight: 1.7 }}>
              {g.opp.name}<br />
              Their ace: {g.opp.sp.name} (Stuff {g.opp.sp.stuff}, Control {g.opp.sp.control})<br />
              <span style={{ color: C.creamDim }}>Rivals retool every winter. Keep up.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
