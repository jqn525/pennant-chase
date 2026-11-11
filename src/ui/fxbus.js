// ── A tiny bus between game events and the Fx layer ──
// useFranchise copies each drained event here; Fx.jsx subscribes. At MAX the
// stream is thinned: no win toasts, and at most one toast a second.
const subs = new Set();
let lastToast = 0;
const fmt = (n) => Math.round(Math.abs(n)).toLocaleString("en-US");

export function pushFx(e, fast) {
  let fx = null;
  if (e.type === "final" && e.won && !fast && e.net > 0) fx = { kind: "toast", text: `+$${fmt(e.net)}`, tone: "up" };
  else if (e.type === "trained" && !fast) fx = { kind: "toast", text: `▲ ${e.text}`, tone: "accent" };
  else if (e.type === "drop") fx = { kind: "banner", text: e.text, tone: e.rarity === 3 ? "gold" : "rare" };
  else if (e.type === "promo") fx = { kind: "promo", text: `Promoted · ${e.text}` };
  else if (e.type === "cup") fx = { kind: "promo", text: "✦ Zenith Pennant champions" };
  if (!fx) return;
  if (fx.kind === "toast") {
    const now = Date.now();
    if (now - lastToast < 1000) return;
    lastToast = now;
  }
  subs.forEach((fn) => fn(fx));
}
export function onFx(fn) { subs.add(fn); return () => subs.delete(fn); }
