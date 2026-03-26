import { useEffect } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import WorkspaceArea from "./components/workspace/WorkspaceArea";
import { useAppStore } from "./store";

export default function App() {
  const createWorkspace = useAppStore((s) => s.createWorkspace);
  const workspaces = useAppStore((s) => s.workspaces);
  const initPaneRoot = useAppStore((s) => s.initPaneRoot);

  // 데모용 초기 워크스페이스
  useEffect(() => {
    if (workspaces.length > 0) return;
    const makeWs = (name: string) => {
      const id = createWorkspace(name);
      const paneId = crypto.randomUUID();
      initPaneRoot(id, { kind: "leaf", paneId });
    };
    makeWs("agent-1");
    makeWs("agent-2");
  }, []);

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <Sidebar />
      <WorkspaceArea />
    </div>
  );
}
