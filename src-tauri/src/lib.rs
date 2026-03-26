mod terminal;
mod workspace;
mod ipc;
mod commands;
mod notification;

use workspace::state::AppState;
use commands::{workspace_cmds, notification_cmds};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            workspace_cmds::list_workspaces,
            workspace_cmds::create_workspace,
            workspace_cmds::select_workspace,
            workspace_cmds::remove_workspace,
            notification_cmds::list_notifications,
            notification_cmds::clear_notifications,
            notification_cmds::mark_notification_read,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
