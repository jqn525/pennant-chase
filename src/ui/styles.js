// ── Shared style objects ──

import { C } from "../game/constants.js";

export const MONO = "'IBM Plex Mono', monospace";
export const SLAB = "'Alfa Slab One', serif";
export const PIXEL = "'Press Start 2P', monospace";
export const CONDENSED = "'Barlow Condensed', sans-serif";

export const panel = {
  background: "linear-gradient(145deg, #183A28, #0E281B)",
  border: "1px solid #85602D", borderRadius: 10,
  boxShadow: "inset 0 1px #FFFFFF12, 0 8px 22px #030A0755",
};

export const btn = (enabled) => ({
  minHeight: 40, fontFamily: CONDENSED, fontWeight: 700, letterSpacing: 0.5,
  textTransform: "uppercase", fontSize: 13, padding: "9px 11px", borderRadius: 7,
  border: `1px solid ${enabled ? C.amber : C.greenLine}`,
  background: enabled ? "linear-gradient(180deg, #3F3519, #2C260F)" : "#0A1A12",
  color: enabled ? C.amber : C.creamDim,
  boxShadow: enabled ? "inset 0 1px #FFF2, 0 4px 10px #0004" : "none",
  cursor: enabled ? "pointer" : "default", opacity: enabled ? 1 : 0.55, textAlign: "left",
});

// No backdrop-filter here: iOS WebKit mis-clips blurred fixed overlays with
// inner scroll, leaving unpainted bands. The dim is near-opaque anyway.
export const overlay = { position: "fixed", inset: 0, background: "#040B08E8", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 14, zIndex: 50, overflowY: "auto" };

export const globalCss = `
  button:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }
  @keyframes statPop { 0% { transform: scale(1.7); color: ${C.grass}; } 100% { transform: scale(1); } }
  button { transition: transform 60ms steps(2), filter 60ms steps(2); }
  button:active { transform: translateY(2px) scale(0.98); filter: brightness(0.88); }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }`;
