import { describe, expect, it } from "vitest";
import { boardFixture } from "@/shared/test/board-fixtures";
import { selectSidebarTree } from "./select-sidebar-tree";

describe("selectSidebarTree", () => {
  it("nests projects by stable area id and keeps independent projects", () => {
    const tree = selectSidebarTree(boardFixture);
    expect(tree.areas[0].children.map((project) => project.id)).toEqual([
      "project",
    ]);
    expect(tree.independentProjects.map((project) => project.id)).toEqual([
      "independent",
    ]);
  });
});
