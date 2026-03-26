use std::sync::Mutex;
use crate::workspace::store::WorkspaceStore;
use crate::notification::store::NotificationStore;
use crate::terminal::manager::TerminalManager;

pub struct AppState {
    pub workspaces: Mutex<WorkspaceStore>,
    pub notifications: Mutex<NotificationStore>,
    pub terminal_manager: Mutex<TerminalManager>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            workspaces: Mutex::new(WorkspaceStore::new()),
            notifications: Mutex::new(NotificationStore::new()),
            terminal_manager: Mutex::new(TerminalManager::new()),
        }
    }
}
