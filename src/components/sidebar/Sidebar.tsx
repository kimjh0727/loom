import WorkspaceTab from "./WorkspaceTab";
import AddWorkspaceButton from "./AddWorkspaceButton";
import { useAppStore } from "../../store";

export default function Sidebar() {
  const workspaces = useAppStore((s) => s.workspaces);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const selectWorkspace = useAppStore((s) => s.selectWorkspace);
  const createWorkspace = useAppStore((s) => s.createWorkspace);

  const handleAdd = () => {
    const name = `workspace-${workspaces.length + 1}`;
    createWorkspace(name);
  };

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        minWidth: "var(--sidebar-width)",
        height: "100%",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 12px 10px",
          borderBottom: "1px solid var(--sidebar-border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: "var(--font-size-lg)",
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "-0.5px",
          }}
        >
          loom
        </span>
      </div>

      {/* Workspace list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "6px 6px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {workspaces.length === 0 && (
          <p
            style={{
              padding: "12px",
              fontSize: "var(--font-size-xs)",
              color: "var(--text-dim)",
              textAlign: "center",
            }}
          >
            No workspaces yet
          </p>
        )}
        {workspaces.map((ws) => (
          <WorkspaceTab
            key={ws.id}
            workspace={ws}
            isActive={ws.id === activeWorkspaceId}
            onClick={() => selectWorkspace(ws.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "6px",
          borderTop: "1px solid var(--sidebar-border)",
        }}
      >
        <AddWorkspaceButton onClick={handleAdd} />
      </div>
    </aside>
  );
}
