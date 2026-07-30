import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("BoardPage stories", () => {
  it("use isolated providers and never import the real Tauri adapter", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/pages/board/board-page.stories.tsx"),
      "utf8",
    );

    expect(source).toContain("StoryProviders");
    expect(source).not.toMatch(/@tauri-apps|shared\/api\/tauri|invoke\(/);
  });
});
