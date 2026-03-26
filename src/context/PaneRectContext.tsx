import { createContext, useContext, useCallback, useRef, useState } from "react";

export interface PaneRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface PaneRectContextValue {
  containerRef: React.RefObject<HTMLDivElement | null>;
  rects: Record<string, PaneRect>;
  registerPlaceholder: (paneId: string, el: HTMLDivElement | null) => void;
}

const PaneRectContext = createContext<PaneRectContextValue | null>(null);

export function PaneRectProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rects, setRects] = useState<Record<string, PaneRect>>({});
  const observersRef = useRef<Map<string, ResizeObserver>>(new Map());

  const registerPlaceholder = useCallback(
    (paneId: string, el: HTMLDivElement | null) => {
      // 기존 observer 정리
      const old = observersRef.current.get(paneId);
      if (old) {
        old.disconnect();
        observersRef.current.delete(paneId);
      }

      if (!el) {
        setRects((prev) => {
          const next = { ...prev };
          delete next[paneId];
          return next;
        });
        return;
      }

      const update = () => {
        const container = containerRef.current;
        if (!container) return;
        const cr = container.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        setRects((prev) => ({
          ...prev,
          [paneId]: {
            top: er.top - cr.top,
            left: er.left - cr.left,
            width: er.width,
            height: er.height,
          },
        }));
      };

      const ro = new ResizeObserver(update);
      ro.observe(el);
      observersRef.current.set(paneId, ro);
      update();
    },
    []
  );

  return (
    <PaneRectContext.Provider value={{ containerRef, rects, registerPlaceholder }}>
      {children}
    </PaneRectContext.Provider>
  );
}

export function usePaneRectContext() {
  const ctx = useContext(PaneRectContext);
  if (!ctx) throw new Error("PaneRectContext not found");
  return ctx;
}
