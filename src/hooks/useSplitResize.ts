import { useCallback, useRef, useEffect } from "react";

interface UseSplitResizeOptions {
  direction: "horizontal" | "vertical";
  containerRef: React.RefObject<HTMLElement | null>;
  onRatioChange: (ratio: number) => void;
}

export function useSplitResize({
  direction,
  containerRef,
  onRatioChange,
}: UseSplitResizeOptions) {
  // stale closure 방지: 최신 콜백을 ref로 유지
  const onRatioChangeRef = useRef(onRatioChange);
  useEffect(() => {
    onRatioChangeRef.current = onRatioChange;
  });

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      const onMouseMove = (ev: MouseEvent) => {
        let ratio: number;
        if (direction === "horizontal") {
          ratio = (ev.clientX - rect.left) / rect.width;
        } else {
          ratio = (ev.clientY - rect.top) / rect.height;
        }
        ratio = Math.min(0.9, Math.max(0.1, ratio));
        onRatioChangeRef.current(ratio);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [direction, containerRef]
  );

  return { onMouseDown };
}
