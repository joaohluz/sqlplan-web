import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseMysqlExplainJson, PlanParseError } from "./parse";

function fixture(name: string): string {
  return readFileSync(resolve(process.cwd(), "testdata", name), "utf-8");
}

describe("parseMysqlExplainJson", () => {
  it("parses a single-table plan", () => {
    const tree = parseMysqlExplainJson(fixture("simple_select.json"));
    expect(tree.type).toBe("query_block");
    expect(tree.children).toHaveLength(1);
    const table = tree.children[0];
    expect(table.type).toBe("table");
    expect(table.label).toBe("users");
    expect(table.metrics.access_type).toBe("ref");
    expect(table.metrics.key).toBe("idx_email");
    expect(table.metrics.filtered).toBe("100.00");
  });

  it("parses a two-table nested loop join", () => {
    const tree = parseMysqlExplainJson(fixture("join_two_tables.json"));
    const nestedLoop = tree.children[0];
    expect(nestedLoop.type).toBe("nested_loop");
    expect(nestedLoop.children).toHaveLength(2);
    expect(nestedLoop.children[0].label).toBe("orders");
    expect(nestedLoop.children[0].metrics.access_type).toBe("ALL");
    expect(nestedLoop.children[1].label).toBe("users");
    expect(nestedLoop.children[1].metrics.access_type).toBe("eq_ref");
  });

  it("parses ordering/grouping wrapper nodes around a three-table join", () => {
    const tree = parseMysqlExplainJson(fixture("join_three_tables_grouped.json"));
    const ordering = tree.children[0];
    expect(ordering.type).toBe("ordering_operation");
    expect(ordering.metrics.using_filesort).toBe("true");

    const grouping = ordering.children[0];
    expect(grouping.type).toBe("grouping_operation");
    expect(grouping.metrics.using_temporary_table).toBe("true");

    const nestedLoop = grouping.children[0];
    expect(nestedLoop.type).toBe("nested_loop");
    expect(nestedLoop.children).toHaveLength(3);
    expect(nestedLoop.children.map((n) => n.label)).toEqual(["orders", "users", "order_items"]);
  });

  it("throws PlanParseError for invalid JSON", () => {
    expect(() => parseMysqlExplainJson("{not json")).toThrow(PlanParseError);
  });

  it("throws PlanParseError when query_block is missing", () => {
    expect(() => parseMysqlExplainJson(fixture("malformed.json"))).toThrow(PlanParseError);
    expect(() => parseMysqlExplainJson(fixture("malformed.json"))).toThrow(/query_block/);
  });

  it("throws PlanParseError for empty input", () => {
    expect(() => parseMysqlExplainJson("   ")).toThrow(PlanParseError);
  });
});
