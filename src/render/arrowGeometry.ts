import type { LayoutBox } from "./layout";

export interface ArrowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Computes the arrow's initial geometry (x/y/width/height) connecting the
 * left-mid edge of `from` to the right-mid edge of `to`. Used for edges
 * drawn child -> parent (data flow direction) in a left-to-right layout,
 * where the parent box sits to the left of its children.
 *
 * Kept as a pure function (no Excalidraw imports) so it can be unit tested
 * without needing a browser/canvas environment.
 */
export function computeArrowGeometry(from: LayoutBox, to: LayoutBox): ArrowGeometry {
  const startX = from.x;
  const startY = from.y + from.height / 2;
  const endX = to.x + to.width;
  const endY = to.y + to.height / 2;

  return {
    x: startX,
    y: startY,
    width: endX - startX,
    height: endY - startY,
  };
}
