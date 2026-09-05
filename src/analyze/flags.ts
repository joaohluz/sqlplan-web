import type { PlanNode } from "../planmodel/node";

const LOW_FILTERED_THRESHOLD_PERCENT = 20;
const COST_OUTLIER_MULTIPLIER = 3;

/**
 * Walks a PlanNode tree and attaches warning flags in place:
 *  - full_scan: a table node with access_type "ALL"
 *  - no_index: a table node with no key used (key === "NONE"), excluding full scans
 *    which already imply no index
 *  - low_filtered: a table node where "filtered" is below the threshold
 *  - cost_outlier: a node whose prefix_cost/read_cost is much higher than the
 *    average of its sibling nodes
 */
export function analyzePlan(root: PlanNode): PlanNode {
  annotateNode(root);
  annotateCostOutliers(root);
  return root;
}

function annotateNode(node: PlanNode): void {
  if (node.type === "table") {
    const accessType = node.metrics["access_type"];
    if (accessType === "ALL") {
      addFlag(node, "full_scan");
    } else if (node.metrics["key"] === "NONE") {
      addFlag(node, "no_index");
    }

    const filtered = parsePercent(node.metrics["filtered"]);
    if (filtered !== null && filtered < LOW_FILTERED_THRESHOLD_PERCENT) {
      addFlag(node, "low_filtered");
    }
  }

  for (const child of node.children) {
    annotateNode(child);
  }
}

function annotateCostOutliers(node: PlanNode): void {
  const costs = node.children.map((child) => ({
    child,
    cost: parseNumber(child.metrics["read_cost"] ?? child.metrics["prefix_cost"]),
  }));

  for (const { child, cost } of costs) {
    if (cost === null) continue;
    const otherCosts = costs
      .filter((entry) => entry.child !== child && entry.cost !== null)
      .map((entry) => entry.cost as number);
    if (otherCosts.length === 0) continue;
    const average = otherCosts.reduce((sum, c) => sum + c, 0) / otherCosts.length;
    if (average > 0 && cost > average * COST_OUTLIER_MULTIPLIER) {
      addFlag(child, "cost_outlier");
    }
  }

  for (const child of node.children) {
    annotateCostOutliers(child);
  }
}

function addFlag(node: PlanNode, flag: PlanNode["flags"][number]): void {
  if (!node.flags.includes(flag)) {
    node.flags.push(flag);
  }
}

function parsePercent(value: string | undefined): number | null {
  if (value === undefined) return null;
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? null : num;
}

function parseNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? null : num;
}
