use tauri::State;
use crate::workspace::state::AppState;
use crate::notification::store::Notification;

#[tauri::command]
pub fn list_notifications(
    state: State<AppState>,
    workspace_id: Option<String>,
) -> Vec<Notification> {
    let store = state.notifications.lock().unwrap();
    store
        .list()
        .iter()
        .filter(|n| {
            workspace_id
                .as_deref()
                .map_or(true, |id| n.workspace_id == id)
        })
        .cloned()
        .collect()
}

#[tauri::command]
pub fn clear_notifications(state: State<AppState>, workspace_id: String) {
    state.notifications.lock().unwrap().clear_for_workspace(&workspace_id);
}

#[tauri::command]
pub fn mark_notification_read(state: State<AppState>, id: String) {
    state.notifications.lock().unwrap().mark_read(&id);
}
