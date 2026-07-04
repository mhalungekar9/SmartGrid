# @gridnexa/javascript

Framework-free GridNexa package for plain JavaScript and TypeScript apps.

```ts
import { createGridNexa } from "@gridnexa/javascript";

const grid = createGridNexa(document.getElementById("grid")!, {
  columns,
  rows,
  rowNumbers: true,
  checkboxSelection: true,
  getRowId: (row) => row.id,
});

grid.update({ quickFilterText: "finance" });
```
