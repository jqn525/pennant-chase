// ── Stats: the front office's charts — team, money, spending, players, projections, records ──
import { useMemo, useState } from "react";
import { LEAGUE } from "../game/constants.js";
import { careerOf, stat, tn } from "../game/franchise.js";
import { isOpen } from "../game/unlocks.js";
import { seasonRows, row as decode } from "../game/history.js";
import { spendReport, development, teamKpis, ratingsTable, project, paceProjection, milestones, careerLeaders, CAT_LABEL } from "../game/analytics.js";
import { money, count, ordinal } from "./fmt.js";
import { LineChart, BarList, StackedBars, Sparkline, Meter, SERIES } from "./charts.jsx";
import StatTable from "./StatTable.jsx";
import SeasonView from "./SeasonView.jsx";

export const STATS_KEY = "pc-stats";
const SECTIONS = [["team", "Team"], ["money", "Money", "stats-money"], ["roi", "Spending", "stats-roi"], ["players", "Players", "stats-players"], ["proj", "Projections", "projections"], ["records", "Records", "records"]];
export const CAT_COLOR = { training: SERIES[0], gear: SERIES[1], upgrades: SERIES[2], prints: SERIES[3], draft: SERIES[4], trades: SERIES[5], tax: SERIES[6] };
const usd = (v) => { const a = Math.abs(v); const s = a >= 1e6 ? `${(a / 1e6).toFixed(1)}M` : a >= 1e4 ? `${Math.round(a / 1e3)}k` : a >= 1e3 ? `${(a / 1e3).toFixed(1)}k` : `${Math.round(a)}`; return `${v < 0 ? "−" : ""}$${s}`; };
const compact = (v) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.abs(v) >= 1e3 ? `${Math.round(v / 1e3)}k` : `${Math.round(v)}`);
// odds from a simulation are never truly 0% or 100%
const odds = (p) => (p >= 0.995 && p < 1 ? ">99%" : p >= 1 ? "100%" : p <= 0.005 && p > 0 ? "<1%" : `${Math.round(p * 100)}%`);
const pct3 = (v) => v.toFixed(3).replace(/^0/, "");

function Chips({ value, set, items, label }) {
  return (
    <div className="chips" role="tablist" aria-label={label}>
      {items.map(([k, l]) => <button key={k} role="tab" aria-selected={value === k} className={value === k ? "on" : ""} onClick={() => set(k)}>{l}</button>)}
    </div>
  );
}
const Kpi = ({ label, value, sub, cls }) => <div className="kpi"><span>{label}</span><b className={cls}>{value}</b>{sub && <small>{sub}</small>}</div>;

