export type { BoardQuery, BoardSnapshot } from "@/shared/api/contracts";

export const defaultBoardQuery = {
  search: "",
  projectIds: [],
  areaIds: [],
  tagNames: [],
  sort: "dueDate",
  showDone: false,
  completedSince: undefined,
} as const;

export const boardKeys = {
  all: ["board"] as const,
  snapshot: (showDone: boolean) => ["board", { showDone }] as const,
};
