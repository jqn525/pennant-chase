// ── The Player Card: two faces of one man ──
// Front is the GM's ledger — minimal text: who he is, what he can be trained
// to, what he's wearing. Flip it and you're holding the collectible: his
// actual baseball card, printed at whatever rarity he's earned.

import { useState } from "react";
import { C, BAT_STATS, PIT_STATS, STAT_INFO, PLAYER_TRAITS, RARITY } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { btn, MONO, PIXEL, pixelPanel, pixelLegend } from "./styles.js";
import { StarIcon, BallIcon } from "./Icons.jsx";
import { GEAR, GEAR_ART, gearArtUrl, gearBonus, ovr } from "../game/gear.js";
import { CARD_TIERS, printedTier, nextPrint } from "../game/cards.js";
import Modal from "./Modal.jsx";
import CardFace from "./CardFace.jsx";
import { salaryOf, payRank } from "../game/salary.js";

const avg3 = (num, den) => (den ? (num / den).toFixed(3).replace(/^0/, "") : "—");
const rarityColor = { 1: "#8A9A8F", 2: C.amber, 3: C.red };
const FACE = C.green;

// Continuous skill bar: amber fill to the trained value, green extension for
// gear, a dirt tick where training stops (ceiling), darker track beyond.
function SkillBar({ base, bonus, ceil, scale }) {
  const pct = (v) => `${Math.min(100, Math.max(0, (v / scale) * 100))}%`;
  return (
    <span style={{ position: "relative", display: "block", height: 8, borderRadius: 4, background: "#0A1810", overflow: "hidden" }}>
      {bonus > 0 && (
        <span style={{ position: "absolute", inset: "0 auto 0 0", width: pct(base + bonus), background: C.grass, borderRadius: 4 }} />
      )}
      <span style={{ position: "absolute", inset: "0 auto 0 0", width: pct(base), background: C.amber, borderRadius: 4 }} />
      {bonus < 0 && (
        <span style={{ position: "absolute", inset: "0 auto 0 0", width: pct(base), background: `linear-gradient(90deg, ${C.amber} ${pct(base + bonus)}, ${C.red} ${pct(base + bonus)})`, borderRadius: 4 }} />
      )}
      {Number.isFinite(ceil) && (
        <span style={{ position: "absolute", top: 0, bottom: 0, left: pct(ceil), width: 2, background: C.dirt }} />
      )}
    </span>
  );
}

