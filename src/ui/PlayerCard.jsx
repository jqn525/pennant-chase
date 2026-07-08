// ── The Player Card: a vintage baseball card pop-up with everything about one player ──
// isOwn: our player (train + trade enabled). Otherwise a view-only scouting card.

import { useState } from "react";
import { C, BAT_STATS, PIT_STATS, STAT_INFO, PLAYER_TRAITS, RARITY } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { btn, MONO, SLAB } from "./styles.js";
import { StarIcon } from "./Icons.jsx";
import { GEAR, GEAR_ART, gearArtUrl, gearBonus, ovr } from "../game/gear.js";
import Modal from "./Modal.jsx";

const avg3 = (num, den) => (den ? (num / den).toFixed(3).replace(/^0/, "") : "—");
const rarityColor = { 1: "#8A9A8F", 2: C.amber, 3: C.red };

export default function PlayerCard({ player, isOwn, onClose, money, league, stat, trainCost, onTrain, tradeQuote, onTrade, rivals, isStar }) {
  const [slotOpen, setSlotOpen] = useState(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [armedTrade, setArmedTrade] = useState(null);

  const isBat = player.role === "bat";
  const keys = isBat ? BAT_STATS : PIT_STATS;
  const trait = PLAYER_TRAITS.find((t) => t.id === player.trait);
  const slots = GEAR.filter((g) => (g.role === "bat") === isBat);
  const s = stat ? stat(player.id) : null;
  const seasonLine = s && (isBat
    ? `AVG ${avg3(s.h, s.ab)} · HR ${s.hr} · RBI ${s.rbi} · OPS ${s.ab ? ((s.h + s.bb) / (s.ab + s.bb) + (s.h + s.d + 2 * s.t + 3 * s.hr) / s.ab).toFixed(3) : "—"}`
    : `ERA ${s.outsP ? ((s.raP * 27) / s.outsP).toFixed(2) : "—"} · K ${s.kP} · IP ${s.outsP ? `${Math.floor(s.outsP / 3)}.${s.outsP % 3}` : "—"}`);

  return (
    <Modal onClose={onClose}>
      {/* Cream card frame */}
      <div style={{ background: C.cream, borderRadius: 12, padding: 10, fontFamily: MONO, boxShadow: "0 12px 40px #000A" }}>
        {/* Printed header on the frame */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "2px 4px 8px" }}>
          <span style={{ fontFamily: SLAB, fontSize: 18, color: C.green }}>{player.name}</span>
          <span style={{ fontSize: 12, color: "#5B6B5F", fontWeight: 700 }}>{player.pos}</span>
          {isStar?.(player) && <StarIcon size={14} color="#B8860B" />}
          <span style={{ marginLeft: "auto", fontFamily: SLAB, fontSize: 22, color: C.green }}>
            {ovr(player).toFixed(1)}<span style={{ fontSize: 9, letterSpacing: 1 }}> OVR</span>
          </span>
        </div>

        {/* Green card face */}
        <div style={{ background: C.green, border: `2px solid ${C.greenLine}`, borderRadius: 8, padding: 12, color: C.cream }}>
          {trait && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 9, letterSpacing: 1, color: C.amber, border: `1px solid ${C.amber}66`, borderRadius: 3, padding: "1px 6px" }}>{trait.label.toUpperCase()}</span>
              <span style={{ fontSize: 10, color: C.creamDim }}>{trait.desc}</span>
            </div>
          )}

          {/* Attribute bars */}
          <div style={{ fontSize: 9, color: C.creamDim, marginBottom: 6 }}>
            bar: <span style={{ color: C.amber }}>skill</span> + <span style={{ color: C.grass }}>gear</span> · <span style={{ color: C.cream }}>|</span> league avg · <span style={{ color: C.dirt }}>|</span> ceiling
          </div>
          {keys.map((k) => {
            const base = player[k];
            const pot = player.pot?.[k];
            const peaked = pot != null && base >= pot;
            const cost = isOwn && trainCost ? trainCost(player, k) : 0;
            const ok = isOwn && money >= cost && !peaked;
            const bonus = gearBonus(player, k);
            const scale = league.statBase + 8;
            const pct = (v) => `${Math.min(100, (v / scale) * 100)}%`;
            const inner = (
              <>
                <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontWeight: 600, textTransform: "uppercase", fontSize: 11, letterSpacing: 1 }}>{k}</span>
                  <span key={base} style={{ fontWeight: 600, fontSize: 15, display: "inline-block", animation: "statPop .5s", color: C.cream }}>{base}</span>
                  {bonus !== 0 && <span style={{ color: bonus > 0 ? C.grass : C.red, fontSize: 12, fontWeight: 600 }}>{bonus > 0 ? "+" : ""}{bonus}</span>}
                  {isOwn && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: peaked ? C.dirt : ok ? C.amber : C.creamDim, letterSpacing: peaked ? 1 : 0 }}>
                      {peaked ? "PEAKED" : `train → $${fmt(cost)}`}
                    </span>
                  )}
                </span>
                <span style={{ display: "block", position: "relative", height: 5, background: "#00000044", borderRadius: 2, margin: "5px 0 2px", overflow: "visible" }}>
                  <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct(base), background: C.amber, borderRadius: 2 }} />
                  {bonus > 0 && <span style={{ position: "absolute", left: pct(base), top: 0, bottom: 0, width: pct(bonus), background: C.grass, borderRadius: "0 2px 2px 0" }} />}
                  <span style={{ position: "absolute", left: pct(league.statBase), top: -2, bottom: -2, width: 2, background: C.cream, opacity: 0.9 }} />
                  {pot != null && <span style={{ position: "absolute", left: pct(pot), top: -2, bottom: -2, width: 2, background: C.dirt }} />}
                </span>
              </>
            );
            return isOwn ? (
              <button key={k} onClick={() => onTrain(player.id, k)} title={STAT_INFO[k]}
                style={{ ...btn(ok), width: "100%", marginBottom: 5, padding: "6px 8px" }}>
                {inner}
              </button>
            ) : (
              <div key={k} style={{ padding: "6px 8px", marginBottom: 5, border: `1px solid ${C.greenLine}`, borderRadius: 4 }}>
                {inner}
              </div>
            );
          })}

          {/* Equipment shelf */}
          <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, margin: "10px 0 6px" }}>EQUIPMENT</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {slots.map((g) => {
              const item = player.gear?.[g.slot];
              const open = slotOpen === g.slot;
              return (
                <button key={g.slot} onClick={() => setSlotOpen(open ? null : g.slot)}
                  style={{
                    flex: "1 1 56px", minWidth: 56, height: GEAR_ART.has(g.slot) ? 68 : 52, borderRadius: 6, cursor: "pointer",
                    background: item ? "#0A1810" : "transparent", fontFamily: MONO,
                    border: item ? `1.5px solid ${rarityColor[item.rarity] || C.creamDim}` : `1.5px dashed ${C.greenLine}`,
                    color: item ? rarityColor[item.rarity] || C.cream : C.creamDim,
                    boxShadow: item?.rarity === 3 ? `0 0 8px ${C.red}55` : "none",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                  }}>
                  {GEAR_ART.has(g.slot) ? (
                    <img src={gearArtUrl(g.slot)} alt={g.label} width={30} height={30}
                      style={{ imageRendering: "pixelated", opacity: item ? 1 : 0.25, filter: item ? "none" : "grayscale(1)" }} />
                  ) : (
                    <span style={{ fontSize: 9, letterSpacing: 1 }}>{g.label.toUpperCase().slice(0, 9)}</span>
                  )}
                  <span style={{ fontSize: 8, color: item ? C.cream : C.greenLine, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 3px" }}>
                    {item ? item.name : GEAR_ART.has(g.slot) ? g.label : "empty"}
                  </span>
                </button>
              );
            })}
          </div>
          {slotOpen && (() => {
            const item = player.gear?.[slotOpen];
            const def = GEAR.find((g) => g.slot === slotOpen);
            return (
              <div style={{ fontSize: 10, marginTop: 6, color: C.creamDim }}>
                {item ? (
                  <>
                    <span style={{ color: rarityColor[item.rarity], fontWeight: 700 }}>{item.name}</span>
                    <span style={{ letterSpacing: 1 }}> · {RARITY[item.rarity]?.name}</span> ·{" "}
                    {Object.entries(item.boosts).map(([st, n], i) => (
                      <span key={st} style={{ color: n > 0 ? C.grass : C.red }}>{i > 0 ? " · " : ""}{n > 0 ? "+" : ""}{n} {st}</span>
                    ))}
                  </>
                ) : (
                  <>No {def.label.toLowerCase()} equipped — check the Pro Shop's next shipment.</>
                )}
              </div>
            );
          })()}

          {/* Season + flavor */}
          {isOwn && seasonLine && (
            <div style={{ fontSize: 11, color: C.creamDim, marginTop: 10 }}>THIS SEASON · {seasonLine}</div>
          )}
          {isBat && player.pull != null && (
            <div style={{ fontSize: 10, color: C.creamDim, marginTop: 4 }}>
              Sprays: {Math.abs(player.pull) < 0.15 ? "everywhere" : player.pull < 0 ? `pulls left (${(Math.abs(player.pull) * 100).toFixed(0)}%)` : `slices right (${(player.pull * 100).toFixed(0)}%)`}
            </div>
          )}

          {/* Trade desk */}
          {isOwn && tradeOpen && rivals && (
            <div style={{ marginTop: 10, borderTop: `1px solid ${C.greenLine}`, paddingTop: 8 }}>
              {player.pos === "RP" ? (
                <div style={{ fontSize: 11, color: C.creamDim }}>Rival clubs don't carry relievers — no market.</div>
              ) : rivals.map((team, i) => {
                const quote = tradeQuote(player, i);
                if (!quote) return null;
                const t = PLAYER_TRAITS.find((x) => x.id === quote.them.trait);
                const canPay = money >= quote.cash;
                const armed = armedTrade === i;
                return (
                  <div key={team.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", fontSize: 11, borderBottom: `1px solid ${C.greenLine}33` }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>{quote.them.name}</span>
                      <span style={{ color: C.creamDim }}> · {team.name} · OVR {ovr(quote.them).toFixed(1)}{t ? ` · ${t.label}` : ""}</span>
                    </span>
                    <span style={{ fontSize: 10, color: quote.cash > 0 ? C.red : C.grass, whiteSpace: "nowrap" }}>
                      {quote.cash > 0 ? `pay $${fmt(quote.cash)}` : `get $${fmt(-quote.cash)}`}
                    </span>
                    <button
                      onClick={() => (armed ? (onTrade(player.id, i), setArmedTrade(null), onClose()) : setArmedTrade(i))}
                      onBlur={() => setArmedTrade(null)}
                      style={{ ...btn(canPay || quote.cash <= 0), width: 60, textAlign: "center", fontSize: 9, padding: "5px 0", border: `1px solid ${armed ? C.red : C.greenLine}`, color: armed ? C.red : undefined }}>
                      {armed ? "SURE?" : "TRADE"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {isOwn && (
              <button onClick={() => setTradeOpen((o) => !o)} style={{ ...btn(true), flex: 1, textAlign: "center" }}>
                {tradeOpen ? "HIDE TRADE DESK" : "TRADE DESK"}
              </button>
            )}
            <button onClick={onClose} style={{ ...btn(true), flex: 1, textAlign: "center" }}>CLOSE</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
