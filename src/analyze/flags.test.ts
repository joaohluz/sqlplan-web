import { describe, expect, it } from "vitest";
import { createNode } from "../planmodel/node";
import { analyzePlan } from "./flags";

describe("analyzePlan", () => {
  it("flags a full table scan", () => {
    const root = createNode("table", "orders", { access_type: "ALL", key: "NONE" });
    analyzePlan(root);
    expect(root.flags).toContain("full_scan");
    expect(root.flags).not.toContain("no_index");
  });

  it("flags no_index only when access type isn't already ALL", () => {
    const root = createNode("table", "orders", { access_type: "index", key: "NONE" });
    analyzePlan(root);
    expect(root.flags).toContain("no_index");
    expect(root.flags).not.toContain("full_scan");
  });

  it("flags low filtered percentage below threshold", () => {
    const root = createNode("table", "orders", { access_type: "ref", key: "idx", filtered: "5.00" });
    analyzePlan(root);
    expect(root.flags).toContain("low_filtered");
  });

  it("does not flag filtered percentage above threshold", () => {
    const root = createNode("table", "orders", { access_type: "ref", key: "idx", filtered: "80.00" });
    analyzePlan(root);
    expect(root.flags).not.toContain("low_filtered");
  });

  it("flags a cost outlier relative to siblings", () => {
    const cheapChild = createNode("table", "users", { read_cost: "1.00" });
    const expensiveChild = createNode("table", "orders", { read_cost: "100.00" });
    const root = createNode("nested_loop", "Nested Loop", {}, [cheapChild, expensiveChild]);
    analyzePlan(root);
    expect(expensiveChild.flags).toContain("cost_outlier");
    expect(cheapChild.flags).not.toContain("cost_outlier");
  });

  it("does not flag cost outliers when costs are similar", () => {
    const childA = createNode("table", "a", { read_cost: "10.00" });
    const childB = createNode("table", "b", { read_cost: "12.00" });
    const root = createNode("nested_loop", "Nested Loop", {}, [childA, childB]);
    analyzePlan(root);
    expect(childA.flags).not.toContain("cost_outlier");
    expect(childB.flags).not.toContain("cost_outlier");
  });
});
