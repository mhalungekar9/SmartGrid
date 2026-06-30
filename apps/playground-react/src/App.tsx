import { SmartGrid, type Column } from "@smartgrid/react";

interface Employee {
  id: number;
  name: string;
  age: number;
  city: string;
}

const columns: Column<Employee>[] = [
  {
    id: "name",
    field: "name",
    headerName: "Name",
    width: 250,
  },
  {
    id: "age",
    field: "age",
    headerName: "Age",
    width: 120,
  },
  {
    id: "city",
    field: "city",
    headerName: "City",
    width: 250,
  },
];

const rows: Employee[] = [
  {
    id: 1,
    name: "John",
    age: 30,
    city: "London",
  },
  {
    id: 2,
    name: "Alice",
    age: 25,
    city: "Paris",
  },
  {
    id: 3,
    name: "Bob",
    age: 40,
    city: "New York",
  },
];

function App() {
  return <SmartGrid columns={columns} rows={rows} />;
}

export default App;
