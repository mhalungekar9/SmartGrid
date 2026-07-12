import { useMemo, useState } from "react";
import {
  GridNexa,
  type Column,
  type GridNexaCollaborationCellEvent,
  type GridNexaCollaborationProvider,
} from "@gridnexa/react";
import { CodeViewer } from "../../components/CodeViewer";
import { DemoCard } from "../../components/DemoCard";
import { useAppTheme } from "../../hooks/useTheme";

interface TeamRow {
  id: number;
  task: string;
  owner: string;
  status: string;
  confidence: number;
}

const remoteUser = { id: "maya", name: "Maya", color: "#f59e0b" };

const columns: Column<TeamRow>[] = [
  { id: "task", field: "task", headerName: "Task", minWidth: 210, editable: true, filter: "text" },
  { id: "owner", field: "owner", headerName: "Owner", width: 150, editable: true, filter: "set" },
  { id: "status", field: "status", headerName: "Status", width: 150, editable: true, editor: { type: "select", values: ["Draft", "Review", "Ready", "Blocked"] }, filter: "set" },
  { id: "confidence", field: "confidence", headerName: "Confidence", width: 140, editable: true, editor: "number", filter: "number" },
];

const rows: TeamRow[] = [
  { id: 1, task: "Renewal risk review", owner: "Aarav", status: "Review", confidence: 86 },
  { id: 2, task: "Pipeline cleanup", owner: "Maya", status: "Draft", confidence: 72 },
  { id: 3, task: "Support escalation export", owner: "Kenji", status: "Ready", confidence: 91 },
  { id: 4, task: "Regional dashboard QA", owner: "Nina", status: "Blocked", confidence: 64 },
];

function createLocalProvider() {
  const handlers = new Set<(event: GridNexaCollaborationCellEvent) => void>();

  return {
    subscribe(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    publish(event) {
      console.info("GridNexa collaboration event", event);
    },
    simulate(event) {
      handlers.forEach((handler) => handler(event));
    },
  } satisfies GridNexaCollaborationProvider & {
    simulate: (event: GridNexaCollaborationCellEvent) => void;
  };
}

const code = `const provider = {
  subscribe(handler) {
    socket.on("grid-cell-event", handler);
    return () => socket.off("grid-cell-event", handler);
  },
  publish(event) {
    socket.emit("grid-cell-event", event);
  },
};

<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  collaboration={{
    user: { id: currentUser.id, name: currentUser.name, color: "#22c55e" },
    provider,
    showPresence: true,
    conflictMode: "cell-lock"
  }}
/>`;

export function Collaboration() {
  const theme = useAppTheme();
  const provider = useMemo(createLocalProvider, []);
  const [version, setVersion] = useState(1);

  const simulateRemote = (event: Omit<GridNexaCollaborationCellEvent, "user" | "timestamp">) => {
    const nextVersion = version + 1;

    setVersion(nextVersion);
    provider.simulate({
      ...event,
      user: remoteUser,
      timestamp: Date.now(),
      version: nextVersion,
    });
  };

  return (
    <div className="showcase-page">
      <section className="showcase-hero">
        <div>
          <span className="eyebrow">Collaboration and accessibility</span>
          <h2>Realtime editing hooks with keyboard-first grid semantics</h2>
          <p>
            Wire GridNexa to your own realtime provider, show remote presence, lock active
            cells during edits, and keep spreadsheet navigation available from the keyboard.
          </p>
        </div>
      </section>

      <div className="example-grid">
        <DemoCard title="Live collaboration grid" description="Use the buttons to simulate another user locking, changing, and unlocking a cell.">
          <div className="demo-action-row">
            <button
              type="button"
              onClick={() =>
                simulateRemote({
                  type: "cell-lock",
                  rowId: 2,
                  rowIndex: 1,
                  columnId: "status",
                  field: "status",
                })
              }
            >
              Simulate remote lock
            </button>
            <button
              type="button"
              onClick={() =>
                simulateRemote({
                  type: "cell-change",
                  rowId: 2,
                  rowIndex: 1,
                  columnId: "status",
                  field: "status",
                  value: "Ready",
                })
              }
            >
              Simulate remote update
            </button>
            <button
              type="button"
              onClick={() =>
                simulateRemote({
                  type: "cell-unlock",
                  rowId: 2,
                  rowIndex: 1,
                  columnId: "status",
                  field: "status",
                })
              }
            >
              Simulate unlock
            </button>
          </div>
          <GridNexa
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            theme={theme}
            preset="admin"
            enableRangeSelection
            enableUndoRedo
            toolbar={{ quickFilter: true, copyPaste: true, bulkEdit: true, undoRedo: true }}
            collaboration={{
              user: { id: "local", name: "You", color: "#22c55e" },
              provider,
              showPresence: true,
              conflictMode: "cell-lock",
            }}
          />
        </DemoCard>
        <DemoCard title="Provider contract" description="Use your own WebSocket, Socket.IO, Supabase, Firebase, Yjs, or internal event bus.">
          <CodeViewer code={code} />
        </DemoCard>
      </div>
    </div>
  );
}
