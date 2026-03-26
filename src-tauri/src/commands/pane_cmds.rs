use tauri::{AppHandle, State};
use crate::workspace::state::AppState;

/// 새 패인 PTY 스폰 (split 후 새 pane_id에 대해 호출)
#[tauri::command]
pub fn spawn_split_pane(
    app: AppHandle,
    state: State<AppState>,
    pane_id: String,
    workspace_id: String,
    cwd: Option<String>,
) -> Result<(), String> {
    let extra_env = vec![
        ("LOOM_PIPE_PATH".to_string(), r"\\.\pipe\loom".to_string()),
        ("LOOM_WORKSPACE_ID".to_string(), workspace_id),
        ("LOOM_PANE_ID".to_string(), pane_id.clone()),
        ("TERM".to_string(), "xterm-256color".to_string()),
    ];
    state
        .terminal_manager
        .lock()
        .unwrap()
        .spawn(pane_id, cwd, extra_env, app)
        .map_err(|e| e.to_string())
}

/// 패인 PTY 닫기
#[tauri::command]
pub fn close_pane(state: State<AppState>, pane_id: String) {
    state.terminal_manager.lock().unwrap().close(&pane_id);
}
