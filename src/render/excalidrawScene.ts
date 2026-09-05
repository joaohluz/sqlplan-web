import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { PlanNode, PlanNodeFlag } from "../planmodel/node";
import { layoutPlan, type LayoutBox } from "./layout";

interface FlagStyle {
  strokeColor: string;
  backgroundColor: string;
  prefix: string;
}

const FLAG_STYLES: Record<PlanNodeFlag, FlagStyle> = {
  full_scan: { strokeColor: "#e03131", backgroundColor: "#ffc9c9", prefix: "⚠ full scan" },
  no_index: { strokeColor: "#e8590c", backgroundColor: "#ffd8a8", prefix: "⚠ no index" },
  low_filtered: { strokeColor: "#f08c00", backgroundColor: "#ffec99", prefix: "⚠ low filtered %" },
  cost_outlier: { strokeColor: "#9c36b5", backgroundColor: "#eebefa", prefix: "⚠ high relative cost" },
};

const DEFAULT_STROKE = "#1e1e1e";
const DEFAULT_BACKGROUND = "#e9ecef";

/** Formats a node's label + metrics into the multi-line box text. */
function formatLabel(node: PlanNode): string {
  const lines: string[] = [node.label];
  for (const [key, value] of Object.entries(node.metrics)) {
    lines.push(`${key}=${value}`);
  }
  for (const flag of node.flags) {
    lines.push(FLAG_STYLES[flag].prefix);
  }
  return lines.join("\n");
}

/** Picks the highest-priority flag style for a node's box coloring (first flag wins). */
function styleForNode(node: PlanNode): FlagStyle | null {
  if (node.flags.length === 0) return null;
  return FLAG_STYLES[node.flags[0]];
}

/**
 * Converts a PlanNode tree into a fully realized array of Excalidraw elements
 * (rectangles + connecting arrows), ready to hand to <Excalidraw initialData>.
 */
export function planToExcalidrawElements(root: PlanNode): readonly ExcalidrawElement[] {
  const { boxes } = layoutPlan(root);
  const idByBox = new Map<LayoutBox, string>();

  const skeletons: Parameters<typeof convertToExcalidrawElements>[0] = [];

  for (const box of boxes) {
    const elementId = box.id;
    idByBox.set(box, elementId);
    const style = styleForNode(box.node);

    skeletons.push({
      type: "rectangle",
      id: elementId,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      strokeColor: style?.strokeColor ?? DEFAULT_STROKE,
      backgroundColor: style?.backgroundColor ?? DEFAULT_BACKGROUND,
      fillStyle: "solid",
      roughness: 1,
      label: {
        text: formatLabel(box.node),
        fontSize: 14,
      },
    });
  }

  for (const box of boxes) {
    if (box.parentId === null) continue;
    skeletons.push({
      type: "arrow",
      x: 0,
      y: 0,
      strokeColor: DEFAULT_STROKE,
      start: { id: box.parentId },
      end: { id: box.id },
    });
  }

  return convertToExcalidrawElements(skeletons, { regenerateIds: false });
}
