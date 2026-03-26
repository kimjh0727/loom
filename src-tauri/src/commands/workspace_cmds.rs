use tauri::State;
use crate::workspace::state::AppState;
use crate::workspace::store::WorkspaceRecord;

#[tauri::command]
pub fn list_workspaces(state: State<AppState>) -> Vec<WorkspaceRecord> {
    state.workspaces.lock().unwrap().list().into_iter().cloned().collect()
}

#[tauri::command]
pub fn create_workspace(state: State<AppState>, name: String) -> String {
    state.workspaces.lock().unwrap().create(name)
}

#[tauri::command]
pub fn select_workspace(state: State<AppState>, id: String) {
    state.workspaces.lock().unwrap().select(&id);
}

#[tauri::command]
pub fn remove_workspace(state: State<AppState>, id: String) {
    state.workspaces.lock().unwrap().remove(&id);
}
