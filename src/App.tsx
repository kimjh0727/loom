import { useEffect } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import WorkspaceArea from "./components/workspace/WorkspaceArea";
import { useAppStore } from "./store";

export default function App() {
  const createWorkspace = useAppStore((s) => s.createWorkspace);
  const workspaces = useAppStore((s) => s.workspaces);

  // 데모용 초기 워크스페이스 (앱 최초 실행 시)
  useEffect(() => {
    if (workspaces.length > 0) return;
    createWorkspace("agent-1");
    createWorkspace("agent-2");
  }, []);

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <Sidebar />
      <WorkspaceArea />
    </div>
  );
}
