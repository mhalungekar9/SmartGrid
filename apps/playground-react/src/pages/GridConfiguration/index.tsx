import { useMemo, useState } from "react";
import { GridNexa, type Column } from "@gridnexa/react";
import { DemoCard } from "../../components/DemoCard";
import { CodeViewer } from "../../components/CodeViewer";
import { useAppTheme } from "../../hooks/useTheme";

interface ConfigRow {
  id: number;
  name: string;
  department: string;
  city: string;
  notes: string;
  score: number;
  active: boolean;
}

const rows: ConfigRow[] = [
  {
    id: 1,
    name: "John Carter",
    department: "Operations",
    city: "London",
    notes: "Long operational note that demonstrates ellipsis, wrap, and clip display modes.",
    score: 92,
    active: true,
  },
  {
    id: 2,
    name: "Jane Smith",
    department: "Marketing",
    city: "Paris",
    notes: "Campaign planning copy with enough text to overflow a compact cell.",
    score: 85,
    active: true,
  },
  {
    id: 3,
    name: "Michael Johnson",
    department: "Sales",
    city: "New York",
    notes: "Enterprise sales handoff requiring a longer multiline description.",
    score: 78,
    active: false,
  },
  {
    id: 4,
    name: "Emily Davis",
    department: "Finance",
    city: "Berlin",
    notes: "Quarterly planning and review notes for finance stakeholders.",
    score: 95,
    active: true,
  },
  {
    id: 5,
    name: "David Wilson",
    department: "IT",
    city: "Toronto",
    notes: "Infrastructure upgrade details and rollout reminders.",
    score: 88,
    active: true,
  },
];

const columns: Column<ConfigRow>[] = [
  { id: "name", field: "name", headerName: "Name", minWidth: 170, sortable: true, filter: "text", editable: true },
  { id: "department", field: "department", headerName: "Department", width: 180, sortable: true, filter: "set" },
  { id: "city", field: "city", headerName: "City", width: 150, sortable: true, filter: "set" },
  { id: "notes", field: "notes", headerName: "Notes", minWidth: 220 },
  { id: "score", field: "score", headerName: "Score", width: 120, sortable: true, filter: "number" },
  { id: "active", field: "active", headerName: "Active", width: 120, sortable: true, filter: "set", valueFormatter: (value) => (value ? "Yes" : "No") },
];

const toolbarCode = `<GridNexa
  columns={columns}
  rows={rows}
  toolbar={{
    saveAll: true,
    undoRedo: true,
    filters: true,
    advancedFilter: true,
    columnSelector: true,
    quickFilter: true,
    exportCsv: true,
    exportExcel: true,
    prevNextPage: true,
    find: true,
    columns: true,
    fill: true,
    addRow: true,
    deleteRow: true,
    deleteSelectedRows: true
  }}
/>`;

const presetCode = `<GridNexa columns={columns} rows={rows} preset="admin" />;

<GridNexa columns={columns} rows={rows} preset="spreadsheet" />;

<GridNexa columns={columns} rows={rows} preset="analytics" />;`;

const stateStorageCode = `<GridNexa
  columns={columns}
  rows={rows}
  preset="admin"
  stateStorage={{
    key: "employees-grid",
    type: "localStorage"
  }}
/>`;

const overlaysCode = `<GridNexa
  columns={columns}
  rows={rows}
  loading={isLoading}
  error={error}
  emptyState="No employees found"
/>`;

const externalAppCode = `import { GridNexa, type Column } from "@gridnexa/react";
import "@gridnexa/react/index.css";

const columns: Column<Employee>[] = [
  { id: "name", field: "name", headerName: "Name" },
  { id: "department", field: "department", headerName: "Department" },
  { id: "score", field: "score", headerName: "Score" }
];

<GridNexa
  columns={columns}
  rows={rows}
  rowNumbers
  checkboxSelection
  onColumnMoved={(event) => console.info("Column moved", event)}
/>;

// The CSS import keeps header layout, drag handles, drop indicators,
// popovers, pinned columns, and scrollbars aligned in installed apps.`;

const columnToolsCode = `<GridNexa
  columns={[
    { id: "name", field: "name", headerName: "Name", tools: { menu: false } },
    { id: "score", field: "score", headerName: "Score", tools: { filter: false } }
  ]}
  rows={rows}
  columnTools={{
    sort: true,
    filter: true,
    filterPanel: true,
    menu: true,
    resize: true,
    pin: true,
    hide: true,
    autosize: true
  }}
/>`;

const sidePanelCode = `<GridNexa
  columns={columns}
  rows={rows}
  sidePanel={{
    columns: true,
    pivot: true,
    filters: true,
    defaultActivePanel: "columns"
  }}
/>`;

const sidePanelDisabledCode = `<GridNexa
  columns={columns}
  rows={rows}
  sidePanel={false}
/>;

<GridNexa
  columns={columns}
  rows={rows}
  sidePanel={{ enabled: false }}
/>`;

const sidePanelFiltersOnlyCode = `<GridNexa
  columns={columns}
  rows={rows}
  sidePanel={{
    columns: false,
    pivot: false,
    filters: true,
    defaultActivePanel: "filters"
  }}
/>`;

const sidePanelColumnsOnlyCode = `<GridNexa
  columns={columns}
  rows={rows}
  sidePanel={{
    columns: true,
    pivot: true,
    filters: false,
    defaultActivePanel: "pivot"
  }}
/>`;

