// ── City selection screen (shown before the club is founded) ──

import { C, CITIES } from "../game/constants.js";
import { panel, globalCss, MONO, SLAB } from "./styles.js";

export default function CitySelect({ onPick }) {
  return (
    <div style={{ minHeight: "100dvh", background: C.green, color: C.cream, fontFamily: MONO, padding: "calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))", boxSizing: "border-box" }}>
      <style>{globalCss}</style>
      <div style={{ maxWidth: 720, margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ fontFamily: SLAB, fontSize: 30, letterSpacing: 1 }}>
          PENNANT<span style={{ color: C.amber }}> CHASE</span>
        </h1>
        <p style={{ color: C.creamDim, fontSize: 13 }}>
          Found a club. Start in Little League. Claw your way to the Majors.
          Pick your city — each comes with a permanent edge.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 20 }}>
          {CITIES.map((c) => (
            <button key={c.name} onClick={() => onPick(c)}
              style={{ ...panel, borderColor: C.amber, padding: 16, width: 210, cursor: "pointer", color: C.cream, fontFamily: MONO, textAlign: "left" }}>
              <div style={{ fontFamily: SLAB, fontSize: 16, color: C.amber, marginBottom: 6 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: C.creamDim, lineHeight: 1.5 }}>{c.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
