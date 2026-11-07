// ── Automation: the Spend-optimally box and the standing-orders (rules) editor ──
import { useState } from "react";
import { spendOptimally, reserveOf, addRule, removeRule, toggleRule, moveRule, describeRule } from "../game/rules.js";
import { allPlayers, BALLPARK } from "../game/franchise.js";
import { ovr } from "../game/gear.js";
import { money } from "./fmt.js";

const num = (v) => { const n = Number(String(v).replace(/[^0-9.]/g, "")); return Number.isFinite(n) ? n : 0; };

export function SpendBox({ f }) {
  const { s } = f;
  const [budget, setBudget] = useState("");
  const [reserve, setReserve] = useState(() => String(reserveOf(s) || ""));
  const [receipt, setReceipt] = useState(null);
  const run = () => {
    const rc = f.act(spendOptimally, { budget: budget === "" ? Infinity : num(budget), reserve: num(reserve) });
    setReceipt(rc);
  };
  return (
    <div className="panel panel--pad stack">
      <div className="row" style={{ alignItems: "end" }}>
        <label className="field grow"><span>Budget (blank = all)</span>
          <input inputMode="numeric" value={budget} placeholder={money(s.money)} onChange={(e) => setBudget(e.target.value)} />
        </label>
        <label className="field grow"><span>Keep in reserve</span>
          <input inputMode="numeric" value={reserve} placeholder="$0" onChange={(e) => setReserve(e.target.value)} />
        </label>
      </div>
      <button className="btn btn--block" onClick={run}>Spend optimally</button>
      {receipt && (
        receipt.items.length === 0
          ? <p className="note" style={{ margin: 0 }}>Nothing worth buying within that budget and reserve.</p>
          : (
            <div className="table-wrap"><table>
              <thead><tr><th>Bought</th><th>Cost</th></tr></thead>
              <tbody>
                {receipt.items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.count > 1 ? `${i.title.split(" · ")[0]} · ${i.count} points` : i.title}<span className="sub">{i.kind.toLowerCase()}</span></td>
                    <td className="n">{money(i.cost)}<span className="sub up">{money(i.gainPerGame, { sign: true })}/g</span></td>
                  </tr>
                ))}
                <tr><td><b>Total</b></td><td className="n"><b>{money(receipt.spent)}</b><span className="sub up">{money(receipt.gainPerGame, { sign: true })}/g</span></td></tr>
              </tbody>
            </table></div>
          )
      )}
    </div>
  );
}

const BLANK = { type: "auto", payback: "30", track: "seats", when: "fans", n: "", pid: "", ovr: "" };

export function RulesPanel({ f }) {
  const { s } = f;
  const [d, setD] = useState(BLANK);
  const [open, setOpen] = useState(false);
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
  const players = allPlayers(s);
  const pick = players.find((p) => p.id === d.pid) || players[0];
  const valid = d.type === "auto" ? num(d.payback) > 0
    : d.type === "reserve" ? num(d.n) > 0
      : d.type === "build" ? d.n !== ""
        : d.type === "train" ? !!pick && num(d.ovr) > ovr(pick) : false;
  const save = () => {
    const r = d.type === "auto" ? { type: "auto", payback: num(d.payback) }
      : d.type === "reserve" ? { type: "reserve", n: num(d.n) }
        : d.type === "build" ? { type: "build", track: d.track, when: d.when, n: num(d.n) }
          : { type: "train", pid: pick.id, ovr: num(d.ovr) };
    f.act(addRule, r);
    setD(BLANK);
    setOpen(false);
  };
  const rules = s.rules || [];

  return (
    <>
      <div className="panel">
        <ul className="feed">
          {rules.length === 0 && <li className="dim">No standing orders. Rules run after every game, top to bottom.</li>}
          {rules.map((r, i) => (
            <li key={r.id} className={r.off || r.done ? "dim" : ""} style={{ alignItems: "center" }}>
              <span className="grow">{describeRule(s, r)}{r.done ? <span className="sub">done</span> : r.off ? <span className="sub">paused</span> : null}</span>
              <span className="row" style={{ gap: 4, flex: "none" }}>
                <button className="btn btn--quiet btn--sm" aria-label="Move rule up" disabled={i === 0} onClick={() => f.act(moveRule, r.id, -1)}>↑</button>
                {!r.done && <button className="btn btn--quiet btn--sm" onClick={() => f.act(toggleRule, r.id)}>{r.off ? "Resume" : "Pause"}</button>}
                <button className="btn btn--quiet btn--sm" aria-label="Delete rule" onClick={() => f.act(removeRule, r.id)}>✕</button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {!open ? (
        <button className="btn btn--ghost btn--block" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>Add a rule</button>
      ) : (
        <div className="panel panel--pad stack" style={{ marginTop: 8 }}>
          <label className="field"><span>Rule</span>
            <select value={d.type} onChange={set("type")}>
              <option value="auto">Auto-buy anything with fast payback</option>
              <option value="build">Build a ballpark tier when…</option>
              <option value="train">Train a player to an overall</option>
              <option value="reserve">Keep a cash reserve</option>
            </select>
          </label>
          {d.type === "auto" && (
            <label className="field"><span>Pays back within (games)</span><input inputMode="numeric" value={d.payback} onChange={set("payback")} /></label>
          )}
          {d.type === "reserve" && (
            <label className="field"><span>Never drop below</span><input inputMode="numeric" value={d.n} placeholder="$2,000" onChange={set("n")} /></label>
          )}
          {d.type === "build" && (
            <>
              <label className="field"><span>Build</span>
                <select value={d.track} onChange={set("track")}>
                  {BALLPARK.map((t) => <option key={t.id} value={t.id}>{t.title.charAt(0) + t.title.slice(1).toLowerCase()}</option>)}
                </select>
              </label>
              <div className="row">
                <label className="field"><span>When</span>
                  <select value={d.when} onChange={set("when")}><option value="fans">fans ≥</option><option value="cash">cash ≥</option></select>
                </label>
                <label className="field grow"><span>Amount</span><input inputMode="numeric" value={d.n} placeholder={d.when === "fans" ? "10,000" : "$5,000"} onChange={set("n")} /></label>
              </div>
            </>
          )}
          {d.type === "train" && (
            <div className="row">
              <label className="field grow"><span>Player</span>
                <select value={pick?.id || ""} onChange={set("pid")}>
                  {players.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.pos} · {ovr(p).toFixed(0)}</option>)}
                </select>
              </label>
              <label className="field" style={{ width: 90 }}><span>To OVR</span><input inputMode="numeric" value={d.ovr} placeholder={pick ? String(Math.ceil(ovr(pick)) + 3) : ""} onChange={set("ovr")} /></label>
            </div>
          )}
          <div className="row">
            <button className="btn btn--sm" disabled={!valid} onClick={save}>Save rule</button>
            <button className="btn btn--sm btn--quiet" onClick={() => { setOpen(false); setD(BLANK); }}>Cancel</button>
          </div>
        </div>
      )}
      <p className="note">Rules spend automatically after each game. The reserve rule guards every automatic buy; one-off rules retire when they finish.</p>
    </>
  );
}
