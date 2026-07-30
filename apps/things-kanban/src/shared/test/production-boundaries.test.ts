import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("production entry boundaries", () => {
  it("does not import the Storybook feedback loader", () => {
    const entry = readFileSync(resolve(process.cwd(), "src/main.tsx"), "utf8");
    expect(entry).not.toContain(".storybook/react-grab-loader");
    expect(entry).toContain("import.meta.env.DEV");
  });
});
