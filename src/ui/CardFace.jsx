// ── The card itself: the collectible face of a player ──
// Composed at runtime from the player's portrait plus a CSS ballpark, so every
// man in the league has a card without a single bespoke asset. The scene layer
// is deliberately isolated (.tcard__scene) — drop real art in there later.

import { useEffect, useRef, useState } from "react";
import { CARD_TIERS, printedTier, cardNumber, batsOf, throwsOf, nextPrint } from "../game/cards.js";
import { ovr } from "../game/gear.js";
import { fmt } from "../game/utils.js";
import { portraitUrl } from "./portrait.js";
import "./CardFace.css";

const avg3 = (num, den) => (den ? (num / den).toFixed(3).replace(/^0/, "") : ".000");
const monogram = (city) => {
  const words = `${city?.name ?? ""} ${city?.nickname ?? ""}`.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words[words.length - 1]?.[0] ?? "")).toUpperCase();
};

export default function CardFace({ player, city, year, stat, money, onPrint, isOwn }) {
  const tier = CARD_TIERS[printedTier(player)];
  const isBat = player.role === "bat";
  const s = stat ? stat(player.id) : null;
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 50, y: 50 });

  // Holo tracks the light: finger/pointer on the card, or the phone's own tilt
  useEffect(() => {
    const el = ref.current;
    if (!el || tier.id === 0) return;
    const move = (e) => {
      const t = e.touches?.[0] ?? e;
      const r = el.getBoundingClientRect();
      setTilt({
        x: Math.max(0, Math.min(100, ((t.clientX - r.left) / r.width) * 100)),
        y: Math.max(0, Math.min(100, ((t.clientY - r.top) / r.height) * 100)),
      });
    };
    const orient = (e) => {
      if (e.gamma == null) return;
      setTilt({
        x: Math.max(0, Math.min(100, 50 + e.gamma * 1.8)),
        y: Math.max(0, Math.min(100, 50 + (e.beta - 45) * 1.4)),
      });
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("deviceorientation", orient);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("touchmove", move);
      window.removeEventListener("deviceorientation", orient);
    };
  }, [tier.id]);

  const up = isOwn ? nextPrint(player) : null;
  const statLine = isBat
    ? [["AVG", avg3(s?.h, s?.ab)], ["HR", s?.hr ?? 0], ["RBI", s?.rbi ?? 0]]
    : [["ERA", s?.outsP ? ((s.raP * 27) / s.outsP).toFixed(2) : "—"], ["K", s?.kP ?? 0], ["IP", s?.outsP ? `${Math.floor(s.outsP / 3)}.${s.outsP % 3}` : "0.0"]];

  return (
    <div className="tcard-wrap">
      <div ref={ref} className={`tcard tcard--${tier.key}`}
        style={{ "--mx": `${tilt.x}%`, "--my": `${tilt.y}%` }}>
        <div className="tcard__border">
          <div className="tcard__head">
            <span className="tcard__brand">PENNANT<br />CHASE</span>
            <span className="tcard__team">{city?.name} {city?.nickname}</span>
            <span className="tcard__mono">{monogram(city)}</span>
          </div>

          <div className="tcard__photo">
            <img className="tcard__player" src={portraitUrl(player)} alt={`${player.name}`} />
            {/* Colour treatment of the print — swap this layer for real art later */}
            <span className="tcard__wash" aria-hidden="true" />
            <span className="tcard__ovr">{ovr(player).toFixed(0)}</span>
            <span className="tcard__holo" aria-hidden="true" />
            <span className="tcard__glare" aria-hidden="true" />
          </div>

          <div className="tcard__plate">
            <div className="tcard__name">{player.name.toUpperCase()}</div>
            <div className="tcard__meta">
              {player.pos} · BATS {batsOf(player)} · THROWS {throwsOf(player)}
            </div>
          </div>

          <div className="tcard__foot">
            <div className={`tcard__badge tcard__badge--${tier.key}`}>
              <b>{tier.name}</b>
              <small>{tier.flavor}</small>
            </div>
            <div className="tcard__facts">
              <div className="tcard__stats">
                {statLine.map(([label, v]) => (
                  <span key={label}><b>{label}</b>{v}</span>
                ))}
              </div>
              <div className="tcard__serial">
                SERIES {year} · NO. {cardNumber(player)}
                {tier.id === 3 && <span className="tcard__oneofone">1/1</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {up && (
        <button className="tcard-print" disabled={money < up.cost}
          onClick={() => money >= up.cost && onPrint(player.id)}>
          PRINT {up.name} — ${fmt(up.cost)}
          <small>{money < up.cost ? `short $${fmt(up.cost - money)}` : up.flavor}</small>
        </button>
      )}
      {isOwn && !up && tier.id < 3 && (
        <div className="tcard-note">
          Reach {CARD_TIERS[tier.id + 1].at} OVR to earn the {CARD_TIERS[tier.id + 1].name} print
        </div>
      )}
    </div>
  );
}
