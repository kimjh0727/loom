// Phase 2-C에서 구현: ConPTY spawn/kill/read/write
use std::collections::HashMap;

pub struct TerminalManager {
    // pane_id -> PtyHandle (Phase 2-C에서 추가)
    _panes: HashMap<String, ()>,
}

impl TerminalManager {
    pub fn new() -> Self {
        Self {
            _panes: HashMap::new(),
        }
    }
}
