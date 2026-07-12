import { GridNexa, type Column } from "@gridnexa/react";
import { CodeViewer } from "../../components/CodeViewer";
import { DemoCard } from "../../components/DemoCard";
import { useAppTheme } from "../../hooks/useTheme";

interface RevenueRow {
  id: number;
  month: string;
  region: string;
  product: string;
  channel: string;
  revenue: number;
  margin: number;
  deals: number;
  churnRisk: number;
}

const rows: RevenueRow[] = [
  { id: 1, month: "Jan", region: "EMEA", product: "Platform", channel: "Direct", revenue: 184000, margin: 37, deals: 18, churnRisk: 12 },
  { id: 2, month: "Jan", region: "Americas", product: "Platform", channel: "Partner", revenue: 221000, margin: 34, deals: 22, churnRisk: 17 },
  { id: 3, month: "Feb", region: "APAC", product: "Analytics", channel: "Direct", revenue: 142000, margin: 41, deals: 16, churnRisk: 9 },
  { id: 4, month: "Feb", region: "EMEA", product: "Analytics", channel: "Partner", revenue: 96000, margin: 29, deals: 11, churnRisk: 24 },
  { id: 5, month: "Mar", region: "Americas", product: "Support", channel: "Direct", revenue: 78000, margin: 52, deals: 27, churnRisk: 7 },
  { id: 6, month: "Mar", region: "APAC", product: "Platform", channel: "Partner", revenue: 126000, margin: 31, deals: 14, churnRisk: 21 },
  { id: 7, month: "Apr", region: "EMEA", product: "Support", channel: "Direct", revenue: 88000, margin: 46, deals: 24, churnRisk: 10 },
  { id: 8, month: "Apr", region: "Americas", product: "Analytics", channel: "Partner", revenue: 168000, margin: 39, deals: 19, churnRisk: 14 },
  { id: 9, month: "May", region: "APAC", product: "Support", channel: "Direct", revenue: 104000, margin: 48, deals: 25, churnRisk: 8 },
  { id: 10, month: "May", region: "EMEA", product: "Platform", channel: "Partner", revenue: 192000, margin: 33, deals: 17, churnRisk: 18 },
];

const columns: Column<RevenueRow>[] = [
  { id: "month", field: "month", headerName: "Month", width: 110, filter: "set" },
  { id: "region", field: "region", headerName: "Region", width: 150, filter: "set" },
  { id: "product", field: "product", headerName: "Product", width: 160, filter: "set" },
  { id: "channel", field: "channel", headerName: "Channel", width: 150, filter: "set" },
  { id: "revenue", field: "revenue", headerName: "Revenue", width: 150, filter: "number", editable: true },
  { id: "margin", field: "margin", headerName: "Margin %", width: 130, filter: "number", editable: true },
  { id: "deals", field: "deals", headerName: "Deals", width: 120, filter: "number", editable: true },
  { id: "churnRisk", field: "churnRisk", headerName: "Churn risk", width: 140, filter: "number", editable: true },
];

const dashboardCode = `<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  preset="analytics"
  enableRangeSelection
  toolbar={{
    dashboard: true,
    charts: true,
    filters: true,
    quickFilter: true
  }}
  dashboard={{ showPanel: true, maxCards: 4, maxRows: 500 }}
  charts
/>

// Dashboard generation uses the current visible grid view.
// Filter rows, edit values, or replace rows, then open Dashboard again.
// GridNexa infers:
// - dimensions from text/set columns
// - measures from numeric columns
// - KPI cards from the first measures
// - dashboard charts from the first dimension and first measure
//
// charts enables the separate Insight Charts panel.
// It does not decide which charts appear inside the dashboard.`;

const dashboardRulesCode = `// Dashboard chart selection rule

const visibleRows = tableRows.slice(0, dashboard.maxRows);

const dimensions = columns.filter((column) =>
  visibleRows.some((row) => hasTextValue(row[column.field]))
);

const measures = columns.filter((column) =>
  visibleRows.some((row) => Number.isFinite(Number(row[column.field])))
);

const categoryColumn = dimensions[0];
const valueColumn = measures[0];

// Dashboard currently renders:
// 1. Bar chart: top category segments by visible row count
// 2. Line chart: first numeric measure total and average by category
// 3. KPI cards: visible row count plus first numeric measures

// In this demo:
// categoryColumn = "month"
// valueColumn = "revenue"`;

