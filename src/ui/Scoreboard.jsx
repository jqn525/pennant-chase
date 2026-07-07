// ── The stadium scoreboard header: team marquee + glowing stat board ──

import { C, LEAGUE } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { panel, bulb, MONO, SLAB } from "./styles.js";
import { CoinIcon, FansIcon, StarIcon, TrophyIcon, RulebookIcon } from "./Icons.jsx";

const BOARD_BG = "#0A1810";

function Cell({ label, icon, value, flex = "1 1 0" }) {
  return (
    <div style={{ flex, minWidth: 58, padding: "8px 4px 7px", textAlign: "center", borderRight: `1px solid ${C.greenLine}33` }}>
      <div style={{ fontSize: 9, color: C.creamDim, letterSpacing: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, height: 13 }}>
        {icon}{label}
      </div>
      <div style={{ ...bulb, fontSize: 20, fontWeight: 600, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

export default function Scoreboard({ city, year, record, money, fans, talent, trophies, form, phase, playoffs, gameIndex, onHelp }) {
  // Where are we in the season?
  let ticker;
  if (phase === "playoffs" && playoffs) {
    ticker = `${playoffs.round === "semi" ? "SEMIFINAL" : "PENNANT CUP"} · SERIES ${playoffs.wins.us}-${playoffs.wins.them}`;
  } else {
    ticker = `GAME ${Math.min(gameIndex + 1, LEAGUE.seasonGames)} OF ${LEAGUE.seasonGames}`;
  }

  return (
    <div style={{ ...panel, padding: "12px 14px 14px", borderBottom: `3px solid ${C.amber}` }}>
      {/* Marquee */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <h1 style={{ fontFamily: SLAB, fontSize: "clamp(14px, 4.3vw, 20px)", margin: 0, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {city.name.toUpperCase()}<span style={{ color: C.amber }}> BASEBALL</span>
        </h1>
        <button onClick={onHelp} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.greenLine}`, borderRadius: 4, color: C.cream, fontFamily: MONO, fontSize: 11, padding: "6px 10px", cursor: "pointer", flexShrink: 0 }}>
          <RulebookIcon /> RULEBOOK
        </button>
      </div>

      {/* The board */}
      <div style={{ background: BOARD_BG, border: `1px solid ${C.greenLine}`, borderRadius: 6, boxShadow: "inset 0 2px 8px #00000066" }}>
        <div style={{ display: "flex" }}>
          <Cell label="YEAR" value={year} />
          <Cell label="RECORD" value={`${record.w}-${record.l}`} flex="1.3 1 0" />
          <Cell label="MONEY" icon={<CoinIcon size={10} color={C.creamDim} />} value={"$" + fmt(money)} flex="1.5 1 0" />
        </div>
        <div style={{ display: "flex", borderTop: `1px solid ${C.greenLine}33` }}>
          <Cell label="FANS" icon={<FansIcon size={10} color={C.creamDim} />} value={fmt(fans)} flex="1.3 1 0" />
          <Cell label="TALENT" icon={<StarIcon size={9} color={C.creamDim} />} value={talent} />
          <Cell label="CUPS" icon={<TrophyIcon size={10} color={C.creamDim} />} value={trophies} />
        </div>
        {/* Ticker: form bulbs + season position */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${C.greenLine}33`, padding: "6px 10px" }}>
          <span style={{ fontSize: 9, color: C.creamDim, letterSpacing: 2 }}>FORM</span>
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {form.length === 0 && <span style={{ fontSize: 10, color: C.creamDim }}>—</span>}
            {form.map((r, i) => (
              <span key={i} title={r} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: r === "W" ? C.amber : "#243B2E",
                boxShadow: r === "W" ? `0 0 6px ${C.amber}88` : "none",
              }} />
            ))}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: C.dirt, letterSpacing: 1.5, whiteSpace: "nowrap" }}>{ticker}</span>
        </div>
      </div>
    </div>
  );
}
