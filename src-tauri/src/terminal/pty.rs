use anyhow::Result;
use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};

pub struct PtyHandle {
    pub writer: Arc<Mutex<Box<dyn Write + Send>>>,
    master: Box<dyn portable_pty::MasterPty + Send>,
    // child를 여기에 보관하지 않으면 spawn() 리턴 시 drop → bash SIGKILL
    _child: Box<dyn portable_pty::Child + Send + Sync>,
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

        let shell = default_shell();
        let mut cmd = CommandBuilder::new(&shell);

        if let Some(dir) = cwd {
            cmd.cwd(dir);
        }
        for (key, val) in env_vars {
            cmd.env(key, val);
        }

        let child = pair.slave.spawn_command(cmd)?;
        let reader = pair.master.try_clone_reader()?;
        let writer = Arc::new(Mutex::new(pair.master.take_writer()?));

        Ok((PtyHandle { writer, master: pair.master, _child: child }, reader))
    }

    pub fn write_bytes(&self, data: &[u8]) -> Result<()> {
        let mut w = self.writer.lock().unwrap();
        w.write_all(data)?;
        w.flush()?;
        Ok(())
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<()> {
        self.master.resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })?;
        Ok(())
    }
}

fn default_shell() -> String {
    #[cfg(windows)]
    { std::env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".to_string()) }
    #[cfg(not(windows))]
    { std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string()) }
}
