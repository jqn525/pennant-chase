// ── Salaries: what a roster costs to keep, and the tax for keeping too much ──

import { LEAGUE, SALARY } from "./constants.js";
import { ovr } from "./gear.js";

// A player's seasonal salary from his effective overall (gear + traits priced in)
export const salaryOf = (p) => {
  const mult = SALARY.posMult[p.pos] ?? 1;
  return Math.round(SALARY.base * Math.pow(SALARY.growth10, (ovr(p) - LEAGUE.statBase) / 10) * mult);
};

export const teamPayroll = (roster) =>
  [...roster.batters, roster.sp, roster.rp].reduce((n, p) => n + salaryOf(p), 0);

// Winter bill for a payroll above the cap. capYears counts consecutive years
// over INCLUDING this one: 1st year = 100% of the overage, then +taxStep each.
export const luxuryTax = (payroll, capYears) => {
  const overage = Math.max(0, payroll - SALARY.cap);
  if (!overage) return { overage: 0, tax: 0 };
  return { overage, tax: Math.round(overage * (1 + SALARY.taxStep * (capYears - 1))) };
};

// Pay rank among the league's players at his position (1 = highest paid)
export const payRank = (p, rivals) => {
  const peers = (rivals || []).flatMap((r) => [...r.batters, r.sp]).filter((q) => q.pos === p.pos);
  return 1 + peers.filter((q) => salaryOf(q) > salaryOf(p)).length;
};
