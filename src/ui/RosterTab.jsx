// ── Roster tab: team ratings, batting order, season stat tables ──
// Tap any player for his sheet.

import { PLAYER_TRAITS, BAT_STATS, SALARY } from "../game/constants.js";
import Panel from "./Panel.jsx";
import { StarIcon } from "./Icons.jsx";
import StatTable from "./StatTable.jsx";
import { ovr, eff } from "../game/gear.js";
import { portraitUrl } from "./portrait.js";
import { teamPayroll, salaryOf } from "../game/salary.js";
import { CARD_TIERS, printedTier, nextPrint } from "../game/cards.js";
import { LOADOUTS } from "../game/lineup.js";
import { fmt } from "../game/utils.js";
import { avg, obp, slg, ops, ip, era } from "../game/statline.js";
import { Chip, Segmented } from "./kit.jsx";
import "./RosterTab.css";

const STAT_ABBR = { contact: "CON", power: "POW", eye: "EYE", speed: "SPD", defense: "DEF", stuff: "STU", control: "CTL", stamina: "STA" };

// Team average of effective ratings (gear + trait included) per category.
// Best category glows amber, weakest sits dim — where to train next.
function TeamRatings({ roster }) {
  const groups = [
    { label: "Batting", players: roster.batters, keys: BAT_STATS },
    { label: "Pitching", players: [roster.sp, roster.rp], keys: ["stuff", "control", "stamina"] },
  ];
  const payroll = teamPayroll(roster);
  const over = payroll > SALARY.cap;
  const near = !over && payroll > SALARY.cap * 0.8;
  return (
    <Panel title="TEAM RATINGS">
      <div className="team-pay">
        <span>Payroll</span>
        <strong className={over ? "pos-minus" : near ? "is-near" : ""}>${fmt(payroll)}</strong>
        <small>of ${fmt(SALARY.cap)} cap</small>
        {over && <Chip tone="red">Luxury tax due in winter</Chip>}
      </div>
      {groups.map(({ label, players, keys }) => {
        const avgs = keys.map((k) => Math.round(players.reduce((n, p) => n + eff(p)[k], 0) / players.length));
        const hi = Math.max(...avgs), lo = Math.min(...avgs);
        return (
          <div key={label} className="team-ratings">
            <span className="team-ratings__label">{label}</span>
            <div className="team-ratings__cells" style={{ "--n": keys.length }}>
              {keys.map((k, i) => (
                <div key={k} className={avgs[i] === hi ? "is-hi" : avgs[i] === lo ? "is-lo" : ""}>
                  <span>{STAT_ABBR[k]}</span><strong>{avgs[i]}</strong>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </Panel>
  );
}

function PlayerRow({ p, order, s, isStar, onOpen, onMove }) {
  const trait = PLAYER_TRAITS.find((t) => t.id === p.trait);
  const tier = CARD_TIERS[printedTier(p)];
  return (
    <div className="roster-row">
      <button type="button" className="roster-row__main" onClick={() => onOpen(p)}>
        {order != null && <span className="roster-row__order">{order}</span>}
        <img className="ui-pixel-img roster-row__face" src={portraitUrl(p)} alt="" width={40} height={40} />
        <span className="roster-row__body">
          <span className="roster-row__top">
            <span className="roster-row__pos">{p.pos}</span>
            <span className="roster-row__name">{p.name}</span>
            {isStar(p) && <StarIcon size={13} />}
            <span className="roster-row__ovr">{ovr(p).toFixed(0)}</span>
          </span>
          <span className="roster-row__line">
            {p.role === "bat" ? `${avg(s)} · ${s.hr} HR · ${s.rbi} RBI` : `${era(s)} ERA · ${s.kP} K · ${ip(s)} IP`}
            <span className="roster-row__pay">${fmt(salaryOf(p))}/yr</span>
          </span>
          <span className="roster-row__chips">
            {trait && <Chip tone="amber">{trait.label}</Chip>}
            {p.franchise && <Chip tone="solid">Franchise</Chip>}
            {tier.key !== "common" && <Chip tone={tier.key}>{tier.name}</Chip>}
            {nextPrint(p) && <Chip tone="green">New card ready</Chip>}
          </span>
        </span>
      </button>
      {order != null && (
        <span className="roster-row__move">
          <button type="button" aria-label={`Move ${p.name} up`} onClick={() => onMove(p.id, -1)}>▲</button>
          <button type="button" aria-label={`Move ${p.name} down`} onClick={() => onMove(p.id, 1)}>▼</button>
        </span>
      )}
    </div>
  );
}

export default function RosterTab({ roster, stat, isStar, onMoveBatter, loadout, onChooseLoadout, onOpenCard }) {
  return (
    <div>
      <TeamRatings roster={roster} />
      <Panel title="BATTING ORDER">
        <Segmented wrap label="Lineup philosophy" value={loadout} onChange={onChooseLoadout}
          options={LOADOUTS.map((l) => [l.id, l.name])} />
        <p className="ui-note roster-blurb">
          {loadout ? LOADOUTS.find((l) => l.id === loadout)?.blurb : "Custom order — set it with the arrows, or pick a philosophy."}
        </p>
        {roster.batters.map((p, i) => (
          <PlayerRow key={p.id} p={p} order={i + 1} s={stat(p.id)} isStar={isStar} onOpen={onOpenCard} onMove={onMoveBatter} />
        ))}
        <div className="roster-sub">Pitchers</div>
        {[roster.sp, roster.rp].map((p) => (
          <PlayerRow key={p.id} p={p} s={stat(p.id)} isStar={isStar} onOpen={onOpenCard} />
        ))}
      </Panel>

      <StatTable
        title="BATTING" titleRight="Season"
        cols={["AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "K", "AVG", "OBP", "SLG", "OPS"]}
        onRow={onOpenCard}
        rows={roster.batters.map((p) => {
          const s = stat(p.id);
          return { p, cells: [s.ab, s.r, s.h, s.d, s.t, s.hr, s.rbi, s.bb, s.k, avg(s), obp(s), slg(s), ops(s)] };
        })}
      />
      <StatTable
        title="PITCHING" titleRight="Season"
        cols={["IP", "H", "R", "BB", "K", "ERA"]}
        onRow={onOpenCard}
        rows={[roster.sp, roster.rp].map((p) => {
          const s = stat(p.id);
          return { p, cells: [ip(s), s.hP, s.raP, s.bbP, s.kP, era(s)] };
        })}
      />
    </div>
  );
}
