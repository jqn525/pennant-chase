// ── The Rulebook overlay ──

import { C } from "../game/constants.js";
import { panel, btn, overlay, SLAB } from "./styles.js";

const SECTIONS = [
  ["THE CLIMB", ["Play games against generated opponents. Win enough in each league to claim the pennant and get promoted: Little League, High School, Single-A, Triple-A, and finally the Majors. Fences get deeper and arms get nastier every level."]],
  ["HOW EVERY PITCH RESOLVES", [
    "1. Strikeout roll — pitcher Stuff vs batter Contact (Eye helps a little).",
    "2. Walk roll — batter Eye vs pitcher Control.",
    "3. Ball in play: the engine rolls a spray angle (0° = dead center, ±45° = the foul lines; each batter has a hidden pull tendency that skews it), a launch type (grounder / liner / fly), and a distance driven by Power.",
    "4. Past ±45° is foul territory — usually just a do-over, sometimes caught for an out.",
    "5. Clear the fence at that angle and it's gone. The wall is shallow at the corners, deep in center.",
    "6. Otherwise the fielder in that zone rolls their Defense to make the play. Grounders die in the infield, flies get run down, liners are hardest to catch.",
    "7. On a hit, depth plus batter Speed decides single, double, or triple. Runners advance station to station.",
  ]],
  ["YOUR ROSTER", ["Nine position players, one starter, one reliever. Everyone has individual attributes — tap a player in the Roster tab to train them with money. Your starter tires after facing enough batters (Stamina); the reliever takes over automatically.", "BA and K% shown are real season stats, accumulated from actual at-bats."]],
  ["MONEY AND FANS", ["Wins pay gate receipts scaled by your fan base; losses still pay a floor (the diehards show up). Fans grow with wins and home runs.", "At 200 fans you can open the merch stand — passive income every second, boosted by star players (any player averaging 8+ in their attributes sells jerseys). In Triple-A, a TV deal triples it."]],
  ["OPPONENTS", ["Every opponent team is generated with a trait — HR Sluggers, Defensive Wizards, Small Ball, Pitching Factory, Grinders — that shapes their stats. Their batted balls run through the same physics engine as yours."]],
];

export default function Rulebook({ onClose }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...panel, maxWidth: 700, width: "100%", padding: 20, margin: "10px 0", borderColor: C.amber }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: SLAB, color: C.amber, fontSize: 20, margin: 0 }}>THE RULEBOOK</h2>
          <button onClick={onClose} style={{ ...btn(true) }}>Close</button>
        </div>
        {SECTIONS.map(([t, ps]) => (
          <div key={t} style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, color: C.dirt, letterSpacing: 2, marginBottom: 6 }}>{t}</div>
            {ps.map((p, i) => <p key={i} style={{ fontSize: 12, lineHeight: 1.6, margin: "0 0 6px" }}>{p}</p>)}
          </div>
        ))}
      </div>
    </div>
  );
}
