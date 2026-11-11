// ── HoloCard: a player as a holographic card. Rarity is his star-power tier. ──
// The pointer sets four CSS variables (--mx, --my, --rx, --ry); every visual
// layer (tilt, specular, iridescent sheen, foil, grain) lives in holo.css.
import { useRef } from "react";
import { ovr } from "../game/gear.js";
import { CARD_TIERS } from "../game/cards.js";
import "./holo.css";

export const RARITY_CLASS = ["common", "rare", "epic", "legendary"];
export const crestFor = (p) => (p.role === "bat" ? "◆" : p.pos === "SP" ? "⬢" : p.pos === "CL" ? "✦" : "▲");
const topStat = (p) => {
  const keys = p.role === "bat" ? ["contact", "power", "eye", "speed", "defense"] : ["stuff", "control", "stamina"];
  const k = keys.reduce((a, b) => (p[b] > p[a] ? b : a));
  return [k.slice(0, 3).toUpperCase(), p[k]];
};

export default function HoloCard({ p, slot, chips = [], mini = false, onClick }) {
  const ref = useRef(null);
  const frame = useRef(0);
  const tier = Math.min(3, p.cardTier || 0);
  const set = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      el.style.setProperty("--rx", `${((0.5 - y) * 18).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * 18).toFixed(2)}deg`);
    });
  };
  const enter = (e) => { ref.current?.classList.add("is-live"); set(e); };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.classList.remove("is-live");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  const [tk, tv] = topStat(p);
  const Tag = onClick ? "button" : "article";
  return (
    <Tag ref={ref} type={onClick ? "button" : undefined} onClick={onClick}
      className={`holo holo--${RARITY_CLASS[tier]}${mini ? " holo--mini" : ""}`}
      onPointerEnter={enter} onPointerMove={set} onPointerLeave={leave} onPointerCancel={leave}
      aria-label={onClick ? `${p.name}, ${CARD_TIERS[tier].name}` : undefined}>
      <div className="holo__face">
        <div className="holo__top"><span>{slot || p.pos}</span><b>{tier ? CARD_TIERS[tier].name : "Unsigned"}</b></div>
        <div className="holo__portrait"><span aria-hidden="true">{crestFor(p)}</span></div>
        <h3 className="holo__name">{p.name}</h3>
        {!mini && chips.length > 0 && <div className="holo__chips">{chips.filter(Boolean).map((c) => <span key={c}>{c}</span>)}</div>}
        <div className="holo__stats">
          <div><b>{ovr(p).toFixed(0)}</b><small>OVR</small></div>
          <div><b>{tv}</b><small>{tk}</small></div>
          <div><b>{p.age ?? "—"}</b><small>AGE</small></div>
        </div>
        <i className="holo__fx holo__foil" /><i className="holo__fx holo__iri" /><i className="holo__fx holo__spec" /><i className="holo__fx holo__grain" />
      </div>
    </Tag>
  );
}
