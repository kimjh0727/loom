import { useAppStore } from "../../store";
import TerminalPane from "../terminal/TerminalPane";

interface Props {
  paneId: string;
  workspaceId: string;
}

export default function PaneWrapper({ paneId, workspaceId }: Props) {
  const focusedPaneId = useAppStore((s) => s.focusedPaneId);
  const focusPane = useAppStore((s) => s.focusPane);
  const splitPane = useAppStore((s) => s.splitPane);
  const closePane = useAppStore((s) => s.closePane);
  const isFocused = paneId === focusedPaneId;

  return (
    <div
      onMouseDown={() => focusPane(paneId)}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "var(--radius-sm)",
        border: isFocused
          ? "1px solid var(--border-focus)"
          : "1px solid var(--border)",
        transition: "border-color var(--transition-fast)",
      }}
    >
      <TerminalPane
        paneId={paneId}
        workspaceId={workspaceId}
        onSplitRight={() => splitPane(workspaceId, paneId, "horizontal")}
        onSplitDown={() => splitPane(workspaceId, paneId, "vertical")}
        onClose={() => closePane(workspaceId, paneId)}
      />
    </div>
  );
}
