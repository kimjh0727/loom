import { useCallback, useRef, useEffect } from "react";

interface UseSplitResizeOptions {
  direction: "horizontal" | "vertical";
  containerRef: React.RefObject<HTMLElement | null>;
  currentRatio: number;
  onRatioChange: (ratio: number) => void;
}

export function useSplitResize({
  direction,
  containerRef,
  currentRatio,
  onRatioChange,
}: UseSplitResizeOptions) {
  const onRatioChangeRef = useRef(onRatioChange);
  const currentRatioRef = useRef(currentRatio);

  useEffect(() => {
    onRatioChangeRef.current = onRatioChange;
    currentRatioRef.current = currentRatio;
  });

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isHorizontal = direction === "horizontal";

      // 드래그 시작 시점의 마우스 위치와 비율 스냅샷
      const startPos = isHorizontal ? e.clientX : e.clientY;
      const containerSize = isHorizontal ? rect.width : rect.height;
      const startRatio = currentRatioRef.current;

      const onMouseMove = (ev: MouseEvent) => {
        const currentPos = isHorizontal ? ev.clientX : ev.clientY;
        const delta = currentPos - startPos;
        const deltaRatio = delta / containerSize;
        const newRatio = Math.min(0.9, Math.max(0.1, startRatio + deltaRatio));
        onRatioChangeRef.current(newRatio);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [direction, containerRef]
  );

  return { onMouseDown };
}
