// ── Motion: numbers glide to their new value ──
import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Animate a number toward `value` over `ms`; returns the value to display
export function useTween(value, ms = 400) {
  const [shown, setShown] = useState(value);
  const from = useRef(value), raf = useRef(0), cur = useRef(value);
  useEffect(() => {
    if (!Number.isFinite(value) || reduced() || Math.abs(value - cur.current) < 0.5) { cur.current = value; setShown(value); return undefined; }
    from.current = cur.current;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms), e = 1 - (1 - k) ** 3;
      cur.current = from.current + (value - from.current) * e;
      setShown(cur.current);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, ms]);
  return shown;
}
