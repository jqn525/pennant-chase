// ── Roster tab: lineup list, training panel, and season stat tables ──

import { C, BAT_STATS, PIT_STATS, STAT_INFO } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { panel, btn } from "./styles.js";
import { StarIcon } from "./Icons.jsx";
import StatTable from "./StatTable.jsx";
import { GEAR, TIER_NAMES, gearBonus, ovr } from "../game/gear.js";

const avg3 = (num, den) => (den ? (num / den).toFixed(3).replace(/^0/, "") : "—");
const ba = (s) => avg3(s.h, s.ab);
const obp = (s) => avg3(s.h + s.bb, s.ab + s.bb);
const slg = (s) => avg3(s.h + s.d + 2 * s.t + 3 * s.hr, s.ab);
const ops = (s) => (s.ab ? ((s.h + s.bb) / (s.ab + s.bb) + (s.h + s.d + 2 * s.t + 3 * s.hr) / s.ab).toFixed(3) : "—");
const ip = (s) => (s.outsP ? `${Math.floor(s.outsP / 3)}.${s.outsP % 3}` : "—");
const era = (s) => (s.outsP ? ((s.raP * 27) / s.outsP).toFixed(2) : "—");

export default function RosterTab({ roster, league, selected, selectedId, onSelect, stat, isStar, money, trainCost, onTrain, onMoveBatter, onAutoLineup }) {
  const arrowBtn = {
    flex: 1, width: 34, background: "transparent", border: `1px solid ${C.greenLine}`,
    borderRadius: 4, color: C.creamDim, fontSize: 10, cursor: "pointer", padding: 0,
  };
  const row = (p, order) => {
    const s = stat(p.id);
    const sel = selectedId === p.id;
    return (
      <div key={p.id} style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "stretch" }}>
        <button onClick={() => onSelect(p.id)}
          style={{ ...btn(true), flex: 1, minWidth: 0, textAlign: "left", border: `1px solid ${sel ? C.amber : C.greenLine}`, background: sel ? "#3A2E10" : "transparent", color: C.cream }}>
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ width: 14, color: C.amber, fontSize: 10 }}>{order ?? ""}</span>
            <span style={{ width: 26, color: C.creamDim }}>{p.pos}</span>
            <span style={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.name}{isStar(p) && <StarIcon />}
            </span>
            <span style={{ fontSize: 10, color: C.amber }}>OVR {ovr(p).toFixed(1)}</span>
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 2 }}>
        <div style={{ flex: "1 1 380px", minWidth: 300 }}>
          <div style={{ ...panel, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
              <span style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2 }}>
                BATTING ORDER · tap a player to train
              </span>
              <button onClick={onAutoLineup}
                style={{ ...btn(true), marginLeft: "auto", fontSize: 10, letterSpacing: 1, padding: "5px 8px" }}>
                AUTO-SET ORDER
              </button>
            </div>
            <div style={{ fontSize: 10, color: C.creamDim, fontStyle: "italic", marginBottom: 8 }}>
              Changes take effect from the next game.
            </div>
            {roster.batters.map((p, i) => row(p, i + 1))}
            {[roster.sp, roster.rp].map((p) => row(p, null))}
          </div>
        </div>
        <div style={{ flex: "1 1 300px", minWidth: 260 }}>
          {selected ? (
            <div style={{ ...panel, padding: 12 }}>
              <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 6 }}>
                TRAINING · {selected.name} ({selected.pos}) · OVR {ovr(selected).toFixed(1)}
              </div>
              {(() => {
                const owned = GEAR.filter((g) => selected.gear?.[g.slot]);
                return owned.length > 0 && (
                  <div style={{ fontSize: 10, color: C.grass, marginBottom: 6 }}>
                    Gear: {owned.map((g) => `${TIER_NAMES[selected.gear[g.slot]]} ${g.label}`).join(" · ")}
                  </div>
                );
              })()}
              {selected.role === "bat" && (
                <div style={{ fontSize: 11, color: C.creamDim, marginBottom: 6 }}>
                  Spray tendency: {Math.abs(selected.pull) < 0.15 ? "sprays it everywhere" : selected.pull < 0 ? `pulls left (${(Math.abs(selected.pull) * 100).toFixed(0)}%)` : `slices right (${(selected.pull * 100).toFixed(0)}%)`}
                </div>
              )}
              <div style={{ fontSize: 9, color: C.creamDim, marginBottom: 8 }}>
                bar: <span style={{ color: C.amber }}>skill</span> + <span style={{ color: C.grass }}>gear</span> · the | mark is league average ({league.statBase})
              </div>
              {(selected.role === "bat" ? BAT_STATS : PIT_STATS).map((k) => {
                const cost = trainCost(selected, k);
                const ok = money >= cost;
                const base = selected[k];
                const bonus = gearBonus(selected, k);
                const scale = league.statBase + 6;
                const pct = (v) => `${Math.min(100, (v / scale) * 100)}%`;
                return (
                  <button key={k} onClick={() => onTrain(selected.id, k)} style={{ ...btn(ok), width: "100%", marginBottom: 6 }}>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontWeight: 600, textTransform: "uppercase", fontSize: 11, letterSpacing: 1 }}>{k}</span>
                      <span key={base} style={{ fontWeight: 600, fontSize: 15, display: "inline-block", animation: "statPop .5s", color: C.cream }}>{base}</span>
                      {bonus > 0 && <span style={{ color: C.grass, fontSize: 12, fontWeight: 600 }}>+{bonus}</span>}
                      <span style={{ marginLeft: "auto", fontSize: 11 }}>train → ${fmt(cost)}</span>
                    </span>
                    <span style={{ display: "block", position: "relative", height: 5, background: "#00000044", borderRadius: 2, margin: "6px 0 5px", overflow: "visible" }}>
                      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct(base), background: C.amber, borderRadius: 2 }} />
                      {bonus > 0 && <span style={{ position: "absolute", left: pct(base), top: 0, bottom: 0, width: pct(bonus), background: C.grass, borderRadius: "0 2px 2px 0" }} />}
                      <span style={{ position: "absolute", left: pct(league.statBase), top: -2, bottom: -2, width: 2, background: C.cream, opacity: 0.9 }} />
                    </span>
                    <span style={{ display: "block", fontSize: 10, color: C.creamDim }}>{STAT_INFO[k]}</span>
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

      <StatTable
        title="BATTING · this season"
        cols={["AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "K", "AVG", "OBP", "SLG", "OPS"]}
        rows={roster.batters.map((p) => {
          const s = stat(p.id);
          return { p, cells: [s.ab, s.r, s.h, s.d, s.t, s.hr, s.rbi, s.bb, s.k, ba(s), obp(s), slg(s), ops(s)] };
        })}
      />
      <StatTable
        title="PITCHING · this season"
        cols={["IP", "H", "R", "BB", "K", "ERA"]}
        rows={[roster.sp, roster.rp].map((p) => {
          const s = stat(p.id);
          return { p, cells: [ip(s), s.hP, s.raP, s.bbP, s.kP, era(s)] };
        })}
      />
    </div>
  );
}
