interface Props {
  count: number;
}

export default function WorkspaceTabBadge({ count }: Props) {
  if (count === 0) return null;
  return (
    <span
      style={{
        minWidth: 18,
        height: 18,
        padding: "0 5px",
        borderRadius: 9,
        background: "var(--accent)",
        color: "#fff",
        fontSize: "var(--font-size-xs)",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
