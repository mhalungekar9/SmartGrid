import { useEffect, useMemo, useState } from "react";
import { GridNexa, type Column, type MergedHeader } from "@gridnexa/react";
import { navigateTo } from "../../utils/navigation";

interface MarketRow {
  id: number;
  ticker: string;
  name: string;
  desk: string;
  trend: string;
  instrument: string;
  pnl: number;
  totalValue: number;
  risk: string;
}

const marketRows: MarketRow[] = [
  { id: 1, ticker: "US10Y", name: "Treasury 10-Year Bond", desk: "Rates", trend: "3,6,2,7,5,6,7,3", instrument: "Bond", pnl: 207.67, totalValue: 41227.02, risk: "Low" },
  { id: 2, ticker: "CAD30Y", name: "Canada 30-Year Gov Bond", desk: "Rates", trend: "6,3,5,6,7,5,2,3", instrument: "Bond", pnl: -19.4, totalValue: 13478.77, risk: "Medium" },
  { id: 3, ticker: "MUB", name: "National Muni Bond ETF", desk: "Funds", trend: "2,7,3,6,5,7,3,6", instrument: "ETF", pnl: -3.35, totalValue: 1868.06, risk: "Low" },
  { id: 4, ticker: "BTC-USD", name: "Bitcoin", desk: "Digital", trend: "7,2,7,3,6,5,7,2", instrument: "Crypto", pnl: 41.12, totalValue: 4851.6, risk: "High" },
  { id: 5, ticker: "NVDA", name: "NVIDIA Corp", desk: "Equity", trend: "3,5,6,7,7,6,5,7", instrument: "Stock", pnl: 128.92, totalValue: 9204.18, risk: "Medium" },
];

const marketColumns: Column<MarketRow>[] = [
  { id: "ticker", field: "ticker", headerName: "Ticker", width: 120, pinned: "left", sortable: true, filter: "text" },
  { id: "name", field: "name", headerName: "Position", width: 240, sortable: true, filter: "text" },
  { id: "desk", field: "desk", headerName: "Desk", width: 130, sortable: true, filter: "set" },
  {
    id: "trend",
    field: "trend",
    headerName: "Timeline",
    width: 180,
    cellRenderer: (value) => (
      <span className="market-bars">
        {String(value)
          .split(",")
          .map((height, index) => (
            <span key={`${height}-${index}`} style={{ height: `${Number(height) * 4}px` }} />
          ))}
      </span>
    ),
  },
  { id: "instrument", field: "instrument", headerName: "Instrument", width: 150, sortable: true, filter: "set" },
  {
    id: "pnl",
    field: "pnl",
    headerName: "P&L",
    width: 130,
    sortable: true,
    filter: "number",
    cellRenderer: (value) => {
      const amount = Number(value);
      return <span className={amount >= 0 ? "market-up" : "market-down"}>{amount >= 0 ? "+" : "-"}{Math.abs(amount).toLocaleString()}</span>;
    },
  },
  { id: "totalValue", field: "totalValue", headerName: "Total Value", width: 160, sortable: true, filter: "number", valueFormatter: (value) => `$${Number(value).toLocaleString()}` },
  { id: "risk", field: "risk", headerName: "Risk", width: 130, sortable: true, filter: "set" },
];

const mergedHeaders: MergedHeader[] = [
  { id: "position", headerName: "Position Intelligence", columnIds: ["ticker", "name", "desk"], align: "left" },
  { id: "market", headerName: "Market Movement", columnIds: ["trend", "instrument", "pnl", "totalValue"], align: "center" },
  { id: "risk", headerName: "Governance", columnIds: ["risk"], align: "center" },
];

const capabilities = [
  ["bi-front", "Merged headers", "Group related columns into clean Excel-style header bands."],
  ["bi-magic", "Formulas and fill", "Use calculated cells, fill handle flows, find, and undo/redo."],
  ["bi-funnel", "Advanced filtering", "Combine quick search, set filters, operators, and external predicates."],
  ["bi-arrow-left-right", "Drag interactions", "Reorder columns and rows with direct manipulation."],
  ["bi-bar-chart", "Pivot and group", "Summarize data with grouping, aggregations, pivoting, and tree rows."],
  ["bi-download", "Export-ready", "Ship CSV and Excel export from the grid toolbar."],
];

const demoCards = [
  ["Performance", "160 rows", "bi-speedometer2"],
  ["Finance", "Merged headers", "bi-graph-up-arrow"],
  ["Operations", "Grouping", "bi-diagram-3"],
  ["Inventory", "Filters", "bi-box-seam"],
];

