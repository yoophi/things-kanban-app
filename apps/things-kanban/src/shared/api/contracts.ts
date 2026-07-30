export type KanbanStatus = "todo" | "inProgress" | "done";
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

export interface ProjectRef extends ItemRef {
  area?: ItemRef;
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
  dueDate?: string;
  scheduledDate?: string;
  completionDate?: string;
  project?: ProjectRef;
  area?: ItemRef;
  tags: TagRef[];
  modifiedAt?: string;
  status: KanbanStatus;
  statusConflict: boolean;
}

export interface BoardQuery {
  search: string;
  projectIds: string[];
  areaIds: string[];
  tagNames: string[];
  sort: "dueDate" | "scheduledDate" | "title";
  showDone: boolean;
  completedSince?: string;
}

export interface BoardSnapshot {
  todos: Todo[];
  projects: ProjectRef[];
  areas: ItemRef[];
  tags: TagRef[];
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
