# Loom — Architecture Design

> Windows terminal multiplexer for AI coding agents
> Stack: Tauri 2.x (Rust) + React + TypeScript

---

## Core Purpose

- Multiple AI agents (Claude Code, Codex, etc.) run in separate terminal panes
- Sub-agents control panes via Named Pipe IPC
- Users monitor all agents' work at a glance from one window

---

## Directory Structure

### Frontend: `src/`

```
src/
├── main.tsx
├── App.tsx                         # Top-level layout: sidebar + workspace area
│
├── components/
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── WorkspaceTab.tsx        # name, process, branch, badge
│   │   ├── WorkspaceTabBadge.tsx
│   │   └── AddWorkspaceButton.tsx
│   │
│   ├── workspace/
│   │   ├── WorkspaceArea.tsx
│   │   ├── SplitPane.tsx           # Recursive split container
│   │   ├── PaneDivider.tsx         # Draggable resize handle
│   │   └── PaneWrapper.tsx         # Focus ring, flash animation
│   │
│   ├── terminal/
│   │   ├── TerminalPane.tsx        # xterm.js host
│   │   └── TerminalToolbar.tsx
│   │
│   ├── browser/
│   │   ├── BrowserPane.tsx
│   │   └── BrowserAddressBar.tsx
│   │
│   ├── notifications/
│   │   ├── NotificationCenter.tsx
│   │   └── NotificationItem.tsx
│   │
│   └── command-palette/
│       ├── CommandPalette.tsx      # Ctrl+Shift+P
│       └── CommandPaletteItem.tsx
│
├── hooks/
│   ├── useTerminal.ts              # xterm.js lifecycle
│   ├── useSplitResize.ts           # Divider drag logic
│   ├── useTauriEvents.ts           # Tauri event subscriptions
│   └── useCommandPalette.ts
│
├── store/
│   ├── index.ts                    # Zustand root
│   ├── workspaceSlice.ts
│   ├── paneSlice.ts
│   ├── notificationSlice.ts
│   └── uiSlice.ts
│
├── ipc/
│   ├── commands.ts                 # invoke() wrappers
│   ├── events.ts                   # Event name constants + payload types
│   └── pipeProtocol.ts             # TypeScript types mirroring Rust PipeMessage
│
├── types/
│   ├── workspace.ts
│   ├── notification.ts
│   └── ipc.ts
│
└── styles/
    ├── global.css
    ├── sidebar.module.css
    ├── terminal.module.css
    └── commandPalette.module.css
```

### Backend: `src-tauri/src/`

```
src-tauri/src/
├── main.rs
├── lib.rs                          # App entry: plugins, commands, IPC server
│
├── terminal/
│   ├── mod.rs
│   ├── manager.rs                  # PTY spawn/kill/read/write
│   ├── pty.rs                      # Windows ConPTY wrapper
│   └── osc.rs                      # OSC 9/99/777 escape parser
│
├── workspace/
│   ├── mod.rs
│   ├── state.rs                    # AppState with RwLock
│   └── store.rs                    # WorkspaceStore CRUD
│
├── ipc/
│   ├── mod.rs
│   ├── pipe_server.rs              # Named Pipe server
│   ├── pipe_handler.rs             # Method dispatch
│   └── auth.rs                     # Optional token auth
│
├── commands/
│   ├── mod.rs
│   ├── workspace_cmds.rs
│   ├── pane_cmds.rs
│   ├── terminal_cmds.rs
│   └── notification_cmds.rs
│
└── notification/
    ├── mod.rs
    └── store.rs                    # Ring buffer, unread counts
```

---

## Component Hierarchy

```
App
├── Sidebar
│   ├── WorkspaceTab (×N)
│   │   └── WorkspaceTabBadge
│   └── AddWorkspaceButton
│
├── WorkspaceArea
│   └── SplitPane (recursive)
│       ├── PaneDivider
│       ├── PaneWrapper
│       │   └── TerminalPane
│       └── PaneWrapper
│           └── BrowserPane
│
├── NotificationCenter (slide-in)
└── CommandPalette (modal overlay)
```

---

## Data Models

### TypeScript

