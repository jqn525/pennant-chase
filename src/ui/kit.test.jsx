import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Chip, Segmented, StatGrid } from "./kit.jsx";

describe("ui kit", () => {
  it("a disabled button says why", () => {
    const html = renderToStaticMarkup(<Button disabled reason="Need $1,200" sub="$1,200">Buy</Button>);
    expect(html).toContain("disabled");
    expect(html).toContain("Need $1,200");
  });
  it("an enabled button shows its sub line, not the reason", () => {
    const html = renderToStaticMarkup(<Button variant="primary" reason="Need $5" sub="$5">+1</Button>);
    expect(html).toContain("ui-btn--primary");
    expect(html).not.toContain("Need");
  });
  it("chips, segments and stat grids render their content", () => {
    expect(renderToStaticMarkup(<Chip tone="amber">Clutch</Chip>)).toContain("ui-chip--amber");
    const seg = renderToStaticMarkup(<Segmented value={5} onChange={() => {}} options={[[1, "+1"], [5, "+5"]]} />);
    expect(seg).toMatch(/aria-selected="true"[^>]*>\+5/);
    expect(renderToStaticMarkup(<StatGrid items={[["AVG", ".300"]]} />)).toContain(".300");
  });
});
