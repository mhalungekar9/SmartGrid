import { employeeColumns, employees, type Employee } from "./employees";

const regions = Array.from(new Set(employees.map((employee) => employee.region)));
const departments = Array.from(
  new Set(
    employees.map((employee) => `${employee.region}::${employee.department}`),
  ),
).map((entry) => {
  const [region, department] = entry.split("::");

  return { region, department };
});

export const treeRows: Employee[] = [
  ...regions.map((region, index) => ({
    id: 9000 + index,
    name: region,
    age: 0,
    city: "",
    department: "",
    hired: "",
    active: true,
    score: 0,
    adjustedScore: "",
    manager: "__region",
    region,
  })),
  ...departments.map(({ region, department }, index) => ({
    id: 9100 + index,
    name: department,
    age: 0,
    city: "",
    department,
    hired: "",
    active: true,
    score: 0,
    adjustedScore: "",
    manager: "__department",
    region,
  })),
  ...employees,
];

export function getEmployeeTreePath(row: Employee) {
  if (row.manager === "__region") {
    return [row.region];
  }

  if (row.manager === "__department") {
    return [row.region, row.department];
  }

  return [row.region, row.department, row.name];
}

export const treeColumns = employeeColumns.map((column) => {
  if (["age", "score"].includes(column.id)) {
    return {
      ...column,
      valueFormatter: (value: unknown) => (Number(value) === 0 ? "" : String(value ?? "")),
    };
  }

  if (["active", "hired", "adjustedScore"].includes(column.id)) {
    return {
      ...column,
      valueFormatter: (value: unknown) => String(value ?? ""),
      cellRenderer: (value: unknown, row: Employee) =>
        row.manager.startsWith("__") ? "" : column.cellRenderer?.(value, row) ?? column.valueFormatter?.(value) ?? String(value ?? ""),
    };
  }

  return column;
});
