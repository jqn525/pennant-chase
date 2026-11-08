// ── One row per way to spend: what it is, what it earns, the buy button ──
import { apply } from "../game/advisor.js";
import { money, payback } from "./fmt.js";

export function OptionRow({ o, f }) {
  const locked = !!o.lock;
  return (
    <div className={`opt ${locked ? "is-locked" : ""}`}>
      <div className="opt__main">
        <div className="opt__title"><span className="kind">{o.kind}</span><span>{o.title}</span></div>
        <div className="opt__meta">
          {o.gainPerGame > 0.05 && <><b className="up">{money(o.gainPerGame, { sign: true })}</b>/game · </>}
          {locked ? <span className="warn">{o.lock}</span> : payback(o.payback)}
          <span> · {o.detail}</span>
        </div>
      </div>
      {o.kind === "Build" ? (
        <button className="btn btn--sm" disabled={locked} onClick={() => f.act(apply, o)}
          aria-label={`Start building ${o.title}: ${o.games} games at ${money(o.perGame)} a game`}>
          Start<small>{money(o.perGame)} × {o.games}</small>
        </button>
      ) : (
        <button className="btn btn--sm" disabled={locked} onClick={() => f.act(apply, o)}
          aria-label={`${o.kind} ${o.title} for ${money(o.cost)}`}>{money(o.cost)}</button>
      )}
    </div>
  );
}

export function OptionList({ list, f, empty = "Nothing to buy right now." }) {
  if (!list.length) return <p className="note">{empty}</p>;
  return <div className="opts">{list.map((o) => <OptionRow key={o.id} o={o} f={f} />)}</div>;
}
