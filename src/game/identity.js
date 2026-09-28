// ── Club identity: initials, logo style, and colors ──
// Pure. Stored on the save as city.logo = { text, style, scheme }; older
// saves without it fall back to the defaults below.

export const LOGO_STYLES = [
  { id: "varsity", label: "Varsity" },
  { id: "script", label: "Script" },
  { id: "interlock", label: "Interlock" },
  { id: "shield", label: "Shield" },
  { id: "pennant", label: "Pennant" },
  { id: "pixel", label: "Arcade" },
];

// [id, label, primary, secondary]
export const COLOR_SCHEMES = [
  ["amber", "Amber & Pine", "#e9a431", "#1d4f30"],
  ["scarlet", "Scarlet & Navy", "#c6503f", "#1f2f52"],
  ["royal", "Royal & Cream", "#3f6fb5", "#f5edda"],
  ["gold", "Black & Gold", "#2a2723", "#e0b040"],
  ["teal", "Teal & Orange", "#2f9a8a", "#e07a3a"],
  ["purple", "Purple & Gold", "#6b4c9a", "#e0b040"],
  ["maroon", "Maroon & Cream", "#7a2a34", "#f5edda"],
  ["kelly", "Kelly & White", "#3a9a4a", "#f5edda"],
];

// "Vancouver" + "Suns" -> "VS"
export const monogram = (name = "", nickname = "") =>
  ((name.trim()[0] ?? "") + (nickname.trim()[0] ?? "")).toUpperCase() || "PC";

// Letters and digits only, up to 3
export const cleanInitials = (s = "") => s.toUpperCase().replace(/[^A-Z0-9&]/g, "").slice(0, 3);

export function clubLogo(city) {
  const l = city?.logo || {};
  const scheme = COLOR_SCHEMES.find((s) => s[0] === l.scheme) || COLOR_SCHEMES[0];
  return {
    text: cleanInitials(l.text || "") || monogram(city?.name, city?.nickname),
    style: LOGO_STYLES.some((s) => s.id === l.style) ? l.style : "varsity",
    scheme: scheme[0],
    primary: scheme[2],
    secondary: scheme[3],
  };
}

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const luminance = (c) => {
  const [r, g, b] = hex(c).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const darken = (c, k = 0.65) =>
  `#${hex(c).map((v) => Math.round(v * k).toString(16).padStart(2, "0")).join("")}`;
// Readable ink on top of a color
export const inkOn = (c) => (luminance(c) > 0.55 ? "#12301f" : "#f5edda");

// [main, dark] pair for the ballpark sprites' team slots
export const uniformColors = (city) => {
  const { primary, secondary } = clubLogo(city);
  // a near-black primary reads as a void on the field; lead with the accent
  const main = luminance(primary) < 0.2 ? secondary : primary;
  return [main, darken(main)];
};
