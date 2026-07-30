import { AlertTriangle, CalendarDays } from "lucide-react";
import { useDraggable } from "@dnd-kit/react";
import type { KanbanStatus, Todo } from "@/shared/api/contracts";
import { MoveTodoMenu } from "@/features/move-todo/ui/move-todo-menu";
import { OpenInThingsButton } from "@/features/open-in-things/open-in-things-button";

export function TodoCard({
  todo,
  pending,
  onMove,
  onOpen,
}: {
  todo: Todo;
  pending: boolean;
  onMove: (status: KanbanStatus) => void;
  onOpen: () => void;
}) {
  const { ref, isDragging } = useDraggable({
    id: `todo:${todo.id}`,
    data: { todoId: todo.id },
    disabled: pending,
  });
  return (
    <article
      ref={ref}
      className="todo-card"
      aria-busy={pending}
      data-dragging={isDragging}
    >
      <div className="card-head">
        <h3>{todo.title || "제목 없는 할 일"}</h3>
        <OpenInThingsButton onOpen={onOpen} disabled={!todo.id} />
      </div>
      {todo.statusConflict && (
        <p className="conflict">
          <AlertTriangle aria-hidden size={14} />
          상태 태그 충돌
        </p>
      )}
      {(todo.project || todo.area) && (
        <p className="context">
          {todo.project?.name ?? todo.area?.name}
        </p>
      )}
      {(todo.dueDate || todo.scheduledDate) && (
        <p className="date">
          <CalendarDays aria-hidden size={14} />
          {new Date(todo.dueDate ?? todo.scheduledDate!).toLocaleDateString("ko-KR")}
        </p>
      )}
      <div className="tags" aria-label="태그">
        {todo.tags
          .filter((tag) => !tag.name.startsWith("status:"))
          .slice(0, 3)
          .map((tag) => (
            <span key={tag.name}>{tag.name}</span>
          ))}
      </div>
      <MoveTodoMenu status={todo.status} disabled={pending} onMove={onMove} />
      {pending && <span className="pending">Things 확인 중…</span>}
    </article>
  );
}
