import { useState } from "react";
import { PLAYER_TRAITS } from "../../game/constants.js";
import { fmt } from "../../game/utils.js";
import { ovr } from "../../game/gear.js";
import { salaryOf } from "../../game/salary.js";
import { portraitUrl } from "../portrait.js";
import { Section, Button } from "../kit.jsx";

export default function TradeTab({ player, rivals, tradeQuote, onTrade, onClose, money }) {
  const [armed, setArmed] = useState(null);
  if (player.pos === "RP") {
    return <Section title="TRADE DESK"><p className="ui-note">Rival clubs don't carry relievers — there's no market for him.</p></Section>;
  }
  return (
    <Section title="TRADE DESK" right="Straight swap, same position">
      {rivals.map((team, i) => {
        const q = tradeQuote(player, i);
        if (!q) return null;
        const t = PLAYER_TRAITS.find((x) => x.id === q.them.trait);
        const pay = q.cash > 0;
        const afford = !pay || money >= q.cash;
        const isArmed = armed === i;
        return (
          <div key={team.name} className="ui-row trade-row">
            <img className="ui-pixel-img" src={portraitUrl(q.them)} alt="" width={44} height={44} />
            <div className="ui-row__main">
              <div className="ui-row__title">{q.them.name}</div>
              <div className="ui-row__meta">
                <span>{team.name}</span>
                <span>OVR {ovr(q.them).toFixed(0)}</span>
                <span>${fmt(salaryOf(q.them))}/yr</span>
                {t && <span>{t.label}</span>}
              </div>
              <div className={`trade-row__cash ${pay ? "pos-minus" : "pos-plus"}`}>
                {pay ? `You pay $${fmt(q.cash)}` : q.cash < 0 ? `You get $${fmt(-q.cash)}` : "Even swap"}
              </div>
            </div>
            <Button size="sm" variant={isArmed ? "danger" : "secondary"} disabled={!afford} reason={`Need $${fmt(q.cash)}`}
              onClick={() => (isArmed ? (onTrade(player.id, i), setArmed(null), onClose()) : setArmed(i))}
              onBlur={() => setArmed(null)}>
              {isArmed ? "Confirm" : "Trade"}
            </Button>
          </div>
        );
      })}
    </Section>
  );
}
