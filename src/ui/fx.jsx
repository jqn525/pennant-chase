// ── Game-feel effects: flipping digits, cash pops, end-of-game banners ──
// All motion-driven pieces honor prefers-reduced-motion via the app's
// <MotionConfig reducedMotion="user">; CSS pieces via theme.css.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { fmt } from "../game/utils.js";
import { TrophyIcon } from "./Icons.jsx";
import "./fx.css";

// A number that flips like a scoreboard card when it changes
export function FlipNumber({ value, className }) {
  return (
    <span className={`flip-num ${className || ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={String(value)} className="flip-num__card"
          initial={{ rotateX: -90, y: -6, opacity: 0 }}
          animate={{ rotateX: 0, y: 0, opacity: 1 }}
          exit={{ rotateX: 90, y: 6, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.3, 1.4, 0.5, 1] }}>
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// "+$120" coins that rise off the cash counter. Small changes (the merch
// stand's per-second trickle) are pooled so the HUD doesn't fizz nonstop.
export function CashPops({ money }) {
  const last = useRef(money);
  const pool = useRef({ sum: 0, since: 0 });
  const [pops, setPops] = useState([]);
  const nextId = useRef(1);

  useEffect(() => {
    const delta = money - last.current;
    last.current = money;
    if (!delta) return;
    const now = Date.now();
    const p = pool.current;
    if (!p.since) p.since = now;
    p.sum += delta;
    const big = Math.abs(p.sum) >= Math.max(25, Math.abs(money) * 0.02);
    if (!big && now - p.since < 4000) return;
    if (big || Math.abs(p.sum) >= 1) {
      const id = nextId.current++;
      setPops((list) => [...list.slice(-3), { id, amount: p.sum, big }]);
      setTimeout(() => setPops((list) => list.filter((x) => x.id !== id)), 1300);
    }
    pool.current = { sum: 0, since: 0 };
  }, [money]);

  return (
    <div className="cash-pops" aria-hidden="true">
      <AnimatePresence>
        {pops.map((p) => (
          <motion.div key={p.id} className={`cash-pop ${p.amount < 0 ? "is-spend" : ""} ${p.big ? "is-big" : ""}`}
            initial={{ y: 4, opacity: 0, scale: 0.8 }}
            animate={{ y: -10, opacity: [0, 1, 1, 0], scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}>
            {p.amount < 0 ? "−" : "+"}${fmt(Math.abs(Math.round(p.amount)))}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Pixel confetti (win, cup) or rain (loss): CSS-animated squares
function Particles({ kind }) {
  const [bits] = useState(() => Array.from({ length: kind === "loss" ? 26 : 34 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * (kind === "loss" ? 1.2 : 0.5),
    dur: kind === "loss" ? 0.5 + Math.random() * 0.3 : 1.1 + Math.random() * 0.8,
    color: kind === "loss" ? "#6f8ea8" : ["#e9a431", "#f5edda", "#c6503f", "#4f78a8", "#fff4c9"][i % 5],
    drift: (Math.random() * 2 - 1) * 30,
    size: kind === "loss" ? 2 : 4 + (i % 3) * 2,
  })));
  return (
    <div className={`fx-particles fx-particles--${kind}`}>
      {bits.map((b, i) => (
        <i key={i} style={{
          left: `${b.left}%`, background: b.color, width: b.size, height: kind === "loss" ? 10 : b.size,
          animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, "--drift": `${b.drift}px`,
        }} />
      ))}
    </div>
  );
}

// Over-the-field banner at the final out: WIN / LOSS / PENNANT CUP
export function GameBanner({ banner }) {
  return (
    <AnimatePresence>
      {banner && (
        <motion.div key={banner.id} className={`game-banner game-banner--${banner.kind}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <Particles kind={banner.kind === "loss" ? "loss" : "win"} />
          <motion.div className="game-banner__plate"
            initial={{ scale: 0.4, rotate: -6, y: 10 }} animate={{ scale: 1, rotate: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 16 }}>
            {banner.kind === "cup" && (
              <motion.span className="game-banner__trophy"
                animate={{ y: [0, -6, 0], rotate: [0, -4, 4, 0] }} transition={{ duration: 0.9, repeat: Infinity }}>
                <TrophyIcon size={40} />
              </motion.span>
            )}
            <strong>{banner.title}</strong>
            {banner.sub && <small>{banner.sub}</small>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
