export interface PipeRequest {
  id?: string;
  method: string;
  params: Record<string, unknown>;
}

export interface PipeResponse {
  id?: string;
  ok: boolean;
  payload?: unknown;
  error?: { code: string; message: string };
}

export type PipeMethod =
  | "workspace.list"
  | "workspace.create"
  | "workspace.select"
  | "workspace.current"
  | "workspace.rename"
  | "pane.focus"
  | "pane.list"
  | "pane.split"
  | "pane.write"
  | "notify"
  | "notify.list"
  | "notify.clear"
  | "git.report_branch"
  | "status.set"
  | "status.clear";
