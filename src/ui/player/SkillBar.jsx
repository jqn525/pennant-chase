// Continuous skill bar: amber fill to the trained value, green extension for
// gear (red bite when gear costs him), a dirt tick where training stops.

const pct = (v, scale) => `${Math.min(100, Math.max(0, (v / scale) * 100))}%`;

export default function SkillBar({ base, bonus, ceil, scale }) {
  const eff = base + bonus;
  return (
    <span className="skill-bar">
      {bonus > 0 && <span className="skill-bar__gear" style={{ width: pct(eff, scale) }} />}
      <span className="skill-bar__fill" style={{ width: pct(bonus < 0 ? eff : base, scale) }} />
      {bonus < 0 && <span className="skill-bar__loss" style={{ left: pct(eff, scale), width: `calc(${pct(base, scale)} - ${pct(eff, scale)})` }} />}
      {Number.isFinite(ceil) && <span className="skill-bar__ceil" style={{ left: pct(ceil, scale) }} />}
    </span>
  );
}
