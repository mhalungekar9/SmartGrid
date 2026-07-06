import { useEffect, useMemo, useState } from "react";
import { GridNexa, type Column, type MergedHeader } from "@gridnexa/react";
import { useTheme } from "../../hooks/useTheme";
import { navigateTo } from "../../utils/navigation";
import gridNexaWordmark from "../../assets/GridNexa-With-Text-logo-transparent-cropped.png";

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
  { id: "ticker", field: "ticker", headerName: "Ticker", width: 92, pinned: "left", sortable: true, filter: "text" },
  { id: "name", field: "name", headerName: "Position", width: 190, sortable: true, filter: "text" },
  { id: "desk", field: "desk", headerName: "Desk", width: 96, sortable: true, filter: "set" },
  {
    id: "trend",
    field: "trend",
    headerName: "Timeline",
    width: 128,
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
  { id: "instrument", field: "instrument", headerName: "Type", width: 96, sortable: true, filter: "set" },
  {
    id: "pnl",
    field: "pnl",
    headerName: "P&L",
    width: 92,
    sortable: true,
    filter: "number",
    cellRenderer: (value) => {
      const amount = Number(value);
      return <span className={amount >= 0 ? "market-up" : "market-down"}>{amount >= 0 ? "+" : "-"}{Math.abs(amount).toLocaleString()}</span>;
    },
  },
  { id: "totalValue", field: "totalValue", headerName: "Value", width: 118, sortable: true, filter: "number", valueFormatter: (value) => `$${Number(value).toLocaleString()}` },
  { id: "risk", field: "risk", headerName: "Risk", width: 84, sortable: true, filter: "set" },
];

const mergedHeaders: MergedHeader[] = [
  { id: "position", headerName: "Position Intelligence", columnIds: ["ticker", "name", "desk"], align: "left" },
  { id: "market", headerName: "Market Movement", columnIds: ["trend", "instrument", "pnl", "totalValue"], align: "center" },
  { id: "risk", headerName: "Governance", columnIds: ["risk"], align: "center" },
];

const capabilities = [
  ["bi-stars", "AI command layer", "Let users describe filters, sorts, pivots, column changes, and exports in plain English."],
  ["bi-front", "Merged headers", "Group related columns into clean Excel-style header bands."],
  ["bi-magic", "Formulas and fill", "Use calculated cells, fill handle flows, find, and undo/redo."],
  ["bi-funnel", "Advanced filtering", "Combine quick search, set filters, operators, and external predicates."],
  ["bi-arrow-left-right", "Drag interactions", "Reorder columns and rows with direct manipulation."],
  ["bi-bar-chart", "Pivot and group", "Summarize data with grouping, aggregations, pivoting, and tree rows."],
  ["bi-download", "Export-ready", "Ship CSV and Excel export from the grid toolbar."],
];

const animatedFeatures = [
  ["bi-table", "Basic grid", "Typed rows and columns"],
  ["bi-sort-alpha-down", "Sorting", "Click headers or menu"],
  ["bi-funnel", "Filtering", "Column, quick, external"],
  ["bi-check2-square", "Selection", "Rows, checkboxes, ranges"],
  ["bi-distribute-horizontal", "Column merge", "Excel-style grouped headers"],
  ["bi-arrow-left-right", "Reorder", "Drag rows and columns"],
  ["bi-pencil-square", "Editing", "Editors, undo, redo"],
  ["bi-stars", "AI command", "Safe action plans"],
  ["bi-calculator", "Formulas", "Calculated cells"],
  ["bi-diagram-3", "Tree data", "Nested expandable rows"],
  ["bi-collection", "Grouping", "Buckets and summaries"],
  ["bi-bar-chart", "Pivoting", "Aggregated cross-tabs"],
  ["bi-download", "Export", "CSV and Excel"],
];

const demoCards = [
  ["Performance", "160 rows", "bi-speedometer2"],
  ["Finance", "Merged headers", "bi-graph-up-arrow"],
  ["Operations", "Grouping", "bi-diagram-3"],
  ["Inventory", "Filters", "bi-box-seam"],
];

const excelBanners = [
  {
    icon: "bi-front",
    title: "Merged column headers",
    text: "Group related fields into a clear top header band.",
    headers: ["Profile", "Score", "Status"],
    rows: [
      ["Ava", "94", "Live"],
      ["Noah", "88", "Hold"],
      ["Mia", "97", "Live"],
    ],
  },
  {
    icon: "bi-calculator",
    title: "Formulas and fill",
    text: "Calculate cells, fill ranges, and keep edits reversible.",
    headers: ["Base", "Formula", "Result"],
    rows: [
      ["92", "=A1*1.05", "96.6"],
      ["87", "=A2*1.05", "91.4"],
      ["79", "=A3*1.05", "83.0"],
    ],
  },
  {
    icon: "bi-funnel",
    title: "Filters and find",
    text: "Search visible data and combine column filters quickly.",
    headers: ["Team", "Region", "Match"],
    rows: [
      ["Ops", "EMEA", "Yes"],
      ["Finance", "APAC", "Yes"],
      ["Support", "NA", "No"],
    ],
  },
  {
    icon: "bi-bar-chart",
    title: "Pivot and aggregate",
    text: "Turn row-level data into summaries users can scan.",
    headers: ["Dept", "EMEA", "APAC"],
    rows: [
      ["Eng", "96", "89"],
      ["Ops", "92", "94"],
      ["Finance", "91", "84"],
    ],
  },
];

