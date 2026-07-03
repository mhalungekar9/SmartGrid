export class ColumnResizeEngine {
  resize(
    currentWidth: number,
    deltaX: number,
    minWidth = 60,
    maxWidth = 1000,
  ): number {
    const width = currentWidth + deltaX;

    return Math.max(minWidth, Math.min(maxWidth, width));
  }
}
