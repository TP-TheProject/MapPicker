import { describe, expect, it } from "vitest";

import { slugifyMapName } from "@/features/maps/slug";

describe("slugifyMapName", () => {
  it("lowercases a simple name", () => {
    expect(slugifyMapName("Ascent")).toBe("ascent");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugifyMapName("The Range")).toBe("the-range");
  });

  it("strips accents", () => {
    expect(slugifyMapName("Ícebôx")).toBe("icebox");
  });
});
