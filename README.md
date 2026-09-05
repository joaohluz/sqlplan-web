# sqlplan-web

A minimalist visualizer for MySQL `EXPLAIN FORMAT=JSON` execution plans. Paste
a plan, get a diagram — rendered with [Excalidraw](https://github.com/excalidraw/excalidraw)
for a clean, hand-drawn look. Everything runs client-side; no plan data ever
leaves your browser.

## Requirements

- [Node.js](https://nodejs.org/) 24.x (see `.nvmrc`). If you use
  [nvm](https://github.com/nvm-sh/nvm), just run `nvm use` in this directory.

## Setup

```sh
npm install
```

## Run it

```sh
npm run dev
```

Open the printed local URL (usually http://localhost:5173). Paste MySQL
`EXPLAIN FORMAT=JSON` output into the textarea and click **Visualize**, or
click one of the sample plan buttons to try it immediately.

## Manual testing

There is no live database connection — everything is driven by pasted JSON,
so manual testing just means exercising the UI with a few inputs:

1. Run `npm run dev` and open the app.
2. Click each of the three **sample plan** buttons in the sidebar and confirm
   a diagram renders for each (single table, two-table join, three-table join
   with GROUP BY/ORDER BY).
3. Confirm nodes flagged with warnings (full table scan, no index, low
   filtered %, high relative cost) are visually highlighted with a distinct
   color, and the flag text appears in the box.
4. Paste the contents of `testdata/malformed.json` into the textarea and
   confirm a clear error message is shown instead of a crash.
5. Try pasting your own `EXPLAIN FORMAT=JSON` output from a real MySQL query
   (`EXPLAIN FORMAT=JSON SELECT ...`) and confirm it renders sensibly. Note
   that only common constructs are supported (single/joined tables via
   nested loop, `cost_info`, `GROUP BY`/`ORDER BY` wrapper nodes); UNIONs,
   derived tables, subqueries, and window functions are not parsed yet.
6. Since the diagram is a real Excalidraw canvas, try panning/zooming and
   dragging a node to confirm the canvas is fully interactive.

## Automated tests

Unit tests cover the parser, warning-flag rules, and layout logic:

```sh
npm run test
```

(The Excalidraw scene-building step itself is only covered by manual testing
above — it depends on browser/canvas APIs that aren't practical to run in a
headless test environment for this project.)

## Project structure

```
src/
├── planmodel/        DB-agnostic plan tree (PlanNode)
├── mysqlplan/         MySQL EXPLAIN FORMAT=JSON parser -> PlanNode
├── analyze/           Warning-flag rules (full scan, low filtered %, cost outliers)
├── render/            dagre layout + PlanNode -> Excalidraw scene elements
└── components/        React UI (input textarea, Excalidraw canvas)
testdata/               Sample and malformed EXPLAIN JSON fixtures
```

## Known limitations

- Only MySQL 8 `EXPLAIN FORMAT=JSON` is supported (no Postgres/SQLite/SQL Server yet).
- Only "common case" plan shapes are parsed: single/joined tables via nested
  loop, `cost_info`, and `GROUP BY`/`ORDER BY` wrapper nodes. UNIONs, derived
  tables, subqueries, and window functions will fail to parse.
