use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceRecord {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub git_branch: Option<String>,
    pub active_process: Option<String>,
    pub pane_ids: Vec<String>,
}

#[derive(Debug, Default)]
pub struct WorkspaceStore {
    records: HashMap<String, WorkspaceRecord>,
    order: Vec<String>,
    active_id: Option<String>,
}

impl WorkspaceStore {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn create(&mut self, name: impl Into<String>) -> String {
        let id = uuid::Uuid::new_v4().to_string();
        let record = WorkspaceRecord {
            id: id.clone(),
            name: name.into(),
            color: None,
            git_branch: None,
            active_process: None,
            pane_ids: vec![],
        };
        self.records.insert(id.clone(), record);
        self.order.push(id.clone());
        if self.active_id.is_none() {
            self.active_id = Some(id.clone());
        }
        id
    }

    pub fn remove(&mut self, id: &str) {
        self.records.remove(id);
        self.order.retain(|i| i != id);
        if self.active_id.as_deref() == Some(id) {
            self.active_id = self.order.last().cloned();
        }
    }

    pub fn select(&mut self, id: &str) {
        if self.records.contains_key(id) {
            self.active_id = Some(id.to_string());
        }
    }

    pub fn list(&self) -> Vec<&WorkspaceRecord> {
        self.order
            .iter()
            .filter_map(|id| self.records.get(id))
            .collect()
    }

    pub fn current(&self) -> Option<&WorkspaceRecord> {
        self.active_id.as_deref().and_then(|id| self.records.get(id))
    }

    pub fn get(&self, id: &str) -> Option<&WorkspaceRecord> {
        self.records.get(id)
    }

    pub fn get_mut(&mut self, id: &str) -> Option<&mut WorkspaceRecord> {
        self.records.get_mut(id)
    }
}
