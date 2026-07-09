// ── Pro Shop tab: a rotating shipment of procedurally generated gear ──
// New assortment every series; unbought stock vanishes. Rarities: COMMON,
// RARE, LEGENDARY. Items boost their slot's stat and may carry a side-effect.

import { useState } from "react";
import { C, RARITY } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { panel, btn } from "./styles.js";
import Panel from "./Panel.jsx";
import { ClockIcon } from "./Icons.jsx";
import { GEAR, GEAR_ART, gearArtUrl } from "../game/gear.js";

const rarityStyle = {
  1: { color: C.creamDim, glow: "none" },
  2: { color: C.amber, glow: "none" },
  3: { color: C.red, glow: `0 0 8px ${C.red}66` },
};

const Boosts = ({ boosts }) => (
  <span>
    {Object.entries(boosts).map(([s, n], i) => (
      <span key={s} style={{ color: n > 0 ? C.grass : C.red, fontWeight: 600 }}>
        {i > 0 && <span style={{ color: C.creamDim }}> · </span>}
        {n > 0 ? "+" : ""}{n}% {s.toUpperCase()}
      </span>
    ))}
  </span>
);

export default function ShopTab({ roster, money, shopItems, onBuy, restockNote, tierInfo }) {
  const [pickId, setPickId] = useState(null); // armed item awaiting a player

  return (
    <div style={{ marginTop: 2 }}>
      <Panel title="THE PRO SHOP" titleRight="THIS SHIPMENT ONLY" style={{ marginTop: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: C.creamDim, marginBottom: 6 }}>
          Unbought gear ships out with the next delivery.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.amber, letterSpacing: 1 }}>
          <ClockIcon size={12} /> {restockNote}
        </div>
        {tierInfo && (
          <div style={{ fontSize: 10, color: C.creamDim, marginTop: 6 }}>
            <span style={{ color: C.dirt, letterSpacing: 1 }}>{tierInfo.label}</span> — {tierInfo.hint}
          </div>
        )}
      </Panel>

      {(!shopItems || shopItems.length === 0) && (
        <div style={{ ...panel, padding: 14, fontSize: 12, color: C.creamDim }}>
          The shelves are bare — a new shipment arrives with the next series.
        </div>
      )}

      {(shopItems || []).map((item) => {
        const def = GEAR.find((d) => d.slot === item.slot);
        const rs = rarityStyle[item.rarity];
        const armed = pickId === item.id;
        const players = def.role === "bat" ? roster.batters : [roster.sp, roster.rp];
        const afford = money >= item.cost;
        return (
          <div key={item.id} style={{ ...panel, padding: 12, marginBottom: 10, border: `1px solid ${armed ? C.amber : C.greenLine}` }}>
            <button onClick={() => setPickId(armed ? null : item.id)}
              style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: C.cream }}>
              {GEAR_ART.has(item.slot) && (
                <img src={gearArtUrl(item.slot)} alt={def.label} width={40} height={40}
                  style={{ imageRendering: "pixelated", flexShrink: 0, filter: item.rarity === 3 ? `drop-shadow(0 0 5px ${C.red})` : item.rarity === 2 ? `drop-shadow(0 0 4px ${C.amber}AA)` : "none" }} />
              )}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: rs.color, textShadow: rs.glow }}>{item.name}</span>
                  <span style={{ fontSize: 9, letterSpacing: 1.5, color: rs.color, border: `1px solid ${rs.color}`, borderRadius: 3, padding: "1px 5px" }}>{RARITY[item.rarity].name}</span>
                  <span style={{ fontSize: 10, color: C.creamDim }}>{def.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 13, color: afford ? C.amber : C.red, fontVariantNumeric: "tabular-nums" }}>${fmt(item.cost)}</span>
                </span>
                <span style={{ display: "block", fontSize: 11, marginTop: 4 }}>
                  <Boosts boosts={item.boosts} />
                  <span style={{ color: C.creamDim }}> — {def.flavor}</span>
                </span>
              </span>
            </button>

            {armed && (
              <div style={{ marginTop: 8, borderTop: `1px solid ${C.greenLine}`, paddingTop: 8 }}>
                <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 6 }}>
                  WHO GETS IT? {!afford && <span style={{ color: C.red }}>— NOT ENOUGH MONEY</span>}
                </div>
                {players.map((p) => {
                  const current = p.gear?.[item.slot];
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 12 }}>
                      <span style={{ width: 26, color: C.creamDim }}>{p.pos}</span>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 10, color: C.creamDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                        {current ? `replaces ${current.name || "old gear"}` : "empty slot"}
                      </span>
                      <button onClick={() => afford && onBuy(p.id, item.id)}
                        style={{ ...btn(afford), width: 60, textAlign: "center", fontSize: 10, padding: "5px 0" }}>
                        BUY
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
