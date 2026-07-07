// ── Front Office tab: revenue streams, trophy case, season history, save management ──

import { useState } from "react";
import { C, ECON } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { panel, btn } from "./styles.js";
import { CoinIcon, FansIcon } from "./Icons.jsx";

export default function FrontOfficeTab({ roster, city, fans, money, merch, tv, isStar, history, trophies, onBuyMerch, onBuyTv, onNewFranchise }) {
  const [armed, setArmed] = useState(false);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 2 }}>
      <div style={{ flex: "1 1 300px", minWidth: 280 }}>
        <div style={{ ...panel, padding: 12 }}>
          <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>REVENUE STREAMS</div>
          <button onClick={onBuyMerch} style={{ ...btn(!merch && money >= ECON.merchCost && fans >= ECON.merchFans), width: "100%", marginBottom: 6 }}>
            <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><CoinIcon /> Merch stand {merch ? "· OPEN" : ""}</span>
            {!merch && <div style={{ fontSize: 10, color: C.creamDim }}>${ECON.merchCost} + {ECON.merchFans} fans. Sells every second — even while you're away (capped at {ECON.offlineCapHours}h). Stars sell more.</div>}
            {merch && <div style={{ fontSize: 10, color: C.creamDim }}>Selling jerseys. Stars on the roster: {[...roster.batters, roster.sp, roster.rp].filter(isStar).length}</div>}
          </button>
          <button onClick={onBuyTv} style={{ ...btn(!tv && merch && fans >= ECON.tvFans && money >= ECON.tvCost), width: "100%" }}>
            <span style={{ fontWeight: 600 }}>Regional TV deal {tv ? "· SIGNED" : ""}</span>
            {!tv && <div style={{ fontSize: 10, color: C.creamDim }}>${fmt(ECON.tvCost)} · requires a merch stand and {fmt(ECON.tvFans)} fans. Doubles passive income.</div>}
          </button>
        </div>
        <div style={{ ...panel, padding: 12, marginTop: 14, fontSize: 12, lineHeight: 1.8 }}>
          <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>THE CLUB</div>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FansIcon /> {fmt(fans)} fans in {city.name}</span>
          City edge: {city.label}
        </div>
      </div>

      <div style={{ flex: "1 1 300px", minWidth: 280 }}>
        <div style={{ ...panel, padding: 12 }}>
          <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>
            TROPHY CASE · {trophies} PENNANT CUP{trophies === 1 ? "" : "S"} {trophies > 0 ? "🏆".repeat(Math.min(trophies, 10)) : ""}
          </div>
          {history.length === 0 ? (
            <div style={{ fontSize: 11, color: C.creamDim }}>No completed seasons yet. History is written every winter.</div>
          ) : (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", maxHeight: 300, overflowY: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.greenLine}` }}>
                    {["YEAR", "CHAMPION", "YOUR RECORD", "FINISH"].map((h) => (
                      <th key={h} style={{ textAlign: h === "YEAR" ? "left" : "right", padding: "3px 6px", color: C.creamDim, fontWeight: 400, letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((h) => (
                    <tr key={h.year} style={{ color: h.cup ? C.amber : C.cream, fontWeight: h.cup ? 600 : 400, borderBottom: `1px solid ${C.greenLine}33` }}>
                      <td style={{ padding: "4px 6px" }}>{h.year}</td>
                      <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap" }}>{h.champion}{h.cup ? " 🏆" : ""}</td>
                      <td style={{ padding: "4px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{h.playerRecord}</td>
                      <td style={{ padding: "4px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{h.finish}{["st", "nd", "rd"][h.finish - 1] || "th"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: "1 1 100%" }}>
        <div style={{ ...panel, padding: 12 }}>
          <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 6 }}>SAVE FILE</div>
          <div style={{ fontSize: 11, color: C.creamDim, marginBottom: 8 }}>
            Your franchise auto-saves on this device. Close the browser any time — the season waits for you (only the merch stand keeps selling).
          </div>
          <button
            onClick={() => (armed ? onNewFranchise() : setArmed(true))}
            onBlur={() => setArmed(false)}
            style={{ ...btn(true), border: `1px solid ${C.red}`, color: C.red }}>
            {armed ? "Are you sure? Tap again to erase everything" : "Sell the club — start a new franchise"}
          </button>
        </div>
      </div>
    </div>
  );
}
