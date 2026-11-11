// ── Year in review: the season closes here, then the draft opens ──
import { closeYearEnd } from "../game/franchise.js";
import { money, count, ordinal } from "./fmt.js";
import { Sheet } from "./Shell.jsx";

export default function YearEndSheet({ f }) {
  const r = f.s.yearEnd;
  if (!r) return null;
  const done = () => f.act(closeYearEnd);
  return (
    <Sheet title={`Year ${r.y} in review`} onClose={done} closeLabel="Draft"
      actions={null}>
      <p className="lede">{r.cup ? "Zenith Pennant champions." : `${r.champion || "Another club"} won the Zenith Pennant.`} The season is over: from here until opening day, the draft is the only decision.</p>
      <div className="kpis" style={{ marginTop: 12 }}>
        <div className="kpi"><span>Record</span><b>{r.w}–{r.l}</b><small>{ordinal(r.finish)} place</small></div>
        <div className="kpi"><span>Season net</span><b className={r.net >= 0 ? "up" : "down"}>{money(r.net, { sign: true })}</b><small>{money(r.spent)} invested</small></div>
        <div className="kpi"><span>Fans</span><b>{count(r.fans)}</b><small>at season end</small></div>
        <div className="kpi"><span>Biggest riser</span><b style={{ fontFamily: "var(--ui)", fontSize: 16 }}>{r.riser ? r.riser.name : "—"}</b><small>{r.riser ? `+${r.riser.gain} OVR · ${r.riser.pos}` : "no gains"}</small></div>
      </div>
      <h2>Awards</h2>
      <div className="card card--m">
        <ul className="feed">
          <li><span className="grow"><b>Top hitter</b><span className="sub">{r.hitter ? `${r.hitter.name} (${r.hitter.pos}) · ${r.hitter.ops} OPS, ${r.hitter.hr} HR` : "nobody qualified"}</span></span></li>
          <li><span className="grow"><b>Top pitcher</b><span className="sub">{r.pitcher ? `${r.pitcher.name} · ${r.pitcher.era} ERA, ${r.pitcher.k} K` : "nobody qualified"}</span></span></li>
          <li><span className="grow"><b>Best buy</b><span className="sub">{r.bestBuy ? `${r.bestBuy.name ? `${r.bestBuy.name}: ` : ""}${r.bestBuy.what} · ${money(r.bestBuy.cost)}, earned back ${r.bestBuy.back}%` : "no purchases tracked"}</span></span></li>
          <li><span className="grow"><b>Finish</b><span className="sub">{ordinal(r.finish)} of 8{r.finish <= 4 ? " · made the playoffs" : " · missed the playoffs"}</span></span></li>
        </ul>
      </div>
      <button className="btn btn--block" style={{ marginTop: 14 }} onClick={done}>On to the draft</button>
    </Sheet>
  );
}
