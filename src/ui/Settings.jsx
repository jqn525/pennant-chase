import { useState } from "react";
import { LEAGUE } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { overlay } from "./styles.js";
import { SoundOnIcon, SoundOffIcon, RulebookIcon, TrophyIcon } from "./Icons.jsx";
import "./Settings.css";

const num = (n) => Math.round(n || 0).toLocaleString();
const avg = (h, ab) => (ab ? (h / ab).toFixed(3).replace(/^0/, "") : ".000");
const ip = (outs) => `${Math.floor((outs || 0) / 3)}.${(outs || 0) % 3}`;

function StatGroup({ title, rows }) {
  return (
    <section className="lifetime-group">
      <h3>{title}</h3>
      <div className="lifetime-group__grid">
        {rows.map(([label, value]) => (
          <div key={label} className="lifetime-stat"><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>
    </section>
  );
}

export default function Settings({ allTime: at, trophies, history, phase, sound, onToggleSound, onRules, onClose }) {
  const [view, setView] = useState("settings");
  const games = at.g || 0;
  const pct = games ? ((at.w || 0) / games).toFixed(3).replace(/^0/, "") : ".000";
  const playoffRuns = (history || []).filter((h) => h.finish <= LEAGUE.playoffTeams).length + (phase === "playoffs" ? 1 : 0);

  return (
    <div className="settings-overlay" style={overlay} onClick={onClose}>
      <div className="settings-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="settings-sheet__handle" />
        <header className="settings-header">
          <div><span>Clubhouse</span><h2>{view === "settings" ? "Settings" : "Lifetime"}</h2></div>
          <button onClick={onClose} aria-label="Close settings">Close</button>
        </header>

        <nav className="settings-tabs" aria-label="Settings sections">
          <button className={view === "settings" ? "is-active" : ""} onClick={() => setView("settings")}>Settings</button>
          <button className={view === "lifetime" ? "is-active" : ""} onClick={() => setView("lifetime")}>Lifetime Stats</button>
        </nav>

        {view === "settings" ? (
          <div className="settings-menu">
            <button className="settings-menu__row" onClick={onToggleSound}>
              <span className="settings-menu__icon">{sound ? <SoundOnIcon size={18} /> : <SoundOffIcon size={18} />}</span>
              <span><strong>Game audio</strong><small>Sound effects and stadium reactions</small></span>
              <b className={sound ? "is-on" : ""}>{sound ? "On" : "Off"}</b>
            </button>
            <button className="settings-menu__row" onClick={onRules}>
              <span className="settings-menu__icon"><RulebookIcon size={18} /></span>
              <span><strong>Rulebook</strong><small>Simulation rules, progression, and controls</small></span>
              <b aria-hidden="true">›</b>
            </button>
            <div className="settings-note">
              Save management, backup codes, and franchise reset controls live in the Office tab.
            </div>
          </div>
        ) : (
          <div className="lifetime-ledger">
            <section className="career-hero">
              <div><span>Career record</span><strong>{num(at.w)}–{num(at.l)}</strong><small>{pct} win percentage</small></div>
              <div className="career-hero__cup"><TrophyIcon size={28} /><strong>{trophies}</strong><span>Pennant Cups</span></div>
              <div className="career-hero__milestones">
                <span><b>{(history || []).length}</b> Seasons</span>
                <span><b>{num(games)}</b> Games</span>
                <span><b>{playoffRuns}</b> Playoff runs</span>
              </div>
            </section>

            <StatGroup title="Batting" rows={[
              ["Average", avg(at.h, at.ab)], ["Hits", num(at.h)], ["Home runs", num(at.hr)],
              ["Runs", num(at.r)], ["RBI", num(at.rbi)], ["Extra-base hits", num((at.d || 0) + (at.t || 0) + (at.hr || 0))],
              ["Walks", num(at.bb)], ["Strikeouts", num(at.k)], ["At bats", num(at.ab)],
            ]} />
            <StatGroup title="Pitching" rows={[
              ["Innings", ip(at.outsP)], ["Strikeouts", num(at.kP)], ["Walks", num(at.bbP)],
              ["Hits allowed", num(at.hP)], ["Runs allowed", num(at.raP)],
            ]} />
            <StatGroup title="Club Operations" rows={[
              ["Money earned", "$" + fmt(at.earned || 0)], ["Money spent", "$" + fmt(at.spent || 0)],
              ["Tickets sold", num(at.tickets)], ["Upgrades", num(at.upgrades)], ["Gear bought", num(at.gear)],
              ["Trades", num(at.trades)], ["Rookies signed", num(at.rookies)], ["Training sessions", num(at.train)],
            ]} />

            {(history || []).length > 0 && (
              <section className="season-ledger">
                <h3>Season History</h3>
                {[...history].reverse().map((season) => (
                  <div key={season.year} className={season.cup ? "is-champion" : ""}>
                    <b>Year {season.year}</b><span>{season.playerRecord}</span><span>{season.finish}{["st", "nd", "rd"][season.finish - 1] || "th"}</span>
                    <strong>{season.cup ? "Champions" : season.champion}</strong>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
