use anyhow::Result;
use std::collections::HashMap;
use std::io::Read;
use std::thread;
use tauri::{AppHandle, Emitter};
use crate::terminal::pty::PtyHandle;
use crate::terminal::osc;

#[derive(Clone, serde::Serialize)]
pub struct PtyDataPayload {
    pub pane_id: String,
    pub data: String,
}

pub struct TerminalManager {
    panes: HashMap<String, PtyHandle>,
}

impl TerminalManager {
    pub fn new() -> Self {
        Self {
            panes: HashMap::new(),
        }
    }

    /// PTY 스폰 후 백그라운드 읽기 스레드 시작
    pub fn spawn(
        &mut self,
        pane_id: String,
        cwd: Option<String>,
        extra_env: Vec<(String, String)>,
        app_handle: AppHandle,
    ) -> Result<()> {
        if self.panes.contains_key(&pane_id) {
            return Ok(());
        }

        let (handle, reader) = PtyHandle::spawn(220, 50, cwd, extra_env)?;
        self.panes.insert(pane_id.clone(), handle);

        // 백그라운드 스레드: PTY 출력 읽기 → Tauri 이벤트
        let pid = pane_id.clone();
        thread::spawn(move || read_loop(pid, reader, app_handle));

        Ok(())
    }

    pub fn write(&self, pane_id: &str, data: &str) -> Result<()> {
        let handle = self.panes.get(pane_id)
            .ok_or_else(|| anyhow::anyhow!("pane not found: {}", pane_id))?;
        handle.write_bytes(data.as_bytes())
    }

    pub fn resize(&self, pane_id: &str, cols: u16, rows: u16) -> Result<()> {
        let handle = self.panes.get(pane_id)
            .ok_or_else(|| anyhow::anyhow!("pane not found: {}", pane_id))?;
        handle.resize(cols, rows)
    }

    pub fn close(&mut self, pane_id: &str) {
        self.panes.remove(pane_id);
    }
}

fn read_loop(pane_id: String, mut reader: Box<dyn Read + Send>, app: AppHandle) {
    let mut buf = [0u8; 4096];
    loop {
        match reader.read(&mut buf) {
            Ok(0) | Err(_) => break,
            Ok(n) => {
                let raw = &buf[..n];
                // OSC 파서로 알림 추출 + 시퀀스 제거 (Phase 5-B에서 완성)
                let (clean, _notifications) = osc::parse_and_strip(raw);

                // UTF-8 변환 (손실 허용)
                let text = String::from_utf8_lossy(&clean).into_owned();

                let _ = app.emit("pty:data", PtyDataPayload {
                    pane_id: pane_id.clone(),
                    data: text,
                });
            }
        }
    }
    // PTY 종료 이벤트
    let _ = app.emit("pane:closed", pane_id);
}
