import { useState } from "react";
import { useSplitResize } from "../../hooks/useSplitResize";

interface Props {
  direction: "horizontal" | "vertical";
  containerRef: React.RefObject<HTMLElement | null>;
  currentRatio: number;
  onRatioChange: (ratio: number) => void;
}

export default function PaneDivider({ direction, containerRef, currentRatio, onRatioChange }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isHorizontal = direction === "horizontal";

  const { onMouseDown } = useSplitResize({ direction, containerRef, currentRatio, onRatioChange });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    onMouseDown(e);

    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mouseup", onUp);
  };

  const isActive = isHovered || isDragging;

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        flexShrink: 0,
        [isHorizontal ? "width" : "height"]: 5,
        [isHorizontal ? "height" : "width"]: "100%",
        background: isActive ? "var(--accent)" : "transparent",
        cursor: isHorizontal ? "col-resize" : "row-resize",
        transition: "background var(--transition-fast)",
        zIndex: 2,
        position: "relative",
        // 가운데 선으로 시각 표시
        borderLeft: isHorizontal && !isActive ? "1px solid var(--border)" : undefined,
        borderTop: !isHorizontal && !isActive ? "1px solid var(--border)" : undefined,
      }}
    />
  );
}
