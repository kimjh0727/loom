import { StateCreator } from "zustand";
import { Workspace, PaneNode } from "../types/workspace";

function newWorkspace(name: string, id: string): Workspace {
  const rootPaneId = crypto.randomUUID();
  const paneRoot: PaneNode = { kind: "leaf", paneId: rootPaneId };
  return {
    id,
    name,
    unreadCount: 0,
    paneRoot,
    statusEntries: [],
  };
}

export interface WorkspaceSlice {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  createWorkspace: (name: string) => string;
  removeWorkspace: (id: string) => void;
  selectWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  setGitBranch: (workspaceId: string, branch: string) => void;
  setActiveProcess: (workspaceId: string, process: string) => void;
  incrementUnread: (workspaceId: string) => void;
  clearUnread: (workspaceId: string) => void;
}

export const createWorkspaceSlice: StateCreator<WorkspaceSlice> = (set) => ({
  workspaces: [],
  activeWorkspaceId: null,

  createWorkspace: (name) => {
    const id = crypto.randomUUID();
    const ws = newWorkspace(name, id);
    set((state) => ({
      workspaces: [...state.workspaces, ws],
      activeWorkspaceId: state.activeWorkspaceId ?? id,
    }));
    return id;
  },

  removeWorkspace: (id) =>
    set((state) => {
      const remaining = state.workspaces.filter((w) => w.id !== id);
      const activeId =
        state.activeWorkspaceId === id
          ? (remaining[remaining.length - 1]?.id ?? null)
          : state.activeWorkspaceId;
      return { workspaces: remaining, activeWorkspaceId: activeId };
    }),

  selectWorkspace: (id) => set({ activeWorkspaceId: id }),

  renameWorkspace: (id, name) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, name } : w)),
    })),

  setGitBranch: (workspaceId, branch) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId ? { ...w, gitBranch: branch } : w
      ),
    })),

  setActiveProcess: (workspaceId, process) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId ? { ...w, activeProcess: process } : w
      ),
    })),

  incrementUnread: (workspaceId) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId ? { ...w, unreadCount: w.unreadCount + 1 } : w
      ),
    })),

  clearUnread: (workspaceId) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId ? { ...w, unreadCount: 0 } : w
      ),
    })),
});

