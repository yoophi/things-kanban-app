import type { BoardSnapshot, Todo } from "../api/contracts";
import { boardFixture, todoFixture } from "./board-fixtures";

export { boardFixture, todoFixture };

export const emptyBoardFixture: BoardSnapshot = {
  ...boardFixture,
  todos: [],
};

export const pendingTodoFixture: Todo = todoFixture({
  id: "pending-story-todo",
  title: "동기화 중인 합성 작업",
  isToday: true,
  status: "todo",
});

export const conflictTodoFixture: Todo = todoFixture({
  id: "conflict-story-todo",
  title: "상태를 검토할 합성 작업",
  status: "inProgress",
  statusConflict: true,
  tags: [{ name: "in progress" }, { name: "backlog" }],
});

export const storyBoardFixture: BoardSnapshot = {
  ...boardFixture,
  todos: [...boardFixture.todos, pendingTodoFixture, conflictTodoFixture],
};

export const storyErrorFixture = new Error("합성 Storybook 연결 오류");
