const installCode = `npm install @gridnexa/react

import { GridNexa, type Column } from "@gridnexa/react";
import "@gridnexa/react/index.css";`;

const usageCode = `type Employee = {
  id: number;
  name: string;
  department: string;
  region: string;
  score: number;
  revenue: number;
};

const columns: Column<Employee>[] = [
  { id: "name", field: "name", headerName: "Name", width: 220, sortable: true, filter: "text", editable: true },
  { id: "department", field: "department", headerName: "Department", width: 180, filter: "set" },
  { id: "region", field: "region", headerName: "Region", width: 140, filter: "set" },
  { id: "score", field: "score", headerName: "Score", width: 120, filter: "number", editable: true },
  { id: "revenue", field: "revenue", headerName: "Revenue", width: 150, filter: "number" },
];

export function App() {
  return (
    <GridNexa
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      rowNumbers
      checkboxSelection
      enableRangeSelection
      enableFillHandle
      enableUndoRedo
      toolbar={{
        quickFilter: true,
        filters: true,
        importData: true,
        copyPaste: true,
        bulkEdit: true,
        findReplace: true,
        exportCsv: true,
        exportExcel: true,
      }}
    />
  );
}`;

const dashboardCode = `<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  preset="analytics"
  dashboard={{
    showPanel: true,
    maxCards: 4,
    maxRows: 500,
    charts: [
      { type: "bar", category: "region", value: "revenue", title: "Revenue by region" },
      { type: "line", category: "month", value: "revenue", title: "Revenue trend" },
      { type: "pie", category: "product", value: "deals", title: "Deals by product" }
    ]
  }}
  toolbar={{ dashboard: true, filters: true, quickFilter: true }}
/>`;

const collaborationCode = `<GridNexa
  columns={columns}
  rows={rows}
  collaboration={{
    user,
    provider,
    showPresence: true,
    conflictMode: "cell-lock"
  }}
/>`;

const imageBase = "/images/gridnexa";

const highlights = [
  "Excel import and clipboard paste",
  "Inline editing, bulk edit, find/replace, fill handle, undo/redo",
  "Data Health profiling for missing, duplicate, invalid, and outlier values",
  "Trust Mode for active-cell source, quality evidence, impact, history, and rollback",
  "Dashboard Generator and insight charts from visible rows",
  "Collaboration hooks with presence, cell locks, and conflict modes",
  "Built-in themes, tokens, responsive layout, and TypeScript APIs",
];

const workflowItems = [
  "Excel, CSV, TSV, TXT, and JSON import",
  "Copy and paste ranges from Excel",
  "Inline cell editing and bulk edit",
  "Find and replace across editable cells",
  "CSV and Excel export",
];

const analyticsItems = [
  "Sorting, filtering, advanced filters, and set filters",
  "Grouping, aggregation, pivoting, and summaries",
  "Tree grid, master/detail, formulas, and merged headers",
  "Column pinning, resizing, hiding, and reorder",
];

function BlogCodeBlock({ code }: { code: string }) {
  return (
    <pre className="blog-code-block">
      <code>{code}</code>
    </pre>
  );
}

function BlogFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="blog-figure">
      <img src={src} alt={alt} loading="lazy" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function BlogGridNexaReactDataGrid() {
  return (
    <article className="blog-page">
      <header className="blog-hero">
        <div>
          <span className="eyebrow">GridNexa blog</span>
          <h2>GridNexa: A React Data Grid Built for Real Product Workflows</h2>
          <p>
            A practical introduction to GridNexa for teams that need Excel import,
            editing, dashboards, Data Health, Trust Mode, charts, collaboration,
            and TypeScript-first APIs in one React grid.
          </p>
          <div className="blog-cta-row">
            <a href="https://www.npmjs.com/package/@gridnexa/react" target="_blank" rel="noreferrer">
              <i className="bi bi-box-seam" /> Install from npm
            </a>
            <a href="https://github.com/mhalungekar9/gridnexa" target="_blank" rel="noreferrer">
              <i className="bi bi-github" /> Star on GitHub
            </a>
          </div>
        </div>
        <BlogFigure
          src={`${imageBase}/dashboard-generator.png`}
          alt="GridNexa React data grid dashboard generator with KPI cards and charts"
          caption="Dashboard Generator turns visible rows into KPI cards, charts, and insight notes."
        />
      </header>

      <section className="blog-section blog-lede">
        <p>
          Most React tables start simple. Then the product grows. Users ask for
          Excel import. Then copy and paste. Then inline editing. Then filters,
          saved views, grouping, pivoting, exports, validation, charts, dashboard
          summaries, and a way to understand why a number looks wrong.
        </p>
        <p>
          At that point, a table is no longer just a table. It becomes a daily
          workspace. That is the idea behind GridNexa: a modern React data grid
          for teams building serious data-heavy applications.
        </p>
      </section>

      <section className="blog-section">
        <h3>Why Another React Data Grid?</h3>
        <p>
          React developers already have choices. Some libraries are lightweight
          and flexible. Some are enterprise-heavy. Some are excellent building
          blocks but require a lot of custom wiring before they feel like a
          finished product.
        </p>
        <p>
          GridNexa takes a different angle: it is built for product teams that
          want powerful grid workflows without stitching together ten separate
          tools.
        </p>
        <div className="blog-highlight-grid">
          {highlights.map((item) => (
            <span key={item}>
              <i className="bi bi-check2-circle" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="blog-section">
        <h3>Install GridNexa for React</h3>
        <BlogCodeBlock code={installCode} />
        <BlogCodeBlock code={usageCode} />
      </section>

      <section className="blog-section blog-split">
        <div>
          <h3>Excel-Like Workflows Without Leaving the Grid</h3>
          <p>
            Many internal tools still orbit around spreadsheets. Users copy from
            Excel, paste ranges, bulk edit values, import CSV files, fix data in
            place, and expect keyboard-friendly editing.
          </p>
          <ul>
            {workflowItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <BlogFigure
          src={`${imageBase}/import-clipboard-bulkedit.png`}
          alt="GridNexa import clipboard and bulk edit workflow"
          caption="Import, clipboard, bulk edit, and find/replace are first-class workflows."
        />
      </section>

      <section className="blog-section blog-split">
        <BlogFigure
          src={`${imageBase}/data-health.png`}
          alt="GridNexa Data Health panel showing quality score and column issues"
          caption="Data Health profiles visible rows and columns directly inside the grid."
        />
        <div>
          <h3>Data Health: A Built-In Data Quality Panel</h3>
          <p>
            Bad data usually hides in plain sight. GridNexa includes a Data
            Health panel that surfaces missing values, duplicates, invalid cells,
            numeric outliers, top values, completeness, and quality scores.
          </p>
          <p>
            For operations, finance, CRM, analytics, support, and admin tools,
            this means users can inspect data quality before they make decisions
            with it.
          </p>
        </div>
      </section>

      <section className="blog-section blog-split">
        <div>
          <h3>Trust Mode: Explain the Cell the User Is Looking At</h3>
          <p>
            When a user asks, "Can I trust this number?", most grids do not have
            an answer. GridNexa Trust Mode is designed for that question.
          </p>
          <p>
            It can show value source, validation state, Data Health evidence,
            downstream impact, recent edit history, and rollback for the latest
            tracked edit.
          </p>
        </div>
        <BlogFigure
          src={`${imageBase}/trust-mode.png`}
          alt="GridNexa Trust Mode showing active cell source quality and rollback"
          caption="Trust Mode gives active-cell confidence without leaving the grid."
        />
      </section>

      <section className="blog-section">
        <h3>Dashboard Generator From Visible Rows</h3>
        <p>
          A grid often contains the data needed for a dashboard. GridNexa can
          turn the current visible grid view into KPI cards, configured charts,
          inferred summaries, and insight notes.
        </p>
        <BlogCodeBlock code={dashboardCode} />
      </section>

      <section className="blog-section blog-split">
        <BlogFigure
          src={`${imageBase}/charts.png`}
          alt="GridNexa insight charts from selected grid data"
          caption="Insight Charts turn selected ranges or visible rows into visual analysis."
        />
        <div>
          <h3>Insight Charts for Selected Ranges and Visible Rows</h3>
          <p>
            GridNexa supports bar, line, area, pie, donut, scatter, bubble,
            radar, radial, histogram, box plot, treemap, gauge, funnel, and combo
            charts. Users can also download rendered charts as PNG files.
          </p>
        </div>
      </section>

      <section className="blog-section blog-split">
        <div>
          <h3>Analytics Depth: Grouping, Pivoting, Tree Data, and Formulas</h3>
          <p>
            GridNexa includes the deeper capabilities teams expect when they move
            beyond simple CRUD tables.
          </p>
          <ul>
            {analyticsItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <BlogFigure
          src={`${imageBase}/pivoting.png`}
          alt="GridNexa pivoting and analytics grid"
          caption="Pivoting, grouping, formulas, tree data, and summaries support analytical screens."
        />
      </section>

      <section className="blog-section">
        <h3>Collaboration Hooks for Multi-User Editing</h3>
        <p>
          GridNexa includes provider-based collaboration configuration for
          realtime updates, presence badges, cell locks, and conflict modes such
          as cell-lock, last-write-wins, and versioned.
        </p>
        <BlogCodeBlock code={collaborationCode} />
        <BlogFigure
          src={`${imageBase}/collaboration.png`}
          alt="GridNexa collaboration with presence and cell locks"
          caption="Provider-based collaboration keeps realtime behavior app-owned."
        />
      </section>

      <section className="blog-section blog-split">
        <BlogFigure
          src={`${imageBase}/Diagnostics.png`}
          alt="GridNexa diagnostics panel for support and repro snapshots"
          caption="Diagnostics make complex grid issues easier to reproduce and support."
        />
        <div>
          <h3>Diagnostics Built for Support and Reproducibility</h3>
          <p>
            GridNexa diagnostics can capture grid state, sampled rows, recent
            actions, configuration summaries, and repro JSON so users can send
            better bug reports.
          </p>
        </div>
      </section>

      <section className="blog-section">
        <h3>Styling, Themes, and Production UI Details</h3>
        <p>
          GridNexa includes modern-light, modern-dark, compact, minimal,
          enterprise, high-contrast, light, dark, and system themes. It also
          supports CSS variables, theme tokens, slot-level styling, class
          callbacks, custom icons, density settings, unstyled mode, and
          responsive toolbar, popover, side-panel, pagination, and header
          behavior.
        </p>
      </section>

      <footer className="blog-footer">
        <h3>Try GridNexa</h3>
        <p>
          GridNexa is worth trying if your React app needs spreadsheet-like
          editing, import/export workflows, data quality checks, dashboard
          summaries, trust/audit context, collaboration, and a polished
          themeable UI.
        </p>
        <div className="blog-cta-row">
          <a href="https://www.gridnexa.in/" target="_blank" rel="noreferrer">
            <i className="bi bi-globe" /> Website
          </a>
          <a href="https://www.npmjs.com/package/@gridnexa/react" target="_blank" rel="noreferrer">
            <i className="bi bi-box-seam" /> npm
          </a>
          <a href="https://github.com/mhalungekar9/gridnexa" target="_blank" rel="noreferrer">
            <i className="bi bi-github" /> GitHub
          </a>
        </div>
      </footer>
    </article>
  );
}
