export type BoardScope =
  | { kind: "all" }
  | { kind: "area"; id: string }
  | { kind: "project"; id: string };

export interface SidebarProjectNode {
  kind: "project";
  id: string;
  name: string;
  parentAreaId?: string;
}

export interface SidebarAreaNode {
  kind: "area";
  id: string;
  name: string;
  children: SidebarProjectNode[];
}

export interface SidebarTree {
  areas: SidebarAreaNode[];
  independentProjects: SidebarProjectNode[];
}
