import Sidebar from "./components/sidebar/Sidebar";
import { useAppStore } from "./store";
import { useEffect } from "react";

export default function App() {
  const createWorkspace = useAppStore((s) => s.createWorkspace);

  // 데모용 초기 워크스페이스
  useEffect(() => {
    const id1 = createWorkspace("agent-1");
    const id2 = createWorkspace("agent-2");
    void id1;
    void id2;
  }, []);

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          background: "var(--bg-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-dim)",
          fontSize: "var(--font-size-sm)",
        }}
      >
        워크스페이스를 선택하세요
      </main>
    </div>
  );
}
