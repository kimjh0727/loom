import { StateCreator } from "zustand";
import { PaneNode, SplitDirection } from "../types/workspace";

function splitNode(
  root: PaneNode,
  targetPaneId: string,
  direction: SplitDirection
): PaneNode {
  if (root.kind === "leaf") {
    if (root.paneId !== targetPaneId) return root;
    const newPaneId = crypto.randomUUID();
    return {
      kind: "split",
      direction,
      ratio: 0.5,
      first: { kind: "leaf", paneId: root.paneId },
      second: { kind: "leaf", paneId: newPaneId },
    };
  }
  return {
    ...root,
    first: splitNode(root.first, targetPaneId, direction),
    second: splitNode(root.second, targetPaneId, direction),
  };
}

function closeNode(root: PaneNode, targetPaneId: string): PaneNode | null {
  if (root.kind === "leaf") {
    return root.paneId === targetPaneId ? null : root;
  }
  const first = closeNode(root.first, targetPaneId);
  const second = closeNode(root.second, targetPaneId);
  if (!first) return second;
  if (!second) return first;
  return { ...root, first, second };
}

function setRatio(root: PaneNode, targetPaneId: string, ratio: number): PaneNode {
  if (root.kind === "leaf") return root;
  if (
    root.first.kind === "leaf" && root.first.paneId === targetPaneId ||
    root.second.kind === "leaf" && root.second.paneId === targetPaneId
  ) {
    return { ...root, ratio: Math.min(0.9, Math.max(0.1, ratio)) };
  }
  return {
    ...root,
    first: setRatio(root.first, targetPaneId, ratio),
    second: setRatio(root.second, targetPaneId, ratio),
  };
}

export interface PaneSlice {
  paneRoots: Record<string, PaneNode>;
  focusedPaneId: string | null;
  initPaneRoot: (workspaceId: string, root: PaneNode) => void;
  splitPane: (workspaceId: string, paneId: string, direction: SplitDirection) => void;
  closePane: (workspaceId: string, paneId: string) => void;
  focusPane: (paneId: string) => void;
  setSplitRatio: (workspaceId: string, paneId: string, ratio: number) => void;
}

export const createPaneSlice: StateCreator<PaneSlice> = (set, get) => ({
  paneRoots: {},
  focusedPaneId: null,

  initPaneRoot: (workspaceId, root) =>
    set((state) => ({
      paneRoots: { ...state.paneRoots, [workspaceId]: root },
    })),

  splitPane: (workspaceId, paneId, direction) => {
    const root = get().paneRoots[workspaceId];
    if (!root) return;
    set((state) => ({
      paneRoots: {
        ...state.paneRoots,
        [workspaceId]: splitNode(root, paneId, direction),
      },
    }));
  },

  closePane: (workspaceId, paneId) => {
    const root = get().paneRoots[workspaceId];
    if (!root) return;
    const next = closeNode(root, paneId);
    if (!next) return;
    set((state) => ({
      paneRoots: { ...state.paneRoots, [workspaceId]: next },
    }));
  },

  focusPane: (paneId) => set({ focusedPaneId: paneId }),

  setSplitRatio: (workspaceId, paneId, ratio) => {
    const root = get().paneRoots[workspaceId];
    if (!root) return;
    set((state) => ({
      paneRoots: {
        ...state.paneRoots,
        [workspaceId]: setRatio(root, paneId, ratio),
      },
    }));
  },
});
