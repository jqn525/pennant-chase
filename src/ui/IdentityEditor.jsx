// ── Club identity editor: name, initials, logo style, colors ──
// Controlled: value = { name, nickname, logo: { text, style, scheme } }.
// Used by the franchise creator and Settings › Club identity.

import { CITY_POOL, NICKNAME_POOL } from "../game/constants.js";
import { LOGO_STYLES, COLOR_SCHEMES, monogram, cleanInitials, clubLogo } from "../game/identity.js";
import Panel from "./Panel.jsx";
import TeamLogo from "./TeamLogo.jsx";
import { DiceIcon } from "./Icons.jsx";
import "./IdentityEditor.css";

const roll = (pool) => pool[(Math.random() * pool.length) | 0];

function NameField({ label, value, onChange, onRoll, rollLabel }) {
  return (
    <label className="fc-field">
      <span>{label}</span>
      <span className="fc-field__row">
        <input value={value} maxLength={16} onChange={(e) => onChange(e.target.value)} />
        {onRoll && <button type="button" className="fc-dice" aria-label={rollLabel} onClick={onRoll}><DiceIcon size={20} /></button>}
      </span>
    </label>
  );
}

export default function IdentityEditor({ value, onChange }) {
  const { name, nickname } = value;
  const logo = value.logo || {};
  const set = (patch) => onChange({ ...value, ...patch });
  const setLogo = (patch) => set({ logo: { ...logo, ...patch } });
  const resolved = clubLogo(value);
  const auto = monogram(name, nickname);

  return (
    <>
      <Panel title="YOUR CLUB">
        <div className="id-preview">
          <TeamLogo logo={resolved} size={84} />
          <div className="id-preview__name">
            <small>{name.trim() || "City"}</small>
            <strong>{nickname.trim() || "Team name"}</strong>
          </div>
        </div>
        <NameField label="City" value={name} onChange={(v) => set({ name: v })}
          onRoll={() => set({ name: roll(CITY_POOL) })} rollLabel="random city" />
        <NameField label="Team name" value={nickname} onChange={(v) => set({ nickname: v })}
          onRoll={() => set({ nickname: roll(NICKNAME_POOL) })} rollLabel="random team name" />
        <label className="fc-field">
          <span>Logo initials <em>(1–3 letters, blank = {auto})</em></span>
          <span className="fc-field__row">
            <input value={logo.text || ""} placeholder={auto} maxLength={3} autoCapitalize="characters"
              onChange={(e) => setLogo({ text: cleanInitials(e.target.value) })} />
          </span>
        </label>
      </Panel>

      <Panel title="LOGO STYLE">
        <div className="id-styles" role="radiogroup" aria-label="Logo style">
          {LOGO_STYLES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={resolved.style === s.id}
              className={`id-style ${resolved.style === s.id ? "is-on" : ""}`} onClick={() => setLogo({ style: s.id })}>
              <TeamLogo logo={{ ...resolved, style: s.id }} size={64} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="CLUB COLORS">
        <div className="id-colors" role="radiogroup" aria-label="Club colors">
          {COLOR_SCHEMES.map(([id, label, a, b]) => (
            <button key={id} type="button" role="radio" aria-checked={resolved.scheme === id}
              className={`id-color ${resolved.scheme === id ? "is-on" : ""}`} onClick={() => setLogo({ scheme: id })}>
              <span className="id-color__chip"><i style={{ background: a }} /><i style={{ background: b }} /></span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <p className="ui-note">Your players wear these colors on the field.</p>
      </Panel>
    </>
  );
}
