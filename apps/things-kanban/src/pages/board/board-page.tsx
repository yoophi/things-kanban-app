import { useMemo, useState } from "react";
import { CircleCheckBig, Columns3 } from "lucide-react";
import { DragDropProvider } from "@dnd-kit/react";
import { useQueryClient } from "@tanstack/react-query";
import { BoardColumn } from "@/entities/board/ui/board-column";
import { BoardSkeleton } from "@/entities/board/ui/board-skeleton";
import { boardKeys } from "@/entities/board/model";
import { boardCounts, selectBoard } from "@/entities/board/model/select-board";
import { useBoardQuery } from "@/entities/board/api/use-board-query";
import { useBoardFilters } from "@/features/filter-board/model/use-board-filters";
import { BoardFilters } from "@/features/filter-board/ui/board-filters";
import { useTransitionTodo } from "@/features/move-todo/model/use-transition-todo";
import { StatusAnnouncer } from "@/features/move-todo/ui/status-announcer";
import { useOpenInThings } from "@/features/open-in-things/use-open-in-things";
import { useFocusRefresh } from "@/features/refresh-board/model/use-focus-refresh";
import { RefreshButton } from "@/features/refresh-board/ui/refresh-button";
import { BoardSidebar, useBoardScope } from "@/features/select-board-scope";
import { scopeLabel } from "@/entities/board/model/select-board";
import type { KanbanStatus, Todo } from "@/shared/api/contracts";

const columnLabels: Record<KanbanStatus, string> = {
  todo: "To Do",
  inProgress: "In Progress",
  done: "Done",
};

export function BoardPage() {
  const filters = useBoardFilters();
  const board = useBoardQuery();
  const navigation = useBoardScope(board.data);
  const transition = useTransitionTodo();
  const open = useOpenInThings();
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState("");
  useFocusRefresh();

  const snapshot = useMemo(
    () =>
      board.data
        ? selectBoard(board.data, filters.query, navigation.scope)
        : undefined,
    [board.data, filters.query, navigation.scope],
  );
  const counts = boardCounts(snapshot?.todos ?? []);

  const move = (todo: Todo, targetStatus: KanbanStatus) => {
    if (todo.status === targetStatus) return;
    setAnnouncement(
      `${todo.title}을 ${columnLabels[targetStatus]}로 이동하는 중입니다.`,
    );
    transition.mutate(
      { todo, targetStatus },
      {
        onSuccess: () =>
          setAnnouncement(
            `${todo.title}이 ${columnLabels[targetStatus]}로 이동했습니다.`,
          ),
        onError: () =>
          setAnnouncement(
            `${todo.title} 이동에 실패해 이전 상태로 복구했습니다.`,
          ),
      },
    );
  };

  if (board.isPending) return <BoardSkeleton />;

  if (board.isError || !snapshot) {
    return (
      <main className="state-page">
        <CircleCheckBig aria-hidden />
        <h1>Things에 연결할 수 없습니다</h1>
        <p>Things 실행 상태와 macOS 자동화 권한을 확인한 뒤 다시 시도하세요.</p>
        <RefreshButton
          pending={board.isFetching}
          onRefresh={() => void board.refetch()}
        />
      </main>
    );
  }

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
        <RefreshButton
          pending={board.isFetching}
          onRefresh={() =>
            void queryClient.invalidateQueries({ queryKey: boardKeys.all })
          }
        />
      </header>
      <BoardFilters
        query={filters.query}
        onChange={filters.patch}
        onClear={filters.clear}
      />
      <div className="workspace">
        <BoardSidebar
          snapshot={board.data}
          scope={navigation.scope}
          collapsed={navigation.collapsed}
          onSelect={navigation.setScope}
          onToggleCollapsed={navigation.toggleCollapsed}
        />
        <section
          className="board-region"
          aria-label={`${scopeLabel(board.data, navigation.scope)} 칸반 보드`}
        >
          <header className="scope-header">
            <p>현재 범위</p>
            <h2>{scopeLabel(board.data, navigation.scope)}</h2>
          </header>
          <DragDropProvider
            onDragEnd={({ operation, canceled }) => {
              if (canceled || !operation.source || !operation.target) return;
              const todoId = String(operation.source.id).replace(/^todo:/, "");
              const targetStatus = String(operation.target.id).replace(
                /^column:/,
                "",
              ) as KanbanStatus;
              const todo = snapshot.todos.find((item) => item.id === todoId);
              if (todo && targetStatus in columnLabels)
                move(todo, targetStatus);
            }}
          >
            <div className="board three">
              {(["todo", "inProgress", "done"] as const).map((status) => (
                <BoardColumn
                  key={status}
                  title={
                    status === "done"
                      ? `${columnLabels.done} · 최근 30일`
                      : columnLabels[status]
                  }
                  status={status}
                  todos={snapshot.todos.filter(
                    (todo) => todo.status === status,
                  )}
              pendingId={
                transition.isPending ? transition.variables?.todo.id : undefined
              }
                  onMove={move}
                  onOpen={(todo) => open.mutate({ id: todo.id, kind: "todo" })}
                />
              ))}
            </div>
          </DragDropProvider>
        </section>
      </div>
      <footer className="status-bar">
        <span>To Do {counts.todo}</span>
        <span>In Progress {counts.inProgress}</span>
        <span>Done {counts.done}</span>
        <time dateTime={snapshot.refreshedAt}>
          {new Date(snapshot.refreshedAt).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          동기화
        </time>
      </footer>
      <StatusAnnouncer message={announcement} />
      <StatusAnnouncer message={navigation.announcement} />
    </main>
  );
}
