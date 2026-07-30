export type KanbanStatus = "backlog" | "todo" | "inProgress" | "done";
export type IntegrationErrorCode =
  | "things_not_installed"
  | "automation_denied"
  | "things_unavailable"
  | "item_not_found"
  | "status_conflict"
  | "write_failed"
  | "verification_failed"
  | "invalid_request";

export interface CommandError {
  code: IntegrationErrorCode;
  message: string;
  retryable: boolean;
  action?: string;
  requestId?: string;
}

export interface ItemRef {
  id: string;
  name: string;
}

export interface AreaRef extends ItemRef {
  active: boolean;
}

export interface ProjectRef extends ItemRef {
  area?: AreaRef;
  active: boolean;
}

export interface TagRef {
  id?: string;
  name: string;
}

export interface Todo {
  id: string;
  title: string;
  completionStatus: "open" | "completed" | "canceled";
  isToday: boolean;
  dueDate?: string;
  scheduledDate?: string;
  completionDate?: string;
  project?: ProjectRef;
  area?: AreaRef;
  tags: TagRef[];
  modifiedAt?: string;
  status: KanbanStatus;
  statusConflict: boolean;
}

export interface BoardQuery {
  search: string;
  tagNames: string[];
  sort: "dueDate" | "scheduledDate" | "title";
  completedSince?: string;
}

export interface CompletionWindow {
  days: number;
  since: string;
  label: string;
}

export interface BoardSnapshot {
  todos: Todo[];
  projects: ProjectRef[];
  areas: AreaRef[];
  tags: TagRef[];
  completionWindow: CompletionWindow;
  refreshedAt: string;
}

export interface TransitionRequest {
  todoId: string;
  previousStatus: KanbanStatus;
  targetStatus: KanbanStatus;
  requestId: string;
}

export interface TransitionResult {
  todo: Todo;
  normalizedConflict: boolean;
  verifiedAt: string;
}