export function Home() {
  const [rows, setRows] = useState(marketRows);
  const [pulse, setPulse] = useState(0);
  const liveVolume = useMemo(
    () => rows.reduce((total, row) => total + row.totalValue, 0),
    [rows],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPulse((current) => current + 1);
      setRows((currentRows) =>
        currentRows.map((row, index) => {
          const wave = Math.sin(Date.now() / 700 + index);
          const pnlDelta = Number((wave * (index + 1) * 1.7).toFixed(2));
          const nextTrend = row.trend
            .split(",")
            .slice(1)
            .concat(String(Math.max(2, Math.min(8, Math.round(5 + wave * 3)))))
            .join(",");

          return {
            ...row,
            pnl: Number((row.pnl + pnlDelta).toFixed(2)),
            totalValue: Number(Math.max(250, row.totalValue + pnlDelta * 18).toFixed(2)),
            trend: nextTrend,
          };
        }),
      );
    }, 1200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="site-home">
      <nav className="site-nav" aria-label="GridNexa website">
        <button className="site-brand" type="button" onClick={() => navigateTo("/")}>
          <span className="site-brand-mark">GN</span>
          <span>GridNexa</span>
        </button>
        <div className="site-nav-links">
          <button type="button" onClick={() => navigateTo("/docs/performance")}>Demos</button>
          <button type="button" onClick={() => navigateTo("/docs/basic-grid")}>Docs</button>
          <button type="button" onClick={() => navigateTo("/docs/basic-grid")}>Playground</button>
          <button type="button" onClick={() => navigateTo("/docs/export")}>Pricing</button>
          <button type="button" onClick={() => navigateTo("/docs/events")}>Help</button>
          <button type="button" onClick={() => navigateTo("/docs/theme")}>About</button>
        </div>
        <button className="site-nav-cta" type="button" onClick={() => navigateTo("/docs/basic-grid")}>
          Launch playground
        </button>
      </nav>

      <section className="site-hero">
        <div className="site-hero-copy">
          <span className="site-kicker">React data grid for serious interfaces</span>
          <h1>Ship spreadsheet-grade data experiences without losing product polish.</h1>
          <p>
            GridNexa blends Excel-like power with modern React ergonomics: merged column
            groups, live editing, formulas, filtering, grouping, pivoting, export, and
            theme-ready surfaces your users can understand at a glance.
          </p>
          <div className="site-actions">
            <button className="btn btn-light btn-lg" type="button" onClick={() => navigateTo("/docs/basic-grid")}>
              <i className="bi bi-book me-2" />
              Read docs
            </button>
            <button className="btn btn-outline-light btn-lg" type="button" onClick={() => navigateTo("/docs/column-merge")}>
              <i className="bi bi-distribute-horizontal me-2" />
              Try playground
            </button>
          </div>
          <div className="site-signal-strip" aria-label="GridNexa highlights">
            <span><strong>22+</strong> focused demos</span>
            <span><strong>{pulse + 1}</strong> live refreshes</span>
            <span><strong>${Math.round(liveVolume).toLocaleString()}</strong> active value</span>
          </div>
        </div>

        <section className="site-grid-showcase site-grid-showcase--hero" aria-label="GridNexa market grid preview">
          <div className="showcase-toolbar">
            <div>
              <span className="site-kicker">Live grid preview</span>
              <h2>Financial workspace, powered by GridNexa</h2>
            </div>
            <div className="showcase-controls">
              <span className="live-dot">Live updates</span>
              <span>Grouped headers</span>
            </div>
          </div>
          <div className="excel-feature-rail" aria-label="Excel-style features">
            {["Merged headers", "Formulas", "Fill handle", "Range select", "Find", "Undo / Redo", "CSV / Excel export"].map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
          </div>
          <GridNexa
            columns={marketColumns}
            rows={rows}
            mergedHeaders={mergedHeaders}
            rowNumbers
            checkboxSelection
            getRowId={(row) => row.id}
          />
        </section>
      </section>

      <section className="site-demo-tabs" aria-label="Example industries">
        {demoCards.map(([title, subtitle, icon], index) => (
          <button className={index === 0 ? "active" : ""} type="button" key={title}>
            <i className={`bi ${icon}`} />
            <strong>{title}</strong>
            <span>{subtitle}</span>
          </button>
        ))}
      </section>

      <section className="site-capabilities">
        {capabilities.map(([icon, title, text]) => (
          <article className="site-capability-card" key={title}>
            <i className={`bi ${icon}`} />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
