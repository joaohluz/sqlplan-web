import { describe, expect, it } from "vitest";
import type { LayoutBox } from "./layout";
import { computeArrowGeometry } from "./arrowGeometry";

function box(overrides: Partial<LayoutBox>): LayoutBox {
  return {
    id: "id",
    node: { type: "table", label: "t", metrics: {}, flags: [], children: [] },
    parentId: null,
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    ...overrides,
  };
}

describe("computeArrowGeometry", () => {
  it("starts at the left-mid edge of `from` and ends at the right-mid edge of `to`", () => {
    const child = box({ id: "child", x: 300, y: 100, width: 200, height: 60 });
    const parent = box({ id: "parent", x: 0, y: 0, width: 200, height: 40 });

    const geo = computeArrowGeometry(child, parent);

    // start point = child's left-mid edge
    expect(geo.x).toBe(300);
    expect(geo.y).toBe(130); // 100 + 60/2

    // end point = start + width/height = parent's right-mid edge
    expect(geo.x + geo.width).toBe(200); // parent.x + parent.width
    expect(geo.y + geo.height).toBe(20); // parent.y + parent.height/2
  });

  it("produces a non-zero geometry when boxes are distinct", () => {
    const child = box({ x: 300, y: 100 });
    const parent = box({ x: 0, y: 0 });
    const geo = computeArrowGeometry(child, parent);
    expect(geo.width).not.toBe(0);
  });
});
