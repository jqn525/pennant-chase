// ── The club logo: the initials drawn in one of six styles ──
// Pure SVG (100×100 box) using the game's own fonts; textLength keeps any
// 1–3 letters inside the badge.

import { clubLogo, inkOn, darken } from "../game/identity.js";

const SLAB = "'Alfa Slab One', serif";
const COND = "'Barlow Condensed', 'Arial Narrow', sans-serif";
const PIX = "'Press Start 2P', monospace";

// Fit width per letter count
const fit = (text, one, per) => Math.min(one * 1.4, per * text.length + (text.length === 1 ? one - per : 0));

function Letters({ text, x = 50, y = 50, size, width, font, fill, stroke, strokeWidth = 0, italic, shadow }) {
  const common = {
    x, y, textAnchor: "middle", dominantBaseline: "central", fontFamily: font, fontSize: size,
    textLength: width, lengthAdjust: "spacingAndGlyphs", fontStyle: italic ? "italic" : undefined,
  };
  return (
    <>
      {shadow && <text {...common} x={x + 3} y={y + 3} fill={shadow}>{text}</text>}
      <text {...common} fill={fill} stroke={stroke} strokeWidth={strokeWidth} paintOrder="stroke" strokeLinejoin="round">{text}</text>
    </>
  );
}

function Art({ style, text, primary, secondary }) {
  const ink = inkOn(primary);
  const deep = darken(primary, 0.55);
  switch (style) {
    case "script":
      return (
        <>
          <rect x="4" y="4" width="92" height="92" rx="18" fill="#0d2418" stroke={primary} strokeWidth="4" />
          <g transform="skewX(-12) translate(10 0)">
            <Letters text={text} y={45} size={text.length > 2 ? 44 : 60} width={fit(text, 40, 30)} font={COND}
              fill={primary} stroke={deep} strokeWidth={3} italic />
          </g>
          <path d="M16 74 C 34 64, 62 88, 86 66" fill="none" stroke={secondary} strokeWidth="6" strokeLinecap="round" />
        </>
      );
    case "interlock": {
      const letters = [...text];
      const step = letters.length > 2 ? 20 : 24;
      const x0 = 50 - (step * (letters.length - 1)) / 2;
      return (
        <>
          <circle cx="50" cy="50" r="46" fill="#0d2418" />
          {letters.map((ch, i) => (
            <Letters key={i} text={ch} x={x0 + i * step} y={i % 2 ? 56 : 46} size={letters.length > 2 ? 46 : 58}
              font={SLAB} fill={i % 2 ? secondary : primary} stroke="#0d2418" strokeWidth={5} />
          ))}
        </>
      );
    }
    case "shield":
      return (
        <>
          <path d="M50 4 L92 16 V48 C92 72 72 88 50 96 C28 88 8 72 8 48 V16 Z" fill={secondary} />
          <path d="M50 12 L84 22 V48 C84 68 68 81 50 88 C32 81 16 68 16 48 V22 Z" fill={primary} />
          <Letters text={text} y={50} size={text.length > 2 ? 26 : 34} width={fit(text, 30, 23)} font={SLAB} fill={ink} />
        </>
      );
    case "pennant":
      return (
        <>
          <rect x="8" y="8" width="6" height="86" rx="2" fill={darken(secondary, 0.8)} />
          <path d="M14 14 L94 40 L14 66 Z" fill={primary} stroke={secondary} strokeWidth="3" strokeLinejoin="round" />
          <Letters text={text} x={42} y={40} size={text.length > 2 ? 20 : 26} width={fit(text, 22, 16)} font={SLAB} fill={ink} />
        </>
      );
    case "pixel":
      return (
        <>
          <path d="M12 4 H88 V12 H96 V88 H88 V96 H12 V88 H4 V12 H12 Z" fill={secondary} />
          <path d="M16 12 H84 V16 H88 V84 H84 V88 H16 V84 H12 V16 H16 Z" fill={primary} />
          <Letters text={text} y={52} size={text.length > 2 ? 18 : 24} width={fit(text, 26, 22)} font={PIX} fill={ink}
            shadow={deep} />
        </>
      );
    case "varsity":
    default:
      return (
        <>
          <circle cx="50" cy="50" r="46" fill={primary} />
          <circle cx="50" cy="50" r="39" fill="none" stroke={secondary} strokeWidth="4" />
          <Letters text={text} y={50} size={text.length > 2 ? 30 : 40} width={fit(text, 34, 27)} font={SLAB}
            fill={inkOn(primary) === "#f5edda" ? "#f5edda" : secondary} stroke={deep} strokeWidth={2} shadow={deep} />
        </>
      );
  }
}

// Pass a city (uses its saved identity) or an explicit logo override
export default function TeamLogo({ city, logo, size = 48, className, title }) {
  const l = logo || clubLogo(city);
  return (
    <svg className={`team-logo ${className || ""}`} width={size} height={size} viewBox="0 0 100 100" role="img"
      aria-label={title || `${l.text} logo`}>
      <Art {...l} />
    </svg>
  );
}
