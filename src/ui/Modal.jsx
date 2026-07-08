// ── Reusable pop-up: dimmed backdrop, tap outside to close, content slides up ──

import { overlay } from "./styles.js";

export default function Modal({ onClose, children, maxWidth = 420 }) {
  return (
    <div style={{ ...overlay, alignItems: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth, maxHeight: "92dvh", overflowY: "auto", animation: "sheetUp .25s ease-out" }}>
        {children}
      </div>
    </div>
  );
}
