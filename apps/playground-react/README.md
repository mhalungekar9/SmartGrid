# GridNexa React Playground

A focused examples site for GridNexa React. Each page demonstrates one grid capability with a live preview and copyable usage code.

## Features

- Basic grid setup
- Sorting and filtering
- Pagination and selection
- Column resizing, pinning, aligned header drag/reorder, and templates
- Editing, formulas, tree grid, grouping, pivoting, export, events, and performance examples
- Light and dark themes

## External App Parity

The playground imports the package stylesheet explicitly:

```ts
import "@gridnexa/react/index.css";
```

Use the same import once in external React apps so header layout, drag handles, column reorder drop indicators, pinned columns, popovers, scrollbars, and default themes match the playground.
