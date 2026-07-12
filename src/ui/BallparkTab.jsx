import { useState } from "react";
import { LEAGUE } from "../game/constants.js";
import Panel from "./Panel.jsx";
import StatTable from "./StatTable.jsx";
import FieldView from "./FieldView.jsx";
import { PlayIcon, PauseIcon } from "./Icons.jsx";
import "./BallparkTab.css";

const EMPTY_LINE = { ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, k: 0, r: 0, rbi: 0 };

export default function BallparkTab({ g, city, phase, playoffs, gameIndex, standings, rivals, log, speed, paused, roster, onSetSpeed, onTogglePause, onOpenCard, series }) {
  const [view, setView] = useState("radio");
  const box = g?.box;
  const team = city.nickname ?? city.name;
  const latest = log[0]?.text ?? (phase === "draft" ? "The winter board is open. Build the next great club." : "The grounds crew has the field ready.");
  const names = [team, ...(rivals || []).map((r) => r.name)];
  const table = standings.map((t, i) => ({ i, name: names[i] || "—", ...t }))
    .sort((a, b) => b.w - a.w || a.l - b.l);
  const gameRows = (batters, side) => batters.map((p) => {
    const s = box?.[side]?.[p.id] || EMPTY_LINE;
    return { p, cells: [s.ab, s.r, s.h, s.hr, s.rbi, s.bb, s.k], dim: !s.ab && !s.bb };
  });

  const context = phase === "playoffs" && playoffs
    ? `${playoffs.round === "semi" ? "Semifinal" : "Pennant Cup"} · Series ${playoffs.wins.us}–${playoffs.wins.them}`
    : series ? `Game ${gameIndex + 1}/${LEAGUE.seasonGames} · Series game ${series.gameInSeries}/${series.len}` : `Game ${Math.min(gameIndex + 1, LEAGUE.seasonGames)}`;

  return (
    <div className="ballpark-screen">
      <div className="ballpark-screen__context">{context}</div>
      <div className="ballpark-field">
        <div className="field-score-strip">
          <div><span>{team}</span><strong>{g?.us ?? 0}</strong></div>
          <div><span>{g?.opp?.name ?? "Visitors"}</span><strong>{g?.them ?? 0}</strong></div>
          <aside>
            <b>{g ? `${g.half === "top" ? "Top" : "Bot"} ${g.inning}` : "Next"}</b>
            <small>{g && !g.over ? `${g.outs} out${g.outs === 1 ? "" : "s"}` : g?.over ? "Final" : "Ready"}</small>
          </aside>
        </div>
        <FieldView g={g} />
      </div>

      <div className="tempo-deck" aria-label="Game speed">
        <button className={paused ? "is-active" : ""} onClick={onTogglePause}>
          {paused ? <PlayIcon size={13} /> : <PauseIcon size={13} />}<span>{paused ? "Resume" : "Pause"}</span>
        </button>
        {[[1, "1×"], [4, "4×"], ["max", "MAX"]].map(([value, label]) => (
          <button key={label} className={!paused && speed === value ? "is-active" : ""} onClick={() => onSetSpeed(value)}>{label}</button>
        ))}
      </div>

      <section className="broadcast-sheet">
        <div className="broadcast-sheet__handle" />
        <div className="broadcast-sheet__eyebrow">Live from the ballpark</div>
        <h2>Radio Call</h2>
        <p>{latest}</p>
        <div className="broadcast-tabs" role="tablist">
          {[['radio', 'Play-by-play'], ['box', 'Box score'], ['standings', 'Standings']].map(([id, label]) => (
            <button key={id} className={view === id ? "is-active" : ""} onClick={() => setView(id)} role="tab" aria-selected={view === id}>{label}</button>
          ))}
        </div>

        {view === "radio" && (
          <div className="radio-feed">
            {log.slice(0, 10).map((line) => <div key={line.id} className={`radio-feed__line radio-feed__line--${line.kind}`}>{line.text}</div>)}
          </div>
        )}
        {view === "box" && box && roster && (
          <div className="box-score-stack">
            <StatTable title={`${team} hitting`} titleRight={g?.over ? "Final" : "Live"}
              cols={["AB", "R", "H", "HR", "RBI", "BB", "K"]} rows={gameRows(roster.batters, "us")} onRow={onOpenCard} />
            <StatTable title={`${g.opp.name} hitting`} cols={["AB", "R", "H", "HR", "RBI", "BB", "K"]}
              rows={gameRows(g.opp.batters, "them")} onRow={onOpenCard} />
          </div>
        )}
        {view === "standings" && (
          <Panel title="League table">
            <div className="league-table">
              {table.map((row, i) => (
                <div key={row.i} className={row.i === 0 ? "is-us" : ""}>
                  <b>{i + 1}</b><span>{row.name}</span><strong>{row.w}–{row.l}</strong>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </section>
    </div>
  );
}
