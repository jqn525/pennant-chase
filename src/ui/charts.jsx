// ── Charts: small hand-made SVG/HTML charts in the app's own tokens ──
// Thin marks, recessive axes, one y-scale per chart, a crosshair tooltip on
// lines and a per-mark tooltip on bars. Colors come from --c1..--c7.
import { useEffect, useRef, useState } from "react";

export const SERIES = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)", "var(--c7)"];

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(340);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // the drawable width is inside the card's padding
    const set = () => {
      const cs = getComputedStyle(el);
      setW(Math.max(200, el.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0)));
    };
    set();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
  return [ref, w];
}

// "nice" axis ticks
function ticks(lo, hi, n = 4) {
  if (lo === hi) { hi = lo + 1; }
  const span = hi - lo, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) || mag * 10;
  // the scale always covers the data: first tick at or below lo, last at or above hi
  const out = [];
  const top = Math.ceil(hi / step - 1e-9) * step;
  for (let v = Math.floor(lo / step + 1e-9) * step; v <= top + step * 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span key={it.label}><i className={it.line ? "ln" : ""} style={{ background: it.color }} />{it.label}</span>
      ))}
    </div>
  );
}

// Lines over an x of games. series: [{ label, color, points: [[x, y]] }]
// markers: [{ x, color, title, detail }] drawn on the first series
export function LineChart({ series, markers = [], height = 370, yFmt = String, xFmt = (x) => `G${x}`, refs = [], zero = false, legend = true, label }) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { l: 46, r: 12, t: 10, b: 24 };
  const all = series.flatMap((s) => s.points);
  if (!all.length) return <div ref={ref} className="chart-empty">Not enough games yet. Charts fill in as the season plays.</div>;
  const xs = all.map((p) => p[0]), ys = [...all.map((p) => p[1]), ...refs.map((r) => r.y), ...(zero ? [0] : [])];
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x0 === x1) x1 = x0 + 1;
  const yt = ticks(Math.min(...ys), Math.max(...ys));
  const y0 = yt[0], y1 = yt[yt.length - 1];
  const W = w, H = height, iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const X = (x) => pad.l + ((x - x0) / (x1 - x0)) * iw;
  const Y = (y) => pad.t + ih - ((y - y0) / (y1 - y0 || 1)) * ih;
  const xt = ticks(x0, x1, Math.max(2, Math.floor(iw / 70))).filter((v) => v >= x0 && v <= x1);
  const at = (s, x) => { let best = null; for (const p of s.points) { if (p[0] <= x) best = p; else break; } return best; };
  const main = series[0];
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const x = Math.round(x0 + ((px - pad.l) / iw) * (x1 - x0));
    const cx = Math.max(x0, Math.min(x1, x));
    const mk = markers.filter((m) => Math.abs(X(m.x) - px) <= 12);
    setHover({ x: cx, mk });
  };
  const hx = hover ? X(hover.x) : 0;

  return (
    <div className="chart" ref={ref}>
      {legend && (
        <Legend items={[...series.map((s) => ({ label: s.label, color: s.color, line: true })), ...uniq(markers.map((m) => m.cat)).map((c) => ({ label: c.label, color: c.color }))]} />
      )}
      <svg width={W} height={H} role="img" aria-label={label} onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} style={{ touchAction: "pan-y" }}>
        {yt.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(v)} y2={Y(v)} className="grid" />
            <text x={pad.l - 6} y={Y(v)} className="ax" textAnchor="end" dominantBaseline="middle">{yFmt(v)}</text>
          </g>
        ))}
        {xt.map((v) => <text key={v} x={X(v)} y={H - 6} className="ax" textAnchor={X(v) > W - 30 ? "end" : X(v) < pad.l + 20 ? "start" : "middle"}>{xFmt(v)}</text>)}
        {refs.map((r) => (
          <g key={r.label}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(r.y)} y2={Y(r.y)} className="ref" />
            <text x={W - pad.r} y={Y(r.y) - 4} className="ax" textAnchor="end">{r.label}</text>
          </g>
        ))}
        {series.map((s) => (
          <polyline key={s.label} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
            points={s.points.map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" ")} />
        ))}
        {markers.map((m, i) => {
          const p = at(main, m.x) || main.points[0];
          return <circle key={i} cx={X(m.x)} cy={Y(p[1])} r="4.5" fill={m.color} className="mk" />;
        })}
        {series.map((s) => { const p = s.points[s.points.length - 1]; return <circle key={s.label} cx={X(p[0])} cy={Y(p[1])} r="4" fill={s.color} className="mk" />; })}
        {hover && <line x1={hx} x2={hx} y1={pad.t} y2={pad.t + ih} className="cross" />}
        {hover && series.map((s) => { const p = at(s, hover.x); return p ? <circle key={s.label} cx={X(p[0])} cy={Y(p[1])} r="4" fill={s.color} className="mk" /> : null; })}
      </svg>
      {hover && (
        <div className="tip" style={{ left: Math.min(Math.max(hx - 80, 0), W - 170) }}>
          <div className="tip__h">{xFmt(hover.x)}</div>
          {series.map((s) => { const p = at(s, hover.x); return p ? <div key={s.label}><i style={{ background: s.color }} /><b>{yFmt(p[1])}</b> {s.label}</div> : null; })}
          {hover.mk.slice(0, 4).map((m, i) => <div key={i} className="tip__mk"><i style={{ background: m.color }} /><b>{m.title}</b> <span>{m.detail}</span></div>)}
          {hover.mk.length > 4 && <div className="dim">+{hover.mk.length - 4} more buys</div>}
        </div>
      )}
    </div>
  );
}
const uniq = (cats) => { const seen = new Map(); for (const c of cats) if (c && !seen.has(c.label)) seen.set(c.label, c); return [...seen.values()]; };