const sidePanelResponsiveCode = `<div style={{ width: 390, maxWidth: "100%" }}>
  <GridNexa
    columns={columns}
    rows={rows}
    sidePanel={{ columns: true, pivot: true, filters: true }}
    height={320}
  />
</div>`;

const heightCode = `<GridNexa
  columns={columns}
  rows={rows}
  height={260}
/>`;

const rowActionsCode = `const apiRef = useRef<GridNexaApi<Employee> | null>(null);

<GridNexa
  columns={columns}
  rows={rows}
  checkboxSelection
  toolbar={{ addRow: true, deleteRow: true, deleteSelectedRows: true }}
  createRow={() => ({ id: Date.now(), name: "New row", score: 0 })}
  apiRef={apiRef}
  onRowAdd={(event) => console.info(event)}
  onRowDelete={(event) => console.info(event)}
  onRowsDelete={(event) => console.info(event)}
  onDataChange={(event) => console.info(event)}
/>`;

const iconsCode = `<GridNexa
  columns={columns}
  rows={rows}
  icons={{
    sortAsc: <MySortAscIcon />,
    sortDesc: <MySortDescIcon />,
    filter: <MyFilterIcon />,
    menu: <MyMenuIcon />,
    treeExpand: <MyExpandIcon />,
    treeCollapse: <MyCollapseIcon />,
    addRow: <MyAddIcon />,
    deleteRow: <MyDeleteIcon />
  }}
/>`;

const footerCode = `<GridNexa
  columns={columns}
  rows={rows}
  pageSize={3}
  footer={{
    rowCount: true,
    selectedRows: true,
    selectedCell: true,
    selectedRange: false,
    filterCount: true,
    sortStatus: true,
    pagination: true
  }}
/>`;

const summariesCode = `<GridNexa
  columns={columns}
  rows={rows}
  enableRangeSelection
  summaries={{
    footer: true,
    selectedRange: true
  }}
/>`;

const summariesExternalSetupCode = `import { GridNexa } from "@gridnexa/react";
import "@gridnexa/react/index.css";

<GridNexa
  columns={columns}
  rows={rows}
  enableRangeSelection
  summaries={{ footer: true, selectedRange: true }}
/>;`;

const summariesNextJsCode = `"use client";

import { GridNexa } from "@gridnexa/react";
import "@gridnexa/react/index.css";

export default function EmployeesGrid() {
  return (
    <GridNexa
      columns={columns}
      rows={rows}
      enableRangeSelection
      summaries={{ footer: true, selectedRange: true }}
    />
  );
}`;

const productivityLayerCode = `<GridNexa
  columns={columns}
  rows={rows}
  views={{ key: "employees-grid-views" }}
  commandPalette
  changeReview
  validation={{
    blockSave: true,
    rules: {
      name: { required: true, message: "Name is required" },
      score: { type: "number", min: 70, max: 100 }
    }
  }}
  diagnostics
/>`;

const savedViewsCode = `<GridNexa
  columns={columns}
  rows={rows}
  preset="admin"
  views={{
    key: "employees-grid-views",
    storage: "localStorage",
    allowUserViews: true
  }}
/>`;

const commandPaletteCode = `<GridNexa
  columns={columns}
  rows={rows}
  commandPalette
  toolbar={{ quickFilter: true, filters: true, columns: true, exportCsv: true }}
/>

// Press Ctrl+K / Cmd+K to open commands.`;

const changeReviewCode = `<GridNexa
  columns={columns}
  rows={rows}
  changeReview
  toolbar={{ addRow: true, deleteRow: true, saveAll: true }}
/>`;

const validationCode = `<GridNexa
  columns={columns}
  rows={rows}
  validation={{
    blockSave: true,
    showSummary: true,
    rules: {
      name: { required: true, message: "Name is required" },
      score: { type: "number", min: 70, max: 100 }
    }
  }}
/>`;

const diagnosticsCode = `<GridNexa
  columns={columns}
  rows={rows}
  diagnostics={{
    recorder: true,
    exportRepro: true,
    rowSampleSize: 50
  }}
  commandPalette
/>`;

const productivityExternalSetupCode = `import { GridNexa } from "@gridnexa/react";
import "@gridnexa/react/index.css";

<GridNexa
  columns={columns}
  rows={rows}
  views={{ key: "employees-grid-views" }}
  commandPalette
  changeReview
  validation={{ rules: { name: { required: true } } }}
  diagnostics
/>;`;

const productivityNextJsCode = `"use client";

import { GridNexa } from "@gridnexa/react";
import "@gridnexa/react/index.css";

export default function EmployeesGrid() {
  return (
    <GridNexa
      columns={columns}
      rows={rows}
      views={{ key: "employees-grid-views" }}
      commandPalette
      changeReview
      validation={{ rules: { name: { required: true } } }}
      diagnostics
    />
  );
}`;

const customFooterCode = `<GridNexa
  columns={columns}
  rows={rows}
  footer={{
    renderer: ({ rowCountLabel, selectedRowsLabel, sortStatusLabel }) => (
      <div className="custom-footer">
        <strong>{rowCountLabel}</strong>
        <span>{selectedRowsLabel}</span>
        <span>{sortStatusLabel}</span>
      </div>
    )
  }}
/>`;

const edgePopoverCode = `<GridNexa
  columns={columns}
  rows={rows}
  toolbar={{
    advancedFilter: true,
    filters: true,
    columns: true
  }}
/>`;

