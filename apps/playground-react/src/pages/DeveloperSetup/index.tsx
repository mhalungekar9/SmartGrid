import { CodeViewer } from "../../components/CodeViewer";

const reactSetup = `npm install @gridnexa/react

import { GridNexa, type Column } from "@gridnexa/react";
import "@gridnexa/react/index.css";

export function EmployeesGrid() {
  return (
    <GridNexa
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      preset="admin"
    />
  );
}`;

const nextSetup = `"use client";

import { GridNexa } from "@gridnexa/react";
import "@gridnexa/react/index.css";

export default function EmployeesGrid() {
  return <GridNexa columns={columns} rows={rows} preset="spreadsheet" />;
}`;

const externalChecklist = [
  "Import @gridnexa/react/index.css once in the app entry or route layout.",
  "Keep column ids stable; views, resizing, sorting, filters, and reorder use ids.",
  "Use getRowId for selection, editing, saved views, and server-backed rows.",
  "Prefer presets first, then override toolbar, sidePanel, columnTools, footer, or fillWidth.",
  "Use views.key per screen, not one key shared across unrelated grids.",
];

export function DeveloperSetup() {
  return (
    <div className="showcase-page">
      <section className="showcase-hero">
        <div>
          <span className="eyebrow">Developer setup</span>
          <h2>Install once, then grow from simple grid to product workflow</h2>
          <p>
            The playground examples are structured around external-app reality: package CSS,
            stable row ids, copy-ready framework snippets, and predictable configuration.
          </p>
        </div>
      </section>

      <section className="setup-grid">
        <article className="setup-card setup-card--wide">
          <span className="eyebrow">React / Vite / CRA</span>
          <CodeViewer code={reactSetup} />
        </article>
        <article className="setup-card setup-card--wide">
          <span className="eyebrow">Next.js App Router</span>
          <CodeViewer code={nextSetup} />
        </article>
        <article className="setup-card">
          <span className="eyebrow">External app checklist</span>
          <ul className="setup-checklist">
            {externalChecklist.map((item) => (
              <li key={item}>
                <i className="bi bi-check2-circle" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="setup-card">
          <span className="eyebrow">Recommended path</span>
          <ol className="setup-steps">
            <li>Start with `preset="basic"` or `preset="admin"`.</li>
            <li>Add `height`, `fillWidth`, and `getRowId`.</li>
            <li>Enable toolbar, side panel, and footer tools by workflow.</li>
            <li>Add saved views, validation, and diagnostics only where users benefit.</li>
          </ol>
        </article>
      </section>
    </div>
  );
}
