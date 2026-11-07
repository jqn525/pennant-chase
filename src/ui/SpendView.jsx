// ── Spend: every way to put money to work, filterable, best first ──
import { useState } from "react";
import { options } from "../game/advisor.js";
import { restockNote } from "../game/franchise.js";
import { RARITY } from "../game/constants.js";
import { money } from "./fmt.js";
import { OptionList } from "./Options.jsx";
import { AutoDevCard } from "./Automation.jsx";

const KINDS = ["Yours", "All", "Train", "Gear", "Build", "Print"];
const match = (k, o) => k === "All" || (k === "Yours" ? o.kind === "Build" || o.kind === "Print" : o.kind === k);

export default function SpendView({ f }) {
  const { s } = f;
  const [kind, setKind] = useState(() => (s.autoDev?.on ? "Yours" : "All"));
  const all = options(s);
  const list = all.filter((o) => match(kind, o));
  const buyable = list.filter((o) => !o.lock || /^Needs \$/.test(o.lock));
  const locked = list.filter((o) => o.lock && !/^Needs \$/.test(o.lock));
  return (
    <>
      <h1>Spend</h1>
      <p className="lede">{money(s.money)} available. Every option is valued in dollars per game and sorted by how fast it pays for itself.</p>
      <h2>Player development</h2>
      <AutoDevCard f={f} />

      <h2><span className="grow">Your decisions</span><small>{kind === "Yours" ? "builds and card prints" : ""}</small></h2>
      <div className="chips" role="tablist" aria-label="Filter" style={{ margin: "0 0 12px" }}>
        {KINDS.map((k) => (
          <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
            {k} <span className="dim">{all.filter((o) => match(k, o)).length}</span>
          </button>
        ))}
      </div>
      <OptionList list={buyable} f={f} empty="Nothing in this group right now." />

      {(kind === "All" || kind === "Gear") && (
        <>
          <h2><span className="grow">Gear shipment</span><small>{restockNote(s)}</small></h2>
          <div className="panel table-wrap">
            <table>
              <thead><tr><th>Item</th><th>Boosts</th><th>Price</th></tr></thead>
              <tbody>
                {s.shopItems.length === 0 && <tr><td colSpan={3} className="dim">Sold out until the next series.</td></tr>}
                {s.shopItems.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}<span className="sub">{RARITY[i.rarity].name.toLowerCase()} · {i.slot.replace(/([A-Z])/g, " $1").toLowerCase()}</span></td>
                    <td className="n">{Object.entries(i.boosts).map(([k, n]) => `${n > 0 ? "+" : ""}${n}% ${k}`).join(", ")}</td>
                    <td className="n">{money(i.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">Each item is listed above with the player it helps most.</p>
        </>
      )}


      {locked.length > 0 && (
        <>
          <h2>Not available yet</h2>
          <OptionList list={locked} f={f} />
        </>
      )}
    </>
  );
}
