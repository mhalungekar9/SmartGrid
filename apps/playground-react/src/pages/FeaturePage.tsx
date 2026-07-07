import { GridNexa } from "@gridnexa/react";
import { ExampleLayout } from "../components/ExampleLayout";
import { Toolbar } from "../components/Toolbar";
import {
  employeeColumns,
  employees,
  employeeTransaction,
} from "../data/employees";
import { getEmployeeTreePath } from "../data/treeData";
import { useAppTheme } from "../hooks/useTheme";
import type { FeatureConfig } from "./pageConfigs";

interface FeaturePageProps {
  config: FeatureConfig;
}

const defaultDetails = [
  "Import GridNexa and Column from @gridnexa/react, then provide typed row data.",
  "Keep column ids stable; GridNexa uses them for sorting, filtering, resizing, and menus.",
  "Use getRowId whenever rows can be selected, edited, paged, filtered, or updated from a server.",
];

export function FeaturePage({ config }: FeaturePageProps) {
  const theme = useAppTheme();
  const toolbar = config.toolbar ?? false;

  return (
    <ExampleLayout
      title={config.title}
      subtitle={config.subtitle}
      overview={config.overview}
      details={[...defaultDetails, ...(config.details ?? [])]}
      code={config.code}
    >
      <Toolbar title="Feature notes" items={config.notes} />
      <GridNexa
        columns={config.columns ?? employeeColumns}
        rows={config.rows ?? employees}
        theme={theme}
        mergedHeaders={config.mergedHeaders}
        getRowId={(row) => row.id}
        checkboxSelection={config.checkboxSelection}
        rowNumbers={config.rowNumbers}
        enableRowReorder={config.enableRowReorder}
        height={config.height}
        columnTools={config.columnTools}
        textDisplay={config.textDisplay}
        createRow={config.createRow}
        toolbar={toolbar}
        sidePanel={config.sidePanel}
        pageSize={config.pageSize}
        quickFilterText={config.quickFilterText}
        columnFilters={config.columnFilters}
        advancedFilterModel={config.advancedFilterModel}
        groupBy={config.groupBy}
        pivotBy={config.pivotBy}
        pivotValueColumns={config.pivotValueColumns}
        pivotAggregation={config.pivotAggregation}
        getTreeDataPath={config.treeData ? getEmployeeTreePath : undefined}
        masterDetailRenderer={
          config.masterDetail
            ? (row) => (
                <div className="detail-panel">
                  <strong>{row.name}</strong>
                  <span>{row.manager} manages this employee in {row.region}.</span>
                </div>
              )
            : undefined
        }
        transaction={config.transaction ? employeeTransaction : undefined}
        onServerSideOperation={
          config.serverEvents
            ? (state) => console.info("GridNexa operation", state)
            : undefined
        }
        onCellValueChange={
          config.cellEvents
            ? (event) => console.info("Cell changed", event)
            : undefined
        }
        onSelectedRowChange={
          config.cellEvents
            ? (event) => console.info("Selected row changed", event)
            : undefined
        }
        onSelectionChanged={
          config.cellEvents
            ? (event) => console.info("Selection changed", event)
            : undefined
        }
        onRowOrderChange={
          config.enableRowReorder
            ? (event) => console.info("Row order changed", event)
            : undefined
        }
        onRowAdd={
          config.createRow
            ? (event) => console.info("Row added", event)
            : undefined
        }
        onRowDelete={
          config.createRow
            ? (event) => console.info("Row deleted", event)
            : undefined
        }
        onRowsDelete={
          config.createRow
            ? (event) => console.info("Rows deleted", event)
            : undefined
        }
        onDataChange={
          config.createRow
            ? (event) => console.info("Data changed", event)
            : undefined
        }
        onSaveAll={
          config.cellEvents ||
          (typeof config.toolbar === "object" && config.toolbar.saveAll)
            ? (event) => console.info("Save all requested", event)
            : undefined
        }
      />
    </ExampleLayout>
  );
}
