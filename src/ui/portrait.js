// ── Player portraits: 16 pixel-art scenes assigned by position, stable per player ──

const PITCHER_TILES = [1, 6, 9, 15, 16];  // windups and deliveries
const CATCHER_TILES = [7];                // the masked catcher
const BATTER_TILES = [2, 3, 4, 5, 8, 10, 11, 12, 13, 14]; // swings, grabs, slides

export const portraitUrl = (p) => {
  const set = p.pos === "C" ? CATCHER_TILES : p.role !== "bat" ? PITCHER_TILES : BATTER_TILES;
  const n = set[p.id % set.length];
  return `${import.meta.env.BASE_URL}portraits/p${n}.png`;
};
