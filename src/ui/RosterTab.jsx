// ── Roster tab: batting order and season stat tables. Tap any player for his card. ──

import { C, PLAYER_TRAITS } from "../game/constants.js";
import { panel, btn } from "./styles.js";
import { StarIcon } from "./Icons.jsx";
import StatTable from "./StatTable.jsx";
import { ovr } from "../game/gear.js";

const avg3 = (num, den) => (den ? (num / den).toFixed(3).replace(/^0/, "") : "—");
const ba = (s) => avg3(s.h, s.ab);
const obp = (s) => avg3(s.h + s.bb, s.ab + s.bb);
const slg = (s) => avg3(s.h + s.d + 2 * s.t + 3 * s.hr, s.ab);
const ops = (s) => (s.ab ? ((s.h + s.bb) / (s.ab + s.bb) + (s.h + s.d + 2 * s.t + 3 * s.hr) / s.ab).toFixed(3) : "—");
const ip = (s) => (s.outsP ? `${Math.floor(s.outsP / 3)}.${s.outsP % 3}` : "—");
const era = (s) => (s.outsP ? ((s.raP * 27) / s.outsP).toFixed(2) : "—");

export default function RosterTab({ roster, stat, isStar, onMoveBatter, onAutoLineup, onOpenCard }) {
  const arrowBtn = {
    flex: 1, width: 34, background: "transparent", border: `1px solid ${C.greenLine}`,
    borderRadius: 4, color: C.creamDim, fontSize: 10, cursor: "pointer", padding: 0,
  };
  const row = (p, order) => {
    const s = stat(p.id);
    const trait = PLAYER_TRAITS.find((t) => t.id === p.trait);
    return (
      <div key={p.id} style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "stretch" }}>
        <button onClick={() => onOpenCard(p)}
          style={{ ...btn(true), flex: 1, minWidth: 0, textAlign: "left", border: `1px solid ${C.greenLine}`, background: "transparent", color: C.cream }}>
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ width: 14, color: C.amber, fontSize: 10 }}>{order ?? ""}</span>
            <span style={{ width: 26, color: C.creamDim }}>{p.pos}</span>
            <span style={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.name}{isStar(p) && <StarIcon />}
            </span>
            {trait && <span style={{ fontSize: 8, letterSpacing: 1, color: C.amber, border: `1px solid ${C.amber}44`, borderRadius: 3, padding: "1px 4px", whiteSpace: "nowrap" }}>{trait.label.toUpperCase()}</span>}
            <span style={{ fontSize: 10, color: C.amber }}>OVR {ovr(p).toFixed(0)}</span>
          </span>
          <span style={{ display: "block", fontSize: 11, color: C.creamDim, marginLeft: 48, marginTop: 2 }}>
            {p.role === "bat"
              ? <>AVG {ba(s)} · HR {s.hr} · RBI {s.rbi}</>
              : <>ERA {era(s)} · K {s.kP} · IP {ip(s)}</>}
          </span>
        </button>
        {order != null && (
          <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <button style={arrowBtn} aria-label={`move ${p.name} up`} onClick={() => onMoveBatter(p.id, -1)}>▲</button>
            <button style={arrowBtn} aria-label={`move ${p.name} down`} onClick={() => onMoveBatter(p.id, 1)}>▼</button>
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ ...panel, padding: 12, marginTop: 2 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
          <span style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2 }}>
            BATTING ORDER · tap a player for his card
          </span>
          <button onClick={onAutoLineup}
            style={{ ...btn(true), marginLeft: "auto", fontSize: 10, letterSpacing: 1, padding: "5px 8px" }}>
            AUTO-SET ORDER
          </button>
        </div>
        <div style={{ fontSize: 10, color: C.creamDim, fontStyle: "italic", marginBottom: 8 }}>
          Order changes take effect from the next game.
        </div>
        {roster.batters.map((p, i) => row(p, i + 1))}
        {[roster.sp, roster.rp].map((p) => row(p, null))}
      </div>

      <StatTable
        title="BATTING · this season · tap a row for the player card"
        cols={["AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "K", "AVG", "OBP", "SLG", "OPS"]}
        onRow={onOpenCard}
        rows={roster.batters.map((p) => {
          const s = stat(p.id);
          return { p, cells: [s.ab, s.r, s.h, s.d, s.t, s.hr, s.rbi, s.bb, s.k, ba(s), obp(s), slg(s), ops(s)] };
        })}
      />
      <StatTable
        title="PITCHING · this season"
        cols={["IP", "H", "R", "BB", "K", "ERA"]}
        onRow={onOpenCard}
        rows={[roster.sp, roster.rp].map((p) => {
          const s = stat(p.id);
          return { p, cells: [ip(s), s.hP, s.raP, s.bbP, s.kP, era(s)] };
        })}
      />
    </div>
  );
}
