import { StateCreator } from "zustand";
import { Notification } from "../types/notification";

export interface NotificationSlice {
  notifications: Notification[];
  unreadByWorkspace: Record<string, number>;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  clearAll: () => void;
  clearForWorkspace: (workspaceId: string) => void;
}

export const createNotificationSlice: StateCreator<NotificationSlice> = (set) => ({
  notifications: [],
  unreadByWorkspace: {},
  addNotification: (n) =>
    set((state) => ({
      notifications: [...state.notifications, n],
      unreadByWorkspace: {
        ...state.unreadByWorkspace,
        [n.workspaceId]: (state.unreadByWorkspace[n.workspaceId] ?? 0) + 1,
      },
    })),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    })),
  clearAll: () => set({ notifications: [], unreadByWorkspace: {} }),
  clearForWorkspace: (workspaceId) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.workspaceId !== workspaceId),
      unreadByWorkspace: { ...state.unreadByWorkspace, [workspaceId]: 0 },
    })),
});
