import type { BoardSnapshot, Todo } from "../api/contracts";

export const todoFixture = (
  overrides: Partial<Todo> & Pick<Todo, "id" | "title">,
): Todo => ({
  completionStatus: "open",
  tags: [],
  status: "todo",
  statusConflict: false,
  ...overrides,
});

export const boardFixture: BoardSnapshot = {
  todos: [
    todoFixture({
      id: "one",
      title: "앱 구조 검토",
      project: { id: "project", name: "Things Kanban", active: true },
      area: { id: "work", name: "Work" },
      tags: [{ name: "planning" }],
    }),
    todoFixture({
      id: "two",
      title: "AppleScript 연동",
      status: "inProgress",
      tags: [{ name: "status:in-progress" }],
      area: { id: "work", name: "Work" },
    }),
  ],
  projects: [{ id: "project", name: "Things Kanban", active: true }],
  areas: [{ id: "work", name: "Work" }],
  tags: [{ name: "planning" }, { name: "status:in-progress" }],
  refreshedAt: new Date().toISOString(),
};
