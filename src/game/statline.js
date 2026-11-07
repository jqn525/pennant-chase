// ── Season stat lines: rate stats computed from raw counting stats ──
// Pure. Batting: ab h d t hr bb k r rbi. Pitching: outsP raP hP bbP kP.

const rate3 = (num, den) => (den ? (num / den).toFixed(3).replace(/^0/, "") : "—");
const rate2 = (num, den) => (den ? (num / den).toFixed(2) : "—");

export const avg = (s) => rate3(s.h, s.ab);
export const obp = (s) => rate3(s.h + s.bb, s.ab + s.bb);
export const slg = (s) => rate3(s.h + s.d + 2 * s.t + 3 * s.hr, s.ab);
export const ops = (s) => (s.ab ? ((s.h + s.bb) / (s.ab + s.bb) + (s.h + s.d + 2 * s.t + 3 * s.hr) / s.ab).toFixed(3).replace(/^0/, "") : "—");
export const ip = (s) => (s.outsP ? `${Math.floor(s.outsP / 3)}.${s.outsP % 3}` : "0.0");
export const era = (s) => rate2(s.raP * 27, s.outsP);
export const whip = (s) => rate2((s.hP + s.bbP) * 3, s.outsP);
export const k9 = (s) => (s.outsP ? ((s.kP * 27) / s.outsP).toFixed(1) : "—");

// [label, value] pairs, most important first
export function statLine(s, isBat) {
  if (!s) return [];
  return isBat
    ? [["AB", s.ab], ["H", s.h], ["AVG", avg(s)], ["OBP", obp(s)], ["SLG", slg(s)], ["OPS", ops(s)], ["HR", s.hr], ["RBI", s.rbi], ["R", s.r], ["2B", s.d], ["3B", s.t], ["BB", s.bb], ["K", s.k]]
    : [["ERA", era(s)], ["WHIP", whip(s)], ["IP", ip(s)], ["K", s.kP], ["BB", s.bbP], ["K/9", k9(s)]];
}

// Table columns: [label, display(stat), sortValue(stat)] — one set for every stat table
const num = (k) => (s) => s[k] || 0;
const r = (n, d) => (d ? n / d : -Infinity);
export const BAT_COLS = [
  ["G", num("g"), num("g")], ["AB", num("ab"), num("ab")], ["H", num("h"), num("h")],
  ["2B", num("d"), num("d")], ["3B", num("t"), num("t")], ["HR", num("hr"), num("hr")],
  ["R", num("r"), num("r")], ["RBI", num("rbi"), num("rbi")], ["BB", num("bb"), num("bb")], ["K", num("k"), num("k")],
  ["AVG", avg, (s) => r(s.h, s.ab)], ["OBP", obp, (s) => r(s.h + s.bb, s.ab + s.bb)],
  ["SLG", slg, (s) => r(s.h + s.d + 2 * s.t + 3 * s.hr, s.ab)],
  ["OPS", ops, (s) => (s.ab ? r(s.h + s.bb, s.ab + s.bb) + r(s.h + s.d + 2 * s.t + 3 * s.hr, s.ab) : -Infinity)],
];
// ERA/WHIP sort lowest-first, so their sort value is negated
export const PIT_COLS = [
  ["G", num("g"), num("g")], ["IP", ip, num("outsP")], ["H", num("hP"), num("hP")], ["R", num("raP"), num("raP")],
  ["BB", num("bbP"), num("bbP")], ["K", num("kP"), num("kP")],
  ["ERA", era, (s) => (s.outsP ? -(s.raP * 27) / s.outsP : -Infinity)],
  ["WHIP", whip, (s) => (s.outsP ? -((s.hP + s.bbP) * 3) / s.outsP : -Infinity)],
  ["K/9", k9, (s) => r(s.kP * 27, s.outsP)],
];
export const columns = (isBat) => (isBat ? BAT_COLS : PIT_COLS);
export const sumStats = (list) => list.reduce((o, s) => { for (const k in s) if (typeof s[k] === "number") o[k] = (o[k] || 0) + s[k]; return o; }, {});
