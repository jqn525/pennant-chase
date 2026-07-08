// ── Shared style objects ──

import { C } from "../game/constants.js";

export const MONO = "'IBM Plex Mono', monospace";
export const SLAB = "'Alfa Slab One', serif";

export const bulb = { fontFamily: MONO, color: C.amber, textShadow: `0 0 12px ${C.amber}55` };

export const panel = { background: C.greenPanel, border: `1px solid ${C.greenLine}`, borderRadius: 6 };

export const btn = (enabled) => ({
  fontFamily: MONO, fontSize: 12, padding: "8px 10px", borderRadius: 4,
  border: `1px solid ${enabled ? C.amber : C.greenLine}`,
  background: enabled ? "#3A2E10" : "transparent",
  color: enabled ? C.amber : C.creamDim,
  cursor: enabled ? "pointer" : "default", opacity: enabled ? 1 : 0.55, textAlign: "left",
});

export const tabBtn = (active) => ({
  fontFamily: MONO, fontSize: 12, letterSpacing: 1, padding: "8px 14px",
  background: active ? C.greenPanel : "transparent", color: active ? C.amber : C.creamDim,
  border: `1px solid ${active ? C.amber : C.greenLine}`, borderBottom: active ? `1px solid ${C.greenPanel}` : `1px solid ${C.greenLine}`,
  borderRadius: "6px 6px 0 0", cursor: "pointer",
});

export const overlay = { position: "fixed", inset: 0, background: "#0A1810E6", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, zIndex: 50, overflowY: "auto" };

export const globalCss = `@import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=IBM+Plex+Mono:wght@400;600&display=swap');
  button:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }
  @keyframes statPop { 0% { transform: scale(1.7); color: ${C.grass}; } 100% { transform: scale(1); } }
  @keyframes sheetUp { 0% { transform: translateY(36px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }`;
