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
      area: { id: "work", name: "Work", active: true },
      tags: [{ name: "planning" }],
    }),
    todoFixture({
      id: "two",
      title: "AppleScript 연동",
      status: "inProgress",
      tags: [{ name: "status:in-progress" }],
      area: { id: "work", name: "Work", active: true },
    }),
    todoFixture({
      id: "done",
      title: "완료된 릴리스 점검",
      completionStatus: "completed",
      completionDate: new Date().toISOString(),
      status: "done",
      project: {
        id: "project",
        name: "Things Kanban",
        active: true,
        area: { id: "work", name: "Work", active: true },
      },
      area: { id: "work", name: "Work", active: true },
    }),
  ],
  projects: [
    {
      id: "project",
      name: "Things Kanban",
      active: true,
      area: { id: "work", name: "Work", active: true },
    },
    { id: "independent", name: "Independent", active: true },
  ],
  areas: [{ id: "work", name: "Work", active: true }],
  tags: [{ name: "planning" }, { name: "status:in-progress" }],
  completionWindow: {
    days: 30,
    since: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    label: "최근 30일",
  },
  refreshedAt: new Date().toISOString(),
};
