import { useQuery } from "@tanstack/react-query";
import { commands } from "@/shared/api/tauri";
import { boardFixture } from "@/shared/test/board-fixtures";
import { boardKeys } from "../model";

export function useBoardQuery() {
  return useQuery({
    queryKey: boardKeys.snapshot(),
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!(window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
        return boardFixture;
      }
      return commands.getBoard({
        search: "",
        tagNames: [],
        sort: "dueDate",
        completedSince: new Date(Date.now() - 30 * 86_400_000).toISOString(),
      });
    },
  });
}
