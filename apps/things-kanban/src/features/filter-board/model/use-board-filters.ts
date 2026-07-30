import { useState } from "react";
import type { BoardQuery } from "@/shared/api/contracts";

const initial: BoardQuery = {
  search: "",
  projectIds: [],
  areaIds: [],
  tagNames: [],
  sort: "dueDate",
  showDone: false,
};

export function useBoardFilters() {
  const [query, setQuery] = useState<BoardQuery>(initial);
  return {
    query,
    patch: (patch: Partial<BoardQuery>) =>
      setQuery((current) => ({ ...current, ...patch })),
    clear: () => setQuery(initial),
  };
}
