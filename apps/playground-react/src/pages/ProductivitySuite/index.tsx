import { GridNexa, type Column } from "@gridnexa/react";
import { CodeViewer } from "../../components/CodeViewer";
import { DemoCard } from "../../components/DemoCard";
import { useAppTheme } from "../../hooks/useTheme";

interface ProductRow {
  id: number;
  name: string;
  owner: string;
  status: string;
  score: number;
}

const rows: ProductRow[] = [
  { id: 1, name: "Renewal queue", owner: "Operations", status: "Ready", score: 92 },
  { id: 2, name: "Pipeline cleanup", owner: "Sales", status: "Review", score: 81 },
  { id: 3, name: "Risk export", owner: "Finance", status: "Blocked", score: 68 },
  { id: 4, name: "Support triage", owner: "Support", status: "Ready", score: 88 },
  { id: 5, name: "Regional dashboard", owner: "Analytics", status: "Review", score: 95 },
];

const columns: Column<ProductRow>[] = [
  { id: "name", field: "name", headerName: "Workflow", minWidth: 190, editable: true, filter: "text" },
  { id: "owner", field: "owner", headerName: "Owner", width: 160, filter: "set" },
  { id: "status", field: "status", headerName: "Status", width: 140, filter: "set" },
  { id: "score", field: "score", headerName: "Health", width: 120, filter: "number", editable: true },
];

const code = `<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  preset="admin"
  views={{ key: "ops-workflows-views" }}
  commandPalette
  changeReview
  validation={{
    blockSave: true,
    rules: {
      name: { required: true },
      score: { type: "number", min: 70, max: 100 }
    }
  }}
  diagnostics
/>`;

const capabilities = [
  ["bi-lightning-charge", "Saved views", "Users can save and switch layouts without your app wiring custom state."],
  ["bi-lightning-charge", "Command palette", "Ctrl+K / Cmd+K makes actions discoverable for power users."],
  ["bi-lightning-charge", "Change review", "Edits, row additions, and deletes are visible before Save All."],
  ["bi-lightning-charge", "Validation", "Invalid cells are highlighted and Save All can be blocked."],
  ["bi-lightning-charge", "Diagnostics", "Developers can inspect runtime counts while integrating."],
];

export function ProductivitySuite() {
  const theme = useAppTheme();

  return (
    <div className="showcase-page">
      <section className="showcase-hero">
        <div>
          <span className="eyebrow">Productivity suite</span>
          <h2>The workflows developers normally build around a grid</h2>
          <p>
            Saved views, command search, review, validation, and diagnostics are first-class
            opt-in behaviors, so application teams ship polished data tools faster.
          </p>
        </div>
      </section>

      <section className="productivity-card-grid" aria-label="Productivity suite features">
        {capabilities.map(([icon, title, text]) => (
          <article className="productivity-card" key={title}>
            <span className="productivity-card-icon">
              <i className={`bi ${icon}`} />
            </span>
            <strong>{title}</strong>
            <span>{text}</span>
          </article>
        ))}
      </section>

      <div className="example-grid">
        <DemoCard title="Live productivity grid" description="Try Save view, Commands, Review, Diagnostics, and invalid score highlighting.">
          <GridNexa
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            theme={theme}
            preset="admin"
            views={{ key: "gridnexa-productivity-suite" }}
            commandPalette
            changeReview
            validation={{ blockSave: true, rules: { name: { required: true }, score: { type: "number", min: 70, max: 100 } } }}
            diagnostics
            createRow={() => ({ id: Date.now(), name: "New workflow", owner: "Operations", status: "Review", score: 0 })}
          />
        </DemoCard>
        <DemoCard title="Copy this" description="One focused setup for app-grade grid workflows.">
          <CodeViewer code={code} />
        </DemoCard>
      </div>
    </div>
  );
}
