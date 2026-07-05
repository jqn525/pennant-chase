// ── Roster tab: lineup list and training panel ──

import { C, BAT_STATS, PIT_STATS, STAT_INFO } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { panel, btn } from "./styles.js";
import { StarIcon } from "./Icons.jsx";

const ba = (s) => (s.ab ? (s.h / s.ab).toFixed(3).replace(/^0/, "") : "—");
const kpct = (s) => (s.ab ? ((s.k / s.ab) * 100).toFixed(0) + "%" : "—");

export default function RosterTab({ roster, selected, selectedId, onSelect, stat, isStar, money, trainCost, onTrain }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 2 }}>
      <div style={{ flex: "1 1 380px", minWidth: 300 }}>
        <div style={{ ...panel, padding: 12 }}>
          <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>
            LINEUP · tap to train · BA / K% are live season stats
          </div>
          {[...roster.batters, roster.sp, roster.rp].map((p) => {
            const s = stat(p.id);
            const sel = selectedId === p.id;
            return (
              <button key={p.id} onClick={() => onSelect(p.id)}
                style={{ ...btn(true), width: "100%", marginBottom: 4, borderColor: sel ? C.amber : C.greenLine, background: sel ? "#3A2E10" : "transparent", color: C.cream, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 26, color: C.creamDim }}>{p.pos}</span>
                <span style={{ fontWeight: 600, flex: 1, display: "flex", alignItems: "center", gap: 5 }}>
                  {p.name}{isStar(p) && <StarIcon />}
                </span>
                {p.role === "bat"
                  ? <span style={{ fontSize: 11, color: C.creamDim }}>BA {ba(s)} · K {kpct(s)} · HR {s.hr}</span>
                  : <span style={{ fontSize: 11, color: C.creamDim }}>Stuff {p.stuff} · Ctl {p.control} · Sta {p.stamina}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ flex: "1 1 300px", minWidth: 260 }}>
        {selected ? (
          <div style={{ ...panel, padding: 12 }}>
            <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>
              TRAINING · {selected.name} ({selected.pos})
            </div>
            {selected.role === "bat" && (
              <div style={{ fontSize: 11, color: C.creamDim, marginBottom: 8 }}>
                Spray tendency: {Math.abs(selected.pull) < 0.15 ? "sprays it everywhere" : selected.pull < 0 ? `pulls left (${(Math.abs(selected.pull) * 100).toFixed(0)}%)` : `slices right (${(selected.pull * 100).toFixed(0)}%)`}
              </div>
            )}
            {(selected.role === "bat" ? BAT_STATS : PIT_STATS).map((k) => {
              const cost = trainCost(selected, k);
              const ok = money >= cost;
              return (
                <button key={k} onClick={() => onTrain(selected.id, k)} style={{ ...btn(ok), width: "100%", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{k} {selected[k]}</span> → ${fmt(cost)}
                  <div style={{ fontSize: 10, color: C.creamDim }}>{STAT_INFO[k]}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ ...panel, padding: 12, fontSize: 12, color: C.creamDim }}>
            Select a player to see attributes and train them with money.
          </div>
        )}
      </div>
    </div>
  );
}
