import { useAppStore } from "../../store";

interface Props {
  paneId: string;
  children?: React.ReactNode;
}

export default function PaneWrapper({ paneId, children }: Props) {
  const focusedPaneId = useAppStore((s) => s.focusedPaneId);
  const focusPane = useAppStore((s) => s.focusPane);
  const isFocused = paneId === focusedPaneId;

  return (
    <div
      onClick={() => focusPane(paneId)}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        outline: "none",
        borderRadius: "var(--radius-sm)",
        border: isFocused
          ? "1px solid var(--border-focus)"
          : "1px solid var(--border)",
        transition: "border-color var(--transition-fast)",
      }}
    >
      {/* 알림 링 (Phase 5-D에서 활성화) */}
      {children ?? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-dim)",
            fontSize: "var(--font-size-sm)",
            background: "var(--bg-surface)",
          }}
        >
          pane · {paneId.slice(0, 8)}
        </div>
      )}
    </div>
  );
}
