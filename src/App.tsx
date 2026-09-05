import { useMemo, useState } from "react";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { PlanInput } from "./components/PlanInput";
import { PlanCanvas } from "./components/PlanCanvas";
import { parseMysqlExplainJson, PlanParseError } from "./mysqlplan/parse";
import { analyzePlan } from "./analyze/flags";
import { planToExcalidrawElements } from "./render/excalidrawScene";

import simpleSelect from "../testdata/simple_select.json?raw";
import joinTwoTables from "../testdata/join_two_tables.json?raw";
import joinThreeTablesGrouped from "../testdata/join_three_tables_grouped.json?raw";

import "./App.css";

const SAMPLE_PLANS: Record<string, string> = {
  "Simple SELECT (single table)": simpleSelect,
  "Two-table join (full scan + eq_ref)": joinTwoTables,
  "Three-table join with GROUP BY / ORDER BY": joinThreeTablesGrouped,
};

function App() {
  const [elements, setElements] = useState<readonly ExcalidrawElement[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleVisualize(rawInput: string) {
    try {
      const tree = parseMysqlExplainJson(rawInput);
      analyzePlan(tree);
      const scene = planToExcalidrawElements(tree);
      setElements(scene);
      setError(null);
    } catch (err) {
      if (err instanceof PlanParseError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
      setElements([]);
    }
  }

  const sampleButtons = useMemo(
    () =>
      Object.entries(SAMPLE_PLANS).map(([label, json]) => (
        <button key={label} className="sample-button" onClick={() => handleVisualize(json)}>
          {label}
        </button>
      )),
    [],
  );

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>sqlplan-web</h1>
        <p>Paste a MySQL <code>EXPLAIN FORMAT=JSON</code> plan and visualize it as a diagram.</p>
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <PlanInput onVisualize={handleVisualize} error={error} />
          <div className="sample-plans">
            <h2>Or try a sample:</h2>
            {sampleButtons}
          </div>
        </aside>
        <main className="app-main">
          <PlanCanvas elements={elements} />
        </main>
      </div>
    </div>
  );
}

export default App;
