import { useEffect } from "react";
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

  // 키보드 단축키: Ctrl+D (우분할), Ctrl+Shift+D (아래분할)
  useEffect(() => {
    if (!isFocused) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.key !== "d") return;
      e.preventDefault();
      const direction = e.shiftKey ? "vertical" : "horizontal";
      splitPane(workspaceId, paneId, direction);
      // 새 TerminalPane이 마운트될 때 spawnTerminal을 자동 호출함
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFocused, paneId, workspaceId, splitPane]);

  return (
    <div
      onMouseDown={() => focusPane(paneId)}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
        minHeight: 0,
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
