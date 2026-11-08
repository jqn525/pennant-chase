// ── A player: ratings with training costs, gear, star power, tag and trades ──
import { useState } from "react";
import { BAT_STATS, PIT_STATS, PLAYER_TRAITS } from "../game/constants.js";
import { ovr, gearBonus, GEAR } from "../game/gear.js";
import { salaryOf } from "../game/salary.js";
import { CARD_TIERS, nextPrint, eligibleTier } from "../game/cards.js";
import { columns } from "../game/statline.js";
import StatTable from "./StatTable.jsx";
import { Sparkline } from "./charts.jsx";
import { isOpen, nextUnlockNote } from "../game/unlocks.js";
import {
  allPlayers, stat, careerOf, trainCost, trainCeil, planTraining, train, trainAll, printCard,
  tagFranchise, franchiseUsed, franchiseSlots, tradeQuote, makeTrade,
} from "../game/franchise.js";
import { gearGain, WIN_PER_BAT_POINT, WIN_PER_ARM_POINT, valueOfWin } from "../game/advisor.js";
import { money } from "./fmt.js";
import { Sheet } from "./Shell.jsx";

export default function PlayerSheet({ f, pid, onClose }) {
  const { s } = f;
  const [armed, setArmed] = useState(null);
  const [span, setSpan] = useState("season");
  const p = allPlayers(s).find((x) => x.id === pid) || s.draftClass?.find((x) => x.id === pid);
  if (!p) return null;
  const own = allPlayers(s).some((x) => x.id === pid);
  const keys = p.role === "bat" ? BAT_STATS : PIT_STATS;
  const trait = PLAYER_TRAITS.find((t) => t.id === p.trait);
  const tier = CARD_TIERS[p.cardTier || 0];
  const up = nextPrint(p);
  const all = own ? planTraining(s, p, keys, s.money) : null;
  const perPoint = (p.role === "bat" ? WIN_PER_BAT_POINT : WIN_PER_ARM_POINT) * valueOfWin(s);
  const slots = GEAR.filter((g) => (g.role === "bat") === (p.role === "bat"));

  return (
    <Sheet title={`${p.name} · ${p.pos}`} onClose={onClose}>
      <div className="kpis">
        <div className="kpi"><span>Overall</span><b>{ovr(p).toFixed(1)}</b><small>{trait ? trait.label : "no trait"}</small></div>
        <div className="kpi"><span>Salary</span><b>{money(salaryOf(p))}</b><small>per season</small></div>
        <div className="kpi"><span>Star power</span><b style={{ fontFamily: "var(--ui)", fontSize: 16 }}>{tier.name.toLowerCase()}</b><small>{up ? `${up.deal.toLowerCase()} ready` : eligibleTier(p) > (p.cardTier || 0) ? "" : `next at ${CARD_TIERS[(p.cardTier || 0) + 1]?.at ?? "—"} OVR`}</small></div>
        <div className="kpi"><span>A point is worth</span><b>{money(perPoint)}</b><small>per game, in wins</small></div>
      </div>

      {own && <Development s={s} p={p} />}

      <h2><span className="grow">Ratings</span>{own && <small>{p.franchise ? "franchise player · trains to his ceiling" : "stops at the league cap"}</small>}</h2>
      <div className="card card--m table-wrap">
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

      {own && <PlayerStats s={s} p={p} span={span} setSpan={setSpan} />}

      <h2>Gear</h2>
      <div className="card card--m table-wrap"><table>
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
          <h2>{isOpen(s, "star") ? "Star power and franchise tag" : "Franchise tag"}</h2>
          <div className="card card--m panel--pad stack">
            {isOpen(s, "star") && <div className="row">
              <div className="grow">{up ? <><b>{up.deal}</b>: {up.blurb}. Makes him a {up.name.toLowerCase()}, sells more merch, raises his trade value.</> : <>{tier.id ? `He is a ${tier.name.toLowerCase()}.` : "Nobody outside the ballpark knows him yet."} {CARD_TIERS[(p.cardTier || 0) + 1] ? `The next deal (${CARD_TIERS[(p.cardTier || 0) + 1].deal.toLowerCase()}) opens at ${CARD_TIERS[(p.cardTier || 0) + 1].at} OVR.` : "As famous as it gets."}</>}</div>
              {up && <button className="btn btn--sm" disabled={s.money < up.cost} onClick={() => f.act(printCard, p.id)}>{money(up.cost)}</button>}
            </div>}
            {!p.franchise && (
              <div className="row">
                <div className="grow">Franchise tag: lets him train past the league cap to his natural ceiling. {franchiseUsed(s)} of {franchiseSlots(s)} used.</div>
                <button className="btn btn--sm btn--ghost" disabled={franchiseUsed(s) >= franchiseSlots(s)} onClick={() => f.act(tagFranchise, p.id)}>Tag</button>
              </div>
            )}
          </div>

          <h2><span className="grow">Trade</span><small>{isOpen(s, "trades") ? "same position, cash settles the difference" : ""}</small></h2>
          {!isOpen(s, "trades") ? <p className="note">{nextUnlockNote.trades}</p> : p.pos === "RP" ? <p className="note">Rival clubs don't carry relievers.</p> : (
            <div className="card card--l table-wrap"><table>
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

const LOG_COLS = { bat: ["AB", "H", "HR", "RBI", "BB", "K"], pit: ["IP", "H", "R", "BB", "K"] };

function PlayerStats({ s, p, span, setSpan }) {
  const isBat = p.role === "bat";
  const log = s.gameLog?.[p.id] || [];
  const cols = columns(isBat).filter(([k]) => LOG_COLS[isBat ? "bat" : "pit"].includes(k));
  return (
    <>
      <h2>Stats</h2>
      <div className="chips" role="tablist" aria-label="Stat span" style={{ marginBottom: 8 }}>
        {[["season", `Year ${s.year}`], ["career", "Career"], ["log", "Game log"]].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={span === k} className={span === k ? "on" : ""} onClick={() => setSpan(k)}>{l}</button>
        ))}
      </div>
      {span !== "log" ? (
        <StatTable isBat={isBat} sortable={false} size="s"
          rows={[{ id: p.id, name: span === "career" ? "Career" : `Year ${s.year}`, stat: span === "career" ? careerOf(s, p.id) : stat(s, p.id) }]} />
      ) : (
        <div className="card card--l table-wrap stat-table">
          <table>
            <thead><tr><th>Game</th>{cols.map(([k]) => <th key={k}>{k}</th>)}</tr></thead>
            <tbody>
              {log.length === 0 && <tr><td className="dim" colSpan={cols.length + 1}>No games yet.</td></tr>}
              {log.map((g, i) => (
                <tr key={i}>
                  <td>
                    <span className={g.won ? "up" : "down"}>{g.won ? "W" : "L"} {g.us}–{g.them}</span>
                    <span className="sub">{g.game} {g.home ? "vs" : "@"} {g.opp}</span>
                  </td>
                  {cols.map(([k, show]) => <td key={k} className="n">{show(g)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Development({ s, p }) {
  const series = s.hist?.ovr?.[p.id] || [];
  const buys = (s.hist?.spend || []).filter((e) => e.pid === p.id && (e.cat === "training" || e.cat === "gear"));
  const invested = buys.reduce((t, e) => t + e.cost, 0);
  const pts = buys.reduce((t, e) => t + (e.d > 0 ? e.d : 0), 0);
  const first = series.length ? series[0][1] / 10 : null;
  return (
    <div className="card card--s panel--pad row" style={{ marginTop: 8 }}>
      <Sparkline points={series} width={96} height={30} />
      <div className="grow" style={{ fontSize: 13 }}>
        {first != null ? <>Overall {first.toFixed(1)} → <b>{ovr(p).toFixed(1)}</b> since tracking began</> : "Development tracking starts with his next game."}
        <span className="sub">{buys.length ? `${money(invested)} in training and gear · +${pts.toFixed(1)} OVR · ${pts > 0 ? money(invested / pts) : "—"} per point` : "No training or gear bought for him yet."}</span>
      </div>
    </div>
  );
}
