// ── One sortable stat table: name column pinned, numbers scroll sideways ──
import { useState } from "react";
import { columns, sumStats } from "../game/statline.js";

// rows: [{ id, name, sub, stat, onClick? }]
export default function StatTable({ rows, isBat, totals = false, sortable = true, initial, cols: only }) {
  const all = columns(isBat);
  const cols = only ? all.filter(([k]) => only.includes(k)) : all;
  const [sort, setSort] = useState(initial ? [initial, 1] : null);
  const col = sort && cols.find(([k]) => k === sort[0]);
  const list = col ? [...rows].sort((a, b) => sort[1] * (col[2](b.stat) - col[2](a.stat))) : rows;
  const tap = (k) => sortable && setSort((cur) => (cur && cur[0] === k ? [k, -cur[1]] : [k, 1]));
  const tot = totals && rows.length > 1 ? sumStats(rows.map((r) => r.stat)) : null;

  return (
    <div className="panel table-wrap stat-table">
      <table>
        <thead>
          <tr>
            <th>{isBat ? "Batter" : "Pitcher"}</th>
            {cols.map(([k]) => (
              <th key={k} className={sortable ? `sort ${sort?.[0] === k ? "on" : ""}` : ""} onClick={() => tap(k)}
                aria-sort={sort?.[0] === k ? (sort[1] > 0 ? "descending" : "ascending") : undefined}>
                {k}{sort?.[0] === k ? (sort[1] > 0 ? " ↓" : " ↑") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.length === 0 && <tr><td className="dim" colSpan={cols.length + 1}>No stats yet.</td></tr>}
          {list.map((r) => (
            <tr key={r.id} className={r.onClick ? "link" : ""} onClick={r.onClick} tabIndex={r.onClick ? 0 : undefined}
              onKeyDown={r.onClick ? (e) => e.key === "Enter" && r.onClick() : undefined}>
              <td><b>{r.name}</b>{r.sub && <span className="sub">{r.sub}</span>}</td>
              {cols.map(([k, show]) => <td key={k} className="n">{show({ ...ZERO, ...r.stat })}</td>)}
            </tr>
          ))}
          {tot && (
            <tr className="total">
              <td>Team</td>
              {cols.map(([k, show]) => <td key={k} className="n">{k === "G" ? "" : show({ ...ZERO, ...tot })}</td>)}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const ZERO = { g: 0, ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, k: 0, r: 0, rbi: 0, outsP: 0, kP: 0, bbP: 0, hP: 0, raP: 0 };
