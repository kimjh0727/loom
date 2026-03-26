import { useRef } from "react";
import { useTerminal } from "../../hooks/useTerminal";
import TerminalToolbar from "./TerminalToolbar";
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
  title,
  onSplitRight,
  onSplitDown,
  onClose,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Phase 2-E에서 onData를 invoke("write_to_pane")으로 교체
  const { write: _write } = useTerminal(containerRef);
  void _write;

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
