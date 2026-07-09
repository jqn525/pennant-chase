// ── The Franchise Creator: name your club, pick your edge, get a random roster ──

import { useState } from "react";
import { C, EDGES, CITY_POOL, NICKNAME_POOL } from "../game/constants.js";
import { btn, globalCss, MONO, PIXEL, SLAB } from "./styles.js";
import Panel from "./Panel.jsx";
import { DiceIcon } from "./Icons.jsx";

const roll = (pool) => pool[(Math.random() * pool.length) | 0];

const inputStyle = {
  flex: 1, minWidth: 0, background: "#0A1810", color: C.cream, border: `2px solid ${C.greenLine}`,
  borderRadius: 6, fontFamily: MONO, fontSize: 15, fontWeight: 600, padding: "10px 10px",
  letterSpacing: 1, boxSizing: "border-box",
};
const diceBtn = {
  width: 46, display: "flex", alignItems: "center", justifyContent: "center",
  background: "transparent", border: `2px solid ${C.greenLine}`, borderRadius: 6, cursor: "pointer",
};

export default function CitySelect({ onPick, onRestore }) {
  const [tCity, setTCity] = useState(() => roll(CITY_POOL));
  const [nick, setNick] = useState(() => roll(NICKNAME_POOL));
  const [edge, setEdge] = useState(null);
  const [open, setOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [err, setErr] = useState(null);

  const ready = tCity.trim().length > 0 && nick.trim().length > 0 && edge != null;
  const start = () => {
    if (!ready) return;
    const e = EDGES[edge];
    onPick({ name: tCity.trim(), nickname: nick.trim(), bonus: e.bonus, label: `${e.title}: ${e.label}` });
  };

  return (
    <div style={{ minHeight: "100dvh", background: C.green, color: C.cream, fontFamily: MONO, padding: "calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(24px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))", boxSizing: "border-box" }}>
      <style>{globalCss}</style>
      <div style={{ maxWidth: 460, margin: "28px auto 0" }}>
        <h1 style={{ fontFamily: SLAB, fontSize: 30, letterSpacing: 1, textAlign: "center", margin: "0 0 4px" }}>
          PENNANT<span style={{ color: C.amber }}> CHASE</span>
        </h1>
        <div style={{ textAlign: "center", fontFamily: PIXEL, fontSize: 9, color: C.creamDim, letterSpacing: 1 }}>
          FOUND YOUR FRANCHISE
        </div>

        <Panel title="YOUR CLUB">
          <div style={{ fontSize: 9, color: C.creamDim, letterSpacing: 2, marginBottom: 4 }}>CITY</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={tCity} maxLength={16} onChange={(e) => setTCity(e.target.value)} style={inputStyle} />
            <button style={diceBtn} aria-label="random city" onClick={() => setTCity(roll(CITY_POOL))}><DiceIcon size={17} /></button>
          </div>
          <div style={{ fontSize: 9, color: C.creamDim, letterSpacing: 2, marginBottom: 4 }}>TEAM NAME</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={nick} maxLength={16} onChange={(e) => setNick(e.target.value)} style={inputStyle} />
            <button style={diceBtn} aria-label="random team name" onClick={() => setNick(roll(NICKNAME_POOL))}><DiceIcon size={17} /></button>
          </div>
          <div style={{ textAlign: "center", fontFamily: PIXEL, fontSize: 11, color: C.amber, letterSpacing: 1, lineHeight: 1.6, minHeight: 20 }}>
            {(tCity.trim() + " " + nick.trim()).toUpperCase()}
          </div>
        </Panel>

        <Panel title="YOUR EDGE">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EDGES.map((e, i) => {
              const on = edge === i;
              return (
                <button key={e.bonus} onClick={() => setEdge(i)}
                  style={{
                    flex: "1 1 46%", minWidth: 150, textAlign: "left", padding: "9px 10px", cursor: "pointer",
                    background: on ? "#3A2E10" : "transparent", border: `2px solid ${on ? C.amber : C.greenLine}`,
                    borderRadius: 6, color: on ? C.amber : C.cream, fontFamily: MONO,
                  }}>
                  <div style={{ fontFamily: PIXEL, fontSize: 8, letterSpacing: 1, marginBottom: 4 }}>{e.title}</div>
                  <div style={{ fontSize: 10, color: C.creamDim }}>{e.label}</div>
                </button>
              );
            })}
          </div>
        </Panel>

        <div style={{ fontSize: 10, color: C.creamDim, textAlign: "center", margin: "14px 0 0" }}>
          Your roster is drafted for you — random names, random talent. Seven rival clubs await.
        </div>

        <button onClick={start}
          style={{
            width: "100%", marginTop: 12, fontFamily: PIXEL, fontSize: 11, padding: "14px 0", letterSpacing: 1,
            background: ready ? "#3A2E10" : "transparent", border: `3px solid ${ready ? C.amber : C.greenLine}`,
            borderRadius: 8, color: ready ? C.amber : C.creamDim, cursor: ready ? "pointer" : "default",
          }}>
          START FRANCHISE
        </button>

        <div style={{ marginTop: 22, textAlign: "center" }}>
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
