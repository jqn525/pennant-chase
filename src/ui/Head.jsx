// ── Section header with an optional "i" that reveals the explanation ──
// Explanations are needed once, so they stay folded until asked for.
import { useState } from "react";

export function Head({ title, small, help, children, innerRef, className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <h2 ref={innerRef} className={className}>
        <span className="grow">{title}</span>
        {small && <small>{small}</small>}
        {children}
        {help && <button type="button" className={`info ${open ? "on" : ""}`} aria-expanded={open} aria-label={`About ${typeof title === "string" ? title.toLowerCase() : "this section"}`} onClick={() => setOpen((o) => !o)}>i</button>}
      </h2>
      {help && open && <p className="note help">{help}</p>}
    </>
  );
}

// The same fold for numbers that have no header of their own
export function Hint({ label = "What these numbers mean", children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hint">
      <button type="button" className="hint__btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}><span className={`info ${open ? "on" : ""}`} aria-hidden="true">i</span>{label}</button>
      {open && <p className="note help">{children}</p>}
    </div>
  );
}
