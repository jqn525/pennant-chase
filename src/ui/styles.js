// ── Shared style objects (the rest of the look lives in ui.css) ──

import { C } from "../game/constants.js";

// No backdrop-filter here: iOS WebKit mis-clips blurred fixed overlays with
// inner scroll, leaving unpainted bands. The dim is near-opaque anyway.
export const overlay = { position: "fixed", inset: 0, background: "#040B08E8", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 14, zIndex: 50, overflowY: "auto" };

export const globalCss = `
  button:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }
  @keyframes statPop { 0% { transform: scale(1.7); color: ${C.grass}; } 100% { transform: scale(1); } }
  button { transition: transform 60ms steps(2), filter 60ms steps(2); }
  button:active { transform: translateY(2px) scale(0.98); filter: brightness(0.88); }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }`;
