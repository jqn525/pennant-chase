// ── Auto-develop card: training and gear on autopilot; builds and promotions stay yours ──
import { useState } from "react";
import { setAutoDev, developNow, SHARES } from "../game/autodev.js";
import { CAT_LABEL } from "../game/analytics.js";
import { money } from "./fmt.js";
import { useTween } from "./motion.js";

const num = (v) => { const n = Number(String(v).replace(/[^0-9.]/g, "")); return Number.isFinite(n) ? n : 0; };

export function AutoDevCard({ f }) {
  const { s } = f;
  const a = s.autoDev;
  const [reserve, setReserve] = useState(String(a.reserve));
  const auto = (s.hist?.spend || []).filter((e) => e.auto);
  const season = auto.filter((e) => e.y === s.year);
  const spent = season.reduce((t, e) => t + e.cost, 0);
  const pts = season.reduce((t, e) => t + (e.d > 0 ? e.d : 0), 0);
  const recent = auto.slice(-5).reverse();
  const banked = useTween(a.allowance);

  return (
    <div className="panel panel--pad stack">
      <div className="row">
        <div className="grow">
          <b>Auto-develop players</b>
          <span className="sub">Training and gear buy themselves after every game, best payback first.</span>
        </div>
        <button className={`btn btn--sm ${a.on ? "" : "btn--ghost"}`} role="switch" aria-checked={a.on}
          onClick={() => f.act(setAutoDev, { on: !a.on })}>{a.on ? "On" : "Off"}</button>
      </div>

      <div className="field">
        <span>Share of each game's earnings</span>
        <div className="chips" role="radiogroup" aria-label="Share of earnings">
          {SHARES.map((v) => (
            <button key={v} role="radio" aria-checked={a.share === v} className={a.share === v ? "on" : ""}
              onClick={() => f.act(setAutoDev, { share: v })}>{Math.round(v * 100)}%</button>
          ))}
        </div>
      </div>
      <label className="field"><span>Never drop cash below</span>
        <input inputMode="numeric" value={reserve} onChange={(e) => setReserve(e.target.value)}
          onBlur={() => f.act(setAutoDev, { reserve: num(reserve) })} />
      </label>

      <div className="kpis">
        <div className="kpi"><span>Banked to spend</span><b>{money(banked)}</b><small>{a.avg ? `+${money(a.avg)} a game` : "fills after each game"}</small></div>
        <div className="kpi"><span>This season</span><b>{money(spent)}</b><small>{season.length} buys · +{pts.toFixed(1)} OVR</small></div>
      </div>
      <button className="btn btn--quiet btn--sm" style={{ justifySelf: "start" }} disabled={a.allowance < 1}
        onClick={() => f.act(developNow)}>Develop now</button>

      {recent.length > 0 && (
        <ul className="feed" style={{ margin: 0 }}>
          {recent.map((e, i) => (
            <li key={i} style={{ paddingLeft: 0, paddingRight: 0 }}>
              <span className="grow">{e.name}<span className="sub">{CAT_LABEL[e.cat]} · {e.what}{e.d ? ` · OVR +${e.d}` : ""}</span></span>
              <span className="num">{money(e.cost)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="note" style={{ margin: 0 }}>Builds and star-power promotions are never bought automatically. The rest of your earnings stays in the bank for those.</p>
    </div>
  );
}
