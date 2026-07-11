// ── Player portraits: diverse pixel-art scenes assigned by position, stable per player ──

const PITCHER_TILES = [1, 2, 3, 4, 15, 21, 22, 23, 24, 25];
const CATCHER_TILES = [6, 17, 18, 19, 20];
const BATTER_TILES = [5, 7, 8, 9, 10, 11, 12, 13, 14, 16, 26, 27, 28, 29, 30, 31, 32, 33];

export const portraitUrl = (p) => {
  const set = p.pos === "C" ? CATCHER_TILES : p.role !== "bat" ? PITCHER_TILES : BATTER_TILES;
  const n = set[p.id % set.length];
  return `${import.meta.env.BASE_URL}portraits/p${n}.png`;
};
