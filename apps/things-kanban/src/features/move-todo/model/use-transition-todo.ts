import { useMutation, useQueryClient } from "@tanstack/react-query";
import { boardKeys } from "@/entities/board/model";
import { commands } from "@/shared/api/tauri";
import type {
  BoardSnapshot,
  KanbanStatus,
  Todo,
} from "@/shared/api/contracts";

export function useTransitionTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      todo,
      targetStatus,
    }: {
      todo: Todo;
      targetStatus: KanbanStatus;
    }) => {
      if (!(window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
        return { todo: { ...todo, status: targetStatus } };
      }
      return commands.transitionTodo({
        todoId: todo.id,
        previousStatus: todo.status,
        targetStatus,
        requestId: crypto.randomUUID(),
      });
    },
    onMutate: async ({ todo, targetStatus }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.all });
      const entries = queryClient.getQueriesData<BoardSnapshot>({
        queryKey: boardKeys.all,
      });
      entries.forEach(([key, snapshot]) => {
        if (!snapshot) return;
        queryClient.setQueryData<BoardSnapshot>(key, {
          ...snapshot,
          todos: snapshot.todos.map((item) =>
            item.id === todo.id ? { ...item, status: targetStatus } : item,
          ),
        });
      });
      return { entries };
    },
    onSuccess: ({ todo }) => {
      queryClient.setQueriesData<BoardSnapshot>(
        { queryKey: boardKeys.all },
        (snapshot) =>
          snapshot && {
            ...snapshot,
            todos: snapshot.todos.map((item) =>
              item.id === todo.id ? todo : item,
            ),
          },
      );
    },
    onError: (_error, _variables, context) => {
      context?.entries.forEach(([key, snapshot]) =>
        queryClient.setQueryData(key, snapshot),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: boardKeys.all }),
  });
}
