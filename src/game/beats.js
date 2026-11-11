// ── Narrative beats: one-off news lines when the club crosses a line ──
// Pure. Remembers what it has already said in s.hist.beats.

const FAN_MARKS = [1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
const STREAKS = [5, 8, 10];
const fmt = (n) => Math.round(n).toLocaleString("en-US");

const FAN_LINES = {
  1000: "1,000 fans. People in town are starting to wear the cap.",
  2500: "2,500 fans. The local paper runs a weekly column on the club.",
  5000: "5,000 fans. Kids are trading stories about last night's game.",
  10000: "10,000 fans. The radio station picks up every broadcast.",
  25000: "25,000 fans. You can't walk downtown without seeing the logo.",
  50000: "50,000 fans. The club is the biggest thing in the region.",
  100000: "100,000 fans. National writers are calling it a phenomenon.",
};

// head: { won, att, attCap, streak }; broken: records just broken
export function noteBeats(s, { att, attCap, streak, broken = [] }) {
  const h = s.hist;
  const mark = FAN_MARKS.filter((m) => s.fans >= m).pop() || 0;
  // a club that was already playing before beats existed starts from where it is
  if (!h.beats && h.n > 1) { h.beats = { fans: mark, sellout: !!(attCap && att >= attCap), streak }; return []; }
  const b = h.beats || (h.beats = { fans: 0, sellout: false, streak: 0 });
  const out = [];
  if (mark > b.fans) {
    b.fans = mark;
    out.push(FAN_LINES[mark] || `${fmt(mark)} fans. The ${s.city.nickname} are everywhere.`);
  }
  if (!b.sellout && attCap && att >= attCap) {
    b.sellout = true;
    out.push(`Sold out: all ${fmt(attCap)} seats full. Time to think about a bigger ballpark.`);
  }
  if (STREAKS.includes(streak) && streak > (b.streak || 0)) {
    out.push(`${streak} wins in a row. The ${s.city.nickname} are the hottest club in the league.`);
  }
  b.streak = streak;
  for (const r of broken) out.push(`Club record: ${r.label.toLowerCase()}, ${fmt(r.v)}${r.name ? ` by ${r.name}` : ""}.`);
  return out;
}
