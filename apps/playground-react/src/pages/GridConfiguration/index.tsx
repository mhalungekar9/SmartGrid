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

const textCode = `<GridNexa
  columns={[
    { id: "notes", field: "notes", headerName: "Notes", textDisplay: { overflow: "ellipsis", showTooltip: true } },
    { id: "notesWrap", field: "notes", headerName: "Wrapped notes", textDisplay: { overflow: "wrap" } },
    { id: "notesClip", field: "notes", headerName: "Clipped notes", textDisplay: { overflow: "clip" } }
  ]}
  rows={rows}
/>`;

export function GridConfiguration() {
  const theme = useAppTheme();
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

      <div className="example-grid">
        <DemoCard title="Toolbar tools" description="Enable save, undo/redo, filters, exports, find, fill, add row, and delete row with one object.">
          <GridNexa columns={columns} rows={rows} theme={theme} checkboxSelection toolbar={{ saveAll: true, undoRedo: true, filters: true, advancedFilter: true, columnSelector: true, quickFilter: true, exportCsv: true, exportExcel: true, prevNextPage: true, find: true, columns: true, fill: true, addRow: true, deleteRow: true, deleteSelectedRows: true }} createRow={rowFactory} />
          <CodeViewer code={toolbarCode} />
        </DemoCard>

        <DemoCard title="Column tools" description="Use columnTools for defaults, then override individual columns with tools.">
          <GridNexa columns={customToolColumns as Column<ConfigRow>[]} rows={rows} theme={theme} columnTools={{ sort: true, filter: true, filterPanel: true, menu: true, resize: true, pin: true, hide: true, autosize: true }} />
          <CodeViewer code={columnToolsCode} />
        </DemoCard>

        <DemoCard title="Hide and show header buttons" description="Disable sort, filter, filter-panel, menu, resize, pin, hide, or auto-size globally or per column.">
          <GridNexa
            columns={customToolColumns as Column<ConfigRow>[]}
            rows={rows}
            theme={theme}
            columnTools={{ sort: true, filter: true, filterPanel: true, menu: true, resize: true }}
          />
          <CodeViewer code={columnToolsCode} />
        </DemoCard>

        <DemoCard title="Filters and sorting" description="Set column filter metadata and sortable columns, then use header controls or toolbar panels.">
          <GridNexa columns={columns} rows={rows} theme={theme} toolbar={{ filters: true, advancedFilter: true }} columnFilters={{ score: { type: "number", operator: "gte", value: 85 } }} />
          <CodeViewer code={`<GridNexa columns={columns} rows={rows} toolbar={{ filters: true, advancedFilter: true }} columnFilters={{ score: { type: "number", operator: "gte", value: 85 } }} />`} />
        </DemoCard>

        <DemoCard title="Column menu" description="Menu, pinning, hide, auto-size, sort, and filter menu actions can be enabled or disabled per column.">
          <GridNexa columns={columns} rows={rows} theme={theme} columnTools={{ menu: true, pin: true, hide: true, autosize: true, sort: true, filter: true, filterPanel: true, resize: true }} />
          <CodeViewer code={columnToolsCode} />
        </DemoCard>

        <DemoCard title="Height and scrollbar" description="Set height to keep the header and body aligned inside one scroll container.">
          <GridNexa columns={columns} rows={[...rows, ...rows, ...rows]} theme={theme} height={260} />
          <CodeViewer code={heightCode} />
        </DemoCard>

        <DemoCard title="Add and delete rows" description="Toolbar actions and API methods support adding a row, deleting one row, and deleting selected rows.">
          <GridNexa columns={columns} rows={rows} theme={theme} checkboxSelection toolbar={{ addRow: true, deleteRow: true, deleteSelectedRows: true }} createRow={rowFactory} onRowAdd={(event) => console.info("Row added", event)} onRowDelete={(event) => console.info("Row deleted", event)} onRowsDelete={(event) => console.info("Rows deleted", event)} onDataChange={(event) => console.info("Data changed", event)} />
          <CodeViewer code={rowActionsCode} />
        </DemoCard>

        <DemoCard title="Custom icons" description="Pass React nodes or icon components for sort, filter, menu, tree, add, delete, pagination, and other grid icons.">
          <GridNexa columns={customIconColumns} rows={rows} theme={theme} icons={{ sortAsc: "A+", sortDesc: "Z+", filter: "F", menu: "...", addRow: "+", deleteRow: "-", pagePrevious: "<", pageNext: ">" }} toolbar={{ addRow: true, deleteRow: true, prevNextPage: true }} pageSize={3} createRow={rowFactory} />
          <CodeViewer code={iconsCode} />
        </DemoCard>

        <DemoCard title="Footer configuration" description="Choose which footer facts appear and keep pagination in the footer.">
          <GridNexa columns={columns} rows={rows} theme={theme} checkboxSelection pageSize={3} footer={{ rowCount: true, selectedRows: true, selectedCell: true, selectedRange: false, filterCount: true, sortStatus: true, pagination: true }} />
          <CodeViewer code={footerCode} />
        </DemoCard>

        <DemoCard title="Custom footer" description="Replace the built-in footer content with your own renderer.">
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

        <DemoCard title="Edge popover positioning" description="Toolbar popovers shift into view when opened near the left or right edge.">
          <div style={{ width: 430, maxWidth: "100%" }}>
            <GridNexa columns={columns.slice(0, 4)} rows={rows} theme={theme} toolbar={{ advancedFilter: true, filters: true, columns: true }} />
          </div>
          <CodeViewer code={edgePopoverCode} />
        </DemoCard>

        <DemoCard title="CSS customization" description="Override colors through CSS variables and target stable classes such as sg-toolbar-button and sg-header-cell.">
          <div className="my-grid">
            <GridNexa columns={columns} rows={rows} theme={theme} toolbar={{ quickFilter: true }} />
          </div>
          <CodeViewer code={cssCode} />
        </DemoCard>

        <DemoCard title="Auto column width" description="Omit width to estimate from header and cell content; width, minWidth, and maxWidth remain respected.">
          <GridNexa columns={columns.map(({ width, ...column }) => column)} rows={rows} theme={theme} />
          <CodeViewer code={widthCode} />
        </DemoCard>

        <DemoCard title="Ellipsis, tooltip, wrap, and clip" description="Control large text globally with textDisplay or per column with column.textDisplay.">
          <GridNexa columns={textColumns} rows={rows} theme={theme} />
          <CodeViewer code={textCode} />
        </DemoCard>
      </div>
    </div>
  );
}
