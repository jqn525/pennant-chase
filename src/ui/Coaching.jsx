// ── Coaching staff: training lanes, who's in them, and how many games are left ──
import { useEffect, useState } from "react";
import { AREAS, AREA_IDS, lanes, nextHire, hireLane, cancelProgram, assignLane, setCoachAuto, programInstallments, wages } from "../game/training.js";
import { TRAINING } from "../game/constants.js";
import { isOpen } from "../game/unlocks.js";
import { money } from "./fmt.js";
import { Head } from "./Head.jsx";

export default function Coaching({ f }) {
  const { s } = f;
  const list = lanes(s);
  const [armed, setArmed] = useState(null);
  useEffect(() => { if (armed == null) return undefined; const t = setTimeout(() => setArmed(null), 4000); return () => clearTimeout(t); }, [armed]);
  const hire = nextHire(s);
  const winter = s.phase === "draft";
  const busy = list.filter((l) => l.prog).length;
  const empty = AREA_IDS.filter((a) => !list.some((l) => l.area === a));
  const auto = isOpen(s, "autodev");

  return (
    <>
      <Head title="Coaching staff" small={<>{busy} of {list.length} busy · {money(programInstallments(s) + wages(s))} a game</>}
        help={<>A point takes 2–8 games, longer at higher ratings and near a player's ceiling, and is paid game by game. An area with no lane rusts: a point lost every {TRAINING.rustAfter} games. Coaches on auto start the best-value point in their area whenever a lane frees up. An assistant opens another lane; point it at any coach.</>} />
      <div className={`card ${list.length > 4 ? "card--l" : "card--m"}`}>
        <ul className="feed build-list">
          {list.map((l, i) => {
            const p = l.prog;
            const done = p ? (p.games - p.left) / p.games : 0;
            return (
              <li key={i}>
                <span className="grow">
                  {p ? (
                    <>
                      <b>{p.name}</b> <span className="dim">{p.key} {p.from} → {p.from + 1}{p.auto ? " · auto" : ""}</span>
                      <span className="sub">{p.stalled ? <span className="down">Stalled: needs {money(p.perGame)} · </span> : null}{AREAS[l.area].coach} · {p.left} game{p.left === 1 ? "" : "s"} left · {money(p.perGame)}/game</span>
                      <span className="build-bar"><i style={{ width: `${Math.round(done * 100)}%` }} /></span>
                    </>
                  ) : (
                    <>
                      <b>Lane {i + 1}</b> <span className="dim">idle</span>
                      <span className="sub">{auto && s.training.auto[l.area] ? "coach picks next game" : "start one from a player's sheet"}</span>
                    </>
                  )}
                </span>
                {p ? (
                  <button className={`btn btn--sm ${armed === i ? "btn--danger" : "btn--quiet"}`}
                    onClick={() => (armed === i ? (f.act(cancelProgram, i), setArmed(null)) : setArmed(i))}>{armed === i ? "Drop it" : "Stop"}</button>
                ) : (
                  <select className="lane-select" aria-label={`Lane ${i + 1} coach`} value={l.area} onChange={(e) => f.act(assignLane, i, e.target.value)}>
                    {AREA_IDS.map((a) => <option key={a} value={a}>{AREAS[a].short}</option>)}
                  </select>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {auto && (
        <div className="chips" role="group" aria-label="Coaches on auto" style={{ marginTop: 10 }}>
          {AREA_IDS.map((a) => (
            <button key={a} role="switch" aria-checked={!!s.training.auto[a]} className={s.training.auto[a] ? "on" : ""}
              onClick={() => f.act(setCoachAuto, a, !s.training.auto[a])}>{AREAS[a].short} {s.training.auto[a] ? "auto" : "by hand"}</button>
          ))}
        </div>
      )}
      {empty.length > 0 && <p className="note"><span className="warn">{empty.map((a) => AREAS[a].label).join(" and ")} {empty.length > 1 ? "have" : "has"} no lane and will rust.</span></p>}
      {hire && (
        <div className="row" style={{ marginTop: 10 }}>
          <span className="note grow" style={{ margin: 0 }}>Lane {list.length + 1}: {money(hire.fee)} to sign, then {money(hire.wage)} a game</span>
          <button className="btn btn--sm" disabled={winter || s.money < hire.fee} onClick={() => f.act(hireLane, "hit")}>Hire assistant</button>
        </div>
      )}
    </>
  );
}
