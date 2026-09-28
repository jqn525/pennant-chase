// ── Draft Day: the winter rookie class, in its own sheet ──
// The league waits while the board is open.

import { PLAYER_TRAITS, BAT_STATS, PIT_STATS } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import { portraitUrl } from "./portrait.js";
import { salaryOf } from "../game/salary.js";
import { Sheet, Button, Chip } from "./kit.jsx";
import "./DraftBoard.css";

const ABBR = { contact: "CON", power: "POW", eye: "EYE", speed: "SPD", defense: "DEF", stuff: "STU", control: "CTL", stamina: "STA" };

export default function DraftBoard({ draftClass, roster, money, year, onSign, onClose, onView }) {
  const releasedFor = (rook) => {
    if (rook.pos === "SP") return roster.sp;
    if (rook.pos === "RP") return roster.rp;
    return roster.batters.find((b) => b.pos === rook.pos);
  };

  return (
    <Sheet title={`DRAFT DAY · YEAR ${year}`} onClose={onClose}
      footer={<Button variant="primary" size="lg" block onClick={onClose}>Close the board — play ball</Button>}>
      <p className="ui-note" style={{ marginTop: 0 }}>
        Raw kids, big ceilings. Signing one releases your current player at that position, and the rookie inherits his gear.
        The season waits until you close the board.
      </p>

      {draftClass.map((rook) => {
        const keys = rook.pos === "SP" || rook.pos === "RP" ? PIT_STATS : BAT_STATS;
        const trait = PLAYER_TRAITS.find((t) => t.id === rook.trait);
        const out = releasedFor(rook);
        const afford = money >= rook.signCost;
        return (
          <section key={rook.id} className="rookie">
            <button type="button" className="rookie__who" onClick={() => onView?.(rook)}>
              <img className="ui-pixel-img" src={portraitUrl(rook)} alt="" width={44} height={44} />
              <span className="rookie__id">
                <span className="rookie__name"><b>{rook.pos}</b> {rook.name}</span>
                <span className="rookie__meta">
                  {trait && <Chip tone="amber">{trait.label}</Chip>}
                  <span>${fmt(salaryOf(rook))}/yr</span>
                </span>
              </span>
            </button>
            <div className="rookie__stats">
              {keys.map((k) => (
                <span key={k}><small>{ABBR[k]}</small><b>{rook[k]}</b><i>→ {rook.pot[k]}</i></span>
              ))}
            </div>
            <div className="rookie__foot">
              <span className="rookie__out">Releases <b>{out?.name}</b>{out?.gear && Object.keys(out.gear).length ? " (gear stays)" : ""}</span>
              <Button variant="primary" size="sm" disabled={!afford} reason={`Need $${fmt(rook.signCost - money)} more`}
                sub={`$${fmt(rook.signCost)}`} onClick={() => onSign(rook.id)}>
                Sign
              </Button>
            </div>
          </section>
        );
      })}
    </Sheet>
  );
}
