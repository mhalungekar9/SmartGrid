import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { CodeViewer } from "../CodeViewer";
import { DemoCard } from "../DemoCard";

type UsageTechnology = "react" | "angular" | "javascript" | "vue";

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

const usageTechnologies: Array<{
  id: UsageTechnology;
  label: string;
  icon: string;
  packageName: string;
}> = [
  { id: "react", label: "React", icon: "R", packageName: "@gridnexa/react" },
  { id: "angular", label: "Angular", icon: "A", packageName: "@gridnexa/angular" },
  { id: "javascript", label: "JavaScript", icon: "JS", packageName: "@gridnexa/javascript" },
  { id: "vue", label: "Vue", icon: "V", packageName: "@gridnexa/vue" },
];

function extractGridProps(code: string) {
  const trimmedCode = code.trim();
  const match = trimmedCode.match(/<GridNexa([\s\S]*?)\/>/);

  return (match?.[1] ?? " columns={columns}\n  rows={rows}")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toObjectOption(line: string) {
  if (/^[a-zA-Z]\w*$/.test(line)) {
    return `${line}: true,`;
  }

  const expressionMatch = line.match(/^([a-zA-Z]\w*)=\{([\s\S]*)\}$/);
  if (expressionMatch) {
    const [, key, value] = expressionMatch;

    if (key === "columns" || key === "rows") {
      return `${key},`;
    }

    return `${key}: ${value},`;
  }

  const stringMatch = line.match(/^([a-zA-Z]\w*)="([^"]*)"$/);
  if (stringMatch) {
    return `${stringMatch[1]}: "${stringMatch[2]}",`;
  }

  return `// ${line}`;
}

function toAngularInput(line: string) {
  if (/^[a-zA-Z]\w*$/.test(line)) {
    return line;
  }

  const expressionMatch = line.match(/^([a-zA-Z]\w*)=\{([\s\S]*)\}$/);
  if (expressionMatch) {
    return `[${expressionMatch[1]}]="${expressionMatch[2].replace(/"/g, "'")}"`;
  }

  const stringMatch = line.match(/^([a-zA-Z]\w*)="([^"]*)"$/);
  if (stringMatch) {
    return `${stringMatch[1]}="${stringMatch[2]}"`;
  }

  return `<!-- ${line} -->`;
}

function toVueInput(line: string) {
  if (/^[a-zA-Z]\w*$/.test(line)) {
    return line;
  }

  const expressionMatch = line.match(/^([a-zA-Z]\w*)=\{([\s\S]*)\}$/);
  if (expressionMatch) {
    return `:${expressionMatch[1]}="${expressionMatch[2].replace(/"/g, "'")}"`;
  }

  const stringMatch = line.match(/^([a-zA-Z]\w*)="([^"]*)"$/);
  if (stringMatch) {
    return `${stringMatch[1]}="${stringMatch[2]}"`;
  }

  return `<!-- ${line} -->`;
}

function buildFrameworkUsage(code: string, technology: UsageTechnology) {
  const reactUsage = buildUsageExample(code);
  const propLines = extractGridProps(code);
  const objectOptions = propLines.map(toObjectOption).join("\n  ");
  const angularInputs = propLines.map(toAngularInput).map((line) => `  ${line}`).join("\n");
  const vueInputs = propLines.map(toVueInput).map((line) => `    ${line}`).join("\n");

  if (technology === "react") {
    return reactUsage;
  }

  if (technology === "javascript") {
    return `import { createGridNexa, type Column } from "@gridnexa/javascript";

interface Employee {
  id: number;
  name: string;
  department: string;
  city: string;
  region: string;
  score: number;
}

const rows: Employee[] = [
  { id: 1, name: "John Carter", department: "Operations", city: "London", region: "EMEA", score: 92 },
];

const columns: Column<Employee>[] = [
  { id: "name", field: "name", headerName: "Name", width: 220 },
  { id: "department", field: "department", headerName: "Department", width: 180 },
  { id: "score", field: "score", headerName: "Score", width: 120 },
];

createGridNexa<Employee>(document.querySelector("#grid")!, {
  ${objectOptions}
});`;
  }

  if (technology === "angular") {
    return `import { Component } from "@angular/core";
import { GridNexaAngularComponent, type Column } from "@gridnexa/angular";

interface Employee {
  id: number;
  name: string;
  department: string;
  city: string;
  region: string;
  score: number;
}

@Component({
  standalone: true,
  imports: [GridNexaAngularComponent],
  selector: "app-gridnexa-example",
  template: \`
<grid-nexa
${angularInputs}
/>
  \`,
})
export class GridNexaExampleComponent {
  rows: Employee[] = [
    { id: 1, name: "John Carter", department: "Operations", city: "London", region: "EMEA", score: 92 },
  ];

  columns: Column<Employee>[] = [
    { id: "name", field: "name", headerName: "Name", width: 220 },
    { id: "department", field: "department", headerName: "Department", width: 180 },
    { id: "score", field: "score", headerName: "Score", width: 120 },
  ];
}`;
  }

  return `<script setup lang="ts">
import { GridNexaVue, type Column } from "@gridnexa/vue";

interface Employee {
  id: number;
  name: string;
  department: string;
  city: string;
  region: string;
  score: number;
}

const rows: Employee[] = [
  { id: 1, name: "John Carter", department: "Operations", city: "London", region: "EMEA", score: 92 },
];

const columns: Column<Employee>[] = [
  { id: "name", field: "name", headerName: "Name", width: 220 },
  { id: "department", field: "department", headerName: "Department", width: 180 },
  { id: "score", field: "score", headerName: "Score", width: 120 },
];
</script>

<template>
  <GridNexaVue
${vueInputs}
  />
</template>`;
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
  const [technology, setTechnology] = useState<UsageTechnology>("react");
  const usageCode = useMemo(
    () => buildFrameworkUsage(code, technology),
    [code, technology],
  );
  const selectedTechnology = usageTechnologies.find((item) => item.id === technology);
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
          description={`Copy this complete starting point into your ${selectedTechnology?.label ?? "React"} code and adapt the rows, columns, and callbacks.`}
          headerClassName="usage-card-header"
          action={
            <div className="usage-actions" aria-label="Usage code actions">
              <div className="usage-tech-switcher" role="tablist" aria-label="Technology">
                {usageTechnologies.map((item) => (
                  <button
                    className={`usage-tech-button usage-tech-button--${item.id}${technology === item.id ? " active" : ""}`}
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={technology === item.id}
                    aria-label={`${item.label} usage code (${item.packageName})`}
                    title={`${item.label} usage`}
                    onClick={() => setTechnology(item.id)}
                  >
                    <span className={`usage-tech-logo technology-logo technology-logo--${item.id}`}>
                      {item.icon}
                    </span>
                  </button>
                ))}
              </div>
              <button className="btn btn-sm btn-outline-primary" type="button" onClick={copyCode}>
                <i className={`bi ${copied ? "bi-check2" : "bi-clipboard"} me-2`} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          }
        >
          <CodeViewer code={usageCode} />
        </DemoCard>
      </div>
    </div>
  );
}