const supportedTechnologies = [
  { name: "React", packageName: "@gridnexa/react", logo: "R", className: "react" },
  { name: "Angular", packageName: "@gridnexa/angular", logo: "A", className: "angular" },
  { name: "Vue", packageName: "@gridnexa/vue", logo: "V", className: "vue" },
  { name: "JavaScript", packageName: "@gridnexa/javascript", logo: "JS", className: "javascript" },
];

export function Home() {
  const { theme } = useTheme();
  const [rows, setRows] = useState(marketRows);
  const [pulse, setPulse] = useState(0);
  const liveVolume = useMemo(
    () => rows.reduce((total, row) => total + row.totalValue, 0),
    [rows],
  );

  useEffect(() => {
    document.body.classList.add("gridnexa-marketing-page");

    return () => {
      document.body.classList.remove("gridnexa-marketing-page");
    };
  }, []);

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

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="site-home">
      <nav className="site-nav" aria-label="GridNexa website">
        <button className="site-brand" type="button" onClick={() => navigateTo("/")}>
          <img src={gridNexaWordmark} alt="GridNexa" />
        </button>
        <div className="site-nav-links">
          <button type="button" onClick={() => scrollToSection("demos")}>Demos</button>
          <button type="button" onClick={() => navigateTo("/docs/basic-grid")}>Docs</button>
          <button type="button" onClick={() => navigateTo("/docs/basic-grid")}>Playground</button>
          <button type="button" onClick={() => scrollToSection("pricing")}>Pricing</button>
          <button type="button" onClick={() => scrollToSection("help")}>Help</button>
          <button type="button" onClick={() => scrollToSection("about")}>About</button>
        </div>
        <button className="site-nav-cta" type="button" onClick={() => navigateTo("/docs/basic-grid")}>
          Launch playground
        </button>
      </nav>

      <section className="site-hero">
        <div className="site-hero-copy">
          <span className="site-kicker">Data grid for serious interfaces</span>
          <h1>Spreadsheet-grade grids for every modern UI stack.</h1>
          <p className="site-punchline">
            The Excel-like grid for React, Angular, Vue, and JavaScript apps.
          </p>
          <div className="technology-strip" aria-label="Supported UI technologies">
            {supportedTechnologies.map((technology) => (
              <button
                className="technology-chip"
                key={technology.name}
                type="button"
                onClick={() => navigateTo("/docs/basic-grid")}
              >
                <span className={`technology-logo technology-logo--${technology.className}`}>
                  {technology.logo}
                </span>
                <span>
                  <strong>{technology.name}</strong>
                  <small>{technology.packageName}</small>
                </span>
              </button>
            ))}
          </div>
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
      </section>

      <section className="site-grid-showcase" aria-label="GridNexa market grid preview">
        <div className="showcase-toolbar">
          <div>
            <span className="site-kicker">Live grid preview</span>
            <h2>Financial workspace, powered by GridNexa</h2>
          </div>
          <div className="showcase-controls">
            <span className="live-dot">Live updates</span>
            <span>Grouped headers</span>
            <span>Excel features</span>
            <span>AI-ready</span>
          </div>
        </div>
        <div className="excel-feature-rail" aria-label="Excel-style features">
          {["AI command", "Merged headers", "Formulas", "Fill handle", "Range select", "Find", "Undo / Redo", "CSV / Excel export"].map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
        <GridNexa
          columns={marketColumns}
          rows={rows}
          theme={theme}
          mergedHeaders={mergedHeaders}
          rowNumbers
          checkboxSelection
          classNames={{
            shell: "site-preview-grid-shell",
            gridWorkspace: "site-preview-grid-workspace",
            gridRoot: "site-preview-grid-root",
            sideTools: "site-preview-side-tools",
            panel: "site-preview-grid-panel",
          }}
          getRowId={(row) => row.id}
        />
        <div className="ai-home-panel" aria-label="GridNexa AI command preview">
          <div>
            <span className="site-kicker">AI Command</span>
            <h3>Ask the grid to reshape data.</h3>
            <p>Generate safe action plans for filtering, sorting, grouping, pivoting, pinning, hiding columns, and exporting.</p>
          </div>
          <div className="ai-home-command">
            <span>Try: pivot score by region and group by department</span>
            <button type="button" onClick={() => navigateTo("/docs/ai-command")}>
              Explore AI docs
            </button>
          </div>
        </div>
      </section>

      <section className="excel-banner-grid" aria-label="Excel-style GridNexa feature banners">
        {excelBanners.map((banner, bannerIndex) => (
          <article className="excel-banner-card" key={banner.title}>
            <div className="excel-banner-copy">
              <i className={`bi ${banner.icon}`} />
              <div>
                <h2>{banner.title}</h2>
                <p>{banner.text}</p>
              </div>
            </div>
            <div className="mini-grid" style={{ animationDelay: `${bannerIndex * 140}ms` }}>
              <div className="mini-grid-header">
                {banner.headers.map((header) => (
                  <span key={header}>{header}</span>
                ))}
              </div>
              {banner.rows.map((row, rowIndex) => (
                <div className="mini-grid-row" key={`${banner.title}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <span
                      className={cellIndex === row.length - 1 ? "is-hot" : ""}
                      key={`${cell}-${cellIndex}`}
                    >
                      {cell}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="structure-preview-grid" aria-label="Tree grid and grouping feature previews">
        <article className="structure-preview-card">
          <div className="structure-preview-copy">
            <span className="site-kicker">Tree Grid</span>
            <h2>Nested records with expandable branches.</h2>
            <p>Show regions, departments, teams, and leaf rows in one readable hierarchy.</p>
          </div>
          <div className="structure-grid-preview" role="img" aria-label="Tree grid preview">
            <div className="structure-header">
              <span>Name</span>
              <span>Department</span>
              <span>City</span>
            </div>
            {[
              ["expanded", "Americas", "", ""],
              ["expanded depth-1", "Engineering", "Engineering", ""],
              ["leaf depth-2", "Lena Brooks", "Engineering", "New York"],
              ["expanded depth-1", "Finance", "Finance", ""],
              ["leaf depth-2", "Nina Patel", "Finance", "Toronto"],
              ["expanded depth-1", "Product", "Product", ""],
              ["leaf depth-2", "Mateo Silva", "Product", "Sao Paulo"],
            ].map(([state, name, department, city]) => (
              <div className={`structure-row ${state}`} key={`${state}-${name}`}>
                <span>{name}</span>
                <span>{department}</span>
                <span>{city}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="structure-preview-card">
          <div className="structure-preview-copy">
            <span className="site-kicker">Grouping</span>
            <h2>Bucket rows into collapsible summaries.</h2>
            <p>Group by department, region, status, or any typed column while keeping row actions visible.</p>
          </div>
          <div className="structure-grid-preview" role="img" aria-label="Grouped rows preview">
            <div className="structure-header">
              <span>Name</span>
              <span>Department</span>
              <span>City</span>
            </div>
            {[
              ["group", "Operations", "2 rows", ""],
              ["leaf", "John Carter", "Operations", "London"],
              ["leaf", "Kenji Sato", "Operations", "Tokyo"],
              ["group", "Product", "3 rows", ""],
              ["leaf", "Alice Moreau", "Product", "Paris"],
              ["leaf", "Priya Rao", "Product", "Paris"],
              ["leaf", "Mateo Silva", "Product", "Sao Paulo"],
            ].map(([state, name, department, city]) => (
              <div className={`structure-row ${state}`} key={`${state}-${name}-${city}`}>
                <span>{name}</span>
                <span>{department}</span>
                <span>{city}</span>
              </div>
            ))}
          </div>
        </article>
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

      <section className="site-section" id="demos">
        <div className="site-section-heading">
          <span className="site-kicker">Demos</span>
          <h2>Every major GridNexa feature, visible at a glance.</h2>
          <p>Animated feature tiles help users understand the grid surface before they open the docs.</p>
        </div>
        <div className="animated-feature-grid">
          {animatedFeatures.map(([icon, title, text], index) => (
            <button
              className="animated-feature-card"
              key={title}
              style={{ animationDelay: `${index * 70}ms` }}
              type="button"
              onClick={() => navigateTo("/docs/basic-grid")}
            >
              <i className={`bi ${icon}`} />
              <strong>{title}</strong>
              <span>{text}</span>
              <div className="feature-scanline" />
            </button>
          ))}
        </div>
      </section>

      <section className="site-info-grid">
        <article className="site-info-card site-info-card--pricing" id="pricing">
          <span className="site-kicker">Pricing</span>
          <h2>Free to use</h2>
          <p>
            GridNexa is presented as a free React data grid package for developers
            building modern data-heavy interfaces.
          </p>
          <button className="btn btn-primary" type="button" onClick={() => navigateTo("/docs/basic-grid")}>
            Start with docs
          </button>
        </article>

        <article className="site-info-card" id="help">
          <span className="site-kicker">Help</span>
          <h2>Need support?</h2>
          <p>
            If developers need help integrating the grid, debugging a feature, or
            planning a custom workflow, they can connect for guidance and support.
          </p>
          <div className="support-actions">
            <a href="mailto:mhalungekar9@gmail.com">mhalungekar9@gmail.com</a>
            <button type="button" onClick={() => navigateTo("/docs/events")}>View events docs</button>
          </div>
        </article>

        <article className="site-info-card" id="about">
          <span className="site-kicker">About</span>
          <h2>Built for product teams that live in data.</h2>
          <p>
            GridNexa focuses on practical grid behavior: polished themes, Excel-like
            interactions, copyable examples, and APIs that fit naturally into React apps.
          </p>
        </article>
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
