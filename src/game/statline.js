// ── Season stat lines: rate stats computed from raw counting stats ──
// Pure. Batting: ab h d t hr bb k r rbi. Pitching: outsP raP hP bbP kP.

const rate3 = (num, den) => (den ? (num / den).toFixed(3).replace(/^0/, "") : "—");
const rate2 = (num, den) => (den ? (num / den).toFixed(2) : "—");

export const avg = (s) => rate3(s.h, s.ab);
export const obp = (s) => rate3(s.h + s.bb, s.ab + s.bb);
export const slg = (s) => rate3(s.h + s.d + 2 * s.t + 3 * s.hr, s.ab);
export const ip = (s) => (s.outsP ? `${Math.floor(s.outsP / 3)}.${s.outsP % 3}` : "0.0");
export const era = (s) => rate2(s.raP * 27, s.outsP);
export const whip = (s) => rate2((s.hP + s.bbP) * 3, s.outsP);
export const k9 = (s) => (s.outsP ? ((s.kP * 27) / s.outsP).toFixed(1) : "—");

// [label, value] pairs, most important first
export function statLine(s, isBat) {
  if (!s) return [];
  return isBat
    ? [["AVG", avg(s)], ["OBP", obp(s)], ["SLG", slg(s)], ["HR", s.hr], ["RBI", s.rbi], ["R", s.r], ["2B", s.d], ["3B", s.t], ["BB", s.bb], ["K", s.k]]
    : [["ERA", era(s)], ["WHIP", whip(s)], ["IP", ip(s)], ["K", s.kP], ["BB", s.bbP], ["K/9", k9(s)]];
}
