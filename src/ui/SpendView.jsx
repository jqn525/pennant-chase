// ── Spend: every way to put money to work, filterable, best first ──
import { useState } from "react";
import { options } from "../game/advisor.js";
import { restockNote } from "../game/franchise.js";
import { RARITY } from "../game/constants.js";
import { money } from "./fmt.js";
import { OptionList } from "./Options.jsx";
import { AutoDevCard } from "./Automation.jsx";
import { isOpen, nextUnlockNote } from "../game/unlocks.js";
import Construction from "./Construction.jsx";

const KINDS = ["Yours", "All", "Train", "Gear", "Build", "Promote"];
const match = (k, o) => k === "All" || (k === "Yours" ? o.kind === "Build" || o.kind === "Promote" : o.kind === k);

export default function SpendView({ f }) {
  const { s } = f;
  const [kind, setKind] = useState(() => (s.autoDev?.on && isOpen(s, "autodev") && isOpen(s, "ballpark") ? "Yours" : "All"));
  const all = options(s);
  const kinds = KINDS.filter((k) => ({ Gear: "gear", Build: "ballpark", Promote: "star" }[k] ? isOpen(s, { Gear: "gear", Build: "ballpark", Promote: "star" }[k]) : true));
  const list = all.filter((o) => match(kind, o));
  const buyable = list.filter((o) => !o.lock || /^Needs \$/.test(o.lock));
  // far-off builds stay hidden until the club is at least halfway there
  const locked = list.filter((o) => o.lock && !/^Needs \$/.test(o.lock) && !(o.needFans && s.fans < o.needFans * 0.5));
  return (
    <>
      <h1>Spend</h1>
      <p className="lede">{money(s.money)} available. Every option is valued in dollars per game and sorted by how fast it pays for itself.</p>
      {s.phase === "draft" && <p className="alert" role="status">Winter: the season is over. Spending reopens on opening day; the draft is the only decision left this year.</p>}
      <Construction f={f} />

      <h2>Player development</h2>
      {isOpen(s, "autodev") ? <AutoDevCard f={f} /> : <p className="note">{nextUnlockNote.autodev} Until then, train players by hand from the list below or the Roster tab.</p>}

      <h2><span className="grow">Your decisions</span><small>{kind === "Yours" ? "builds and promotions" : ""}</small></h2>
      <div className="chips" role="tablist" aria-label="Filter" style={{ margin: "0 0 12px" }}>
        {kinds.map((k) => (
          <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
            {k} <span className="dim">{all.filter((o) => match(k, o)).length}</span>
          </button>
        ))}
      </div>
      <OptionList list={buyable} f={f} empty={s.phase === "draft" ? "Nothing to buy in winter." : "Nothing in this group right now."} />

      {(kind === "All" || kind === "Gear") && isOpen(s, "gear") && (
        <>
          <h2><span className="grow">Gear shipment</span><small>{restockNote(s)}</small></h2>
          <div className="card card--l table-wrap">
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