const configuredDashboardCode = `<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  preset="analytics"
  dashboard={{
    showPanel: true,
    maxCards: 4,
    maxRows: 500,
    charts: [
      { type: "bar", category: "region", value: "revenue", title: "Revenue by region" },
      { type: "line", category: "month", value: "revenue", title: "Revenue trend" },
      { type: "pie", category: "product", value: "deals", title: "Deals by product" }
    ]
  }}
  toolbar={{ dashboard: true, filters: true, quickFilter: true }}
/>`;

const multipleChartsCode = `<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  enableRangeSelection
  charts={{
    enabled: true,
    defaultType: "combo",
    types: [
      "bar",
      "line",
      "area",
      "pie",
      "donut",
      "scatter",
      "bubble",
      "radar",
      "radialBar",
      "histogram",
      "boxPlot",
      "treemap",
      "gauge",
      "funnel",
      "combo"
    ],
    source: "selection",
    maxRows: 500
  }}
  toolbar={{ charts: true, quickFilter: true, filters: true }}
/>`;

export function DashboardGenerator() {
  const theme = useAppTheme();

  return (
    <div className="showcase-page">
      <section className="showcase-hero">
        <div>
          <span className="eyebrow">Dashboard generator</span>
          <h2>Turn visible grid data into KPI cards and charts</h2>
          <p>
            GridNexa scans the current visible rows, detects dimensions and measures, then
            generates KPI cards, top-segment charts, measure comparisons, and plain-language insights.
          </p>
        </div>
      </section>

      <div className="detail-grid">
        <div className="detail-card"><i className="bi bi-filter" /><span>Dashboard output follows the active filters and quick search.</span></div>
        <div className="detail-card"><i className="bi bi-123" /><span>Numeric columns become measures for KPI cards and comparison charts.</span></div>
        <div className="detail-card"><i className="bi bi-tags" /><span>The first text/set column becomes the dashboard grouping dimension.</span></div>
        <div className="detail-card"><i className="bi bi-bar-chart-line" /><span>The dashboard renders fixed summary charts; the Charts panel is separate for user-selected chart types.</span></div>
      </div>

      <div className="example-grid">
        <DemoCard title="Generated dashboard from visible rows" description="Filter by region or product, edit numeric cells, then open Dashboard to regenerate KPIs and chart summaries from the current view.">
          <GridNexa
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            theme={theme}
            preset="analytics"
            enableRangeSelection
            dashboard={{ showPanel: true, maxCards: 4, maxRows: 500 }}
            charts
            toolbar={{ dashboard: true, charts: true, filters: true, quickFilter: true, copyPaste: true }}
          />
        </DemoCard>
        <DemoCard title="Dashboard generation code" description="Use the dashboard prop with the toolbar button. The generated panel reads the grid's visible rows.">
          <CodeViewer code={dashboardCode} />
        </DemoCard>
        <DemoCard title="How dashboard charts are chosen" description="The dashboard does not read chart types from the charts prop. It infers summary charts from the current visible rows.">
          <CodeViewer code={dashboardRulesCode} />
        </DemoCard>
        <DemoCard title="Configured dashboard charts" description="Provide dashboard.charts when you want exact dashboard charts instead of the default inferred pair.">
          <GridNexa
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            theme={theme}
            preset="analytics"
            dashboard={{
              showPanel: true,
              maxCards: 4,
              maxRows: 500,
              charts: [
                { type: "bar", category: "region", value: "revenue", title: "Revenue by region" },
                { type: "line", category: "month", value: "revenue", title: "Revenue trend" },
                { type: "pie", category: "product", value: "deals", title: "Deals by product" },
              ],
            }}
            toolbar={{ dashboard: true, filters: true, quickFilter: true }}
          />
        </DemoCard>
        <DemoCard title="Configured dashboard code" description="Use column ids or field names for category and value. The dashboard groups visible rows and sums the value column for each category.">
          <CodeViewer code={configuredDashboardCode} />
        </DemoCard>
        <DemoCard title="Multiple chart types" description="Enable Charts when users need to switch between bar, line, area, pie, scatter, statistical, funnel, gauge, and combo charts.">
          <GridNexa
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            theme={theme}
            preset="analytics"
            enableRangeSelection
            charts={{
              enabled: true,
              defaultType: "combo",
              types: ["bar", "line", "area", "pie", "donut", "scatter", "bubble", "radar", "radialBar", "histogram", "boxPlot", "treemap", "gauge", "funnel", "combo"],
              source: "selection",
              maxRows: 500,
            }}
            toolbar={{ charts: true, quickFilter: true, filters: true, copyPaste: true }}
          />
        </DemoCard>
        <DemoCard title="Multiple charts code" description="Select a range with one dimension and one or more numeric columns, then open Charts and switch chart types.">
          <CodeViewer code={multipleChartsCode} />
        </DemoCard>
      </div>
    </div>
  );
}
