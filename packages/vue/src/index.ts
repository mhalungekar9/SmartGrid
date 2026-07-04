import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from "vue";
import {
  GridNexaGrid,
  type GridNexaJavaScriptOptions,
} from "@gridnexa/javascript";

export type GridNexaVueOptions<T = Record<string, unknown>> =
  GridNexaJavaScriptOptions<T>;

export const GridNexaVue = defineComponent({
  name: "GridNexaVue",
  props: {
    columns: {
      type: Array as PropType<GridNexaJavaScriptOptions["columns"]>,
      required: true,
    },
    rows: {
      type: Array as PropType<Record<string, unknown>[]>,
      required: true,
    },
    mergedHeaders: {
      type: Array as PropType<GridNexaJavaScriptOptions["mergedHeaders"]>,
      default: undefined,
    },
    rowNumbers: {
      type: Boolean,
      default: false,
    },
    checkboxSelection: {
      type: Boolean,
      default: false,
    },
    quickFilterText: {
      type: String,
      default: "",
    },
    columnFilters: {
      type: Object as PropType<GridNexaJavaScriptOptions["columnFilters"]>,
      default: undefined,
    },
    getRowId: {
      type: Function as PropType<GridNexaJavaScriptOptions["getRowId"]>,
      default: undefined,
    },
  },
  emits: ["rowSelectionChange", "cellClick"],
  setup(props, { emit }) {
    const host = ref<HTMLElement | null>(null);
    let grid: GridNexaGrid | undefined;

    const getOptions = (): GridNexaJavaScriptOptions => ({
      columns: props.columns,
      rows: props.rows,
      mergedHeaders: props.mergedHeaders,
      rowNumbers: props.rowNumbers,
      checkboxSelection: props.checkboxSelection,
      quickFilterText: props.quickFilterText,
      columnFilters: props.columnFilters,
      getRowId: props.getRowId,
      onRowSelectionChange: (rows: Record<string, unknown>[]) =>
        emit("rowSelectionChange", rows),
      onCellClick: (event: {
        row: Record<string, unknown>;
        rowIndex: number;
        column: GridNexaJavaScriptOptions["columns"][number];
      }) => emit("cellClick", event),
    });

    onMounted(() => {
      if (host.value) {
        grid = new GridNexaGrid(host.value, getOptions());
      }
    });

    watch(
      () => ({ ...props }),
      () => grid?.update(getOptions()),
      { deep: true },
    );

    onBeforeUnmount(() => {
      grid?.destroy();
    });

    return () => h("div", { ref: host, class: "gridnexa-vue-host" });
  },
});

export default GridNexaVue;
export * from "@gridnexa/javascript";
