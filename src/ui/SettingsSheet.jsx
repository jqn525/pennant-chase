// ── Settings: identity, sound, backup and restore, the rulebook, new franchise ──
import { useEffect, useState } from "react";
import { LOGO_STYLES, COLOR_SCHEMES, clubLogo, cleanInitials } from "../game/identity.js";
import { rename } from "../game/franchise.js";
import TeamLogo from "./TeamLogo.jsx";
import { Sheet } from "./Shell.jsx";

const toggleSound = (s) => { s.sound = !s.sound; };

export default function SettingsSheet({ f, onClose }) {
  const { s } = f;
  const logo = clubLogo(s.city);
  const [code, setCode] = useState("");
  const [paste, setPaste] = useState("");
  const [err, setErr] = useState(null);
  const [erase, setErase] = useState(false);
  // the armed Erase button disarms itself if not tapped again
  useEffect(() => { if (!erase) return undefined; const t = setTimeout(() => setErase(false), 4000); return () => clearTimeout(t); }, [erase]);
  const setLogo = (patch) => f.act(rename, { logo: { ...(s.city.logo || {}), ...patch } });

  return (
    <Sheet title="Club settings" onClose={onClose}>
      <h2>Identity</h2>
      <div className="card card--l panel--pad stack">
        <div className="row">
          <TeamLogo city={s.city} size={56} />
          <div className="grow"><b>{s.city.name} {s.city.nickname}</b><span className="sub">{s.city.label}</span></div>
        </div>
        <label className="field"><span>City</span>
          <input value={s.city.name} maxLength={24} onChange={(e) => f.act(rename, { name: e.target.value })} />
        </label>
        <label className="field"><span>Nickname</span>
          <input value={s.city.nickname} maxLength={24} onChange={(e) => f.act(rename, { nickname: e.target.value })} />
        </label>
        <label className="field"><span>Initials (up to 3)</span>
          <input value={s.city.logo?.text ?? ""} placeholder={logo.text} maxLength={3}
            onChange={(e) => setLogo({ text: cleanInitials(e.target.value) })} />
        </label>
        <label className="field"><span>Logo style</span>
          <select value={logo.style} onChange={(e) => setLogo({ style: e.target.value })}>
            {LOGO_STYLES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
        <label className="field"><span>Colors</span>
          <select value={logo.scheme} onChange={(e) => setLogo({ scheme: e.target.value })}>
            {COLOR_SCHEMES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
      </div>

      <h2>Sound</h2>
      <div className="card card--s panel--pad row">
        <div className="grow">Crowd and cash-register sounds</div>
        <button className="btn btn--sm btn--ghost" aria-pressed={!!s.sound} onClick={() => f.act(toggleSound)}>{s.sound ? "On" : "Off"}</button>
      </div>

      <h2>Backup</h2>
      <div className="card card--l panel--pad stack">
        <p className="note" style={{ margin: 0 }}>Your franchise saves in this browser. Copy a backup code to move it or keep it safe.</p>
        <div className="row">
          <button className="btn btn--sm" onClick={() => {
            const c = f.backupCode();
            setCode(c);
            navigator.clipboard?.writeText(c).catch(() => {});
          }}>Make backup code</button>
          {code && <span className="dim">Copied — also shown below.</span>}
        </div>
        {code && <textarea readOnly rows={3} value={code} onFocus={(e) => e.target.select()} aria-label="Backup code" />}
        <label className="field"><span>Restore from a code</span>
          <textarea rows={3} value={paste} onChange={(e) => { setPaste(e.target.value); setErr(null); }} placeholder="Paste a backup code" />
        </label>
        {err && <p className="alert" style={{ margin: 0 }}>{err}</p>}
        <button className="btn btn--sm btn--ghost" style={{ justifySelf: "start" }} disabled={!paste.trim()}
          onClick={() => { const e = f.restore(paste.trim()); setErr(e); if (!e) onClose(); }}>Restore (replaces this franchise)</button>
      </div>

      <h2>How the money works</h2>
      <div className="card card--l panel--pad">
        <ul className="feed" style={{ margin: 0 }}>
          <li><span className="grow"><b>Gate</b> — every game pays by attendance. Attendance can't exceed your seats; more fans than seats lets you charge more per ticket (up to +60%).</span></li>
          <li><span className="grow"><b>Construction</b> takes games. Each project is paid in installments, one per game, and stalls if you can't cover one. One project per area.</span></li>
          <li><span className="grow"><b>Fans</b> grow with wins until the region runs out of new ones (about 200,000), and drift away after losses. Wins come from ratings: training, gear and trades.</span></li>
          <li><span className="grow"><b>Merch and TV</b> pay every game, scaled by fans and how famous your players are (star power).</span></li>
          <li><span className="grow"><b>While you're away</b> fans keep buying: caps from the stand, jerseys from the team store, signed memorabilia from the flagship. Star power, winning and TV raise the odds; interest fades the longer you're gone.</span></li>
          <li><span className="grow"><b>Payroll</b> is due each season and rises with each player's overall. Over the cap, a luxury tax applies.</span></li>
          <li><span className="grow"><b>Playoffs</b> — the top four meet in semifinals; the Pennant Cup pays the most.</span></li>
          <li><span className="grow"><b>Payback</b> on the Spend tab is cost divided by extra dollars per game. Lower is better.</span></li>
        </ul>
      </div>

      <h2>New franchise</h2>
      <div className="card card--s panel--pad row">
        <div className="grow">Erase this club and start over. This can't be undone.</div>
        <button className={`btn btn--sm ${erase ? "btn--danger" : "btn--quiet"}`} onBlur={() => setErase(false)}
          onClick={() => (erase ? f.eraseAndRestart() : setErase(true))}>{erase ? "Erase for good" : "Erase"}</button>
      </div>
    </Sheet>
  );
}
