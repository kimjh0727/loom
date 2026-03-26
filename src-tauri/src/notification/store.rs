use serde::{Deserialize, Serialize};
use std::collections::HashMap;

const RING_CAPACITY: usize = 500;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    pub id: String,
    pub workspace_id: String,
    pub pane_id: Option<String>,
    pub title: String,
    pub subtitle: Option<String>,
    pub body: String,
    pub source: String,
    pub is_read: bool,
    pub timestamp_ms: u64,
}

#[derive(Debug, Default)]
pub struct NotificationStore {
    items: Vec<Notification>,
    unread_by_workspace: HashMap<String, usize>,
}

impl NotificationStore {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn push(&mut self, n: Notification) {
        if self.items.len() >= RING_CAPACITY {
            self.items.remove(0);
        }
        *self.unread_by_workspace.entry(n.workspace_id.clone()).or_insert(0) += 1;
        self.items.push(n);
    }

    pub fn mark_read(&mut self, id: &str) {
        if let Some(n) = self.items.iter_mut().find(|n| n.id == id) {
            if !n.is_read {
                n.is_read = true;
                if let Some(count) = self.unread_by_workspace.get_mut(&n.workspace_id) {
                    *count = count.saturating_sub(1);
                }
            }
        }
    }

    pub fn clear_for_workspace(&mut self, workspace_id: &str) {
        self.items.retain(|n| n.workspace_id != workspace_id);
        self.unread_by_workspace.insert(workspace_id.to_string(), 0);
    }

    pub fn list(&self) -> &[Notification] {
        &self.items
    }

    pub fn unread_count(&self, workspace_id: &str) -> usize {
        self.unread_by_workspace.get(workspace_id).copied().unwrap_or(0)
    }
}
