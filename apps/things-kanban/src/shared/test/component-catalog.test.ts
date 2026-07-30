import { describe, expect, it } from "vitest";

const storyModules = import.meta.glob<Record<string, unknown>>(
  "../../**/*.stories.tsx",
  { eager: true },
);

describe("Atomic component catalog", () => {
  it("publishes all five Atomic Design layers", () => {
    const titles = Object.values(storyModules)
      .map((module) => module.default)
      .filter(
        (meta): meta is { title: string } =>
          typeof meta === "object" &&
          meta !== null &&
          "title" in meta &&
          typeof (meta as { title?: unknown }).title === "string",
      )
      .map((meta) => meta.title);

    for (const layer of [
      "Atoms",
      "Molecules",
      "Organisms",
      "Templates",
      "Pages",
    ]) {
      expect(
        titles.some((title) => title.startsWith(`${layer}/`)),
        `${layer} needs a representative story`,
      ).toBe(true);
    }
    expect(new Set(titles).size).toBe(titles.length);
  });
});
