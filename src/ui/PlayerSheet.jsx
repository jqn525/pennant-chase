// ── A player: ratings with training costs, gear, card, tag and trades ──
import { useState } from "react";
import { BAT_STATS, PIT_STATS, PLAYER_TRAITS } from "../game/constants.js";
import { ovr, gearBonus, GEAR } from "../game/gear.js";
import { salaryOf } from "../game/salary.js";
import { CARD_TIERS, nextPrint, eligibleTier } from "../game/cards.js";
import { statLine } from "../game/statline.js";
import {
  allPlayers, stat, trainCost, trainCeil, planTraining, train, trainAll, printCard,
  tagFranchise, franchiseUsed, franchiseSlots, tradeQuote, makeTrade,
} from "../game/franchise.js";
import { gearGain, WIN_PER_BAT_POINT, WIN_PER_ARM_POINT, valueOfWin } from "../game/advisor.js";
import { money } from "./fmt.js";
import { Sheet } from "./Shell.jsx";

export default function PlayerSheet({ f, pid, onClose }) {
  const { s } = f;
  const [armed, setArmed] = useState(null);
  const p = allPlayers(s).find((x) => x.id === pid) || s.draftClass?.find((x) => x.id === pid);
  if (!p) return null;
  const own = allPlayers(s).some((x) => x.id === pid);
  const keys = p.role === "bat" ? BAT_STATS : PIT_STATS;
  const trait = PLAYER_TRAITS.find((t) => t.id === p.trait);
  const tier = CARD_TIERS[p.cardTier || 0];
  const up = nextPrint(p);
  const all = own ? planTraining(s, p, keys, s.money) : null;
  const perPoint = (p.role === "bat" ? WIN_PER_BAT_POINT : WIN_PER_ARM_POINT) * valueOfWin(s);
  const line = statLine(stat(s, p.id), p.role === "bat");
  const slots = GEAR.filter((g) => (g.role === "bat") === (p.role === "bat"));

  return (
    <Sheet title={`${p.name} · ${p.pos}`} onClose={onClose}>
      <div className="kpis">
        <div className="kpi"><span>Overall</span><b>{ovr(p).toFixed(1)}</b><small>{trait ? trait.label : "no trait"}</small></div>
        <div className="kpi"><span>Salary</span><b>{money(salaryOf(p))}</b><small>per season</small></div>
        <div className="kpi"><span>Card</span><b style={{ fontFamily: "var(--ui)" }}>{tier.name.toLowerCase()}</b><small>{up ? `${up.name.toLowerCase()} ready` : eligibleTier(p) > (p.cardTier || 0) ? "" : `next at ${CARD_TIERS[(p.cardTier || 0) + 1]?.at ?? "—"} OVR`}</small></div>
        <div className="kpi"><span>A point is worth</span><b>{money(perPoint)}</b><small>per game, in wins</small></div>
      </div>

      <h2><span className="grow">Ratings</span>{own && <small>{p.franchise ? "franchise player · trains to his ceiling" : "stops at the league cap"}</small>}</h2>
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>Skill</th><th>Now</th><th>Gear</th><th>Max</th><th>Next pt</th>{own && <th />}</tr></thead>
          <tbody>
            {keys.map((k) => {
              const ceil = trainCeil(s, p, k), done = p[k] >= ceil, bonus = gearBonus(p, k);
              const five = own ? planTraining(s, p, [k], s.money, 5) : null;
              return (
                <tr key={k}>
                  <td style={{ textTransform: "capitalize" }}>{k}</td>
                  <td className="n">{p[k]}</td>
                  <td className={`n ${bonus > 0 ? "up" : bonus < 0 ? "down" : "dim"}`}>{bonus ? `${bonus > 0 ? "+" : ""}${bonus}` : "—"}</td>
                  <td className="n">{Number.isFinite(ceil) ? ceil : "—"}</td>
                  <td className="n">{done ? "max" : money(trainCost(s, p, k))}</td>
                  {own && (
                    <td>
                      <button className="btn btn--sm" disabled={done || s.money < trainCost(s, p, k)} onClick={() => f.act(train, p.id, k, 1)}>+1</button>{" "}
                      <button className="btn btn--sm btn--ghost" disabled={done || !five.count} onClick={() => f.act(train, p.id, k, 5)}
                        aria-label={`Train ${k} up to 5 points`} title={five.count ? money(five.total) : undefined}>+{five.count || 5}</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {own && (
        <button className="btn btn--block" style={{ marginTop: 8 }} disabled={!all.count} onClick={() => f.act(trainAll, p.id)}>
          {all.count ? `Train everything affordable: ${all.count} points for ${money(all.total)}` : "Nothing affordable to train"}
        </button>
      )}

      {line.length > 0 && (
        <>
          <h2>Season</h2>
          <div className="panel table-wrap"><table>
            <thead><tr>{line.map(([k]) => <th key={k}>{k}</th>)}</tr></thead>
            <tbody><tr>{line.map(([k, v]) => <td key={k} className="n">{v}</td>)}</tr></tbody>
          </table></div>
        </>
      )}

      <h2>Gear</h2>
      <div className="panel table-wrap"><table>
        <tbody>
          {slots.map((g) => {
            const item = p.gear?.[g.slot];
            return (
              <tr key={g.slot}>
                <td>{g.label}</td>
                <td>{item ? item.name : <span className="dim">empty</span>}</td>
                <td className="n">{item ? Object.entries(item.boosts).map(([k, n]) => `${n > 0 ? "+" : ""}${n}% ${k}`).join(", ") : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
      {own && s.shopItems.some((i) => gearGain(p, i) > 0) && <p className="note">The current shipment has upgrades for him — see Spend › Gear.</p>}

      {own && (
        <>
          <h2>Card and franchise tag</h2>
          <div className="panel panel--pad stack">
            <div className="row">
              <div className="grow">{up ? <>Print his <b>{up.name.toLowerCase()}</b> card: more jersey sales, higher trade value.</> : <>Printed: {tier.name.toLowerCase()}. {CARD_TIERS[(p.cardTier || 0) + 1] ? `The next print unlocks at ${CARD_TIERS[(p.cardTier || 0) + 1].at} OVR.` : "Top tier."}</>}</div>
              {up && <button className="btn btn--sm" disabled={s.money < up.cost} onClick={() => f.act(printCard, p.id)}>{money(up.cost)}</button>}
            </div>
            {!p.franchise && (
              <div className="row">
                <div className="grow">Franchise tag: lets him train past the league cap to his natural ceiling. {franchiseUsed(s)} of {franchiseSlots(s)} used.</div>
                <button className="btn btn--sm btn--ghost" disabled={franchiseUsed(s) >= franchiseSlots(s)} onClick={() => f.act(tagFranchise, p.id)}>Tag</button>
              </div>
            )}
          </div>

          <h2><span className="grow">Trade</span><small>same position, cash settles the difference</small></h2>
          {p.pos === "RP" ? <p className="note">Rival clubs don't carry relievers.</p> : (
            <div className="panel table-wrap"><table>
              <thead><tr><th>Their player</th><th>OVR</th><th>Salary</th><th>Cash</th><th /></tr></thead>
              <tbody>
                {s.rivals.map((team, i) => {
                  const q = tradeQuote(s, p, i);
                  if (!q) return null;
                  const pay = q.cash > 0;
                  return (
                    <tr key={team.name}>
                      <td>{q.them.name}<span className="sub">{team.name}</span></td>
                      <td className="n">{ovr(q.them).toFixed(0)}</td>
                      <td className="n">{money(salaryOf(q.them))}</td>
                      <td className={`n ${pay ? "down" : "up"}`}>{pay ? money(-q.cash) : money(-q.cash, { sign: true })}</td>
                      <td>
                        <button className={`btn btn--sm ${armed === i ? "btn--danger" : "btn--quiet"}`} disabled={pay && s.money < q.cash}
                          onBlur={() => setArmed(null)}
                          onClick={() => (armed === i ? (f.act(makeTrade, p.id, i), setArmed(null), onClose()) : setArmed(i))}>
                          {armed === i ? "Confirm" : "Trade"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          )}
        </>
      )}
    </Sheet>
  );
}
