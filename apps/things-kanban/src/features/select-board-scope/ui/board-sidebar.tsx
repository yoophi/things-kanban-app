import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import type { BoardScope } from "@/entities/board/model/board-scope";
import { selectSidebarTree } from "@/entities/board/model/select-sidebar-tree";
import type { BoardSnapshot } from "@/shared/api/contracts";

interface Props {
  snapshot: BoardSnapshot;
  scope: BoardScope;
  collapsed: boolean;
  onSelect: (scope: BoardScope) => void;
  onToggleCollapsed: () => void;
}

export function BoardSidebar({
  snapshot,
  scope,
  collapsed,
  onSelect,
  onToggleCollapsed,
}: Props) {
  const tree = selectSidebarTree(snapshot);
  const [closedAreas, setClosedAreas] = useState<Set<string>>(new Set());
  const selected = (kind: BoardScope["kind"], id?: string) =>
    scope.kind === kind &&
    (kind === "all" || ("id" in scope && scope.id === id));

  return (
    <aside className="sidebar" data-collapsed={collapsed}>
      <button
        className="sidebar-toggle"
        type="button"
        aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        aria-expanded={!collapsed}
        onClick={onToggleCollapsed}
      >
        {collapsed ? (
          <PanelLeftOpen aria-hidden />
        ) : (
          <PanelLeftClose aria-hidden />
        )}
      </button>
      {!collapsed && (
        <nav aria-label="Area 및 프로젝트">
          <p className="sidebar-label">NAVIGATION</p>
          <button
            type="button"
            className="scope-item"
            aria-current={selected("all") ? "page" : undefined}
            onClick={() => onSelect({ kind: "all" })}
          >
            전체 보기
          </button>
          <h2>Areas</h2>
          {tree.areas.map((area) => {
            const closed = closedAreas.has(area.id);
            return (
              <section className="scope-group" key={area.id}>
                <div className="area-row">
                  <button
                    type="button"
                    className="disclosure"
                    aria-label={`${area.name} ${closed ? "펼치기" : "접기"}`}
                    aria-expanded={!closed}
                    onClick={() =>
                      setClosedAreas((current) => {
                        const next = new Set(current);
                        if (closed) next.delete(area.id);
                        else next.add(area.id);
                        return next;
                      })
                    }
                  >
                    {closed ? (
                      <ChevronRight aria-hidden />
                    ) : (
                      <ChevronDown aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    className="scope-item area"
                    aria-current={
                      selected("area", area.id) ? "page" : undefined
                    }
                    onClick={() => onSelect({ kind: "area", id: area.id })}
                  >
                    {area.name}
                  </button>
                </div>
                {!closed &&
                  area.children.map((project) => (
                    <button
                      type="button"
                      className="scope-item project"
                      key={project.id}
                      aria-current={
                        selected("project", project.id) ? "page" : undefined
                      }
                      onClick={() =>
                        onSelect({ kind: "project", id: project.id })
                      }
                    >
                      {project.name}
                    </button>
                  ))}
              </section>
            );
          })}
          {!!tree.independentProjects.length && (
            <>
              <h2>Projects</h2>
              {tree.independentProjects.map((project) => (
                <button
                  type="button"
                  className="scope-item"
                  key={project.id}
                  aria-current={
                    selected("project", project.id) ? "page" : undefined
                  }
                  onClick={() => onSelect({ kind: "project", id: project.id })}
                >
                  {project.name}
                </button>
              ))}
            </>
          )}
        </nav>
      )}
    </aside>
  );
}
