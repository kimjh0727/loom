export type NotificationSource = "osc9" | "osc99" | "osc777" | "pipe";

export interface Notification {
  id: string;
  workspaceId: string;
  paneId?: string;
  title: string;
  subtitle?: string;
  body: string;
  source: NotificationSource;
  isRead: boolean;
  timestamp: number;
}
