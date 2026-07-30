import { afterEach, describe, expect, it, vi } from "vitest";
import {
  initializeReactGrab,
  resetReactGrabLoaderForTests,
} from "./react-grab-loader";

describe("initializeReactGrab", () => {
  afterEach(resetReactGrabLoaderForTests);

  it("reuses one promise across repeated story transitions", async () => {
    const importer = vi.fn().mockResolvedValue({});
    const promises = Array.from({ length: 20 }, () =>
      initializeReactGrab(importer),
    );
    await Promise.all(promises);
    expect(importer).toHaveBeenCalledTimes(1);
    expect(new Set(promises).size).toBe(1);
  });

  it("contains import failures so stories can continue rendering", async () => {
    const importer = vi.fn().mockRejectedValue(new Error("unsupported"));
    await expect(initializeReactGrab(importer)).resolves.toBeUndefined();
    await expect(initializeReactGrab(importer)).resolves.toBeUndefined();
    expect(importer).toHaveBeenCalledTimes(1);
  });
});
