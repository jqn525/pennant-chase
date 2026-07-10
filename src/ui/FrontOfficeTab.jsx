// ── Front Office tab: revenue streams, trophy case, season history, save management ──

import { useState } from "react";
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

export default function FrontOfficeTab({ roster, city, fans, money, merch, tv, isStar, history, trophies, stadium, onBuyUpgrade, onBuyRevenue, onNewFranchise, getBackupCode, onRestore }) {
  const [armed, setArmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualCode, setManualCode] = useState(null); // shown if clipboard is unavailable
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [restoreErr, setRestoreErr] = useState(null);

  const copyBackup = async () => {
    const code = getBackupCode();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setManualCode(null);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setManualCode(code); // clipboard blocked — show the code to copy by hand
    }
  };
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

      <div style={{ flex: "1 1 100%" }}>
        <Panel title="SAVE FILE">
          <div style={{ fontSize: 11, color: C.creamDim, marginBottom: 8 }}>
            Your franchise auto-saves on this device. Close the browser any time — the season waits for you (only the merch stand keeps selling).
          </div>
          <div style={{ fontSize: 11, color: C.creamDim, marginBottom: 8 }}>
            <span style={{ color: C.cream }}>Backup codes:</span> copy one now and then, and keep it somewhere safe (a note, an email to yourself).
            If the phone ever clears the save — or you switch devices — paste the code back in and the whole franchise returns.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <button onClick={copyBackup} style={{ ...btn(true) }}>
              {copied ? "Copied to clipboard" : "Copy backup code"}
            </button>
            <button onClick={() => { setRestoreOpen((o) => !o); setRestoreErr(null); }} style={{ ...btn(true) }}>
              Restore from a code
            </button>
          </div>
          {manualCode && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.creamDim, marginBottom: 4 }}>Couldn't reach the clipboard — press and hold to select and copy:</div>
              <textarea readOnly value={manualCode} onFocus={(e) => e.target.select()}
                style={{ width: "100%", height: 70, background: "#0A1810", color: C.cream, border: `1px solid ${C.greenLine}`, borderRadius: 4, fontFamily: "monospace", fontSize: 10, boxSizing: "border-box" }} />
            </div>
          )}
          {restoreOpen && (
            <div style={{ marginBottom: 8 }}>
              <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Paste a backup code here"
                style={{ width: "100%", height: 70, background: "#0A1810", color: C.cream, border: `1px solid ${C.greenLine}`, borderRadius: 4, fontFamily: "monospace", fontSize: 10, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <button onClick={() => setRestoreErr(onRestore(pasted))} style={{ ...btn(pasted.trim().length > 0) }}>
                  Restore — replaces the current save
                </button>
                {restoreErr && <span style={{ fontSize: 10, color: C.red }}>{restoreErr}</span>}
              </div>
            </div>
          )}
          <button
            onClick={() => (armed ? onNewFranchise() : setArmed(true))}
            onBlur={() => setArmed(false)}
            style={{ ...btn(true), border: `1px solid ${C.red}`, color: C.red }}>
            {armed ? "Are you sure? Tap again to erase everything" : "Sell the club — start a new franchise"}
          </button>
        </Panel>
      </div>
    </div>
  );
}
