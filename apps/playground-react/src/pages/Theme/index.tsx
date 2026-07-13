import { GridNexa, type Column, type GridNexaTheme } from "@gridnexa/react";
import { CodeViewer } from "../../components/CodeViewer";
import { DemoCard } from "../../components/DemoCard";

interface ThemePreviewRow {
  id: number;
  name: string;
  role: string;
  region: string;
  score: number;
}

const rows: ThemePreviewRow[] = [
  { id: 1, name: "Tony Smith", role: "Engineer", region: "EMEA", score: 92 },
  { id: 2, name: "Andrew Connell", role: "Design", region: "APAC", score: 86 },
  { id: 3, name: "Kevin Flanagan", role: "Finance", region: "Americas", score: 95 },
];

const columns: Column<ThemePreviewRow>[] = [
  {
    id: "name",
    field: "name",
    headerName: "Name",
    width: 170,
    pinned: "left",
    filter: "text",
    headerStyle: { fontWeight: 900 },
  },
  { id: "role", field: "role", headerName: "Role", width: 140, filter: "set" },
  { id: "region", field: "region", headerName: "Region", width: 130, filter: "set" },
  {
    id: "score",
    field: "score",
    headerName: "Score",
    width: 110,
    filter: "number",
    cellStyle: ({ value }) => ({
      fontWeight: 900,
      color: Number(value) >= 90 ? "var(--gnx-reviewed)" : "var(--gnx-text)",
    }),
  },
];

const themeCards: Array<{
  theme: GridNexaTheme;
  title: string;
  description: string;
  bestFor: string;
}> = [
  {
    theme: "modern-light",
    title: "Modern Light",
    description: "Clean white surface with blue actions and soft selected states.",
    bestFor: "SaaS dashboards, admin screens, reporting apps",
  },
  {
    theme: "modern-dark",
    title: "Modern Dark",
    description: "Deep panels, bright focus, and high readability in dark products.",
    bestFor: "Ops consoles, analytics tools, developer products",
  },
  {
    theme: "compact",
    title: "Compact",
    description: "Shorter rows and tighter spacing for dense workflows.",
    bestFor: "Back-office tools, CRMs, data review queues",
  },
  {
    theme: "minimal",
    title: "Minimal",
    description: "Flat borders, quiet contrast, and very low decoration.",
    bestFor: "Embedded tables, content tools, white-label products",
  },
  {
    theme: "enterprise",
    title: "Enterprise",
    description: "Structured headers, stronger borders, and a formal business feel.",
    bestFor: "Finance, HR, compliance, internal platforms",
  },
  {
    theme: "high-contrast",
    title: "High Contrast",
    description: "Maximum contrast tokens for visibility and accessibility checks.",
    bestFor: "Accessibility modes, support tools, low-vision users",
  },
];

const themeCode = `<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  theme="enterprise"
  density="compact"
  checkboxSelection
  rowNumbers
  toolbar={{ quickFilter: true, filters: true, columns: true }}
/>`;

const tokenCode = `<GridNexa
  columns={columns}
  rows={rows}
  theme="modern-light"
  styling={{
    tokens: {
      fontFamily: "Inter, system-ui, sans-serif",
      primaryColor: "#1d4ed8",
      headerBackground: "#dfeaff",
      selectedBackground: "#cfe0ff",
      rowHeight: 38,
      headerHeight: 42,
      cellPaddingInline: 10,
      borderRadius: 10
    },
    headerCell: {
      fontSize: 12,
      fontWeight: 900,
      textTransform: "uppercase"
    },
    selectedRow: {
      background: "#dbeafe",
      color: "#0f172a"
    },
    focusedCell: {
      borderColor: "#1d4ed8"
    }
  }}
/>`;

const columnCode = `const columns: Column<Employee>[] = [
  {
    id: "name",
    field: "name",
    headerName: "Employee",
    width: 220,
    headerStyle: {
      fontSize: 13,
      fontWeight: 900,
      color: "#0f172a",
      textAlign: "left",
      textTransform: "uppercase",
      iconSize: 14,
      height: 42
    },
    cellStyle: ({ row }) => ({
      fontWeight: row.active ? 700 : 500,
      color: row.active ? "#0f172a" : "#64748b"
    }),
    textDisplay: { overflow: "ellipsis", showTooltip: true }
  },
  {
    id: "notes",
    field: "notes",
    headerName: "Notes",
    minWidth: 240,
    textDisplay: { overflow: "wrap", lineClamp: 2 }
  }
];`;

