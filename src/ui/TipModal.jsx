// ── One-time milestone pop-ups: teach each feature the moment it first matters ──

import { C } from "../game/constants.js";
import { PIXEL, MONO } from "./styles.js";
import Modal from "./Modal.jsx";
import Panel from "./Panel.jsx";

export const TIPS = {
  welcome: {
    title: "WELCOME TO THE BIGS",
    body: [
      "Eight clubs. 154 games a season. One Pennant Cup — and the seasons never stop.",
      "The games play themselves. Use the tempo strip in the scoreboard: pause any time, 1× to watch every pitch, 4× to hustle, MAX to blast through a game a second.",
      "You are the GM. Train your players, buy gear at the Pro Shop, set the batting order, make trades, sign rookies. Your rivals get better every winter — will you?",
    ],
  },
  card: {
    title: "THE PLAYER CARD",
    body: [
      "This is a player's whole life on one card. Tap a skill row to TRAIN it with money — the notch on each bar is his natural ceiling. Once a skill is PEAKED, only gear can push it higher.",
      "The equipment shelf shows what he's wearing; the TRADE DESK swaps him position-for-position with any rival club — gear travels with the player.",
    ],
  },
  shop: {
    title: "THE PRO SHOP",
    body: [
      "A fresh shipment of one-of-a-kind gear arrives every series — and the old stock ships out forever. If a LEGENDARY appears and you can't decide, hit pause up top.",
      "Boosts are percentages of a player's rating (COMMON +5%, RARE +10%, LEGENDARY +15%), so gear helps your stars most — but nothing ever passes 99. And the best dealers only court winners: make the playoffs to see rarer stock, win the Cup for the full catalog.",
    ],
  },
  draft: {
    title: "DRAFT DAY",
    body: [
      "The season is over and the winter rookie class is on the board. The league WAITS until you close it — take your time.",
      "Rookies come raw but with huge ceilings (the green arrows). Signing one releases your current player at that position, and the rookie inherits his gear. The worse you finished, the better your prospects.",
    ],
  },
  playoffs: {
    title: "OCTOBER BASEBALL",
    body: [
      "You made the playoffs! Best-of-5 semifinal, then a best-of-7 for the PENNANT CUP.",
      "Every playoff game is a sellout — full gate money — and winning the Cup pays a fortune, draws hundreds of fans, and puts a trophy in your case forever.",
    ],
  },
  stadium: {
    title: "THE FRONT OFFICE",
    body: [
      "This is where the money side of the club lives — including your STADIUM. Four things to build, each three tiers deep: PARKING gets a bigger share of your fans through the gates, SEATS raise how many the yard can hold, CONCESSIONS grow every game's payout, and LIGHTS draw new fans faster after wins.",
      "Each tier takes money and a big enough fan base. Win, grow, reinvest.",
    ],
  },
  backup: {
    title: "PROTECT THE FRANCHISE",
    body: [
      "One season down. Your club auto-saves on this device — but a backup code makes it immortal.",
      "In the FRONT OFFICE, tap 'Copy backup code' and paste it somewhere safe (a note, an email). If the phone ever clears the save, or you get a new device, the code brings the whole franchise back.",
    ],
  },
};

export default function TipModal({ tipId, onClose }) {
  const tip = TIPS[tipId];
  if (!tip) return null;
  return (
    <Modal onClose={onClose} maxWidth={380}>
      <Panel title={tip.title} style={{ background: C.green, boxShadow: "0 12px 40px #000C", marginTop: 10 }} bg={C.green}>
        {tip.body.map((p, i) => (
          <p key={i} style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.65, color: C.cream, margin: "10px 2px" }}>{p}</p>
        ))}
        <button onClick={onClose}
          style={{ width: "100%", fontFamily: PIXEL, fontSize: 10, padding: "12px 0", marginTop: 6, background: "transparent", border: `3px solid ${C.amber}`, borderRadius: 6, color: C.amber, cursor: "pointer", letterSpacing: 1 }}>
          GOT IT — PLAY BALL
        </button>
      </Panel>
    </Modal>
  );
}
