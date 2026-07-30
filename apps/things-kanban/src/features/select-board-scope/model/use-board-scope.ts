import { useEffect, useState } from "react";
import type { BoardSnapshot } from "@/shared/api/contracts";
import type { BoardScope } from "@/entities/board/model/board-scope";
import { normalizeScope } from "@/entities/board/model/select-board";

export function useBoardScope(snapshot?: BoardSnapshot) {
  const [scope, setScope] = useState<BoardScope>({ kind: "all" });
  const [collapsed, setCollapsed] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!snapshot) return;
    const normalized = normalizeScope(snapshot, scope);
    if (normalized.kind !== scope.kind) {
      setScope(normalized);
      setAnnouncement("선택한 항목이 없어 전체 보기로 돌아왔습니다.");
    }
  }, [snapshot, scope]);

  return {
    scope,
    setScope,
    collapsed,
    toggleCollapsed: () => setCollapsed((value) => !value),
    announcement,
  };
}
