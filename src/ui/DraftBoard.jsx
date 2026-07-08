// ── Draft Day: the winter rookie class. The league waits while the board is open. ──

import { C, PLAYER_TRAITS, BAT_STATS, PIT_STATS } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { panel, btn, SLAB } from "./styles.js";

export default function DraftBoard({ draftClass, roster, money, year, onSign, onClose, onView }) {
  const releasedFor = (rook) => {
    if (rook.pos === "SP") return roster.sp;
    if (rook.pos === "RP") return roster.rp;
    return roster.batters.find((b) => b.pos === rook.pos);
  };

  return (
    <div style={{ ...panel, padding: 14, marginTop: 14, border: `1px solid ${C.amber}` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <span style={{ fontFamily: SLAB, fontSize: 16, color: C.amber }}>DRAFT DAY</span>
        <span style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2 }}>THE YEAR {year} ROOKIE CLASS</span>
      </div>
      <div style={{ fontSize: 11, color: C.creamDim, marginBottom: 10 }}>
        Raw kids, big ceilings. Signing one releases your current player at that position —
        the rookie inherits his gear. The season won't start until you close the board.
      </div>

      {draftClass.map((rook) => {
        const isPit = rook.pos === "SP" || rook.pos === "RP";
        const keys = isPit ? PIT_STATS : BAT_STATS;
        const trait = PLAYER_TRAITS.find((t) => t.id === rook.trait);
        const out = releasedFor(rook);
        const afford = money >= rook.signCost;
        return (
          <div key={rook.id} style={{ ...panel, padding: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span style={{ width: 26, color: C.creamDim, fontSize: 12 }}>{rook.pos}</span>
              <button onClick={() => onView?.(rook)}
                style={{ fontWeight: 700, fontSize: 13, background: "transparent", border: "none", color: C.cream, cursor: "pointer", padding: 0, fontFamily: "inherit", textDecoration: "underline", textDecorationColor: `${C.creamDim}66` }}>
                {rook.name}
              </button>
              {trait && <span style={{ fontSize: 9, letterSpacing: 1, color: C.amber, border: `1px solid ${C.amber}55`, borderRadius: 3, padding: "1px 5px" }}>{trait.label.toUpperCase()}</span>}
              <span style={{ marginLeft: "auto", fontSize: 12, color: afford ? C.amber : C.red, fontVariantNumeric: "tabular-nums" }}>${fmt(rook.signCost)}</span>
            </div>
            <div style={{ fontSize: 10, color: C.creamDim, margin: "5px 0 6px", lineHeight: 1.7 }}>
              {keys.map((k) => (
                <span key={k} style={{ marginRight: 10, whiteSpace: "nowrap" }}>
                  {k} <span style={{ color: C.cream }}>{rook[k]}</span>
                  <span style={{ color: C.grass }}>→{rook.pot[k]}</span>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: C.creamDim, flex: 1 }}>
                would release <span style={{ color: C.cream }}>{out?.name}</span>{out?.gear && Object.keys(out.gear).length ? " (gear stays)" : ""}
              </span>
              <button onClick={() => afford && onSign(rook.id)} style={{ ...btn(afford), fontSize: 11, padding: "6px 14px" }}>
                SIGN
              </button>
            </div>
          </div>
        );
      })}

      <button onClick={onClose} style={{ ...btn(true), width: "100%", textAlign: "center", fontFamily: SLAB, fontSize: 13, marginTop: 4 }}>
        CLOSE THE BOARD — PLAY BALL
      </button>
    </div>
  );
}
