import { useMemo, useState } from "react";
import { CircleCheckBig } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { BoardSkeleton } from "@/entities/board/ui/organisms/board-skeleton";
import { boardKeys } from "@/entities/board/model";
import { selectBoard } from "@/entities/board/model/select-board";
import { useBoardQuery } from "@/entities/board/api/use-board-query";
import { useBoardFilters } from "@/features/filter-board/model/use-board-filters";
import { useTransitionTodo } from "@/features/move-todo/model/use-transition-todo";
import { useOpenInThings } from "@/features/open-in-things/use-open-in-things";
import { useFocusRefresh } from "@/features/refresh-board/model/use-focus-refresh";
import { RefreshButton } from "@/features/refresh-board/ui/refresh-button";
import { useBoardScope } from "@/features/select-board-scope";
import { BoardTemplate } from "./ui/templates/board-template";
import type { KanbanStatus, Todo } from "@/shared/api/contracts";

const columnLabels: Record<KanbanStatus, string> = {
  backlog: "Backlog",
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

  if (board.isError || !snapshot || !board.data) {
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
    <BoardTemplate
      snapshot={snapshot}
      unfilteredSnapshot={board.data}
      query={filters.query}
      scope={navigation.scope}
      collapsed={navigation.collapsed}
      refreshing={board.isFetching}
      pendingId={
        transition.isPending ? transition.variables?.todo.id : undefined
      }
      announcement={announcement}
      navigationAnnouncement={navigation.announcement}
      onFilterChange={filters.patch}
      onFilterClear={filters.clear}
      onScopeSelect={navigation.setScope}
      onToggleSidebar={navigation.toggleCollapsed}
      onRefresh={() =>
        void queryClient.invalidateQueries({ queryKey: boardKeys.all })
      }
      onMove={move}
      onOpen={(todo) => open.mutate({ id: todo.id, kind: "todo" })}
    />
  );
}
