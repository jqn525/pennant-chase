// "· big market" / "· small market" after a rival's name; mid-market clubs go untagged
import { MARKETS } from "../game/constants.js";

export function MarketTag({ s, i }) {
  const m = i > 0 ? s.rivals?.[i - 1]?.market : null;
  if (!m || m === "mid") return null;
  return <span className={m === "power" ? "warn" : "dim"} style={{ fontSize: 12 }}> · {MARKETS[m].short}</span>;
}
