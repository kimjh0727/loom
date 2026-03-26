export const EVENTS = {
  PTY_DATA: "pty:data",
  NOTIFICATION_NEW: "notification:new",
  WORKSPACE_CREATED: "workspace:created",
  PANE_CLOSED: "pane:closed",
} as const;

export interface PtyDataPayload {
  paneId: string;
  data: string;
}
