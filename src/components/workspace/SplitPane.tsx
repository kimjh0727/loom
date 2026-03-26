import { useRef, useCallback } from "react";
import PaneWrapper from "./PaneWrapper";
import PaneDivider from "./PaneDivider";
import { PaneNode } from "../../types/workspace";
import { useAppStore } from "../../store";
import { getFirstLeafId } from "../../store/paneSlice";

interface Props {
  node: PaneNode;
  workspaceId: string;
}

export default function SplitPane({ node, workspaceId }: Props) {
  const setSplitRatio = useAppStore((s) => s.setSplitRatio);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRatioChange = useCallback(
    (ratio: number) => {
      if (node.kind !== "split") return;
      const firstLeafId = getFirstLeafId(node.first);
      if (firstLeafId) setSplitRatio(workspaceId, firstLeafId, ratio);
    },
    [node, workspaceId, setSplitRatio]
  );

  if (node.kind === "leaf") {
    return (
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0, minHeight: 0 }}>
        <PaneWrapper paneId={node.paneId} workspaceId={workspaceId} />
      </div>
    );
  }

  const isHorizontal = node.direction === "horizontal";

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        flex: 1,
        overflow: "hidden",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* 첫 번째 자식: flex-grow를 ratio로, 두번째는 1-ratio로 설정 */}
      <div
        style={{
          flex: `${node.ratio} 1 0`,
          display: "flex",
          overflow: "hidden",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <SplitPane node={node.first} workspaceId={workspaceId} />
      </div>

      {/* 드래그 가능한 디바이더 */}
      <PaneDivider
        direction={node.direction}
        containerRef={containerRef}
        onRatioChange={handleRatioChange}
      />

      {/* 두 번째 자식 */}
      <div
        style={{
          flex: `${1 - node.ratio} 1 0`,
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
