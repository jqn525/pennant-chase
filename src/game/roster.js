// ── Roster shape: 9 batters, a 5-man rotation, a setup man and a closer ──
// The one place that knows how a club's players are arranged. Rival clubs use
// the same shape. Pure.

export const ROTATION = 5;
export const PEN = ["Setup", "Closer"];

export const pitchers = (r) => [...(r.rotation || []), ...(r.pen || [])];
export const everyone = (r) => (r ? [...r.batters, ...pitchers(r)] : []);
export const ace = (r) => r.rotation[0];
export const setup = (r) => r.pen[0];
export const closer = (r) => r.pen[1];
export const starterFor = (r, n) => r.rotation[((n % ROTATION) + ROTATION) % ROTATION];

// "C", "SP3", "Setup", "Closer"
export function slotOf(r, pid) {
  const i = r.rotation.findIndex((p) => p.id === pid);
  if (i >= 0) return `SP${i + 1}`;
  const j = r.pen.findIndex((p) => p.id === pid);
  if (j >= 0) return PEN[j];
  return r.batters.find((p) => p.id === pid)?.pos ?? null;
}

// A new roster with one player replaced (by id), wherever he plays
export function replaceSlot(r, pid, next) {
  const swap = (list) => list.map((p) => (p.id === pid ? next : p));
  return { ...r, batters: swap(r.batters), rotation: swap(r.rotation), pen: swap(r.pen) };
}

// Apply fn to every player
export const mapRoster = (r, fn) => ({ ...r, batters: r.batters.map(fn), rotation: r.rotation.map(fn), pen: r.pen.map(fn) });
