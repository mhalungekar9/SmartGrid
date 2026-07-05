# GridNexa Implementation Memory

## Framework Package Strategy

GridNexa is intended to be an enterprise grid with separate installable packages for each supported UI technology:

- `@gridnexa/react`
- `@gridnexa/angular`
- `@gridnexa/vue`
- `@gridnexa/javascript`

Each framework package must be usable in isolation from npm. Do not implement Angular, Vue, or JavaScript by mounting the React package internally, and do not make one framework package depend on another framework package.

Allowed shared dependency:

- `@gridnexa/core` for shared types, models, contracts, and framework-neutral utilities.

Disallowed shortcuts:

- `@gridnexa/javascript` mounting `@gridnexa/react` through `react-dom`.
- `@gridnexa/angular` wrapping React, Vue, or JavaScript package code.
- `@gridnexa/vue` wrapping React, Angular, or JavaScript package code.
- Moving all behavior into a single DOM renderer if that prevents framework-native implementations.

## Implementation Direction

React, Angular, Vue, and JavaScript should each have native package code that matches the public GridNexa feature contract. Shared behavior can be extracted into `@gridnexa/core` only when it is framework-neutral and does not erase framework-native ownership.

When adding a new grid feature:

1. Define or update shared types in `@gridnexa/core` if needed.
2. Implement the feature natively in `@gridnexa/react`.
3. Implement the same feature natively in `@gridnexa/angular`.
4. Implement the same feature natively in `@gridnexa/vue`.
5. Implement the same feature natively in `@gridnexa/javascript`.
6. Update playground usage examples for React, Angular, Vue, and JavaScript.
7. Build all packages and the playground.

Verification commands:

```bash
pnpm --filter @gridnexa/react build
pnpm --filter @gridnexa/angular build
pnpm --filter @gridnexa/vue build
pnpm --filter @gridnexa/javascript build
pnpm --filter playground-react build
```

## Current Enterprise Goal

All supported packages should expose the same GridNexa capabilities, including:

- filtering, quick filter, external filter, and advanced filter
- row selection, row numbers, range selection, and fill handle
- formulas, find, editing, undo/redo, and clipboard operations
- CSV and Excel export
- grouping, pivoting, tree data, aggregation, and master/detail
- column menu, context menu, tool panels, and status bar
- column resize, column reorder, frozen columns, row reorder
- server-side operation events
- theme and CSS customization

The standard is feature parity, not only matching prop names.