// Horizontal bars, one row per item. rows: [{ label, sub, value, color, show }]
// A second value (value2/color2) draws a paired bar under the first.
export function BarList({ rows, fmt = String, legend }) {
  const max = Math.max(1e-9, ...rows.flatMap((r) => [Math.abs(r.value), Math.abs(r.value2 || 0)]));
  return (
    <div className="barlist">
      {legend && <Legend items={legend} />}
      {rows.map((r) => (
        <div key={r.label} className="barlist__row" title={`${r.label}: ${r.show ?? fmt(r.value)}`}>
          <div className="barlist__head"><span>{r.label}{r.sub && <small> {r.sub}</small>}</span><b>{r.show ?? fmt(r.value)}</b></div>
          <div className="barlist__track"><i style={{ width: `${(Math.abs(r.value) / max) * 100}%`, background: r.color || "var(--c1)" }} /></div>
          {r.value2 != null && <div className="barlist__track"><i style={{ width: `${(Math.abs(r.value2) / max) * 100}%`, background: r.color2 || "var(--c2)" }} /></div>}
        </div>
      ))}
    </div>
  );
}

// Columns stacked around zero. cols: [{ x, parts: [{ key, v }] }]; keys: [{ key, label, color }]
export function StackedBars({ cols, keys, height = 370, yFmt = String, xFmt = (x) => x, label }) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  if (!cols.length) return <div ref={ref} className="chart-empty">Not enough games yet.</div>;
  const pad = { l: 46, r: 8, t: 10, b: 24 };
  const pos = cols.map((c) => c.parts.reduce((t, p) => t + Math.max(0, p.v), 0));
  const neg = cols.map((c) => c.parts.reduce((t, p) => t + Math.min(0, p.v), 0));
  const yt = ticks(Math.min(0, ...neg), Math.max(0, ...pos));
  const y0 = yt[0], y1 = yt[yt.length - 1];
  const W = w, H = height, iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const Y = (y) => pad.t + ih - ((y - y0) / (y1 - y0 || 1)) * ih;
  const band = iw / cols.length, bw = Math.max(2, Math.min(24, band - 2));
  const every = Math.ceil(cols.length / Math.max(2, Math.floor(iw / 60)));
  return (
    <div className="chart" ref={ref}>
      <Legend items={keys.map((k) => ({ label: k.label, color: k.color }))} />
      <svg width={W} height={H} role="img" aria-label={label} onPointerLeave={() => setHover(null)}>
        {yt.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(v)} y2={Y(v)} className={v === 0 ? "base" : "grid"} />
            <text x={pad.l - 6} y={Y(v)} className="ax" textAnchor="end" dominantBaseline="middle">{yFmt(v)}</text>
          </g>
        ))}
        {cols.map((c, i) => {
          const x = pad.l + band * i + (band - bw) / 2;
          let up = 0, down = 0;
          return (
            <g key={c.x} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} className={hover === i ? "hov" : ""}>
              <rect x={pad.l + band * i} y={pad.t} width={band} height={ih} fill="transparent" />
              {keys.map((k) => {
                const v = c.parts.find((p) => p.key === k.key)?.v || 0;
                if (!v) return null;
                const a = v > 0 ? up : down, b = a + v;
                if (v > 0) up = b; else down = b;
                const top = Y(Math.max(a, b)), h = Math.max(0, Math.abs(Y(a) - Y(b)) - (bw > 4 ? 1 : 0));
                return <rect key={k.key} x={x} y={top} width={bw} height={h} fill={k.color} rx={bw > 6 ? 2 : 0} />;
              })}
              {i % every === 0 && <text x={x + bw / 2} y={H - 6} className="ax" textAnchor="middle">{xFmt(c.x)}</text>}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="tip" style={{ left: Math.min(Math.max(pad.l + band * hover - 80, 0), W - 170) }}>
          <div className="tip__h">{cols[hover].title || xFmt(cols[hover].x)}</div>
          {keys.map((k) => { const v = cols[hover].parts.find((p) => p.key === k.key)?.v; return v ? <div key={k.key}><i style={{ background: k.color }} /><b>{yFmt(v)}</b> {k.label}</div> : null; })}
        </div>
      )}
    </div>
  );
}

export function Sparkline({ points, width = 72, height = 22, color = "var(--c1)" }) {
  if (!points || points.length < 2) return <span className="dim">—</span>;
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1, y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = (x) => 3 + ((x - x0) / (x1 - x0 || 1)) * (width - 6);
  const Y = (y) => height - 3 - ((y - y0) / (y1 - y0 || 1)) * (height - 6);
  const last = points[points.length - 1];
  return (
    <svg width={width} height={height} aria-hidden="true" style={{ verticalAlign: "middle" }}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={points.map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" ")} />
      <circle cx={X(last[0])} cy={Y(last[1])} r="3" fill={color} />
    </svg>
  );
}

// A percentage as a thin meter
export function Meter({ label, pct, sub }) {
  return (
    <div className="meter">
      <div className="barlist__head"><span>{label}{sub && <small> {sub}</small>}</span><b>{pct == null ? "—" : pct >= 0.995 && pct < 1 ? ">99%" : pct <= 0.005 && pct > 0 ? "<1%" : `${Math.round(pct * 100)}%`}</b></div>
      <div className="barlist__track"><i style={{ width: `${Math.round((pct || 0) * 100)}%`, background: "var(--c1)" }} /></div>
    </div>
  );
}
