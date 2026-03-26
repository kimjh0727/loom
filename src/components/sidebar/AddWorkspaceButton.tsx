interface Props {
  onClick: () => void;
}

export default function AddWorkspaceButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        width: "100%",
        padding: "8px 12px",
        background: "transparent",
        border: "none",
        borderRadius: "var(--radius-md)",
        color: "var(--text-dim)",
        fontSize: "var(--font-size-sm)",
        cursor: "pointer",
        transition: "color var(--transition-fast), background var(--transition-fast)",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color =
          "var(--text-primary)";
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-dim)";
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
      <span>New workspace</span>
    </button>
  );
}
