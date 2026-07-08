// ── Bottom navigation, mobile-game style ──

import { C } from "../game/constants.js";
import { PIXEL } from "./styles.js";
import { DiamondNavIcon, RosterNavIcon, ShopNavIcon, OfficeNavIcon } from "./Icons.jsx";

const TABS = [
  { id: "game", label: "BALLPARK", Icon: DiamondNavIcon },
  { id: "roster", label: "ROSTER", Icon: RosterNavIcon },
  { id: "shop", label: "SHOP", Icon: ShopNavIcon },
  { id: "club", label: "OFFICE", Icon: OfficeNavIcon },
];

export default function TabBar({ tab, onTab }) {
  return (
    <nav style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40,
      background: "#0F241A", borderTop: `2px solid ${C.greenLine}`,
      paddingBottom: "env(safe-area-inset-bottom)",
      display: "flex", justifyContent: "space-around",
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button key={id} onClick={() => onTab(id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "9px 0 7px", background: "transparent", border: "none", cursor: "pointer",
              borderTop: `2px solid ${active ? C.amber : "transparent"}`, marginTop: -2,
            }}>
            <Icon size={20} color={active ? C.amber : C.creamDim} />
            <span style={{ fontFamily: PIXEL, fontSize: 7, letterSpacing: 1, color: active ? C.amber : C.creamDim }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
