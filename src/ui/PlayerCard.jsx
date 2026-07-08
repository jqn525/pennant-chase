// ── The Player Card: pixel-art pop-up styled after the user's mockup ──
// Chunky amber frames with labels breaking the border, segmented skill bars,
// portrait box, equipment icon row, big stat footer. isOwn enables train/trade.

import { useState } from "react";
import { C, BAT_STATS, PIT_STATS, STAT_INFO, PLAYER_TRAITS, RARITY } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { btn, MONO, PIXEL, pixelPanel, pixelLegend } from "./styles.js";
import { StarIcon, BallIcon } from "./Icons.jsx";
import { GEAR, GEAR_ART, gearArtUrl, gearBonus, ovr } from "../game/gear.js";
import Modal from "./Modal.jsx";

const avg3 = (num, den) => (den ? (num / den).toFixed(3).replace(/^0/, "") : "—");
const rarityColor = { 1: "#8A9A8F", 2: C.amber, 3: C.red };
const FACE = C.green;

// Deterministic 16x16 pixel avatar: cap, face, jersey — tinted by player id
const SKINS = ["#E8B98A", "#C68B59", "#8D5A33", "#F2CBA0"];
const CAPS = ["#2B4C7E", "#7E2B2B", "#2B6045", "#4A3A6B", "#5C5C28"];
function PixelAvatar({ id, size = 84 }) {
  const skin = SKINS[id % SKINS.length];
  const cap = CAPS[(id * 7) % CAPS.length];
  const jersey = "#E9E4D4";
  // 16x16 grid, drawn coarsely with rects
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: "pixelated", display: "block" }} aria-label="player portrait">
      <rect x="0" y="0" width="16" height="16" fill="#7FA8C9" />
      {/* cap */}
      <rect x="4" y="2" width="8" height="2" fill={cap} />
      <rect x="3" y="4" width="10" height="1" fill={cap} />
      <rect x="10" y="4" width="4" height="1" fill={cap} />
      {/* face */}
      <rect x="5" y="5" width="6" height="5" fill={skin} />
      <rect x="6" y="6" width="1" height="1" fill="#2A2118" />
      <rect x="9" y="6" width="1" height="1" fill="#2A2118" />
      <rect x="7" y="8" width="2" height="1" fill="#B07850" />
      {/* neck + jersey */}
      <rect x="6" y="10" width="4" height="1" fill={skin} />
      <rect x="3" y="11" width="10" height="5" fill={jersey} />
      <rect x="7" y="11" width="2" height="5" fill="#C9C2AC" />
      <rect x="3" y="11" width="2" height="2" fill={skin} />
      <rect x="11" y="11" width="2" height="2" fill={skin} />
      {/* bat over shoulder */}
      <rect x="12" y="1" width="1" height="10" fill="#B98A4E" />
      <rect x="11" y="0" width="2" height="2" fill="#B98A4E" />
    </svg>
  );
}

// Segmented skill bar: [■■■■■□□□□□□□] with gear segments and a ceiling notch
const SEGS = 12;
function SegBar({ base, bonus, pot, scale }) {
  const filled = Math.round((base / scale) * SEGS);
  const gearSegs = bonus > 0 ? Math.max(1, Math.round((bonus / scale) * SEGS)) : 0;
  const potSeg = pot != null ? Math.min(SEGS - 1, Math.round((pot / scale) * SEGS)) : -1;
  return (
    <span style={{ display: "flex", gap: 2, alignItems: "center", flex: 1, minWidth: 0 }}>
      <span style={{ fontFamily: PIXEL, fontSize: 10, color: C.amber }}>[</span>
      {Array.from({ length: SEGS }, (_, i) => {
        const isGear = i >= filled && i < filled + gearSegs;
        const on = i < filled;
        const isPot = i === potSeg && !on && !isGear;
        return (
          <span key={i} style={{
            flex: 1, height: 12, borderRadius: 1, minWidth: 4,
            background: on ? C.amber : isGear ? C.grass : "#0A1810",
            border: isPot ? `1px solid ${C.dirt}` : "1px solid transparent",
            boxSizing: "border-box",
          }} />
        );
      })}
      <span style={{ fontFamily: PIXEL, fontSize: 10, color: C.amber }}>]</span>
    </span>
  );
}

