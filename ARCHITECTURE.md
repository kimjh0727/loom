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
