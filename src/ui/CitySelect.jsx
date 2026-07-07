// ── City selection screen (shown before the club is founded) ──

import { useState } from "react";
import { C, CITIES } from "../game/constants.js";
import { panel, btn, globalCss, MONO, SLAB } from "./styles.js";

export default function CitySelect({ onPick, onRestore }) {
  const [open, setOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [err, setErr] = useState(null);
  return (
    <div style={{ minHeight: "100dvh", background: C.green, color: C.cream, fontFamily: MONO, padding: "calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))", boxSizing: "border-box" }}>
      <style>{globalCss}</style>
      <div style={{ maxWidth: 720, margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ fontFamily: SLAB, fontSize: 30, letterSpacing: 1 }}>
          PENNANT<span style={{ color: C.amber }}> CHASE</span>
        </h1>
        <p style={{ color: C.creamDim, fontSize: 13 }}>
          Found a club in the Bigs. Eight teams, 154 games a season, one Pennant Cup —
          and the seasons never stop. Your rivals get better every winter. Will you?
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

        <div style={{ marginTop: 28 }}>
          <button onClick={() => { setOpen((o) => !o); setErr(null); }}
            style={{ background: "transparent", border: "none", color: C.creamDim, fontFamily: MONO, fontSize: 11, textDecoration: "underline", cursor: "pointer" }}>
            Have a backup code from another device?
          </button>
          {open && (
            <div style={{ maxWidth: 440, margin: "10px auto 0", textAlign: "left" }}>
              <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Paste your backup code here"
                style={{ width: "100%", height: 80, background: "#0A1810", color: C.cream, border: `1px solid ${C.greenLine}`, borderRadius: 4, fontFamily: "monospace", fontSize: 10, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <button onClick={() => setErr(onRestore(pasted))} style={{ ...btn(pasted.trim().length > 0), fontFamily: MONO }}>
                  Restore franchise
                </button>
                {err && <span style={{ fontSize: 10, color: C.red }}>{err}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
