import { GridNexa } from "@gridnexa/react";
import { ExampleLayout } from "../components/ExampleLayout";
import { Toolbar } from "../components/Toolbar";
import {
  employeeColumns,
  employees,
  employeeTransaction,
} from "../data/employees";
import { getEmployeeTreePath } from "../data/treeData";
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
        mergedHeaders={config.mergedHeaders}
        getRowId={(row) => row.id}
        checkboxSelection={config.checkboxSelection}
        rowNumbers={config.rowNumbers}
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
      />
    </ExampleLayout>
  );
}
