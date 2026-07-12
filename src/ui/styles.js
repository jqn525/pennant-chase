// ── Shared style objects ──

import { C } from "../game/constants.js";

export const MONO = "'IBM Plex Mono', monospace";
export const SLAB = "'Alfa Slab One', serif";
export const PIXEL = "'Press Start 2P', monospace";
export const CONDENSED = "'Barlow Condensed', sans-serif";

// Chunky retro frame with a label that breaks the border (mockup style)
export const pixelPanel = {
  position: "relative", border: `3px solid ${C.amber}`, borderRadius: 8,
  padding: "16px 10px 10px", marginTop: 14,
};
export const pixelLegend = (bg) => ({
  position: "absolute", top: 0, left: "50%", transform: "translate(-50%, -55%)",
  background: bg, padding: "0 8px", fontFamily: PIXEL, fontSize: 11,
  color: C.amber, letterSpacing: 1, whiteSpace: "nowrap",
});

export const bulb = { fontFamily: MONO, color: C.amber, textShadow: `0 0 12px ${C.amber}55` };

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

export const tabBtn = (active) => ({
  fontFamily: MONO, fontSize: 12, letterSpacing: 1, padding: "8px 14px",
  background: active ? C.greenPanel : "transparent", color: active ? C.amber : C.creamDim,
  border: `1px solid ${active ? C.amber : C.greenLine}`, borderBottom: active ? `1px solid ${C.greenPanel}` : `1px solid ${C.greenLine}`,
  borderRadius: "6px 6px 0 0", cursor: "pointer",
});

export const overlay = { position: "fixed", inset: 0, background: "#040B08E8", backdropFilter: "blur(7px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 14, zIndex: 50, overflowY: "auto" };

export const globalCss = `
  button:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }
  @keyframes statPop { 0% { transform: scale(1.7); color: ${C.grass}; } 100% { transform: scale(1); } }
  @keyframes sheetUp { 0% { transform: translateY(36px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
  @keyframes screenIn { 0% { transform: translateY(12px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
  button:active { transform: scale(0.96); }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }`;
