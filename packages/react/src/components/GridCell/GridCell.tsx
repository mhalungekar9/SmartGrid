import type { Column } from "@gridnexa/core";
import type { ChangeEvent, CSSProperties, KeyboardEvent, ReactNode } from "react";
import "./GridCell.css";
import { cx, useGridContext } from "../../context/GridContext";
import { getColumnValue, getRawColumnValue } from "../../utils/cellValue";

interface Props<T> {
  row: T;
  rowIndex: number;
  columnIndex: number;
  column: Column<T>;
  leadingAction?: ReactNode;
  detailAction?: ReactNode;
  trailingAction?: ReactNode;
}

function normalizeSelectOption(
  option:
    | string
    | number
    | boolean
    | { value: string | number | boolean; label?: string; disabled?: boolean },
) {
  return typeof option === "object"
    ? {
        value: String(option.value),
        label: option.label ?? String(option.value),
        disabled: option.disabled,
      }
    : { value: String(option), label: String(option), disabled: false };
}

function getCellStyle<T>(
  column: Column<T>,
  row: T,
  rowIndex: number,
  value: unknown,
  layoutStyle: CSSProperties,
): CSSProperties {
  const cellStyleConfig = (column as Column<T> & {
    cellStyle?:
      | Record<string, string | number | undefined>
      | ((params: {
          value: unknown;
          row: T;
          rowIndex: number;
          column: Column<T>;
        }) => Record<string, string | number | undefined>);
  }).cellStyle;
  const cellStyle =
    typeof cellStyleConfig === "function"
      ? cellStyleConfig({ value, row, rowIndex, column })
      : cellStyleConfig;

  return cellStyle ? ({ ...layoutStyle, ...cellStyle } as CSSProperties) : layoutStyle;
}

