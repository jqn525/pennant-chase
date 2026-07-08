// ── Field view: top-down, to-scale spray chart of every ball in play ──

import { C, LEAGUE } from "../game/constants.js";
import Panel from "./Panel.jsx";

const W = 360, H = 208;
const HOME = { x: W / 2, y: H - 14 };
const S = (H - 28) / LEAGUE.fenceCenter; // px per foot — center field fits with margin

const pt = (spray, dist) => {
  const rad = (spray * Math.PI) / 180;
  return { x: HOME.x + dist * S * Math.sin(rad), y: HOME.y - dist * S * Math.cos(rad) };
};

const BALL_STYLE = {
  hr: { fill: C.amber, glow: true },
  hit: { fill: C.cream, glow: false },
  err: { fill: C.red, glow: false },
  out: { fill: "#4A6355", glow: false },
};

export default function FieldView({ g }) {
  if (!g) return null;

  // Fence arc, sampled every 3°
  const fencePts = [];
  for (let a = -45; a <= 45; a += 3) {
    const r = LEAGUE.fenceCenter - (LEAGUE.fenceCenter - LEAGUE.fenceCorner) * (Math.abs(a) / 45);
    const p = pt(a, r);
    fencePts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  const cornerL = pt(-45, LEAGUE.fenceCorner);
  const cornerR = pt(45, LEAGUE.fenceCorner);
  const center = pt(0, LEAGUE.fenceCenter);

  // Bases: 1B/2B/3B at real distances, drawn as small rotated squares
  const b1 = pt(45, 90), b2 = pt(0, 127), b3 = pt(-45, 90);
  const baseMarks = [
    { p: b1, occ: g.bases[0] },
    { p: b2, occ: g.bases[1] },
    { p: b3, occ: g.bases[2] },
  ];

  const last = g.balls[g.balls.length - 1];
  const lastP = last ? pt(last.spray, last.dist) : null;

  return (
    <Panel title="FIELD VIEW" titleRight="BALLS IN PLAY">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} aria-label="field view">
        {/* outfield grass wash */}
        <polygon points={`${HOME.x},${HOME.y} ${fencePts.join(" ")}`} fill="#1A3627" />
        {/* foul lines */}
        <line x1={HOME.x} y1={HOME.y} x2={cornerL.x} y2={cornerL.y} stroke={C.creamDim} strokeWidth="1" opacity="0.6" />
        <line x1={HOME.x} y1={HOME.y} x2={cornerR.x} y2={cornerR.y} stroke={C.creamDim} strokeWidth="1" opacity="0.6" />
        {/* fence */}
        <polyline points={fencePts.join(" ")} fill="none" stroke={C.dirt} strokeWidth="1.8" />
        <text x={center.x} y={center.y - 5} textAnchor="middle" fontSize="9" fill={C.creamDim} fontFamily="inherit">{LEAGUE.fenceCenter}</text>
        <text x={cornerL.x + 4} y={cornerL.y - 5} textAnchor="start" fontSize="9" fill={C.creamDim}>{LEAGUE.fenceCorner}</text>
        <text x={cornerR.x - 4} y={cornerR.y - 5} textAnchor="end" fontSize="9" fill={C.creamDim}>{LEAGUE.fenceCorner}</text>
        {/* infield diamond */}
        <polygon points={`${HOME.x},${HOME.y} ${b1.x},${b1.y} ${b2.x},${b2.y} ${b3.x},${b3.y}`} fill="none" stroke={C.dirt} strokeWidth="1" opacity="0.7" />
        {baseMarks.map(({ p, occ }, i) => (
          <rect key={i} x={p.x - 3.5} y={p.y - 3.5} width="7" height="7" transform={`rotate(45 ${p.x} ${p.y})`}
            fill={occ && !g.over ? C.amber : "#0A1810"} stroke={occ && !g.over ? C.amber : C.creamDim} strokeWidth="1" />
        ))}
        <rect x={HOME.x - 3} y={HOME.y - 3} width="6" height="6" transform={`rotate(45 ${HOME.x} ${HOME.y})`} fill={C.cream} opacity="0.8" />
        {/* balls in play */}
        {g.balls.map((b, i) => {
          const p = pt(b.spray, b.dist);
          const st = BALL_STYLE[b.t] || BALL_STYLE.out;
          const isLast = i === g.balls.length - 1;
          return (
            <circle key={i} cx={p.x} cy={p.y} r={isLast ? 4 : 2.4} fill={st.fill}
              opacity={isLast ? 1 : 0.75}
              style={st.glow ? { filter: `drop-shadow(0 0 3px ${C.amber})` } : undefined} />
          );
        })}
        {/* flight line for the latest ball */}
        {lastP && (
          <line x1={HOME.x} y1={HOME.y} x2={lastP.x} y2={lastP.y}
            stroke={(BALL_STYLE[last.t] || BALL_STYLE.out).fill} strokeWidth="1" opacity="0.45" strokeDasharray="3 3" />
        )}
      </svg>
      <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 9, letterSpacing: 1, color: C.creamDim }}>
        {[["HR", C.amber], ["HIT", C.cream], ["ERROR", C.red], ["OUT", "#4A6355"]].map(([label, color]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
            {label}
          </span>
        ))}
      </div>
    </Panel>
  );
}
