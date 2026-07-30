import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { boardFixture } from "@/shared/test/board-fixtures";
import { BoardSidebar } from "./board-sidebar";

describe("BoardSidebar", () => {
  it("selects area and project scopes with accessible navigation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <BoardSidebar
        snapshot={boardFixture}
        scope={{ kind: "all" }}
        collapsed={false}
        onSelect={onSelect}
        onToggleCollapsed={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Area 및 프로젝트" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Things Kanban" }));
    expect(onSelect).toHaveBeenCalledWith({ kind: "project", id: "project" });
  });

  it("exposes the collapsed state", () => {
    render(
      <BoardSidebar
        snapshot={boardFixture}
        scope={{ kind: "all" }}
        collapsed
        onSelect={vi.fn()}
        onToggleCollapsed={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "사이드바 펼치기" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
