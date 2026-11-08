// ── Season: the race, the results, and the club's history ──
import { LEAGUE } from "../game/constants.js";
import { seedOrder, teamRating, gamesBehind } from "../game/season.js";
import { tn, seriesNow } from "../game/franchise.js";
import { money, count, ordinal } from "./fmt.js";
import BoxScore from "./BoxScore.jsx";

export default function SeasonView({ f, openPlayer }) {
  const { s } = f;
  const names = [tn(s.city), ...s.rivals.map((r) => r.name)];
  const ratings = [teamRating(s.roster), ...s.rivals.map(teamRating)];
  const order = seedOrder(s.standings, ratings);
  const leader = s.standings[order[0]];
  const sr = seriesNow(s);
  const left = LEAGUE.seasonGames - s.gameIndex;
  const cut = s.standings[order[LEAGUE.playoffTeams - 1]];
  const { w, l } = s.standings[0];
  const pace = w + l ? Math.round((w / (w + l)) * LEAGUE.seasonGames) : null;
  const p = s.playoffs;
  const thisYear = s.results.filter((r) => r.year === s.year);

  return (
    <>
      <h2>Year {s.year}</h2>
      <p className="lede" style={{ marginTop: 0 }}>
        {s.phase === "regular" && <>{left} games left{sr ? ` · this series ${sr.w}–${sr.l}, ${sr.gamesLeft} to play vs ${s.rivals[s.schedule[s.gameIndex].opp - 1].name}` : ""}{pace != null ? ` · on pace for ${pace} wins` : ""}</>}
        {s.phase === "playoffs" && p && <>{p.round === "final" ? "Pennant Cup final" : "Semifinal"} vs the {s.rivals[p.opp - 1].name}: {p.wins.us}–{p.wins.them} (first to {p.round === "final" ? 4 : 3})</>}
        {s.phase === "draft" && <>Winter. The season waits until you close the draft board.</>}
      </p>

      <h2><span className="grow">Standings</span><small>top {LEAGUE.playoffTeams} make the playoffs</small></h2>
      <div className="card card--l table-wrap">
        <table>
          <thead><tr><th>Club</th><th>W</th><th>L</th><th>GB</th>{s.phase === "regular" && <th>Line</th>}</tr></thead>
          <tbody>
            {order.map((i, rank) => {
              const t = s.standings[i];
              return (
                <tr key={i} className={`${i === 0 ? "me" : ""} ${rank === LEAGUE.playoffTeams - 1 ? "cut" : ""}`}>
                  <td>{rank + 1}. {names[i]}</td>
                  <td className="n">{t.w}</td>
                  <td className="n">{t.l}</td>
                  <td className="n">{rank === 0 ? "—" : gamesBehind(leader, t).toFixed(1)}</td>
                  {s.phase === "regular" && <td className="n">{i === 0 ? "" : gamesBehind(t, s.standings[0]) > 0 ? `+${gamesBehind(t, s.standings[0]).toFixed(1)}` : ""}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {s.phase === "regular" && <p className="note">Playoff line: {cut.w}–{cut.l}. You are {ordinal(order.indexOf(0) + 1)}.</p>}

      <h2>Last game</h2>
      <BoxScore s={s} openPlayer={openPlayer} />

      <h2><span className="grow">Results</span><small>{thisYear.length ? `${thisYear.filter((r) => r.won).length}–${thisYear.filter((r) => !r.won).length} this year` : ""}</small></h2>
      <div className="card card--l">
        <ul className="feed">
          {s.results.length === 0 && <li className="dim">No games played yet. Choose a pace to start the season.</li>}
          {s.results.slice(0, 15).map((r, i) => (
            <li key={i}>
              <span className={`wl ${r.won ? "up" : "down"}`}>{r.won ? "W" : "L"}</span>
              <span className="grow">{r.us}–{r.them} {r.home ? "vs" : "at"} {r.opp}{r.playoff ? ` · ${r.playoff === "CUP" ? "final" : "semi"}` : ""}<span className="sub">{count(r.gate)} attended{r.fans ? ` · +${count(r.fans)} fans` : ""}</span></span>
              <span className={`num ${r.net >= 0 ? "up" : "down"}`}>{money(r.net, { sign: true })}</span>
            </li>
          ))}
        </ul>
      </div>

      <h2>Club news</h2>
      <div className="card card--m">
        <ul className="feed">
          {s.log.filter((e) => e.kind !== "play").slice(0, 10).map((e) => <li key={e.id}><span className="grow">{e.text}</span></li>)}
        </ul>
      </div>

      {s.history.length > 0 && (
        <>
          <h2><span className="grow">History</span><small>{s.trophies} Pennant Cup{s.trophies === 1 ? "" : "s"}</small></h2>
          <div className="card card--m table-wrap"><table>
            <thead><tr><th>Year</th><th>Record</th><th>Finish</th><th>Champion</th></tr></thead>
            <tbody>
              {[...s.history].reverse().map((h) => (
                <tr key={h.year} className={h.cup ? "me" : ""}>
                  <td className="n">{h.year}</td><td className="n">{h.playerRecord}</td><td className="n">{ordinal(h.finish)}</td><td>{h.champion}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </>
      )}
    </>
  );
}