export default function PlayerCard({ player, isOwn, onClose, money, league, stat, trainCost, onTrain, tradeQuote, onTrade, rivals, isStar }) {
  const [slotOpen, setSlotOpen] = useState(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [armedTrade, setArmedTrade] = useState(null);

  const isBat = player.role === "bat";
  const keys = isBat ? BAT_STATS : PIT_STATS;
  const trait = PLAYER_TRAITS.find((t) => t.id === player.trait);
  const slots = GEAR.filter((g) => (g.role === "bat") === isBat);
  const s = stat ? stat(player.id) : null;
  const scale = league.statBase + 32;

  const statCols = s && (isBat
    ? [["AVG", avg3(s.h, s.ab)], ["HR", s.hr], ["RBI", s.rbi]]
    : [["ERA", s.outsP ? ((s.raP * 27) / s.outsP).toFixed(2) : "—"], ["K", s.kP], ["IP", s.outsP ? `${Math.floor(s.outsP / 3)}.${s.outsP % 3}` : "—"]]);

  return (
    <Modal onClose={onClose}>
      <div style={{ background: FACE, border: `4px solid ${C.amber}`, borderRadius: 10, padding: "12px 12px 14px", fontFamily: MONO, color: C.cream, boxShadow: "0 12px 40px #000C" }}>
        {/* Kicker + name */}
        <div style={{ textAlign: "center", fontFamily: PIXEL, fontSize: 8, color: C.creamDim, letterSpacing: 1 }}>
          PENNANT CHASE · PLAYER CARD
        </div>
        <div style={{ textAlign: "center", fontFamily: PIXEL, fontSize: 16, color: C.amber, margin: "8px 0 2px", lineHeight: 1.4 }}>
          {player.name.toUpperCase()}
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, fontSize: 11, color: C.creamDim }}>
          <span>{player.pos}</span>
          {isStar?.(player) && <StarIcon size={12} />}
          <span style={{ fontFamily: PIXEL, fontSize: 12, color: C.cream }}>{ovr(player).toFixed(0)} OVR</span>
        </div>
        {trait && (
          <div style={{ textAlign: "center", fontSize: 10, color: C.creamDim, marginTop: 4 }}>
            <span style={{ color: C.amber, border: `1px solid ${C.amber}66`, borderRadius: 3, padding: "1px 6px", letterSpacing: 1, fontSize: 9 }}>{trait.label.toUpperCase()}</span>
            {" "}{trait.desc}
          </div>
        )}

        {/* Portrait */}
        <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 2px" }}>
          <div style={{ border: `3px solid ${C.amber}`, borderRadius: 6, overflow: "hidden", lineHeight: 0 }}>
            <PixelAvatar id={player.id} />
          </div>
        </div>

        {/* SKILLS */}
        <div style={pixelPanel}>
          <div style={pixelLegend(FACE)}>SKILLS</div>
          {keys.map((k) => {
            const base = player[k];
            const pot = player.pot?.[k];
            const peaked = pot != null && base >= pot;
            const cost = isOwn && trainCost ? trainCost(player, k) : 0;
            const ok = isOwn && money >= cost && !peaked;
            const bonus = gearBonus(player, k);
            const inner = (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 66, fontSize: 10, letterSpacing: 1, color: C.cream, textTransform: "uppercase", textAlign: "right", flexShrink: 0 }}>{k}:</span>
                <SegBar base={base} bonus={bonus} pot={pot} scale={scale} />
                <span style={{ width: 58, textAlign: "right", flexShrink: 0 }}>
                  <span key={base} style={{ fontFamily: PIXEL, fontSize: 12, color: C.cream, display: "inline-block", animation: "statPop .5s" }}>{base}</span>
                  {bonus !== 0 && <span style={{ fontSize: 10, fontWeight: 600, color: bonus > 0 ? C.grass : C.red }}> {bonus > 0 ? "+" : ""}{bonus}</span>}
                </span>
              </span>
            );
            return isOwn ? (
              <button key={k} onClick={() => onTrain(player.id, k)} title={STAT_INFO[k]}
                style={{ display: "block", width: "100%", background: "transparent", border: "none", padding: "4px 0", cursor: ok ? "pointer" : "default", fontFamily: "inherit", color: C.cream, opacity: 1 }}>
                {inner}
                <span style={{ display: "block", textAlign: "right", fontSize: 9, letterSpacing: 1, color: peaked ? C.dirt : ok ? C.amber : C.creamDim, marginTop: 1 }}>
                  {peaked ? "PEAKED" : `TRAIN $${fmt(cost)}`}
                </span>
              </button>
            ) : (
              <div key={k} style={{ padding: "6px 0" }}>{inner}</div>
            );
          })}
          <div style={{ fontSize: 9, color: C.creamDim, marginTop: 4, textAlign: "center" }}>
            <span style={{ color: C.amber }}>■</span> skill · <span style={{ color: C.grass }}>■</span> gear · <span style={{ color: C.dirt }}>□</span> ceiling
          </div>
        </div>

        {/* EQUIPMENT */}
        <div style={pixelPanel}>
          <div style={pixelLegend(FACE)}>EQUIPMENT</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {slots.map((g) => {
              const item = player.gear?.[g.slot];
              const open = slotOpen === g.slot;
              return (
                <div key={g.slot} style={{ textAlign: "center", flex: "1 1 56px", minWidth: 56, maxWidth: 78 }}>
                  <div style={{ fontSize: 8, letterSpacing: 1, color: C.creamDim, marginBottom: 3, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {g.label}:
                  </div>
                  <button onClick={() => setSlotOpen(open ? null : g.slot)}
                    style={{
                      width: "100%", height: 52, borderRadius: 4, cursor: "pointer",
                      background: item ? "#0A1810" : "transparent", fontFamily: MONO,
                      border: item ? `2px solid ${rarityColor[item.rarity] || C.creamDim}` : `2px dashed ${C.greenLine}`,
                      boxShadow: item?.rarity === 3 ? `0 0 8px ${C.red}55` : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                    {GEAR_ART.has(g.slot) ? (
                      <img src={gearArtUrl(g.slot)} alt={g.label} width={34} height={34}
                        style={{ imageRendering: "pixelated", opacity: item ? 1 : 0.25, filter: item ? "none" : "grayscale(1)" }} />
                    ) : (
                      <span style={{ fontFamily: PIXEL, fontSize: 10, color: item ? rarityColor[item.rarity] : C.greenLine }}>
                        {g.label.slice(0, 1)}
                      </span>
                    )}
                  </button>
                  <div style={{ fontSize: 8, color: item ? rarityColor[item.rarity] : C.greenLine, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item ? item.name : "empty"}
                  </div>
                </div>
              );
            })}
          </div>
          {slotOpen && (() => {
            const item = player.gear?.[slotOpen];
            const def = GEAR.find((g) => g.slot === slotOpen);
            return (
              <div style={{ fontSize: 10, marginTop: 8, color: C.creamDim, textAlign: "center" }}>
                {item ? (
                  <>
                    <span style={{ color: rarityColor[item.rarity], fontWeight: 700 }}>{item.name}</span>
                    <span style={{ letterSpacing: 1 }}> · {RARITY[item.rarity]?.name}</span> ·{" "}
                    {Object.entries(item.boosts).map(([st, n], i) => (
                      <span key={st} style={{ color: n > 0 ? C.grass : C.red }}>{i > 0 ? " · " : ""}{n > 0 ? "+" : ""}{n}% {st}</span>
                    ))}
                  </>
                ) : (
                  <>No {def.label.toLowerCase()} equipped — check the Pro Shop's next shipment.</>
                )}
              </div>
            );
          })()}
        </div>

        {/* STATS */}
        {isOwn && statCols && (
          <div style={pixelPanel}>
            <div style={pixelLegend(FACE)}>STATS</div>
            <span style={{ position: "absolute", top: 8, left: 8 }}><BallIcon size={11} color={C.creamDim} /></span>
            <span style={{ position: "absolute", top: 8, right: 8 }}><BallIcon size={11} color={C.creamDim} /></span>
            <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", padding: "2px 0 2px" }}>
              {statCols.map(([label, v]) => (
                <div key={label}>
                  <div style={{ fontFamily: PIXEL, fontSize: 9, color: C.creamDim, marginBottom: 5 }}>{label}</div>
                  <div style={{ fontFamily: PIXEL, fontSize: 15, color: C.cream }}>{v}</div>
                </div>
              ))}
            </div>
            {isBat && player.pull != null && (
              <div style={{ fontSize: 9, color: C.creamDim, textAlign: "center", marginTop: 6 }}>
                sprays: {Math.abs(player.pull) < 0.15 ? "everywhere" : player.pull < 0 ? `pulls left (${(Math.abs(player.pull) * 100).toFixed(0)}%)` : `slices right (${(player.pull * 100).toFixed(0)}%)`}
              </div>
            )}
          </div>
        )}

        {/* Trade desk */}
        {isOwn && tradeOpen && rivals && (
          <div style={{ ...pixelPanel, padding: "16px 8px 8px" }}>
            <div style={pixelLegend(FACE)}>TRADE DESK</div>
            {player.pos === "RP" ? (
              <div style={{ fontSize: 11, color: C.creamDim, textAlign: "center" }}>Rival clubs don't carry relievers — no market.</div>
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
                    <span style={{ color: C.creamDim }}> · {team.name} · OVR {ovr(quote.them).toFixed(0)}{t ? ` · ${t.label}` : ""}</span>
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
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {isOwn && (
            <button onClick={() => setTradeOpen((o) => !o)}
              style={{ flex: 1, fontFamily: PIXEL, fontSize: 9, padding: "10px 0", background: "transparent", border: `3px solid ${C.amber}`, borderRadius: 6, color: C.amber, cursor: "pointer", letterSpacing: 1 }}>
              {tradeOpen ? "HIDE TRADES" : "TRADE DESK"}
            </button>
          )}
          <button onClick={onClose}
            style={{ flex: 1, fontFamily: PIXEL, fontSize: 9, padding: "10px 0", background: "transparent", border: `3px solid ${C.creamDim}`, borderRadius: 6, color: C.cream, cursor: "pointer", letterSpacing: 1 }}>
            CLOSE
          </button>
        </div>
      </div>
    </Modal>
  );
}
