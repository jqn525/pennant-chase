// ── The shell: club header with cash and pace, four tabs, overlay sheets ──
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import TeamLogo from "./TeamLogo.jsx";
import { money } from "./fmt.js";
import { useTween } from "./motion.js";
import { Sparkline } from "./charts.jsx";
import { netPerGame, seasonLabel } from "./metrics.js";
import { options } from "../game/advisor.js";
import OverviewView from "./OverviewView.jsx";
import SpendView from "./SpendView.jsx";
import RosterView from "./RosterView.jsx";
import StatsView, { STATS_KEY } from "./StatsView.jsx";
import PlayerSheet from "./PlayerSheet.jsx";
import DraftSheet from "./DraftSheet.jsx";
import SettingsSheet from "./SettingsSheet.jsx";

const TABS = [["overview", "Overview"], ["spend", "Spend"], ["roster", "Roster"], ["stats", "Stats"]];

export function Pace({ f }) {
  const { s, paused, setPaused, setSpeed } = f;
  const opts = [["pause", "❚❚"], [1, "1×"], [4, "4×"], ["max", "MAX"]];
  return (
    <div className="pace" role="group" aria-label="Game pace">
      {opts.map(([v, label]) => {
        const on = v === "pause" ? paused : !paused && s.speed === v;
        return (
          <button key={label} className={on ? "on" : ""}
            aria-label={v === "pause" ? "Pause" : `Pace ${label}`}
            onClick={() => (v === "pause" ? setPaused(!paused) : setSpeed(v))}>{label}</button>
        );
      })}
    </div>
  );
}

export default function Shell({ f }) {
  const { s } = f;
  const [tab, setTab] = useState(() => {
    try { const raw = sessionStorage.getItem("pc-tab"); const t = raw === "season" ? "stats" : raw; return TABS.some(([id]) => id === t) ? t : "overview"; } catch { return "overview"; }
  });
  // The header is fixed; measure it so the page starts below it
  const topRef = useRef(null);
  useLayoutEffect(() => {
    const el = topRef.current;
    if (!el) return undefined;
    const set = () => document.documentElement.style.setProperty("--top-h", `${el.offsetHeight}px`);
    set();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
  const [playerId, setPlayerId] = useState(null);
  const [settings, setSettings] = useState(false);
  const [draftHidden, setDraftHidden] = useState(false);
  useEffect(() => { try { sessionStorage.setItem("pc-tab", tab); } catch { /* private mode */ } window.scrollTo(0, 0); }, [tab]);
  useEffect(() => { if (s.phase !== "draft") setDraftHidden(false); }, [s.phase]);

  const net = netPerGame(s);
  const cash = useTween(s.money);
  const trail = (s.hist?.games || []).slice(-30).map((r) => [r[0], r[8]]);
  const ready = options(s).filter((o) => o.affordable && Number.isFinite(o.payback) && (!s.autoDev?.on || o.kind === "Build" || o.kind === "Promote")).length;
  const showDraft = s.phase === "draft" && !draftHidden;
  const views = { overview: OverviewView, spend: SpendView, roster: RosterView, stats: StatsView };
  const View = views[tab];

  return (
    <>
      <header className="top" ref={topRef}>
        <div className="top__in">
          <button className="top__club" onClick={() => setSettings(true)} aria-label="Club settings">
            <TeamLogo city={s.city} size={34} />
            <span style={{ minWidth: 0 }}>
              <b>{s.city.name} {s.city.nickname}</b>
              <small>{seasonLabel(s)}</small>
            </span>
          </button>
          <div className="top__cash">
            <b>{money(cash)}</b>
            <small className={net >= 0 ? "up" : "down"}>{trail.length > 2 && <Sparkline points={trail} width={44} height={14} color={net >= 0 ? "var(--good)" : "var(--bad)"} />} {money(net, { sign: true })}/game</small>
          </div>
        </div>
        <div className="top__in" style={{ paddingTop: 0 }}>
          <Pace f={f} />
          {s.phase === "draft" && draftHidden && (
            <button className="btn btn--sm" style={{ marginLeft: "auto" }} onClick={() => setDraftHidden(false)}>Draft is open</button>
          )}
        </div>
      </header>
      {f.saveError && <div className="view" style={{ paddingBottom: 0 }}><p className="alert" role="alert">{f.saveError}</p></div>}

      <main className="view">
        <View f={f} openPlayer={setPlayerId} goTo={(t, sec) => { if (sec) { try { sessionStorage.setItem(STATS_KEY, sec); } catch { /* private mode */ } } setTab(t); }} />
      </main>

      <nav className="tabs" aria-label="Sections">
        <div className="tabs__in">
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? "on" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>
              <span className="tabs__label">
                {label}
                {id === "spend" && ready > 0 && <i aria-label={`${ready} worthwhile buys`}>{ready > 99 ? "99+" : ready}</i>}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {showDraft && <DraftSheet f={f} onHide={() => setDraftHidden(true)} openPlayer={setPlayerId} />}
      {playerId != null && <PlayerSheet f={f} pid={playerId} onClose={() => setPlayerId(null)} />}
      {settings && <SettingsSheet f={f} onClose={() => setSettings(false)} />}
    </>
  );
}

// Shared overlay page
export function Sheet({ title, onClose, closeLabel = "Close", children, actions }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet__bar"><div className="top__in"><h3>{title}</h3>{actions}{onClose && <button className="x" onClick={onClose}>{closeLabel}</button>}</div></div>
      <div className="view">{children}</div>
    </div>
  );
}
