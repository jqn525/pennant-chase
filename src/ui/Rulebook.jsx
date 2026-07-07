// ── The Rulebook overlay ──

import { C } from "../game/constants.js";
import { panel, btn, overlay, SLAB } from "./styles.js";

const SECTIONS = [
  ["THE BIGS", ["Eight clubs, one league, forever. Every season is 154 games — home and away series against the same seven rivals — then the top four fight through a best-of-5 semifinal and a best-of-7 final for the PENNANT CUP.", "The games play themselves. You are the GM: train players, buy gear, set the batting order, and build a club that can take the Cup. Pause any time; 1× watches every pitch, 4× hustles, MAX plays a whole game every second."]],
  ["THE TREADMILL", ["Every winter your rivals reload — and the further ahead of the pack you are, the harder they chase. Your own players lose a step each offseason too (never below league average). Standing still is falling behind.", "While the app is closed the season waits for you. Only the merch stand keeps working — it sells up to 8 hours of jerseys while you're away."]],
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
  ["MONEY AND FANS", ["Wins pay gate receipts scaled by your fan base (up to a cap); losses still pay a floor (the diehards show up). Playoff wins, series wins, and the Pennant Cup pay bonuses. Fans grow with wins and homers, surge for a Cup, and drift away if you miss the playoffs.", "At 200 fans you can open the merch stand — passive income every second, boosted by star players. At 2,500 fans a regional TV deal doubles it."]],
  ["THE PRO SHOP", ["Buy equipment — bats, gloves, cleats, shades, pitcher gear — for individual players. Each item boosts one attribute (+1 Standard, +2 Pro, +3 Elite); a player holds one of each item type and a higher tier replaces the lower.", "Stock is limited each season (3 Standard, 2 Pro, only 1 Elite of everything), so choose who gets the good stuff. The shelves fully restock every offseason. Gear never ages."]],
  ["YOUR RIVALS", ["The same seven clubs share the league with you forever, each built around a trait — HR Sluggers, Defensive Wizards, Small Ball, Pitching Factory, Grinders. Their batted balls run through the same physics engine as yours, and their rosters persist and improve year over year."]],
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
