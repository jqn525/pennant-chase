// ── Front Office tab: revenue streams, club summary, save management ──

import { useState } from "react";
import { C, LEAGUES } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { panel, btn } from "./styles.js";
import { CoinIcon, FansIcon } from "./Icons.jsx";

export default function FrontOfficeTab({ roster, city, league, tier, fans, money, merch, tv, champ, isStar, onBuyMerch, onBuyTv, onNewFranchise }) {
  const [armed, setArmed] = useState(false);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 2 }}>
      <div style={{ flex: "1 1 300px", minWidth: 280 }}>
        <div style={{ ...panel, padding: 12 }}>
          <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>REVENUE STREAMS</div>
          <button onClick={onBuyMerch} style={{ ...btn(!merch && money >= 150 && fans >= 200), width: "100%", marginBottom: 6 }}>
            <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><CoinIcon /> Merch stand {merch ? "· OPEN" : ""}</span>
            {!merch && <div style={{ fontSize: 10, color: C.creamDim }}>$150 + 200 fans. Passive income every second; each star player boosts it 60%.</div>}
            {merch && <div style={{ fontSize: 10, color: C.creamDim }}>Selling jerseys. Stars on the roster: {[...roster.batters, roster.sp, roster.rp].filter(isStar).length}</div>}
          </button>
          <button onClick={onBuyTv} style={{ ...btn(!tv && merch && tier >= 3 && money >= 2500), width: "100%" }}>
            <span style={{ fontWeight: 600 }}>Regional TV deal {tv ? "· SIGNED" : ""}</span>
            {!tv && <div style={{ fontSize: 10, color: C.creamDim }}>$2,500 · requires Triple-A and a merch stand. Triples passive income.</div>}
          </button>
        </div>
      </div>
      <div style={{ flex: "1 1 300px", minWidth: 280 }}>
        <div style={{ ...panel, padding: 12, fontSize: 12, lineHeight: 1.8 }}>
          <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 8 }}>THE CLUB</div>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FansIcon /> {fmt(fans)} fans in {city.name}</span>
          City edge: {city.label}<br />
          League: {league.name} ({tier + 1}/{LEAGUES.length})<br />
          {champ ? "World Series Champions." : `Path: ${LEAGUES.slice(tier).map((l) => l.name).join(" → ")}`}
        </div>
      </div>
      <div style={{ flex: "1 1 100%" }}>
        <div style={{ ...panel, padding: 12 }}>
          <div style={{ fontSize: 10, color: C.creamDim, letterSpacing: 2, marginBottom: 6 }}>SAVE FILE</div>
          <div style={{ fontSize: 11, color: C.creamDim, marginBottom: 8 }}>
            Your franchise auto-saves on this device after every play. Close the browser any time — you'll pick up where you left off.
          </div>
          <button
            onClick={() => (armed ? onNewFranchise() : setArmed(true))}
            onBlur={() => setArmed(false)}
            style={{ ...btn(true), borderColor: C.red, color: C.red }}>
            {armed ? "Are you sure? Tap again to erase everything" : "Sell the club — start a new franchise"}
          </button>
        </div>
      </div>
    </div>
  );
}
