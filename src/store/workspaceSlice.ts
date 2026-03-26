import { StateCreator } from "zustand";
import { Workspace } from "../types/workspace";

export interface WorkspaceSlice {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  createWorkspace: (name: string) => void;
  removeWorkspace: (id: string) => void;
  selectWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  setGitBranch: (workspaceId: string, branch: string) => void;
  setActiveProcess: (workspaceId: string, process: string) => void;
}

export const createWorkspaceSlice: StateCreator<WorkspaceSlice> = (set) => ({
  workspaces: [],
  activeWorkspaceId: null,
  createWorkspace: (_name) => {},
  removeWorkspace: (_id) => {},
  selectWorkspace: (id) => set({ activeWorkspaceId: id }),
  renameWorkspace: (_id, _name) => {},
  setGitBranch: (_workspaceId, _branch) => {},
  setActiveProcess: (_workspaceId, _process) => {},
});
