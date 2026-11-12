// ── Under construction: every ballpark project, paid a game at a time ──
import { useEffect, useState } from "react";
import { projects, cancelBuild } from "../game/construction.js";
import { money } from "./fmt.js";
import { Head } from "./Head.jsx";

export default function Construction({ f }) {
  const { s } = f;
  const list = projects(s);
  const [armed, setArmed] = useState(null);
  useEffect(() => { if (!armed) return undefined; const t = setTimeout(() => setArmed(null), 4000); return () => clearTimeout(t); }, [armed]);
  if (!list.length) return null;
  return (
    <>
      <Head title="Under construction" small={<>{money(list.reduce((t, b) => t + Math.min(b.perGame, b.cost - b.paid), 0))} a game</>}
        help="Each game pays one installment. Short on cash, the crew waits; stopping a project loses what's been paid." />
      <div className="card card--m">
        <ul className="feed build-list">
          {list.map((b) => {
            const done = (b.games - b.left) / b.games;
            return (
              <li key={b.id}>
                <span className="grow">
                  <b>{b.name}</b> <span className="dim">{b.area}</span>
                  <span className="sub">{b.stalled ? <span className="down">Stalled: needs {money(b.perGame)} </span> : null}{b.left} game{b.left === 1 ? "" : "s"} left · {money(b.perGame)}/game · {money(b.paid)} of {money(b.cost)}</span>
                  <span className="build-bar"><i style={{ width: `${Math.round(done * 100)}%` }} /></span>
                </span>
                <button className={`btn btn--sm ${armed === b.id ? "btn--danger" : "btn--quiet"}`}
                  onClick={() => (armed === b.id ? (f.act(cancelBuild, b.id), setArmed(null)) : setArmed(b.id))}>{armed === b.id ? "Cancel it" : "Stop"}</button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
