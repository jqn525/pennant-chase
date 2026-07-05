// ── Small shared helpers ──

export const fmt = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e4) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toLocaleString();
};

export const jitter = (base, spread = 1.5) => Math.max(1, Math.round(base + (Math.random() * 2 - 1) * spread));

// Sum of three rolls, centered around 0.5 — a cheap bell curve
export const gauss = () => (Math.random() + Math.random() + Math.random()) / 3;
