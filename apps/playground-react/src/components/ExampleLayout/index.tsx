import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { CodeViewer } from "../CodeViewer";
import { DemoCard } from "../DemoCard";

interface ExampleLayoutProps {
  title: string;
  subtitle: string;
  overview: string;
  details?: string[];
  code: string;
  children: ReactNode;
}

function buildUsageExample(code: string) {
  const trimmedCode = code.trim();

  if (trimmedCode.includes("import { GridNexa")) {
    return trimmedCode;
  }

  if (trimmedCode.includes("const rows") || trimmedCode.includes("const columns")) {
    return `import { GridNexa, type Column } from "@gridnexa/react";

${trimmedCode}`;
  }

  return `import { GridNexa, type Column } from "@gridnexa/react";

interface Employee {
  id: number;
  name: string;
  department: string;
  city: string;
  region: string;
  score: number;
  adjustedScore: string;
}

const rows: Employee[] = [
  {
    id: 1,
    name: "John Carter",
    department: "Operations",
    city: "London",
    region: "EMEA",
    score: 92,
    adjustedScore: "=score * 1.05",
  },
];

const columns: Column<Employee>[] = [
  { id: "name", field: "name", headerName: "Name", width: 220 },
  { id: "department", field: "department", headerName: "Department", width: 180 },
  { id: "score", field: "score", headerName: "Score", width: 120 },
];

export function GridNexaExample() {
  return (
${trimmedCode
  .split("\n")
  .map((line) => `    ${line}`)
  .join("\n")}
  );
}`;
}

export function ExampleLayout({
  title,
  subtitle,
  overview,
  details = [],
  code,
  children,
}: ExampleLayoutProps) {
  const [copied, setCopied] = useState(false);
  const usageCode = useMemo(() => buildUsageExample(code), [code]);
  const copyCode = async () => {
    await navigator.clipboard.writeText(usageCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="example-page">
      <div className="page-title">
        <span className="eyebrow">{subtitle}</span>
        <h2>{title}</h2>
        <p>{overview}</p>
      </div>

      {details.length ? (
        <div className="detail-grid">
          {details.map((detail) => (
            <div className="detail-card" key={detail}>
              <i className="bi bi-check-circle" />
              <span>{detail}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="example-grid">
        <DemoCard title="Live preview" description="Use the grid exactly as a developer would in an app.">
          <div className="preview-surface">{children}</div>
        </DemoCard>
        <DemoCard
          title="Usage"
          description="Copy this complete starting point into your React code and adapt the rows, columns, and callbacks."
          action={
            <button className="btn btn-sm btn-outline-primary" type="button" onClick={copyCode}>
              <i className={`bi ${copied ? "bi-check2" : "bi-clipboard"} me-2`} />
              {copied ? "Copied" : "Copy"}
            </button>
          }
        >
          <CodeViewer code={usageCode} />
        </DemoCard>
      </div>
    </div>
  );
}
