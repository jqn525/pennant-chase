export const SAVE_KEY = "pennant-chase-save-v3";

const object = (v) => v && typeof v === "object" && !Array.isArray(v);
const finite = (v) => typeof v === "number" && Number.isFinite(v);
const player = (p) => object(p) && Number.isInteger(p.id) && typeof p.name === "string"
  && typeof p.pos === "string" && typeof p.role === "string";

export function validateSave(s) {
  if (!object(s) || s.version !== 3) return "That code isn't a Pennant Chase v3 save.";
  if (!object(s.city) || typeof s.city.name !== "string") return "The save has an invalid city.";
  const r = s.roster;
  if (!object(r) || !Array.isArray(r.batters) || r.batters.length !== 9
    || !r.batters.every(player) || !player(r.sp) || !player(r.rp)) return "The save has an invalid roster.";
  if (!Array.isArray(s.rivals) || s.rivals.length !== 7 || !s.rivals.every((t) =>
    object(t) && typeof t.name === "string" && Array.isArray(t.batters)
    && t.batters.length === 9 && t.batters.every(player) && player(t.sp))) return "The save has an invalid league.";
  if (!Array.isArray(s.schedule) || !s.schedule.every((d) => object(d)
    && Number.isInteger(d.opp) && d.opp >= 1 && d.opp <= 7 && typeof d.home === "boolean")) return "The save has an invalid schedule.";
  if (!Array.isArray(s.rivalDays) || s.rivalDays.length !== s.schedule.length
    || !s.rivalDays.every((day) => Array.isArray(day) && day.length === 3
      && day.every((pair) => Array.isArray(pair) && pair.length === 2
        && pair.every((id) => Number.isInteger(id) && id >= 1 && id <= 7)))) return "The save has invalid league games.";
  if (!Array.isArray(s.standings) || s.standings.length !== 8
    || !s.standings.every((t) => object(t) && Number.isInteger(t.w) && t.w >= 0 && Number.isInteger(t.l) && t.l >= 0)) return "The save has invalid standings.";
  if (!Number.isInteger(s.gameIndex) || s.gameIndex < 0 || s.gameIndex > s.schedule.length) return "The save has an invalid game position.";
  if (!finite(s.money) || !finite(s.fans) || !Number.isInteger(s.year) || s.year < 1) return "The save has invalid franchise totals.";
  if (!["regular", "playoffs", "draft"].includes(s.phase)) return "The save has an invalid season phase.";
  if (s.phase === "playoffs" && (!object(s.playoffs) || !["semi", "final"].includes(s.playoffs.round))) return "The save has invalid playoffs.";
  if (s.draftClass != null && (!Array.isArray(s.draftClass) || !s.draftClass.every(player))) return "The save has an invalid draft class.";
  if ((s.liveGame == null) !== (s.liveContext == null)) return "The save has an incomplete live game.";
  if (s.liveGame != null && (!object(s.liveGame) || !object(s.liveContext)
    || !Number.isInteger(s.liveGame.inning) || s.liveGame.inning < 1
    || !["top", "bottom"].includes(s.liveGame.half) || !Number.isInteger(s.liveGame.outs)
    || s.liveGame.outs < 0 || s.liveGame.outs > 2 || !Array.isArray(s.liveGame.bases)
    || s.liveGame.bases.length !== 3 || !finite(s.liveGame.us) || !finite(s.liveGame.them)
    || !Array.isArray(s.liveContext.batters) || s.liveContext.batters.length !== 9
    || !s.liveContext.batters.every(player) || !player(s.liveContext.sp)
    || !player(s.liveContext.rp) || !object(s.liveContext.opp))) return "The save has an invalid live game.";
  return null;
}

export function parseSave(raw) {
  try {
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    const error = validateSave(value);
    return error ? { ok: false, error } : { ok: true, value };
  } catch {
    return { ok: false, error: "Couldn't read that save." };
  }
}

export function encodeBackup(value) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))));
}

export function decodeBackup(code) {
  try {
    const json = decodeURIComponent(escape(atob(code.replace(/\s/g, ""))));
    const parsed = parseSave(json);
    return parsed.ok ? { ...parsed, json } : parsed;
  } catch {
    return { ok: false, error: "Couldn't read that code. Make sure you copied the whole thing, then try again." };
  }
}
