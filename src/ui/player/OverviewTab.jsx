import { BAT_STATS, PIT_STATS } from "../../game/constants.js";
import { statLine } from "../../game/statline.js";
import { Section, StatGrid, Chip } from "../kit.jsx";
import SkillRow from "./SkillRow.jsx";

const sprayOf = (pull) => Math.abs(pull) < 0.15 ? "Sprays it to all fields"
  : pull < 0 ? `Pull hitter — ${(Math.abs(pull) * 100).toFixed(0)}% to left` : `Goes the other way — ${(pull * 100).toFixed(0)}% to right`;

export default function OverviewTab({ player, trait, stat, ceilOf, scale, year }) {
  const isBat = player.role === "bat";
  const s = stat ? stat(player.id) : null;
  const line = statLine(s, isBat);
  const effects = trait ? Object.entries(trait.mods || trait.sit || {}) : [];
  return (
    <>
      <Section title="RATINGS" right="0–99 scale">
        {(isBat ? BAT_STATS : PIT_STATS).map((k) => (
          <SkillRow key={k} player={player} k={k} ceil={ceilOf(k)} scale={scale} />
        ))}
        <p className="ui-note"><span className="pos-plus">Green</span> is his gear boost. The tick marks where training stops.</p>
      </Section>

      {trait && (
        <Section title="TRAIT">
          <div className="trait-line">
            <Chip tone="amber">{trait.label}</Chip>
            {effects.map(([st, n]) => (
              <span key={st} className={n > 0 ? "pos-plus" : "pos-minus"}>{n > 0 ? "+" : "−"}{Math.abs(n)}% {st}</span>
            ))}
            {trait.sit && <span className="trait-line__when">with runners on</span>}
          </div>
        </Section>
      )}

      {line.length > 0 && (
        <Section title={`${year ? `YEAR ${year} ` : ""}STATS`}>
          <StatGrid items={line} cols={isBat ? 5 : 3} />
          {isBat && player.pull != null && <p className="ui-note">{sprayOf(player.pull)}</p>}
        </Section>
      )}
    </>
  );
}