const cssCode = `.my-grid {
  --gnx-header-bg: #f8fafc;
  --gnx-bg: #ffffff;
  --gnx-panel: #ffffff;
  --gnx-border: #cbd8ea;
  --gnx-primary: #2563eb;
  --gnx-row-hover: #eff6ff;
}

.my-grid .sg-toolbar-button {
  border-radius: 6px;
}`;

const widthCode = `<GridNexa
  columns={[
    { id: "name", field: "name", headerName: "Employee full name", minWidth: 160 },
    { id: "department", field: "department", headerName: "Department" },
    { id: "score", field: "score", headerName: "Score", width: 120 }
  ]}
  rows={rows}
/>`;

const fixedWidthCode = `<GridNexa
  columns={[
    { id: "name", field: "name", headerName: "Name", width: 170 },
    { id: "department", field: "department", headerName: "Department", width: 170 },
    { id: "score", field: "score", headerName: "Score", width: 110 }
  ]}
  rows={rows}
  fillWidth={false}
/>`;

const fillWidthCode = `<GridNexa
  columns={columns}
  rows={rows}
  fillWidth
/>;

<GridNexa
  columns={columns}
  rows={rows}
  fillWidth={{ enabled: true, mode: "flexOrLast" }}
/>`;

const flexWidthCode = `<GridNexa
  columns={[
    { id: "name", field: "name", headerName: "Name", width: 170 },
    { id: "department", field: "department", headerName: "Department", flex: 1, minWidth: 180 },
    { id: "notes", field: "notes", headerName: "Notes", flex: 2, minWidth: 220 }
  ]}
  rows={rows}
  fillWidth={{ enabled: true, mode: "flex" }}
/>`;

const lastColumnFillCode = `<GridNexa
  columns={[
    { id: "name", field: "name", headerName: "Name", width: 170 },
    { id: "department", field: "department", headerName: "Department", width: 170 },
    { id: "notes", field: "notes", headerName: "Notes", minWidth: 220 }
  ]}
  rows={rows}
  fillWidth={{ enabled: true, mode: "lastColumn" }}
/>`;

const textCode = `<GridNexa
  columns={[
    { id: "notes", field: "notes", headerName: "Notes", textDisplay: { overflow: "ellipsis", showTooltip: true } },
    { id: "notesWrap", field: "notes", headerName: "Wrapped notes", textDisplay: { overflow: "wrap" } },
    { id: "notesClip", field: "notes", headerName: "Clipped notes", textDisplay: { overflow: "clip" } }
  ]}
  rows={rows}
/>`;

const configurationSections = [
  { id: "grid-presets", name: "Grid presets", type: "GridNexaPreset", description: "Prebuilt behavior profiles for basic, admin, spreadsheet, and analytics grids." },
  { id: "state-persistence", name: "State persistence and saved views", type: "GridNexaStateStorageOptions", description: "Persist column, filter, sort, pagination, and side-panel state with one storage key." },
  { id: "built-in-overlays", name: "Built-in overlays", type: "loading | error | emptyState", description: "Render loading, error, and empty states inside the grid viewport." },
  { id: "external-react-app-setup", name: "External React app setup", type: "CSS import", description: "Keep installed apps visually aligned with the playground by importing the package stylesheet." },
  { id: "toolbar-tools", name: "Toolbar tools", type: "GridNexaToolbarOptions", description: "Enable quick filter, find, filters, exports, fill, save, add row, and delete actions." },
  { id: "column-tools", name: "Column tools", type: "GridNexaColumnToolOptions", description: "Control sort, filter, menu, resize, pin, hide, and auto-size globally or per column." },
  { id: "right-side-tools", name: "Right-side tools", type: "GridNexaSidePanelOptions", description: "Configure Columns/Pivot and Filters panels, including the default open tab." },
  { id: "disable-side-panel", name: "Disable side panel", type: "false | { enabled: false }", description: "Remove the right-side tools when your product owns those controls elsewhere." },
  { id: "filters-only-side-panel", name: "Filters-only side panel", type: "GridNexaSidePanelOptions", description: "Show only the Filters tab and optionally open it by default." },
  { id: "columns-and-pivot-only", name: "Columns and Pivot only", type: "GridNexaSidePanelOptions", description: "Show column visibility and pivot controls without the Filters tab." },
  { id: "mobile-and-tablet-side-panel", name: "Mobile and tablet side panel", type: "Responsive sidePanel", description: "Validate compact behavior where side tools become horizontal tabs and bottom-sheet panels." },
  { id: "hide-and-show-header-buttons", name: "Hide and show header buttons", type: "columnTools | column.tools", description: "Hide individual header controls globally or on specific columns." },
  { id: "filters-and-sorting", name: "Filters and sorting", type: "columnFilters | sortable", description: "Configure filter metadata, active filters, and sortable columns." },
  { id: "column-menu", name: "Column menu", type: "columnTools.menu", description: "Enable menu actions for sort, filter, pin, hide, and auto-size." },
  { id: "height-and-scrollbar", name: "Height and scrollbar", type: "height", description: "Set a fixed grid height so body rows scroll while columns stay aligned." },
  { id: "add-and-delete-rows", name: "Add and delete rows", type: "createRow | GridNexaApi", description: "Add one row, delete one row, delete selected rows, and listen for data changes." },
  { id: "custom-icons", name: "Custom icons", type: "GridNexaIconSet", description: "Replace default header, menu, tree, pagination, add, and delete icons." },
  { id: "footer-configuration", name: "Footer configuration", type: "GridNexaFooterOptions", description: "Choose footer labels and keep pagination controls in the footer." },
  { id: "column-range-summaries", name: "Column and range summaries", type: "GridNexaSummaryOptions", description: "Show count, sum, average, min, and max for visible data or selected ranges." },
  { id: "productivity-layer", name: "Productivity layer", type: "views | commandPalette | changeReview | validation | diagnostics", description: "Opt into saved views, command search, change review, validation, and diagnostics together." },
  { id: "saved-views-switcher", name: "Saved views switcher", type: "GridNexaSavedViewsOptions", description: "Let users save and restore column, filter, sort, pagination, and panel state." },
  { id: "command-palette", name: "Command palette", type: "GridNexaCommandPaletteOptions", description: "Expose common grid actions through a searchable keyboard-first launcher." },
  { id: "change-review-mode", name: "Change review mode", type: "GridNexaChangeReviewOptions", description: "Review edits, row additions, and row deletions before save." },
  { id: "validation-layer", name: "Validation layer", type: "GridNexaValidationOptions", description: "Mark invalid cells and optionally block Save All until issues are fixed." },
  { id: "developer-diagnostics", name: "Developer diagnostics", type: "GridNexaDiagnosticsOptions", description: "Show practical runtime counts for debugging grid state during integration." },
  { id: "custom-footer", name: "Custom footer", type: "footer.renderer", description: "Render your own footer UI from GridNexa footer state." },
  { id: "edge-popover-positioning", name: "Edge popover positioning", type: "Popover collision handling", description: "Verify toolbar popovers shift into view near container edges." },
  { id: "css-customization", name: "CSS customization", type: "CSS variables | classNames", description: "Override colors and component styles with variables and stable class names." },
  { id: "auto-column-width", name: "Auto column width", type: "width | minWidth | maxWidth", description: "Omit width to estimate from headers and sample cell content." },
  { id: "fixed-columns-without-fake-blank-space", name: "Fixed columns without fake blank space", type: "fillWidth={false}", description: "Stop the grid at real column width without painting a misleading blank column." },
  { id: "fill-remaining-width", name: "Fill remaining width", type: "fillWidth", description: "Let real columns occupy remaining container width." },
  { id: "flex-columns", name: "Flex columns", type: "column.flex", description: "Distribute extra width across columns with flex values." },
  { id: "last-column-fills-remaining-width", name: "Last column fills remaining width", type: "fillWidth.mode", description: "Let the final visible data column absorb leftover space." },
  { id: "text-display", name: "Ellipsis, tooltip, wrap, and clip", type: "textDisplay", description: "Control large cell text with ellipsis, hover title, wrapping, or clipping." },
];

