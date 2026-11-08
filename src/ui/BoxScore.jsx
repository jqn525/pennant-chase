// ── The club's most recent game, line by line ──
import { allPlayers } from "../game/franchise.js";
import StatTable from "./StatTable.jsx";

export default function BoxScore({ s, openPlayer }) {
  const b = s.lastBox;
  if (!b) return <div className="card card--l panel--pad"><p className="note" style={{ margin: 0 }}>No games played yet.</p></div>;
  const people = allPlayers(s);
  const row = (pid) => {
    const p = people.find((x) => String(x.id) === String(pid));
    return { id: pid, name: p ? p.name : "Former player", sub: p?.pos, stat: b.lines[pid], onClick: p ? () => openPlayer(p.id) : undefined };
  };
  const order = s.roster.batters.map((p) => String(p.id));
  const ids = Object.keys(b.lines);
  const isBatter = (pid) => b.lines[pid].ab + b.lines[pid].bb > 0;
  const bats = ids.filter(isBatter).sort((x, y) => order.indexOf(x) - order.indexOf(y)).map(row);
  const arms = ids.filter((pid) => b.lines[pid].outsP > 0 || b.lines[pid].hP + b.lines[pid].bbP > 0).map(row);
  return (
    <div className="card card--l">
      <p className="note" style={{ margin: 0, padding: "10px 12px 4px" }}>
        <b className={b.won ? "up" : "down"}>{b.won ? "W" : "L"} {b.us}–{b.them}</b> {b.home ? "vs" : "at"} {b.opp} · {b.game}, year {b.year}
      </p>
      <StatTable bare rows={bats} isBat sortable={false} totals cols={["AB", "H", "R", "RBI", "HR", "BB", "K"]} />
      <StatTable bare rows={arms} isBat={false} sortable={false} cols={["IP", "H", "R", "BB", "K"]} />
    </div>
  );
}
