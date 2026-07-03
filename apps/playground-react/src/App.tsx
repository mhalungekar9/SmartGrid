import { SmartGrid, type Column } from "@smartgrid/react";

interface Employee {
  id: number;
  name: string;
  age: number;
  city: string;
  department: string;
  score: number;
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
  },
  {
    id: "age",
    field: "age",
    headerName: "Age",
    width: 120,
    sortable: true,
    editable: true,
  },
  {
    id: "city",
    field: "city",
    headerName: "City",
    width: 250,
    sortable: true,
    editable: true,
  },
  {
    id: "department",
    field: "department",
    headerName: "Department",
    width: 220,
    sortable: true,
    editable: true,
  },
  {
    id: "score",
    field: "score",
    headerName: "Score",
    width: 130,
    sortable: true,
    pinned: "right",
    editable: true,
  },
];

const rows: Employee[] = [
  {
    id: 1,
    name: "John",
    age: 30,
    city: "London",
    department: "Operations",
    score: 92,
  },
  {
    id: 2,
    name: "Alice",
    age: 25,
    city: "Paris",
    department: "Product",
    score: 87,
  },
  {
    id: 3,
    name: "Bob",
    age: 40,
    city: "New York",
    department: "Support",
    score: 79,
  },
  {
    id: 4,
    name: "Maya",
    age: 33,
    city: "Berlin",
    department: "Engineering",
    score: 96,
  },
  {
    id: 5,
    name: "Nina",
    age: 29,
    city: "Toronto",
    department: "Finance",
    score: 91,
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
          pageSize={3}
        />
      </section>
    </main>
  );
}

export default App;