export function GridCell<T>({
  row,
  rowIndex,
  columnIndex,
  column,
  leadingAction,
  detailAction,
  trailingAction,
}: Props<T>) {
  const {
    getColumnStyle,
    editingCell,
    startCellEdit,
    updateCellDraft,
    commitCellEdit,
    cancelCellEdit,
    activeCell,
    selectionAnchor,
    findMatch,
    getCellId,
    getCollaborationPresence,
    isCellLockedByOtherUser,
    setActiveCell,
    setSelectionAnchor,
    openCellContextMenu,
    classNames,
    selectedRowIndex,
    selectedRowIds,
    getRowSelectionId,
    getCellClassName,
    getColumnTextDisplay,
    emitCellClick,
    emitCellDoubleClick,
  } = useGridContext<T>();
  const value = getColumnValue(row, column);
  const rawValue = getRawColumnValue(row, column);
  const isEditing =
    editingCell?.rowIndex === rowIndex && editingCell.columnId === column.id;
  const isActiveCell =
    activeCell?.rowIndex === rowIndex && activeCell.columnIndex === columnIndex;
  const isFindMatch =
    findMatch?.rowIndex === rowIndex && findMatch.columnIndex === columnIndex;
  const isSelected =
    selectedRowIndex === rowIndex || selectedRowIds.has(getRowSelectionId(row, rowIndex));
  const collaborationPresence = getCollaborationPresence(rowIndex, column.id);
  const lockedByOtherUser = isCellLockedByOtherUser(rowIndex, column.id);
  const rangeStartRow = Math.min(
    activeCell?.rowIndex ?? rowIndex,
    selectionAnchor?.rowIndex ?? rowIndex,
  );
  const rangeEndRow = Math.max(
    activeCell?.rowIndex ?? rowIndex,
    selectionAnchor?.rowIndex ?? rowIndex,
  );
  const rangeStartColumn = Math.min(
    activeCell?.columnIndex ?? columnIndex,
    selectionAnchor?.columnIndex ?? columnIndex,
  );
  const rangeEndColumn = Math.max(
    activeCell?.columnIndex ?? columnIndex,
    selectionAnchor?.columnIndex ?? columnIndex,
  );
  const isInRange =
    activeCell &&
    selectionAnchor &&
    rowIndex >= rangeStartRow &&
    rowIndex <= rangeEndRow &&
    columnIndex >= rangeStartColumn &&
    columnIndex <= rangeEndColumn;
  const renderedValue: ReactNode = typeof column.cellRenderer === "function"
    ? (column.cellRenderer(value, row) as ReactNode)
    : typeof column.valueFormatter === "function"
      ? column.valueFormatter(value)
      : String(value ?? "");
  const editor =
    typeof column.editor === "string"
      ? { type: column.editor }
      : (column.editor ?? { type: "text" });
  const editorType = editor.type ?? "text";
  const selectOptions = (editor.values ?? []).map(normalizeSelectOption);
  const filteredSelectOptions =
    editorType === "advancedSelect" && editor.searchable !== false
      ? selectOptions.filter((option) =>
          option.label
            .toLowerCase()
            .includes(editingCell?.draftValue.toLowerCase() ?? ""),
        )
      : selectOptions;
  const columnStyle = getColumnStyle(column.id);
  const cellStyle = getCellStyle(column, row, rowIndex, value, columnStyle);
  const pinnedSide =
    column.pinned ??
    (columnStyle.left !== undefined
      ? "left"
      : columnStyle.right !== undefined
        ? "right"
        : undefined);
  const textDisplay = getColumnTextDisplay(column);
  const renderedCellStyle =
    textDisplay.lineClamp || textDisplay.minWidth
      ? {
          ...cellStyle,
          ...(textDisplay.lineClamp
            ? { "--gnx-text-line-clamp": textDisplay.lineClamp } as CSSProperties
            : {}),
          ...(textDisplay.minWidth ? { minWidth: textDisplay.minWidth } : {}),
        }
      : cellStyle;
  const tooltipText =
    textDisplay.overflow === "ellipsis" && textDisplay.showTooltip !== false
      ? String(value ?? "")
      : undefined;

  if (isEditing) {
    const commonEditorProps = {
      className: "sg-cell-input",
      autoFocus: true,
      value: editingCell.draftValue,
      onChange: (
        event:
          | ChangeEvent<HTMLInputElement>
          | ChangeEvent<HTMLTextAreaElement>
          | ChangeEvent<HTMLSelectElement>,
      ) => updateCellDraft(event.target.value),
      onBlur: commitCellEdit,
      onKeyDown: (
        event:
          | KeyboardEvent<HTMLInputElement>
          | KeyboardEvent<HTMLTextAreaElement>
          | KeyboardEvent<HTMLSelectElement>,
      ) => {
        if (event.key === "Enter" && editorType !== "largeText") {
          event.preventDefault();
          commitCellEdit();
        }

        if (event.key === "Escape") {
          event.preventDefault();
          cancelCellEdit();
        }
      },
    };

    return (
      <div
        className={cx(
          "sg-cell sg-cell--editing",
          classNames.cell,
          typeof column.className === "function"
            ? column.className({ value, row, rowIndex, column })
            : column.className,
          typeof column.cellClassName === "function"
            ? column.cellClassName({ value, row, rowIndex, column })
            : column.cellClassName,
          getCellClassName({ value, row, rowIndex, column, columnIndex, selected: isSelected }),
        )}
        data-gnx-pinned={pinnedSide}
        role="gridcell"
        aria-rowindex={rowIndex + 2}
        aria-colindex={columnIndex + 1}
        aria-selected={isActiveCell || isSelected}
        style={renderedCellStyle}
      >
        {editorType === "largeText" ? (
          <textarea {...commonEditorProps} />
        ) : editorType === "select" ? (
          <select {...commonEditorProps}>
            {selectOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        ) : editorType === "advancedSelect" ? (
          <div className="sg-advanced-select" role="combobox" aria-expanded="true">
            <input
              {...commonEditorProps}
              role="searchbox"
              placeholder={editor.placeholder ?? "Search options"}
              list={`${column.id}-${rowIndex}-options`}
            />
            <datalist id={`${column.id}-${rowIndex}-options`}>
              {filteredSelectOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  disabled={option.disabled}
                />
              ))}
            </datalist>
            {editor.allowCustomValue === false &&
            editingCell.draftValue &&
            !selectOptions.some((option) => option.value === editingCell.draftValue) ? (
              <div className="sg-advanced-select-message" role="status">
                {editor.noOptionsText ?? "Choose a listed option"}
              </div>
            ) : null}
          </div>
        ) : editorType === "checkbox" ? (
          <input
            className="sg-cell-checkbox"
            autoFocus
            type="checkbox"
            checked={editingCell.draftValue === "true"}
            onChange={(event) =>
              updateCellDraft(event.target.checked ? "true" : "false")
            }
            onBlur={commitCellEdit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitCellEdit();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                cancelCellEdit();
              }
            }}
          />
        ) : (
          <input
            {...commonEditorProps}
            type={
              editorType === "number"
                ? "number"
                : editorType === "date"
                  ? "date"
                  : "text"
            }
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cx(
        "sg-cell",
        isInRange && "sg-cell--range",
        isActiveCell && "sg-cell--active",
        isFindMatch && "sg-cell--find-match",
        classNames.cell,
        typeof column.className === "function"
          ? column.className({ value, row, rowIndex, column })
          : column.className,
        typeof column.cellClassName === "function"
          ? column.cellClassName({ value, row, rowIndex, column })
          : column.cellClassName,
        getCellClassName({ value, row, rowIndex, column, columnIndex, selected: isSelected }),
      )}
      data-gnx-pinned={pinnedSide}
      data-gnx-collaboration-lock={lockedByOtherUser ? "true" : undefined}
      data-text-overflow={textDisplay.overflow ?? "ellipsis"}
      id={getCellId(rowIndex, columnIndex)}
      role="gridcell"
      aria-colindex={columnIndex + 1}
      aria-rowindex={rowIndex + 2}
      aria-selected={isActiveCell || isSelected}
      aria-readonly={column.editable === false || lockedByOtherUser}
      aria-describedby={collaborationPresence ? `${getCellId(rowIndex, columnIndex)}-presence` : undefined}
      title={tooltipText}
      style={renderedCellStyle}
      tabIndex={isActiveCell ? 0 : -1}
      onClick={(event) => {
        if (event.shiftKey && activeCell) {
          setSelectionAnchor(rowIndex, columnIndex);
          emitCellClick(rowIndex, columnIndex);
          return;
        }

        setActiveCell(rowIndex, columnIndex);
        emitCellClick(rowIndex, columnIndex);
      }}
      onDoubleClick={() => {
        emitCellDoubleClick(rowIndex, columnIndex);
        if (column.editable && !lockedByOtherUser) {
          startCellEdit(rowIndex, column.id, String(rawValue ?? ""));
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setActiveCell(rowIndex, columnIndex);
        openCellContextMenu(rowIndex, columnIndex, event.clientX, event.clientY);
      }}
      onKeyDown={(event) => {
        if (column.editable && !lockedByOtherUser && (event.key === "Enter" || event.key === "F2")) {
          event.preventDefault();
          startCellEdit(rowIndex, column.id, String(rawValue ?? ""));
        }
      }}
    >
      {leadingAction}
      {detailAction}
      <span className="sg-cell-value">{renderedValue}</span>
      {collaborationPresence ? (
        <span
          id={`${getCellId(rowIndex, columnIndex)}-presence`}
          className="sg-collab-presence"
          style={{ backgroundColor: collaborationPresence.color }}
          title={`${collaborationPresence.name}${collaborationPresence.locked ? " is editing" : " is viewing"}`}
        >
          {collaborationPresence.name.slice(0, 2).toUpperCase()}
        </span>
      ) : null}
      {trailingAction}
    </div>
  );
}
