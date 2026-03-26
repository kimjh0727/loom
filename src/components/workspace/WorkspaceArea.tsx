import SplitPane from "./SplitPane";
import { useAppStore } from "../../store";

export default function WorkspaceArea() {
  const workspaces = useAppStore((s) => s.workspaces);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const paneRoots = useAppStore((s) => s.paneRoots);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  if (!activeWorkspace) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-dim)",
          fontSize: "var(--font-size-sm)",
          background: "var(--bg-base)",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 32, opacity: 0.3 }}>⧉</span>
        <span>워크스페이스를 선택하세요</span>
      </div>
    );
  }

  const paneRoot = paneRoots[activeWorkspace.id];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--bg-base)",
      }}
    >
      {/* Workspace title bar */}
      <div
        style={{
          height: 36,
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
          flexShrink: 0,
          background: "var(--bg-surface)",
        }}
      >
        <span
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--text-secondary)",
            fontWeight: 500,
          }}
        >
          {activeWorkspace.name}
        </span>
        {activeWorkspace.gitBranch && (
          <span
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-dim)",
              background: "var(--bg-elevated)",
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            ⎇ {activeWorkspace.gitBranch}
          </span>
        )}
      </div>

      {/* Pane area */}
      <div style={{ flex: 1, overflow: "hidden", padding: 4 }}>
        {paneRoot
          ? <SplitPane node={paneRoot} workspaceId={activeWorkspace.id} />
          : <div style={{ color: "var(--text-dim)", margin: "auto", fontSize: "var(--font-size-sm)" }}>loading...</div>
        }
      </div>
    </div>
  );
}
