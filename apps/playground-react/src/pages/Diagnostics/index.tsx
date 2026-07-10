import { useRef, useState } from "react";
import { GridNexa, type Column, type GridNexaApi, type GridNexaReproSnapshot } from "@gridnexa/react";
import { CodeViewer } from "../../components/CodeViewer";
import { DemoCard } from "../../components/DemoCard";
import { useAppTheme } from "../../hooks/useTheme";

interface IncidentRow {
  id: number;
  issue: string;
  owner: string;
  severity: "Low" | "Medium" | "High";
  status: "Open" | "Investigating" | "Resolved";
  impact: number;
}

const rows: IncidentRow[] = [
  { id: 1, issue: "Pinned column misalignment", owner: "UI Platform", severity: "High", status: "Investigating", impact: 92 },
  { id: 2, issue: "Filter returns empty result", owner: "Data Apps", severity: "Medium", status: "Open", impact: 67 },
  { id: 3, issue: "Export missing formatted values", owner: "Analytics", severity: "Low", status: "Resolved", impact: 34 },
  { id: 4, issue: "Undo history resets in host app", owner: "Integrations", severity: "High", status: "Investigating", impact: 88 },
  { id: 5, issue: "Column menu opens near viewport edge", owner: "UI Platform", severity: "Medium", status: "Open", impact: 73 },
  { id: 6, issue: "Large note cell wraps unexpectedly", owner: "Support Tools", severity: "Low", status: "Open", impact: 41 },
];

const columns: Column<IncidentRow>[] = [
  { id: "issue", field: "issue", headerName: "Issue", minWidth: 230, editable: true, filter: "text" },
  { id: "owner", field: "owner", headerName: "Owner", width: 160, filter: "set", editable: true },
  { id: "severity", field: "severity", headerName: "Severity", width: 140, filter: "set", editable: true },
  { id: "status", field: "status", headerName: "Status", width: 160, filter: "set", editable: true },
  { id: "impact", field: "impact", headerName: "Impact", width: 120, filter: "number", editable: true },
];

const diagnosticsCode = `<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  diagnostics={{
    recorder: true,
    exportRepro: true,
    maxEvents: 40,
    rowSampleSize: 50,
    fileName: "gridnexa-issue-repro.json"
  }}
  commandPalette
  changeReview
  toolbar={{
    quickFilter: true,
    filters: true,
    undoRedo: true,
    addRow: true,
    deleteRow: true,
    saveAll: true
  }}
/>`;

const apiCode = `const apiRef = useRef<GridNexaApi<Row> | null>(null);

<GridNexa
  apiRef={apiRef}
  columns={columns}
  rows={rows}
  diagnostics={{ recorder: true, exportRepro: true }}
/>

apiRef.current?.exportDiagnostics();`;

const importReproCode = `const [repro, setRepro] = useState<GridNexaReproSnapshot<Row> | null>(null);

<input
  type="file"
  accept=".json,application/json"
  onChange={async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setRepro(JSON.parse(await file.text()));
  }}
/>

{repro ? (
  <GridNexa repro={repro} />
) : (
  <p>Select a repro JSON file</p>
)}`;

const snapshotItems = [
  ["Grid state", "Column order, widths, hidden columns, pinned columns, filters, sort, page, side panels, selected cell, and selected range."],
  ["Safe repro data", "Columns and sampled rows are sanitized so functions become readable placeholders instead of breaking JSON export."],
  ["Action timeline", "Recent row changes, undo/redo, filters, sort, pagination, saved views, and save attempts are recorded."],
  ["React snippet", "The exported JSON includes a generated React component that can be pasted into a repro app."],
];

export function Diagnostics() {
  const theme = useAppTheme();
  const apiRef = useRef<GridNexaApi<IncidentRow> | null>(null);
  const [repro, setRepro] = useState<GridNexaReproSnapshot<IncidentRow> | null>(null);

  return (
    <div className="showcase-page">
      <section className="showcase-hero">
        <div>
          <span className="eyebrow">Advanced diagnostics</span>
          <h2>Export a useful grid bug report in one click</h2>
          <p>
            Repro Recorder captures runtime counts, current grid state, recent actions, sampled data, and a generated
            React example so integration bugs are easier to reproduce outside the host app.
          </p>
        </div>
      </section>

      <section className="spotlight-grid">
        {snapshotItems.map(([title, text]) => (
          <article className="spotlight-card" key={title}>
            <i className="bi bi-bug" />
            <strong>{title}</strong>
            <span>{text}</span>
          </article>
        ))}
      </section>

      <div className="example-grid">
        <DemoCard
          title="Live repro recorder"
          description="Try editing a cell, sorting, filtering, paging, undoing, then open Diagnostics and export the snapshot."
          action={
            <button className="btn btn-primary btn-sm" type="button" onClick={() => apiRef.current?.exportDiagnostics()}>
              Export via API
            </button>
          }
        >
          <GridNexa
            apiRef={apiRef}
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            theme={theme}
            preset="admin"
            pageSize={3}
            commandPalette
            changeReview
            diagnostics={{
              recorder: true,
              exportRepro: true,
              maxEvents: 40,
              rowSampleSize: 50,
              fileName: "gridnexa-issue-repro.json",
            }}
            toolbar={{
              quickFilter: true,
              filters: true,
              undoRedo: true,
              addRow: true,
              deleteRow: true,
              saveAll: true,
            }}
            createRow={(): IncidentRow => ({
              id: Date.now(),
              issue: "New integration issue",
              owner: "UI Platform",
              severity: "Medium",
              status: "Open",
              impact: 50,
            })}
          />
        </DemoCard>

        <DemoCard title="Enable diagnostics" description="Opt in per grid and tune the event buffer, row sample, and downloaded file name.">
          <CodeViewer code={diagnosticsCode} />
        </DemoCard>

        <DemoCard title="Export from your own UI" description="Use the GridNexa API when you want a custom report button outside the grid toolbar.">
          <CodeViewer code={apiCode} />
        </DemoCard>

        <DemoCard title="Import repro JSON from your own UI" description="Use a normal file input when you want to load an exported GridNexa repro outside the built-in toolbar import.">
          <input
            className="form-control mb-3"
            type="file"
            accept=".json,application/json"
            onChange={async (event) => {
              const file = event.target.files?.[0];

              if (!file) return;

              setRepro(JSON.parse(await file.text()));
              event.currentTarget.value = "";
            }}
          />

          {repro ? (
            <GridNexa repro={repro} theme={theme} />
          ) : (
            <p>Select a repro JSON file</p>
          )}

          <CodeViewer code={importReproCode} />
        </DemoCard>
      </div>
    </div>
  );
}
