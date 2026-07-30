import { invoke } from "@tauri-apps/api/core";
import type {
  BoardQuery,
  BoardSnapshot,
  TransitionRequest,
  TransitionResult,
} from "./contracts";

export const commands = {
  getBoard: (query: BoardQuery) =>
    invoke<BoardSnapshot>("get_board", { query }),
  transitionTodo: (request: TransitionRequest) =>
    invoke<TransitionResult>("transition_todo", { request }),
  openInThings: (itemId: string, itemKind: "todo" | "project" | "area") =>
    invoke<{ opened: boolean }>("open_in_things", {
      request: { itemId, itemKind },
    }),
};
