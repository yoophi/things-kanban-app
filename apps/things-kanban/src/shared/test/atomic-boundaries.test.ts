import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

describe("Atomic Design boundaries", () => {
  it("keeps BoardTemplate independent from page hooks and Tauri commands", () => {
    const template = source("pages/board/ui/templates/board-template.tsx");
    expect(template).not.toMatch(/useBoardQuery|useQuery|@tauri-apps|commands/);
  });

  it("keeps the TodoCard molecule independent from feature implementations", () => {
    const todoCard = source("entities/todo/ui/molecules/todo-card.tsx");
    expect(todoCard).not.toContain("@/features/");
  });

  it("keeps shared atoms independent from upper Atomic layers", () => {
    for (const file of [
      "shared/ui/atoms/icon-button.tsx",
      "shared/ui/atoms/count-badge.tsx",
    ]) {
      expect(source(file)).not.toMatch(
        /@\/(?:features|entities|pages)\/|\/(?:molecules|organisms|templates)\//,
      );
    }
  });
});
