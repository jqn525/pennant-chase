// ── Front Office tab: stadium and revenue upgrades, trophy case, season history ──

import { C, STADIUM, REVENUE } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { btn } from "./styles.js";
import Panel from "./Panel.jsx";
import { FansIcon, TrophyIcon, CarIcon, SeatsIcon, ConcessionIcon, LightsIcon, ShirtIcon, TvIcon } from "./Icons.jsx";

const TRACK_ICONS = { parking: CarIcon, seats: SeatsIcon, conc: ConcessionIcon, lights: LightsIcon, merch: ShirtIcon, tv: TvIcon };

function UpgradeTrack({ track, level, money, fans, onBuy, locked }) {
  const Icon = TRACK_ICONS[track.id];
  const cur = level > 0 ? track.tiers[level - 1] : null;
  const next = track.tiers[level];
  const can = !locked && next && money >= next.cost && fans >= next.fans;
  return (
    <button onClick={() => onBuy(track.id)} style={{ ...btn(!!can), width: "100%", marginBottom: 6, textAlign: "left" }}>
      <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon size={13} color={can ? C.amber : C.creamDim} /> {track.title}
        <span style={{ marginLeft: "auto", fontSize: 10, color: C.dirt, letterSpacing: 1 }}>
          {cur ? cur.name.toUpperCase() : ""}{!next ? " · MAX" : ""}
        </span>
      </span>
      {next && (
        <div style={{ fontSize: 10, color: C.creamDim, marginTop: 2 }}>
          {next.name} · {next.label} · ${fmt(next.cost)}{fans < next.fans ? ` · ${fmt(next.fans)} fans` : ""}
        </div>
      )}
    </button>
  );
}

export default function FrontOfficeTab({ roster, city, fans, money, merch, tv, isStar, history, trophies, stadium, onBuyUpgrade, onBuyRevenue }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 2 }}>
      <div style={{ flex: "1 1 300px", minWidth: 280 }}>
        <Panel title="STADIUM">
          {STADIUM.map((track) => (
            <UpgradeTrack key={track.id} track={track} level={stadium?.[track.id] || 0}
              money={money} fans={fans} onBuy={onBuyUpgrade} />
          ))}
        </Panel>
        <Panel title="REVENUE">
          {REVENUE.map((track) => (
            <UpgradeTrack key={track.id} track={track} level={track.id === "merch" ? merch : tv}
              money={money} fans={fans} onBuy={onBuyRevenue} locked={track.id === "tv" && merch < 1} />
          ))}
        </Panel>
        <Panel title="THE CLUB" style={{ fontSize: 12, lineHeight: 1.8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FansIcon /> {fmt(fans)} fans in {city.name}</span>
          City edge: {city.label}
        </Panel>
      </div>

      <div style={{ flex: "1 1 300px", minWidth: 280 }}>
        <Panel title="TROPHY CASE" titleRight={`${trophies} CUP${trophies === 1 ? "" : "S"}`}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: trophies ? 8 : 0 }}>
            {Array.from({ length: Math.min(trophies, 12) }, (_, i) => <TrophyIcon key={i} size={15} />)}
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
                      <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap" }}>{h.champion}{h.cup && <TrophyIcon size={11} />}</td>
                      <td style={{ padding: "4px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{h.playerRecord}</td>
                      <td style={{ padding: "4px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{h.finish}{["st", "nd", "rd"][h.finish - 1] || "th"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

    </div>
  );
}
