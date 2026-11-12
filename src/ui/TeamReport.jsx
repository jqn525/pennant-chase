// ── Team report: five unit ratings against the league, and the depth chart ──
import { Fragment } from "react";
import { unitReport, weakestLink, depthChart } from "../game/units.js";
import { ordinal } from "./fmt.js";

const SPAN = 8; // rating points that fill half the bar
const signed = (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}`;

// A bar that grows right (above the league average) or left (below it)
function GapBar({ gap }) {
  const w = Math.min(50, (Math.abs(gap) / SPAN) * 50);
  return (
    <span className="gapbar" aria-hidden="true">
      <i className={gap >= 0 ? "pos" : "neg"} style={gap >= 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }} />
    </span>
  );
}

// The at-a-glance card: tap a unit to see its players
export function UnitCard({ s, active, onPick }) {
  const rep = unitReport(s);
  const link = weakestLink(s);
  if (!rep.length) return null;
  return (
    <>
      <div className="card card--m units">
        {rep.map((u) => {
          const weak = link && u.id === link.worst.id && u.gap < 0;
          const Row = onPick ? "button" : "div";
          return (
            <Row key={u.id} type={onPick ? "button" : undefined} className={`unit ${active === u.id ? "on" : ""}`}
              aria-pressed={onPick ? active === u.id : undefined} onClick={onPick ? () => onPick(active === u.id ? null : u.id) : undefined}>
              <span className="unit__main">
                <b>{u.label}</b>{weak && <> <span className="tag tag--warn">weakest</span></>}
                <span className="sub">{ordinal(u.rank)} of {u.of} · league avg {u.avg.toFixed(1)} · <span className={u.gap >= 0 ? "up" : "down"}>{signed(u.gap)}</span></span>
              </span>
              <GapBar gap={u.gap} />
              <span className="unit__num">{u.rating.toFixed(1)}</span>
            </Row>
          );
        })}
      </div>
      {link && <p className="note">{link.text}</p>}
    </>
  );
}

// Stats: the same units with the league's best and the change since opening day
export function UnitTable({ s }) {
  const rep = unitReport(s);
  const chased = rep.filter((u) => u.bestClub);
  return (
    <>
    <div className="card card--m table-wrap wrap-first">
      <table>
        <thead><tr><th>Unit</th><th>Now</th><th>Rank</th><th>Best</th><th>Change</th></tr></thead>
        <tbody>
          {rep.map((u) => {
            const d = u.start != null ? u.rating - u.start : null;
            return (
              <tr key={u.id}>
                <td>{u.label}</td>
                <td className="n">{u.rating.toFixed(1)}</td>
                <td className={`n ${u.rank >= u.of - 1 ? "down" : u.rank <= 2 ? "up" : ""}`}>{ordinal(u.rank)}</td>
                <td className="n">{u.best.toFixed(1)}</td>
                <td className={`n ${d == null || Math.abs(d) < 0.05 ? "dim" : d > 0 ? "up" : "down"}`}>{d == null ? "—" : signed(d)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <p className="note">{chased.length ? `The clubs to catch: ${chased.map((u) => `${u.label} — ${u.bestClub} (${u.best.toFixed(1)})`).join(" · ")}.` : "You have the league's best rating in every unit."}</p>
    </>
  );
}

// Every slot against the same slot on the other seven clubs
export function DepthChart({ s, openPlayer }) {
  const rows = depthChart(s);
  return (
    <div className="card card--l table-wrap">
      <table>
        <thead><tr><th>Slot</th><th>OVR</th><th>Rank</th><th>Avg</th><th>Gap</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <Fragment key={r.id}>
              {(i === 0 || rows[i - 1].group !== r.group) && <tr className="group"><td colSpan={5}>{r.group}</td></tr>}
              <tr className="link" onClick={() => openPlayer(r.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && openPlayer(r.id)}>
                <td><b>{r.slot}</b> {r.name}</td>
                <td className="n">{r.ovr.toFixed(0)}</td>
                <td className={`n ${r.rank >= r.of - 1 ? "down" : r.rank <= 2 ? "up" : ""}`}>{ordinal(r.rank)}</td>
                <td className="n">{r.avg.toFixed(1)}</td>
                <td className={`n ${r.gap >= 0 ? "up" : "down"}`}>{signed(r.gap)}</td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
