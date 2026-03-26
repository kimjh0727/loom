import { create } from "zustand";
import { createWorkspaceSlice, WorkspaceSlice } from "./workspaceSlice";
import { createPaneSlice, PaneSlice } from "./paneSlice";
import { createNotificationSlice, NotificationSlice } from "./notificationSlice";
import { createUISlice, UISlice } from "./uiSlice";

type AppStore = WorkspaceSlice & PaneSlice & NotificationSlice & UISlice;

export const useAppStore = create<AppStore>((...a) => ({
  ...createWorkspaceSlice(...a),
  ...createPaneSlice(...a),
  ...createNotificationSlice(...a),
  ...createUISlice(...a),
}));
