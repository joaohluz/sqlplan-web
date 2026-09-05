import dagre from "@dagrejs/dagre";
import type { PlanNode } from "../planmodel/node";

export interface LayoutBox {
  id: string;
  node: PlanNode;
  parentId: string | null;
  /** Top-left x/y (dagre gives center coords; we convert here). */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  boxes: LayoutBox[];
  width: number;
  height: number;
}

const NODE_WIDTH = 220;
/** Extra height per metrics line, added on top of a base height for the label line. */
const LINE_HEIGHT = 18;
const BASE_HEIGHT = 40;
const RANK_SEP = 80;
const NODE_SEP = 30;

/**
 * Computes a left-to-right layout for a PlanNode tree using dagre.
 * Returns a flat list of boxes with top-left coordinates, ready to be
 * turned into Excalidraw skeleton elements.
 */
export function layoutPlan(root: PlanNode): LayoutResult {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: "LR", nodesep: NODE_SEP, ranksep: RANK_SEP });
  graph.setDefaultEdgeLabel(() => ({}));

  const boxes: LayoutBox[] = [];
  let counter = 0;

  function visit(node: PlanNode, parentId: string | null): void {
    const id = `n${counter++}`;
    const lineCount = countLines(node);
    const height = BASE_HEIGHT + lineCount * LINE_HEIGHT;
    graph.setNode(id, { width: NODE_WIDTH, height });
    if (parentId) {
      graph.setEdge(parentId, id);
    }
    boxes.push({ id, node, parentId, x: 0, y: 0, width: NODE_WIDTH, height });
    for (const child of node.children) {
      visit(child, id);
    }
  }

  visit(root, null);
  dagre.layout(graph);

  for (const box of boxes) {
    const g = graph.node(box.id);
    // dagre returns center coordinates; convert to top-left for rendering.
    box.x = g.x - g.width / 2;
    box.y = g.y - g.height / 2;
    box.width = g.width;
    box.height = g.height;
  }

  const graphInfo = graph.graph();
  return {
    boxes,
    width: graphInfo?.width ?? 0,
    height: graphInfo?.height ?? 0,
  };
}

function countLines(node: PlanNode): number {
  // label line + one line per metric + one line for flags (if any)
  return Object.keys(node.metrics).length + (node.flags.length > 0 ? 1 : 0);
}
