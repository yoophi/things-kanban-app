import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { boardKeys } from "@/entities/board/model";
import { boardFixture } from "@/shared/test/board-fixtures";

const { transitionTodo } = vi.hoisted(() => ({ transitionTodo: vi.fn() }));
vi.mock("@/shared/api/tauri", () => ({
  commands: { transitionTodo },
}));

import { useTransitionTodo } from "./use-transition-todo";

describe("useTransitionTodo", () => {
  afterEach(() => {
    delete (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    vi.clearAllMocks();
  });

  it("rolls back every board snapshot and invalidates after a failed write", async () => {
    (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    transitionTodo.mockRejectedValue(new Error("write failed"));
    const client = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    const key = boardKeys.snapshot();
    client.setQueryData(key, boardFixture);
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useTransitionTodo(), { wrapper });

    act(() => {
      result.current.mutate({
        todo: boardFixture.todos[0],
        targetStatus: "inProgress",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(key)).toEqual(boardFixture);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: boardKeys.all });
  });
});
