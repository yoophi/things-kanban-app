import { DragDropProvider } from "@dnd-kit/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { pendingTodoFixture } from "@/shared/test/storybook-board-fixtures";
import { TodoCard } from "./todo-card";

describe("TodoCard", () => {
  it("forwards accessible move and open actions through callbacks", () => {
    const onMove = vi.fn();
    const onOpen = vi.fn();
    render(
      <DragDropProvider>
        <TodoCard
          todo={pendingTodoFixture}
          pending={false}
          onMove={onMove}
          onOpen={onOpen}
        />
      </DragDropProvider>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "상태 이동" }), {
      target: { value: "inProgress" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Things에서 열기" }));

    expect(onMove).toHaveBeenCalledWith("inProgress");
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
