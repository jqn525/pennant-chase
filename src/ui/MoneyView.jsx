// ── Money (home): club health, the best buys right now, and the ledger ──
import { useState } from "react";
import { SALARY, stadiumFx } from "../game/constants.js";
import { LEDGER_LINES, ledgerNet } from "../game/franchise.js";
import { options } from "../game/advisor.js";
import { money, count, ordinal } from "./fmt.js";
import { netPerGame, payroll, payrollShare, fansWin, place, attendance } from "./metrics.js";
import { OptionList } from "./Options.jsx";
import { SpendBox } from "./Automation.jsx";

function Ledger({ s }) {
  const [view, setView] = useState("season");
  const cols = { game: ["Last game", s.ledger.lastGame], season: ["This season", s.ledger.season], life: ["All time", s.ledger.life] };
  const compare = view === "season" ? s.ledger.lastSeason : null;
  const [label, bucket] = cols[view];
  const rows = LEDGER_LINES.filter(([k]) => bucket[k] || compare?.[k]);
  return (
    <>
      <h2><span className="grow">Ledger</span></h2>
      <div className="chips" role="tablist" aria-label="Ledger period" style={{ marginBottom: 8 }}>
        {Object.entries(cols).map(([k, [l]]) => (
          <button key={k} role="tab" aria-selected={view === k} className={view === k ? "on" : ""} onClick={() => setView(k)}>{l}</button>
        ))}
      </div>
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>Line</th><th>{label}</th>{compare && Object.keys(compare).length > 0 && <th>Last season</th>}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={3} className="dim">No money has moved yet.</td></tr>}
            {rows.map(([k, name]) => (
              <tr key={k}>
                <td>{name}</td>
                <td className={`n ${(bucket[k] || 0) >= 0 ? "" : "down"}`}>{money(bucket[k] || 0)}</td>
                {compare && Object.keys(compare).length > 0 && <td className="n dim">{money(compare[k] || 0)}</td>}
              </tr>
            ))}
            <tr className="total">
              <td>Net</td>
              <td className={`n ${ledgerNet(bucket) >= 0 ? "up" : "down"}`}>{money(ledgerNet(bucket), { sign: true })}</td>
              {compare && Object.keys(compare).length > 0 && <td className="n dim">{money(ledgerNet(compare), { sign: true })}</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function MoneyView({ f, goTo }) {
  const { s } = f;
  const net = netPerGame(s);
  const share = payrollShare(s);
  const cap = stadiumFx(s.stadium).attCap;
  const { w, l } = s.standings[0];
  const top = options(s).filter((o) => !o.lock || /^Needs \$/.test(o.lock)).slice(0, 5);
  return (
    <>
      <div className="kpis">
        <div className="kpi"><span>Cash</span><b>{money(s.money)}</b><small className={net >= 0 ? "up" : "down"}>{money(net, { sign: true })} per game</small></div>
        <div className="kpi"><span>Fans</span><b>{count(s.fans)}</b><small>+{count(fansWin(s))} per win</small></div>
        <div className="kpi"><span>Record</span><b>{w}–{l}</b><small>{ordinal(place(s))} of 8 · top 4 make it</small></div>
        <div className="kpi"><span>Payroll</span><b>{money(payroll(s))}</b><small className={share > 1 ? "down" : share > 0.8 ? "warn" : ""}>{Math.round(share * 100)}% of {money(SALARY.cap)} cap</small>
          <div className="bar"><i className={share > 1 ? "over" : share > 0.8 ? "hot" : ""} style={{ width: `${Math.min(100, share * 100)}%` }} /></div></div>
      </div>
      <p className="note">Crowd {count(attendance(s))} a game · the park counts up to {count(cap)} fans toward ticket sales{s.fans > cap ? <span className="warn"> · you've outgrown it, build seats</span> : ""}.</p>

      <h2><span className="grow">Best use of your money</span><small>ranked by payback</small></h2>
      <OptionList list={top} f={f} />
      <button className="btn btn--quiet btn--block" style={{ marginTop: 8 }} onClick={() => goTo("spend")}>See every option</button>

      <h2><span className="grow">Spend optimally</span><small>best payback first</small></h2>
      <SpendBox f={f} />

      <Ledger s={s} />
    </>
  );
}
