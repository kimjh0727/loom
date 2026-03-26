use anyhow::Result;
use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};

pub struct PtyHandle {
    pub writer: Arc<Mutex<Box<dyn Write + Send>>>,
    // master를 살려두어 PTY가 닫히지 않게 함
    pub _master: Box<dyn portable_pty::MasterPty + Send>,
}

impl PtyHandle {
    pub fn spawn(
        cols: u16,
        rows: u16,
        cwd: Option<String>,
        env_vars: Vec<(String, String)>,
    ) -> Result<(Self, Box<dyn Read + Send>)> {
        let pty_system = NativePtySystem::default();

        let pair = pty_system.openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })?;

        // 기본 셸 결정
        let shell = default_shell();
        let mut cmd = CommandBuilder::new(&shell);

        if let Some(dir) = cwd {
            cmd.cwd(dir);
        }

        for (key, val) in env_vars {
            cmd.env(key, val);
        }

        let _child = pair.slave.spawn_command(cmd)?;
        let reader = pair.master.try_clone_reader()?;
        let writer = Arc::new(Mutex::new(pair.master.take_writer()?));

        Ok((
            PtyHandle {
                writer,
                _master: pair.master,
            },
            reader,
        ))
    }

    pub fn write_bytes(&self, data: &[u8]) -> Result<()> {
        let mut w = self.writer.lock().unwrap();
        w.write_all(data)?;
        Ok(())
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<()> {
        // portable-pty의 resize는 master에서 직접 처리
        // PtyPair를 통해 resize — 현재 portable-pty 0.8에서는
        // master.resize()가 없으므로 플랫폼별 처리는 manager에서
        let _ = (cols, rows);
        Ok(())
    }
}

fn default_shell() -> String {
    #[cfg(windows)]
    {
        std::env::var("COMSPEC")
            .unwrap_or_else(|_| "cmd.exe".to_string())
    }
    #[cfg(not(windows))]
    {
        std::env::var("SHELL")
            .unwrap_or_else(|_| "/bin/bash".to_string())
    }
}
