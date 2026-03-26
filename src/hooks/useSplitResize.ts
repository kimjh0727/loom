import { useCallback, useRef } from "react";

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
  const draggingRef = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      const onMouseMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return;

        let ratio: number;
        if (direction === "horizontal") {
          ratio = (ev.clientX - rect.left) / rect.width;
        } else {
          ratio = (ev.clientY - rect.top) / rect.height;
        }

        // 0.1 ~ 0.9 클램핑
        ratio = Math.min(0.9, Math.max(0.1, ratio));
        onRatioChange(ratio);
      };

      const onMouseUp = () => {
        draggingRef.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      // 드래그 중 텍스트 선택/커서 방지
      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [direction, containerRef, onRatioChange]
  );

  return { onMouseDown };
}
