// One skill: label, value, gear bonus, ceiling, bar — plus an optional action
import { STAT_INFO } from "../../game/constants.js";
import { gearBonus } from "../../game/gear.js";
import SkillBar from "./SkillBar.jsx";

export default function SkillRow({ player, k, ceil, scale, action }) {
  const base = player[k];
  const bonus = gearBonus(player, k);
  return (
    <div className="skill-row" title={STAT_INFO[k]}>
      <div className="skill-row__main">
        <div className="skill-row__top">
          <span className="skill-row__label">{k}</span>
          <strong key={base} className="skill-row__value">{base}</strong>
          {bonus !== 0 && <span className={`skill-row__bonus ${bonus > 0 ? "pos-plus" : "pos-minus"}`}>{bonus > 0 ? "+" : ""}{bonus} gear</span>}
          {Number.isFinite(ceil) && <span className="skill-row__ceil">max {ceil}</span>}
        </div>
        <SkillBar base={base} bonus={bonus} ceil={ceil} scale={scale} />
      </div>
      {action && <div className="skill-row__action">{action}</div>}
    </div>
  );
}
