// ── Motion moments: payout toasts, rare-drop banners, promotion flashes ──
import { useEffect, useState } from "react";
import { onFx } from "./fxbus.js";

const LIFE = { toast: 1300, banner: 2200, promo: 2400 };
let nextId = 1;

export default function Fx() {
  const [items, setItems] = useState([]);
  useEffect(() => onFx((fx) => {
    const id = nextId++;
    setItems((list) => [...list.slice(-4), { ...fx, id }]);
    setTimeout(() => setItems((list) => list.filter((x) => x.id !== id)), LIFE[fx.kind] || 1500);
  }), []);
  return (
    <div className="fx" aria-live="polite">
      {items.map((x) => (
        x.kind === "toast" ? <div key={x.id} className={`fx-toast fx-toast--${x.tone}`}>{x.text}</div>
          : x.kind === "banner" ? <div key={x.id} className={`fx-banner fx-banner--${x.tone}`}>{x.text}</div>
            : <div key={x.id} className="fx-promo"><i className="fx-flash" /><div className="fx-banner fx-banner--gold">{x.text}</div></div>
      ))}
    </div>
  );
}
