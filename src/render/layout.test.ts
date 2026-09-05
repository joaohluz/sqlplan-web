import { describe, expect, it } from "vitest";
import { createNode } from "../planmodel/node";
import { layoutPlan } from "./layout";

describe("layoutPlan", () => {
  it("produces one box per node", () => {
    const child1 = createNode("table", "a");
    const child2 = createNode("table", "b");
    const root = createNode("nested_loop", "Nested Loop", {}, [child1, child2]);
    const { boxes } = layoutPlan(root);
    expect(boxes).toHaveLength(3);
  });

  it("lays out left-to-right: children have greater x than their parent", () => {
    const child = createNode("table", "a");
    const root = createNode("nested_loop", "Nested Loop", {}, [child]);
    const { boxes } = layoutPlan(root);
    const rootBox = boxes.find((b) => b.parentId === null)!;
    const childBox = boxes.find((b) => b.parentId === rootBox.id)!;
    expect(childBox.x).toBeGreaterThan(rootBox.x);
  });

  it("assigns increasing height to nodes with more metrics", () => {
    const fewMetrics = createNode("table", "a", { access_type: "ref" });
    const manyMetrics = createNode("table", "b", {
      access_type: "ALL",
      key: "NONE",
      filtered: "5.00",
      read_cost: "10",
      eval_cost: "2",
    });
    const root = createNode("nested_loop", "Nested Loop", {}, [fewMetrics, manyMetrics]);
    const { boxes } = layoutPlan(root);
    const fewBox = boxes.find((b) => b.node === fewMetrics)!;
    const manyBox = boxes.find((b) => b.node === manyMetrics)!;
    expect(manyBox.height).toBeGreaterThan(fewBox.height);
  });
});
