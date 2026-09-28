import { LEAGUE } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { GearIcon, TrophyIcon } from "./Icons.jsx";
import { FlipNumber, CashPops } from "./fx.jsx";
import "./Scoreboard.css";

const initial = (city) => (city.nickname ?? city.name ?? "P").trim().slice(0, 1).toUpperCase();

export default function Scoreboard({ city, year, record, money, fans, trophies, phase, playoffs, gameIndex, series, onHelp }) {
  const team = `${city.name} ${city.nickname ?? "Baseball"}`;
  const status = phase === "draft"
    ? "Draft day"
    : phase === "playoffs" && playoffs
      ? `${playoffs.round === "semi" ? "Semifinal" : "Pennant Cup"} · ${playoffs.wins.us}–${playoffs.wins.them}`
      : `Game ${Math.min(gameIndex + 1, LEAGUE.seasonGames)} · ${series ? `Series ${series.w}–${series.l}` : "Regular season"}`;

  return (
    <header className="franchise-hud">
      <div className="franchise-hud__mark" aria-hidden="true">{initial(city)}</div>
      <div className="franchise-hud__identity">
        <div className="franchise-hud__team">{team}</div>
        <div className="franchise-hud__status">{status}</div>
      </div>
      <button className="franchise-hud__settings" onClick={onHelp} aria-label="Open settings"><GearIcon size={17} /></button>
      <div className="franchise-hud__stats">
        <div><span>Year</span><strong><FlipNumber value={year} /></strong></div>
        <div><span>W–L</span><strong><FlipNumber value={record.w} />–<FlipNumber value={record.l} /></strong></div>
        <div className="franchise-hud__cash"><span>Cash</span><strong>${fmt(money)}</strong><CashPops money={money} /></div>
        <div><span>Fans</span><strong><FlipNumber value={fmt(fans)} /></strong></div>
        <div className="franchise-hud__cups"><span><TrophyIcon size={10} /> Cups</span><strong><FlipNumber value={trophies} /></strong></div>
      </div>
    </header>
  );
}
