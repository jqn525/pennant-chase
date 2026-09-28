// ── Pro Shop tab: a rotating shipment of procedurally generated gear ──
// New assortment every series; unbought stock vanishes. Tap an item, then
// pick who wears it.

import { useState } from "react";
import { RARITY } from "../game/constants.js";
import { fmt } from "../game/utils.js";
import Panel from "./Panel.jsx";
import { ClockIcon } from "./Icons.jsx";
import { GEAR, GEAR_ART, gearArtUrl } from "../game/gear.js";
import { portraitUrl } from "./portrait.js";
import { Button, Chip } from "./kit.jsx";
import "./ShopTab.css";

const TONE = { 1: "dim", 2: "amber", 3: "red" };

const Boosts = ({ boosts }) => (
  <>
    {Object.entries(boosts).map(([s, n]) => (
      <span key={s} className={n > 0 ? "pos-plus" : "pos-minus"}>{n > 0 ? "+" : "−"}{Math.abs(n)}% {s}</span>
    ))}
  </>
);

export default function ShopTab({ roster, money, shopItems, onBuy, restockNote, tierInfo }) {
  const [pickId, setPickId] = useState(null); // item awaiting a player

  return (
    <div>
      <Panel title="THE PRO SHOP" titleRight="This shipment only">
        <div className="shop-note"><ClockIcon size={14} /> {restockNote}</div>
        {tierInfo && <p className="ui-note"><b className="shop-tier">{tierInfo.label}</b> — {tierInfo.hint}</p>}
      </Panel>

      {(!shopItems || shopItems.length === 0) && (
        <Panel><p className="ui-note" style={{ margin: 0 }}>The shelves are bare — a new shipment arrives with the next series.</p></Panel>
      )}

      {(shopItems || []).map((item) => {
        const def = GEAR.find((d) => d.slot === item.slot);
        const open = pickId === item.id;
        const players = def.role === "bat" ? roster.batters : [roster.sp, roster.rp];
        const afford = money >= item.cost;
        return (
          <section key={item.id} className={`shop-item ${open ? "is-open" : ""} shop-item--r${item.rarity}`}>
            <button type="button" className="shop-item__head" onClick={() => setPickId(open ? null : item.id)} aria-expanded={open}>
              {GEAR_ART.has(item.slot) && (
                <img className={`ui-pixel-img ${item.rarity === 3 ? "gear-legendary" : ""}`} src={gearArtUrl(item)} alt="" width={48} height={48} />
              )}
              <span className="shop-item__body">
                <span className="shop-item__title">{item.name}</span>
                <span className="shop-item__meta">
                  <Chip tone={TONE[item.rarity]}>{RARITY[item.rarity].name}</Chip>
                  <span>{def.label}</span>
                </span>
                <span className="shop-item__boosts"><Boosts boosts={item.boosts} /></span>
                <span className="shop-item__flavor">{def.flavor}</span>
              </span>
              <span className={`shop-item__price ${afford ? "" : "pos-minus"}`}>${fmt(item.cost)}</span>
            </button>

            {open && (
              <div className="shop-item__pick">
                <div className="shop-item__ask">{afford ? "Who gets it?" : `Need $${fmt(item.cost - money)} more`}</div>
                {players.map((p) => {
                  const current = p.gear?.[item.slot];
                  return (
                    <div key={p.id} className="ui-row">
                      <img className="ui-pixel-img" src={portraitUrl(p)} alt="" width={36} height={36} />
                      <div className="ui-row__main">
                        <div className="ui-row__title">{p.pos} · {p.name}</div>
                        <div className="ui-row__meta">{current ? `Replaces ${current.name || "old gear"}` : "Empty slot"}</div>
                      </div>
                      <Button size="sm" variant="primary" disabled={!afford} onClick={() => onBuy(p.id, item.id)}>Buy</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
