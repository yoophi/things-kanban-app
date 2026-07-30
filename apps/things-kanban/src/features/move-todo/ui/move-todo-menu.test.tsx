import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MoveTodoMenu } from "./move-todo-menu";

describe("MoveTodoMenu", () => {
  it("provides a keyboard-accessible equivalent to dragging", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<MoveTodoMenu status="todo" disabled={false} onMove={onMove} />);
    const select = screen.getByRole("combobox", { name: "상태 이동" });
    await user.selectOptions(select, "inProgress");
    expect(onMove).toHaveBeenCalledWith("inProgress");
  });
});
