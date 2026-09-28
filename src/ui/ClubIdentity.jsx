// ── Settings › Club identity: rename the club and restyle its logo ──
// A full-screen page (it opens from Settings, which is one too).

import { useState } from "react";
import useLockBody from "./useLockBody.js";
import IdentityEditor from "./IdentityEditor.jsx";
import { Button } from "./kit.jsx";

export default function ClubIdentity({ city, onSave, onClose }) {
  useLockBody();
  const [club, setClub] = useState(() => ({ name: city.name, nickname: city.nickname ?? "", logo: { ...(city.logo || {}) } }));
  const valid = club.name.trim() && club.nickname.trim();
  const save = () => {
    if (!valid) return;
    onSave({ name: club.name.trim(), nickname: club.nickname.trim(), logo: club.logo });
    onClose();
  };
  return (
    <div className="page-screen" role="dialog" aria-label="Club identity">
      <header className="page-screen__bar">
        <h2>Club identity</h2>
        <button onClick={onClose}>Cancel</button>
      </header>
      <div className="page-screen__body">
        <IdentityEditor value={club} onChange={setClub} />
        <div style={{ marginTop: 16 }}>
          <Button variant="primary" size="lg" block disabled={!valid} reason="Give the club a city and a name" onClick={save}>
            Save identity
          </Button>
        </div>
      </div>
    </div>
  );
}
