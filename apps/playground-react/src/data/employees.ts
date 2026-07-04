import type { Column, GridTransaction } from "@gridnexa/react";

export interface Employee {
  id: number;
  name: string;
  age: number;
  city: string;
  department: string;
  hired: string;
  active: boolean;
  score: number;
  adjustedScore: string;
  manager: string;
  region: string;
}

export const employees: Employee[] = [
  { id: 1, name: "John Carter", age: 30, city: "London", department: "Operations", hired: "2021-04-12", active: true, score: 92, adjustedScore: "=score * 1.05", manager: "Avery Stone", region: "EMEA" },
  { id: 2, name: "Alice Moreau", age: 25, city: "Paris", department: "Product", hired: "2022-08-03", active: true, score: 87, adjustedScore: "=score * 1.05", manager: "Noah Clark", region: "EMEA" },
  { id: 3, name: "Bob Rivera", age: 40, city: "New York", department: "Support", hired: "2020-01-21", active: false, score: 79, adjustedScore: "=score * 1.05", manager: "Maya Chen", region: "Americas" },
  { id: 4, name: "Maya Shah", age: 33, city: "Berlin", department: "Engineering", hired: "2019-11-18", active: true, score: 96, adjustedScore: "=score * 1.05", manager: "Iris Keller", region: "EMEA" },
  { id: 5, name: "Nina Patel", age: 29, city: "Toronto", department: "Finance", hired: "2023-02-07", active: true, score: 91, adjustedScore: "=score * 1.05", manager: "Maya Chen", region: "Americas" },
  { id: 6, name: "Omar Khan", age: 36, city: "London", department: "Engineering", hired: "2020-09-14", active: true, score: 88, adjustedScore: "=score * 1.05", manager: "Iris Keller", region: "EMEA" },
  { id: 7, name: "Priya Rao", age: 31, city: "Paris", department: "Product", hired: "2021-12-01", active: false, score: 82, adjustedScore: "=score * 1.05", manager: "Noah Clark", region: "EMEA" },
  { id: 8, name: "Kenji Sato", age: 38, city: "Tokyo", department: "Operations", hired: "2018-06-23", active: true, score: 94, adjustedScore: "=score * 1.05", manager: "Hana Mori", region: "APAC" },
  { id: 9, name: "Lena Brooks", age: 27, city: "New York", department: "Engineering", hired: "2024-01-16", active: true, score: 89, adjustedScore: "=score * 1.05", manager: "Iris Keller", region: "Americas" },
  { id: 10, name: "Chen Wei", age: 34, city: "Singapore", department: "Finance", hired: "2022-03-29", active: false, score: 84, adjustedScore: "=score * 1.05", manager: "Hana Mori", region: "APAC" },
  { id: 11, name: "Elena Rossi", age: 42, city: "Rome", department: "Support", hired: "2017-10-10", active: true, score: 90, adjustedScore: "=score * 1.05", manager: "Maya Chen", region: "EMEA" },
  { id: 12, name: "Mateo Silva", age: 28, city: "Sao Paulo", department: "Product", hired: "2023-09-04", active: true, score: 85, adjustedScore: "=score * 1.05", manager: "Noah Clark", region: "Americas" },
];

export const employeeColumns: Column<Employee>[] = [
  { id: "name", field: "name", headerName: "Name", width: 240, sortable: true, pinned: "left", editable: true, filter: "text", editor: "text" },
  { id: "department", field: "department", headerName: "Department", width: 210, sortable: true, editable: true, filter: "set", editor: { type: "advancedSelect", values: ["Operations", "Product", "Support", "Engineering", "Finance"] } },
  { id: "city", field: "city", headerName: "City", width: 170, sortable: true, editable: true, filter: "set", editor: { type: "select", values: ["London", "Paris", "New York", "Berlin", "Toronto", "Tokyo", "Singapore"] } },
  { id: "region", field: "region", headerName: "Region", width: 130, sortable: true, filter: "set" },
  { id: "age", field: "age", headerName: "Age", width: 110, sortable: true, editable: true, filter: "number", editor: "number" },
  { id: "hired", field: "hired", headerName: "Hired", width: 150, sortable: true, editable: true, filter: "date", editor: "date" },
  { id: "active", field: "active", headerName: "Active", width: 120, sortable: true, editable: true, filter: "set", editor: "checkbox", valueFormatter: (value) => (value ? "Yes" : "No") },
  { id: "score", field: "score", headerName: "Score", width: 130, sortable: true, pinned: "right", editable: true, filter: "number", editor: "number" },
  { id: "adjustedScore", field: "adjustedScore", headerName: "Adjusted", width: 150, sortable: true, editable: true, filter: "number", editor: "text", valueFormatter: (value) => typeof value === "number" ? value.toFixed(1) : String(value ?? "") },
];

export const compactEmployeeColumns = employeeColumns.filter((column) =>
  ["name", "department", "city", "score", "active"].includes(column.id),
);

export const formulaEmployeeColumns: Column<Employee>[] = [
  {
    id: "name",
    field: "name",
    headerName: "Name",
    width: 240,
    sortable: true,
    pinned: "left",
    filter: "text",
  },
  {
    id: "department",
    field: "department",
    headerName: "Department",
    width: 190,
    sortable: true,
    filter: "set",
  },
  {
    id: "score",
    field: "score",
    headerName: "Base Score",
    width: 140,
    sortable: true,
    editable: true,
    filter: "number",
    editor: "number",
  },
  {
    id: "adjustedScore",
    field: "adjustedScore",
    headerName: "Formula",
    width: 180,
    editable: true,
    filter: "text",
    editor: "text",
  },
  {
    id: "calculatedScore",
    field: "adjustedScore",
    headerName: "Calculated",
    width: 150,
    sortable: true,
    filter: "number",
    valueFormatter: (value) =>
      typeof value === "number" ? value.toFixed(1) : String(value ?? ""),
  },
];

export const readonlyEmployeeColumns = employeeColumns.map((column) => ({
  ...column,
  editable: false,
}));

export const employeeTransaction: GridTransaction<Employee> = {
  update: [{ ...employees[1], score: 95, department: "Engineering" }],
  add: [
    {
      id: 99,
      name: "Sam Wilson",
      age: 32,
      city: "Austin",
      department: "Support",
      hired: "2025-04-02",
      active: true,
      score: 86,
      adjustedScore: "=score * 1.05",
      manager: "Maya Chen",
      region: "Americas",
    },
  ],
};
