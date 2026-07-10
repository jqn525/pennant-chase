// ── Player portraits: 16 pixel-art scenes assigned by position, stable per player ──

const PITCHER_TILES = [1, 2, 3, 4, 15];   // windups, deliveries, the high throw
const CATCHER_TILES = [6];                // the masked catcher
const BATTER_TILES = [5, 7, 8, 9, 10, 11, 12, 13, 14, 16]; // swings, grabs, slides, runners

export const portraitUrl = (p) => {
  const set = p.pos === "C" ? CATCHER_TILES : p.role !== "bat" ? PITCHER_TILES : BATTER_TILES;
  const n = set[p.id % set.length];
  return `${import.meta.env.BASE_URL}portraits/p${n}.png`;
};
