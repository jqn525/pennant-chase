// ── Roster: the lineup philosophy and a sortable table of the club ──
import { Fragment, useState } from "react";
import { BAT_STATS, PIT_STATS } from "../game/constants.js";
import { ovr } from "../game/gear.js";
import { salaryOf } from "../game/salary.js";
import { LOADOUTS } from "../game/lineup.js";
import { stat, trainCost, trainCeil, chooseLoadout, moveBatter, franchiseUsed, franchiseSlots } from "../game/franchise.js";
import { avg, era } from "../game/statline.js";
import { CARD_TIERS, nextPrint } from "../game/cards.js";
import { isOpen } from "../game/unlocks.js";
import { slotOf, starterFor } from "../game/roster.js";
import { money } from "./fmt.js";

// Cheapest next training point and the points left before the ceiling
export function trainRoom(s, p) {
  let next = null, room = 0;
  for (const k of p.role === "bat" ? BAT_STATS : PIT_STATS) {
    const ceil = trainCeil(s, p, k);
    if (p[k] >= ceil) continue;
    room += ceil - p[k];
    const c = trainCost(s, p, k);
    if (next == null || c < next) next = c;
  }
  return { next, room };
}

const COLS = [
  ["ovr", "OVR", (s, p) => ovr(p)],
  ["next", "Next pt", (s, p) => trainRoom(s, p).next ?? Infinity],
  ["room", "Room", (s, p) => trainRoom(s, p).room],
  ["pay", "Salary", (s, p) => salaryOf(p)],
];

export default function RosterView({ f, openPlayer, goTo }) {
  const { s } = f;
  const [sort, setSort] = useState(["order", 1]);
  const [manual, setManual] = useState(false);
  const order = [...s.roster.batters, ...s.roster.rotation, ...s.roster.pen];
  const nextUp = starterFor(s.roster, s.rotationTurn || 0)?.id;
  const groupAt = { 0: "Lineup", 9: "Rotation", 14: "Bullpen" };
  const rows = sort[0] === "order" ? order
    : [...order].sort((a, b) => sort[1] * (COLS.find((c) => c[0] === sort[0])[2](s, b) - COLS.find((c) => c[0] === sort[0])[2](s, a)));
  const setCol = (k) => setSort(([c, d]) => (c === k ? [k, -d] : [k, 1]));
  return (
    <>
      <h1>Roster</h1>
      <p className="lede">Franchise tags {franchiseUsed(s)} of {franchiseSlots(s)} used. Tap a player to train, gear up, promote or trade.</p>

      <h2><span className="grow">Lineup</span><small>{s.autoLineup ? "set automatically" : "custom order"}</small></h2>
      <div className="card card--m panel--pad stack">
        <label className="field">
          <span>Batting order philosophy</span>
          <select value={s.lineupLoadout || ""} onChange={(e) => e.target.value && f.act(chooseLoadout, e.target.value)}>
            {!s.lineupLoadout && <option value="">Custom order</option>}
            {LOADOUTS.map((l) => <option key={l.id} value={l.id}>{l.name.charAt(0) + l.name.slice(1).toLowerCase()} — {l.blurb}</option>)}
          </select>
        </label>
        <p className="note" style={{ margin: 0 }}>The order is re-applied automatically after trades, training, gear and the draft.</p>
        <button className="btn btn--quiet btn--sm" style={{ justifySelf: "start" }} onClick={() => setManual((m) => !m)}>{manual ? "Done reordering" : "Reorder by hand"}</button>
        {manual && (
          <div className="panel table-wrap">
            <table><tbody>
              {s.roster.batters.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}. {p.name} <span className="dim">{p.pos}</span></td>
                  <td>
                    <button className="btn btn--quiet btn--sm" aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => f.act(moveBatter, p.id, -1)}>↑</button>{" "}
                    <button className="btn btn--quiet btn--sm" aria-label={`Move ${p.name} down`} disabled={i === 8} onClick={() => f.act(moveBatter, p.id, 1)}>↓</button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}
      </div>

      <h2><span className="grow">Players</span><button className="btn btn--quiet btn--sm" onClick={() => setSort(["order", 1])} disabled={sort[0] === "order"}>Batting order</button></h2>
      <div className="card card--l table-wrap">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              {COLS.map(([k, label]) => (
                <th key={k} className={`sort ${sort[0] === k ? "on" : ""}`} onClick={() => setCol(k)} aria-sort={sort[0] === k ? (sort[1] > 0 ? "descending" : "ascending") : "none"}>
                  {label}{sort[0] === k ? (sort[1] > 0 ? " ↓" : " ↑") : ""}
                </th>
              ))}
              <th>Season</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const r = trainRoom(s, p), st = stat(s, p.id);
              const tier = CARD_TIERS[p.cardTier || 0];
              const head = sort[0] === "order" && groupAt[i];
              return (
                <Fragment key={p.id}>
                {head && <tr className="group"><td colSpan={6}>{head}</td></tr>}
                <tr className="link" onClick={() => openPlayer(p.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && openPlayer(p.id)}>
                  <td>
                    <b>{p.name}</b>{p.franchise && <> <span className="tag tag--accent">F</span></>}{nextPrint(p) && isOpen(s, "star") && <> <span className="tag tag--warn">promo ready</span></>}
                    <span className="sub">{slotOf(s.roster, p.id)}{p.id === nextUp ? " · starts next" : ""}{tier.id > 0 ? ` · ★ ${tier.name.toLowerCase()}` : ""}</span>
                  </td>
                  <td className="n">{ovr(p).toFixed(0)}</td>
                  <td className="n">{r.next == null ? "max" : money(r.next)}</td>
                  <td className="n">{r.room}</td>
                  <td className="n">{money(salaryOf(p))}</td>
                  <td className="n">{p.role === "bat" ? `${avg(st)} · ${st.hr} HR` : `${era(st)} ERA`}</td>
                </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="note">Next pt: cost of the cheapest next rating point. Room: points left before training stops.</p>

      <button className="btn btn--quiet btn--block" style={{ marginTop: 12 }} onClick={() => goTo("stats", "players")}>Batting, pitching and development stats</button>
    </>
  );
}
