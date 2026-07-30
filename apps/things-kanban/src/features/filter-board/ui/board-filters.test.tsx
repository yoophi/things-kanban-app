import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { boardFixture } from "@/shared/test/board-fixtures";
import { BoardFilters } from "./board-filters";

const query = {
  search: "",
  projectIds: [],
  areaIds: [],
  tagNames: [],
  sort: "dueDate" as const,
  showDone: false,
};

describe("BoardFilters", () => {
  it("reports search changes and clear action", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(
      <BoardFilters
        snapshot={boardFixture}
        query={query}
        onChange={onChange}
        onClear={onClear}
      />,
    );
    await user.type(screen.getByPlaceholderText("할 일 검색"), "script");
    expect(onChange).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "초기화" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
