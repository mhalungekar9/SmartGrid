import { GridNexa, type Column } from "@gridnexa/react";
import { ExampleLayout } from "../../components/ExampleLayout";
import { employees, type Employee } from "../../data/employees";

const styledColumns: Column<Employee>[] = [
  {
    id: "name",
    field: "name",
    headerName: "Name",
    width: 230,
    sortable: true,
    filter: "text",
    headerClassName: "text-primary fw-bold",
    headerStyle: {
      fontSize: 13,
      fontWeight: 900,
      textTransform: "uppercase",
      iconSize: 14,
    },
    cellClassName: "fw-semibold",
    textDisplay: { overflow: "ellipsis", showTooltip: true },
  },
  {
    id: "department",
    field: "department",
    headerName: "Department",
    width: 190,
    filter: "set",
    className: ({ row }) =>
      row.department === "Engineering"
        ? "gnx-cell-accent gnx-cell-accent--blue"
        : row.department === "Finance"
          ? "gnx-cell-accent gnx-cell-accent--green"
          : undefined,
    cellStyle: ({ row }) => ({
      fontWeight: row.department === "Engineering" ? 800 : 500,
    }),
  },
  {
    id: "city",
    field: "city",
    headerName: "City",
    width: 160,
    filter: "set",
  },
  {
    id: "region",
    field: "region",
    headerName: "Region",
    width: 130,
    headerClassName: "text-uppercase",
  },
  {
    id: "score",
    field: "score",
    headerName: "Score",
    width: 130,
    sortable: true,
    filter: "number",
    pinned: "right",
    cellClassName: ({ value }) =>
      Number(value) >= 90 ? "gnx-score-hot" : "gnx-score-normal",
    cellStyle: ({ value }) => ({
      color: Number(value) >= 90 ? "var(--gnx-reviewed)" : "var(--gnx-text)",
      fontWeight: Number(value) >= 90 ? 900 : 700,
    }),
  },
];

const stylingCode = `import { GridNexa, type Column } from "@gridnexa/react";
import "./gridnexa-overrides.scss";

interface Employee {
  id: number;
  name: string;
  department: string;
  city: string;
  region: string;
  score: number;
}

const columns: Column<Employee>[] = [
  {
    id: "name",
    field: "name",
    headerName: "Name",
    width: 230,
    headerStyle: {
      fontSize: 13,
      fontWeight: 900,
      textTransform: "uppercase",
      iconSize: 14,
    },
    headerClassName: "text-primary fw-bold",
    cellClassName: "fw-semibold",
    textDisplay: { overflow: "ellipsis", showTooltip: true },
  },
  {
    id: "department",
    field: "department",
    headerName: "Department",
    width: 190,
    className: ({ row }) =>
      row.department === "Engineering"
        ? "gnx-cell-accent gnx-cell-accent--blue"
        : row.department === "Finance"
          ? "gnx-cell-accent gnx-cell-accent--green"
          : undefined,
    cellStyle: ({ row }) => ({
      fontWeight: row.department === "Engineering" ? 800 : 500,
    }),
  },
  {
    id: "score",
    field: "score",
    headerName: "Score",
    width: 130,
    pinned: "right",
    cellClassName: ({ value }) =>
      Number(value) >= 90 ? "gnx-score-hot" : "gnx-score-normal",
    cellStyle: ({ value }) => ({
      color: Number(value) >= 90 ? "var(--gnx-reviewed)" : "var(--gnx-text)",
      fontWeight: Number(value) >= 90 ? 900 : 700,
    }),
  },
];

export function GridNexaStylingExample() {
  return (
    <GridNexa
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      theme="light"
      density="standard"
      styling={{
        tokens: {
          primaryColor: "#1d4ed8",
          selectedBackground: "#dbeafe",
          rowHeight: 40,
          headerHeight: 42,
          cellPaddingInline: 12
        },
        headerCell: { fontSize: 12, fontWeight: 900 },
        selectedRow: { background: "#dbeafe", color: "#0f172a" }
      }}
      className="orders-grid shadow-lg rounded-3"
      classNames={{
        toolbar: "border rounded-3 bg-white",
        button: "btn btn-sm",
        input: "form-control form-control-sm",
        headerCell: "align-items-center",
        row: "custom-row-transition",
        cell: "custom-cell",
        statusBar: "small",
      }}
      getRowClassName={({ row, selected }) =>
        selected
          ? "table-primary"
          : row.active
            ? "gnx-row-active"
            : "gnx-row-muted"
      }
      getCellClassName={({ column, value }) =>
        column.id === "score" && Number(value) >= 90
          ? "text-success fw-bold"
          : undefined
      }
      getHeaderClassName={({ column }) =>
        column.pinned ? "gnx-header-pinned" : undefined
      }
    />
  );
}`;

export function StylingConfiguration() {
  return (
    <ExampleLayout
      title="Styling & Configuration"
      subtitle="Design system ready"
      overview="Attach Bootstrap, Tailwind, CSS Modules, SCSS, Less, or your own utility classes directly to the grid shell, slots, columns, rows, cells, and headers."
      details={[
        "Use className for the outer shell and classNames for common slots such as toolbar, inputs, buttons, rows, cells, panels, and status bar.",
        "Use column.headerClassName, column.cellClassName, or column.className for column-owned styling.",
        "Use styling.tokens for global design tokens such as primary color, selected rows, header height, row height, and spacing.",
        "Use column.headerStyle and column.cellStyle for typed per-column visual overrides without writing CSS selectors.",
        "Use textDisplay globally or per column for ellipsis, clip, wrap, tooltips, line clamping, and responsive text behavior.",
        "Use getRowClassName, getCellClassName, and getHeaderClassName for data-aware styling rules.",
        "Use theme, density, CSS variables, or unstyled mode depending on how much control your design system needs.",
      ]}
      code={stylingCode}
    >
      <GridNexa
        columns={styledColumns}
        rows={employees}
        getRowId={(row) => row.id}
        pageSize={6}
        rowNumbers
        checkboxSelection
        theme="light"
        density="standard"
        styling={{
          tokens: {
            primaryColor: "#1d4ed8",
            selectedBackground: "#dbeafe",
            rowHeight: 40,
            headerHeight: 42,
            cellPaddingInline: 12,
          },
          headerCell: { fontSize: 12, fontWeight: 900 },
          selectedRow: { background: "#dbeafe", color: "#0f172a" },
        }}
        className="docs-styled-grid shadow-lg rounded-3"
        classNames={{
          toolbar: "docs-styled-toolbar border rounded-3",
          button: "docs-styled-button",
          input: "docs-styled-input",
          headerCell: "docs-styled-header-cell",
          row: "docs-styled-row",
          cell: "docs-styled-cell",
          statusBar: "docs-styled-status",
        }}
        getRowClassName={({ row, selected }) =>
          selected
            ? "docs-row-selected"
            : row.active
              ? "docs-row-active"
              : "docs-row-muted"
        }
        getCellClassName={({ column, value }) =>
          column.id === "score" && Number(value) >= 90
            ? "docs-score-strong"
            : undefined
        }
        getHeaderClassName={({ column }) =>
          column.pinned ? "docs-header-pinned" : undefined
        }
      />
    </ExampleLayout>
  );
}
