// ── useFranchise: the React side of the franchise ──
// Holds the one mutable state object from game/franchise.js, runs the season
// loop and the merch ticker, saves, and re-renders after every change.
// Screens call `act(fn, ...args)` with any franchise/advisor function.

import { useCallback, useEffect, useRef, useState } from "react";
import { SAVE_KEY, parseSave, decodeBackup, encodeBackup } from "../game/save.js";
import { blankState, loadState, toSave, tick, merchTick, welcomeBack } from "../game/franchise.js";
import { sfx, play } from "../game/sfx.js";
import { afterGame } from "../game/autodev.js";

const PERIOD = { 1: 900, 4: 220, max: 1000 };

function boot() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { state: blankState(), error: null };
    const parsed = parseSave(raw);
    return parsed.ok ? { state: loadState(parsed.value), error: null } : { state: blankState(), error: parsed.error };
  } catch {
    return { state: blankState(), error: "Saving is unavailable in this browser." };
  }
}

export default function useFranchise() {
  const ref = useRef(null);
  if (!ref.current) {
    const b = boot();
    ref.current = b.state;
    ref.current.bootError = b.error;
    welcomeBack(ref.current);
  }
  const s = ref.current;
  const [, setVersion] = useState(0);
  const [paused, setPaused] = useState(false);
  const [saveError, setSaveError] = useState(s.bootError);

  const save = useCallback(() => {
    const data = toSave(ref.current);
    if (!data) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); setSaveError(null); }
    catch { setSaveError("This browser couldn't save the game. Copy a backup code from Settings."); }
  }, []);

  // Drain queued events into sounds, then re-render
  const refresh = useCallback(() => {
    const st = ref.current;
    sfx.enabled = st.sound;
    for (const e of st.events.splice(0)) {
      if (st.speed === "max" && (e.type === "final" || e.type === "homer")) continue;
      if (e.type === "cash") play.cash();
      else if (e.type === "cup") play.fanfare();
      else if (e.type === "final" && e.won) play.cash();
    }
    setVersion((v) => v + 1);
  }, []);

  // Run any franchise or advisor function against the state
  const act = useCallback((fn, ...args) => {
    const out = fn(ref.current, ...args);
    refresh();
    save();
    return out;
  }, [refresh, save]);

  // The season loop
  useEffect(() => {
    if (!s.city || paused) return undefined;
    const iv = setInterval(() => {
      if (document.hidden) return;
      const st = ref.current;
      tick(st, st.speed);
      // auto-develop banks its share and spends it after every finished game
      if (st.events.some((e) => e.type === "final")) afterGame(st);
      refresh();
    }, PERIOD[s.speed] ?? 900);
    return () => clearInterval(iv);
  }, [s.city, s.speed, paused, refresh]);

  // Merch sells every second the app is open
  useEffect(() => {
    if (!s.city) return undefined;
    const iv = setInterval(() => {
      if (document.hidden || !ref.current.merch) return;
      merchTick(ref.current, 1);
      refresh();
    }, 1000);
    return () => clearInterval(iv);
  }, [s.city, refresh]);

  // Autosave heartbeat (actions also save immediately)
  useEffect(() => {
    const iv = setInterval(() => { if (!document.hidden) save(); }, 10000);
    const onHide = () => { if (document.hidden) save(); };
    document.addEventListener("visibilitychange", onHide);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onHide); };
  }, [save]);

  const setSpeed = (sp) => { ref.current.speed = sp; setPaused(false); refresh(); save(); };

  const backupCode = () => { const d = toSave(ref.current); return d ? encodeBackup(d) : ""; };
  const restore = (code) => {
    const parsed = decodeBackup(code);
    if (!parsed.ok) return parsed.error;
    try { localStorage.setItem(SAVE_KEY, parsed.json); window.location.reload(); return null; }
    catch { return "The backup is valid, but this browser couldn't store it."; }
  };
  const eraseAndRestart = () => {
    try { localStorage.removeItem(SAVE_KEY); window.location.reload(); }
    catch { setSaveError("This browser couldn't erase the saved franchise."); }
  };

  return { s, act, paused, setPaused, setSpeed, saveError, backupCode, restore, eraseAndRestart };
}
