import { SmartGrid, type Column } from "@smartgrid/react";

interface Employee {
  id: number;
  name: string;
  age: number;
  city: string;
  department: string;
  hired: string;
  active: boolean;
  score: number;
  adjustedScore: string;
}

const columns: Column<Employee>[] = [
  {
    id: "name",
    field: "name",
    headerName: "Name",
    width: 250,
    sortable: true,
    pinned: "left",
    editable: true,
    filter: "text",
    editor: "text",
  },
  {
    id: "age",
    field: "age",
    headerName: "Age",
    width: 120,
    sortable: true,
    editable: true,
    filter: "number",
    editor: "number",
  },
  {
    id: "city",
    field: "city",
    headerName: "City",
    width: 250,
    sortable: true,
    editable: true,
    filter: "set",
    editor: {
      type: "select",
      values: ["London", "Paris", "New York", "Berlin", "Toronto"],
    },
  },
  {
    id: "department",
    field: "department",
    headerName: "Department",
    width: 220,
    sortable: true,
    editable: true,
    filter: "set",
    editor: {
      type: "advancedSelect",
      values: ["Operations", "Product", "Support", "Engineering", "Finance"],
    },
  },
  {
    id: "hired",
    field: "hired",
    headerName: "Hired",
    width: 150,
    sortable: true,
    editable: true,
    filter: "date",
    editor: "date",
  },
  {
    id: "active",
    field: "active",
    headerName: "Active",
    width: 120,
    sortable: true,
    editable: true,
    filter: "set",
    editor: "checkbox",
    valueFormatter: (value) => (value ? "Yes" : "No"),
  },
  {
    id: "score",
    field: "score",
    headerName: "Score",
    width: 130,
    sortable: true,
    pinned: "right",
    editable: true,
    filter: "number",
    editor: "number",
  },
  {
    id: "adjustedScore",
    field: "adjustedScore",
    headerName: "Adjusted",
    width: 150,
    sortable: true,
    editable: true,
    filter: "number",
    editor: "text",
    valueFormatter: (value) =>
      typeof value === "number" ? value.toFixed(1) : String(value ?? ""),
  },
];

const rows: Employee[] = [
  {
    id: 1,
    name: "John",
    age: 30,
    city: "London",
    department: "Operations",
    hired: "2021-04-12",
    active: true,
    score: 92,
    adjustedScore: "=score * 1.05",
  },
  {
    id: 2,
    name: "Alice",
    age: 25,
    city: "Paris",
    department: "Product",
    hired: "2022-08-03",
    active: true,
    score: 87,
    adjustedScore: "=score * 1.05",
  },
  {
    id: 3,
    name: "Bob",
    age: 40,
    city: "New York",
    department: "Support",
    hired: "2020-01-21",
    active: false,
    score: 79,
    adjustedScore: "=score * 1.05",
  },
  {
    id: 4,
    name: "Maya",
    age: 33,
    city: "Berlin",
    department: "Engineering",
    hired: "2019-11-18",
    active: true,
    score: 96,
    adjustedScore: "=score * 1.05",
  },
  {
    id: 5,
    name: "Nina",
    age: 29,
    city: "Toronto",
    department: "Finance",
    hired: "2023-02-07",
    active: true,
    score: 91,
    adjustedScore: "=score * 1.05",
  },
  {
    id: 6,
    name: "Omar",
    age: 36,
    city: "London",
    department: "Engineering",
    hired: "2020-09-14",
    active: true,
    score: 88,
    adjustedScore: "=score * 1.05",
  },
  {
    id: 7,
    name: "Priya",
    age: 31,
    city: "Paris",
    department: "Product",
    hired: "2021-12-01",
    active: false,
    score: 82,
    adjustedScore: "=score * 1.05",
  },
];

function App() {
  return (
    <main className="demo-shell">
      <section className="demo-copy">
        <span className="demo-kicker">SmartGrid</span>
        <h1>Fast, interactive data grids for React</h1>
        <p>
          Sort any column, resize headers, pin important fields, quick-filter
          across visible data, hide and show columns from the chooser,
          inline-edit cells, and select rows in a polished grid surface designed
          to grow into the full SmartGrid engine.
        </p>
      </section>

      <section className="demo-grid-wrap">
        <SmartGrid
          columns={columns}
          rows={rows}
          groupBy="department"
          pivotBy="city"
          pivotValueColumns={["score"]}
          pivotAggregation="avg"
          pageSize={3}
          rowNumbers
        />
      </section>
    </main>
  );
}

export default App;
