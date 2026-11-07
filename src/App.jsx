// ── PENNANT CHASE ── a baseball front office
// The game plays itself; you run the money. All state and rules live in
// src/game (franchise.js, advisor.js); this file only picks the screen.

import useFranchise from "./state/useFranchise.js";
import Founding from "./ui/Founding.jsx";
import Shell from "./ui/Shell.jsx";

export default function App() {
  const f = useFranchise();
  if (!f.s.city) return <Founding f={f} />;
  return <Shell f={f} />;
}
