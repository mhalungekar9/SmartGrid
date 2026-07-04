# @gridnexa/vue

Vue package for GridNexa.

```vue
<script setup lang="ts">
import { GridNexaVue } from "@gridnexa/vue";

const columns = [
  { id: "name", field: "name", headerName: "Name", sortable: true },
  { id: "score", field: "score", headerName: "Score", sortable: true },
];

const rows = [
  { id: 1, name: "Ava", score: 94 },
  { id: 2, name: "Noah", score: 88 },
];
</script>

<template>
  <GridNexaVue
    :columns="columns"
    :rows="rows"
    row-numbers
    checkbox-selection
    @row-selection-change="console.log"
  />
</template>
```
