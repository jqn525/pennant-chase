import { GEAR, GEAR_ART, gearArtUrl } from "../../game/gear.js";
import { RARITY } from "../../game/constants.js";
import { Section, Chip } from "../kit.jsx";

const TONE = { 1: "dim", 2: "amber", 3: "red" };

export default function GearTab({ player }) {
  const slots = GEAR.filter((g) => (g.role === "bat") === (player.role === "bat"));
  return (
    <Section title="EQUIPMENT" right={`${slots.filter((g) => player.gear?.[g.slot]).length} of ${slots.length} slots`}>
      {slots.map((g) => {
        const item = player.gear?.[g.slot];
        return (
          <div key={g.slot} className={`ui-row gear-row ${item ? "" : "is-empty"}`}>
            {GEAR_ART.has(g.slot) && (
              <img className={`ui-pixel-img ${item?.rarity === 3 ? "gear-legendary" : ""}`} src={gearArtUrl(item || g.slot)}
                alt="" width={40} height={40} style={{ opacity: item ? 1 : 0.25 }} />
            )}
            <div className="ui-row__main">
              <div className="ui-row__meta" style={{ marginTop: 0 }}>{g.label}</div>
              {item ? (
                <>
                  <div className="ui-row__title">{item.name}</div>
                  <div className="ui-row__meta">
                    <Chip tone={TONE[item.rarity]}>{RARITY[item.rarity]?.name}</Chip>
                    {Object.entries(item.boosts).map(([st, n]) => (
                      <span key={st} className={n > 0 ? "pos-plus" : "pos-minus"}>{n > 0 ? "+" : "−"}{Math.abs(n)}% {st}</span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="ui-row__title gear-row__empty">Empty — check the Pro Shop</div>
              )}
            </div>
          </div>
        );
      })}
    </Section>
  );
}
