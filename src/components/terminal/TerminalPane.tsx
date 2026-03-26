import { useRef, useEffect } from "react";
import { useTerminal } from "../../hooks/useTerminal";
import TerminalToolbar from "./TerminalToolbar";
import { spawnTerminal, writeToPane } from "../../ipc/commands";
import { listen } from "@tauri-apps/api/event";
import { EVENTS, PtyDataPayload } from "../../ipc/events";
import styles from "../../styles/terminal.module.css";

interface Props {
  paneId: string;
  workspaceId: string;
  title?: string;
  onSplitRight?: () => void;
  onSplitDown?: () => void;
  onClose?: () => void;
}

export default function TerminalPane({
  paneId,
  workspaceId,
  title,
  onSplitRight,
  onSplitDown,
  onClose,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spawnedRef = useRef(false);

  const { write, termRef } = useTerminal(containerRef, {
    // Phase 2-E에서 PTY로 연결: 키입력 → write_to_pane
    onData: (data) => {
      writeToPane(paneId, data).catch(() => {
        // PTY 미연결 시 로컬 에코
        termRef.current?.write(data);
      });
    },
  });

  // PTY spawn (Tauri 환경에서만)
  useEffect(() => {
    if (spawnedRef.current) return;
    spawnedRef.current = true;

    spawnTerminal(paneId, workspaceId).catch((err) => {
      // 브라우저 개발 환경(non-Tauri)에서는 무시
      console.debug("spawn_terminal not available:", err);
    });
  }, [paneId, workspaceId]);

  // PTY 출력 수신 → xterm.js write
  useEffect(() => {
    const unlisten = listen<PtyDataPayload>(EVENTS.PTY_DATA, (event) => {
      if (event.payload.pane_id === paneId) {
        write(event.payload.data);
      }
    });

    return () => {
      unlisten.then((u) => u());
    };
  }, [paneId, write]);

  return (
    <div className={styles.container}>
      <TerminalToolbar
        title={title ?? `pane · ${paneId.slice(0, 8)}`}
        onSplitRight={onSplitRight}
        onSplitDown={onSplitDown}
        onClose={onClose}
      />
      <div className={styles.terminalWrapper}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
