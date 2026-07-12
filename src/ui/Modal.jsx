// ── Reusable pop-up: dimmed backdrop, tap outside to close, content slides up ──

import { overlay } from "./styles.js";
import "./Modal.css";

export default function Modal({ onClose, children, maxWidth = 420 }) {
  return (
    <div className="game-modal" style={{ ...overlay }} onClick={onClose}>
      <div className="game-modal__sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth }}>
        <div className="game-modal__handle" />
        {children}
      </div>
    </div>
  );
}
