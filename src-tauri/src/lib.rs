mod terminal;
mod workspace;
mod ipc;
mod commands;
mod notification;

use workspace::state::AppState;
use commands::{workspace_cmds, notification_cmds, terminal_cmds, pane_cmds};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Named Pipe IPC 서버 시작
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                ipc::pipe_server::run(handle).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // workspace
            workspace_cmds::list_workspaces,
            workspace_cmds::create_workspace,
            workspace_cmds::select_workspace,
            workspace_cmds::remove_workspace,
            // terminal
            terminal_cmds::spawn_terminal,
            terminal_cmds::write_to_pane,
            terminal_cmds::resize_pane,
            terminal_cmds::close_pane_pty,
            // pane
            pane_cmds::spawn_split_pane,
            pane_cmds::close_pane,
            // notifications
            notification_cmds::list_notifications,
            notification_cmds::clear_notifications,
            notification_cmds::mark_notification_read,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
