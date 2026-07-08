// ── The standard game panel: pixel frame with a label breaking the border ──

import { C } from "../game/constants.js";
import { PIXEL } from "./styles.js";

export default function Panel({ title, tone = C.amber, bg = C.green, children, style, titleRight }) {
  return (
    <div style={{
      position: "relative", border: `3px solid ${tone}`, borderRadius: 8,
      padding: title ? "16px 10px 10px" : 10, marginTop: 14, background: bg,
      ...style,
    }}>
      {title && (
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translate(-50%, -55%)",
          background: bg, padding: "0 8px", fontFamily: PIXEL, fontSize: 10,
          color: tone, letterSpacing: 1, whiteSpace: "nowrap", maxWidth: "88%",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>{title}</div>
      )}
      {titleRight && (
        <div style={{ position: "absolute", top: 0, right: 10, transform: "translateY(-55%)", background: bg, padding: "0 6px", fontSize: 9, color: C.creamDim, letterSpacing: 1 }}>
          {titleRight}
        </div>
      )}
      {children}
    </div>
  );
}
