import { StateCreator } from "zustand";
import { PaneNode, SplitDirection } from "../types/workspace";

function splitNode(root: PaneNode, targetPaneId: string, direction: SplitDirection): PaneNode {
  if (root.kind === "leaf") {
    if (root.paneId !== targetPaneId) return root;
    return {
      kind: "split",
      direction,
      ratio: 0.5,
      first: { kind: "leaf", paneId: root.paneId },
      second: { kind: "leaf", paneId: crypto.randomUUID() },
    };
  }
  return {
    ...root,
    first: splitNode(root.first, targetPaneId, direction),
    second: splitNode(root.second, targetPaneId, direction),
  };
}

function closeNode(root: PaneNode, targetPaneId: string): PaneNode | null {
  if (root.kind === "leaf") return root.paneId === targetPaneId ? null : root;
  const first = closeNode(root.first, targetPaneId);
  const second = closeNode(root.second, targetPaneId);
  if (!first) return second;
  if (!second) return first;
  return { ...root, first, second };
}

/** 서브트리에서 가장 왼쪽(첫 번째) leaf의 paneId 반환 */
export function getFirstLeafId(node: PaneNode): string | null {
  if (node.kind === "leaf") return node.paneId;
  return getFirstLeafId(node.first);
}

/**
 * split 노드를 "first 서브트리의 첫 번째 leaf ID"로 식별하여 ratio 업데이트.
 * 중첩 분할에서도 정확히 해당 divider의 split 노드를 찾을 수 있음.
 */
function setRatio(root: PaneNode, firstLeafId: string, ratio: number): PaneNode {
  if (root.kind === "leaf") return root;
  if (getFirstLeafId(root.first) === firstLeafId) {
    return { ...root, ratio: Math.min(0.9, Math.max(0.1, ratio)) };
  }
  return {
    ...root,
    first: setRatio(root.first, firstLeafId, ratio),
    second: setRatio(root.second, firstLeafId, ratio),
  };
}

export interface PaneSlice {
  paneRoots: Record<string, PaneNode>;
  focusedPaneId: string | null;
  initPaneRoot: (workspaceId: string, root: PaneNode) => void;
  splitPane: (workspaceId: string, paneId: string, direction: SplitDirection) => void;
  closePane: (workspaceId: string, paneId: string) => void;
  focusPane: (paneId: string) => void;
  setSplitRatio: (workspaceId: string, firstLeafId: string, ratio: number) => void;
}

export const createPaneSlice: StateCreator<PaneSlice> = (set, get) => ({
  paneRoots: {},
  focusedPaneId: null,

  initPaneRoot: (workspaceId, root) =>
    set((state) => ({ paneRoots: { ...state.paneRoots, [workspaceId]: root } })),

  splitPane: (workspaceId, paneId, direction) => {
    const root = get().paneRoots[workspaceId];
    if (!root) return;
    set((state) => ({
      paneRoots: { ...state.paneRoots, [workspaceId]: splitNode(root, paneId, direction) },
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

  setSplitRatio: (workspaceId, firstLeafId, ratio) => {
    const root = get().paneRoots[workspaceId];
    if (!root) return;
    set((state) => ({
      paneRoots: { ...state.paneRoots, [workspaceId]: setRatio(root, firstLeafId, ratio) },
    }));
  },
});