```typescript
type PaneType = "terminal" | "browser";
type SplitDirection = "horizontal" | "vertical";

interface Pane {
  id: string;
  type: PaneType;
  workspaceId: string;
  title: string;
  cwd?: string;
  url?: string;
}

type PaneNode =
  | { kind: "leaf"; paneId: string }
  | { kind: "split"; direction: SplitDirection; ratio: number; first: PaneNode; second: PaneNode };

interface Workspace {
  id: string;
  name: string;
  color?: string;
  gitBranch?: string;
  activeProcess?: string;
  unreadCount: number;
  paneRoot: PaneNode;
  statusEntries: StatusEntry[];
}

interface Notification {
  id: string;
  workspaceId: string;
  paneId?: string;
  title: string;
  body: string;
  source: "osc9" | "osc99" | "osc777" | "pipe";
  isRead: boolean;
  timestamp: number;
}
```

---

## IPC Protocol (Named Pipe)

Pipe name: `\\.\pipe\loom`
Format: newline-delimited JSON

### Request
```json
{ "id": "req-001", "method": "notify", "params": { "title": "Done", "body": "Tests passed", "workspace_id": "ws-abc" } }
```

### Response
```json
{ "id": "req-001", "ok": true, "payload": { "notification_id": "notif-xyz" } }
```

### Supported Methods

| Method | Description |
|---|---|
| `workspace.list` | List all workspaces |
| `workspace.create` | Create workspace, returns id |
| `workspace.select` | Switch active workspace |
| `workspace.current` | Get active workspace |
| `workspace.rename` | Rename workspace |
| `pane.focus` | Focus a specific pane |
| `pane.list` | List panes in workspace |
| `pane.split` | Split pane right/down |
| `pane.write` | Write text to PTY input |
| `notify` | Post a notification |
| `notify.list` | List notifications |
| `notify.clear` | Clear notifications |
| `git.report_branch` | Update sidebar branch display |
| `status.set` | Set sidebar status pill |
| `status.clear` | Clear status pill |

### Env vars injected into child processes
- `LOOM_PIPE_PATH` = `\\.\pipe\loom`
- `LOOM_WORKSPACE_ID` = workspace UUID
- `LOOM_PANE_ID` = pane UUID

---

## Key Interaction Flows

### Agent → Notification Badge
```
Agent writes to \\.\pipe\loom
  → pipe_server.rs reads JSON line
  → pipe_handler.rs pushes to NotificationStore
  → app_handle.emit("notification:new", ...)
  → useTauriEvents hook updates Zustand
  → WorkspaceTab badge re-renders
```

### OSC Escape → Notification
```
PTY outputs \x1b]9;message\x07
  → osc.rs strips sequence, creates Notification
  → app_handle.emit("notification:new", ...)
  → Remaining bytes forwarded as "pty:data" to xterm.js
```

### Drag Divider → Resize Panes
```
PaneDivider mousedown
  → useSplitResize calculates new ratio
  → paneSlice.setSplitRatio updates state
  → SplitPane re-renders with new flex sizes
  → TerminalPane calls fitAddon.fit() + invoke("resize_pane")
```

---

## Implementation Phases

### Phase 1 — Project Skeleton
> 각 단계는 독립적이며, 이전 단계 완료 후 진행

**1-A: 디렉토리 구조 + 파일 스텁 생성**
- `src/components/`, `src/hooks/`, `src/store/`, `src/ipc/`, `src/types/`, `src/styles/` 생성
- 모든 컴포넌트/훅/스토어 파일을 빈 스텁으로 생성
- 결과물: 전체 파일 트리 완성, 빌드 가능 상태

**1-B: 글로벌 CSS + 디자인 토큰**
- `global.css`: 색상 변수, 리셋, 기본 레이아웃
- 다크 테마 기준 (`--bg-primary`, `--accent`, `--text` 등)
- 결과물: 디자인 시스템 기반

**1-C: Zustand 스토어 타입 + 슬라이스 스텁**
- `src/types/` 전체 타입 정의 (Workspace, Pane, PaneNode, Notification)
- 4개 슬라이스 인터페이스 + 빈 구현체
- 결과물: 타입 시스템 완성, 스토어 연결 가능

**1-D: Sidebar 컴포넌트 (정적 데이터)**
- `Sidebar`, `WorkspaceTab`, `WorkspaceTabBadge`, `AddWorkspaceButton`
- 하드코딩 데이터로 UI 완성
- 결과물: 사이드바 렌더링 확인

