// ── Shared compact stat table (roster season stats, in-game box scores) ──

import { C } from "../game/constants.js";
import Panel from "./Panel.jsx";

const th = { padding: "3px 7px", textAlign: "right", color: C.creamDim, fontWeight: 400, letterSpacing: 1 };
const td = { padding: "3px 7px", textAlign: "right", fontVariantNumeric: "tabular-nums" };
const tdName = { ...td, textAlign: "left", whiteSpace: "nowrap", fontWeight: 600 };

export default function StatTable({ title, cols, rows, style, onRow }) {
  const [main, ...rest] = (title || "").split(" · ");
  return (
    <Panel title={main} titleRight={rest.join(" · ") || undefined} style={style}>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.greenLine}` }}>
              <th style={{ ...th, textAlign: "left" }}>PLAYER</th>
              {cols.map((c) => <th key={c} style={th}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, cells, dim }) => (
              <tr key={p.id} onClick={onRow ? () => onRow(p) : undefined}
                style={{ borderBottom: `1px solid ${C.greenLine}44`, color: dim ? C.creamDim : C.cream, cursor: onRow ? "pointer" : "default" }}>
                <td style={tdName}>{p.pos} {p.name}</td>
                {cells.map((v, i) => <td key={i} style={td}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
