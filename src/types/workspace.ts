export type PaneType = "terminal" | "browser";
export type SplitDirection = "horizontal" | "vertical";

export interface Pane {
  id: string;
  type: PaneType;
  workspaceId: string;
  title: string;
  cwd?: string;
  url?: string;
}

export type PaneNode =
  | { kind: "leaf"; paneId: string }
  | {
      kind: "split";
      id: string;
      direction: SplitDirection;
      ratio: number;
      first: PaneNode;
      second: PaneNode;
    };

export interface StatusEntry {
  key: string;
  value: string;
  icon?: string;
  color?: string;
}

export interface Workspace {
  id: string;
  name: string;
  color?: string;
  gitBranch?: string;
  activeProcess?: string;
  unreadCount: number;
  paneRoot: PaneNode;
  statusEntries: StatusEntry[];
}
