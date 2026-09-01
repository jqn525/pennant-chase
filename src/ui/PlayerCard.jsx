// ── The Player Card: pixel-art pop-up styled after the user's mockup ──
// Chunky amber frames with labels breaking the border, segmented skill bars,
// portrait box, equipment icon row, big stat footer. isOwn enables train/trade.

import { useState } from "react";
import { C, BAT_STATS, PIT_STATS, STAT_INFO, PLAYER_TRAITS, RARITY } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { btn, MONO, PIXEL, pixelPanel, pixelLegend } from "./styles.js";
import { StarIcon } from "./Icons.jsx";
import { GEAR, GEAR_ART, gearArtUrl, gearBonus, ovr } from "../game/gear.js";
import Modal from "./Modal.jsx";
import { portraitUrl } from "./portrait.js";
import { salaryOf, payRank } from "../game/salary.js";
import { HoloCard } from "./HoloCard.jsx";

const avg3 = (num, den) => (den ? (num / den).toFixed(3).replace(/^0/, "") : "—");
const rarityColor = { 1: "#8A9A8F", 2: C.amber, 3: C.red };
const FACE = C.green;

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

export default function PlayerCard({ player, isOwn, onClose, money, league, stat, trainCost, onTrain, onMaxTrain, onTrainAll, tradeQuote, onTrade, rivals, isStar }) {
  const [slotOpen, setSlotOpen] = useState(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [armedTrade, setArmedTrade] = useState(null);

  const isBat = player.role === "bat";
  const keys = isBat ? BAT_STATS : PIT_STATS;
  const trait = PLAYER_TRAITS.find((t) => t.id === player.trait);
  const slots = GEAR.filter((g) => (g.role === "bat") === isBat);
  const s = stat ? stat(player.id) : null;
  const scale = league.statBase + 32;

  // What TRAIN ALL would spend right now: cheapest point first, to ceilings
  // or the bank, whichever comes first (mirrors the App-side greedy plan).
  let trainAllQuote = 0;
  if (isOwn && trainCost) {
    const cur = {};
    keys.forEach((k) => { cur[k] = player[k]; });
    for (;;) {
      let best = null, bestCost = Infinity;
      for (const k of keys) {
        if (cur[k] >= (player.pot?.[k] ?? Infinity)) continue;
        const c = trainCost({ ...player, [k]: cur[k] }, k);
        if (c < bestCost) { best = k; bestCost = c; }
      }
      if (!best || trainAllQuote + bestCost > money) break;
      cur[best]++;
      trainAllQuote += bestCost;
    }
  }

  const statCols = s && (isBat
    ? [["AVG", avg3(s.h, s.ab)], ["HR", s.hr], ["RBI", s.rbi]]
    : [["ERA", s.outsP ? ((s.raP * 27) / s.outsP).toFixed(2) : "—"], ["K", s.kP], ["IP", s.outsP ? `${Math.floor(s.outsP / 3)}.${s.outsP % 3}` : "—"]]);

  const o = ovr(player);
  const rarity = isStar?.(player) ? "legendary" : o >= league.statBase + 6 ? "epic" : "common";
  // Card face stats: season line when we track one, top skills otherwise
  const cardStats = statCols
    ? statCols.map(([k, v]) => ({ k, v }))
    : [...keys].sort((a, b) => player[b] - player[a]).slice(0, 3)
        .map((k) => ({ k: k.toUpperCase().slice(0, 4), v: player[k] }));
  const cardTypes = [isBat ? "bat" : "pit", player.pos.toLowerCase(), ...(trait ? [trait.id] : [])];

  return (
    <Modal onClose={onClose}>
      <div style={{ background: FACE, border: `4px solid ${C.amber}`, borderRadius: 10, padding: "12px 12px 14px", fontFamily: MONO, color: C.cream, boxShadow: "0 12px 40px #000C" }}>
        {/* Kicker */}
        <div style={{ textAlign: "center", fontFamily: PIXEL, fontSize: 8, color: C.creamDim, letterSpacing: 1 }}>
          PENNANT CHASE · PLAYER CARD
        </div>

        {/* Holo card face */}
        <div className="holo-perspective" style={{ display: "flex", justifyContent: "center", margin: "10px 0 4px" }}>
          <HoloCard
            name={player.name}
            rarity={rarity}
            portrait={portraitUrl(player)}
            role={`${player.pos} · ${o.toFixed(0)} OVR`}
            types={cardTypes}
            statList={cardStats}
            level={Math.round(o)}
          />
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: C.creamDim, marginTop: 6 }}>
          SALARY <span style={{ color: C.cream, fontWeight: 600 }}>${fmt(salaryOf(player))}/YR</span>
          {rivals && <span> · #{payRank(player, rivals)} {player.pos}</span>}
          {isStar?.(player) && <span> · <StarIcon size={11} /></span>}
        </div>
        {trait && (
          <div style={{ textAlign: "center", fontSize: 10, color: C.creamDim, marginTop: 4 }}>
            <span style={{ color: C.amber, border: `1px solid ${C.amber}66`, borderRadius: 3, padding: "1px 6px", letterSpacing: 1, fontSize: 9 }}>{trait.label.toUpperCase()}</span>
            {" "}
            {Object.entries(trait.mods || trait.sit || {}).map(([st, n], i) => (
              <span key={st} style={{ color: n > 0 ? C.grass : C.red, fontWeight: 600 }}>
                {i > 0 ? " · " : ""}{n > 0 ? "+" : ""}{n}% {st.toUpperCase()}
              </span>
            ))}
            {trait.sit && <span style={{ color: C.dirt, letterSpacing: 1 }}> · RUNNERS ON</span>}
          </div>
        )}

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
            const chip = (on) => ({
              fontFamily: "inherit", fontSize: 9, letterSpacing: 1, padding: "4px 9px",
              background: "transparent", border: `1px solid ${on ? C.amber : "#31543f"}`,
              borderRadius: 4, color: on ? C.amber : C.creamDim, cursor: on ? "pointer" : "default",
            });
            return isOwn ? (
              <div key={k} style={{ padding: "4px 0" }}>
                {inner}
                <span style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginTop: 3 }}>
                  {peaked ? (
                    <span style={{ fontSize: 9, letterSpacing: 1, color: C.dirt, padding: "4px 0" }}>PEAKED</span>
                  ) : (
                    <>
                      <button onClick={() => onTrain(player.id, k)} title={STAT_INFO[k]} style={chip(ok)}>
                        TRAIN ${fmt(cost)}
                      </button>
                      <button onClick={() => onMaxTrain(player.id, k)} aria-label={`max ${k}`} style={chip(ok)}>
                        MAX
                      </button>
                    </>
                  )}
                </span>
              </div>
            ) : (
              <div key={k} style={{ padding: "6px 0" }}>{inner}</div>
            );
          })}
          {isOwn && trainAllQuote > 0 && (
            <button onClick={() => onTrainAll(player.id)}
              style={{
                width: "100%", marginTop: 8, fontFamily: PIXEL, fontSize: 9, letterSpacing: 1,
                padding: "11px 0", background: "#3A2E10", border: `2px solid ${C.amber}`,
                borderRadius: 6, color: C.amber, cursor: "pointer",
              }}>
              TRAIN ALL ${fmt(trainAllQuote)} / ${fmt(money)}
            </button>
          )}
          <div style={{ fontSize: 9, color: C.creamDim, marginTop: 4, textAlign: "center" }}>
            <span style={{ color: C.amber }}>■</span> skill · <span style={{ color: C.grass }}>■</span> boost · <span style={{ color: C.dirt }}>□</span> ceiling
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
                      <img src={gearArtUrl(item || g.slot)} alt={g.label} width={34} height={34}
                        style={{ imageRendering: "pixelated", borderRadius: 3, opacity: item ? 1 : 0.2, filter: item ? "none" : "grayscale(1)" }} />
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

        {/* spray tendency (season stat columns now live on the holo card face) */}
        {isBat && player.pull != null && (
          <div style={{ fontSize: 9, color: C.creamDim, textAlign: "center", marginTop: 8 }}>
            sprays: {Math.abs(player.pull) < 0.15 ? "everywhere" : player.pull < 0 ? `pulls left (${(Math.abs(player.pull) * 100).toFixed(0)}%)` : `slices right (${(player.pull * 100).toFixed(0)}%)`}
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
                    <span style={{ color: C.creamDim }}> · {team.name} · OVR {ovr(quote.them).toFixed(0)} · ${fmt(salaryOf(quote.them))}/yr{t ? ` · ${t.label}` : ""}</span>
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