export default function PlayerCard({ player, isOwn, onClose, money, league, stat, trainCost, trainCeil, onTrainN, onTrainAll, tradeQuote, onTrade, rivals, isStar, franchise, city, year, onPrintCard }) {
  const [slotOpen, setSlotOpen] = useState(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [armedTrade, setArmedTrade] = useState(null);
  const [buyN, setBuyN] = useState(1); // buy mode: 1, 5, or Infinity (MAX)
  const [flipped, setFlipped] = useState(false);
  const [turning, setTurning] = useState(false);

  const isBat = player.role === "bat";
  const keys = isBat ? BAT_STATS : PIT_STATS;
  const trait = PLAYER_TRAITS.find((t) => t.id === player.trait);
  const slots = GEAR.filter((g) => (g.role === "bat") === isBat);
  const s = stat ? stat(player.id) : null;
  const scale = league.statBase + 32;

  // Where training stops for this player (potential, or the league cap when
  // untagged) — authoritative logic lives in App's trainCeil.
  const ceilOf = (k) => (isOwn && trainCeil ? trainCeil(player, k) : player.pot?.[k] ?? Infinity);

  // Quote a greedy plan: up to n points of the given keys, bounded by
  // ceilings and the bank (mirrors the App-side planTraining exactly).
  const quotePlan = (planKeys, n) => {
    const cur = {};
    planKeys.forEach((k) => { cur[k] = player[k]; });
    let total = 0, count = 0;
    while (count < n) {
      let best = null, bestCost = Infinity;
      for (const k of planKeys) {
        if (cur[k] >= ceilOf(k)) continue;
        const c = trainCost({ ...player, [k]: cur[k] }, k);
        if (c < bestCost) { best = k; bestCost = c; }
      }
      if (!best || total + bestCost > money) break;
      cur[best]++;
      total += bestCost;
      count++;
    }
    return { total, count };
  };
  const trainAllQuote = isOwn && trainCost ? quotePlan(keys, Infinity) : { total: 0, count: 0 };

  // The card he's had printed, and whether the press owes him a better one
  const tier = CARD_TIERS[printedTier(player)];
  const canPrintNow = isOwn && !!nextPrint(player);
  const TIER_INK = {
    common: { color: C.creamDim, border: `1px solid ${C.creamDim}66` },
    uncommon: { color: C.grass, border: `1px solid ${C.grass}88` },
    rare: { color: "#9fd0ff", border: "1px solid #9fd0ff99" },
    unique: { color: "#f5d27a", border: "1px solid #f5d27a" },
  };
  const tierChip = TIER_INK[tier.key];

  // Half-turn, swap faces, half-turn back — reads as a flip without the
  // equal-height demands (and iOS quirks) of a true backface rotation.
  const flip = () => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return setFlipped((f) => !f);
    setTurning(true);
    setTimeout(() => { setFlipped((f) => !f); setTurning(false); }, 170);
  };

  const statCols = s && (isBat
    ? [["AVG", avg3(s.h, s.ab)], ["HR", s.hr], ["RBI", s.rbi]]
    : [["ERA", s.outsP ? ((s.raP * 27) / s.outsP).toFixed(2) : "—"], ["K", s.kP], ["IP", s.outsP ? `${Math.floor(s.outsP / 3)}.${s.outsP % 3}` : "—"]]);

  return (
    <Modal onClose={onClose}>
      <div style={{
        background: FACE, border: `4px solid ${C.amber}`, borderRadius: 10, padding: "12px 12px 14px",
        fontFamily: MONO, color: C.cream, boxShadow: "0 12px 40px #000C",
        transform: turning ? "perspective(1100px) rotateY(90deg)" : "perspective(1100px) rotateY(0deg)",
        transition: "transform .17s ease-in", transformOrigin: "center",
      }}>
        {/* Kicker */}
        <div style={{ textAlign: "center", fontFamily: PIXEL, fontSize: 8, color: C.creamDim, letterSpacing: 1 }}>
          PENNANT CHASE · {flipped ? "THE CARD" : "PLAYER FILE"}
        </div>

        {/* Identity: text only — the man's likeness lives on the card face.
            Hidden once flipped: the card itself already carries his name,
            position and numbers, and the space lets it sit without scrolling
            so it can own every touch gesture. */}
        {!flipped && (
        <div style={{ margin: "9px 0 4px" }}>
          <div style={{ fontFamily: PIXEL, fontSize: 14, color: C.amber, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {player.name.toUpperCase()}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: C.creamDim, marginTop: 4, flexWrap: "wrap" }}>
            <span>{player.pos}</span>
            {isStar?.(player) && <StarIcon size={12} />}
            {player.franchise && (
              <span style={{ fontFamily: PIXEL, fontSize: 7, color: C.amber, border: `1px solid ${C.amber}`, borderRadius: 3, padding: "2px 4px", letterSpacing: 1 }}>FRANCHISE</span>
            )}
            <span style={{ fontFamily: PIXEL, fontSize: 7, letterSpacing: 1, borderRadius: 3, padding: "2px 4px", ...tierChip }}>
              {tier.name}
            </span>
            <span style={{ fontFamily: PIXEL, fontSize: 12, color: C.cream, marginLeft: "auto" }}>{ovr(player).toFixed(0)} OVR</span>
          </div>
          <div style={{ fontSize: 10, color: C.creamDim, marginTop: 4 }}>
            SALARY <span style={{ color: C.cream, fontWeight: 600 }}>${fmt(salaryOf(player))}/YR</span>
            {rivals && <span> · #{payRank(player, rivals)} {player.pos}</span>}
          </div>
          {trait && (
            <div style={{ fontSize: 10, color: C.creamDim, marginTop: 5, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span style={{ color: C.amber, border: `1px solid ${C.amber}66`, borderRadius: 3, padding: "1px 5px", letterSpacing: 1, fontSize: 9 }}>{trait.label.toUpperCase()}</span>
              {Object.entries(trait.mods || trait.sit || {}).map(([st, n]) => (
                <span key={st} style={{ color: n > 0 ? C.grass : C.red, fontWeight: 600 }}>
                  {n > 0 ? "+" : ""}{n}% {st.toUpperCase()}
                </span>
              ))}
              {trait.sit && <span style={{ color: C.dirt, letterSpacing: 1 }}>RUNNERS ON</span>}
            </div>
          )}
        </div>
        )}

        {/* Flip to the collectible */}
        <button onClick={flip} style={{
          width: "100%", margin: "10px 0 2px", fontFamily: PIXEL, fontSize: 9, letterSpacing: 1,
          padding: "10px 0", background: canPrintNow ? "#3A2E10" : "transparent",
          border: `2px solid ${canPrintNow ? C.amber : C.creamDim}`, borderRadius: 6,
          color: canPrintNow ? C.amber : C.cream, cursor: "pointer",
        }}>
          {flipped ? "◀ BACK TO FILE" : canPrintNow ? "VIEW CARD ⟳ — NEW PRINT READY" : "VIEW CARD ⟳"}
        </button>

        {flipped && (
          <div style={{ margin: "12px 0 2px" }}>
            <CardFace player={player} city={city} year={year} stat={stat}
              money={money} onPrint={onPrintCard} isOwn={isOwn} />
          </div>
        )}

        {!flipped && (<>
        {/* SKILLS */}
        <div style={pixelPanel}>
          <div style={pixelLegend(FACE)}>SKILLS</div>
          {isOwn && (
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0, marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: C.creamDim, letterSpacing: 1, marginRight: 7 }}>TRAIN</span>
              {[[1, "×1"], [5, "×5"], [Infinity, "MAX"]].map(([n, label], i) => (
                <button key={label} onClick={() => setBuyN(n)}
                  style={{
                    fontFamily: PIXEL, fontSize: 8, letterSpacing: 1, padding: "5px 10px", cursor: "pointer",
                    background: buyN === n ? "#3A2E10" : "transparent",
                    border: `1px solid ${buyN === n ? C.amber : "#31543f"}`,
                    borderRadius: i === 0 ? "4px 0 0 4px" : i === 2 ? "0 4px 4px 0" : 0,
                    marginLeft: i === 0 ? 0 : -1,
                    color: buyN === n ? C.amber : C.creamDim,
                  }}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {keys.map((k) => {
            const base = player[k];
            const pot = player.pot?.[k];
            const ceil = ceilOf(k);
            const peaked = pot != null && base >= pot;
            const capped = !peaked && Number.isFinite(ceil) && base >= ceil; // held back by the league cap, not talent
            const bonus = gearBonus(player, k);
            const quote = isOwn && !peaked && !capped ? quotePlan([k], buyN) : { total: 0, count: 0 };
            const ok = quote.count > 0;
            return (
              <div key={k} title={STAT_INFO[k]}
                style={{ display: "grid", gridTemplateColumns: isOwn ? "1fr 78px" : "1fr", gap: 10, alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${C.greenLine}33` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, letterSpacing: 1, color: C.creamDim, textTransform: "uppercase", flex: 1 }}>{k}</span>
                    <span key={base} style={{ fontFamily: PIXEL, fontSize: 13, color: C.cream, display: "inline-block", animation: "statPop .5s" }}>{base}</span>
                    {bonus !== 0 && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: bonus > 0 ? C.grass : C.red, background: "#0A1810", borderRadius: 3, padding: "1px 4px" }}>
                        {bonus > 0 ? "+" : ""}{bonus}
                      </span>
                    )}
                    {Number.isFinite(ceil) && (
                      <span style={{ fontSize: 10, color: C.dirt }}>/ {ceil}</span>
                    )}
                  </div>
                  <SkillBar base={base} bonus={bonus} ceil={ceil} scale={scale} />
                </div>
                {isOwn && (
                  peaked || capped ? (
                    <span title={capped ? "The league development cap — franchise players train past it" : "His natural ceiling — only gear goes higher"}
                      style={{ fontSize: 8, fontFamily: PIXEL, letterSpacing: 1, color: C.dirt, textAlign: "center", border: `1px dashed ${C.dirt}66`, borderRadius: 4, padding: "8px 0" }}>
                      {peaked ? "PEAKED" : "LEAGUE CAP"}
                    </span>
                  ) : (
                    <button onClick={() => ok && onTrainN(player.id, k, buyN)} aria-label={`train ${k}`}
                      style={{
                        fontFamily: PIXEL, fontSize: 8, letterSpacing: 0.5, padding: "7px 0", width: "100%",
                        background: ok ? "#3A2E10" : "transparent", border: `1px solid ${ok ? C.amber : "#31543f"}`,
                        borderRadius: 4, color: ok ? C.amber : C.creamDim, cursor: ok ? "pointer" : "default",
                        lineHeight: 1.5,
                      }}>
                      +{quote.count || 1}<br />${fmt(quote.total || trainCost(player, k))}
                    </button>
                  )
                )}
              </div>
            );
          })}
          {isOwn && trainAllQuote.count > 0 && (
            <button onClick={() => onTrainAll(player.id)}
              style={{
                width: "100%", marginTop: 8, fontFamily: PIXEL, fontSize: 9, letterSpacing: 1,
                padding: "11px 0", background: "#3A2E10", border: `2px solid ${C.amber}`,
                borderRadius: 6, color: C.amber, cursor: "pointer",
              }}>
              TRAIN ALL · {trainAllQuote.count} PTS · ${fmt(trainAllQuote.total)}
            </button>
          )}
          {isOwn && franchise && !player.franchise && (() => {
            const slotFree = franchise.used < franchise.max;
            return (
              <button onClick={() => slotFree && franchise.onTag(player.id)}
                style={{
                  width: "100%", marginTop: 8, fontFamily: PIXEL, fontSize: 9, letterSpacing: 1,
                  padding: "11px 0", background: "transparent",
                  border: `2px solid ${slotFree ? C.amber : "#31543f"}`, borderRadius: 6,
                  color: slotFree ? C.amber : C.creamDim, cursor: slotFree ? "pointer" : "default",
                }}>
                {slotFree
                  ? `FRANCHISE TAG (${franchise.used}/${franchise.max} used) — TRAIN PAST ${franchise.cap}`
                  : `NO FRANCHISE TAGS LEFT (${franchise.used}/${franchise.max}) — WIN THE CUP FOR MORE`}
              </button>
            );
          })()}
          <div style={{ fontSize: 9, color: C.creamDim, marginTop: 6, textAlign: "center" }}>
            {isOwn && <span>bank ${fmt(money)} · </span>}
            <span style={{ color: C.grass }}>green</span> = gear boost · <span style={{ color: C.dirt }}>tick</span> = training stops
            {isOwn && franchise && !player.franchise && <span> (league cap {franchise.cap})</span>}
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
        </>)}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {isOwn && !flipped && (
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
