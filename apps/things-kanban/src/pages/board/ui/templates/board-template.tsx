import { Columns3 } from "lucide-react";
import { DragDropProvider } from "@dnd-kit/react";
import { BoardColumn } from "@/entities/board/ui/organisms/board-column";
import { boardCounts, scopeLabel } from "@/entities/board/model/select-board";
import type { BoardScope } from "@/entities/board/model/board-scope";
import { BoardFilters } from "@/features/filter-board/ui/board-filters";
import { StatusAnnouncer } from "@/features/move-todo/ui/status-announcer";
import { RefreshButton } from "@/features/refresh-board/ui/refresh-button";
import { BoardSidebar } from "@/features/select-board-scope";
import type {
  BoardQuery,
  BoardSnapshot,
  KanbanStatus,
  Todo,
} from "@/shared/api/contracts";

const columnLabels: Record<KanbanStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  inProgress: "In Progress",
  done: "Done",
};

export interface BoardTemplateProps {
  snapshot: BoardSnapshot;
  unfilteredSnapshot: BoardSnapshot;
  query: BoardQuery;
  scope: BoardScope;
  collapsed: boolean;
  refreshing: boolean;
  errorMessage?: string;
  pendingId?: string;
  announcement?: string;
  navigationAnnouncement?: string;
  onFilterChange: (patch: Partial<BoardQuery>) => void;
  onFilterClear: () => void;
  onScopeSelect: (scope: BoardScope) => void;
  onToggleSidebar: () => void;
  onRefresh: () => void;
  onMove: (todo: Todo, status: KanbanStatus) => void;
  onOpen: (todo: Todo) => void;
}

export function BoardTemplate(props: BoardTemplateProps) {
  if (props.errorMessage) {
    return (
      <main className="state-page" role="alert">
        <h1>Things에 연결할 수 없습니다</h1>
        <p>{props.errorMessage}</p>
        <RefreshButton pending={props.refreshing} onRefresh={props.onRefresh} />
      </main>
    );
  }

  const counts = boardCounts(props.snapshot.todos);
  const currentScopeLabel = scopeLabel(props.unfilteredSnapshot, props.scope);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="app-icon">
            <Columns3 aria-hidden />
          </span>
          <div>
            <p>THINGS WORKSPACE</p>
            <h1>Kanban</h1>
          </div>
        </div>
        <RefreshButton pending={props.refreshing} onRefresh={props.onRefresh} />
      </header>
      <BoardFilters
        query={props.query}
        onChange={props.onFilterChange}
        onClear={props.onFilterClear}
      />
      <div className="workspace">
        <BoardSidebar
          snapshot={props.unfilteredSnapshot}
          scope={props.scope}
          collapsed={props.collapsed}
          onSelect={props.onScopeSelect}
          onToggleCollapsed={props.onToggleSidebar}
        />
        <section
          className="board-region"
          aria-label={`${currentScopeLabel} 칸반 보드`}
        >
          <header className="scope-header">
            <p>현재 범위</p>
            <h2>{currentScopeLabel}</h2>
          </header>
          <DragDropProvider
            onDragEnd={({ operation, canceled }) => {
              if (canceled || !operation.source || !operation.target) return;
              const todoId = String(operation.source.id).replace(/^todo:/, "");
              const targetStatus = String(operation.target.id).replace(
                /^column:/,
                "",
              ) as KanbanStatus;
              const todo = props.snapshot.todos.find(
                (item) => item.id === todoId,
              );
              if (todo && targetStatus in columnLabels) {
                props.onMove(todo, targetStatus);
              }
            }}
          >
            <div className="board four">
              {(["backlog", "todo", "inProgress", "done"] as const).map(
                (status) => (
                  <BoardColumn
                    key={status}
                    title={
                      status === "done"
                        ? `${columnLabels.done} · 최근 30일`
                        : columnLabels[status]
                    }
                    status={status}
                    todos={props.snapshot.todos.filter(
                      (todo) => todo.status === status,
                    )}
                    pendingId={props.pendingId}
                    onMove={props.onMove}
                    onOpen={props.onOpen}
                  />
                ),
              )}
            </div>
          </DragDropProvider>
        </section>
      </div>
      <footer className="status-bar">
        <span>Backlog {counts.backlog}</span>
        <span>To Do {counts.todo}</span>
        <span>In Progress {counts.inProgress}</span>
        <span>Done {counts.done}</span>
        <time dateTime={props.snapshot.refreshedAt}>
          {new Date(props.snapshot.refreshedAt).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          동기화
        </time>
      </footer>
      <StatusAnnouncer message={props.announcement ?? ""} />
      <StatusAnnouncer message={props.navigationAnnouncement ?? ""} />
    </main>
  );
}
