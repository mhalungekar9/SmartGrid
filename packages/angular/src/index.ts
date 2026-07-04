import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from "@angular/core";
import {
  GridNexaGrid,
  type GridNexaJavaScriptOptions,
} from "@gridnexa/javascript";

export type GridNexaAngularOptions<T = Record<string, unknown>> =
  GridNexaJavaScriptOptions<T>;

@Component({
  selector: "grid-nexa",
  standalone: true,
  template: "<div #host class=\"gridnexa-angular-host\"></div>",
})
export class GridNexaAngularComponent<T = Record<string, unknown>>
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input({ required: true }) columns: GridNexaJavaScriptOptions<T>["columns"] = [];
  @Input({ required: true }) rows: T[] = [];
  @Input() mergedHeaders: GridNexaJavaScriptOptions<T>["mergedHeaders"];
  @Input() rowNumbers = false;
  @Input() checkboxSelection = false;
  @Input() quickFilterText = "";
  @Input() columnFilters: GridNexaJavaScriptOptions<T>["columnFilters"];
  @Input() getRowId: GridNexaJavaScriptOptions<T>["getRowId"];

  @Output() rowSelectionChange = new EventEmitter<T[]>();
  @Output() cellClick = new EventEmitter<{
    row: T;
    rowIndex: number;
    column: GridNexaJavaScriptOptions<T>["columns"][number];
  }>();

  @ViewChild("host", { static: true }) host?: ElementRef<HTMLElement>;

  private grid?: GridNexaGrid<T>;

  ngAfterViewInit() {
    if (!this.host) {
      return;
    }

    this.grid = new GridNexaGrid(this.host.nativeElement, this.getOptions());
  }

  ngOnChanges() {
    this.grid?.update(this.getOptions());
  }

  ngOnDestroy() {
    this.grid?.destroy();
  }

  private getOptions(): GridNexaJavaScriptOptions<T> {
    return {
      columns: this.columns,
      rows: this.rows,
      mergedHeaders: this.mergedHeaders,
      rowNumbers: this.rowNumbers,
      checkboxSelection: this.checkboxSelection,
      quickFilterText: this.quickFilterText,
      columnFilters: this.columnFilters,
      getRowId: this.getRowId,
      onRowSelectionChange: (rows: T[]) => this.rowSelectionChange.emit(rows),
      onCellClick: (event: {
        row: T;
        rowIndex: number;
        column: GridNexaJavaScriptOptions<T>["columns"][number];
      }) => this.cellClick.emit(event),
    };
  }
}

export * from "@gridnexa/javascript";