**1-E: WorkspaceArea + SplitPane 스켈레톤**
- `WorkspaceArea`, `SplitPane`, `PaneWrapper` (터미널 없이 빈 div)
- App.tsx에서 Sidebar + WorkspaceArea 레이아웃 연결
- 결과물: 전체 레이아웃 시각 확인 가능

---

### Phase 2 — Terminal 연동
> 의존성: Phase 1 완료

**2-A: Rust 모듈 구조 + Cargo.toml 의존성**
- `src-tauri/src/terminal/`, `workspace/`, `commands/` 모듈 생성
- Cargo.toml에 `tokio`, `portable-pty`, `uuid`, `serde_json`, `anyhow` 추가
- 결과물: Rust 백엔드 빌드 가능

**2-B: TerminalPane (xterm.js, PTY 없이)**
- `useTerminal` 훅: xterm.js 초기화, FitAddon, 생명주기
- `TerminalPane` 컴포넌트: 마운트/언마운트 처리
- 결과물: 터미널 UI 렌더링 (입력은 로컬 에코만)

**2-C: ConPTY 스폰 (Rust)**
- `terminal/pty.rs`: Windows ConPTY 래퍼
- `terminal/manager.rs`: `spawn_pty(pane_id, cwd, env)` 구현
- `commands/terminal_cmds.rs`: `spawn_terminal` Tauri 커맨드
- 결과물: PTY 프로세스 실행 (출력 아직 프론트엔드 미연결)

**2-D: PTY 출력 → xterm.js**
- Rust: PTY 읽기 스레드 → `app_handle.emit("pty:data", ...)`
- 프론트: `useTauriEvents`에서 `pty:data` 수신 → `terminal.write()`
- 결과물: 터미널 출력 표시

**2-E: xterm.js 입력 → PTY**
- `terminal.onData` → `invoke("write_to_pane", ...)`
- Rust: `write_to_pane` 커맨드 → PTY stdin 쓰기
- 결과물: 완전한 양방향 터미널 동작

**2-F: 리사이즈 처리**
- `fitAddon.fit()` 호출 시 cols/rows → `invoke("resize_pane")`
- Rust: ConPTY 리사이즈 API 호출
- 결과물: 창 크기 변경 시 터미널 자동 조정

---

### Phase 3 — Split Pane 시스템
> 의존성: Phase 2 완료

**3-A: PaneNode 트리 + Zustand paneSlice**
- 재귀 `PaneNode` 타입 구현
- `splitPane`, `closePane`, `setSplitRatio` 액션
- 결과물: 분할 상태 관리

**3-B: SplitPane 재귀 컴포넌트**
- `leaf` / `split` 노드 렌더링
- flex 비율로 크기 분배
- 결과물: 분할 레이아웃 렌더링

**3-C: PaneDivider 드래그 리사이즈**
- `useSplitResize` 훅: mousedown/move/up
- ratio 0.1~0.9 클램핑
- 결과물: 마우스로 분할 크기 조정

**3-D: 분할 키보드 단축키 + Rust 커맨드**
- `pane_cmds.rs`: `split_pane`, `close_pane`, `focus_pane`
- 단축키: Ctrl+D (우분할), Ctrl+Shift+D (아래분할)
- 결과물: 키보드로 분할 생성/닫기

---

### Phase 4 — Named Pipe IPC
> 의존성: Phase 2-C (PTY spawn) 완료

**4-A: Named Pipe 서버 스켈레톤**
- `ipc/pipe_server.rs`: `\\.\pipe\loom` 리슨, tokio accept loop
- JSON 수신/송신 기본 구조
- 결과물: 파이프 연결 수락 가능

**4-B: Request/Response 타입 + 디스패치**
- `PipeRequest`, `PipeResponse`, `PipeError` 타입
- `pipe_handler.rs`: method 기반 디스패치 테이블
- 결과물: 메시지 라우팅 구조

**4-C: workspace.* 메서드 구현**
- `workspace.list`, `workspace.create`, `workspace.select`, `workspace.current`
- Rust 구현 + TypeScript `pipeProtocol.ts` 타입 동기화
- 결과물: 에이전트가 워크스페이스 조회/생성 가능

**4-D: pane.* 메서드 구현**
- `pane.list`, `pane.focus`, `pane.split`, `pane.write`
- 결과물: 에이전트가 패인 제어 가능

