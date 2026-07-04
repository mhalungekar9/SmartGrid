import type { Column } from "@gridnexa/react";

export interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  rating: number;
}

export const products: Product[] = [
  { id: 1, name: "GridNexa Pro", category: "Licensing", stock: 42, rating: 4.9 },
  { id: 2, name: "Data Bridge", category: "Integrations", stock: 18, rating: 4.7 },
  { id: 3, name: "Audit Pack", category: "Compliance", stock: 24, rating: 4.6 },
];

export const productColumns: Column<Product>[] = [
  { id: "name", field: "name", headerName: "Product", width: 210, sortable: true, filter: "text" },
  { id: "category", field: "category", headerName: "Category", width: 160, sortable: true, filter: "set" },
  { id: "stock", field: "stock", headerName: "Stock", width: 120, sortable: true, filter: "number" },
  { id: "rating", field: "rating", headerName: "Rating", width: 120, sortable: true, filter: "number" },
];
