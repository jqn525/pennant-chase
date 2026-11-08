// ── Star power: how famous a player is ──
// Talent earns the RIGHT to promote a player to the next level of fame; the
// deal still has to be paid for. Fame lives on the player (`cardTier`, kept
// under its old name so saves carry over) and is never taken back: winter
// aging can cost him a step, but the town doesn't forget.

import { ovr } from "./gear.js";

export const CARD_TIERS = [
  { id: 0, key: "unknown", name: "Unknown", deal: null, at: 0, cost: 0, draw: 0 },
  { id: 1, key: "local", name: "Local favorite", deal: "Jersey line", blurb: "his number on jerseys around town", at: 70, cost: 750, draw: 0.1 },
  { id: 2, key: "regional", name: "Regional star", deal: "Bobblehead night", blurb: "a bobblehead giveaway that sells out", at: 80, cost: 10000, draw: 0.3 },
  { id: 3, key: "national", name: "National icon", deal: "Sneaker deal", blurb: "a national sneaker campaign", at: 88, cost: 50000, draw: 0.6 },
];
export const STAR_TIERS = CARD_TIERS;

// Highest tier a rating qualifies for
export const tierFor = (rating) => {
  let t = 0;
  for (const tier of CARD_TIERS) if (rating >= tier.at) t = tier.id;
  return t;
};

export const eligibleTier = (p) => tierFor(ovr(p));
export const printedTier = (p) => p.cardTier || 0;
export const tierOf = (p) => CARD_TIERS[printedTier(p)];

// Fame climbs one step at a time
export const nextPrint = (p) => {
  const next = printedTier(p) + 1;
  return next < CARD_TIERS.length && eligibleTier(p) >= next ? CARD_TIERS[next] : null;
};

// How much the roster's fame moves merchandise
export const cardDraw = (players) => players.reduce((n, p) => n + CARD_TIERS[printedTier(p)].draw, 0);
export const nextPromo = (p) => nextPrint(p);
