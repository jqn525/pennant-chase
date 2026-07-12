import { DiamondNavIcon, RosterNavIcon, ShopNavIcon, OfficeNavIcon, PlayIcon, PauseIcon } from "./Icons.jsx";
import "./TabBar.css";

const TABS = [
  { id: "game", label: "Ballpark", Icon: DiamondNavIcon },
  { id: "roster", label: "Roster", Icon: RosterNavIcon },
  { id: "shop", label: "Shop", Icon: ShopNavIcon },
  { id: "club", label: "Office", Icon: OfficeNavIcon },
];

export default function TabBar({ tab, onTab, speed, paused, onSetSpeed, onTogglePause }) {
  return (
    <nav className="game-nav" aria-label="Primary">
      <div className="game-nav__speed" aria-label="Game speed controls">
        <button className={`game-nav__pause${paused ? " is-active" : ""}`} onClick={onTogglePause}
          aria-label={paused ? "Resume games" : "Pause games"}>
          {paused ? <PlayIcon size={13} /> : <PauseIcon size={13} />}
          <span>{paused ? "Resume" : "Pause"}</span>
        </button>
        {[[1, "1×"], [4, "4×"], ["max", "MAX"]].map(([value, label]) => (
          <button key={label} className={!paused && speed === value ? "is-active" : ""}
            onClick={() => onSetSpeed(value)} aria-label={`Set game speed to ${label}`}>{label}</button>
        ))}
      </div>
      <div className="game-nav__rail">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button key={id} className={`game-nav__item${active ? " is-active" : ""}`}
              onClick={() => onTab(id)} aria-current={active ? "page" : undefined}>
              <span className="game-nav__icon"><Icon size={22} /></span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
