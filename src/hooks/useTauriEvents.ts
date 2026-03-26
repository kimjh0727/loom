import { useEffect } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { EVENTS, PtyDataPayload } from "../ipc/events";
import { useAppStore } from "../store";

/**
 * 앱 전역 Tauri 이벤트 리스너.
 * App.tsx 최상단에서 한 번만 마운트.
 */
export function useTauriEvents(
  onPtyData: (payload: PtyDataPayload) => void,
  onPaneClosed: (paneId: string) => void,
) {
  useEffect(() => {
    const unlisten: UnlistenFn[] = [];

    listen<PtyDataPayload>(EVENTS.PTY_DATA, (event) => {
      onPtyData(event.payload);
    }).then((u) => unlisten.push(u));

    listen<string>(EVENTS.PANE_CLOSED, (event) => {
      onPaneClosed(event.payload);
    }).then((u) => unlisten.push(u));

    return () => {
      unlisten.forEach((u) => u());
    };
  }, []);
}

/**
 * 워크스페이스/알림 관련 이벤트 (Phase 4~5에서 확장)
 */
export function useWorkspaceEvents() {
  const addNotification = useAppStore((s) => s.addNotification);

  useEffect(() => {
    const unlisten: UnlistenFn[] = [];

    listen(EVENTS.NOTIFICATION_NEW, (event) => {
      addNotification(event.payload as Parameters<typeof addNotification>[0]);
    }).then((u) => unlisten.push(u));

    return () => {
      unlisten.forEach((u) => u());
    };
  }, []);
}
