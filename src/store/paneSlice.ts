import { StateCreator } from "zustand";
import { PaneNode, SplitDirection } from "../types/workspace";

export interface PaneSlice {
  paneRoots: Record<string, PaneNode>;
  focusedPaneId: string | null;
  splitPane: (paneId: string, direction: SplitDirection) => void;
  closePane: (paneId: string) => void;
  focusPane: (paneId: string) => void;
  setSplitRatio: (nodeId: string, ratio: number) => void;
}

export const createPaneSlice: StateCreator<PaneSlice> = (set) => ({
  paneRoots: {},
  focusedPaneId: null,
  splitPane: (_paneId, _direction) => {},
  closePane: (_paneId) => {},
  focusPane: (paneId) => set({ focusedPaneId: paneId }),
  setSplitRatio: (_nodeId, _ratio) => {},
});
