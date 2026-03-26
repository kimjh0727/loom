import { invoke } from "@tauri-apps/api/core";

export const spawnTerminal = (
  paneId: string,
  workspaceId: string,
  cwd?: string
) => invoke("spawn_terminal", { paneId, workspaceId, cwd });

export const writeToPane = (paneId: string, data: string) =>
  invoke("write_to_pane", { paneId, data });

export const resizePane = (paneId: string, cols: number, rows: number) =>
  invoke("resize_pane", { paneId, cols, rows });

export const closePanePty = (paneId: string) =>
  invoke("close_pane_pty", { paneId });

export const listWorkspaces = () => invoke("list_workspaces");

export const createWorkspace = (name: string, cwd?: string) =>
  invoke("create_workspace", { name, cwd });

export const listNotifications = (workspaceId?: string) =>
  invoke("list_notifications", { workspaceId });

export const clearNotifications = (workspaceId: string) =>
  invoke("clear_notifications", { workspaceId });
