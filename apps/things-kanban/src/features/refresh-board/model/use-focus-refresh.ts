import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { boardKeys } from "@/entities/board/model";

export function useFocusRefresh() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refresh = () => void queryClient.invalidateQueries({ queryKey: boardKeys.all });
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [queryClient]);
}
