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
    "7. Even a routine play can be BOOTED for an error — sure-handed fielders boot fewer. A ground ball with a man on first and less than two outs can become a DOUBLE PLAY — good infields turn more of them.",
    "8. With runners aboard, a low-Control pitcher will occasionally throw a WILD PITCH: everyone moves up a base.",
    "9. On a hit, depth plus batter Speed decides single, double, or triple. Runners advance station to station.",
  ]],
  ["YOUR ROSTER", ["Nine position players, one starter, one reliever. Everyone has individual attributes — tap a player in the Roster tab to train them with money. Your starter tires after facing enough batters (Stamina); the reliever takes over automatically.", "BA and K% shown are real season stats, accumulated from actual at-bats."]],
  ["MONEY AND FANS", ["Every game sells tickets: 30% of your fans show up when the club is cold, up to 60% when your last ten games are hot — and playoff games SELL OUT. Gate = crowd × ticket price, plus a winner's bonus (winners sell concessions). Playoff wins, series wins, and the Pennant Cup pay extra.", "Fans grow with wins and homers — and win 3+ straight and the bandwagon rolls: each consecutive win draws bigger crowds of new fans (up to double). Fans surge for a Cup and drift away if you miss the playoffs.", "At 200 fans you can open the merch stand — passive income every second, boosted by star players. At 2,500 fans a regional TV deal doubles it."]],
  ["PLAYERS ARE PEOPLE", ["Every player has a hidden CEILING on each attribute — the second notch on his training bars. Scouts can't teach what isn't there: once a stat is PEAKED, only gear can push it higher. Winter aging never lowers a ceiling, so veterans can re-train what time takes.", "Every player also carries one TRAIT with real effects — Clutch hitters lock in with runners on, Free Swingers trade strikeouts for homers, Painters hit corners, Workhorses pitch deep. Two players with equal numbers can play very differently."]],
  ["THE PRO SHOP", ["A rotating shipment of one-of-a-kind gear: every series brings new stock and the old shipment leaves forever. Items boost their slot's attribute (+1 COMMON, +2 RARE, +3 LEGENDARY) and rarer pieces carry a side-effect on a second attribute — sometimes a gift, sometimes a tradeoff.", "Each winter the WINTER CATALOG arrives: rare and legendary stock only, timed for your playoff money. Gear stacks above a player's ceiling and never ages — but it travels with him if he's traded or released to the draft (draft rookies inherit it)."]],
  ["TRADES & THE DRAFT", ["The TRADE DESK (Roster tab) swaps your player position-for-position with any rival. Pricing is straight value: upgrading costs a premium in cash, downgrading pays you back less than you'd hope. Gear moves with the players.", "Every winter is DRAFT DAY: a class of raw rookies with low stats and big ceilings — and the worse you finished, the better the prospects. Signing one releases your player at that position (the rookie inherits his gear). The season waits until you close the board."]],
  ["YOUR RIVALS", ["The same seven clubs share the league with you forever, each built around a trait — HR Sluggers, Defensive Wizards, Small Ball, Pitching Factory, Grinders. Their batted balls run through the same physics engine as yours, their rosters persist, and their front offices retool every winter — no ceilings for them, just churn. The further ahead of the pack you get, the harder they chase."]],
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
