import { useRef, useEffect } from "react";
import { useTerminal } from "../../hooks/useTerminal";
import TerminalToolbar from "./TerminalToolbar";
import { spawnTerminal, writeToPane, resizePane, closePane } from "../../ipc/commands";
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

  const { write, writeln, termRef } = useTerminal(containerRef, {
    // xterm.js 키입력 → PTY stdin
    onData: (data) => {
      writeToPane(paneId, data).catch(() => {
        // Tauri 미연결(브라우저 개발 환경) → 로컬 에코
        termRef.current?.write(data);
      });
    },
    // 컨테이너 리사이즈 → PTY 크기 동기화
    onResize: (cols, rows) => {
      resizePane(paneId, cols, rows).catch(() => {});
    },
  });

  // PTY spawn (Tauri 환경에서만 동작)
  useEffect(() => {
    if (spawnedRef.current) return;
    spawnedRef.current = true;

    spawnTerminal(paneId, workspaceId).catch(() => {
      // 브라우저 개발 환경에서는 무시
    });

    return () => {
      closePane(paneId).catch(() => {});
    };
  }, [paneId, workspaceId]);

  // PTY stdout → xterm.js
  useEffect(() => {
    const unlisten = listen<PtyDataPayload>(EVENTS.PTY_DATA, (event) => {
      if (event.payload.pane_id === paneId) {
        write(event.payload.data);
      }
    });
    return () => { unlisten.then((u) => u()); };
  }, [paneId, write]);

  // PTY 프로세스 종료 감지
  useEffect(() => {
    const unlisten = listen<string>(EVENTS.PANE_CLOSED, (event) => {
      if (event.payload === paneId) {
        writeln("\r\n\x1b[2m[process exited]\x1b[0m");
      }
    });
    return () => { unlisten.then((u) => u()); };
  }, [paneId, writeln]);

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
