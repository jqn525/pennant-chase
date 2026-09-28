// ── The player screen: portrait header + five tabs ──
// OVERVIEW (ratings, trait, season line) · TRAIN · GEAR · CARD · TRADE.
// TRAIN and TRADE only for your own players. Props match the old card so
// App's openCard flow is unchanged.

import { useState } from "react";
import { PLAYER_TRAITS, BAT_STATS, PIT_STATS } from "../../game/constants.js";
import { fmt } from "../../game/utils.js";
import { ovr } from "../../game/gear.js";
import { CARD_TIERS, printedTier, nextPrint } from "../../game/cards.js";
import { salaryOf, payRank } from "../../game/salary.js";
import { Sheet, Segmented, Chip, Button } from "../kit.jsx";
import { StarIcon } from "../Icons.jsx";
import PixelPortrait from "../PixelPortrait.jsx";
import CardFace from "../CardFace.jsx";
import OverviewTab from "./OverviewTab.jsx";
import TrainTab from "./TrainTab.jsx";
import GearTab from "./GearTab.jsx";
import TradeTab from "./TradeTab.jsx";
import "./PlayerSheet.css";

let lastTab = "overview"; // remembered for the session

export default function PlayerSheet({ player, isOwn, onClose, money, league, stat, trainCost, trainCeil, onTrainN, onTrainAll, tradeQuote, onTrade, rivals, isStar, franchise, city, year, onPrintCard }) {
  const tabs = [["overview", "Info"], ...(isOwn ? [["train", "Train"]] : []), ["gear", "Gear"], ["card", "Card"], ...(isOwn && rivals ? [["trade", "Trade"]] : [])];
  const [tab, setTabState] = useState(() => (tabs.some(([t]) => t === lastTab) ? lastTab : "overview"));
  const setTab = (t) => { lastTab = t; setTabState(t); };
  const [buyN, setBuyN] = useState(1);

  const trait = PLAYER_TRAITS.find((t) => t.id === player.trait);
  const scale = league.statBase + 32;
  const ceilOf = (k) => (isOwn && trainCeil ? trainCeil(player, k) : player.pot?.[k] ?? Infinity);

  // Greedy plan: up to n points of the given keys, bounded by ceilings and
  // the bank (mirrors App's planTraining exactly).
  const quotePlan = (planKeys, n) => {
    const cur = {};
    planKeys.forEach((k) => { cur[k] = player[k]; });
    let total = 0, count = 0;
    while (count < n) {
      let best = null, bestCost = Infinity;
      for (const k of planKeys) {
        if (cur[k] >= ceilOf(k)) continue;
        const c = trainCost({ ...player, [k]: cur[k] }, k);
        if (c < bestCost) { best = k; bestCost = c; }
      }
      if (!best || total + bestCost > money) break;
      cur[best]++;
      total += bestCost;
      count++;
    }
    return { total, count };
  };
  const trainAll = isOwn && trainCost ? quotePlan(player.role === "bat" ? BAT_STATS : PIT_STATS, Infinity) : null;

  const tier = CARD_TIERS[printedTier(player)];
  const printReady = isOwn && !!nextPrint(player);

  const header = (
    <div className="player-head">
      <PixelPortrait p={player} className="player-head__portrait" alt="" />
      <div className="player-head__id">
        <div className="player-head__name">{player.name}</div>
        <div className="player-head__chips">
          <Chip tone="solid">{player.pos}</Chip>
          {isStar?.(player) && <span className="player-head__star"><StarIcon size={14} /></span>}
          {player.franchise && <Chip tone="amber">Franchise</Chip>}
          <Chip tone={tier.key}>{tier.name}</Chip>
          {trait && <Chip tone="dim">{trait.label}</Chip>}
        </div>
        <div className="player-head__pay">
          ${fmt(salaryOf(player))}/yr{rivals && <> · #{payRank(player, rivals)} {player.pos} by pay</>}
        </div>
      </div>
      <div className="player-head__ovr"><strong>{ovr(player).toFixed(0)}</strong><span>OVR</span></div>
    </div>
  );

  const footer = tab === "train" && trainAll ? (
    <Button variant="primary" block disabled={!trainAll.count} reason="Nothing left to train (or the bank is empty)"
      sub={trainAll.count ? `${trainAll.count} points · $${fmt(trainAll.total)} · bank $${fmt(money)}` : null}
      onClick={() => onTrainAll(player.id)}>
      Train all
    </Button>
  ) : null;

  return (
    <Sheet onClose={onClose} header={header} footer={footer}
      subhead={<Segmented label="Player sections" value={tab} onChange={setTab}
        options={tabs.map(([t, l]) => [t, t === "card" && printReady ? `${l} ★` : l])} />}>
      {tab === "overview" && <OverviewTab player={player} trait={trait} stat={stat} ceilOf={ceilOf} scale={scale} year={year} />}
      {tab === "train" && (
        <TrainTab player={player} ceilOf={ceilOf} scale={scale} quotePlan={quotePlan} buyN={buyN} setBuyN={setBuyN}
          money={money} trainCost={trainCost} onTrainN={onTrainN} franchise={franchise} />
      )}
      {tab === "gear" && <GearTab player={player} />}
      {tab === "card" && (
        <CardFace player={player} city={city} year={year} stat={stat} money={money} onPrint={onPrintCard} isOwn={isOwn} />
      )}
      {tab === "trade" && <TradeTab player={player} rivals={rivals} tradeQuote={tradeQuote} onTrade={onTrade} onClose={onClose} money={money} />}
    </Sheet>
  );
}