**4-E: 환경변수 주입**
- PTY spawn 시 `LOOM_PIPE_PATH`, `LOOM_WORKSPACE_ID`, `LOOM_PANE_ID` 주입
- 결과물: 자식 프로세스(에이전트)가 파이프 자동 인식

---

### Phase 5 — 알림 시스템
> 의존성: Phase 4-A 완료

**5-A: NotificationStore (Rust)**
- `notification/store.rs`: 링 버퍼 (500개), 워크스페이스별 미읽음 카운트
- 결과물: 알림 저장소

**5-B: OSC 이스케이프 파서**
- `terminal/osc.rs`: OSC 9/99/777 감지 + 스트립
- PTY 출력에서 알림 추출 → NotificationStore 저장
- 결과물: 터미널 출력에서 에이전트 알림 자동 감지

**5-C: `notify` 파이프 메서드**
- `pipe_handler`에 `notify` 메서드 추가
- `app_handle.emit("notification:new", ...)` 프론트엔드 전달
- 결과물: 에이전트가 직접 알림 전송 가능

**5-D: 알림 UI (배지 + 센터)**
- `WorkspaceTabBadge`: 미읽음 카운트 표시
- `NotificationCenter`: 슬라이드인 패널
- `NotificationItem`: 개별 알림 행
- 결과물: 알림 전체 UI 완성

---

### Phase 6 — 마무리
> 의존성: Phase 1~5 완료

**6-A: CommandPalette**
- Ctrl+Shift+P 모달
- 워크스페이스 전환, 분할, 알림 지우기 등 액션
- 결과물: 키보드 퍼스트 워크플로우

**6-B: BrowserPane**
- WebView2 기반 브라우저 패널
- 주소창, 네비게이션 버튼
- 결과물: 터미널 옆 브라우저 표시

**6-C: 세션 퍼시스턴스**
- 앱 종료 시 워크스페이스 + 패인 트리 저장
- 재실행 시 복원
- 결과물: 세션 유지

---

---

## cmux 원본 구현 참조

> 원본 소스: `/root/sources/cmux-original/` (macOS Swift 앱)
> 각 Phase 구현 시 이 섹션을 먼저 확인하고 설계 결정에 반영할 것

---

### IPC 프로토콜 (Phase 4 참조)

**원본:** Unix domain socket → **Loom:** Windows Named Pipe (`\\.\pipe\loom`)

**메시지 형식** (`TerminalController.swift:processV2Command`):
```
← 클라이언트: {"id": 1, "method": "surface.send_text", "params": {...}}\n
→ 서버 응답:  {"id": 1, "ok": true, "result": {...}}\n
← 오류 응답:  {"id": 1, "ok": false, "error": {"code": "not_found", "message": "..."}}\n
```

**지원 메서드 전체 목록** (cmux V2 기준, Loom에서 구현할 것 표시):

| 메서드 | cmux 구현 위치 | Loom 구현 여부 |
|---|---|---|
| `system.ping` | `TerminalController.swift:2003` | Phase 4-B |
| `workspace.list` | `TerminalController.swift:v2WorkspaceList` | Phase 4-C |
| `workspace.create` | `TerminalController.swift:v2WorkspaceCreate` | Phase 4-C |
| `workspace.select` | `TerminalController.swift:v2WorkspaceSelect` | Phase 4-C |
| `workspace.current` | `TerminalController.swift:v2WorkspaceCurrent` | Phase 4-C |
| `workspace.rename` | `TerminalController.swift:v2WorkspaceRename` | Phase 4-C |
| `surface.list` | `TerminalController.swift:v2SurfaceList` | Phase 4-D (`pane.list`) |
| `surface.focus` | `TerminalController.swift:v2SurfaceFocus` | Phase 4-D (`pane.focus`) |
| `surface.split` | `TerminalController.swift:v2SurfaceSplit` | Phase 4-D (`pane.split`) |
| `surface.send_text` | `TerminalController.swift:v2SurfaceSendText` | Phase 4-D (`pane.write`) |
| `surface.close` | `TerminalController.swift:v2SurfaceClose` | Phase 4-D |
| `notification.create` | `TerminalController.swift:v2NotificationCreate` | Phase 5-C (`notify`) |
| `notification.list` | `TerminalController.swift:v2NotificationList` | Phase 5-C |
| `notification.clear` | `TerminalController.swift:v2NotificationClear` | Phase 5-C |
| `git.report_branch` | `TerminalController.swift` | Phase 4-C |
| `status.set` | `TerminalController.swift` | Phase 4-C |