const presetDefinitions = [
  {
    name: "basic",
    description: "Clean read-only table defaults.",
    config: { toolbar: false, footer: true, sidePanel: false, fillWidth: true },
  },
  {
    name: "admin",
    description: "CRUD-heavy internal tooling defaults.",
    config: {
      rowNumbers: true,
      checkboxSelection: true,
      rangeSelection: true,
      undoRedo: true,
      toolbar: "quick filter, find, filters, advanced filter, columns, exports, save, add row, delete selected",
      footer: true,
      sidePanel: "columns, pivot, filters",
      fillWidth: true,
    },
  },
  {
    name: "spreadsheet",
    description: "Excel-like editing and fill workflows.",
    config: {
      rowNumbers: true,
      checkboxSelection: true,
      rangeSelection: true,
      fillHandle: true,
      undoRedo: true,
      rowReorder: true,
      toolbar: "quick filter, find, undo/redo, fill, add row, delete selected, exports",
      footer: true,
      sidePanel: "columns and filters",
      fillWidth: true,
    },
  },
  {
    name: "analytics",
    description: "Reporting, pivoting, and exploration defaults.",
    config: {
      rowNumbers: true,
      toolbar: "summary, quick filter, filters, advanced filter, columns, exports",
      footer: true,
      sidePanel: "columns, pivot, filters; columns open by default",
      fillWidth: true,
    },
  },
] as const;

const presetComparisonRows = [
  { key: "rowNumbers", label: "Row numbers" },
  { key: "checkboxSelection", label: "Checkbox selection" },
  { key: "rangeSelection", label: "Range selection" },
  { key: "fillHandle", label: "Fill handle" },
  { key: "undoRedo", label: "Undo/redo" },
  { key: "rowReorder", label: "Row reorder" },
  { key: "toolbar", label: "Toolbar tools" },
  { key: "footer", label: "Footer" },
  { key: "sidePanel", label: "Side panel" },
  { key: "fillWidth", label: "Fill width" },
] as const;

function formatPresetValue(value: unknown) {
  if (value === true) return "Enabled";
  if (value === false) return "Disabled";
  if (value == null) return "Default";
  return String(value);
}

