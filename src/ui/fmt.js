// ── Number formatting for the front office ──
const n0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

// $8,640 · −$64 · $1.25M for big sums
export function money(v, { sign = false, compact = true } = {}) {
  const a = Math.abs(v);
  let body;
  if (compact && a >= 1e6) body = `${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`;
  else if (compact && a >= 1e5) body = `${(a / 1e3).toFixed(0)}k`;
  else body = n0.format(Math.round(a));
  const pre = v < -0.5 ? "−" : sign && v > 0.5 ? "+" : "";
  return `${pre}$${body}`;
}
export const count = (v) => n0.format(Math.round(v));
export function payback(g) {
  if (!Number.isFinite(g)) return "no direct return";
  if (g < 1) return "pays back this game";
  return `pays back in ${g >= 999 ? "999+" : Math.ceil(g)} games`;
}
export function ordinal(n) {
  const v = n % 100;
  return `${n}${v >= 11 && v <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
}
