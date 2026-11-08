// ── Derived club numbers shown across screens ──
import { LEAGUE, SALARY } from "../game/constants.js";
import { ledgerNet, gateNow } from "../game/franchise.js";
import { teamPayroll } from "../game/salary.js";
import { fansPerWin } from "../game/advisor.js";
import { seedOrder, teamRating } from "../game/season.js";

// Average net money per game this season (falls back to the last game)
export function netPerGame(s) {
  const games = s.results.filter((r) => r.year === s.year).length;
  if (games >= 3) return ledgerNet(s.ledger.season) / games;
  return ledgerNet(s.ledger.lastGame);
}
export const payroll = (s) => teamPayroll(s.roster);
export const payrollShare = (s) => payroll(s) / SALARY.cap;
export const fansWin = (s) => fansPerWin(s);
export const attendance = (s) => gateNow(s).attendance;

export function place(s) {
  const ratings = [teamRating(s.roster), ...s.rivals.map(teamRating)];
  return seedOrder(s.standings, ratings).indexOf(0) + 1;
}
export function seasonLabel(s) {
  if (s.phase === "draft") return `Year ${s.year} · winter`;
  if (s.phase === "playoffs") return `Year ${s.year} · ${s.playoffs?.round === "final" ? "Pennant Cup final" : "semifinal"}`;
  return `Year ${s.year} · game ${Math.min(s.gameIndex + 1, LEAGUE.seasonGames)} of ${LEAGUE.seasonGames}`;
}
