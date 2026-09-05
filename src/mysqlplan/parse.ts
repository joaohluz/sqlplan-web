import type { PlanNode } from "../planmodel/node";
import { createNode } from "../planmodel/node";
import type {
  MysqlExplainRoot,
  MysqlGroupingOperation,
  MysqlNestedLoopEntry,
  MysqlOrderingOperation,
  MysqlQueryBlock,
  MysqlTable,
} from "./types";

/** Thrown for any input that isn't valid JSON or doesn't look like a supported EXPLAIN plan. */
export class PlanParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanParseError";
  }
}

/** Parses a raw MySQL `EXPLAIN FORMAT=JSON` string into the DB-agnostic PlanNode tree. */
export function parseMysqlExplainJson(rawInput: string): PlanNode {
  const trimmed = rawInput.trim();
  if (trimmed.length === 0) {
    throw new PlanParseError("Input is empty. Paste the output of EXPLAIN FORMAT=JSON for your query.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new PlanParseError(`Input is not valid JSON: ${reason}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new PlanParseError("Expected a JSON object at the top level.");
  }

  const root = parsed as Partial<MysqlExplainRoot>;
  if (typeof root.query_block !== "object" || root.query_block === null) {
    throw new PlanParseError(
      'Missing "query_block" field. This does not look like MySQL EXPLAIN FORMAT=JSON output.',
    );
  }

  return parseQueryBlock(root.query_block);
}

function parseQueryBlock(qb: MysqlQueryBlock): PlanNode {
  const metrics: Record<string, string> = {};
  if (qb.cost_info?.query_cost) {
    metrics["query_cost"] = qb.cost_info.query_cost;
  }

  const child = parseContainer(qb);
  return createNode("query_block", "Query", metrics, child ? [child] : []);
}

/**
 * A "container" is any block-shaped object that may hold exactly one of:
 * ordering_operation, grouping_operation, nested_loop, or table.
 * This matches how MySQL nests these wrapper operations inside query_block,
 * ordering_operation, and grouping_operation alike.
 */
interface Container {
  ordering_operation?: MysqlOrderingOperation;
  grouping_operation?: MysqlGroupingOperation;
  nested_loop?: MysqlNestedLoopEntry[];
  table?: MysqlTable;
}

function parseContainer(container: Container): PlanNode | null {
  if (container.ordering_operation) {
    return parseOrderingOperation(container.ordering_operation);
  }
  if (container.grouping_operation) {
    return parseGroupingOperation(container.grouping_operation);
  }
  if (container.nested_loop) {
    return parseNestedLoop(container.nested_loop);
  }
  if (container.table) {
    return parseTable(container.table);
  }
  return null;
}

function parseOrderingOperation(op: MysqlOrderingOperation): PlanNode {
  const metrics: Record<string, string> = {
    using_filesort: String(op.using_filesort ?? false),
  };
  if (op.cost_info?.sort_cost) {
    metrics["sort_cost"] = op.cost_info.sort_cost;
  }
  const child = parseContainer(op);
  return createNode("ordering_operation", "Sort", metrics, child ? [child] : []);
}

function parseGroupingOperation(op: MysqlGroupingOperation): PlanNode {
  const metrics: Record<string, string> = {
    using_temporary_table: String(op.using_temporary_table ?? false),
    using_filesort: String(op.using_filesort ?? false),
  };
  if (op.cost_info?.sort_cost) {
    metrics["sort_cost"] = op.cost_info.sort_cost;
  }
  const child = parseContainer(op);
  return createNode("grouping_operation", "Group By", metrics, child ? [child] : []);
}

function parseNestedLoop(entries: MysqlNestedLoopEntry[]): PlanNode {
  const children = entries.map((entry) => parseTable(entry.table));
  return createNode("nested_loop", "Nested Loop", {}, children);
}

function parseTable(table: MysqlTable): PlanNode {
  const metrics: Record<string, string> = {
    access_type: table.access_type,
    key: table.key ?? "NONE",
  };

  if (table.rows_examined_per_scan !== undefined) {
    metrics["rows_examined_per_scan"] = String(table.rows_examined_per_scan);
  }
  if (table.rows_produced_per_join !== undefined) {
    metrics["rows_produced_per_join"] = String(table.rows_produced_per_join);
  }
  if (table.filtered !== undefined) {
    metrics["filtered"] = table.filtered;
  }
  if (table.cost_info?.read_cost) {
    metrics["read_cost"] = table.cost_info.read_cost;
  }
  if (table.cost_info?.eval_cost) {
    metrics["eval_cost"] = table.cost_info.eval_cost;
  }
  if (table.cost_info?.prefix_cost) {
    metrics["prefix_cost"] = table.cost_info.prefix_cost;
  }
  if (table.attached_condition) {
    metrics["attached_condition"] = table.attached_condition;
  }

  return createNode("table", table.table_name, metrics);
}
