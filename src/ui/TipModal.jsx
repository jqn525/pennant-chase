// ── One-time milestone pop-ups: teach each feature the moment it first matters ──

import { Sheet, Button } from "./kit.jsx";

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
    title: "THE PLAYER SCREEN",
    body: [
      "Everything about a player lives here, in five tabs. INFO has his ratings, trait and season stats. TRAIN spends money to raise a skill — the tick on each bar is where training stops: his natural ceiling, or the LEAGUE CAP. Only a FRANCHISE PLAYER (you hold two tags; each Pennant Cup earns another) trains past the cap.",
      "GEAR shows what he's wearing. TRADE swaps him position-for-position with any rival club — gear travels with the player.",
      "CARD is his actual baseball card. Everyone starts as plain COMMON cardboard — train him past 70, 80 and 88 OVR to earn the right to reprint him as UNCOMMON, RARE HOLO, and finally a ONE-OF-ONE.",
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
      "Every playoff game is a sellout — full gate money — and winning the Cup pays a fortune, swells your fan base by a full quarter, and puts a trophy in your case forever.",
    ],
  },
  stadium: {
    title: "THE FRONT OFFICE",
    body: [
      "This is where the money side of the club lives — including your STADIUM. Four things to build, tier by tier: PARKING gets a bigger share of your fans through the gates, SEATS raise how many the yard can hold — all the way to 60,000 — CONCESSIONS grow every game's payout, and LIGHTS draw new fans faster after wins.",
      "Each tier takes money and a big enough fan base. Win, grow, reinvest.",
    ],
  },
  payroll: {
    title: "THE PAYROLL",
    body: [
      "Every player draws a salary now — and the better he is, the more he earns. Aces cost the most, shortstops and center fielders carry a premium, and every point of training or gear raises a player's price. Wages come out of every regular-season gate.",
      "The Roster tab shows your PAYROLL against the league's cap. Finish a season over it and the winter brings a LUXURY TAX: the full overage, and the rate climbs every consecutive year you stay over. Champions can afford greatness. Nobody keeps it free.",
    ],
  },
  backup: {
    title: "PROTECT THE FRANCHISE",
    body: [
      "One season down. Your club auto-saves on this device — but a backup code makes it immortal.",
      "Open SETTINGS (the gear up top), tap 'Copy backup code' and paste it somewhere safe (a note, an email). If the phone ever clears the save, or you get a new device, the code brings the whole franchise back.",
    ],
  },
};

export default function TipModal({ tipId, onClose }) {
  const tip = TIPS[tipId];
  if (!tip) return null;
  return (
    <Sheet title={tip.title} onClose={onClose} maxWidth={400}>
      {tip.body.map((p, i) => <p key={i} className="tip-p">{p}</p>)}
      <Button variant="primary" size="lg" block onClick={onClose} style={{ marginTop: 8 }}>Got it — play ball</Button>
    </Sheet>
  );
}
