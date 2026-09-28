// ── Front Office tab: stadium and revenue upgrades, the club, trophy case ──
// (Season-by-season history lives in Settings › Lifetime.)

import { STADIUM, REVENUE } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import Panel from "./Panel.jsx";
import { FansIcon, TrophyIcon, CarIcon, SeatsIcon, ConcessionIcon, LightsIcon, ShirtIcon, TvIcon } from "./Icons.jsx";
import { Button, Chip } from "./kit.jsx";
import "./FrontOfficeTab.css";

const TRACK_ICONS = { parking: CarIcon, seats: SeatsIcon, conc: ConcessionIcon, lights: LightsIcon, merch: ShirtIcon, tv: TvIcon };

function UpgradeTrack({ track, level, money, fans, onBuy, lockedNote }) {
  const Icon = TRACK_ICONS[track.id];
  const cur = level > 0 ? track.tiers[level - 1] : null;
  const next = track.tiers[level];
  // Say exactly what's missing, most blocking first
  const why = !next ? null
    : lockedNote ? lockedNote
      : fans < next.fans ? `Need ${fmt(next.fans)} fans (have ${fmt(fans)})`
        : money < next.cost ? `Need $${fmt(next.cost - money)} more` : null;
  return (
    <div className="upgrade">
      <div className="upgrade__head">
        <Icon size={18} color="var(--amber)" />
        <span className="upgrade__title">{track.title}</span>
        <span className="upgrade__tiers" aria-label={`Level ${level} of ${track.tiers.length}`}>
          {track.tiers.map((_, i) => <i key={i} className={i < level ? "is-on" : ""} />)}
        </span>
      </div>
      <div className="upgrade__now">{cur ? <>Now: <b>{cur.name}</b> — {cur.label}</> : "Not built yet"}</div>
      {next ? (
        <Button block variant={why ? "secondary" : "primary"} disabled={!!why} reason={why}
          sub={`${next.label} · $${fmt(next.cost)}`} onClick={() => onBuy(track.id)}>
          Build {next.name}
        </Button>
      ) : (
        <Chip tone="amber">Fully built</Chip>
      )}
    </div>
  );
}

export default function FrontOfficeTab({ city, fans, money, merch, tv, trophies, stadium, onBuyUpgrade, onBuyRevenue }) {
  return (
    <div className="office">
      <div className="office__col">
        <Panel title="STADIUM">
          {STADIUM.map((track) => (
            <UpgradeTrack key={track.id} track={track} level={stadium?.[track.id] || 0}
              money={money} fans={fans} onBuy={onBuyUpgrade} />
          ))}
        </Panel>
        <Panel title="REVENUE">
          {REVENUE.map((track) => (
            <UpgradeTrack key={track.id} track={track} level={track.id === "merch" ? merch : tv}
              money={money} fans={fans} onBuy={onBuyRevenue}
              lockedNote={track.id === "tv" && merch < 1 ? "Open the merch stand first" : null} />
          ))}
        </Panel>
      </div>

      <div className="office__col">
        <Panel title="THE CLUB">
          <div className="office-club">
            <span><FansIcon size={16} /> <b>{fmt(fans)}</b> fans in {city.name}</span>
            <span>Club edge: <b>{city.label}</b></span>
          </div>
        </Panel>
        <Panel title="TROPHY CASE" titleRight={`${trophies} cup${trophies === 1 ? "" : "s"}`}>
          {trophies > 0 ? (
            <div className="office-trophies">
              {Array.from({ length: Math.min(trophies, 12) }, (_, i) => <TrophyIcon key={i} size={28} />)}
            </div>
          ) : (
            <p className="ui-note" style={{ margin: 0 }}>No Pennant Cups yet. Past seasons are in Settings › Lifetime.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
