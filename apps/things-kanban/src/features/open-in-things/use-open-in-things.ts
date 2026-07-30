import { useMutation } from "@tanstack/react-query";
import { commands } from "@/shared/api/tauri";

export function useOpenInThings() {
  return useMutation({
    mutationFn: ({
      id,
      kind,
    }: {
      id: string;
      kind: "todo" | "project" | "area";
    }) => commands.openInThings(id, kind),
  });
}
