import type { KanbanStatus, Todo } from "@/shared/api/contracts";
import { TodoCard } from "@/entities/todo/ui/todo-card";
import { useDroppable } from "@dnd-kit/react";

export function BoardColumn({
  title,
  status,
  todos,
  pendingId,
  onMove,
  onOpen,
}: {
  title: string;
  status: KanbanStatus;
  todos: Todo[];
  pendingId?: string;
  onMove: (todo: Todo, status: KanbanStatus) => void;
  onOpen: (todo: Todo) => void;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: `column:${status}`,
    data: { status },
  });
  return (
    <section
      ref={ref}
      className="column"
      aria-labelledby={`column-${status}`}
      data-drop-target={isDropTarget}
    >
      <header>
        <h2 id={`column-${status}`}>{title}</h2>
        <span aria-label={`${todos.length}개`}>{todos.length}</span>
      </header>
      <div className="card-list">
        {todos.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            pending={todo.id === pendingId}
            onMove={(target) => onMove(todo, target)}
            onOpen={() => onOpen(todo)}
          />
        ))}
        {!todos.length && <p className="column-empty">이 열에는 할 일이 없습니다.</p>}
      </div>
    </section>
  );
}
