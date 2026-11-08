// ── Away sales: while you're gone, fans keep buying ──
// Every fan has a small daily chance to buy each item the store carries.
// Instead of rolling for every fan, we draw how many buyers there were in one
// go (Poisson when it's a handful, normal when it's thousands): small clubs
// see real dice-roll swings, big clubs a steady stream. Pure.

// Item, price, base chance that one fan buys it on a given day, store level needed
export const CATALOG = [
  { id: "cap", name: "cap", plural: "caps", price: 20, chance: 0.005, store: 1, star: false },
  { id: "jersey", name: "jersey", plural: "jerseys", price: 100, chance: 0.0006, store: 2, star: true },
  { id: "memo", name: "signed item", plural: "signed items", price: 250, chance: 0.0001, store: 3, star: true },
];
export const STORE_SELLS = { 1: "sells caps", 2: "adds jerseys", 3: "adds signed memorabilia" };

// Interest fades while you're away: day 1 counts fully, day 2 half, day 3 a quarter...
// Effective selling days for `hours` away (tends to 2 days however long you're gone)
export const effectiveDays = (hours) => {
  const d = Math.max(0, hours) / 24;
  return (1 - Math.pow(0.5, d)) / Math.LN2;
};

// What raises the odds: star power (shirts and memorabilia), form, TV exposure, the city edge
export function oddsFor(item, { draw = 0, form = 0.5, tv = 0, merchCity = false }) {
  let p = item.chance * (0.8 + 0.4 * form) * (1 + 0.25 * tv) * (merchCity ? 1.3 : 1);
  if (item.star) p *= 1 + draw / 4;
  return p;
}

// Knuth's Poisson sampler for small means; normal approximation for big ones
function poisson(mean, rnd) {
  const L = Math.exp(-mean);
  let k = 0, p = 1;
  do { k++; p *= rnd(); } while (p > L);
  return k - 1;
}
function normal(rnd) {
  const u = Math.max(1e-12, rnd()), v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export function drawBuyers(mean, rnd = Math.random) {
  if (mean <= 0) return 0;
  if (mean < 30) return poisson(mean, rnd);
  return Math.max(0, Math.round(mean + Math.sqrt(mean) * normal(rnd)));
}

// The away receipt. store = merch store level (0 = none)
export function rollAwaySales({ fans, store, hours, ...mods }, rnd = Math.random) {
  if (!store || hours < 1 / 60 || fans <= 0) return { items: [], total: 0, hours };
  const days = effectiveDays(hours);
  const items = CATALOG.filter((i) => store >= i.store).map((i) => {
    const count = drawBuyers(fans * oddsFor(i, mods) * days, rnd);
    return { ...i, count, total: count * i.price };
  });
  return { items, total: items.reduce((t, i) => t + i.total, 0), hours };
}

// Expected value, for the advisor and tests
export function expectedAway({ fans, store, hours, ...mods }) {
  const days = effectiveDays(hours);
  return CATALOG.filter((i) => store >= i.store).reduce((t, i) => t + fans * oddsFor(i, mods) * days * i.price, 0);
}
