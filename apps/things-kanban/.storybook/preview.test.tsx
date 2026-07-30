import { beforeEach, describe, expect, it, vi } from "vitest";

const { initializeReactGrab } = vi.hoisted(() => ({
  initializeReactGrab: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock("./react-grab-loader", () => ({ initializeReactGrab }));

describe("Storybook preview", () => {
  beforeEach(() => {
    vi.resetModules();
    initializeReactGrab.mockClear();
  });

  it("keeps preview configuration available when feedback initialization is isolated", async () => {
    const preview = (await import("./preview")).default;

    expect(preview.parameters?.a11y).toEqual({ test: "error" });
    expect(initializeReactGrab).toHaveBeenCalledOnce();
  });
});
