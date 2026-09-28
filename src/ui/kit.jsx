// ── UI kit: the handful of primitives every screen is built from ──
// Styling lives in ui.css; these only pick classes.

import { useEffect } from "react";
import Modal from "./Modal.jsx";

const cx = (...c) => c.filter(Boolean).join(" ");

// variant: primary | secondary | ghost | danger. `sub` is a second line
// (e.g. a price); `reason` replaces it when disabled so a locked button
// says why it's locked.
export function Button({ variant = "secondary", size, block, disabled, reason, sub, className, children, ...rest }) {
  const note = disabled && reason ? reason : sub;
  return (
    <button type="button" disabled={disabled}
      className={cx("ui-btn", variant !== "secondary" && `ui-btn--${variant}`, size && `ui-btn--${size}`, block && "ui-btn--block", className)}
      {...rest}>
      <span>{children}</span>
      {note != null && note !== "" && <span className="ui-btn__sub">{note}</span>}
    </button>
  );
}

export const Chip = ({ tone = "dim", title, children }) => (
  <span className={`ui-chip ui-chip--${tone}`} title={title}>{children}</span>
);

// options: [[value, label], ...]
export function Segmented({ options, value, onChange, wrap, label }) {
  return (
    <div className={cx("ui-seg", wrap && "ui-seg--wrap")} role="tablist" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={String(v)} type="button" role="tab" aria-selected={v === value}
          className={v === value ? "is-active" : undefined} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

// items: [[label, value], ...]
export const StatGrid = ({ items, cols = 4, big }) => (
  <div className={cx("ui-stats", big && "ui-stats--big")} style={{ "--cols": cols }}>
    {items.map(([label, v]) => (
      <div key={label}><span>{label}</span><strong>{v}</strong></div>
    ))}
  </div>
);

export const Section = ({ title, right, children, className }) => (
  <section className={cx("ui-section", className)}>
    <div className="ui-section__head"><h3>{title}</h3>{right != null && <small>{right}</small>}</div>
    {children}
  </section>
);

// The overlay shell: sticky header (title or custom content + close),
// scrolling body, optional sticky footer. Escape closes.
export function Sheet({ title, header, subhead, footer, onClose, maxWidth = 440, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <Modal onClose={onClose} maxWidth={maxWidth}>
      <div className="ui-sheet" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
        <div className="ui-sheet__head">
          <div className="ui-sheet__bar">
            {title != null && <h2 className="ui-sheet__title">{title}</h2>}
            {header && <div style={{ flex: 1, minWidth: 0 }}>{header}</div>}
            {onClose && <button type="button" className="ui-sheet__close" onClick={onClose} aria-label="Close">✕</button>}
          </div>
          {subhead && <div className="ui-sheet__subhead">{subhead}</div>}
        </div>
        <div className="ui-sheet__body">{children}</div>
        {footer && <div className="ui-sheet__foot">{footer}</div>}
      </div>
    </Modal>
  );
}
