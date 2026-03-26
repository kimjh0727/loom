import { create } from "zustand";
import { createWorkspaceSlice, WorkspaceSlice } from "./workspaceSlice";
import { createPaneSlice, PaneSlice } from "./paneSlice";
import { createNotificationSlice, NotificationSlice } from "./notificationSlice";
import { createUISlice, UISlice } from "./uiSlice";

type AppStore = WorkspaceSlice & PaneSlice & NotificationSlice & UISlice;

export const useAppStore = create<AppStore>((set, get, store) => {
  const workspaceSlice = createWorkspaceSlice(set, get, store);
  const paneSlice = createPaneSlice(set, get, store);

  return {
    ...workspaceSlice,
    ...paneSlice,
    ...createNotificationSlice(set, get, store),
    ...createUISlice(set, get, store),

    // createWorkspace 오버라이드: 워크스페이스 생성 시 paneRoot 자동 초기화
    createWorkspace: (name: string) => {
      const id = workspaceSlice.createWorkspace(name);
      const rootPaneId = get().workspaces.find((w) => w.id === id)?.paneRoot;
      const paneId = rootPaneId?.kind === "leaf" ? rootPaneId.paneId : crypto.randomUUID();
      paneSlice.initPaneRoot(id, { kind: "leaf", paneId });
      return id;
    },
  };
});
