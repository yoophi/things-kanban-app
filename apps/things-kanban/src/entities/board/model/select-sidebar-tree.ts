import type { BoardSnapshot } from "@/shared/api/contracts";
import type { SidebarTree } from "./board-scope";

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, "ko");

export function selectSidebarTree(snapshot: BoardSnapshot): SidebarTree {
  const projects = snapshot.projects.filter((project) => project.active);
  return {
    areas: snapshot.areas
      .filter((area) => area.active)
      .map((area) => ({
        kind: "area" as const,
        id: area.id,
        name: area.name,
        children: projects
          .filter((project) => project.area?.id === area.id)
          .map((project) => ({
            kind: "project" as const,
            id: project.id,
            name: project.name,
            parentAreaId: area.id,
          }))
          .sort(byName),
      }))
      .sort(byName),
    independentProjects: projects
      .filter((project) => !project.area)
      .map((project) => ({
        kind: "project" as const,
        id: project.id,
        name: project.name,
      }))
      .sort(byName),
  };
}
