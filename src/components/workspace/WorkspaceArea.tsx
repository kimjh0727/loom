import SplitPane from "./SplitPane";
import PaneWrapper from "./PaneWrapper";
import { useAppStore } from "../../store";
import { PaneRectProvider, usePaneRectContext } from "../../context/PaneRectContext";
import { PaneNode } from "../../types/workspace";

function getAllLeafIds(node: PaneNode): string[] {
  if (node.kind === "leaf") return [node.paneId];
  return [...getAllLeafIds(node.first), ...getAllLeafIds(node.second)];
}

/** 터미널을 flat layer에 고정 마운트 — split 구조 변경 시 unmount 방지 */
function TerminalLayer({ workspaceId, paneRoot }: { workspaceId: string; paneRoot: PaneNode }) {
  const { containerRef, rects } = usePaneRectContext();
  const leafIds = getAllLeafIds(paneRoot);

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {leafIds.map((paneId) => {
        const rect = rects[paneId];
        if (!rect || rect.width === 0 || rect.height === 0) return null;
        return (
          <div
            key={paneId}
            style={{
              position: "absolute",
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              overflow: "hidden",
              pointerEvents: "auto",
            }}
          >
            <PaneWrapper paneId={paneId} workspaceId={workspaceId} />
          </div>
        );
      })}
    </div>
  );
}

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
        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", fontWeight: 500 }}>
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

      {/* Pane area: SplitPane(placeholder) + TerminalLayer(flat) */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", padding: 4, minHeight: 0 }}>
        {paneRoot ? (
          <PaneRectProvider>
            {/* Layout layer: invisible placeholders that define size/position */}
            <div style={{ position: "absolute", inset: 4, display: "flex" }}>
              <SplitPane node={paneRoot} workspaceId={activeWorkspace.id} />
            </div>
            {/* Terminal layer: always mounted, never unmounts on split */}
            <TerminalLayer workspaceId={activeWorkspace.id} paneRoot={paneRoot} />
          </PaneRectProvider>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "var(--font-size-sm)" }}>
            loading...
          </div>
        )}
      </div>
    </div>
  );
}
