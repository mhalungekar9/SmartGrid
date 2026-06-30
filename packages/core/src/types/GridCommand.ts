export interface GridCommand {
  execute(): void;

  undo(): void;
}