**연결 처리 원칙** (`TerminalController.swift:handleClient`):
- 1 연결 = 1 스레드/task (tokio spawn)
- 줄 단위 읽기(`\n` 구분) → parseCommand → writeResponse
- 인증 필요 시 첫 줄을 password로 처리 후 `"ok\n"` / `"error\n"` 응답
- 소켓 타임아웃: read/write 각 8초

**오류 코드 표준** (cmux 동일 코드 사용):
- `"invalid_request"` — JSON 형식 오류, method 누락
- `"method_not_found"` — 알 수 없는 메서드
- `"not_found"` — workspace_id / pane_id 없음
- `"invalid_params"` — 필수 파라미터 누락
- `"internal_error"` — Rust 내부 오류

---

### 알림 시스템 (Phase 5 참조)

**원본:** `TerminalNotificationStore.swift` (1392 lines)

**Notification 구조체** (cmux 동일 필드 사용):
```typescript
// Loom TypeScript (src/types/notification.ts)
interface Notification {
  id: string;          // UUID
  workspaceId: string; // tabId
  paneId?: string;     // surfaceId (optional)
  title: string;
  body: string;        // cmux: subtitle + body 합침
  source: "osc9" | "osc99" | "osc777" | "pipe";
  isRead: boolean;
  timestamp: number;   // Date.getTime()
}
```

**인덱스 구조** (`TerminalNotificationStore.swift:NotificationIndexes`):
- 알림 배열 변경 시마다 인덱스 재계산 (O(n) but 단순)
- `unreadCountByTabId: Record<string, number>` — 워크스페이스별 미읽음 수
- `latestUnreadByTabId` — 워크스페이스별 최신 미읽음 알림

**알림 추가 로직** (`addNotification` 핵심 원칙):
1. 동일 workspace+pane의 기존 알림 덮어쓰기 (중복 방지)
2. 현재 포커스된 패널이면 `isRead: true`로 즉시 처리
3. 새 알림은 배열 **맨 앞**에 삽입 (최신순)

**배지 카운트**:
- 99 초과 시 `"99+"` 문자열로 표시
- 워크스페이스 탭 배지: `unreadCountByTabId[workspaceId]`

**autosave 주기:** 원본 8초마다 자동저장 → Loom도 동일 적용 (Phase 6-C)

---

### OSC 이스케이프 파서 (Phase 5-B 참조)

**원본:** `TerminalController.swift` + `GhosttyTerminalView.swift`

**지원 시퀀스:**
| OSC | 형식 | 용도 |
|---|---|---|
| OSC 7 | `\x1b]7;file://host/path\x07` | CWD 업데이트 (선택 구현) |
| OSC 9 | `\x1b]9;message\x07` | 알림 (ConEmu 호환) |
| OSC 99 | `\x1b]99;title=T;body=B\x07` | 알림 (제목+본문 분리) |
| OSC 777 | `\x1b]777;notify;title;body\x07` | 알림 (VTE 호환) |

**파서 구현 원칙** (`osc.rs` 구현 시):
- PTY raw 바이트 스트림에서 `\x1b]` 감지 → BEL(`\x07`) 또는 ST(`\x1b\\`) 까지 수집
- OSC 시퀀스는 **xterm.js에 전달하지 않고** 스트립 후 나머지만 forwarding
- OSC 9/99/777만 파싱, 나머지는 그냥 pass-through

**Rust 구현 패턴:**
```rust
// osc.rs: PTY 출력을 처리하면서 OSC를 추출
pub fn strip_osc(data: &[u8]) -> (Vec<u8>, Vec<OscNotification>) {
  // \x1b] ... \x07 구간 추출
  // 나머지 바이트는 clean_output에 포함
  // notifications Vec에 파싱 결과 추가
}
```

---

### 세션 퍼시스턴스 (Phase 6-C 참조)

**원본:** `SessionPersistence.swift` (487 lines)

**저장 경로:**
- macOS: `~/Library/Application Support/cmux/session-{bundleId}.json`
- **Loom (Windows):** `%APPDATA%\loom\session.json`

