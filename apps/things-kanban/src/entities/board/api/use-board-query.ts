import { useQuery } from "@tanstack/react-query";
import { commands } from "@/shared/api/tauri";
import { boardFixture } from "@/shared/test/board-fixtures";
import { boardKeys } from "../model";

export function useBoardQuery(showDone: boolean) {
  return useQuery({
    queryKey: boardKeys.snapshot(showDone),
    queryFn: async () => {
      if (!(window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
        return boardFixture;
      }
      return commands.getBoard({
        search: "",
        projectIds: [],
        areaIds: [],
        tagNames: [],
        sort: "dueDate",
        showDone,
        completedSince: showDone
          ? new Date(Date.now() - 30 * 86_400_000).toISOString()
          : undefined,
      });
    },
  });
}
