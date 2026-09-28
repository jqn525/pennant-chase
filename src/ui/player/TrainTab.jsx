import { BAT_STATS, PIT_STATS } from "../../game/constants.js";
import { fmt } from "../../game/utils.js";
import { Section, Segmented, Button, Chip } from "../kit.jsx";
import SkillRow from "./SkillRow.jsx";

export default function TrainTab({ player, ceilOf, scale, quotePlan, buyN, setBuyN, money, trainCost, onTrainN, franchise }) {
  const keys = player.role === "bat" ? BAT_STATS : PIT_STATS;
  return (
    <>
      <Section title="TRAINING" right={`Bank $${fmt(money)}`}>
        <div className="train-mode">
          <span>Buy</span>
          <Segmented label="Points per tap" value={buyN} onChange={setBuyN}
            options={[[1, "+1"], [5, "+5"], [Infinity, "Max"]]} />
        </div>
        {keys.map((k) => {
          const pot = player.pot?.[k];
          const ceil = ceilOf(k);
          const peaked = pot != null && player[k] >= pot;
          const capped = !peaked && Number.isFinite(ceil) && player[k] >= ceil;
          let action;
          if (peaked) action = <Chip tone="dim" title="His natural ceiling — only gear goes higher">Peaked</Chip>;
          else if (capped) action = <Chip tone="dim" title="The league development cap — franchise players train past it">League cap</Chip>;
          else {
            const q = quotePlan([k], buyN);
            const one = trainCost(player, k);
            action = (
              <Button variant="primary" size="sm" block disabled={!q.count}
                reason={`Need $${fmt(one)}`} sub={`$${fmt(q.total)}`}
                onClick={() => onTrainN(player.id, k, buyN)} aria-label={`Train ${k}`}>
                +{q.count || 1}
              </Button>
            );
          }
          return <SkillRow key={k} player={player} k={k} ceil={ceil} scale={scale} action={action} />;
        })}
      </Section>

      {franchise && !player.franchise && (
        <Section title="FRANCHISE TAG" right={`${franchise.used} of ${franchise.max} used`}>
          <p className="ui-note" style={{ marginTop: 0, marginBottom: 10 }}>
            Ordinary players stop at the league cap of {franchise.cap}. A franchise tag lets him train all the way to his natural ceiling.
          </p>
          <Button block disabled={franchise.used >= franchise.max} reason="No tags left — win the Pennant Cup for another"
            onClick={() => franchise.onTag(player.id)}>
            Tag as franchise player
          </Button>
        </Section>
      )}
      {player.franchise && <p className="ui-note">Franchise player — trains past the league cap.</p>}
    </>
  );
}
