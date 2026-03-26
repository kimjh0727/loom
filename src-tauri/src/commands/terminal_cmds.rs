use tauri::{AppHandle, State};
use crate::workspace::state::AppState;

/// PTY 스폰 + 백그라운드 읽기 스레드 시작
#[tauri::command]
pub fn spawn_terminal(
    app: AppHandle,
    state: State<AppState>,
    pane_id: String,
    workspace_id: String,
    cwd: Option<String>,
) -> Result<(), String> {
    let extra_env = vec![
        ("LOOM_PIPE_PATH".to_string(), r"\\.\pipe\loom".to_string()),
        ("LOOM_WORKSPACE_ID".to_string(), workspace_id.clone()),
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

/// PTY stdin에 데이터 쓰기
#[tauri::command]
pub fn write_to_pane(
    state: State<AppState>,
    pane_id: String,
    data: String,
) -> Result<(), String> {
    state
        .terminal_manager
        .lock()
        .unwrap()
        .write(&pane_id, &data)
        .map_err(|e| e.to_string())
}

/// PTY 크기 변경
#[tauri::command]
pub fn resize_pane(
    state: State<AppState>,
    pane_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    state
        .terminal_manager
        .lock()
        .unwrap()
        .resize(&pane_id, cols, rows)
        .map_err(|e| e.to_string())
}

/// PTY 닫기
#[tauri::command]
pub fn close_pane_pty(state: State<AppState>, pane_id: String) {
    state.terminal_manager.lock().unwrap().close(&pane_id);
}
