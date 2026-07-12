// ── The standard game panel: pixel frame with a label breaking the border ──

export default function Panel({ title, children, style, bodyStyle, titleRight }) {
  return (
    <section className="game-panel" style={style}>
      {title && <div className="game-panel__title">{title}</div>}
      {titleRight && <div className="game-panel__meta">{titleRight}</div>}
      {bodyStyle ? <div style={bodyStyle}>{children}</div> : children}
    </section>
  );
}
