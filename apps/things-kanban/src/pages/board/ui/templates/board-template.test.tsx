import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultBoardQuery } from "@/entities/board/model";
import {
  emptyBoardFixture,
  storyBoardFixture,
} from "@/shared/test/storybook-board-fixtures";
import { BoardTemplate, type BoardTemplateProps } from "./board-template";

const props: BoardTemplateProps = {
  snapshot: storyBoardFixture,
  unfilteredSnapshot: storyBoardFixture,
  query: { ...defaultBoardQuery, tagNames: [] },
  scope: { kind: "all" },
  collapsed: false,
  refreshing: false,
  onFilterChange: vi.fn(),
  onFilterClear: vi.fn(),
  onScopeSelect: vi.fn(),
  onToggleSidebar: vi.fn(),
  onRefresh: vi.fn(),
  onMove: vi.fn(),
  onOpen: vi.fn(),
};

describe("BoardTemplate", () => {
  it("renders the four-column populated layout from props", () => {
    render(<BoardTemplate {...props} />);
    for (const name of ["Backlog", "To Do", "In Progress"]) {
      expect(screen.getByRole("heading", { name })).toBeVisible();
    }
    expect(
      screen.getByRole("heading", { name: "Done · 최근 30일" }),
    ).toBeVisible();
  });

  it("renders deterministic empty columns without querying Things", () => {
    const { container } = render(
      <BoardTemplate
        {...props}
        snapshot={emptyBoardFixture}
        unfilteredSnapshot={emptyBoardFixture}
      />,
    );
    expect(container.querySelectorAll(".column-empty")).toHaveLength(4);
  });

  it("renders an accessible error presentation from props", () => {
    render(<BoardTemplate {...props} errorMessage="합성 연결 오류" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("합성 연결 오류");
    expect(
      within(alert).getByRole("button", { name: "새로고침" }),
    ).toBeEnabled();
  });
});
