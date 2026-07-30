import { describe, expect, it } from "vitest";
import { boardFixture, todoFixture } from "@/shared/test/board-fixtures";
import { boardCounts, selectBoard } from "./select-board";

const query = {
  search: "",
  tagNames: [],
  sort: "dueDate" as const,
};

describe("selectBoard", () => {
  it("combines normalized search and project scope", () => {
    const selected = selectBoard(
      boardFixture,
      {
        ...query,
        search: "구조",
      },
      { kind: "project", id: "project" },
    );
    expect(selected.todos.map((todo) => todo.id)).toEqual(["one"]);
  });

  it("includes direct and child project todos in an area scope", () => {
    expect(
      selectBoard(boardFixture, query, { kind: "area", id: "work" }).todos.map(
        (todo) => todo.id,
      ),
    ).toEqual(["one", "two", "done"]);
  });

  it("sorts titles and derives counts", () => {
    const snapshot = {
      ...boardFixture,
      todos: [
        todoFixture({ id: "b", title: "나" }),
        todoFixture({ id: "a", title: "가", status: "inProgress" }),
      ],
    };
    const selected = selectBoard(snapshot, { ...query, sort: "title" });
    expect(selected.todos.map((todo) => todo.title)).toEqual(["가", "나"]);
    expect(boardCounts(selected.todos)).toEqual({
      todo: 1,
      inProgress: 1,
      done: 0,
    });
  });

  it("handles one thousand cards within the interaction budget", () => {
    const snapshot = {
      ...boardFixture,
      todos: Array.from({ length: 1_000 }, (_, index) =>
        todoFixture({ id: String(index), title: `할 일 ${index}` }),
      ),
    };
    const started = performance.now();
    expect(
      selectBoard(snapshot, { ...query, search: "999" }).todos,
    ).toHaveLength(1);
    expect(performance.now() - started).toBeLessThan(100);
  });
});
