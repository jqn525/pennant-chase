// ── Shared stat table (roster season stats, in-game box scores) ──
// The player column stays pinned while the numbers scroll sideways.

import Panel from "./Panel.jsx";
import "./StatTable.css";

export default function StatTable({ title, titleRight, cols, rows, style, onRow }) {
  return (
    <Panel title={title} titleRight={titleRight} style={style}>
      <div className="stat-table__scroll">
        <table className="stat-table">
          <thead>
            <tr>
              <th className="stat-table__name">Player</th>
              {cols.map((c) => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, cells, dim }) => (
              <tr key={p.id} onClick={onRow ? () => onRow(p) : undefined} className={`${dim ? "is-dim" : ""} ${onRow ? "is-link" : ""}`}>
                <td className="stat-table__name"><span>{p.pos}</span> {p.name}</td>
                {cells.map((v, i) => <td key={i}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
