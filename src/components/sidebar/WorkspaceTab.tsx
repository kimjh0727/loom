import WorkspaceTabBadge from "./WorkspaceTabBadge";
import { Workspace } from "../../types/workspace";

interface Props {
  workspace: Workspace;
  isActive: boolean;
  onClick: () => void;
}

export default function WorkspaceTab({ workspace, isActive, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "8px 12px",
        cursor: "pointer",
        borderRadius: "var(--radius-md)",
        background: isActive ? "var(--bg-active)" : "transparent",
        borderLeft: isActive
          ? "2px solid var(--accent)"
          : "2px solid transparent",
        transition: "background var(--transition-fast)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.background =
            "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Top row: name + badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          className="truncate"
          style={{
            flex: 1,
            fontSize: "var(--font-size-sm)",
            fontWeight: isActive ? 600 : 400,
            color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
          }}
        >
          {workspace.name}
        </span>
        <WorkspaceTabBadge count={workspace.unreadCount} />
      </div>

      {/* Bottom row: git branch + process */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {workspace.gitBranch && (
          <span
            className="truncate"
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-dim)",
              maxWidth: 110,
            }}
          >
            ⎇ {workspace.gitBranch}
          </span>
        )}
        {workspace.activeProcess && (
          <span
            className="truncate"
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-success)",
              opacity: 0.8,
            }}
          >
            {workspace.activeProcess}
          </span>
        )}
      </div>
    </div>
  );
}
