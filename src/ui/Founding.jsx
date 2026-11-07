// ── Founding: name the club, pick an edge, open the books ──
import { useState } from "react";
import { CITY_POOL, NICKNAME_POOL, EDGES } from "../game/constants.js";
import { found } from "../game/franchise.js";
import TeamLogo from "./TeamLogo.jsx";

const pick = (a) => a[Math.floor(Math.random() * a.length)];

export default function Founding({ f }) {
  const [name, setName] = useState(() => pick(CITY_POOL));
  const [nickname, setNickname] = useState(() => pick(NICKNAME_POOL));
  const [edge, setEdge] = useState(EDGES[0].bonus);
  const e = EDGES.find((x) => x.bonus === edge);
  const ok = name.trim() && nickname.trim();
  const city = { name: name.trim(), nickname: nickname.trim(), bonus: e.bonus, label: e.label, logo: {} };

  return (
    <main className="view" style={{ maxWidth: 520 }}>
      <h1>Found a club</h1>
      <p className="lede">You run the front office. Games play themselves; your job is to turn money into wins and wins into more money.</p>

      <div className="panel panel--pad stack" style={{ marginTop: 12 }}>
        <div className="row">
          <TeamLogo city={city} size={56} />
          <div className="grow"><b>{city.name || "—"} {city.nickname}</b><span className="sub">{e.label}</span></div>
        </div>
        <label className="field"><span>City</span>
          <div className="row">
            <input className="grow" value={name} maxLength={24} onChange={(ev) => setName(ev.target.value)} />
            <button className="btn btn--sm btn--quiet" aria-label="Random city" onClick={() => setName(pick(CITY_POOL))}>Random</button>
          </div>
        </label>
        <label className="field"><span>Nickname</span>
          <div className="row">
            <input className="grow" value={nickname} maxLength={24} onChange={(ev) => setNickname(ev.target.value)} />
            <button className="btn btn--sm btn--quiet" aria-label="Random nickname" onClick={() => setNickname(pick(NICKNAME_POOL))}>Random</button>
          </div>
        </label>
      </div>

      <h2>Club edge</h2>
      <div className="panel">
        <ul className="feed" role="radiogroup" aria-label="Club edge">
          {EDGES.map((x) => (
            <li key={x.bonus}>
              <label className="row grow" style={{ cursor: "pointer" }}>
                <input type="radio" name="edge" checked={edge === x.bonus} onChange={() => setEdge(x.bonus)} />
                <span className="grow"><b>{x.title.charAt(0) + x.title.slice(1).toLowerCase()}</b><span className="sub">{x.label}</span></span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <button className="btn btn--block" style={{ marginTop: 16 }} disabled={!ok} onClick={() => f.act(found, city)}>
        Open the books
      </button>
    </main>
  );
}
