import { useState } from "react";
import { GridNexa, type Column } from "@gridnexa/react";
import { CodeViewer } from "../../components/CodeViewer";
import { DemoCard } from "../../components/DemoCard";
import { useAppTheme } from "../../hooks/useTheme";

interface SheetRow {
  id: number;
  employee: string;
  department: string;
  region: string;
  score: number;
  active: boolean;
}

const initialRows: SheetRow[] = [
  { id: 1, employee: "John Carter", department: "Operations", region: "London", score: 92, active: true },
  { id: 2, employee: "Jane Smith", department: "Marketing", region: "Paris", score: 85, active: true },
  { id: 3, employee: "Michael Johnson", department: "Sales", region: "New York", score: 78, active: false },
  { id: 4, employee: "Emily Davis", department: "Finance", region: "Berlin", score: 95, active: true },
];

const columns: Column<SheetRow>[] = [
  { id: "employee", field: "employee", headerName: "Employee", minWidth: 180, editable: true, filter: "text" },
  { id: "department", field: "department", headerName: "Department", minWidth: 170, editable: true, filter: "set" },
  { id: "region", field: "region", headerName: "Region", minWidth: 150, editable: true, filter: "set" },
  { id: "score", field: "score", headerName: "Score", width: 120, editable: true, filter: "number", editor: "number" },
  { id: "active", field: "active", headerName: "Active", width: 120, editable: true, filter: "set", valueFormatter: (value) => (value ? "Yes" : "No") },
];

const importCode = `<GridNexa
  columns={columns}
  rows={rows}
  toolbar={{
    importData: true,
    copyPaste: true,
    bulkEdit: true,
    findReplace: true,
    quickFilter: true,
    find: true,
    undoRedo: true,
    exportCsv: true,
    exportExcel: true
  }}
/>

// Import data accepts:
// .xlsx, .xls, .csv, .tsv, .txt, .json
// Excel workbooks import the first worksheet.`;

const clipboardCode = `<GridNexa
  columns={columns}
  rows={rows}
  enableRangeSelection
  toolbar={{
    copyPaste: true,
    bulkEdit: true,
    findReplace: true,
    undoRedo: true
  }}
  onPaste={({ text }) => console.info("Pasted text", text)}
/>

// Copy and paste also work with Ctrl+C / Cmd+C and Ctrl+V / Cmd+V.
// Pasted Excel, CSV, TSV, and plain table text can update ranges and append rows.`;

const findReplaceCode = `<GridNexa
  columns={columns}
  rows={rows}
  toolbar={{
    find: true,
    findReplace: true,
    bulkEdit: true,
    undoRedo: true
  }}
/>`;

const jsonShapeCode = `[
  {
    "employee": "Ava Patel",
    "department": "Support",
    "region": "Mumbai",
    "score": 91,
    "active": true
  }
]

// Or:
{
  "rows": [
    { "employee": "Ava Patel", "department": "Support", "score": 91 }
  ]
}`;

export function DataImportClipboard() {
  const theme = useAppTheme();
  const [rows, setRows] = useState(initialRows);

  return (
    <div className="example-page">
      <div className="page-title">
        <span className="eyebrow">Data operations</span>
        <h2>Import, Clipboard, Bulk Edit, and Find Replace</h2>
        <p>
          Bring spreadsheet workflows into GridNexa: import CSV, Excel, TSV, text, or JSON; copy and paste ranges from Excel;
          bulk update selected cells; and replace values without leaving the grid.
        </p>
      </div>

      <div className="detail-grid">
        <div className="detail-card"><i className="bi bi-file-earmark-spreadsheet" /><span>Import .xlsx, .xls, .csv, .tsv, .txt, and .json files from the toolbar.</span></div>
        <div className="detail-card"><i className="bi bi-clipboard-check" /><span>Copy and paste Excel ranges through the browser Clipboard API.</span></div>
        <div className="detail-card"><i className="bi bi-magic" /><span>Imported columns auto-detect number, date, set, and text filters.</span></div>
      </div>

      <div className="example-grid">
        <DemoCard
          title="Import data from the toolbar"
          description="Click Import data and choose an Excel workbook, CSV, TSV, TXT, or JSON file. GridNexa builds columns from the first row and detects useful filter/editor types."
        >
          <GridNexa
            columns={columns}
            rows={rows}
            theme={theme}
            rowNumbers
            checkboxSelection
            enableRangeSelection
            onDataChange={(event) => setRows(event.rows)}
            toolbar={{
              importData: true,
              copyPaste: true,
              bulkEdit: true,
              findReplace: true,
              quickFilter: true,
              find: true,
              undoRedo: true,
              exportCsv: true,
              exportExcel: true,
            }}
          />
          <CodeViewer code={importCode} />
        </DemoCard>

        <DemoCard
          title="Copy and paste from Excel"
          description="Select a cell or range, then paste table data from Excel, CSV, TSV, or plain text. Overflow rows are appended automatically."
        >
          <GridNexa
            columns={columns}
            rows={initialRows}
            theme={theme}
            rowNumbers
            enableRangeSelection
            toolbar={{ copyPaste: true, bulkEdit: true, findReplace: true, undoRedo: true }}
            onPaste={(event) => console.info("Pasted into GridNexa", event.text)}
          />
          <CodeViewer code={clipboardCode} />
        </DemoCard>

        <DemoCard
          title="Bulk edit and find replace"
          description="Use Bulk edit for a selected range or selected rows in the active column. Use Replace for current match or all matching editable cells."
        >
          <GridNexa
            columns={columns}
            rows={initialRows}
            theme={theme}
            checkboxSelection
            enableRangeSelection
            toolbar={{ find: true, findReplace: true, bulkEdit: true, copyPaste: true, undoRedo: true }}
          />
          <CodeViewer code={findReplaceCode} />
        </DemoCard>

        <DemoCard title="JSON import shape" description="JSON import accepts an array of row objects or an object with a rows array. Fields are converted into editable columns.">
          <CodeViewer code={jsonShapeCode} />
        </DemoCard>
      </div>
    </div>
  );
}
