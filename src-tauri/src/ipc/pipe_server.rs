use std::io;
use tauri::AppHandle;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

/// Windows: Named Pipe, Linux/WSL: Unix domain socket
#[cfg(windows)]
pub const PIPE_PATH: &str = r"\\.\pipe\loom";

#[cfg(not(windows))]
pub const PIPE_PATH: &str = "/tmp/loom.sock";

/// 앱 시작 시 tokio task로 실행 (tauri::async_runtime::spawn으로 호출)
pub async fn run(app: AppHandle) {
    if let Err(e) = serve(app).await {
        eprintln!("[pipe_server] fatal: {e}");
    }
}

// ── Windows: Named Pipe accept loop ──────────────────────────────────────────

#[cfg(windows)]
async fn serve(app: AppHandle) -> io::Result<()> {
    use tokio::net::windows::named_pipe::ServerOptions;

    let mut first = true;
    loop {
        let pipe = ServerOptions::new()
            .first_pipe_instance(first)
            .create(PIPE_PATH)?;
        first = false;

        // 클라이언트 연결 대기
        pipe.connect().await?;

        let app = app.clone();
        tokio::spawn(async move {
            handle_connection(pipe, app).await;
        });
    }
}

// ── Linux/WSL: Unix domain socket accept loop ─────────────────────────────────

#[cfg(not(windows))]
async fn serve(app: AppHandle) -> io::Result<()> {
    use tokio::net::UnixListener;

    // 이전 소켓 파일 정리
    let _ = std::fs::remove_file(PIPE_PATH);
    let listener = UnixListener::bind(PIPE_PATH)?;
    eprintln!("[pipe_server] listening on {PIPE_PATH}");

    loop {
        let (stream, _) = listener.accept().await?;
        let app = app.clone();
        tokio::spawn(async move {
            handle_connection(stream, app).await;
        });
    }
}

// ── 공통 연결 핸들러 ───────────────────────────────────────────────────────────

/// cmux 원본 참조: TerminalController.swift:handleClient
/// - 줄 단위(\n) JSON 읽기
/// - JSON-RPC v2 형식: {"id":1, "method":"...", "params":{...}}
/// - 응답: {"id":1, "ok":true, "result":{...}} 또는 {"id":1, "ok":false, "error":{...}}
async fn handle_connection<S>(stream: S, app: AppHandle)
where
    S: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin + Send + 'static,
{
    let (reader, mut writer) = tokio::io::split(stream);
    let mut lines = BufReader::new(reader).lines();

    while let Ok(Some(line)) = lines.next_line().await {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        let response = dispatch(trimmed, &app);

        let mut resp = response.to_string();
        resp.push('\n');
        if writer.write_all(resp.as_bytes()).await.is_err() {
            break;
        }
        if writer.flush().await.is_err() {
            break;
        }
    }
}

/// 요청 dispatch — Phase 4-B에서 실제 메서드 구현으로 교체
fn dispatch(line: &str, _app: &AppHandle) -> serde_json::Value {
    // JSON 파싱
    let req: serde_json::Value = match serde_json::from_str(line) {
        Ok(v) => v,
        Err(_) => {
            return serde_json::json!({
                "ok": false,
                "error": { "code": "parse_error", "message": "Invalid JSON" }
            });
        }
    };

    let id = req.get("id").cloned().unwrap_or(serde_json::Value::Null);
    let method = req.get("method").and_then(|m| m.as_str()).unwrap_or("");

    match method {
        // system.ping — 연결 확인용 (Phase 4-B 이전에도 동작)
        "system.ping" => serde_json::json!({
            "id": id,
            "ok": true,
            "result": { "pong": true }
        }),

        "" => serde_json::json!({
            "id": id,
            "ok": false,
            "error": { "code": "invalid_request", "message": "Missing method" }
        }),

        _ => serde_json::json!({
            "id": id,
            "ok": false,
            "error": { "code": "not_implemented", "message": format!("Phase 4-B: {method}") }
        }),
    }
}