export function GridConfiguration() {
  const theme = useAppTheme();
  const [configSearch, setConfigSearch] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(configurationSections[0].id);
  const filteredSections = useMemo(() => {
    const query = configSearch.trim().toLowerCase();
    if (!query) return configurationSections;
    return configurationSections.filter((section) =>
      [section.name, section.type, section.description].some((value) => value.toLowerCase().includes(query)),
    );
  }, [configSearch]);
  const sectionProps = (id: string) => ({
    id,
    className: activeSectionId === id ? "config-section-active" : undefined,
    onMouseEnter: () => setActiveSectionId(id),
  });
  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const rowFactory = () => ({
    id: Date.now(),
    name: "New row",
    department: "Operations",
    city: "London",
    notes: "Added from toolbar",
    score: 0,
    active: true,
  });
  const customToolColumns = columns.map((column) =>
    column.id === "name"
      ? { ...column, tools: { menu: false, filterPanel: false } }
      : column.id === "score"
        ? { ...column, tools: { filter: false, sort: false } }
        : column,
  );
  const customIconColumns = columns.map((column) =>
    column.id === "name"
      ? { ...column, icons: { sortAsc: "N↑", sortDesc: "N↓", filter: "NF", menu: "NM" } }
      : column,
  ) as Column<ConfigRow>[];
  const textColumns = [
    { ...columns[0], width: 170 },
    { ...columns[3], width: 210, textDisplay: { overflow: "ellipsis", showTooltip: true } },
    { ...columns[3], id: "notesWrap", headerName: "Wrapped notes", width: 240, textDisplay: { overflow: "wrap" } },
  ] as Column<ConfigRow>[];
  const fixedWidthColumns = [
    { ...columns[0], width: 170 },
    { ...columns[1], width: 170 },
    { ...columns[4], width: 110 },
  ] as Column<ConfigRow>[];
  const flexColumns = [
    { ...columns[0], width: 170 },
    { ...columns[1], flex: 1, minWidth: 180, width: undefined },
    { ...columns[3], flex: 2, minWidth: 220, width: undefined },
  ] as Column<ConfigRow>[];
  const lastFillColumns = [
    { ...columns[0], width: 170 },
    { ...columns[1], width: 170 },
    { ...columns[3], minWidth: 220, width: undefined },
  ] as Column<ConfigRow>[];

  return (
    <div className="example-page">
      <div className="page-title">
        <span className="eyebrow">Configuration</span>
        <h2>Grid Configuration</h2>
        <p>Enable only the UI your app needs, customize icons and CSS, and keep layout predictable with height, width, and text display options.</p>
      </div>

      <div className="detail-grid">
        <div className="detail-card"><i className="bi bi-sliders" /><span>Toolbar tools are opt-in when a toolbar object is provided.</span></div>
        <div className="detail-card"><i className="bi bi-layout-three-columns" /><span>Column tools support grid defaults and per-column overrides.</span></div>
        <div className="detail-card"><i className="bi bi-palette" /><span>CSS variables and class names keep styling override-friendly.</span></div>
      </div>

      <section className="config-doc-panel" aria-labelledby="config-index-title">
        <div className="config-doc-panel-header">
          <div>
            <span className="eyebrow">Navigation</span>
            <h3 id="config-index-title">Configuration index</h3>
            <p>Search the configuration surface, then jump directly to the live example. The active demo is highlighted as you navigate.</p>
          </div>
          <label className="config-search">
            <span>Search</span>
            <input
              type="search"
              value={configSearch}
              onChange={(event) => setConfigSearch(event.target.value)}
              placeholder="toolbar, preset, footer..."
            />
          </label>
        </div>
        <div className="config-table-wrap">
          <table className="config-index-table">
            <thead>
              <tr>
                <th>Configuration Name</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredSections.map((section) => (
                <tr key={section.id} className={activeSectionId === section.id ? "is-active" : undefined}>
                  <td>
                    <button type="button" onClick={() => scrollToSection(section.id)}>
                      {section.name}
                    </button>
                  </td>
                  <td><code>{section.type}</code></td>
                  <td>{section.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="config-doc-panel" aria-labelledby="preset-comparison-title">
        <div className="config-doc-panel-header">
          <div>
            <span className="eyebrow">Presets</span>
            <h3 id="preset-comparison-title">Preset comparison</h3>
            <p>Preset columns are generated from one preset definition list, so adding a future preset to the docs model automatically adds it here.</p>
          </div>
        </div>
        <div className="preset-card-grid">
          {presetDefinitions.map((preset) => (
            <article key={preset.name} className="preset-summary-card">
              <strong>{preset.name}</strong>
              <span>{preset.description}</span>
            </article>
          ))}
        </div>
        <div className="config-table-wrap">
          <table className="preset-comparison-table">
            <thead>
              <tr>
                <th>Feature / Tool</th>
                {presetDefinitions.map((preset) => (
                  <th key={preset.name}>{preset.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {presetComparisonRows.map((row) => (
                <tr key={row.key}>
                  <th>{row.label}</th>
                  {presetDefinitions.map((preset) => {
                    const value = preset.config[row.key as keyof typeof preset.config];
                    const formatted = formatPresetValue(value);
                    return (
                      <td key={preset.name} data-state={formatted === "Enabled" ? "enabled" : formatted === "Disabled" ? "disabled" : "custom"}>
                        {formatted}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="example-grid">
        <DemoCard {...sectionProps("grid-presets")} title="Grid presets" description="Presets turn on sensible defaults for common app types while preserving every explicit prop you pass.">
          <GridNexa columns={columns} rows={rows} theme={theme} preset="admin" />
          <CodeViewer code={presetCode} />
        </DemoCard>

        <DemoCard {...sectionProps("state-persistence")} title="State persistence and saved views" description="Persist grid UI state only. Default View is always available, and named views store their own column order, widths, filters, sorting, pagination, and side-panel state.">
          <GridNexa
            columns={columns}
            rows={rows}
            theme={theme}
            preset="admin"
            stateStorage={{ key: "gridnexa-playground-config", type: "localStorage" }}
          />
          <CodeViewer code={stateStorageCode} />
        </DemoCard>

        <DemoCard {...sectionProps("built-in-overlays")} title="Built-in overlays" description="Use loading, error, and emptyState for product-ready grid states without custom wrappers.">
          <GridNexa columns={columns} rows={[]} theme={theme} emptyState="No employees found" />
          <CodeViewer code={overlaysCode} />
        </DemoCard>

        <DemoCard {...sectionProps("external-react-app-setup")} title="External React app setup" description="Import the package CSS in installed apps so drag handles, drop indicators, header layout, popovers, and pinned columns render exactly like the playground.">
          <GridNexa
            columns={columns}
            rows={rows}
            theme={theme}
            rowNumbers
            checkboxSelection
            onColumnMoved={(event) => console.info("Column moved", event)}
          />
          <CodeViewer code={externalAppCode} />
        </DemoCard>

        <DemoCard {...sectionProps("toolbar-tools")} title="Toolbar tools" description="Enable save, undo/redo, filters, exports, find, fill, add row, and delete row with one object.">
          <GridNexa columns={columns} rows={rows} theme={theme} checkboxSelection toolbar={{ saveAll: true, undoRedo: true, filters: true, advancedFilter: true, columnSelector: true, quickFilter: true, exportCsv: true, exportExcel: true, prevNextPage: true, find: true, columns: true, fill: true, addRow: true, deleteRow: true, deleteSelectedRows: true }} createRow={rowFactory} />
          <CodeViewer code={toolbarCode} />
        </DemoCard>

        <DemoCard {...sectionProps("column-tools")} title="Column tools" description="Use columnTools for defaults, then override individual columns with tools.">
          <GridNexa columns={customToolColumns as Column<ConfigRow>[]} rows={rows} theme={theme} columnTools={{ sort: true, filter: true, filterPanel: true, menu: true, resize: true, pin: true, hide: true, autosize: true }} />
          <CodeViewer code={columnToolsCode} />
        </DemoCard>

        <DemoCard {...sectionProps("right-side-tools")} title="Right-side tools" description="Configure the Columns/Pivot and Filters side tools globally and choose a default open panel.">
          <GridNexa columns={columns} rows={rows} theme={theme} sidePanel={{ columns: true, pivot: true, filters: true, defaultActivePanel: "columns" }} />
          <CodeViewer code={sidePanelCode} />
        </DemoCard>

        <DemoCard {...sectionProps("disable-side-panel")} title="Disable side panel" description="Hide the entire right-side tools rail when your app provides its own column or filter controls.">
          <GridNexa columns={columns} rows={rows} theme={theme} sidePanel={false} />
          <CodeViewer code={sidePanelDisabledCode} />
        </DemoCard>

        <DemoCard {...sectionProps("filters-only-side-panel")} title="Filters-only side panel" description="Show only the Filters tab and open it by default.">
          <GridNexa columns={columns} rows={rows} theme={theme} sidePanel={{ columns: false, pivot: false, filters: true, defaultActivePanel: "filters" }} />
          <CodeViewer code={sidePanelFiltersOnlyCode} />
        </DemoCard>

        <DemoCard {...sectionProps("columns-and-pivot-only")} title="Columns and Pivot only" description="Show column visibility and pivot controls without the side Filters tab.">
          <GridNexa columns={columns} rows={rows} theme={theme} sidePanel={{ columns: true, pivot: true, filters: false, defaultActivePanel: "pivot" }} />
          <CodeViewer code={sidePanelColumnsOnlyCode} />
        </DemoCard>

        <DemoCard {...sectionProps("mobile-and-tablet-side-panel")} title="Mobile and tablet side panel" description="At compact widths the side tools become horizontal tabs and the open panel behaves like a bottom sheet.">
          <div style={{ width: 390, maxWidth: "100%" }}>
            <GridNexa columns={columns} rows={rows} theme={theme} sidePanel={{ columns: true, pivot: true, filters: true }} height={320} />
          </div>
          <CodeViewer code={sidePanelResponsiveCode} />
        </DemoCard>

        <DemoCard {...sectionProps("hide-and-show-header-buttons")} title="Hide and show header buttons" description="Disable sort, filter, filter-panel, menu, resize, pin, hide, or auto-size globally or per column.">
          <GridNexa
            columns={customToolColumns as Column<ConfigRow>[]}
            rows={rows}
            theme={theme}
            columnTools={{ sort: true, filter: true, filterPanel: true, menu: true, resize: true }}
          />
          <CodeViewer code={columnToolsCode} />
        </DemoCard>

        <DemoCard {...sectionProps("filters-and-sorting")} title="Filters and sorting" description="Set column filter metadata and sortable columns, then use header controls or toolbar panels.">
          <GridNexa columns={columns} rows={rows} theme={theme} toolbar={{ filters: true, advancedFilter: true }} columnFilters={{ score: { type: "number", operator: "gte", value: 85 } }} />
          <CodeViewer code={`<GridNexa columns={columns} rows={rows} toolbar={{ filters: true, advancedFilter: true }} columnFilters={{ score: { type: "number", operator: "gte", value: 85 } }} />`} />
        </DemoCard>

        <DemoCard {...sectionProps("column-menu")} title="Column menu" description="Menu, pinning, hide, auto-size, sort, and filter menu actions can be enabled or disabled per column.">
          <GridNexa columns={columns} rows={rows} theme={theme} columnTools={{ menu: true, pin: true, hide: true, autosize: true, sort: true, filter: true, filterPanel: true, resize: true }} />
          <CodeViewer code={columnToolsCode} />
        </DemoCard>

        <DemoCard {...sectionProps("height-and-scrollbar")} title="Height and scrollbar" description="Set height to keep the header and body aligned inside one scroll container.">
          <GridNexa columns={columns} rows={[...rows, ...rows, ...rows]} theme={theme} height={260} />
          <CodeViewer code={heightCode} />
        </DemoCard>

        <DemoCard {...sectionProps("add-and-delete-rows")} title="Add and delete rows" description="Toolbar actions and API methods support adding a row, deleting one row, and deleting selected rows.">
          <GridNexa columns={columns} rows={rows} theme={theme} checkboxSelection toolbar={{ addRow: true, deleteRow: true, deleteSelectedRows: true }} createRow={rowFactory} onRowAdd={(event) => console.info("Row added", event)} onRowDelete={(event) => console.info("Row deleted", event)} onRowsDelete={(event) => console.info("Rows deleted", event)} onDataChange={(event) => console.info("Data changed", event)} />
          <CodeViewer code={rowActionsCode} />
        </DemoCard>

        <DemoCard {...sectionProps("custom-icons")} title="Custom icons" description="Pass React nodes or icon components for sort, filter, menu, tree, add, delete, pagination, and other grid icons.">
          <GridNexa columns={customIconColumns} rows={rows} theme={theme} icons={{ sortAsc: "A+", sortDesc: "Z+", filter: "F", menu: "...", addRow: "+", deleteRow: "-", pagePrevious: "<", pageNext: ">" }} toolbar={{ addRow: true, deleteRow: true, prevNextPage: true }} pageSize={3} createRow={rowFactory} />
          <CodeViewer code={iconsCode} />
        </DemoCard>

        <DemoCard {...sectionProps("footer-configuration")} title="Footer configuration" description="Choose which footer facts appear and keep pagination in the footer.">
          <GridNexa columns={columns} rows={rows} theme={theme} checkboxSelection pageSize={3} footer={{ rowCount: true, selectedRows: true, selectedCell: true, selectedRange: false, filterCount: true, sortStatus: true, pagination: true }} />
          <CodeViewer code={footerCode} />
        </DemoCard>

        <DemoCard {...sectionProps("column-range-summaries")} title="Column and range summaries" description="Show count, sum, average, minimum, and maximum for visible numeric data and selected ranges.">
          <GridNexa
            columns={columns}
            rows={rows}
            theme={theme}
            enableRangeSelection
            summaries={{ footer: true, selectedRange: true }}
          />
          <CodeViewer code={summariesCode} />
          <div className="developer-docs-grid">
            <article className="developer-doc-card">
              <span className="eyebrow">When to use</span>
              <p>Use summaries when users need spreadsheet-style feedback while comparing numeric columns, validating totals, or checking a selected range before export.</p>
            </article>
            <article className="developer-doc-card">
              <span className="eyebrow">Common mistakes</span>
              <ul>
                <li>Enable range selection when using selected range summaries.</li>
                <li>Keep the footer visible; summaries render in the footer area.</li>
                <li>Only numeric values are summarized; text cells are ignored.</li>
              </ul>
            </article>
            <article className="developer-doc-card developer-doc-card--wide">
              <span className="eyebrow">External app setup</span>
              <CodeViewer code={summariesExternalSetupCode} />
            </article>
            <article className="developer-doc-card developer-doc-card--wide">
              <span className="eyebrow">Next.js example</span>
              <CodeViewer code={summariesNextJsCode} />
            </article>
          </div>
        </DemoCard>

        <DemoCard {...sectionProps("productivity-layer")} title="Productivity layer" description="Enable the premium workflow layer when users need repeatable views, keyboard actions, validation, review, and integration diagnostics.">
          <GridNexa
            columns={columns}
            rows={rows}
            theme={theme}
            rowNumbers
            checkboxSelection
            toolbar={{ saveAll: true, addRow: true, deleteSelectedRows: true, filters: true, columns: true, exportCsv: true }}
            views={{ key: "gridnexa-productivity-demo" }}
            commandPalette
            changeReview
            validation={{ blockSave: true, rules: { name: { required: true }, score: { type: "number", min: 70, max: 100 } } }}
            diagnostics
            createRow={rowFactory}
          />
          <CodeViewer code={productivityLayerCode} />
          <div className="developer-docs-grid">
            <article className="developer-doc-card">
              <span className="eyebrow">When to use</span>
              <p>Use this layer for admin tools, internal operations, spreadsheet-style review screens, or any grid where users repeatedly shape the same data and need confidence before saving.</p>
            </article>
            <article className="developer-doc-card">
              <span className="eyebrow">Common mistakes</span>
              <ul>
                <li>Use a stable storage key per grid, not one shared key for unrelated screens.</li>
                <li>Keep validation rules lightweight; expensive async checks belong in your save workflow.</li>
                <li>Import the package CSS in external apps so panels and invalid cell styles render correctly.</li>
              </ul>
            </article>
            <article className="developer-doc-card developer-doc-card--wide">
              <span className="eyebrow">External app setup</span>
              <CodeViewer code={productivityExternalSetupCode} />
            </article>
            <article className="developer-doc-card developer-doc-card--wide">
              <span className="eyebrow">Next.js example</span>
              <CodeViewer code={productivityNextJsCode} />
            </article>
          </div>
        </DemoCard>

        <DemoCard {...sectionProps("saved-views-switcher")} title="Saved views switcher" description="Save a named view from the toolbar, update the same view by saving with the same name, or return to Default View to restore the original layout. Row data is not stored.">
          <GridNexa columns={columns} rows={rows} theme={theme} preset="admin" views={{ key: "gridnexa-view-switcher-demo" }} />
          <CodeViewer code={savedViewsCode} />
        </DemoCard>

        <DemoCard {...sectionProps("command-palette")} title="Command palette" description="Give power users a searchable action launcher for filters, exports, panels, views, review, and diagnostics.">
          <GridNexa columns={columns} rows={rows} theme={theme} commandPalette toolbar={{ quickFilter: true, filters: true, columns: true, exportCsv: true }} />
          <CodeViewer code={commandPaletteCode} />
        </DemoCard>

        <DemoCard {...sectionProps("change-review-mode")} title="Change review mode" description="Track edits, row additions, and row deletions so users can inspect what changed before Save All.">
          <GridNexa columns={columns} rows={rows} theme={theme} changeReview toolbar={{ addRow: true, deleteRow: true, saveAll: true }} createRow={rowFactory} />
          <CodeViewer code={changeReviewCode} />
        </DemoCard>

        <DemoCard {...sectionProps("validation-layer")} title="Validation layer" description="Highlight invalid cells, summarize issues, and optionally block Save All until data is corrected.">
          <GridNexa
            columns={columns}
            rows={[{ ...rows[0], name: "", score: 102 }, ...rows.slice(1)]}
            theme={theme}
            toolbar={{ saveAll: true }}
            validation={{ blockSave: true, showSummary: true, rules: { name: { required: true, message: "Name is required" }, score: { type: "number", min: 70, max: 100 } } }}
          />
          <CodeViewer code={validationCode} />
        </DemoCard>

        <DemoCard {...sectionProps("developer-diagnostics")} title="Developer diagnostics" description="Inspect runtime counts, record recent grid actions, and export a compact repro snapshot for bug reports.">
          <GridNexa columns={columns} rows={rows} theme={theme} diagnostics={{ recorder: true, exportRepro: true, rowSampleSize: 50 }} commandPalette />
          <CodeViewer code={diagnosticsCode} />
        </DemoCard>

        <DemoCard {...sectionProps("custom-footer")} title="Custom footer" description="Replace the built-in footer content with your own renderer.">
          <GridNexa
            columns={columns}
            rows={rows}
            theme={theme}
            footer={{
              renderer: ({ rowCountLabel, selectedRowsLabel, sortStatusLabel }) => (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <strong>{rowCountLabel}</strong>
                  <span>{selectedRowsLabel}</span>
                  <span>{sortStatusLabel}</span>
                </div>
              ),
            }}
          />
          <CodeViewer code={customFooterCode} />
        </DemoCard>

        <DemoCard {...sectionProps("edge-popover-positioning")} title="Edge popover positioning" description="Toolbar popovers shift into view when opened near the left or right edge.">
          <div style={{ width: 430, maxWidth: "100%" }}>
            <GridNexa columns={columns.slice(0, 4)} rows={rows} theme={theme} toolbar={{ advancedFilter: true, filters: true, columns: true }} />
          </div>
          <CodeViewer code={edgePopoverCode} />
        </DemoCard>

        <DemoCard {...sectionProps("css-customization")} title="CSS customization" description="Override colors through CSS variables and target stable classes such as sg-toolbar-button and sg-header-cell.">
          <div className="my-grid">
            <GridNexa columns={columns} rows={rows} theme={theme} toolbar={{ quickFilter: true }} />
          </div>
          <CodeViewer code={cssCode} />
        </DemoCard>

        <DemoCard {...sectionProps("auto-column-width")} title="Auto column width" description="Omit width to estimate from header and cell content; width, minWidth, and maxWidth remain respected.">
          <GridNexa columns={columns.map(({ width, ...column }) => column)} rows={rows} theme={theme} />
          <CodeViewer code={widthCode} />
        </DemoCard>

        <DemoCard {...sectionProps("fixed-columns-without-fake-blank-space")} title="Fixed columns without fake blank space" description="When fillWidth is false, the grid stops at the total real column width instead of painting a blank column.">
          <GridNexa columns={fixedWidthColumns} rows={rows} theme={theme} fillWidth={false} />
          <CodeViewer code={fixedWidthCode} />
        </DemoCard>

        <DemoCard {...sectionProps("fill-remaining-width")} title="Fill remaining width" description="Use fillWidth to let real columns occupy remaining container width.">
          <GridNexa columns={fixedWidthColumns} rows={rows} theme={theme} fillWidth />
          <CodeViewer code={fillWidthCode} />
        </DemoCard>

        <DemoCard {...sectionProps("flex-columns")} title="Flex columns" description="Set column.flex values and enable fillWidth to distribute extra width across those columns.">
          <GridNexa columns={flexColumns} rows={rows} theme={theme} fillWidth={{ enabled: true, mode: "flex" }} />
          <CodeViewer code={flexWidthCode} />
        </DemoCard>

        <DemoCard {...sectionProps("last-column-fills-remaining-width")} title="Last column fills remaining width" description="Use lastColumn mode when no flex column is configured but you want the final data column to absorb empty space.">
          <GridNexa columns={lastFillColumns} rows={rows} theme={theme} fillWidth={{ enabled: true, mode: "lastColumn" }} />
          <CodeViewer code={lastColumnFillCode} />
        </DemoCard>

        <DemoCard {...sectionProps("text-display")} title="Ellipsis, tooltip, wrap, and clip" description="Control large text globally with textDisplay or per column with column.textDisplay.">
          <GridNexa columns={textColumns} rows={rows} theme={theme} />
          <CodeViewer code={textCode} />
        </DemoCard>
      </div>
    </div>
  );
}
