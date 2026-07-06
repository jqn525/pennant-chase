// ── Pro Shop tab: buy equipment for individual players, RPG style ──
// Limited stock per league (3 Standard / 2 Pro / 1 Elite of each item);
// the shelves restock every time the club is promoted.

import { useState } from "react";
import { C } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { panel, btn } from "./styles.js";
import { GEAR, TIER_NAMES, gearCost } from "../game/gear.js";

export default function ShopTab({ roster, money, tier, shopStock, onBuy }) {
  const [pick, setPick] = useState(null); // {slot, tier} — armed item awaiting a player

  if (tier < 1) {
    return (
      <div style={{ ...panel, padding: 16, marginTop: 2, fontSize: 12, lineHeight: 1.8, color: C.creamDim }}>
        <div style={{ fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>THE PRO SHOP · LOCKED</div>
        Little League equipment is hand-me-downs and duct tape. The Pro Shop opens once you reach
        <span style={{ color: C.amber }}> High School Ball</span> — win the Little League pennant to get there.
      </div>
    );
  }

  const itemCard = (item) => {
    const stock = shopStock?.[item.slot] || {};
    const players = item.role === "bat" ? roster.batters : [roster.sp, roster.rp];
    return (
      <div key={item.slot} style={{ ...panel, padding: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</span>
          <span style={{ fontSize: 11, color: C.grass }}>boosts {item.stat}</span>
          <span style={{ fontSize: 10, color: C.creamDim, marginLeft: "auto" }}>{item.flavor}</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {[1, 2, 3].map((t) => {
            const left = stock[t] ?? 0;
            const cost = gearCost(t, tier);
            const armed = pick && pick.slot === item.slot && pick.tier === t;
            const ok = left > 0;
            return (
              <button key={t} onClick={() => ok && setPick(armed ? null : { slot: item.slot, tier: t })}
                style={{ ...btn(ok), flex: "1 1 90px", textAlign: "center", border: `1px solid ${armed ? C.amber : C.greenLine}`, background: armed ? "#3A2E10" : "transparent", color: ok ? C.cream : C.creamDim }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 11 }}>{TIER_NAMES[t]} +{t}</span>
                <span style={{ display: "block", fontSize: 11, color: ok ? C.amber : C.creamDim }}>${fmt(cost)}</span>
                <span style={{ display: "block", fontSize: 9, color: left ? C.creamDim : C.red, letterSpacing: 1 }}>
                  {left > 0 ? `${left} LEFT` : "SOLD OUT"}
                </span>
              </button>
            );
          })}
        </div>
        {pick && pick.slot === item.slot && (
          <div style={{ marginTop: 8, borderTop: `1px solid ${C.greenLine}`, paddingTop: 8 }}>
            <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 6 }}>
              OUTFIT A PLAYER · {TIER_NAMES[pick.tier]} {item.label} · ${fmt(gearCost(pick.tier, tier))}
            </div>
            {players.map((p) => {
              const owned = p.gear?.[item.slot] ?? 0;
              const cost = gearCost(pick.tier, tier);
              const can = owned < pick.tier && money >= cost;
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 12 }}>
                  <span style={{ width: 26, color: C.creamDim }}>{p.pos}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: owned ? C.grass : C.creamDim }}>
                    {owned ? `${TIER_NAMES[owned]} owned` : `${item.stat} ${p[item.stat]}`}
                  </span>
                  {owned >= pick.tier
                    ? <span style={{ fontSize: 10, color: C.creamDim, width: 74, textAlign: "center" }}>OWNED</span>
                    : <button onClick={() => can && onBuy(p.id, item.slot, pick.tier)}
                        style={{ ...btn(can), width: 74, textAlign: "center", fontSize: 10, padding: "5px 0" }}>
                        {owned ? "UPGRADE" : "BUY"}
                      </button>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ marginTop: 2 }}>
      <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, margin: "6px 0 10px" }}>
        THE PRO SHOP · one of each slot per player · higher tier replaces lower · shelves restock when you're promoted
      </div>
      <div style={{ fontSize: 10, color: C.dirt, letterSpacing: 2, marginBottom: 6 }}>BATTER GEAR</div>
      {GEAR.filter((i) => i.role === "bat").map(itemCard)}
      <div style={{ fontSize: 10, color: C.dirt, letterSpacing: 2, margin: "14px 0 6px" }}>PITCHER GEAR</div>
      {GEAR.filter((i) => i.role === "pit").map(itemCard)}
    </div>
  );
}
