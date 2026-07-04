import type { Column } from "@gridnexa/react";

export interface Order {
  id: number;
  customer: string;
  product: string;
  status: string;
  value: number;
  placed: string;
}

export const orders: Order[] = [
  { id: 1001, customer: "Northwind", product: "Analytics Suite", status: "Paid", value: 4200, placed: "2026-01-04" },
  { id: 1002, customer: "Fabrikam", product: "Ops Console", status: "Pending", value: 3100, placed: "2026-01-08" },
  { id: 1003, customer: "Contoso", product: "Grid License", status: "Paid", value: 5600, placed: "2026-01-13" },
  { id: 1004, customer: "Litware", product: "Support Plan", status: "Review", value: 1800, placed: "2026-01-21" },
];

export const orderColumns: Column<Order>[] = [
  { id: "id", field: "id", headerName: "Order", width: 120, sortable: true, filter: "number" },
  { id: "customer", field: "customer", headerName: "Customer", width: 180, sortable: true, filter: "text" },
  { id: "product", field: "product", headerName: "Product", width: 190, sortable: true, filter: "text" },
  { id: "status", field: "status", headerName: "Status", width: 130, sortable: true, filter: "set" },
  { id: "value", field: "value", headerName: "Value", width: 130, sortable: true, filter: "number", valueFormatter: (value) => `$${Number(value).toLocaleString()}` },
  { id: "placed", field: "placed", headerName: "Placed", width: 140, sortable: true, filter: "date" },
];
