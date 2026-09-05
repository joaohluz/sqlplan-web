/**
 * Partial typing of MySQL 8's `EXPLAIN FORMAT=JSON` schema, covering the
 * "common case" constructs: single table access, joined tables via
 * nested_loop, cost_info, and the grouping/ordering wrapper nodes.
 *
 * Deliberately not exhaustive: UNIONs, derived tables, subqueries in WHERE,
 * materialized tables, window functions, and CTEs are not modeled yet.
 * See mysqlplan/parse.ts for how unsupported shapes are handled.
 */

export interface MysqlCostInfo {
  query_cost?: string;
  read_cost?: string;
  eval_cost?: string;
  prefix_cost?: string;
  data_read_per_join?: string;
  sort_cost?: string;
}

export interface MysqlTable {
  table_name: string;
  access_type: string;
  possible_keys?: string[] | null;
  key?: string;
  used_key_parts?: string[];
  key_length?: string;
  ref?: string[];
  rows_examined_per_scan?: number;
  rows_produced_per_join?: number;
  filtered?: string;
  cost_info?: MysqlCostInfo;
  used_columns?: string[];
  attached_condition?: string;
}

export interface MysqlNestedLoopEntry {
  table: MysqlTable;
}

export interface MysqlGroupingOperation {
  using_temporary_table?: boolean;
  using_filesort?: boolean;
  cost_info?: MysqlCostInfo;
  nested_loop?: MysqlNestedLoopEntry[];
  table?: MysqlTable;
}

export interface MysqlOrderingOperation {
  using_filesort?: boolean;
  cost_info?: MysqlCostInfo;
  grouping_operation?: MysqlGroupingOperation;
  nested_loop?: MysqlNestedLoopEntry[];
  table?: MysqlTable;
}

export interface MysqlQueryBlock {
  select_id?: number;
  cost_info?: MysqlCostInfo;
  table?: MysqlTable;
  nested_loop?: MysqlNestedLoopEntry[];
  ordering_operation?: MysqlOrderingOperation;
  grouping_operation?: MysqlGroupingOperation;
}

export interface MysqlExplainRoot {
  query_block: MysqlQueryBlock;
}
