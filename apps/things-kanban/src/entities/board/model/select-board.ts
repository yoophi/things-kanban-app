import type { BoardQuery, BoardSnapshot, Todo } from "@/shared/api/contracts";
import type { BoardScope } from "./board-scope";

const normalized = (value: string) =>
  value.normalize("NFKC").trim().toLocaleLowerCase();

export function selectBoard(
  snapshot: BoardSnapshot,
  query: BoardQuery,
  scope: BoardScope = { kind: "all" },
): BoardSnapshot {
  const search = normalized(query.search);
  const todos = snapshot.todos
    .filter((todo) => matchesScope(todo, scope))
    .filter((todo) => !search || normalized(todo.title).includes(search))
    .filter(
      (todo) =>
        !query.tagNames.length ||
        query.tagNames.every((name) =>
          todo.tags.some((tag) => tag.name === name),
        ),
    )
    .sort(comparator(query.sort));
  return { ...snapshot, todos };
}

function matchesScope(todo: Todo, scope: BoardScope) {
  if (scope.kind === "all") return true;
  if (scope.kind === "project") return todo.project?.id === scope.id;
  return todo.area?.id === scope.id || todo.project?.area?.id === scope.id;
}

export function normalizeScope(
  snapshot: BoardSnapshot,
  scope: BoardScope,
): BoardScope {
  if (scope.kind === "all") return scope;
  const exists =
    scope.kind === "area"
      ? snapshot.areas.some((area) => area.active && area.id === scope.id)
      : snapshot.projects.some(
          (project) => project.active && project.id === scope.id,
        );
  return exists ? scope : { kind: "all" };
}

export function scopeLabel(snapshot: BoardSnapshot, scope: BoardScope) {
  if (scope.kind === "all") return "전체 보기";
  const item =
    scope.kind === "area"
      ? snapshot.areas.find((area) => area.id === scope.id)
      : snapshot.projects.find((project) => project.id === scope.id);
  return item?.name ?? "전체 보기";
}

function comparator(sort: BoardQuery["sort"]) {
  return (a: Todo, b: Todo) => {
    if (sort === "title") return a.title.localeCompare(b.title, "ko");
    const field = sort === "dueDate" ? "dueDate" : "scheduledDate";
    return (a[field] ?? "9999").localeCompare(b[field] ?? "9999");
  };
}

export function boardCounts(todos: Todo[]) {
  return todos.reduce(
    (counts, todo) => {
      counts[todo.status] += 1;
      return counts;
    },
    { todo: 0, inProgress: 0, done: 0 },
  );
}
