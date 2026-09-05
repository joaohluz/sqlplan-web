/**
 * DB-agnostic representation of an execution plan.
 *
 * Any database-specific parser (MySQL, and later Postgres/SQLite/etc.)
 * converts its native plan format into this generic tree. Everything
 * downstream (flag analysis, layout, rendering) only ever deals with
 * this shape, so adding support for another database means writing a
 * new parser, not touching the rest of the pipeline.
 */

export type PlanNodeFlag = "full_scan" | "no_index" | "low_filtered" | "cost_outlier";

export interface PlanNode {
  /** A short machine-friendly identifier for the kind of operation, e.g. "table", "nested_loop". */
  type: string;
  /** Human-readable title for the node, e.g. the table name or operation name. */
  label: string;
  /** Arbitrary key/value display metrics, kept as strings for simplicity of rendering. */
  metrics: Record<string, string>;
  /** Warnings attached by the analyze pass. */
  flags: PlanNodeFlag[];
  /** Child plan nodes (e.g. tables under a nested loop join). */
  children: PlanNode[];
}

export function createNode(
  type: string,
  label: string,
  metrics: Record<string, string> = {},
  children: PlanNode[] = [],
): PlanNode {
  return { type, label, metrics, flags: [], children };
}
