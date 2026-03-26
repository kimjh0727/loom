import { useRef, useCallback } from "react";
import PaneDivider from "./PaneDivider";
import { PaneNode } from "../../types/workspace";
import { useAppStore } from "../../store";
import { usePaneRectContext } from "../../context/PaneRectContext";

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
      setSplitRatio(workspaceId, node.id, ratio);
    },
    [node, workspaceId, setSplitRatio]
  );

  const { registerPlaceholder } = usePaneRectContext();

  if (node.kind === "leaf") {
    // 실제 터미널은 WorkspaceArea의 flat layer에 마운트됨.
    // 여기서는 크기/위치만 정의하는 invisible placeholder.
    return (
      <div
        ref={(el) => registerPlaceholder(node.paneId, el)}
        style={{ flex: 1, minWidth: 0, minHeight: 0 }}
      />
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
        currentRatio={node.ratio}
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
