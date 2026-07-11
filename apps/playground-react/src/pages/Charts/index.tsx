import { GridNexa, type Column } from "@gridnexa/react";
import { CodeViewer } from "../../components/CodeViewer";
import { DemoCard } from "../../components/DemoCard";
import { useAppTheme } from "../../hooks/useTheme";

interface RevenueRow {
  id: number;
  month: string;
  region: string;
  revenue: number;
  pipeline: number;
  conversion: number;
}

const rows: RevenueRow[] = [
  { id: 1, month: "Jan", region: "North", revenue: 124000, pipeline: 212000, conversion: 31 },
  { id: 2, month: "Feb", region: "North", revenue: 139000, pipeline: 226000, conversion: 34 },
  { id: 3, month: "Mar", region: "South", revenue: 118000, pipeline: 204000, conversion: 29 },
  { id: 4, month: "Apr", region: "West", revenue: 156000, pipeline: 248000, conversion: 37 },
  { id: 5, month: "May", region: "East", revenue: 142000, pipeline: 232000, conversion: 35 },
  { id: 6, month: "Jun", region: "West", revenue: 171000, pipeline: 268000, conversion: 39 },
];

const columns: Column<RevenueRow>[] = [
  { id: "month", field: "month", headerName: "Month", width: 120, filter: "set" },
  { id: "region", field: "region", headerName: "Region", width: 140, filter: "set" },
  { id: "revenue", field: "revenue", headerName: "Revenue", minWidth: 150, filter: "number", editable: true },
  { id: "pipeline", field: "pipeline", headerName: "Pipeline", minWidth: 150, filter: "number", editable: true },
  { id: "conversion", field: "conversion", headerName: "Conversion %", minWidth: 150, filter: "number", editable: true },
];

const basicChartsCode = `<GridNexa
  columns={columns}
  rows={rows}
  charts
/>

// Users can open Charts from the toolbar and download the chart as PNG.
// Select a range first to chart only that selection.`;

const toolbarChartsCode = `<GridNexa
  columns={columns}
  rows={rows}
  enableRangeSelection
  toolbar={{
    charts: true,
    quickFilter: true,
    filters: true,
    copyPaste: true,
    exportCsv: true,
    exportExcel: true
  }}
/>`;

const advancedChartsCode = `<GridNexa
  columns={columns}
  rows={rows}
  charts={{
    enabled: true,
    defaultType: "combo",
    types: ["bar", "line", "area", "pie", "donut", "scatter", "bubble", "radar", "radialBar", "histogram", "boxPlot", "treemap", "gauge", "funnel", "combo"],
    source: "selection",
    maxRows: 200
  }}
/>;
`;

export function Charts() {
  const theme = useAppTheme();

  return (
    <div className="example-page">
      <div className="page-title">
        <span className="eyebrow">Insights</span>
        <h2>Insight Charts</h2>
        <p>
          Turn selected grid data or visible rows into bar, line, area, pie, donut, scatter, bubble, radar, radial, histogram, box plot, treemap, gauge, funnel, and combo charts without manually wiring grid state into a chart library.
        </p>
      </div>

      <div className="detail-grid">
        <div className="detail-card"><i className="bi bi-bar-chart" /><span>Chart selected ranges or visible filtered rows.</span></div>
        <div className="detail-card"><i className="bi bi-pie-chart" /><span>Switch between statistical, hierarchical, polar, funnel, and combination charts.</span></div>
        <div className="detail-card"><i className="bi bi-download" /><span>Download the rendered chart as a PNG from the chart panel.</span></div>
        <div className="detail-card"><i className="bi bi-sliders" /><span>Auto-detect category and numeric value columns, then override them.</span></div>
      </div>

      <div className="example-grid">
        <DemoCard title="Charts from selected grid data" description="Select a range with a category and numeric column, then open Charts. If no range is selected, GridNexa charts visible rows.">
          <GridNexa
            columns={columns}
            rows={rows}
            theme={theme}
            rowNumbers
            enableRangeSelection
            charts
            toolbar={{ charts: true, quickFilter: true, filters: true, copyPaste: true }}
          />
          <CodeViewer code={basicChartsCode} />
        </DemoCard>

        <DemoCard title="Toolbar-only setup" description="Use toolbar.charts when you want chart access alongside normal grid tools.">
          <GridNexa
            columns={columns}
            rows={rows}
            theme={theme}
            enableRangeSelection
            toolbar={{
              charts: true,
              quickFilter: true,
              filters: true,
              copyPaste: true,
              exportCsv: true,
              exportExcel: true,
            }}
          />
          <CodeViewer code={toolbarChartsCode} />
        </DemoCard>

        <DemoCard title="Configured chart types" description="Restrict chart types, choose a default, and cap the number of visible rows used for charting.">
          <GridNexa
            columns={columns}
            rows={rows}
            theme={theme}
            charts={{
              enabled: true,
              defaultType: "combo",
              types: ["bar", "line", "area", "pie", "donut", "scatter", "bubble", "radar", "radialBar", "histogram", "boxPlot", "treemap", "gauge", "funnel", "combo"],
              source: "selection",
              maxRows: 200,
            }}
          />
          <CodeViewer code={advancedChartsCode} />
        </DemoCard>
      </div>
    </div>
  );
}
