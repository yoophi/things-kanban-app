import type { BoardQuery, BoardSnapshot, Todo } from "@/shared/api/contracts";

const normalized = (value: string) =>
  value.normalize("NFKC").trim().toLocaleLowerCase();

export function selectBoard(
  snapshot: BoardSnapshot,
  query: BoardQuery,
): BoardSnapshot {
  const search = normalized(query.search);
  const todos = snapshot.todos
    .filter((todo) => query.showDone || todo.status !== "done")
    .filter((todo) => !search || normalized(todo.title).includes(search))
    .filter(
      (todo) =>
        !query.projectIds.length ||
        (todo.project && query.projectIds.includes(todo.project.id)),
    )
    .filter(
      (todo) =>
        !query.areaIds.length ||
        (todo.area && query.areaIds.includes(todo.area.id)),
    )
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
