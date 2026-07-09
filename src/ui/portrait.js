// ── Player portraits: 16 pixel-art scenes assigned by position, stable per player ──

const PITCHER_TILES = [1, 5, 9, 13, 15]; // windups and deliveries
const CATCHER_TILES = [3, 7, 11];        // masked and crouched
const BATTER_TILES = [2, 4, 6, 8, 10, 12, 14, 16]; // swings, dives, slides, scoops

export const portraitUrl = (p) => {
  const set = p.pos === "C" ? CATCHER_TILES : p.role !== "bat" ? PITCHER_TILES : BATTER_TILES;
  const n = set[p.id % set.length];
  return `${import.meta.env.BASE_URL}portraits/p${n}.png`;
};
