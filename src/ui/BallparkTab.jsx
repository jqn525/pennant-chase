// ── Ballpark tab: live scoreboard, speed controls, play-by-play, game stats, standings ──

import { useState } from "react";
import { C, LEAGUE } from "../game/constants.js";
import { panel, btn, bulb } from "./styles.js";
import Panel from "./Panel.jsx";
import StatTable from "./StatTable.jsx";
import FieldView from "./FieldView.jsx";

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

export default function BallparkTab({ g, city, year, phase, playoffs, gameIndex, standings, rivals, log, paused, roster, onOpenCard, series }) {
  const [radioOpen, setRadioOpen] = useState(false);
  const box = g?.box;
  const total = (side, key) => Object.values(box[side]).reduce((n, line) => n + line[key], 0);
  const gameRows = (batters, side) => batters.map((p) => {
    const s = box[side][p.id] || EMPTY_LINE;
    return { p, cells: [s.ab, s.r, s.h, s.hr, s.rbi, s.bb, s.k], dim: !s.ab && !s.bb };
  });

  // Status line: where are we in the season?
  let statusLeft;
  if (phase === "draft") {
    statusLeft = "DRAFT DAY";
  } else if (phase === "playoffs" && playoffs) {
    statusLeft = `${playoffs.round === "semi" ? "SEMIFINAL" : "PENNANT CUP"} · SERIES ${playoffs.wins.us}-${playoffs.wins.them}`;
  } else {
    statusLeft = `GAME ${Math.min(gameIndex + (g && !g.over ? 1 : 0), LEAGUE.seasonGames) || 1}/${LEAGUE.seasonGames}`;
  }

  // Line score rows: away team always on top. [name, R, H, E, atBat, isUs]
  const hitsOf = (sideKey) => (box ? Object.values(box[sideKey]).reduce((n, l) => n + l.h, 0) : "–");
  const teamName = city.nickname ?? city.name;
  const usRow = g ? [teamName, g.us, hitsOf("us"), box.errUs ?? 0, g.half === (g.home ? "bottom" : "top") && !g.over, true] : [teamName, "–", "–", "–", false, true];
  const oppRow = g ? [g.opp.name, g.them, hitsOf("them"), box.errThem ?? 0, g.half === (g.home ? "top" : "bottom") && !g.over, false] : ["VISITORS", "–", "–", "–", false, false];
  const teamRows = g && !g.home ? [usRow, oppRow] : [oppRow, usRow];

  // Standings, sorted
  const names = [teamName, ...(rivals || []).map((r) => r.name)];
  const table = standings
    .map((t, i) => ({ i, name: names[i] || "—", w: t.w, l: t.l, pct: t.w + t.l ? t.w / (t.w + t.l) : 0 }))
    .sort((a, b) => b.w - a.w || a.l - b.l);
  const leader = table[0];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 2 }}>
      <div style={{ flex: "2 1 400px", minWidth: 300 }}>
        {/* Line score — fixed-size scoreboard, never reflows */}
        <Panel title="LINE SCORE" bodyStyle={{ height: 90, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
          <div style={{ fontSize: 12, height: 16, display: "flex", gap: 14, whiteSpace: "nowrap" }}>
            <span style={{ color: C.creamDim }}>{statusLeft}</span>
            <span>{g && !g.over ? `${g.half === "top" ? "TOP" : "BOT"} ${g.inning} · ${g.outs} OUT${g.outs === 1 ? "" : "S"}` : paused ? "PAUSED" : " "}</span>
            <span style={{ color: C.creamDim, marginLeft: "auto" }}>YEAR {year}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 66 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", height: 12, fontSize: 9, color: C.creamDim, letterSpacing: 1 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", color: C.dirt }}>
                  {phase === "playoffs" && playoffs
                    ? `${playoffs.round === "semi" ? "SEMIS" : "CUP"} · GAME ${playoffs.gameNo + 1} · SERIES ${playoffs.wins.us}-${playoffs.wins.them}`
                    : series ? `SERIES · GAME ${series.gameInSeries} OF ${series.len} · ${series.w}-${series.l}` : ""}
                </span>
                <span style={{ width: 40, textAlign: "right" }}>R</span>
                <span style={{ width: 34, textAlign: "right" }}>H</span>
                <span style={{ width: 30, textAlign: "right" }}>E</span>
              </div>
              {teamRows.map(([name, r, h, e, atBat, isUs], i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", height: 26 }}>
                  <span style={{ width: 10, color: C.amber, fontSize: 11 }}>{atBat ? "▸" : " "}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14, color: isUs ? C.cream : C.creamDim }}>{name}</span>
                  <span style={{ ...bulb, fontSize: 19, fontWeight: 600, width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r}</span>
                  <span style={{ width: 34, textAlign: "right", fontSize: 13, color: isUs ? C.cream : C.creamDim, fontVariantNumeric: "tabular-nums" }}>{h}</span>
                  <span style={{ width: 30, textAlign: "right", fontSize: 13, color: isUs ? C.cream : C.creamDim, fontVariantNumeric: "tabular-nums" }}>{e}</span>
                </div>
              ))}
            </div>
            <svg width="52" height="44" viewBox="0 0 52 44" aria-label="bases" style={{ flexShrink: 0 }}>
              {/* classic three-base triangle: 2B top, 1B lower right, 3B lower left */}
              {[[26, 12, g && !g.over && g.bases[1]], [39, 27, g && !g.over && g.bases[0]], [13, 27, g && !g.over && g.bases[2]]].map(([x, y, occ], i) => (
                <rect key={i} x={x - 6.5} y={y - 6.5} width="13" height="13" transform={`rotate(45 ${x} ${y})`}
                  fill={occ ? C.amber : "none"} stroke={occ ? C.amber : C.creamDim} strokeWidth="1.5" />
              ))}
            </svg>
          </div>

        </Panel>

        {/* Live spray chart */}
        <FieldView g={g} />

        {/* Play-by-play — collapsed to a slim strip by default */}
        <Panel title="RADIO CALL" bodyStyle={{ height: radioOpen ? 330 : 84, overflowY: radioOpen ? "auto" : "hidden" }}>
          <button onClick={() => setRadioOpen((o) => !o)}
            style={{ display: "flex", width: "100%", alignItems: "center", background: "transparent", border: "none", padding: 0, marginBottom: 6, cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ marginLeft: "auto", fontSize: 10, color: C.dirt, letterSpacing: 1 }}>{radioOpen ? "▴ COLLAPSE" : "▾ EXPAND"}</span>
          </button>
          {(radioOpen ? log : log.slice(0, 3)).map((l) => (
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
        </Panel>

        {/* Live game stats — team comparison + both box scores */}
        {g && box && roster && (
          <>
            <Panel title="GAME STATS" titleRight={g.over ? "FINAL" : undefined}>
              <div style={{ display: "flex", fontSize: 11, marginBottom: 10, letterSpacing: 1 }}>
                <span style={{ color: C.creamDim }}>{abbrev(g.opp.name)} {g.opp.name}</span>
                <span style={{ marginLeft: "auto", color: C.amber }}>{teamName} {abbrev(teamName)}</span>
              </div>
              <CompareRow label="HITS" a={total("them", "h")} b={total("us", "h")} />
              <CompareRow label="HOME RUNS" a={total("them", "hr")} b={total("us", "hr")} />
              <CompareRow label="EXTRA-BASE HITS" a={total("them", "d") + total("them", "t") + total("them", "hr")} b={total("us", "d") + total("us", "t") + total("us", "hr")} />
              <CompareRow label="STRIKEOUTS" a={total("them", "k")} b={total("us", "k")} />
              <CompareRow label="WALKS" a={total("them", "bb")} b={total("us", "bb")} />
              <CompareRow label="LEFT ON BASE" a={g.box.lobThem} b={g.box.lobUs} />
            </Panel>
            <StatTable style={{ marginTop: 10 }} title={`${teamName.toUpperCase()} HITTING`}
              cols={["AB", "R", "H", "HR", "RBI", "BB", "K"]} rows={gameRows(roster.batters, "us")} onRow={onOpenCard} />
            <StatTable style={{ marginTop: 10 }} title={`${g.opp.name.toUpperCase()} HITTING`}
              cols={["AB", "R", "H", "HR", "RBI", "BB", "K"]} rows={gameRows(g.opp.batters, "them")} onRow={onOpenCard} />
          </>
        )}
      </div>

      {/* Standings + scout */}
      <div style={{ flex: "1 1 260px", minWidth: 240 }}>
        <Panel title="STANDINGS">
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
        </Panel>

        {g && !g.over && (
          <Panel title="SCOUT">
            <div style={{ fontSize: 12, lineHeight: 1.7 }}>
              {g.opp.tCity ? `${g.opp.tCity} ` : ""}{g.opp.name}<br />
              Their ace: {g.opp.sp.name} (Stuff {g.opp.sp.stuff}, Control {g.opp.sp.control})<br />
              <span style={{ color: C.creamDim }}>Rivals retool every winter. Keep up.</span>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
