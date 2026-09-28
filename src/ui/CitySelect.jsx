// ── The Franchise Creator: name your club, pick your edge, get a random roster ──

import { useState } from "react";
import { EDGES, CITY_POOL, NICKNAME_POOL } from "../game/constants.js";
import { globalCss } from "./styles.js";
import Panel from "./Panel.jsx";
import IdentityEditor from "./IdentityEditor.jsx";
import { Button } from "./kit.jsx";
import "./CitySelect.css";

const roll = (pool) => pool[(Math.random() * pool.length) | 0];

export default function CitySelect({ onPick, onRestore }) {
  const [club, setClub] = useState(() => ({ name: roll(CITY_POOL), nickname: roll(NICKNAME_POOL), logo: {} }));
  const tCity = club.name, nick = club.nickname;
  const [edge, setEdge] = useState(null);
  const [open, setOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [err, setErr] = useState(null);

  const named = tCity.trim().length > 0 && nick.trim().length > 0;
  const ready = named && edge != null;
  const start = () => {
    if (!ready) return;
    const e = EDGES[edge];
    onPick({ name: tCity.trim(), nickname: nick.trim(), logo: club.logo, bonus: e.bonus, label: `${e.title}: ${e.label}` });
  };

  return (
    <div className="franchise-create">
      <style>{globalCss}</style>
      <div className="franchise-create__content">
        <div className="franchise-create__pennant">PC</div>
        <h1 className="fc-title">PENNANT<span> CHASE</span></h1>
        <div className="fc-kicker">Found your franchise</div>

        <IdentityEditor value={club} onChange={setClub} />

        <Panel title="YOUR EDGE">
          <div className="fc-edges" role="radiogroup" aria-label="Club edge">
            {EDGES.map((e, i) => (
              <button key={e.bonus} type="button" role="radio" aria-checked={edge === i}
                className={`fc-edge ${edge === i ? "is-on" : ""}`} onClick={() => setEdge(i)}>
                <strong>{e.title}</strong>
                <span>{e.label}</span>
              </button>
            ))}
          </div>
        </Panel>

        <p className="fc-note">Your roster is drafted for you — random names, random talent. Seven rival clubs await.</p>

        <Button variant="primary" size="lg" block disabled={!ready} onClick={start}
          reason={!named ? "Name your club first" : "Pick an edge first"}>
          Start franchise
        </Button>

        <div className="fc-restore">
          <button type="button" className="fc-link" onClick={() => { setOpen((o) => !o); setErr(null); }}>
            Have a backup code from another device?
          </button>
          {open && (
            <div className="fc-restore__box">
              <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Paste your backup code here" />
              <div className="fc-restore__row">
                <Button size="sm" disabled={!pasted.trim()} onClick={() => setErr(onRestore(pasted))}>Restore franchise</Button>
                {err && <span className="pos-minus">{err}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
