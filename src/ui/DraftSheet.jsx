// ── Draft day: winter's rookie class. The season waits until you close it. ──
import { BAT_STATS, PIT_STATS, PLAYER_TRAITS } from "../game/constants.js";
import { ovr } from "../game/gear.js";
import { salaryOf } from "../game/salary.js";
import { signRookie, closeDraft, rookieReplaces } from "../game/franchise.js";
import { slotOf } from "../game/roster.js";
import { money } from "./fmt.js";
import { Sheet } from "./Shell.jsx";
import HoloCard from "./HoloCard.jsx";

const potOvr = (p) => {
  const keys = p.role === "bat" ? BAT_STATS : PIT_STATS;
  return keys.reduce((n, k) => n + (p.pot?.[k] ?? p[k]), 0) / keys.length;
};

export default function DraftSheet({ f, onHide }) {
  const { s } = f;
  const current = (pos) => rookieReplaces(s, { pos });
  return (
    <Sheet title={`Draft · year ${s.year}`} onClose={onHide} closeLabel="Later"
      actions={<button className="btn btn--sm" onClick={() => f.act(closeDraft)}>Start season</button>}>
      <p className="lede">Raw rookies with high ceilings. Signing one replaces your player at that position; the rookie keeps his gear. You have {money(s.money)}.</p>
      {(s.draftClass || []).length > 0 && (
        <div className="holo-strip deal-in" style={{ marginTop: 12 }}>
          {s.draftClass.map((r, i) => <div key={r.id} style={{ "--i": i }}><HoloCard p={r} slot={`${r.pos} · ceiling ${potOvr(r).toFixed(0)}`} mini /></div>)}
        </div>
      )}
      <div className="card card--l table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Rookie</th><th>Now</th><th>Ceiling</th><th>Replaces</th><th>Salary</th><th /></tr></thead>
          <tbody>
            {(s.draftClass || []).length === 0 && <tr><td colSpan={6} className="dim">The board is empty.</td></tr>}
            {(s.draftClass || []).map((r) => {
              const out = current(r.pos);
              const slot = out ? slotOf(s.roster, out.id) : "";
              const trait = PLAYER_TRAITS.find((t) => t.id === r.trait);
              return (
                <tr key={r.id}>
                  <td><b>{r.name}</b><span className="sub">{r.pos}{trait ? ` · ${trait.label}` : ""}</span></td>
                  <td className="n">{ovr(r).toFixed(0)}</td>
                  <td className="n up">{potOvr(r).toFixed(0)}</td>
                  <td>{out?.name}<span className="sub">{slot} · OVR {out ? ovr(out).toFixed(0) : "—"}</span></td>
                  <td className="n">{money(salaryOf(r))}</td>
                  <td><button className="btn btn--sm" disabled={s.money < r.signCost} onClick={() => f.act(signRookie, r.id)}>{money(r.signCost)}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button className="btn btn--block" style={{ marginTop: 14 }} onClick={() => f.act(closeDraft)}>Close the board and start year {s.year}</button>
    </Sheet>
  );
}
