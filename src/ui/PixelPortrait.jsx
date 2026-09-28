// ── An animated portrait: breathes, and blinks every few seconds ──

import { useEffect, useState } from "react";
import { portraitUrl } from "./portrait.js";

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function PixelPortrait({ p, className, style, alt = "" }) {
  const [frame, setFrame] = useState("base");
  useEffect(() => {
    if (reduced()) return undefined;
    let breath = false, t;
    let nextBlink = Date.now() + 1500 + Math.random() * 2500;
    const tick = () => {
      const now = Date.now();
      if (now >= nextBlink) {
        setFrame("blink");
        nextBlink = now + 3000 + Math.random() * 2500;
        t = setTimeout(tick, 140);
        return;
      }
      breath = !breath;
      setFrame(breath ? "breathe" : "base");
      t = setTimeout(tick, Math.min(1300, Math.max(140, nextBlink - now)));
    };
    t = setTimeout(tick, 900);
    return () => clearTimeout(t);
  }, [p.id]);
  return <img className={className} style={style} src={portraitUrl(p, frame)} alt={alt} />;
}
