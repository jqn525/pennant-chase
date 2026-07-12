import { DiamondNavIcon, RosterNavIcon, ShopNavIcon, OfficeNavIcon } from "./Icons.jsx";
import "./TabBar.css";

const TABS = [
  { id: "game", label: "Ballpark", Icon: DiamondNavIcon },
  { id: "roster", label: "Roster", Icon: RosterNavIcon },
  { id: "shop", label: "Shop", Icon: ShopNavIcon },
  { id: "club", label: "Office", Icon: OfficeNavIcon },
];

export default function TabBar({ tab, onTab }) {
  return (
    <nav className="game-nav" aria-label="Primary">
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
