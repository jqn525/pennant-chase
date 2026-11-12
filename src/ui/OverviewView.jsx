// ── Overview (home): club health, the race, the last game, leaders and the ledger. View only. ──
import { MarketTag } from "./MarketTag.jsx";
import { useState } from "react";
import { SALARY, LEAGUE, stadiumFx } from "../game/constants.js";
import { demandPremium } from "../game/engine.js";
import { LEDGER_LINES, ledgerNet, stat, tn, seriesNow } from "../game/franchise.js";
import { seedOrder, teamRating, gamesBehind } from "../game/season.js";
import { avg, ops, era } from "../game/statline.js";
import { money, count, ordinal } from "./fmt.js";
import { netPerGame, payroll, payrollShare, fansWin, place, attendance } from "./metrics.js";
import BoxScore from "./BoxScore.jsx";
import { starterFor } from "../game/roster.js";
import { useTween } from "./motion.js";
import { weakestLink } from "../game/units.js";

function Ledger({ s }) {
  const [view, setView] = useState("season");
  const cols = { game: ["Last game", s.ledger.lastGame], season: ["This season", s.ledger.season], life: ["All time", s.ledger.life] };
  const compare = view === "season" ? s.ledger.lastSeason : null;
  const [label, bucket] = cols[view];
  const rows = LEDGER_LINES.filter(([k]) => bucket[k] || compare?.[k]);
  return (
    <>
      <h2><span className="grow">Ledger</span></h2>
      <div className="chips" role="tablist" aria-label="Ledger period" style={{ marginBottom: 8 }}>
        {Object.entries(cols).map(([k, [l]]) => (
          <button key={k} role="tab" aria-selected={view === k} className={view === k ? "on" : ""} onClick={() => setView(k)}>{l}</button>
        ))}
      </div>
      <div className="card card--l table-wrap">
        <table>
          <thead><tr><th>Line</th><th>{label}</th>{compare && Object.keys(compare).length > 0 && <th>Last season</th>}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={3} className="dim">No money has moved yet.</td></tr>}
            {rows.map(([k, name]) => (
              <tr key={k}>
                <td>{name}</td>
                <td className={`n ${(bucket[k] || 0) >= 0 ? "" : "down"}`}>{money(bucket[k] || 0)}</td>
                {compare && Object.keys(compare).length > 0 && <td className="n dim">{money(compare[k] || 0)}</td>}
              </tr>
            ))}
            <tr className="total">
              <td>Net</td>
              <td className={`n ${ledgerNet(bucket) >= 0 ? "up" : "down"}`}>{money(ledgerNet(bucket), { sign: true })}</td>
              {compare && Object.keys(compare).length > 0 && <td className="n dim">{money(ledgerNet(compare), { sign: true })}</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// Who leads the club in each category (batters need 2 AB per team game to qualify for rates)
function leaders(s) {
  const games = Math.max(1, s.results.filter((r) => r.year === s.year).length);
  const bats = s.roster.batters.map((p) => ({ p, st: stat(s, p.id) }));
  const arms = [...s.roster.rotation, ...s.roster.pen].map((p) => ({ p, st: stat(s, p.id) }));
  const qual = bats.filter((x) => x.st.ab >= games * 2);
  const best = (list, v, show, low = false) => {
    const pool = list.filter((x) => Number.isFinite(v(x.st)));
    if (!pool.length) return null;
    const top = pool.reduce((a, b) => ((low ? v(b.st) < v(a.st) : v(b.st) > v(a.st)) ? b : a));
    return { p: top.p, value: show(top.st) };
  };
  const rate = (n, d) => (d ? n / d : NaN);
  return [
    ["AVG", best(qual, (x) => rate(x.h, x.ab), avg)],
    ["OPS", best(qual, (x) => rate(x.h + x.bb, x.ab + x.bb) + rate(x.h + x.d + 2 * x.t + 3 * x.hr, x.ab), ops)],
    ["HR", best(bats, (x) => (x.hr ? x.hr : NaN), (x) => x.hr)],
    ["RBI", best(bats, (x) => (x.rbi ? x.rbi : NaN), (x) => x.rbi)],
    ["ERA", best(arms.filter((x) => x.st.outsP >= 9), (x) => rate(x.raP * 27, x.outsP), era, true)],
    ["K", best(arms, (x) => (x.kP ? x.kP : NaN), (x) => x.kP)],
  ];
}

function Race({ s, goTo }) {
  const names = [tn(s.city), ...s.rivals.map((r) => r.name)];
  const ratings = [teamRating(s.roster), ...s.rivals.map(teamRating)];
  const order = seedOrder(s.standings, ratings);
  const leader = s.standings[order[0]];
  const me = order.indexOf(0);
  const show = order.slice(0, LEAGUE.playoffTeams).concat(me >= LEAGUE.playoffTeams ? [0] : []);
  return (
    <>
      <h2><span className="grow">The race</span><button className="btn btn--quiet btn--sm" onClick={() => goTo("stats", "team")}>Full standings</button></h2>
      <div className="card card--m table-wrap">
        <table>
          <thead><tr><th>Club</th><th>W</th><th>L</th><th>GB</th></tr></thead>
          <tbody>
            {show.map((i) => {
              const rank = order.indexOf(i), t = s.standings[i];
              return (
                <tr key={i} className={`${i === 0 ? "me" : ""} ${rank === LEAGUE.playoffTeams - 1 && me < LEAGUE.playoffTeams ? "cut" : ""}`}>
                  <td>{rank + 1}. {names[i]}<MarketTag s={s} i={i} /></td>
                  <td className="n">{t.w}</td><td className="n">{t.l}</td>
                  <td className="n">{rank === 0 ? "—" : gamesBehind(leader, t).toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// The ticker card is always there, always the same height: live plays during a
// game; the last final and the next matchup between games; a winter note in the draft.
const ROWS = 5;
function NowPlaying({ s }) {
  const g = s.live && !s.live.over ? s.live : null;
  const me = tn(s.city);
  let head, rows, label;
  if (g) {
    const them = g.opp.name;
    const away = g.home ? [them, g.them] : [me, g.us], home = g.home ? [me, g.us] : [them, g.them];
    const bases = (g.bases || []).map((x) => (x ? "◆" : "◇"));
    const usArm = s.ctx?.staff?.sp?.name?.split(" ").pop(), themArm = s.ctx?.oppStaff?.sp?.name?.split(" ").pop();
    label = `${g.half === "top" ? "Top" : "Bottom"} ${g.inning} · ${g.outs} out${g.outs === 1 ? "" : "s"}${usArm ? ` · ${usArm} vs ${themArm}` : ""}`;
    head = (
      <div className="ticker__score">
        <div><span>{away[0]}</span><b>{away[1]}</b></div>
        <div><span>{home[0]}</span><b>{home[1]}</b></div>
        <div className="ticker__bases" aria-label="Runners on base"><i>{bases[1]}</i><i>{bases[2]}</i><i>{bases[0]}</i></div>
      </div>
    );
    rows = (g.feed || []).slice(0, ROWS).map((e) => ({ tag: `${e.h === "top" ? "▲" : "▼"}${e.i}`, text: e.t, cls: `${e.k === "hr" || /score/.test(e.t) ? "big" : ""} ${e.k === "sys" ? "dim" : ""}` }));
  } else {
    const r = s.results[0];
    label = s.phase === "draft" ? "Winter" : "Between games";
    head = (
      <div className="ticker__score">
        {r ? <><div><span>{me}</span><b>{r.us}</b></div><div><span>{r.opp}</span><b>{r.them}</b></div><div className={`ticker__final ${r.won ? "up" : "down"}`}>{r.won ? "W" : "L"} · F</div></>
          : <div className="dim" style={{ gridColumn: "1 / -1" }}>Opening day is coming.</div>}
      </div>
    );
    const next = s.phase === "regular" && s.schedule?.[s.gameIndex];
    const nextName = next ? s.rivals[next.opp - 1].name : null;
    rows = [
      s.phase === "draft" ? { tag: "", text: "The draft board is open. The season waits until you close it." }
        : nextName ? { tag: "Next", text: `Game ${s.gameIndex + 1} of ${LEAGUE.seasonGames}: ${next.home ? `${nextName} at ${me}` : `${me} at ${nextName}`}. ${starterFor(s.roster, s.rotationTurn || 0).name} starts.` } : null,
      ...s.log.filter((e) => e.kind !== "play").slice(0, ROWS).map((e) => ({ tag: "", text: e.text, cls: e.kind === "beat" ? "beat" : "dim" })),
    ].filter(Boolean).slice(0, ROWS);
  }
  while (rows.length < ROWS) rows.push({ tag: "", text: "", cls: "" });
  return (
    <>
      <h2><span className="grow">{g ? "Now playing" : "Scoreboard"}</span><small>{label}</small></h2>
      <div className="card card--m ticker">
        {head}
        <ul className="feed">
          {rows.map((e, i) => (
            <li key={i} className={e.cls}><span className="ticker__inn">{e.tag}</span><span className="grow">{e.text || "\u00a0"}</span></li>
          ))}
        </ul>
      </div>
    </>
  );
}

function status(s) {
  if (s.phase === "draft") return "Winter: the draft board is open.";
  if (s.phase === "playoffs" && s.playoffs) {
    const p = s.playoffs;
    return `${p.round === "final" ? "Pennant Cup final" : "Semifinal"} vs the ${s.rivals[p.opp - 1].name}: ${p.wins.us}–${p.wins.them}, first to ${p.round === "final" ? 4 : 3}.`;
  }
  const sr = seriesNow(s);
  return sr ? `Series vs ${s.rivals[s.schedule[s.gameIndex].opp - 1].name}: ${sr.w}–${sr.l}, ${sr.gamesLeft} to play.` : "";
}

export default function OverviewView({ f, goTo, openPlayer }) {
  const { s } = f;
  const net = netPerGame(s);
  const share = payrollShare(s);
  const cap = stadiumFx(s.stadium).attCap;
  const { w, l } = s.standings[0];
  const lead = leaders(s);
  const cashT = useTween(s.money), fansT = useTween(s.fans);
  return (
    <>
      <div className="kpis">
        <div className="kpi"><span>Cash</span><b>{money(cashT)}</b><small className={net >= 0 ? "up" : "down"}>{money(net, { sign: true })} per game</small></div>
        <div className="kpi"><span>Fans</span><b>{count(fansT)}</b><small>+{count(fansWin(s))} per win</small></div>
        <div className="kpi"><span>Record</span><b>{w}–{l}</b><small>{ordinal(place(s))} of 8 · top 4 make it</small></div>
        <div className="kpi"><span>Payroll</span><b>{money(payroll(s))}</b><small className={share > 1 ? "down" : share > 0.8 ? "warn" : ""}>{Math.round(share * 100)}% of {money(SALARY.cap)} cap</small>
          <div className="bar"><i className={share > 1 ? "over" : share > 0.8 ? "hot" : ""} style={{ width: `${Math.min(100, share * 100)}%` }} /></div></div>
      </div>
      <p className="note">{status(s)} Crowd {count(attendance(s))} a game · {s.fans > cap ? <> sold out ({count(cap)} seats) · <span className="up">demand +{Math.round((demandPremium(s.fans, cap) - 1) * 100)}% on ticket prices</span></> : <>the park holds {count(cap)}</>}.{Object.keys(s.builds || {}).length > 0 && <> {Object.keys(s.builds).length} project{Object.keys(s.builds).length === 1 ? "" : "s"} under construction.</>}{s.training && <> Coaching: {laneSummary(s)}.</>}{weakestLink(s) && <> {weakestLink(s).short}</>}</p>

      <NowPlaying s={s} />

      <h2>Club news</h2>
      <div className="card card--m">
        <ul className="feed">
          {s.log.filter((e) => e.kind !== "play").slice(0, 5).map((e) => <li key={e.id} className={e.kind === "beat" ? "beat" : ""}><span className="grow">{e.text}</span></li>)}
        </ul>
      </div>

      <h2>Last game</h2>
      <BoxScore s={s} openPlayer={openPlayer} />

      <Race s={s} goTo={goTo} />

      <h2><span className="grow">Club leaders</span><small>this season</small></h2>
      <div className="card card--m">
        <ul className="feed">
          {lead.map(([k, x]) => (
            <li key={k} className={x ? "link" : "dim"} onClick={x ? () => openPlayer(x.p.id) : undefined} style={x ? { cursor: "pointer" } : undefined}>
              <span style={{ width: 40, flex: "none" }} className="dim">{k}</span>
              <span className="grow">{x ? x.p.name : "—"}{x && <span className="sub">{x.p.pos}</span>}</span>
              <span className="num">{x ? x.value : ""}</span>
            </li>
          ))}
        </ul>
      </div>

      <Ledger s={s} />
    </>
  );
}

// "3 lanes: 2 hitting, 1 pitching · 2 busy"
function laneSummary(s) {
  const ls = s.training.lanes;
  const by = {};
  for (const l of ls) by[l.area] = (by[l.area] || 0) + 1;
  const names = { hit: "hitting", pitch: "pitching", field: "field" };
  return `${ls.length} lanes (${Object.entries(by).map(([a, n]) => `${n} ${names[a]}`).join(", ")}) · ${ls.filter((l) => l.prog).length} busy`;
}
