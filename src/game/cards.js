// ── Trading cards: every player is a card ──
// A league-average filler guy gets a plain base-set card. Talent earns the
// RIGHT to reprint him at a higher rarity; the press still has to be paid.
// Printed tier lives on the player (`cardTier`) and is never taken back —
// winter aging can cost him a step, but the card he earned stays printed.

import { ovr } from "./gear.js";

export const CARD_TIERS = [
  { id: 0, key: "common", name: "COMMON", flavor: "Base Set", at: 0, cost: 0, draw: 0 },
  { id: 1, key: "uncommon", name: "UNCOMMON", flavor: "Foil Stamp", at: 70, cost: 750, draw: 0.1 },
  { id: 2, key: "rare", name: "RARE HOLO", flavor: "Rainbow Shimmer", at: 80, cost: 10000, draw: 0.3 },
  { id: 3, key: "unique", name: "ONE-OF-ONE", flavor: "Gold Refractor", at: 88, cost: 50000, draw: 0.6 },
];

// Highest tier a rating qualifies for
export const tierFor = (rating) => {
  let t = 0;
  for (const tier of CARD_TIERS) if (rating >= tier.at) t = tier.id;
  return t;
};

export const eligibleTier = (p) => tierFor(ovr(p));
export const printedTier = (p) => p.cardTier || 0;
export const tierOf = (p) => CARD_TIERS[printedTier(p)];

// The press runs one step at a time — you collect the whole ladder
export const nextPrint = (p) => {
  const next = printedTier(p) + 1;
  return next < CARD_TIERS.length && eligibleTier(p) >= next ? CARD_TIERS[next] : null;
};

// How much a roster's printed cards move merchandise
export const cardDraw = (players) => players.reduce((n, p) => n + CARD_TIERS[printedTier(p)].draw, 0);

// Card furniture, deterministic per player so a card never changes on him
export const cardNumber = (p) => ((p.id * 37) % 660) + 1;
// A batter who pulls left is swinging right-handed
export const batsOf = (p) => (p.role === "bat" ? (p.pull < 0 ? "R" : "L") : p.id % 2 ? "R" : "L");
export const throwsOf = (p) => (p.id % 3 === 0 ? "L" : "R");
