// ── Spend: three jobs, one at a time — the buy list, the coaching lanes, the equipment room ──
import { useState } from "react";
import { options } from "../game/advisor.js";
import { restockNote } from "../game/franchise.js";
import { RARITY } from "../game/constants.js";
import { lanes } from "../game/training.js";
import { money } from "./fmt.js";
import { OptionList } from "./Options.jsx";
import { AutoDevCard } from "./Automation.jsx";
import Coaching from "./Coaching.jsx";
import { isOpen, nextUnlockNote } from "../game/unlocks.js";
import Construction from "./Construction.jsx";
import { Head } from "./Head.jsx";

export const SPEND_KEY = "pc-spend";
const SECTIONS = ["buy", "coach", "gear"];
const KINDS = ["Yours", "All", "Train", "Gear", "Build", "Promote"];
const match = (k, o) => k === "All" || (k === "Yours" ? o.kind === "Build" || o.kind === "Promote" : o.kind === k);

export default function SpendView({ f }) {
  const { s } = f;
  const [sec, setSecRaw] = useState(() => { try { const v = sessionStorage.getItem(SPEND_KEY); return SECTIONS.includes(v) ? v : "buy"; } catch { return "buy"; } });
  const setSec = (k) => { setSecRaw(k); try { sessionStorage.setItem(SPEND_KEY, k); } catch { /* private mode */ } };
  const [kind, setKind] = useState(() => (s.autoDev?.on && isOpen(s, "autodev") && isOpen(s, "ballpark") ? "Yours" : "All"));
  const all = options(s);
  const kinds = KINDS.filter((k) => ({ Gear: "gear", Build: "ballpark", Promote: "star" }[k] ? isOpen(s, { Gear: "gear", Build: "ballpark", Promote: "star" }[k]) : true));
  const list = all.filter((o) => match(kind, o));
  const buyable = list.filter((o) => !o.lock || /^Needs \$/.test(o.lock));
  // far-off builds stay hidden until the club is at least halfway there
  const locked = list.filter((o) => o.lock && !/^Needs \$/.test(o.lock) && !(o.needFans && s.fans < o.needFans * 0.5));
  const ls = lanes(s);
  const tabs = [["buy", "Buy", null], ["coach", "Coaching", ls.length ? `${ls.filter((l) => l.prog).length}/${ls.length}` : null], ["gear", "Equipment", isOpen(s, "gear") ? String(s.shopItems.length) : null]];
  return (
    <>
      <h1>Spend</h1>
      <p className="lede">{money(s.money)} available.</p>
      {s.phase === "draft" && <p className="alert" role="status">Winter: the season is over. Spending reopens on opening day; the draft is the only decision left this year.</p>}

      <div className="seg" role="tablist" aria-label="Spend sections">
        {tabs.map(([k, label, n]) => (
          <button key={k} role="tab" aria-selected={sec === k} className={sec === k ? "on" : ""} onClick={() => setSec(k)}>{label}{n != null && <span className="seg__n">{n}</span>}</button>
        ))}
      </div>

      {sec === "buy" && (
        <>
          <Construction f={f} />
          <Head title="Your decisions" small={kind === "Yours" ? "builds and promotions" : null}
            help="Every option is valued in dollars per game and sorted by how fast it pays for itself. Builds are paid game by game while they go up." />
          <div className="chips" role="tablist" aria-label="Filter" style={{ margin: "0 0 12px" }}>
            {kinds.map((k) => (
              <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
                {k} <span className="dim">{all.filter((o) => match(k, o)).length}</span>
              </button>
            ))}
          </div>
          <OptionList list={buyable} f={f} empty={s.phase === "draft" ? "Nothing to buy in winter." : "Nothing in this group right now."} />
          {locked.length > 0 && (
            <>
              <Head title="Not available yet" />
              <OptionList list={locked} f={f} />
            </>
          )}
        </>
      )}

      {sec === "coach" && <Coaching f={f} />}

      {sec === "gear" && (
        <>
          <Head title="Equipment manager" help="Buys gear after every game, best payback first, from a share of each game's earnings. Builds and star-power promotions are never bought automatically; the rest of your earnings stays in the bank for those." />
          {isOpen(s, "autodev") ? <AutoDevCard f={f} /> : <p className="note">{nextUnlockNote.autodev} Until then, buy gear from the Buy list.</p>}
          {isOpen(s, "gear") && (
            <>
              <Head title="Gear shipment" small={restockNote(s)} help="Each item also appears in the Buy list with the player it helps most." />
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
            </>
          )}
        </>
      )}
    </>
  );
}
