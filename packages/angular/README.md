# @gridnexa/angular

Angular package for GridNexa.

```ts
import { Component } from "@angular/core";
import { GridNexaAngularComponent } from "@gridnexa/angular";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [GridNexaAngularComponent],
  template: `
    <grid-nexa
      [columns]="columns"
      [rows]="rows"
      [rowNumbers]="true"
      [checkboxSelection]="true"
      (rowSelectionChange)="onSelection($event)"
    />
  `,
})
export class AppComponent {
  columns = columns;
  rows = rows;

  onSelection(rows: unknown[]) {
    console.log(rows);
  }
}
```
