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

const productivitySetup = `import { GridNexa } from "@gridnexa/react";
import "@gridnexa/react/index.css";

<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  preset="admin"
  views={{ key: "employees-grid-views" }}
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
/>;`;

const collaborationSetup = `const provider = {
  subscribe(handler) {
    socket.on("grid-cell-event", handler);
    return () => socket.off("grid-cell-event", handler);
  },
  publish(event) {
    socket.emit("grid-cell-event", event);
  }
};

<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  collaboration={{
    user: { id: user.id, name: user.name, color: "#22c55e" },
    provider,
    showPresence: true,
    conflictMode: "cell-lock"
  }}
/>;`;

const productivityNextSetup = `"use client";

import { GridNexa } from "@gridnexa/react";
import "@gridnexa/react/index.css";

export default function EmployeesGrid() {
  return (
    <GridNexa
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      preset="admin"
      views={{ key: "employees-grid-views" }}
      commandPalette
      changeReview
      validation={{ rules: { name: { required: true } } }}
      diagnostics
    />
  );
}`;

const externalChecklist = [
  "Import @gridnexa/react/index.css once in the app entry or route layout.",
  "Keep column ids stable; views, resizing, sorting, filters, and reorder use ids.",
  "Use getRowId for selection, editing, saved views, and server-backed rows.",
  "Prefer presets first, then override toolbar, sidePanel, columnTools, footer, or fillWidth.",
  "Use views.key per screen, not one key shared across unrelated grids.",
];

const productivityChecklist = [
  "Use preset=\"admin\" as the base for internal productivity tools.",
  "Enable views, commandPalette, changeReview, validation, and diagnostics together for app-grade workflows.",
  "Keep validation rules synchronous and lightweight; run expensive checks in your save flow.",
  "Turn on toolbar save and row actions when changeReview is part of the workflow.",
  "Use diagnostics while integrating, then keep recorder/export options for support-heavy screens.",
  "Use collaboration.provider when realtime edits, presence, or cell locks come from your backend.",
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
        <article className="setup-card setup-card--wide">
          <span className="eyebrow">Productivity suite</span>
          <CodeViewer code={productivitySetup} />
        </article>
        <article className="setup-card setup-card--wide">
          <span className="eyebrow">Productivity suite for Next.js</span>
          <CodeViewer code={productivityNextSetup} />
        </article>
        <article className="setup-card setup-card--wide">
          <span className="eyebrow">Realtime collaboration</span>
          <CodeViewer code={collaborationSetup} />
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
          <span className="eyebrow">Productivity checklist</span>
          <ul className="setup-checklist">
            {productivityChecklist.map((item) => (
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