**스냅샷 구조** (Loom 적용 버전):
```typescript
// 원본 AppSessionSnapshot → Loom SessionSnapshot
interface SessionSnapshot {
  version: 1;
  createdAt: number;
  workspaces: WorkspaceSnapshot[];
  activeWorkspaceId: string | null;
}

interface WorkspaceSnapshot {
  id: string;
  name: string;
  gitBranch?: string;
  paneRoot: PaneNode;  // 전체 트리 직렬화 (ratio, id 포함)
}
```

**저장 원칙** (원본 동일):
- 변경 없으면 파일 쓰기 생략 (내용 비교 후 skip)
- atomic write (임시 파일 → rename)
- 자동저장 주기: **8초** (원본 `autosaveInterval = 8.0`)
- JSON 키 정렬 (`sorted keys`) — diff 비교 용이

**스크롤백 저장** (원본 구현, Loom 선택사항):
- 원본: 최대 4000줄 / 400,000자 ANSI-safe 잘라내기
- Loom Phase 6-C에서 구현 여부 결정

---

### Windows/WSL PTY 호환성 주의사항 (전 Phase 공통)

> **이 섹션은 구현 전에 반드시 확인할 것**
> macOS cmux는 Ghostty/libghostty가 PTY를 직접 관리하므로 이런 문제가 없음.
> Loom은 portable-pty를 사용하고 WSL 환경에서 동작하므로 아래 차이를 항상 반영해야 함.

#### xterm.js 키 입력 정규화 (TerminalPane.tsx `onData` 필수)

```typescript
// ❌ 그냥 data를 그대로 쓰면 안 됨
writeToPane(paneId, data)

// ✅ 반드시 정규화 후 전송
const normalized = data === "\x7f" ? "\x08"   // Backspace: DEL→BS
                 : data === "\r"   ? "\n"      // Enter: CR→LF
                 : data;
writeToPane(paneId, normalized)
```

| xterm.js 전송값 | 문제 | 해결 |
|---|---|---|
| Backspace → `\x7f` (DEL) | portable-pty PTY erase 기본값이 `\x08`(BS)이므로 백스페이스 무반응 | `\x08`로 변환 |
| Enter → `\r` (CR) | PTY의 `icrnl`(CR→LF 변환) 미설정 시 bash가 실행 명령으로 인식 못함, 커서만 줄 처음으로 이동 | `\n`으로 변환 |

#### xterm.js Terminal 옵션 필수 설정

```typescript
new Terminal({
  convertEol: true,  // 필수: PTY 출력의 \n을 \r\n으로 변환
                     // portable-pty의 onlcr(NL→CRNL) 미설정 환경 대응
  // ... 나머지 옵션
})
```

#### PTY 환경변수 필수 주입 (manager.rs)

```rust
("TERM", "xterm-256color")       // 없으면 색상/키 시퀀스 오작동
("LOOM_PIPE_PATH", ...)          // IPC 연결용
("LOOM_WORKSPACE_ID", ...)
("LOOM_PANE_ID", ...)
```

---

### 분할 레이아웃 (Phase 3 참조)

**원본:** Bonsplit 프레임워크 사용 (macOS 전용) → **Loom:** 직접 구현

**핵심 설계 결정 (이미 완료, 버그 수정 이력):**
1. split 노드에 고유 `id` 필드 필수
   - 이유: `firstLeafId`로 매칭하면 중첩 분할에서 상위 노드가 먼저 매칭되는 버그 발생
   - 해결: `{ kind: "split", id: crypto.randomUUID(), ... }` — id로만 타겟 노드 식별
2. flex-grow 비율 방식: `flex: ${ratio} 1 0` / `flex: ${1-ratio} 1 0`
   - `flex-basis` 퍼센트(%) 방식은 column direction에서 신뢰 불가
3. 드래그: 절대 좌표 방식 금지, **델타 기반** 필수
   - `startPos + startRatio` 스냅샷 → `delta / containerSize` 더하기
   - 이유: 절대 좌표는 divider 두께, padding 등으로 오프셋 발생
4. ratio 범위: 0.1 ~ 0.9 클램핑 (최소 10% 확보)

---

## Key Dependencies

### Rust (`Cargo.toml`)
```toml
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
portable-pty = "0.8"
anyhow = "1"
```

### npm (`package.json`)
```
zustand
@xterm/xterm        (already installed)
@xterm/addon-fit    (already installed)
@xterm/addon-web-links (already installed)
```