// Projections are a 1,000-run simulation: compute once per game played
function useProjection(s) {
  const key = `${s.year}|${s.phase}|${s.gameIndex}|${s.playoffs?.round}|${s.playoffs?.gameNo}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => project(s, 1000), [key]);
}

// ── Team ──
function Team({ f, openPlayer }) {
  const { s } = f;
  const k = teamKpis(s);
  const pr = useProjection(s);
  const rt = ratingsTable(s);
  return (
    <>
      <div className="kpis">
        <Kpi label="Record" value={`${k.w}–${k.l}`} sub={k.games ? `${pct3(k.w / k.games)} · last 10 ${k.last10.w}–${k.last10.l}` : "no games yet"} />
        <Kpi label="Run differential" value={`${k.diff > 0 ? "+" : ""}${k.diff}`} cls={k.diff > 0 ? "up" : k.diff < 0 ? "down" : ""} sub={`${k.rf} scored · ${k.ra} allowed`} />
        <Kpi label="Expected wins" value={k.expW.toFixed(1)} sub={`luck ${k.luck >= 0 ? "+" : ""}${k.luck.toFixed(1)} wins`} />
        <Kpi label="Playoff odds" value={pr ? odds(pr.playoffPct) : "—"} sub={pr ? `Cup ${odds(pr.cupPct)}` : "winter"} />
      </div>
      <p className="note">Expected wins come from runs scored and allowed. Luck is the gap between your record and that.</p>

      <h2><span className="grow">Win rate through the season</span></h2>
      <LineChart label="Winning percentage by game" series={[{ label: "Win %", color: SERIES[0], points: k.winPct.filter(([g]) => g >= 5) }]}
        refs={[{ y: 0.5, label: ".500" }]} yFmt={(v) => pct3(Math.max(0, Math.min(1, v)))} />

      <h2><span className="grow">Team rating vs the league</span><small>average overall</small></h2>
      <BarList fmt={(v) => v.toFixed(1)} rows={rt.map((t) => ({ label: t.me ? `${t.name} (you)` : t.name, value: t.r, color: t.me ? SERIES[0] : "var(--faint)" }))} />

      <h2>Splits</h2>
      <div className="card card--m table-wrap">
        <table>
          <thead><tr><th>Split</th><th>W</th><th>L</th><th>Pct</th></tr></thead>
          <tbody>
            {[["Home", k.home], ["Away", k.away], ["Last 10", k.last10], ["One-run games", k.oneRun], ["Blowouts (5+)", k.blowouts]].map(([l, r]) => (
              <tr key={l}><td>{l}</td><td className="n">{r.w}</td><td className="n">{r.l}</td><td className="n">{r.w + r.l ? pct3(r.w / (r.w + r.l)) : "—"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {k.vs.length > 0 && (
        <>
          <h2>Head to head</h2>
          <div className="card card--l table-wrap">
            <table>
              <thead><tr><th>Opponent</th><th>W</th><th>L</th><th>RS</th><th>RA</th></tr></thead>
              <tbody>{k.vs.map((v) => <tr key={v.opp}><td>{v.opp}</td><td className="n">{v.w}</td><td className="n">{v.l}</td><td className="n">{v.rf}</td><td className="n">{v.ra}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
      <SeasonView f={f} openPlayer={openPlayer} />
    </>
  );
}

// ── Money ──
function MoneySection({ s }) {
  const years = [...new Set(s.hist.games.map((r) => r[1]))];
  const [span, setSpan] = useState(String(s.year));
  const all = span === "all";
  const y = all ? null : Number(span);
  const rows = all ? s.hist.games.map(decode) : seasonRows(s.hist, y);
  const xOf = (r) => (all ? r.n : r.gi + 1 + (r.po ? LEAGUE.seasonGames : 0));
  const evs = s.hist.spend.filter((e) => all || e.y === y);
  const markers = evs.map((e) => ({
    x: all ? Math.max(1, e.n) : Math.max(1, e.gi), color: CAT_COLOR[e.cat], cat: { label: CAT_LABEL[e.cat], color: CAT_COLOR[e.cat] },
    title: money(e.cost), detail: `${CAT_LABEL[e.cat]}${e.name ? ` · ${e.name}` : ""} · ${e.what}`,
  }));
  const xFmt = all ? (x) => `#${x}` : (x) => (x > LEAGUE.seasonGames ? "PO" : `G${x}`);
  const bucket = Math.max(1, Math.ceil(rows.length / 30));
  const cols = [];
  for (let i = 0; i < rows.length; i += bucket) {
    const g = rows.slice(i, i + bucket);
    const sum = (k) => g.reduce((t, r) => t + r[k], 0);
    cols.push({ x: xOf(g[0]), title: `${xFmt(xOf(g[0]))}${g.length > 1 ? `–${xFmt(xOf(g[g.length - 1])).replace(/^G/, "")}` : ""}`,
      parts: [{ key: "gate", v: sum("gate") }, { key: "win", v: sum("win") }, { key: "merch", v: sum("merch") }, { key: "tv", v: sum("tv") }, { key: "post", v: sum("post") }, { key: "pay", v: sum("pay") }] });
  }
  const rep = spendReport(s, { year: y });
  return (
    <>
      <Chips label="Season" value={span} set={setSpan} items={[...years.map((v) => [String(v), `Year ${v}`]), ...(years.length > 1 ? [["all", "All time"]] : [])]} />
      <h2><span className="grow">Cash, and every purchase</span><small>tap the chart</small></h2>
      <LineChart label="Cash after each game with purchases marked" series={[{ label: "Cash", color: "var(--fg)", points: rows.map((r) => [xOf(r), r.cash]) }]}
        markers={markers} yFmt={usd} xFmt={xFmt} zero />
      <p className="note">Each dot is a purchase, colored by what it bought. Dips are spending; the slope between them is your income.</p>

      <h2>Fans</h2>
      <LineChart label="Fans after each game" series={[{ label: "Fans", color: SERIES[2], points: rows.map((r) => [xOf(r), r.fans]) }]} yFmt={compact} xFmt={xFmt} />

      <h2><span className="grow">Where the money comes from</span><small>{bucket > 1 ? `per ${bucket} games` : "per game"}</small></h2>
      <StackedBars label="Income and payroll by game" cols={cols} yFmt={usd} xFmt={xFmt} keys={[
        { key: "gate", label: "Gate", color: SERIES[0] }, { key: "win", label: "Win bonus", color: SERIES[1] },
        { key: "merch", label: "Merch", color: SERIES[2] }, { key: "tv", label: "TV", color: SERIES[3] },
        { key: "post", label: "Playoffs", color: SERIES[4] }, { key: "pay", label: "Payroll", color: SERIES[6] }]} />

      <h2><span className="grow">Spending by category</span><small>{money(rep.total)}</small></h2>
      {rep.byCat.length ? <BarList fmt={money} rows={rep.byCat.map((c) => ({ label: c.label, sub: `${c.count}×`, value: c.cost, color: CAT_COLOR[c.cat] }))} />
        : <p className="note">Nothing bought yet{all ? "" : " this season"}.</p>}

      {s.hist.seasons.length > 0 && (
        <>
          <h2>Season by season</h2>
          <div className="card card--m table-wrap stat-table">
            <table>
              <thead><tr><th>Year</th><th>W–L</th><th>Finish</th><th>Income</th><th>Spent</th><th>Net</th><th>Fans</th></tr></thead>
              <tbody>
                {[...s.hist.seasons].reverse().map((z) => {
                  const inc = Object.entries(z.ledger).filter(([, v]) => v > 0).reduce((t, [, v]) => t + v, 0);
                  const out = Object.values(z.spend).reduce((t, v) => t + v, 0);
                  const net = Object.values(z.ledger).reduce((t, v) => t + v, 0);
                  return (
                    <tr key={z.y} className={z.cup ? "me" : ""}>
                      <td>{z.y}{z.cup ? " 🏆" : ""}</td><td className="n">{z.w}–{z.l}</td><td className="n">{ordinal(z.finish)}</td>
                      <td className="n">{money(inc)}</td><td className="n">{money(out)}</td>
                      <td className={`n ${net >= 0 ? "up" : "down"}`}>{money(net, { sign: true })}</td><td className="n">{count(z.fans1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

// ── Spending & ROI ──
function Roi({ s }) {
  const [sort, setSort] = useState("recent");
  const [who, setWho] = useState("all");
  const [more, setMore] = useState(false);
  const rep = spendReport(s);
  const list = rep.events.filter((e) => who === "all" || (who === "auto") === !!e.auto).sort(sort === "recent" ? (a, b) => b.n - a.n || 0 : (a, b) => b.progress - a.progress);
  const shown = more ? list : list.slice(0, 25);
  return (
    <>
      <div className="kpis">
        <Kpi label="Invested" value={money(rep.total)} sub={`${rep.events.length} purchases`} />
        <Kpi label="Added per game" value={money(rep.gainPerGame, { sign: true })} cls="up" sub="estimated, all buys" />
        <Kpi label="Earned back" value={money(rep.returned)} sub={`${rep.paidOff} buys paid off`} />
        <Kpi label="Overall bought" value={`+${rep.ovrBought.toFixed(1)}`} sub={`≈ +${rep.winsPerSeason.toFixed(1)} wins a season`} />
      </div>
      <p className="note">Estimates use the same model as the Spend tab: rating points turn into wins, wins into gate, fans and merch.</p>

      <h2>Spent vs earned back, by category</h2>
      {rep.byCat.length ? (
        <BarList fmt={money} legend={[{ label: "Spent", color: "var(--faint)" }, { label: "Earned back so far", color: SERIES[2] }]}
          rows={rep.byCat.map((c) => ({ label: c.label, sub: c.gainPerGame > 0.05 ? `+${money(c.gainPerGame)}/game` : "", value: c.cost, color: "var(--faint)", value2: c.returned, color2: SERIES[2], show: `${money(c.returned)} of ${money(c.cost)}` }))} />
      ) : <p className="note">Nothing bought yet. Every purchase from now on is tracked here.</p>}

      <h2><span className="grow">Purchases</span></h2>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <Chips label="Sort" value={sort} set={setSort} items={[["recent", "Most recent"], ["best", "Best return"]]} />
        <Chips label="Bought by" value={who} set={setWho} items={[["all", "All"], ["auto", "Auto"], ["manual", "Yours"]]} />
      </div>
      <div className="card card--l table-wrap wrap-first" style={{ marginTop: 8 }}>
        <table>
          <thead><tr><th>Purchase</th><th>Cost</th><th>+/g</th><th>Paid</th></tr></thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={4} className="dim">No purchases yet.</td></tr>}
            {shown.map((e, i) => (
              <tr key={i}>
                <td><b>{e.name || CAT_LABEL[e.cat]}</b>{e.auto && <> <span className="tag">auto</span></>}<span className="sub"><i className="dot" style={{ background: CAT_COLOR[e.cat] }} />{e.what}{e.d ? ` · OVR ${e.d > 0 ? "+" : ""}${e.d}` : ""} · Y{e.y} G{e.gi}</span></td>
                <td className="n">{money(e.cost)}</td>
                <td className="n up">{e.gainPerGame > 0.05 ? money(e.gainPerGame, { sign: true }) : "—"}</td>
                <td className="n">{e.gainPerGame > 0.05 ? (e.progress >= 1 ? <span className="tag tag--accent">paid off</span> : `${Math.round(e.progress * 100)}%`) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length > 25 && <button className="btn btn--quiet btn--block" style={{ marginTop: 8 }} onClick={() => setMore((m) => !m)}>{more ? "Show fewer" : `Show all ${list.length}`}</button>}
    </>
  );
}

// ── Players ──
function Players({ s, openPlayer }) {
  const dev = development(s);
  const [pid, setPid] = useState(() => dev[0]?.p.id ?? null);
  const [side, setSide] = useState("bat");
  const [span, setSpan] = useState("season");
  const sel = dev.find((d) => d.p.id === pid) || dev[0];
  const markers = sel ? s.hist.spend.filter((e) => e.pid === sel.p.id && (e.cat === "training" || e.cat === "gear" || e.cat === "draft" || e.cat === "trades")).map((e) => ({
    x: Math.max(1, e.n), color: CAT_COLOR[e.cat], cat: { label: CAT_LABEL[e.cat], color: CAT_COLOR[e.cat] }, title: money(e.cost), detail: `${e.what}${e.d ? ` (OVR ${e.d > 0 ? "+" : ""}${e.d})` : ""}`,
  })) : [];
  const pts = sel ? sel.series.map(([n, v]) => [n, v / 10]) : [];
  if (pts.length === 1) pts.push([Math.max(pts[0][0] + 1, s.hist.n), pts[0][1]]);
  const teamTr = s.hist.games.map(decode).map((r) => [r.n, r.tr]);
  return (
    <>
      <h2><span className="grow">Overall over time</span></h2>
      <label className="field" style={{ marginBottom: 8 }}>
        <span>Player</span>
        <select value={sel?.p.id ?? ""} onChange={(e) => setPid(dev.find((d) => String(d.p.id) === e.target.value)?.p.id)}>
          {dev.map((d) => <option key={d.p.id} value={d.p.id}>{d.p.name} · {d.p.pos} · {d.now.toFixed(1)}</option>)}
        </select>
      </label>
      <LineChart label={`${sel?.p.name} overall over time`} series={[{ label: "Overall", color: SERIES[0], points: pts }]} markers={markers} xFmt={(x) => `#${x}`} yFmt={(v) => v.toFixed(1)} />
      <p className="note">The x-axis counts every game your club has played. Dots mark training, gear, trades and signings.</p>

      <h2><span className="grow">Team rating</span><small>average overall, game by game</small></h2>
      <LineChart label="Team rating over time" series={[{ label: "Team rating", color: SERIES[6], points: teamTr }]} xFmt={(x) => `#${x}`} yFmt={(v) => v.toFixed(1)} />

      <h2><span className="grow">Development</span><small>tap a player</small></h2>
      <div className="card card--l table-wrap stat-table">
        <table>
          <thead><tr><th>Player</th><th>OVR</th><th>Season</th><th>Career</th><th>Invested</th><th>$/pt</th><th>Room</th><th>Trend</th></tr></thead>
          <tbody>
            {dev.map((d) => (
              <tr key={d.p.id} className="link" onClick={() => openPlayer(d.p.id)}>
                <td><b>{d.p.name}</b><span className="sub">{d.p.pos}</span></td>
                <td className="n">{d.now.toFixed(1)}</td>
                <td className={`n ${d.season > 0.05 ? "up" : d.season < -0.05 ? "down" : ""}`}>{d.season > 0 ? "+" : ""}{d.season.toFixed(1)}</td>
                <td className={`n ${d.career > 0.05 ? "up" : d.career < -0.05 ? "down" : ""}`}>{d.career > 0 ? "+" : ""}{d.career.toFixed(1)}</td>
                <td className="n">{money(d.invested)}</td>
                <td className="n">{d.perPoint ? money(d.perPoint) : "—"}</td>
                <td className="n">{d.room}</td>
                <td><Sparkline points={d.series} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">Season and Career: overall gained since the season began or since tracking began. Room: rating points left before training stops.</p>

      <h2><span className="grow">Batting and pitching</span><small>tap a column to sort</small></h2>
      <div className="row" style={{ flexWrap: "wrap", marginBottom: 8 }}>
        <Chips label="Batting or pitching" value={side} set={setSide} items={[["bat", "Batting"], ["pit", "Pitching"]]} />
        <Chips label="Season or career" value={span} set={setSpan} items={[["season", "This season"], ["career", "Career"]]} />
      </div>
      <StatTable key={side + span} isBat={side === "bat"} totals initial={side === "bat" ? "OPS" : undefined}
        rows={(side === "bat" ? s.roster.batters : [...s.roster.rotation, ...s.roster.pen]).map((p) => ({
          id: p.id, name: p.name, sub: p.pos, onClick: () => openPlayer(p.id), stat: span === "career" ? careerOf(s, p.id) : stat(s, p.id),
        }))} />
    </>
  );
}

// ── Projections ──
function Projections({ s }) {
  const pr = useProjection(s);
  const pace = paceProjection(s);
  if (!pr) return <p className="note">Projections return on opening day.</p>;
  const reg = s.phase === "regular";
  return (
    <>
      <h2><span className="grow">Odds</span><small>1,000 simulated finishes</small></h2>
      <div className="barlist">
        <Meter label="Make the playoffs" pct={pr.playoffPct} />
        <Meter label="Reach the Pennant Cup final" pct={pr.finalPct} />
        <Meter label="Win the Pennant Cup" pct={pr.cupPct} />
      </div>
      {reg && (
        <>
          <h2>Projected record</h2>
          <div className="kpis">
            <Kpi label="Most likely" value={`${pr.winsP50}–${LEAGUE.seasonGames - pr.winsP50}`} sub={`${Math.round((pr.winsP50 / LEAGUE.seasonGames) * 1000) / 10}% wins`} />
            <Kpi label="Range (80%)" value={`${pr.winsP10}–${pr.winsP90}`} sub="wins" />
          </div>
          <h2>Where you finish</h2>
          <BarList fmt={(v) => `${Math.round(v * 100)}%`} rows={pr.seedPct.map((p, i) => ({ label: `${ordinal(i + 1)}${i < LEAGUE.playoffTeams ? " · playoffs" : ""}`, value: p, color: i < LEAGUE.playoffTeams ? SERIES[0] : "var(--faint)" }))} />
        </>
      )}
      <h2>If you keep this pace</h2>
      <div className="kpis">
        <Kpi label="Operating net" value={money(pace.netPerGame, { sign: true })} cls={pace.netPerGame >= 0 ? "up" : "down"} sub="per game, before buys" />
        <Kpi label="Cash at season end" value={money(pace.cash)} sub={`${pace.left} games left`} />
        <Kpi label="Fans at season end" value={count(pace.fans)} sub={`now ${count(s.fans)}`} />
        <Kpi label="Season net so far" value={money(pace.seasonNet, { sign: true })} cls={pace.seasonNet >= 0 ? "up" : "down"} sub="after buys" />
      </div>
      <p className="note">Odds play out the rest of the schedule with every club's current rating, nudged by how your club has actually played this year. They move as you train and buy.</p>
    </>
  );
}

// ── Records ──
function Records({ s, openPlayer }) {
  const rg = s.hist.records.game, rs = s.hist.records.season;
  const ms = milestones(s, careerOf);
  const lead = careerLeaders(s, careerOf);
  const fmtRec = (r) => (r.fmt === "rate" ? pct3(r.v) : r.fmt === "era" ? r.v.toFixed(2) : count(r.v));
  const gameRows = [["h"], ["hr"], ["rbi"], ["kP"], ["runs"], ["margin"], ["gate", money], ["att", count]].map(([k, f]) => [k, rg[k], f]).filter(([, r]) => r);
  return (
    <>
      <h2><span className="grow">Close to a milestone</span></h2>
      <div className="card card--m">
        <ul className="feed">
          {ms.length === 0 && <li className="dim">No milestones within reach yet.</li>}
          {ms.map((m) => (
            <li key={m.p.id + m.key} className="link" style={{ cursor: "pointer" }} onClick={() => openPlayer(m.p.id)}>
              <span className="grow"><b>{m.p.name}</b> needs <b>{m.left}</b> for {m.next} {m.label}<span className="sub">now {m.v}</span></span>
            </li>
          ))}
        </ul>
      </div>

      <h2>Single-game records</h2>
      <div className="card card--l table-wrap">
        <table>
          <tbody>
            {gameRows.length === 0 && <tr><td className="dim">Records start with the next game.</td></tr>}
            {gameRows.map(([k, r, f]) => (
              <tr key={k}><td>{r.label}<span className="sub">{r.name ? `${r.name} · ` : ""}year {r.y}, G{r.gi + 1} vs {r.opp}</span></td><td className="n"><b>{f ? f(r.v) : r.v}</b></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Season records</h2>
      <div className="card card--l table-wrap">
        <table>
          <tbody>
            {Object.keys(rs).length === 0 && <tr><td className="dim">Season records are set when a season ends.</td></tr>}
            {Object.values(rs).map((r) => <tr key={r.label}><td>{r.label}<span className="sub">{r.name} · year {r.y}</span></td><td className="n"><b>{fmtRec(r)}</b></td></tr>)}
          </tbody>
        </table>
      </div>

      <h2><span className="grow">Career leaders</span><small>current roster</small></h2>
      <div className="card card--m table-wrap">
        <table>
          <tbody>
            {lead.map(([l, x]) => (
              <tr key={l} className={x ? "link" : ""} onClick={x ? () => openPlayer(x.p.id) : undefined}>
                <td>{l}<span className="sub">{x ? x.p.name : "—"}</span></td><td className="n"><b>{x ? count(x.v) : ""}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2><span className="grow">Trophy case</span><small>{s.trophies} Pennant Cup{s.trophies === 1 ? "" : "s"}</small></h2>
      <div className="card card--m table-wrap">
        <table>
          <thead><tr><th>Year</th><th>Record</th><th>Finish</th><th>Champion</th></tr></thead>
          <tbody>
            {s.history.length === 0 && <tr><td colSpan={4} className="dim">Your first season is under way.</td></tr>}
            {[...s.history].reverse().map((h) => (
              <tr key={h.year} className={h.cup ? "me" : ""}><td className="n">{h.year}</td><td className="n">{h.playerRecord}</td><td className="n">{ordinal(h.finish)}</td><td>{h.champion}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function StatsView({ f, openPlayer }) {
  const { s } = f;
  const [sec, setSecRaw] = useState(() => { try { return sessionStorage.getItem(STATS_KEY) || "team"; } catch { return "team"; } });
  const setSec = (k) => { setSecRaw(k); try { sessionStorage.setItem(STATS_KEY, k); } catch { /* private mode */ } };
  const open = SECTIONS.filter(([, , u]) => !u || isOpen(s, u));
  const cur = open.some(([k]) => k === sec) ? sec : "team";
  const body = {
    team: <Team f={f} openPlayer={openPlayer} />, money: <MoneySection s={s} />, roi: <Roi s={s} />,
    players: <Players s={s} openPlayer={openPlayer} />, proj: <Projections s={s} />, records: <Records s={s} openPlayer={openPlayer} />,
  }[cur] || null;
  return (
    <>
      <h1>Stats</h1>
      <p className="lede">The {tn(s.city)} by the numbers{s.hist.n ? ` · ${count(s.hist.n)} games on record` : ""}.</p>
      <div className="stats-nav"><Chips label="Stats section" value={cur} set={setSec} items={open} /></div>
      {body}
    </>
  );
}
