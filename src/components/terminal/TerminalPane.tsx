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

  const { write, writeln, termRef } = useTerminal(containerRef, {
    onSplitRight,
    onSplitDown,
    // xterm.js 키입력 → PTY stdin
    onData: (data) => {
      // xterm.js 키 정규화:
      //   Backspace → \x7f(DEL) 대신 \x08(BS): PTY stty erase 기본값 맞춤
      //   Enter     → \r 대신 \n: PTY icrnl(CR→LF) 미설정 환경 대응
      const normalized = data === "\x7f" ? "\x08" : data === "\r" ? "\n" : data;
      writeToPane(paneId, normalized).catch((err) => {
        termRef.current?.write(`\x1b[31m[err:${err}]\x1b[0m`);
      });
    },
    // 컨테이너 리사이즈 → PTY 크기 동기화
    onResize: (cols, rows) => {
      resizePane(paneId, cols, rows).catch(() => {});
    },
  });

  // PTY spawn: 마운트 시 spawn, 언마운트 시 close
  // manager.spawn()이 내부에서 중복 방지(contains_key 체크)하므로 spawnedRef 불필요
  useEffect(() => {
    spawnTerminal(paneId, workspaceId).catch((err) => {
      writeln(`\r\n\x1b[31m[PTY spawn failed: ${err}]\x1b[0m`);
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
