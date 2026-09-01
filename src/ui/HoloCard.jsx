// ── HoloCard: holographic operative card with iridescent pointer effect ──
// Pointer position drives --mx/--my (glare + rainbow foil) and --tx/--ty
// (perspective tilt). An idle sheen animation sweeps the card when it is not
// being hovered. For the 3D tilt, wrap in `className="holo-perspective"`.

import React, { useRef, useEffect } from "react";
import "./HoloCard.css";

export function HoloCard({
  name = "Marine",
  rarity = "common",
  crest = "◆",
  crestColor = "c-cyan",
  role = "LINE VANGUARD",
  types = ["ground"],
  stats = { fire: 58, mob: 62, arm: 40 },
  level,
  locked = false,
  lockMsg = "LOCKED",
  interactive = true,
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || locked || !interactive) return;
    const MAX = 9;

    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      card.style.setProperty("--ty", ((px - 0.5) * 2 * MAX).toFixed(2) + "deg");
      card.style.setProperty("--tx", ((0.5 - py) * 2 * MAX).toFixed(2) + "deg");
    };
    const onEnter = () => card.classList.add("is-hover");
    const onLeave = () => {
      card.classList.remove("is-hover");
      card.style.setProperty("--tx", "0deg");
      card.style.setProperty("--ty", "0deg");
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "50%");
    };

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointerleave", onLeave);
    return () => {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
    };
  }, [locked, interactive]);

  const cls = [
    "holo",
    rarity,
    locked ? "locked" : "",
    interactive && !locked ? "interactive" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={cardRef} className={cls}>
      <div className="holo-in">
        {/* iridescent effect layers */}
        <div className="holo-spec" />
        <div className="holo-iri" />
        <div className="holo-noise" />

        {/* header */}
        <div className="holo-top">
          <span className="holo-name">{name}</span>
          {level != null && <span className="holo-lvl">Lv {level}</span>}
          <span className={`holo-rar ${rarity}`}>{rarity}</span>
        </div>

        {/* portrait */}
        <div className="holo-portrait">
          <span className={`crest ${crestColor}`}>{crest}</span>
          <span className="role-ic">{role}</span>
        </div>

        {/* type chips */}
        {types.length > 0 && (
          <div className="holo-types">
            {types.map((t) => (
              <span key={t} className={`holo-type tt-${t}`}>{t}</span>
            ))}
          </div>
        )}

        {/* stats */}
        <div className="holo-stats">
          <div className="holo-stat">
            <div className="v">{stats.fire ?? "—"}</div>
            <div className="k">FIRE</div>
          </div>
          <div className="holo-stat">
            <div className="v">{stats.mob ?? "—"}</div>
            <div className="k">MOB</div>
          </div>
          <div className="holo-stat">
            <div className="v">{stats.arm ?? "—"}</div>
            <div className="k">ARM</div>
          </div>
        </div>
      </div>

      {locked && (
        <div className="holo-lockmsg">
          <span>{lockMsg}</span>
        </div>
      )}
    </div>
  );
}

export default HoloCard;