const responsiveCode = `<GridNexa
  columns={columns}
  rows={rows}
  fillWidth={{ enabled: true, mode: "flex" }}
  textDisplay={{ overflow: "ellipsis", showTooltip: true }}
  toolbar={{
    quickFilter: true,
    filters: true,
    columns: true,
    prevNextPage: true
  }}
  footer={{ pagination: true, rowCount: true, selectedRows: true }}
/>`;

const tokenRows = [
  ["Theme", "`theme`", "Choose `modern-light`, `modern-dark`, `compact`, `minimal`, `enterprise`, `high-contrast`, `light`, `dark`, or `system`."],
  ["Density", "`density`", "Use `compact`, `standard`, or `comfortable` for row height and spacing presets."],
  ["Global tokens", "`styling.tokens`", "Override color, typography, spacing, row height, header height, radius, focus, hover, selected, and shadow tokens."],
  ["Slot styles", "`styling.headerCell`", "Target headers, rows, cells, toolbar, footer, side panel, filters, menus, pagination, selected row, and focused cell."],
  ["Column headers", "`column.headerStyle`", "Configure header font size, weight, color, alignment, transform, spacing, icon size, and height per column."],
  ["Column cells", "`column.cellStyle`", "Style a column statically or from row data with a callback."],
  ["Text display", "`textDisplay`", "Use `ellipsis`, `clip`, or `wrap`; configure globally and override per column."],
  ["Classes", "`classNames`", "Attach design-system classes to shell, toolbar, inputs, buttons, rows, cells, panels, and status bar."],
];

export function Theme() {
  return (
    <div className="example-page theme-guide-page">
      <div className="page-title">
        <span className="eyebrow">Design system</span>
        <h2>Themes & Styling</h2>
        <p>
          GridNexa has six production themes, density presets, typed design tokens,
          column-level header and cell styling, and responsive layouts that work across
          React, Vue, Angular, and Vanilla JavaScript.
        </p>
      </div>

      <div className="theme-hero-strip" aria-label="Theme summary">
        <span><strong>6</strong> built-in themes</span>
        <span><strong>3</strong> density presets</span>
        <span><strong>Typed</strong> style tokens</span>
        <span><strong>Global + column</strong> overrides</span>
      </div>

      <section className="theme-gallery" aria-label="Built-in theme previews">
        {themeCards.map((item) => (
          <article className="theme-preview-card" key={item.theme}>
            <div className="theme-preview-title">
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <code>{item.theme}</code>
            </div>
            <div className="theme-preview-grid">
              <GridNexa
                columns={columns}
                rows={rows}
                getRowId={(row) => row.id}
                theme={item.theme}
                density={item.theme === "compact" ? "compact" : "standard"}
                checkboxSelection
                rowNumbers
                pageSize={3}
                fillWidth={{ enabled: true, mode: "flex" }}
                toolbar={{ quickFilter: true }}
              />
            </div>
            <div className="theme-preview-meta">
              <span>Best for</span>
              <strong>{item.bestFor}</strong>
            </div>
          </article>
        ))}
      </section>

      <div className="example-grid theme-guide-examples">
        <DemoCard title="Choose a theme" description="Use the theme prop when you want a complete visual preset with matching tokens.">
          <CodeViewer code={themeCode} defaultOpen />
        </DemoCard>
        <DemoCard title="Override design tokens" description="Use styling.tokens for app-level color, typography, spacing, selected, and focus states.">
          <CodeViewer code={tokenCode} defaultOpen />
        </DemoCard>
        <DemoCard title="Style individual columns" description="Use headerStyle, cellStyle, and textDisplay when a column needs its own behavior.">
          <CodeViewer code={columnCode} defaultOpen />
        </DemoCard>
        <DemoCard title="Responsive setup" description="Use fillWidth, toolbar wrapping, footer pagination, and textDisplay together for flexible layouts.">
          <CodeViewer code={responsiveCode} defaultOpen />
        </DemoCard>
      </div>

      <DemoCard title="Configuration reference" description="A practical map of the styling API developers will reach for most often.">
        <div className="theme-reference-table" role="table" aria-label="Theme configuration reference">
          <div className="theme-reference-row theme-reference-row--head" role="row">
            <span role="columnheader">Need</span>
            <span role="columnheader">API</span>
            <span role="columnheader">Use it for</span>
          </div>
          {tokenRows.map(([need, api, purpose]) => (
            <div className="theme-reference-row" role="row" key={need}>
              <strong role="cell">{need}</strong>
              <code role="cell">{api.replaceAll("`", "")}</code>
              <span role="cell">{purpose.replaceAll("`", "")}</span>
            </div>
          ))}
        </div>
      </DemoCard>
    </div>
  );
}
