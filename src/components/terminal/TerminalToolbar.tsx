import styles from "../../styles/terminal.module.css";

interface Props {
  title: string;
  onSplitRight?: () => void;
  onSplitDown?: () => void;
  onClose?: () => void;
}

export default function TerminalToolbar({ title, onSplitRight, onSplitDown, onClose }: Props) {
  const btnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "var(--text-dim)",
    cursor: "pointer",
    padding: "2px 5px",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--font-size-xs)",
    lineHeight: 1,
  };

  return (
    <div className={styles.toolbar}>
      <span className={styles.title}>{title}</span>

      {onSplitRight && (
        <button style={btnStyle} onClick={onSplitRight} title="Split right (Ctrl+D)">
          ⬜▐
        </button>
      )}
      {onSplitDown && (
        <button style={btnStyle} onClick={onSplitDown} title="Split down (Ctrl+Shift+D)">
          ⬜▄
        </button>
      )}
      {onClose && (
        <button
          style={{ ...btnStyle, color: "var(--color-error)" }}
          onClick={onClose}
          title="Close pane"
        >
          ✕
        </button>
      )}
    </div>
  );
}
