import PaneWrapper from "./PaneWrapper";
import { PaneNode } from "../../types/workspace";

interface Props {
  node: PaneNode;
  workspaceId: string;
}

export default function SplitPane({ node, workspaceId }: Props) {
  if (node.kind === "leaf") {
    return (
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0, minHeight: 0 }}>
        <PaneWrapper paneId={node.paneId} workspaceId={workspaceId} />
      </div>
    );
  }

  const isHorizontal = node.direction === "horizontal";
  const firstBasis = `${node.ratio * 100}%`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        flex: 1,
        overflow: "hidden",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* 첫 번째 자식: ratio만큼 */}
      <div
        style={{
          flex: `0 0 ${firstBasis}`,
          display: "flex",
          overflow: "hidden",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <SplitPane node={node.first} workspaceId={workspaceId} />
      </div>

      {/* 디바이더 (Phase 3-C에서 드래그 기능 추가) */}
      <div
        data-divider
        data-direction={node.direction}
        style={{
          flexShrink: 0,
          background: "var(--divider-bg)",
          [isHorizontal ? "width" : "height"]: 3,
          cursor: isHorizontal ? "col-resize" : "row-resize",
          transition: "background var(--transition-fast)",
          zIndex: 1,
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLDivElement).style.background = "var(--divider-hover)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLDivElement).style.background = "var(--divider-bg)")
        }
      />

      {/* 두 번째 자식: 나머지 공간 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <SplitPane node={node.second} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
