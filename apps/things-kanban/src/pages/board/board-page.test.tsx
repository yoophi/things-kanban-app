import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BoardPage } from "./board-page";

describe("BoardPage", () => {
  it("renders the independent read-only MVP board", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <BoardPage />
      </QueryClientProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: "Backlog" }),
    ).toBeVisible();
    expect(await screen.findByRole("heading", { name: "To Do" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "In Progress" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Done · 최근 30일" }),
    ).toBeVisible();
    expect(
      screen.getByRole("navigation", { name: "Area 및 프로젝트" }),
    ).toBeVisible();
    expect(screen.getByText("앱 구조 검토")).toBeVisible();
  });
});
