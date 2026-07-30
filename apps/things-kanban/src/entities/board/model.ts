export type { BoardQuery, BoardSnapshot } from "@/shared/api/contracts";

export const defaultBoardQuery = {
  search: "",
  tagNames: [],
  sort: "dueDate",
  completedSince: undefined,
} as const;

export const boardKeys = {
  all: ["board"] as const,
  snapshot: () => ["board", "snapshot"] as const,
};
