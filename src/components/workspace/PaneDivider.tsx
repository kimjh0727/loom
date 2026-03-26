import { useState } from "react";
import { useSplitResize } from "../../hooks/useSplitResize";

interface Props {
  direction: "horizontal" | "vertical";
  containerRef: React.RefObject<HTMLElement | null>;
  onRatioChange: (ratio: number) => void;
}

export default function PaneDivider({ direction, containerRef, onRatioChange }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isHorizontal = direction === "horizontal";

  const { onMouseDown } = useSplitResize({ direction, containerRef, onRatioChange });

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
        [isHorizontal ? "width" : "height"]: isActive ? 4 : 3,
        [isHorizontal ? "height" : "width"]: "100%",
        background: isActive ? "var(--divider-hover)" : "var(--divider-bg)",
        cursor: isHorizontal ? "col-resize" : "row-resize",
        transition: "background var(--transition-fast), width var(--transition-fast), height var(--transition-fast)",
        zIndex: 1,
        position: "relative",
        // 클릭 영역을 넓혀서 드래그 쉽게
        margin: isHorizontal ? "0 -2px" : "-2px 0",
        padding: isHorizontal ? "0 2px" : "2px 0",
        boxSizing: "content-box",
      }}
    />
  );
}
